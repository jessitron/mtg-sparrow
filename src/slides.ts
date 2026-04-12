import { initTelemetry, startSpan, startChildSpan, endSpan, emitLog, flushSpans, getTraceId, getSessionId } from './telemetry/telemetry';
import { storageSetItem, setStorageRecordEvent } from './storage';
import { createCardShell, fillCard, revealName } from './ui/render';
import {
  createSession,
  currentCard,
  advanceCard,
  SessionState,
  Slide,
  GuildSubgroup,
  REVEAL_DELAY_MS,
  ADVANCE_DELAY_MS,
} from './session';
import { colorEmojiMap } from './data/combos';
import { LEVELS } from './levels';
import { isSubgroupUnlocked, markSubgroupUnlocked, markSubgroupCompleted, getUnlockedSubgroups } from './progression';
import { getAssessment } from './self-assessment-store';
import { Familiarity } from './sparrow-deck';
import { Span } from '@opentelemetry/api';
import { wireMenu } from './ui/menu';
import { wireSoundToggle } from './ui/sound-toggle';
import { isSoundEnabled, playComboAudio, unlockAudio } from './audio';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';
import { initDebugMode, isDebugMode } from './debug';

const MANA_COLOR_MAP: Record<string, string> = {
  W: 'var(--mana-W)',
  U: 'var(--mana-U)',
  B: 'var(--mana-B)',
  R: 'var(--mana-R)',
  G: 'var(--mana-G)',
};

