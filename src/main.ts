import { initTelemetry, startSpan, startChildSpan, endSpan, addSpanEvent, sendStartupSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { renderCard, revealName } from './ui/render';
import {
  createSession,
  currentCard,
  advanceCard,
  SessionState,
  REVEAL_DELAY_MS,
  ADVANCE_DELAY_MS,
} from './session';
import { colorEmojiMap } from './data/combos';
import { Span } from '@opentelemetry/api';

export const APP_VERSION = '0.3.0';

let app: HTMLElement | null = null;
let session: SessionState | null = null;
let sessionSpan: Span | null = null;
let cardSpan: Span | null = null;
let cardShowTime = 0;
let revealTimer: ReturnType<typeof setTimeout> | null = null;
let advanceTimer: ReturnType<typeof setTimeout> | null = null;
let paused = false;
let nameRevealed = false;

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
    const combo = session.deck[session.currentIndex];
    cardSpan.setAttribute('card.dwell_time_ms', dwellTime);
    cardSpan.setAttribute('card.advanced_early', early);
    endSpan(cardSpan);
    cardSpan = null;
  }
}

function showSessionEnd(cardsShown?: number): void {
  if (!app || !session) return;

  const actualCount = cardsShown ?? session.cardCount;

  // End session span
  if (sessionSpan) {
    const duration = Date.now() - session.startTime;
    sessionSpan.setAttribute('session.card_count', actualCount);
    sessionSpan.setAttribute('session.completed', session.completed);
    sessionSpan.setAttribute('session.duration_ms', duration);
    endSpan(sessionSpan);
    sessionSpan = null;
  }

  app.innerHTML = '';
  const endScreen = document.createElement('div');
  endScreen.classList.add('session-end');

  const countEl = document.createElement('div');
  countEl.classList.add('session-end-count');
  countEl.textContent = `${actualCount} cards`;
  endScreen.appendChild(countEl);

  const labelEl = document.createElement('div');
  labelEl.classList.add('session-end-label');
  labelEl.textContent = session.completed ? 'Session complete' : 'Session stopped';
  endScreen.appendChild(labelEl);

  app.appendChild(endScreen);
}

function stopSession(): void {
  if (!session || session.completed) return;

  clearTimers();

  // End the in-flight card span — this is a session stop, not a card advance
  if (cardSpan) {
    const dwellTime = Date.now() - cardShowTime;
    cardSpan.setAttribute('card.dwell_time_ms', dwellTime);
    cardSpan.setAttribute('card.advanced_early', false);
    endSpan(cardSpan);
    cardSpan = null;
  }

  // The number of cards the user actually saw: currentIndex is 0-based,
  // and we're mid-card, so they've seen currentIndex + 1 cards
  const cardsShown = session.currentIndex + 1;
  session.completed = false;

  showSessionEnd(cardsShown);
}

function showCard(): void {
  if (!app || !session) return;

  const combo = currentCard(session);
  cardShowTime = Date.now();

  // Start card span as child of session span
  const cardAttrs = {
    'card.combo_id': combo.id,
    'card.combo_name': combo.name,
    'card.colors': combo.colors.join(','),
    'card.combo_emoji': combo.colors.map(c => colorEmojiMap[c]).join(''),
    'card.tier': combo.tier,
    'card.number': session.currentIndex + 1,
    'app.version': APP_VERSION,
  };
  cardSpan = sessionSpan
    ? startChildSpan('card', sessionSpan, cardAttrs)
    : startSpan('card', cardAttrs);

  paused = false;
  nameRevealed = false;

  app.innerHTML = '';
  const card = renderCard(combo);
  app.appendChild(card);

  // Progress counter and stop button
  const progressRow = document.createElement('div');
  progressRow.classList.add('progress-row');

  const progress = document.createElement('div');
  progress.classList.add('progress-counter');
  progress.textContent = `Card ${session.currentIndex + 1} / ${session.cardCount}`;
  progressRow.appendChild(progress);

  const pauseBtn = document.createElement('button');
  pauseBtn.classList.add('control-button');
  pauseBtn.textContent = 'Pause';
  pauseBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    if (!session) return;
    if (!paused) {
      paused = true;
      clearTimers();
      pauseBtn.textContent = 'Resume';
      if (sessionSpan) {
        addSpanEvent(sessionSpan, 'session.pause', {
          'pause.card_number': session.currentIndex + 1,
        });
      }
    } else {
      paused = false;
      pauseBtn.textContent = 'Pause';
      if (sessionSpan) {
        addSpanEvent(sessionSpan, 'session.resume', {
          'resume.card_number': session.currentIndex + 1,
        });
      }
      // Restart the appropriate timer
      if (!nameRevealed) {
        const card = app?.querySelector('.card') as HTMLElement | null;
        revealTimer = setTimeout(() => {
          revealTimer = null;
          nameRevealed = true;
          if (card) revealName(card);
          advanceTimer = setTimeout(() => {
            advanceTimer = null;
            goToNextCard(false);
          }, ADVANCE_DELAY_MS);
        }, REVEAL_DELAY_MS);
      } else {
        advanceTimer = setTimeout(() => {
          advanceTimer = null;
          goToNextCard(false);
        }, ADVANCE_DELAY_MS);
      }
    }
  });
  progressRow.appendChild(pauseBtn);

  const stopBtn = document.createElement('button');
  stopBtn.classList.add('control-button');
  stopBtn.textContent = 'Stop';
  stopBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    stopSession();
  });
  progressRow.appendChild(stopBtn);

  app.appendChild(progressRow);

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
    showSessionEnd();
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

    // Record dwell time up to this tap
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

function startSession(): void {
  session = createSession();

  // Start session root span
  sessionSpan = startSpan('session', {
    'session.tier': 'guild',
    'session.card_count': session.cardCount,
    'app.version': APP_VERSION,
  });

  // Link the version footer to the Honeycomb trace for this session
  if (sessionSpan) {
    const traceId = getTraceId(sessionSpan);
    const traceUrl = `https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=${traceId}`;
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
      const link = document.createElement('a');
      link.href = traceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = versionEl.textContent || `v${APP_VERSION}`;
      link.classList.add('trace-link');
      versionEl.textContent = '';
      versionEl.appendChild(link);
    }
  }

  showCard();
}

document.addEventListener('DOMContentLoaded', () => {
  initTelemetry(APP_VERSION);
  sendStartupSpan(APP_VERSION);

  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    versionEl.textContent = `v${APP_VERSION}`;
  }

  app = document.getElementById('app');
  if (!app) return;

  // Click/tap to advance early
  app.addEventListener('click', handleAdvance);

  // Spacebar to advance early
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handleAdvance();
    }
  });

  // Flush spans when page is hidden (captures abandoned sessions)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // End any in-flight spans before flushing
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

  startSession();
});
