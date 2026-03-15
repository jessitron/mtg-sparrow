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
let ongoingScroll: HTMLElement | null = null;

function removeOngoingScroll(): void {
  if (ongoingScroll && ongoingScroll.parentNode) {
    ongoingScroll.parentNode.removeChild(ongoingScroll);
  }
  ongoingScroll = null;
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
  removeOngoingScroll();
  navigateToAssessment(cardsShown);
}

/**
 * Build the scroll element with the given combo names.
 * Shared between the ongoing-scroll and intro-scroll.
 */
function buildScrollElement(names: string[], extraClass?: string): HTMLElement {
  const scroll = document.createElement('div');
  scroll.classList.add('name-scroll');
  if (extraClass) scroll.classList.add(extraClass);
  for (const name of names) {
    const entry = document.createElement('div');
    entry.classList.add('name-scroll-entry');
    entry.textContent = name;
    scroll.appendChild(entry);
  }
  return scroll;
}

/**
 * Check if the viewport is wide enough to show the scroll alongside the slide.
 * Below this threshold we skip the scroll on mobile.
 */
function isScrollViewport(): boolean {
  return window.innerWidth >= 800;
}

/**
 * Render the placeholder slide state: card-back image + hidden name,
 * using the same .card--with-image grid layout so sizes are correct.
 * Also add app--quiz-active so the layout matches the real quiz state.
 */
function renderPlaceholderCard(): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card', 'card--with-image');

  const imgCol = document.createElement('div');
  imgCol.classList.add('card-image-column');

  const img = document.createElement('img');
  img.classList.add('mtg-card-img');
  img.src = 'images/card-back.png';
  img.alt = '';
  imgCol.appendChild(img);
  card.appendChild(imgCol);

  const quizCol = document.createElement('div');
  quizCol.classList.add('card-quiz-column');

  // Empty pips placeholder
  const pips = document.createElement('div');
  pips.classList.add('card-pips');
  quizCol.appendChild(pips);

  const name = document.createElement('div');
  name.classList.add('card-name', 'card-name-hidden');
  name.textContent = '';
  quizCol.appendChild(name);

  card.appendChild(quizCol);
  return card;
}

/**
 * Position the ongoing-scroll to the right of the centered #app.
 * Called after the scroll becomes visible and after window resize.
 */
function positionOngoingScroll(): void {
  if (!ongoingScroll || !app) return;
  if (!isScrollViewport()) {
    ongoingScroll.style.display = 'none';
    return;
  }

  ongoingScroll.style.display = '';

  const appRect = app.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const rightGap = viewportWidth - appRect.right;

  // Center the scroll in the gap to the right of the slide
  const scrollWidth = ongoingScroll.getBoundingClientRect().width;
  const leftInGap = appRect.right + (rightGap - scrollWidth) / 2;

  ongoingScroll.style.position = 'fixed';
  ongoingScroll.style.left = `${Math.max(appRect.right + 8, leftInGap)}px`;
  ongoingScroll.style.top = '50%';
  ongoingScroll.style.transform = 'translateY(-50%)';
}

/**
 * showIntro: multi-step intro sequence driven by Space key.
 *
 * Step 0 (page load): placeholder card + ongoing-scroll hidden on right.
 * Step 1 (Space 1):   ongoing-scroll fades in.
 * Step 2 (Space 2):   dark modal appears with LEVEL title + intro-scroll.
 * Step 3 (Space 3):   intro-scroll flies to ongoing-scroll position;
 *                     modal fades out; showCard() starts.
 */
