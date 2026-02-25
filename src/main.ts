import { initTelemetry, startSpan, startChildSpan, endSpan, addSpanEvent, sendStartupSpan, flushSpans, getTraceId } from './telemetry/telemetry';
import { renderCard, revealName } from './ui/render';
import { renderPip } from './ui/pips';
import {
  createSession,
  currentCard,
  advanceCard,
  SessionState,
  GuildSubgroup,
  REVEAL_DELAY_MS,
  ADVANCE_DELAY_MS,
} from './session';
import { colorEmojiMap, alliedGuilds, enemyGuilds, ColorCombo } from './data/combos';
import { isEnemyUnlocked, markEnemyUnlocked, hasCompletedSubgroup, markSubgroupCompleted } from './progression';
import { Span } from '@opentelemetry/api';

export const APP_VERSION = '0.9.0';

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

type AssessmentOption = {
  label: string;
  value: string;
};

const SELF_ASSESSMENT_MIN_CARDS = 3;

const ASSESSMENT_OPTIONS: AssessmentOption[] = [
  { label: 'Still learning', value: 'still_learning' },
  { label: 'Getting there', value: 'getting_there' },
  { label: 'Nailing it', value: 'nailing_it' },
];

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


function buildGuildList(guilds: ColorCombo[]): HTMLElement {
  const list = document.createElement('ul');
  list.classList.add('guild-column-list');

  for (const guild of guilds) {
    const li = document.createElement('li');
    li.classList.add('guild-column-item');
    li.dataset.guildId = guild.id;

    const pips = document.createElement('span');
    pips.classList.add('combo-summary-pips');
    for (const color of guild.colors) {
      pips.appendChild(renderPip(color));
    }
    li.appendChild(pips);

    const name = document.createElement('span');
    name.classList.add('combo-summary-name');
    name.textContent = guild.name;
    li.appendChild(name);

    list.appendChild(li);
  }

  return list;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

interface ColorNode {
  id: string;
  cx: number;
  cy: number;
  imgX: number;
  imgY: number;
  src: string;
}

const colorNodes: ColorNode[] = [
  { id: 'white', cx: 200,    cy: 50,     imgX: 166,   imgY: 16,     src: 'images/W.svg' },
  { id: 'blue',  cx: 342.66, cy: 153.65, imgX: 308.66, imgY: 119.65, src: 'images/U.svg' },
  { id: 'black', cx: 288.17, cy: 321.35, imgX: 254.17, imgY: 287.35, src: 'images/B.svg' },
  { id: 'red',   cx: 111.83, cy: 321.35, imgX: 77.83,  imgY: 287.35, src: 'images/R.svg' },
  { id: 'green', cx: 57.34,  cy: 153.65, imgX: 23.34,  imgY: 119.65, src: 'images/G.svg' },
];

// Adjacent pairs (pentagon edges) — allied color pairs
const alliedPairs: [string, string][] = [
  ['white', 'blue'],
  ['blue',  'black'],
  ['black', 'red'],
  ['red',   'green'],
  ['green', 'white'],
];

// Skipping pairs (star edges) — enemy color pairs
const enemyPairs: [string, string][] = [
  ['white', 'black'],
  ['blue',  'red'],
  ['black', 'green'],
  ['red',   'white'],
  ['green', 'blue'],
];

// Maps node color id → color code, used for guild lookup
const colorNodeToCode: Record<string, string> = {
  white: 'W',
  blue:  'U',
  black: 'B',
  red:   'R',
  green: 'G',
};

// Maps sorted color-code pair (e.g. "UW") → guild id
const colorPairToGuildId: Record<string, string> = {};
for (const guild of alliedGuilds) {
  const key = [...guild.colors].sort().join('');
  colorPairToGuildId[key] = guild.id;
}
for (const guild of enemyGuilds) {
  const key = [...guild.colors].sort().join('');
  colorPairToGuildId[key] = guild.id;
}

/**
 * Build a color wheel SVG.
 * @param pairs - the color pairs to draw as lines
 * @param wheelClass - CSS class for the SVG element (e.g. 'allied-color-wheel')
 * @param lineClass - CSS class for line groups (e.g. 'ally-line')
 * @param lineVisClass - CSS class for visible line elements (e.g. 'ally-line-vis')
 * @param lineHitClass - CSS class for hit-area line elements (e.g. 'ally-line-hit')
 * @param crestId - id attribute for the guild crest image element
 */
function buildColorWheel(
  pairs: [string, string][],
  wheelClass: string,
  lineClass: string,
  lineVisClass: string,
  lineHitClass: string,
  crestId: string,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.setAttribute('xmlns', SVG_NS);
  svg.classList.add(wheelClass);

  // Draw lines first (behind nodes)
  for (const [aId, bId] of pairs) {
    const a = colorNodes.find(n => n.id === aId)!;
    const b = colorNodes.find(n => n.id === bId)!;

    const lineLen = Math.hypot(b.cx - a.cx, b.cy - a.cy);

    // Wrap visible line + hit-area line in a group
    const lineGroup = document.createElementNS(SVG_NS, 'g');
    lineGroup.setAttribute('id', `line-${aId}-${bId}`);
    lineGroup.classList.add(lineClass);

    // Invisible wide hit-area line (rendered first so it's below)
    const hitLine = document.createElementNS(SVG_NS, 'line');
    hitLine.classList.add(lineHitClass);
    hitLine.setAttribute('x1', String(a.cx));
    hitLine.setAttribute('y1', String(a.cy));
    hitLine.setAttribute('x2', String(b.cx));
    hitLine.setAttribute('y2', String(b.cy));
    hitLine.setAttribute('stroke', 'transparent');
    hitLine.setAttribute('stroke-width', '24');
    hitLine.setAttribute('pointer-events', 'stroke');
    lineGroup.appendChild(hitLine);

    // Visible line (stroke color set via CSS using lineVisClass)
    const visLine = document.createElementNS(SVG_NS, 'line');
    visLine.classList.add(lineVisClass);
    visLine.setAttribute('x1', String(a.cx));
    visLine.setAttribute('y1', String(a.cy));
    visLine.setAttribute('x2', String(b.cx));
    visLine.setAttribute('y2', String(b.cy));
    visLine.setAttribute('stroke-width', '8');
    visLine.setAttribute('opacity', '0.75');
    visLine.setAttribute('stroke-dasharray', String(lineLen));
    visLine.setAttribute('stroke-dashoffset', '0');
    visLine.setAttribute('pointer-events', 'none');
    lineGroup.appendChild(visLine);

    svg.appendChild(lineGroup);
  }

  // Draw mana symbol images on top
  for (const node of colorNodes) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('id', `node-${node.id}`);
    g.classList.add('color-node');

    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttributeNS(XLINK_NS, 'href', node.src);
    img.setAttribute('href', node.src);
    img.setAttribute('x', String(node.imgX));
    img.setAttribute('y', String(node.imgY));
    img.setAttribute('width', '68');
    img.setAttribute('height', '68');

    g.appendChild(img);
    svg.appendChild(g);
  }

  // Guild crest image — rendered after nodes so it appears on top
  const crestImg = document.createElementNS(SVG_NS, 'image');
  crestImg.setAttribute('id', crestId);
  crestImg.setAttribute('x', '150');
  crestImg.setAttribute('y', '150');
  crestImg.setAttribute('width', '100');
  crestImg.setAttribute('height', '100');
  crestImg.setAttribute('opacity', '0');
  crestImg.setAttribute('pointer-events', 'none');
  svg.appendChild(crestImg);

  return svg;
}