function buildFullDeckGradient(deck: Slide[]): string {
  if (deck.length <= 1) {
    const letter = deck[0]?.colors?.[0] ?? 'U';
    return MANA_COLOR_MAP[letter] ?? MANA_COLOR_MAP['U'];
  }
  const bandWidth = 100 / deck.length;
  const stops: string[] = [];
  for (let i = 0; i < deck.length; i++) {
    const letter = deck[i]?.colors?.[0] ?? 'U';
    const color = MANA_COLOR_MAP[letter] ?? MANA_COLOR_MAP['U'];
    // Place each color at the midpoint of its band for smooth blending
    const midpoint = (i + 0.5) * bandWidth;
    stops.push(`${color} ${midpoint.toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

let app: HTMLElement | null = null;
let session: SessionState | null = null;
let cardEl: HTMLElement | null = null;
let sessionSpan: Span | null = null;
let cardSpan: Span | null = null;
let cardShowTime = 0;
let revealTimer: ReturnType<typeof setTimeout> | null = null;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let startInPausedState = false;
let dialogOpenCount = 0;
let pausedByDialog = false;
let nameRevealed = false;
let currentTraceUrl: string | null = null;
let doneZoneEl: HTMLElement | null = null;
let currentCardName = '';
let namesEverHidden = false;

function playRevealAudio(): void {
  if (!session) return;
  const combo = currentCard(session);
  const enabled = isSoundEnabled();
  if (cardSpan) {
    cardSpan.setAttribute('sound.enabled', enabled);
  }
  playComboAudio(combo.id).then((result) => {
    if (cardSpan) {
      cardSpan.setAttribute('sound.play_result', result);
    }
  });
}

function clearTimers(): void {
  if (revealTimer !== null) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
  if (advanceTimer !== null) {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }
}

function endCardSpan(early: boolean): void {
  if (cardSpan && session) {
    const dwellTime = Date.now() - cardShowTime;
    cardSpan.setAttribute('card.dwell_time_ms', dwellTime);
    cardSpan.setAttribute('card.advanced_early', early);
    endSpan(cardSpan);
    cardSpan = null;
  }
}

function endSessionSpan(actualCount: number): void {
  if (sessionSpan && session) {
    const duration = Date.now() - session.startTime;
    sessionSpan.setAttribute('session.card_count', actualCount);
    sessionSpan.setAttribute('session.completed', session.completed);
    sessionSpan.setAttribute('session.duration_ms', duration);
    endSpan(sessionSpan);
    sessionSpan = null;
  }
}

async function navigateToAssessment(actualCount: number): Promise<void> {
  if (!session) return;

  // Record progression while session span is still open
  if (session.completed) {
    const currentIndex = LEVELS.findIndex(l => l.id === session.subgroup);
    const nextSubgroup = currentIndex >= 0 && currentIndex < LEVELS.length - 1
      ? LEVELS[currentIndex + 1].id
      : null;
    if (nextSubgroup !== null) {
      const justUnlocked = markSubgroupUnlocked(nextSubgroup);
      if (justUnlocked) {
        emitLog('progression.subgroup_unlocked', sessionSpan ?? undefined, {
          'progression.subgroup': nextSubgroup,
        });
      }
    }
  }
  markSubgroupCompleted(session.subgroup);

  // End session span (no self_assessment — that belongs to assessment page)
  endSessionSpan(actualCount);

  // Await flush before navigating so spans are exported before page unload
  await flushSpans();

  // Navigate to assessment page
  window.location.href = `assessment?subgroup=${session.subgroup}&cards=${actualCount}&completed=${session.completed}`;
}

function stopSession(): void {
  if (!session || session.completed) return;

  clearTimers();

  // End the in-flight card span
  if (cardSpan) {
    const dwellTime = Date.now() - cardShowTime;
    cardSpan.setAttribute('card.dwell_time_ms', dwellTime);
    cardSpan.setAttribute('card.advanced_early', false);
    endSpan(cardSpan);
    cardSpan = null;
  }

  const cardsShown = session.currentIndex + 1;
  session.completed = false;

  navigateToAssessment(cardsShown);
}

function buildSessionUI(): void {
  if (!app || !session) return;

  // Card container (cards are created dynamically in showCard)
  const cardContainer = document.createElement('div');
  cardContainer.classList.add('card-container');
  app.appendChild(cardContainer);

  // Footer below the card — names row + controls row.
  const doneZone = document.createElement('div');
  doneZone.classList.add('done-zone');
  doneZoneEl = doneZone;

  // Row 1: Names reference row
  const namesRow = document.createElement('div');
  namesRow.classList.add('footer-names');

  const comboNames = comboPoolMap[session.subgroup].map(c => c.name).join(' \u00B7 ');
  const namesText = document.createElement('span');
  namesText.classList.add('footer-names-text');
  namesText.textContent = comboNames;

  const namesToggle = document.createElement('button');
  namesToggle.classList.add('footer-names-minimize');

  const eyeOpenSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeClosedSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function setEyeIcon(hidden: boolean) {
    namesToggle.innerHTML = hidden ? eyeClosedSvg : eyeOpenSvg;
    namesToggle.title = hidden ? 'Show names' : 'Hide names';
  }

  // Load persisted preference for this subgroup
  // Use visibility:hidden (not display:none) so the names row keeps its height and the footer doesn't shift.
  const namesStorageKey = `namesHidden_${session.subgroup}`;
  let namesHidden = localStorage.getItem(namesStorageKey) === 'true';
  namesText.style.visibility = namesHidden ? 'hidden' : '';
  setEyeIcon(namesHidden);

  namesToggle.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    namesHidden = !namesHidden;
    storageSetItem(namesStorageKey, namesHidden ? 'true' : 'false');
    namesText.style.visibility = namesHidden ? 'hidden' : '';
    setEyeIcon(namesHidden);
    emitLog(namesHidden ? 'session.names_hide' : 'session.names_show', sessionSpan ?? undefined, {
      'session.card_index': session ? session.currentIndex : 0,
    });
    if (namesHidden) {
      namesEverHidden = true;
      if (sessionSpan) {
        sessionSpan.setAttribute('session.names_hidden', true);
      }
    }
  });

  namesRow.appendChild(namesText);
  namesRow.appendChild(namesToggle);
  doneZone.appendChild(namesRow);

  // Row 2: Controls — right-aligned: counter, pause, exit
  const controlsRow = document.createElement('div');
  controlsRow.classList.add('footer-controls');

  const progressTrack = document.createElement('div');
  progressTrack.classList.add('progress-bar-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-valuenow', '1');
  progressTrack.setAttribute('aria-valuemin', '1');
  progressTrack.setAttribute('aria-valuemax', String(session.cardCount));
  progressTrack.setAttribute('aria-label', `Card 1 of ${session.cardCount}`);
  progressTrack.style.background = buildFullDeckGradient(session.deck);
  const progressCover = document.createElement('div');
  progressCover.classList.add('progress-bar-cover');
  progressCover.style.width = '100%';
  progressTrack.appendChild(progressCover);
  controlsRow.appendChild(progressTrack);

  // Pause button — circular, styled like .gas-btn
  const pauseBtn = document.createElement('button');
  pauseBtn.id = 'pause-btn';
  pauseBtn.classList.add('footer-pause-btn');
  pauseBtn.setAttribute('aria-label', 'Pause');
  pauseBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <rect x="3" y="2" width="4" height="14" rx="1"/>
    <rect x="11" y="2" width="4" height="14" rx="1"/>
  </svg>`;

  const pauseSvgPause = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <rect x="3" y="2" width="4" height="14" rx="1"/>
    <rect x="11" y="2" width="4" height="14" rx="1"/>
  </svg>`;
  const pauseSvgPlay = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
    <polygon points="4,2 16,9 4,16"/>
  </svg>`;

  pauseBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    paused = !paused;
    pauseBtn.innerHTML = paused ? pauseSvgPlay : pauseSvgPause;
    pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    pauseBtn.classList.toggle('footer-pause-btn--paused', paused);
    emitLog(paused ? 'session.pause' : 'session.resume', sessionSpan ?? undefined, {
      'session.card_index': session ? session.currentIndex : 0,
    });
    if (paused) {
      clearTimers();
    } else {
      // Resume: restart reveal if name not shown yet
      if (!nameRevealed) {
        revealTimer = setTimeout(() => {
          revealTimer = null;
          nameRevealed = true;
          if (cardEl) revealName(cardEl);
          playRevealAudio();
          advanceTimer = setTimeout(() => {
            advanceTimer = null;
            goToNextCard(false);
          }, ADVANCE_DELAY_MS);
        }, REVEAL_DELAY_MS);
      } else if (advanceTimer === null) {
        advanceTimer = setTimeout(() => {
          advanceTimer = null;
          goToNextCard(false);
        }, ADVANCE_DELAY_MS);
      }
    }
  });
  controlsRow.appendChild(pauseBtn);

  // Exit button (replaces "Done for now")
  const doneBtn = document.createElement('button');
  doneBtn.classList.add('done-button');
  doneBtn.textContent = 'Exit';
  doneBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    stopSession();
  });
  controlsRow.appendChild(doneBtn);

  doneZone.appendChild(controlsRow);
  app.appendChild(doneZone);
}