function showIntro(subgroup: GuildSubgroup): void {
  if (!app) return;

  const levelNumber: Record<GuildSubgroup, number> = {
    allied: 1,
    enemy: 2,
    wedges: 3,
    shards: 4,
  };
  const subgroupCombos: Record<GuildSubgroup, { name: string }[]> = {
    allied: alliedGuilds,
    enemy: enemyGuilds,
    wedges: wedges,
    shards: shards,
  };

  const level = levelNumber[subgroup];
  const names = subgroupCombos[subgroup].map(c => c.name);

  // ── Step 0: render placeholder slide ──────────────────────────────────────
  app.classList.add('app--quiz-active');
  app.innerHTML = '';
  const placeholder = renderPlaceholderCard();
  app.appendChild(placeholder);

  // Build ongoing-scroll (lives on body, survives app.innerHTML clears)
  ongoingScroll = buildScrollElement(names, 'ongoing-scroll');
  ongoingScroll.style.opacity = '0';
  ongoingScroll.style.pointerEvents = 'none';
  if (!isScrollViewport()) {
    ongoingScroll.style.display = 'none';
  }
  document.body.appendChild(ongoingScroll);

  // Position it now so getBoundingClientRect is correct later
  positionOngoingScroll();

  let introStep = 0;
  let introModal: HTMLElement | null = null;

  function handleIntroSpace(e: KeyboardEvent): void {
    if (e.code !== 'Space') return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    e.preventDefault();
    advanceIntro();
  }

  function removeIntroHandlers(): void {
    document.removeEventListener('keydown', handleIntroSpace);
  }

  function advanceIntro(): void {
    introStep++;

    if (introStep === 1) {
      // Step 1: show the ongoing-scroll
      if (ongoingScroll && isScrollViewport()) {
        positionOngoingScroll();
        ongoingScroll.style.transition = 'opacity 300ms ease';
        ongoingScroll.style.opacity = '1';
        ongoingScroll.style.pointerEvents = '';
      }

    } else if (introStep === 2) {
      // Step 2: show the modal with level title + intro-scroll
      introModal = document.createElement('div');
      introModal.classList.add('intro-modal');

      const group = document.createElement('div');
      group.classList.add('intro-group');

      const title = document.createElement('div');
      title.classList.add('level-title');
      title.textContent = `Level ${level}`;
      group.appendChild(title);

      const introScrollEl = buildScrollElement(names, 'intro-scroll');
      group.appendChild(introScrollEl);

      introModal.appendChild(group);

      const hint = document.createElement('div');
      hint.classList.add('intro-hint');
      hint.textContent = 'Tap or press Space to begin';
      introModal.appendChild(hint);

      document.body.appendChild(introModal);

    } else if (introStep === 3) {
      // Step 3: animate ongoing-scroll from intro-scroll position to natural position
      removeIntroHandlers();

      if (!introModal || !ongoingScroll) {
        // Fallback: skip straight to cards
        if (introModal) introModal.remove();
        showCard();
        return;
      }

      const introScrollEl = introModal.querySelector('.intro-scroll') as HTMLElement | null;

      if (!introScrollEl || !isScrollViewport()) {
        // No scroll to animate — just fade modal and go
        introModal.style.transition = 'opacity 300ms ease';
        introModal.style.opacity = '0';
        setTimeout(() => {
          introModal?.remove();
          introModal = null;
          showCard();
        }, 350);
        return;
      }

      // Measure both scroll positions
      const introRect = introScrollEl.getBoundingClientRect();
      const ongoingRect = ongoingScroll.getBoundingClientRect();

      // deltaX / deltaY to move from introRect to ongoingRect
      const dx = introRect.left - ongoingRect.left;
      const dy = introRect.top - ongoingRect.top;

      // Scale factor (intro-scroll may be same size but let's handle differences)
      const scaleX = introRect.width / (ongoingRect.width || 1);
      const scaleY = introRect.height / (ongoingRect.height || 1);

      // Apply inverse transform to ongoing-scroll so it appears at intro position
      ongoingScroll.style.transition = 'none';
      ongoingScroll.style.transform = `translateY(-50%) translateX(${dx}px) translateY(${dy}px) scaleX(${scaleX}) scaleY(${scaleY})`;

      // Force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      ongoingScroll.offsetWidth;

      // Now transition to natural position
      ongoingScroll.style.transition = 'transform 500ms ease-in-out';
      ongoingScroll.style.transform = 'translateY(-50%)';

      // Simultaneously fade out the modal elements
      const titleEl = introModal.querySelector('.level-title') as HTMLElement | null;
      if (titleEl) {
        titleEl.style.transition = 'opacity 300ms ease';
        titleEl.style.opacity = '0';
      }
      introScrollEl.style.transition = 'opacity 300ms ease';
      introScrollEl.style.opacity = '0';
      introModal.style.transition = 'background-color 500ms ease';
      introModal.style.backgroundColor = 'transparent';

      setTimeout(() => {
        introModal?.remove();
        introModal = null;
        showCard();
      }, 550);
    }
  }

  document.addEventListener('keydown', handleIntroSpace);
}

function showCard(): void {
  if (!app || !session) return;

  // Ensure quiz mode is active (may already be set)
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

  // Controls below the card — pause, counter, done button.
  if (!doneZoneEl) {
    const doneZone = document.createElement('div');
    doneZone.classList.add('done-zone');
    doneZoneEl = doneZone;

    // Left side: pause button + counter
    const doneLeft = document.createElement('div');
    doneLeft.classList.add('done-zone-left');

    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'pause-btn';
    pauseBtn.classList.add('control-button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
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
    doneLeft.appendChild(pauseBtn);

    const progress = document.createElement('span');
    progress.classList.add('progress-counter');
    progress.textContent = `${session.currentIndex + 1} / ${session.cardCount}`;
    doneLeft.appendChild(progress);

    doneZone.appendChild(doneLeft);

    // Right side: "Done for now" button
    const doneBtn = document.createElement('button');
    doneBtn.classList.add('done-button');
    doneBtn.textContent = 'Done for now';
    doneBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      stopSession();
    });

    doneZone.appendChild(doneBtn);

    // Empty spacer to balance the three-column grid
    const spacer = document.createElement('div');
    doneZone.appendChild(spacer);

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
    removeOngoingScroll();
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

function startSession(subgroup: GuildSubgroup, startedFrom: string, welcomeDwellMs: number): void {
  session = createSession(subgroup);

  // Start session root span
  const tierLabel =
    subgroup === 'allied' ? 'guild_allied' :
    subgroup === 'enemy'  ? 'guild_enemy'  :
    subgroup === 'wedges' ? 'wedge'        :
    'shard';
  sessionSpan = startSpan('session', {
    'session.tier': tierLabel,
    'session.subgroup_size': 5,
    'session.card_count': session.cardCount,
    'session.started_from': startedFrom,
    'session.welcome_dwell_ms': welcomeDwellMs,
    'session.enemy_unlocked': isSubgroupUnlocked('enemy'),
    'session.has_name_scroll': true,
    'app.version': APP_VERSION,
  });

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

  showIntro(subgroup);
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

  // Click/tap to advance early — only when session is running (after intro)
  app.addEventListener('click', () => {
    if (session) handleAdvance();
  });

  // Spacebar: during session, advance card; during intro, handled inside showIntro
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && session) {
      // Only handle if the session is actively showing cards (not in intro phase)
      // The intro installs its own one-shot handler; once showCard() is called
      // the session's cardSpan will be set and handleAdvance() is appropriate.
      if (!cardSpan) return;
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

  // Start session immediately
  startSession(subgroup, from, welcomeDwellMs);
});