function buildAlliedColorWheel(): SVGSVGElement {
  return buildColorWheel(alliedPairs, 'allied-color-wheel', 'ally-line', 'ally-line-vis', 'ally-line-hit', 'crest-image');
}

function buildEnemyColorWheel(): SVGSVGElement {
  return buildColorWheel(enemyPairs, 'enemy-color-wheel', 'enemy-line', 'enemy-line-vis', 'enemy-line-hit', 'crest-image-enemy');
}

/**
 * Wire hover, click, and tap-select behavior for a color wheel.
 * @param col - the guild column element containing both the SVG and list
 * @param svg - the color wheel SVG element
 * @param pairs - the color pairs corresponding to lines in the SVG
 * @param lineClass - CSS class for line groups (e.g. 'ally-line')
 * @param crestId - id of the crest image element within the SVG
 */
function wireColorWheelHover(
  col: HTMLElement,
  svg: SVGSVGElement,
  pairs: [string, string][],
  lineClass: string,
  crestId: string,
): void {
  // Track tap-selected pair for mobile (null = nothing selected)
  let selectedPair: [string, string] | null = null;

  const crestImg = svg.getElementById(crestId) as SVGImageElement | null;

  // Helper: set/clear highlight class on all related elements for a given pair
  function setHighlight(aId: string, bId: string, on: boolean): void {
    const lineEl = svg.getElementById(`line-${aId}-${bId}`);
    const nodeA  = svg.getElementById(`node-${aId}`);
    const nodeB  = svg.getElementById(`node-${bId}`);
    const guildId = colorPairToGuildId[[colorNodeToCode[aId], colorNodeToCode[bId]].sort().join('')];
    const listItem = col.querySelector<HTMLElement>(`[data-guild-id="${guildId}"]`);

    if (on) {
      lineEl?.classList.add('highlight');
      nodeA?.classList.add('highlight');
      nodeB?.classList.add('highlight');
      listItem?.classList.add('highlight');
      col.classList.add('guild-column--has-highlight');
      if (crestImg) {
        const src = `images/${guildId}.png`;
        crestImg.setAttributeNS(XLINK_NS, 'href', src);
        crestImg.setAttribute('href', src);
        crestImg.setAttribute('opacity', '1');
      }
    } else {
      lineEl?.classList.remove('highlight');
      nodeA?.classList.remove('highlight');
      nodeB?.classList.remove('highlight');
      listItem?.classList.remove('highlight');
      col.classList.remove('guild-column--has-highlight');
      if (crestImg) {
        crestImg.setAttribute('opacity', '0');
      }
    }
  }

  // Helper: handle a click/tap selecting or deselecting a pair
  function handlePairClick(aId: string, bId: string): void {
    if (selectedPair && selectedPair[0] === aId && selectedPair[1] === bId) {
      // Same pair tapped again — deselect
      selectedPair = null;
      setHighlight(aId, bId, false);
    } else {
      // Deselect previous if any
      if (selectedPair) {
        setHighlight(selectedPair[0], selectedPair[1], false);
      }
      selectedPair = [aId, bId];
      setHighlight(aId, bId, true);
    }
  }

  // Wire hover and click on each line group
  for (const [aId, bId] of pairs) {
    const lineEl = svg.getElementById(`line-${aId}-${bId}`);
    if (!lineEl) continue;
    lineEl.addEventListener('mouseenter', () => {
      if (selectedPair) return; // don't override tap selection
      setHighlight(aId, bId, true);
    });
    lineEl.addEventListener('mouseleave', () => {
      if (selectedPair) return; // don't clear tap selection
      setHighlight(aId, bId, false);
    });
    lineEl.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      handlePairClick(aId, bId);
    });
  }

  // Wire hover and click on each guild list item
  for (const [aId, bId] of pairs) {
    const guildId = colorPairToGuildId[[colorNodeToCode[aId], colorNodeToCode[bId]].sort().join('')];
    const listItem = col.querySelector<HTMLElement>(`[data-guild-id="${guildId}"]`);
    if (!listItem) continue;
    listItem.addEventListener('mouseenter', () => {
      if (selectedPair) return;
      setHighlight(aId, bId, true);
    });
    listItem.addEventListener('mouseleave', () => {
      if (selectedPair) return;
      setHighlight(aId, bId, false);
    });
    listItem.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      handlePairClick(aId, bId);
    });
  }

  // Click on the column outside a line or guild item deselects
  col.addEventListener('click', (e: Event) => {
    if (!selectedPair) return;
    const target = e.target as Element | null;
    if (!target) return;
    // If click landed inside a line group or a [data-guild-id] item, ignore (already handled above)
    if (target.closest(`.${lineClass}`) || target.closest('[data-guild-id]')) return;
    setHighlight(selectedPair[0], selectedPair[1], false);
    selectedPair = null;
  });
}