function showCard(): void {
  if (!app || !session || !doneZoneEl) return;

  const cardContainer = app.querySelector('.card-container');
  if (!cardContainer) return;

  // Expand to full-screen quiz mode
  app.classList.add('app--quiz-active');

  const combo = currentCard(session);
  cardShowTime = Date.now();

  // Start card span as child of session span
  const cardAttrs: Record<string, string | number | boolean> = {
    'card.combo_id': combo.id,
    'card.combo_name': combo.name,
    'card.colors': combo.colors.join(','),
    'card.combo_emoji': combo.colors.map(c => colorEmojiMap[c]).join(''),
    'card.tier': combo.tier,
    'card.number': session.currentIndex + 1,
    'app.version': APP_VERSION,
  };
  if (combo.selectedCard) {
    cardAttrs['slide.card_name'] = combo.selectedCard.name;
    const uuidMatch = combo.selectedCard.imageUrl.match(/\/([0-9a-f-]{36})\.jpg/);
    if (uuidMatch) {
      cardAttrs['slide.card_scryfall_url'] = `https://scryfall.com/card/${uuidMatch[1]}`;
    }
  }
  currentCardName = combo.selectedCard?.name ?? combo.name;
  cardSpan = sessionSpan
    ? startChildSpan('card', sessionSpan, cardAttrs)
    : startSpan('card', cardAttrs);

  paused = false;
  pausedByDialog = false;
  nameRevealed = false;

  // Clean up any stale cards from interrupted crossfades
  const staleCards = cardContainer.querySelectorAll('.card');
  staleCards.forEach(c => {
    if (c !== cardEl) c.remove();
  });

  // Create new card off-screen (opacity 0)
  const oldCard = cardEl;
  const newCard = createCardShell();
  fillCard(newCard, combo);
  cardEl = newCard;

  const isFirstCard = !oldCard;

  if (isFirstCard) {
    // First card: wait for image to load before revealing
    newCard.style.opacity = '0';
    cardContainer.appendChild(newCard);

    const firstImg = newCard.querySelector('.mtg-card-img') as HTMLImageElement | null;
    const revealFirst = () => {
      newCard.style.transition = 'opacity 300ms ease';
      void newCard.offsetWidth;
      newCard.style.opacity = '1';
    };

    if (firstImg && !firstImg.complete) {
      let resolved = false;
      const onReady = () => {
        if (resolved) return;
        resolved = true;
        revealFirst();
      };
      firstImg.addEventListener('load', onReady, { once: true });
      firstImg.addEventListener('error', onReady, { once: true });
      setTimeout(onReady, 2000);
    } else {
      revealFirst();
    }
  } else {
    // Subsequent cards: crossfade
    newCard.style.opacity = '0';
    cardContainer.appendChild(newCard);

    // Fade out old card immediately
    oldCard.style.transition = 'opacity 300ms ease';
    oldCard.style.opacity = '0';
    setTimeout(() => {
      if (oldCard.parentNode) oldCard.remove();
    }, 350);

    // Wait for new card's image to load before fading in
    const img = newCard.querySelector('.mtg-card-img') as HTMLImageElement | null;
    const fadeInNew = () => {
      newCard.style.transition = 'opacity 300ms ease';
      // Force a reflow so the browser registers opacity:0 before transitioning to 1
      void newCard.offsetWidth;
      newCard.style.opacity = '1';
    };

    if (img && !img.complete) {
      let resolved = false;
      const onReady = () => {
        if (resolved) return;
        resolved = true;
        fadeInNew();
      };
      img.addEventListener('load', onReady, { once: true });
      img.addEventListener('error', onReady, { once: true });
      // Fallback: don't wait more than 2s
      setTimeout(onReady, 2000);
    } else {
      fadeInNew();
    }
  }

  // Update progress bar — smoothly shrink the cover to reveal more gradient
  const progressTrack = doneZoneEl.querySelector('.progress-bar-track') as HTMLElement | null;
  const progressCover = doneZoneEl.querySelector('.progress-bar-cover') as HTMLElement | null;
  if (progressTrack && progressCover) {
    const current = session.currentIndex + 1;
    const remainingPct = (session.cardCount - current) / session.cardCount * 100;
    const cardDuration = REVEAL_DELAY_MS + ADVANCE_DELAY_MS;
    progressCover.style.transition = `width ${cardDuration}ms linear`;
    progressCover.style.width = remainingPct + '%';
    progressTrack.setAttribute('aria-valuenow', String(current));
    progressTrack.setAttribute('aria-label', `Card ${current} of ${session.cardCount}`);
  }

  // Show "Done for now" button from card 2 onward
  const doneBtn = doneZoneEl.querySelector('.done-button');
  if (doneBtn && session.currentIndex >= 1) {
    if (!doneBtn.classList.contains('button-visible') && !doneBtn.classList.contains('button-steady')) {
      // First reveal — animate in, then lock to steady after animation completes
      doneBtn.classList.add('button-visible');
      doneBtn.addEventListener('animationend', () => {
        doneBtn.classList.remove('button-visible');
        doneBtn.classList.add('button-steady');
      }, { once: true });
    }
    // If already button-visible or button-steady, leave it alone — no class toggling
  }

  // Preload the next card's image so it's cached before we transition
  const nextIndex = session.currentIndex + 1;
  if (nextIndex < session.cardCount) {
    const nextSlide = session.deck[nextIndex];
    if (nextSlide.selectedCard) {
      const preload = new Image();
      preload.src = nextSlide.selectedCard.imageUrl;
    }
  }

  // Auto-reveal: after REVEAL_DELAY_MS, fade in the name
  revealTimer = setTimeout(() => {
    revealTimer = null;
    nameRevealed = true;
    if (cardEl) revealName(cardEl);
    playRevealAudio();

    // Auto-advance: after ADVANCE_DELAY_MS, go to next card
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      goToNextCard(false);
    }, ADVANCE_DELAY_MS);
  }, REVEAL_DELAY_MS);
}

