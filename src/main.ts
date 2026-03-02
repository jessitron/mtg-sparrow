import { initTelemetry, startSpan, startChildSpan, endSpan, addSpanEvent, sendStartupSpan, flushSpans, getTraceId } from './telemetry/telemetry';
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
import { showSessionEndColumns } from './ui/guild-columns';
import { buildSelfAssessment, SELF_ASSESSMENT_MIN_CARDS } from './ui/self-assessment';
import { wireSettings } from './ui/settings';

export const APP_VERSION = '0.14.0';

let app: HTMLElement | null = null;
let session: SessionState | null = null;
let welcomeScreenLoadTime = 0;
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
    const combo = session.deck[session.currentIndex];
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

function showSessionEnd(cardsShown?: number): void {
  if (!app || !session) return;

  // Leave full-screen quiz mode
  app.classList.remove('app--quiz-active');

  // Remove the floating done-zone (appended to body during session)
  document.querySelector('.done-zone')?.remove();

  const actualCount = cardsShown ?? session.cardCount;

  // Mark subgroup as unlocked if this was a completed session
  if (session.completed) {
    const justUnlocked = markSubgroupUnlocked(session.subgroup);
    if (justUnlocked && sessionSpan) {
      addSpanEvent(sessionSpan, 'progression.subgroup_unlocked', {
        'progression.subgroup': session.subgroup,
      });
    }
  }

  // Mark subgroup as completed when the session ends (completed or stopped after seeing cards)
  markSubgroupCompleted(session.subgroup);

  const alliedUnlocked = isSubgroupUnlocked('allied');
  const enemyUnlocked = isSubgroupUnlocked('enemy');

  app.innerHTML = '';
  const endScreen = document.createElement('div');
  endScreen.classList.add('session-end');

  // Skip self-assessment if too few cards were shown — go straight to guild columns
  if (actualCount <= SELF_ASSESSMENT_MIN_CARDS) {
    endSessionSpan(actualCount);
    showSessionEndColumns(app, alliedUnlocked, enemyUnlocked, startSession);
    return;
  }

  const countEl = document.createElement('div');
  countEl.classList.add('session-end-count');
  countEl.textContent = `${actualCount} cards`;
  endScreen.appendChild(countEl);

  const labelEl = document.createElement('div');
  labelEl.classList.add('session-end-label');
  labelEl.textContent = session.completed ? 'Session complete' : 'Session stopped';
  endScreen.appendChild(labelEl);

  const assessmentEl = buildSelfAssessment((value) => {
    // Record self-assessment on the session span before ending it
    if (sessionSpan) {
      sessionSpan.setAttribute('session.self_assessment', value);
      addSpanEvent(sessionSpan, 'session.self_assessment', {
        'assessment.value': value,
      });
    }

    // Now end the session span with all attributes
    endSessionSpan(actualCount);

    // Remove the assessment UI and count/label, then show two-column layout
    assessmentEl.remove();
    countEl.remove();
    labelEl.remove();
    showSessionEndColumns(app!, alliedUnlocked, enemyUnlocked, startSession);
  });
  endScreen.appendChild(assessmentEl);

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
  // Created once from the first card onward; persists across card transitions.
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

    // Empty spacer to balance the three-column grid and keep Done centered
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

  // Show "Done for now" button from card 2 onward (fade-in only triggers once via CSS animation)
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


function startSession(subgroup: GuildSubgroup = "allied", startedFrom: string = "welcome_screen"): void {
  // Hide the mana gas background animation
  if (typeof (window as any).stopManaGas === 'function') {
    (window as any).stopManaGas();
  }

  session = createSession(subgroup);

  const welcomeDwellMs = startedFrom === 'welcome_screen' && welcomeScreenLoadTime > 0
    ? Date.now() - welcomeScreenLoadTime : 0;

  // Start session root span
  sessionSpan = startSpan('session', {
    'session.tier': `guild_${subgroup}`,
    'session.subgroup_size': 5,
    'session.card_count': session.cardCount,
    'session.started_from': startedFrom,
    'session.welcome_dwell_ms': welcomeDwellMs,
    'session.self_assessment_min_cards': SELF_ASSESSMENT_MIN_CARDS,
    'session.enemy_unlocked': isSubgroupUnlocked('enemy'),
    'app.version': APP_VERSION,
    'welcome.render_mode': 'static_html',
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
  sendStartupSpan(APP_VERSION);

  wireSettings(APP_VERSION, () => sessionSpan);

  app = document.getElementById('app');
  if (!app) return;

  // Click/tap to advance early — only fires during a session
  app.addEventListener('click', () => {
    if (session) handleAdvance();
  });

  // Spacebar to advance early — only fires during a session
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'Space' && session) {
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

  // Dev convenience: ?screen=end jumps straight to the session end screen
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('screen') === 'end') {
    if (typeof (window as any).stopManaGas === 'function') {
      (window as any).stopManaGas();
    }
    app.innerHTML = '';
    showSessionEndColumns(app, isSubgroupUnlocked('allied'), isSubgroupUnlocked('enemy'), startSession);
    return;
  }

  welcomeScreenLoadTime = Date.now();
  document.getElementById('start-button')?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    startSession();
  });
});