function wireAlliedHover(col: HTMLElement, svg: SVGSVGElement): void {
  wireColorWheelHover(col, svg, alliedPairs, 'ally-line', 'crest-image');
}

function wireEnemyHover(col: HTMLElement, svg: SVGSVGElement): void {
  wireColorWheelHover(col, svg, enemyPairs, 'enemy-line', 'crest-image-enemy');
}

function buildAlliedColumn(): HTMLElement {
  const col = document.createElement('div');
  col.classList.add('guild-column', 'guild-column--allied');

  const header = document.createElement('h2');
  header.classList.add('guild-column-header');
  header.textContent = 'Allied Guilds';
  col.appendChild(header);

  const explanation = document.createElement('p');
  explanation.classList.add('guild-column-explanation');
  explanation.textContent = "Magic's five colors form a circle: ☀️ 💧 💀 🔥 🌿. Allied guilds are pairs of neighboring colors — colors that share philosophy and overlap in values. Natural partnerships, built on common ground.";
  col.appendChild(explanation);

  const svg = buildAlliedColorWheel();
  col.appendChild(svg);

  col.appendChild(buildGuildList(alliedGuilds));

  // Wire bidirectional hover after both SVG and list are in the DOM
  wireAlliedHover(col, svg);

  const btn = document.createElement('button');
  btn.classList.add('next-session-button', 'guild-column-button');
  btn.textContent = hasCompletedSubgroup('allied') ? 'Practice allied guilds' : 'Learn allied guilds';
  btn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    startSession('allied', 'session_end_screen');
  });
  col.appendChild(btn);

  return col;
}