function goToNextCard(early: boolean): void {
  clearTimers();
  endCardSpan(early);

  if (!session) return;

  const hasMore = advanceCard(session);
  if (hasMore) {
    showCard();
  } else {
    navigateToAssessment(session.cardCount);
  }
}

function handleAdvance(): void {
  if (!session || session.completed) return;
  if (paused) return;

  // Record a log for every user tap (sent immediately, unlike span events)
  emitLog('user.tap', cardSpan ?? undefined, {
    'tap.time_since_card_ms': Date.now() - cardShowTime,
    'tap.name_revealed': revealTimer === null,
  });

  if (revealTimer !== null) {
    // Name not yet revealed — reveal it now, then auto-advance after ADVANCE_DELAY_MS
    clearTimeout(revealTimer);
    revealTimer = null;

    if (cardSpan) {
      const dwellTime = Date.now() - cardShowTime;
      cardSpan.setAttribute('card.dwell_time_ms', dwellTime);
      cardSpan.setAttribute('card.advanced_early', true);
    }

    nameRevealed = true;
    if (cardEl) revealName(cardEl);
    playRevealAudio();

    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      goToNextCard(true);
    }, ADVANCE_DELAY_MS);
  } else if (advanceTimer !== null) {
    // Name already revealed, advance timer pending — skip ahead immediately
    goToNextCard(true);
  }
}

