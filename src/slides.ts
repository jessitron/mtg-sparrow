import { initTelemetry, startSpan, startChildSpan, endSpan, emitLog, flushSpans, getTraceId } from './telemetry/telemetry';
import { renderCard, revealName } from './ui/render';
import {
  createSession,
  currentCard,
  advanceCard,
  SessionState,
  GuildSubgroup,
  REVEAL_DELAY_MS,
  ADVANCE_DELAY_MS,
} from './session';
import { colorEmojiMap, alliedGuilds, enemyGuilds, wedges, shards } from './data/combos';
import { isSubgroupUnlocked, markSubgroupUnlocked, markSubgroupCompleted, getUnlockedSubgroups } from './progression';
import { Span } from '@opentelemetry/api';
import { wireSettings } from './ui/settings';
import { APP_VERSION } from './version';
import { setFeedbackContextProvider } from './ui/feedback';
import { initDebugMode, isDebugMode } from './debug';

let app: HTMLElement | null = null;
let session: SessionState | null = null;
let sessionSpan: Span | null = null;
let cardSpan: Span | null = null;
let cardShowTime = 0;
let revealTimer: ReturnType<typeof setTimeout> | null = null;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let dialogOpenCount = 0;
let pausedByDialog = false;
let nameRevealed = false;
let currentTraceUrl: string | null = null;
let doneZoneEl: HTMLElement | null = null;
let currentCardName = '';
let namesEverHidden = false;

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
    const nextSubgroupMap: Record<GuildSubgroup, GuildSubgroup | null> = {
      allied:  'enemy',
      enemy:   'wedges',
      wedges:  'shards',
      shards:  null,
    };
    const nextSubgroup = nextSubgroupMap[session.subgroup];
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

  doneZoneEl = null;
  navigateToAssessment(cardsShown);
}

function showCard(): void {
  if (!app || !session) return;

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
  }
  currentCardName = combo.selectedCard?.name ?? combo.name;
  cardSpan = sessionSpan
    ? startChildSpan('card', sessionSpan, cardAttrs)
    : startSpan('card', cardAttrs);

  paused = false;
  pausedByDialog = false;
  nameRevealed = false;

  app.innerHTML = '';
  const card = renderCard(combo);
  app.appendChild(card);

  // Footer below the card — names row + controls row.
  if (!doneZoneEl) {
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
    namesToggle.classList.add('footer-names-toggle');

    // Load persisted preference for this subgroup
    const namesStorageKey = `namesHidden_${session.subgroup}`;
    let namesHidden = localStorage.getItem(namesStorageKey) === 'true';
    namesText.style.display = namesHidden ? 'none' : '';
    namesToggle.textContent = namesHidden ? '[show names]' : '[hide]';

    namesToggle.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      namesHidden = !namesHidden;
      localStorage.setItem(namesStorageKey, namesHidden ? 'true' : 'false');
      namesText.style.display = namesHidden ? 'none' : '';
      namesToggle.textContent = namesHidden ? '[show names]' : '[hide]';
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

    const progress = document.createElement('span');
    progress.classList.add('progress-counter');
    progress.textContent = `${session.currentIndex + 1} / ${session.cardCount}`;
    controlsRow.appendChild(progress);

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
            revealName(card);
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
  }

  // Re-append (survives innerHTML clear) and update counter
  app.appendChild(doneZoneEl);
  const progress = doneZoneEl.querySelector('.progress-counter') as HTMLElement | null;
  if (progress) {
    progress.textContent = `${session.currentIndex + 1} / ${session.cardCount}`;
  }

  // Show "Done for now" button from card 2 onward
  const doneBtn = doneZoneEl.querySelector('.done-button');
  if (doneBtn && session.currentIndex >= 1) {
    if (doneBtn.classList.contains('button-visible') || doneBtn.classList.contains('button-steady')) {
      // Already revealed — hold steady, no re-animation
      doneBtn.classList.remove('button-visible');
      doneBtn.classList.add('button-steady');
    } else {
      // First reveal — animate in
      doneBtn.classList.add('button-visible');
    }
  }

  // Auto-reveal: after REVEAL_DELAY_MS, fade in the name
  revealTimer = setTimeout(() => {
    revealTimer = null;
    nameRevealed = true;
    revealName(card);

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
    doneZoneEl = null;
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
    const card = app?.querySelector('.card') as HTMLElement | null;
    if (card) {
      revealName(card);
    }

    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      goToNextCard(true);
    }, ADVANCE_DELAY_MS);
  } else if (advanceTimer !== null) {
    // Name already revealed, advance timer pending — skip ahead immediately
    goToNextCard(true);
  }
}

function startSession(subgroup: GuildSubgroup, startedFrom: string, welcomeDwellMs: number, introDwellMs?: number): void {
  session = createSession(subgroup);

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
    'app.version': APP_VERSION,
  };
  if (introDwellMs !== undefined) {
    sessionAttrs['session.intro_dwell_ms'] = introDwellMs;
  }
  sessionSpan = startSpan('session', sessionAttrs);

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

  showCard();
}

const levelNumberMap: Record<GuildSubgroup, number> = {
  allied: 1,
  enemy:  2,
  wedges: 3,
  shards: 4,
};

const subtitleMap: Record<GuildSubgroup, string> = {
  allied: 'Allied Guilds',
  enemy:  'Enemy Guilds',
  wedges: 'Wedges',
  shards: 'Shards',
};

const comboPoolMap: Record<GuildSubgroup, { name: string }[]> = {
  allied: alliedGuilds,
  enemy:  enemyGuilds,
  wedges: wedges,
  shards: shards,
};

function showLevelIntro(subgroup: GuildSubgroup, from: string, welcomeDwellMs: number): void {
  if (!app) return;

  const introShowTime = Date.now();
  const levelNum = levelNumberMap[subgroup];
  const subtitle = subtitleMap[subgroup];
  const comboNames = comboPoolMap[subgroup].map(c => c.name).join(' · ');
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

  wireSettings(APP_VERSION);

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
      handleAdvance();
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