function buildEnemyColumn(unlocked: boolean): HTMLElement {
  const col = document.createElement('div');
  col.classList.add('guild-column', 'guild-column--enemy');
  // Show full content if the user has practiced enemy guilds at all
  const showContent = unlocked || hasCompletedSubgroup('enemy');
  if (!showContent) {
    col.classList.add('guild-column--locked');
  }

  if (showContent) {
    const header = document.createElement('h2');
    header.classList.add('guild-column-header');
    header.textContent = 'Enemy Guilds';
    col.appendChild(header);

    const explanation = document.createElement('p');
    explanation.classList.add('guild-column-explanation');
    explanation.textContent = 'Enemy guilds pair colors from opposite sides of the circle — opposites in philosophy, in productive tension. Stranger combinations, harder to remember, but once they click, they stick.';
    col.appendChild(explanation);

    const svg = buildEnemyColorWheel();
    col.appendChild(svg);

    col.appendChild(buildGuildList(enemyGuilds));

    // Wire bidirectional hover after both SVG and list are in the DOM
    wireEnemyHover(col, svg);
  }

  const btn = document.createElement('button');
  btn.classList.add('next-session-button', 'guild-column-button');
  if (!showContent) {
    btn.classList.add('next-session-button--primary');
  }
  btn.textContent = hasCompletedSubgroup('enemy') ? 'Practice enemy guilds' : 'Learn enemy guilds';
  btn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    startSession('enemy', 'session_end_screen');
  });
  col.appendChild(btn);

  return col;
}

function showSessionEndColumns(enemyUnlocked: boolean): void {
  if (!app) return;

  const divider = document.createElement('div');
  divider.classList.add('session-next-divider');
  app.appendChild(divider);

  const container = document.createElement('div');
  container.classList.add('guild-columns');
  container.appendChild(buildAlliedColumn());
  container.appendChild(buildEnemyColumn(enemyUnlocked));
  app.appendChild(container);
}