function assessmentToFamiliarity(assessment: string | undefined): Familiarity {
  return (assessment === 'getting_there' || assessment === 'nailing_it') ? 'familiar' : 'new';
}

function startSession(subgroup: GuildSubgroup, startedFrom: string, welcomeDwellMs: number, introDwellMs?: number): void {
  const priorAssessment = getAssessment(subgroup);
  const familiarity = assessmentToFamiliarity(priorAssessment);
  session = createSession(subgroup, familiarity);

  // Start session root span
  const tierLabel =
    subgroup === 'allied' ? 'guild_allied' :
    subgroup === 'enemy'  ? 'guild_enemy'  :
    subgroup === 'wedges' ? 'wedge'        :
    'shard';
  const sessionAttrs: Record<string, string | number | boolean> = {
    'session.tier': tierLabel,
    'session.subgroup_size': 5,
    'session.card_count': session.cardCount,
    'session.started_from': startedFrom,
    'session.welcome_dwell_ms': welcomeDwellMs,
    'session.enemy_unlocked': isSubgroupUnlocked('enemy'),
    'session.has_level_intro': introDwellMs !== undefined,
    'session.familiarity': familiarity,
    'app.version': APP_VERSION,
  };
  if (priorAssessment) {
    sessionAttrs['session.prior_assessment'] = priorAssessment;
  }
  if (introDwellMs !== undefined) {
    sessionAttrs['session.intro_dwell_ms'] = introDwellMs;
  }
  sessionSpan = startSpan('session', sessionAttrs);

  // Layout metrics for viewport/scroll analysis
  if (sessionSpan) {
    const pageHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    sessionSpan.setAttribute('session.page_height', pageHeight);
    sessionSpan.setAttribute('session.viewport_height', viewportHeight);
    sessionSpan.setAttribute('session.has_scrollbar', pageHeight > viewportHeight);
  }

  // Store trace URL so the settings panel can display it
  if (sessionSpan) {
    const traceId = getTraceId(sessionSpan);
    currentTraceUrl = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
    const traceContainer = document.getElementById('settings-trace-container');
    const traceLink = document.getElementById('settings-trace-link') as HTMLAnchorElement | null;
    if (traceLink) {
      traceLink.href = currentTraceUrl;
    }
    if (traceContainer && isDebugMode()) {
      traceContainer.hidden = false;
    }
  }

  buildSessionUI();
  showCard();

  if (startInPausedState) {
    const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
    if (pauseBtn) pauseBtn.click();
  }

  // After layout settles, capture slide height percentage of viewport
  requestAnimationFrame(() => {
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer && sessionSpan) {
      const cardRect = cardContainer.getBoundingClientRect();
      const vp = window.innerHeight;
      const pct = Math.round(cardRect.height / vp * 100);
      sessionSpan.setAttribute('session.slide_height_pct', pct);
    }
  });
}

