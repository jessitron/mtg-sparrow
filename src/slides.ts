import { initTelemetry, startSpan, startChildSpan, endSpan, addSpanEvent, flushSpans, getTraceId } from './telemetry/telemetry';
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
import { colorEmojiMap } from './data/combos';
import { isSubgroupUnlocked, markSubgroupUnlocked, markSubgroupCompleted } from './progression';
import { Span } from '@opentelemetry/api';
import { wireSettings } from './ui/settings';

const APP_VERSION = '0.15.0';

let app: HTMLElement | null = null;
let session: SessionState | null = null;
let sessionSpan: Span | null = null;
let cardSpan: Span | null = null;
let cardShowTime = 0;
let revealTimer: ReturnType<typeof setTimeout> | null = null;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let nameRevealed = false;
let currentTraceUrl: string | null = null;

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

function navigateToAssessment(actualCount: number): void {
  if (!session) return;

  // Record progression while session span is still open
  if (session.completed) {
    const justUnlocked = markSubgroupUnlocked(session.subgroup);
    if (justUnlocked && sessionSpan) {
      addSpanEvent(sessionSpan, 'progression.subgroup_unlocked', {
        'progression.subgroup': session.subgroup,
      });
    }
  }
  markSubgroupCompleted(session.subgroup);

  // End session span (no self_assessment — that belongs to assessment page)
  endSessionSpan(actualCount);

  // Flush spans before navigating (visibilitychange flush is unreliable)
  flushSpans();

  // Navigate to assessment page
  window.location.href = `assessment.html?subgroup=${session.subgroup}&cards=${actualCount}&completed=${session.completed}`;
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
  cardSpan = sessionSpan
    ? startChildSpan('card', sessionSpan, cardAttrs)
    : startSpan('card', cardAttrs);

  paused = false;
  nameRevealed = false;

  app.innerHTML = '';
  const card = renderCard(combo);
  app.appendChild(card);

  // Floating done-zone — fixed at bottom with gradient fade.
  let doneZone = document.querySelector('.done-zone') as HTMLElement | null;
  if (!doneZone) {
    doneZone = document.createElement('div');
    doneZone.classList.add('done-zone');

    // Left side: pause button + counter
    const doneLeft = document.createElement('div');
    doneLeft.classList.add('done-zone-left');

    const pauseBtn = document.createElement('button');
    pauseBtn.classList.add('control-button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
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

    document.body.appendChild(doneZone);
  } else {
    // Update counter in place on card transitions
    const progress = doneZone.querySelector('.progress-counter') as HTMLElement | null;
    if (progress) {
      progress.textContent = `${session.currentIndex + 1} / ${session.cardCount}`;
    }
  }

  // Show "Done for now" button from card 2 onward
  const doneBtn = doneZone.querySelector('.done-button');
  if (doneBtn && session.currentIndex >= 1) {
    doneBtn.classList.add('button-visible');
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
    navigateToAssessment(session.cardCount);
  }
}

function handleAdvance(): void {
  if (!session || session.completed) return;
  if (paused) return;

  // Record a span event on the card span for every user tap
  if (cardSpan) {
    addSpanEvent(cardSpan, 'user.tap', {
      'tap.time_since_card_ms': Date.now() - cardShowTime,
      'tap.name_revealed': revealTimer === null,
    });
  }

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
  sessionSpan = startSpan('session', {
    'session.tier': `guild_${subgroup}`,
    'session.subgroup_size': 5,
    'session.card_count': session.cardCount,
    'session.started_from': startedFrom,
    'session.welcome_dwell_ms': welcomeDwellMs,
    'session.enemy_unlocked': isSubgroupUnlocked('enemy'),
    'app.version': APP_VERSION,
    'app.page': 'slides',
    'app.navigation': 'multi_page',
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
    if (traceContainer) {
      traceContainer.hidden = false;
    }
  }

  showCard();
}

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION);
  // Do NOT call sendStartupSpan — welcome page only

  wireSettings(APP_VERSION, () => sessionSpan);

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

  // Spacebar to advance early
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && session) {
      e.preventDefault();
      handleAdvance();
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