function showSessionEnd(cardsShown?: number): void {
  if (!app || !session) return;

  const actualCount = cardsShown ?? session.cardCount;

  // Mark enemy progression if this was a completed enemy session
  if (session.subgroup === 'enemy' && session.completed) {
    const justUnlocked = markEnemyUnlocked();
    if (justUnlocked && sessionSpan) {
      addSpanEvent(sessionSpan, 'progression.enemy_unlocked', {
        'progression.trigger': 'enemy_session_complete',
      });
    }
  }

  // Mark subgroup as completed when the session ends (completed or stopped after seeing cards)
  markSubgroupCompleted(session.subgroup);

  const enemyUnlocked = isEnemyUnlocked();

  app.innerHTML = '';
  const endScreen = document.createElement('div');
  endScreen.classList.add('session-end');

  // Skip self-assessment if too few cards were shown — go straight to guild columns
  if (actualCount <= SELF_ASSESSMENT_MIN_CARDS) {
    endSessionSpan(actualCount);
    showSessionEndColumns(enemyUnlocked);
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

  // Self-assessment prompt
  const assessmentSection = document.createElement('div');
  assessmentSection.classList.add('self-assessment');

  const prompt = document.createElement('div');
  prompt.classList.add('self-assessment-prompt');
  prompt.textContent = 'How did that feel?';
  assessmentSection.appendChild(prompt);

  const buttonRow = document.createElement('div');
  buttonRow.classList.add('self-assessment-buttons');

  for (const option of ASSESSMENT_OPTIONS) {
    const btn = document.createElement('button');
    btn.classList.add('self-assessment-button');
    btn.textContent = option.label;
    btn.addEventListener('click', () => {
      // Record self-assessment on the session span before ending it
      if (sessionSpan) {
        sessionSpan.setAttribute('session.self_assessment', option.value);
        addSpanEvent(sessionSpan, 'session.self_assessment', {
          'assessment.value': option.value,
        });
      }

      // Now end the session span with all attributes
      endSessionSpan(actualCount);

      // Remove the assessment UI and count/label, then show two-column layout
      assessmentSection.remove();
      countEl.remove();
      labelEl.remove();
      showSessionEndColumns(enemyUnlocked);
    });
    buttonRow.appendChild(btn);
  }

  assessmentSection.appendChild(buttonRow);
  endScreen.appendChild(assessmentSection);

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
    'session.enemy_unlocked': isEnemyUnlocked(),
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

  // Populate version in settings panel
  const settingsVersionEl = document.getElementById('settings-version');
  if (settingsVersionEl) {
    settingsVersionEl.textContent = `v${APP_VERSION}`;
  }

  // Settings panel open/close
  const gearBtn = document.getElementById('settings-gear-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const settingsCloseBtn = document.getElementById('settings-close-btn');

  function openSettings(): void {
    if (settingsPanel) settingsPanel.hidden = false;
    if (settingsBackdrop) settingsBackdrop.hidden = false;
    if (settingsPanel) settingsPanel.removeAttribute('aria-hidden');
    if (settingsBackdrop) settingsBackdrop.removeAttribute('aria-hidden');
  }

  function closeSettings(): void {
    if (settingsPanel) settingsPanel.hidden = true;
    if (settingsBackdrop) settingsBackdrop.hidden = true;
  }

  gearBtn?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    openSettings();
  });

  settingsCloseBtn?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    closeSettings();
  });

  settingsBackdrop?.addEventListener('click', () => {
    closeSettings();
  });

  // Reset progress button
  const resetBtn = document.getElementById('settings-reset-btn');
  resetBtn?.addEventListener('click', () => {
    // Emit telemetry event before clearing
    if (sessionSpan) {
      addSpanEvent(sessionSpan, 'settings.reset_progress', {
        'reset.app_version': APP_VERSION,
      });
    }
    localStorage.removeItem('sparrow-deck.progression');
    window.location.reload();
  });

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

  welcomeScreenLoadTime = Date.now();
  document.getElementById('start-button')?.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    startSession();
  });
});