function showLevelIntro(subgroup: GuildSubgroup, from: string, welcomeDwellMs: number): void {
  if (!app) return;

  const introShowTime = Date.now();
  const levelIndex = LEVELS.findIndex(l => l.id === subgroup);
  const levelNum = levelIndex >= 0 ? levelIndex + 1 : 0;
  const level = LEVELS[levelIndex];
  const subtitle = level?.title ?? subgroup;
  const comboNames = (level?.pool ?? []).map(c => c.name).join(' · ');
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const ctaText = isTouchDevice ? 'tap to begin' : 'tap anywhere · or press space';

  // Build DOM
  const intro = document.createElement('div');
  intro.className = 'level-intro';

  const body = document.createElement('div');
  body.className = 'level-intro-body';

  const levelNumber = document.createElement('p');
  levelNumber.className = 'level-intro-number';
  levelNumber.textContent = `LEVEL ${levelNum}`;

  const rule = document.createElement('hr');
  rule.className = 'level-intro-rule';
  rule.setAttribute('aria-hidden', 'true');

  const subtitleEl = document.createElement('p');
  subtitleEl.className = 'level-intro-subtitle';
  subtitleEl.textContent = subtitle;

  const namesEl = document.createElement('p');
  namesEl.className = 'level-intro-names';
  namesEl.textContent = comboNames;

  body.appendChild(levelNumber);
  body.appendChild(rule);
  body.appendChild(subtitleEl);
  body.appendChild(namesEl);

  const cta = document.createElement('p');
  cta.className = 'level-intro-cta';
  cta.textContent = ctaText;

  intro.appendChild(body);
  intro.appendChild(cta);

  app.innerHTML = '';
  app.appendChild(intro);

  let dismissed = false;

  function dismiss(): void {
    if (dismissed) return;
    dismissed = true;

    // Unlock audio on iOS Safari — must happen synchronously in the user gesture
    unlockAudio();

    // Remove temporary listeners
    app!.removeEventListener('click', onIntroClick);
    document.removeEventListener('keydown', onIntroKeydown);

    const introDwellMs = Date.now() - introShowTime;

    // Fade out then start session
    intro.classList.add('level-intro--dismissing');
    setTimeout(() => {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      startSession(subgroup, from, welcomeDwellMs, introDwellMs);
    }, 150);
  }

  function onIntroClick(): void {
    dismiss();
  }

  function onIntroKeydown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      e.preventDefault();
      dismiss();
    }
  }

  app.addEventListener('click', onIntroClick);
  document.addEventListener('keydown', onIntroKeydown);
}

// When restored from bfcache (browser back button), force a full reload
// so DOMContentLoaded fires and the slideshow re-initializes cleanly.
window.addEventListener('pageshow', (event: PageTransitionEvent) => {
  if (event.persisted) {
    window.location.reload();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION, 'slides', 'multi_page');
  // Do NOT call sendStartupSpan — welcome page only
  initDebugMode(); // reloads if ?debug param present; otherwise no-op

  // sessionSpan is a module-level var set later by startNewSession; lazy closure captures it
  const recordEvent = (name: string, attrs?: Record<string, string | number | boolean>) => {
    emitLog(name, sessionSpan ?? undefined, attrs);
  };
  wireMenu({ appVersion: APP_VERSION, recordEvent, getSessionId, showResetProgress: true, showTraceLink: true });
  wireSoundToggle(recordEvent);
  setStorageRecordEvent(recordEvent);

  setFeedbackContextProvider(() => {
    const ctx: Record<string, string | number | boolean> = {
      'feedback.unlocked_levels': getUnlockedSubgroups().join(','),
    };
    if (session) {
      ctx['feedback.slide.subgroup'] = session.subgroup;
      ctx['feedback.slide.card_index'] = session.currentIndex + 1;
      ctx['feedback.slide.card_count'] = session.cardCount;
      if (currentCardName) {
        ctx['feedback.slide.card_name'] = currentCardName;
      }
    }
    return ctx;
  });

  app = document.getElementById('app');
  if (!app) return;

  // Read URL params
  const urlParams = new URLSearchParams(window.location.search);
  const subgroup = (urlParams.get('subgroup') || 'allied') as GuildSubgroup;
  const from = urlParams.get('from') || 'welcome';
  const welcomeDwellMs = parseInt(urlParams.get('welcome_dwell_ms') || '0', 10) || 0;
  startInPausedState = urlParams.has('paused');

  // Click/tap to advance early
  app.addEventListener('click', () => {
    if (session) handleAdvance();
  });

  // Spacebar to advance early (skip when focus is in a text field)
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && session) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;
      e.preventDefault();
      if (paused) {
        const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
        if (pauseBtn) pauseBtn.click();
      } else {
        handleAdvance();
      }
    }
  });

  // Pause slideshow when any dialog opens; resume when all dialogs close
  document.addEventListener('dialog-open', () => {
    dialogOpenCount++;
    if (dialogOpenCount === 1 && !paused && session) {
      pausedByDialog = true;
      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
      if (pauseBtn) pauseBtn.click();
    }
  });

  document.addEventListener('dialog-close', () => {
    dialogOpenCount = Math.max(0, dialogOpenCount - 1);
    if (dialogOpenCount === 0 && pausedByDialog) {
      pausedByDialog = false;
      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement | null;
      if (pauseBtn && paused) pauseBtn.click();
    }
  });

  // Flush spans when page is hidden (captures abandoned sessions)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (cardSpan && session && !session.completed) {
        endCardSpan(false);
      }
      if (sessionSpan && session) {
        const duration = Date.now() - session.startTime;
        sessionSpan.setAttribute('session.card_count', session.cardCount);
        sessionSpan.setAttribute('session.completed', false);
        sessionSpan.setAttribute('session.duration_ms', duration);
        endSpan(sessionSpan);
        sessionSpan = null;
      }
      flushSpans();
    }
  });

  // Show level intro before starting session
  showLevelIntro(subgroup, from, welcomeDwellMs);
});
