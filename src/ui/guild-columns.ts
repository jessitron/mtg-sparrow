import { renderPip } from './pips';
import { alliedGuilds, enemyGuilds, ColorCombo } from '../data/combos';
import { guildDescriptionMap } from '../data/guild-descriptions';
import { startSpan, endSpan } from '../telemetry/telemetry';
import { hasCompletedSubgroup } from '../progression';
import { GuildSubgroup } from '../session';

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

// Maps guild id → guild name
const guildIdToName: Record<string, string> = {};
for (const guild of [...alliedGuilds, ...enemyGuilds]) {
  guildIdToName[guild.id] = guild.name;
}

function buildGuildList(guilds: ColorCombo[]): HTMLElement {
  const list = document.createElement('ul');
  list.classList.add('level-section-list');

  for (const guild of guilds) {
    const li = document.createElement('li');
    li.classList.add('level-section-item');
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
 * Returns a clearSelection function that can be called by the other column to
 * deselect any active selection (used for cross-column deselect).
 * @param col - the guild column element containing both the SVG and list
 * @param svg - the color wheel SVG element
 * @param pairs - the color pairs corresponding to lines in the SVG
 * @param lineClass - CSS class for line groups (e.g. 'ally-line')
 * @param crestId - id of the crest image element within the SVG
 * @param onActivate - callback invoked when a selection is made (used to clear the sibling column)
 */
function wireColorWheelHover(
  col: HTMLElement,
  svg: SVGSVGElement,
  pairs: [string, string][],
  lineClass: string,
  crestId: string,
  onActivate: () => void = () => {},
): () => void {
  // Track tap-selected pair for mobile (null = nothing selected)
  let selectedPair: [string, string] | null = null;

  const crestImg = svg.getElementById(crestId) as SVGImageElement | null;
  const flavorNameEl = col.querySelector<HTMLElement>('.level-section-flavor-name');
  const flavorDescEl = col.querySelector<HTMLElement>('.level-section-flavor-desc');
  const scryfallLinkEl = col.querySelector<HTMLAnchorElement>('.level-section-scryfall-link');

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
      col.classList.add('level-section--has-highlight');
      if (crestImg) {
        const src = `images/${guildId}.png`;
        crestImg.setAttributeNS(XLINK_NS, 'href', src);
        crestImg.setAttribute('href', src);
        crestImg.setAttribute('opacity', '1');
      }
      if (flavorNameEl) {
        flavorNameEl.textContent = guildIdToName[guildId] ?? guildId;
      }
      const desc = guildDescriptionMap[guildId];
      if (flavorDescEl) {
        flavorDescEl.textContent = desc?.description ?? '';
      }
      if (scryfallLinkEl) {
        scryfallLinkEl.href = desc?.scryfallUrl ?? '#';
        scryfallLinkEl.textContent = `More ${guildIdToName[guildId] ?? guildId} cards →`;
        scryfallLinkEl.dataset.guildId = guildId;
      }
      const hlSpan = startSpan('end.guild_highlight', { 'guild.id': guildId });
      endSpan(hlSpan);
    } else {
      lineEl?.classList.remove('highlight');
      nodeA?.classList.remove('highlight');
      nodeB?.classList.remove('highlight');
      listItem?.classList.remove('highlight');
      col.classList.remove('level-section--has-highlight');
      if (crestImg) {
        crestImg.setAttribute('opacity', '0');
      }
      if (flavorNameEl) {
        flavorNameEl.textContent = '';
      }
      if (flavorDescEl) {
        flavorDescEl.textContent = '';
      }
      if (scryfallLinkEl) {
        scryfallLinkEl.textContent = '';
        scryfallLinkEl.removeAttribute('href');
        delete scryfallLinkEl.dataset.guildId;
      }
    }
  }

  // Clear any active selection in this wheel — callable externally for cross-column deselect
  function clearSelection(): void {
    if (!selectedPair) return;
    setHighlight(selectedPair[0], selectedPair[1], false);
    selectedPair = null;
  }

  // Helper: handle a click/tap selecting or deselecting a pair
  function handlePairClick(aId: string, bId: string): void {
    if (selectedPair && selectedPair[0] === aId && selectedPair[1] === bId) {
      // Same pair tapped again — deselect
      selectedPair = null;
      setHighlight(aId, bId, false);
    } else {
      // Notify sibling column to clear its selection before we set ours
      onActivate();
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

  return clearSelection;
}

function wireAlliedHover(col: HTMLElement, svg: SVGSVGElement, onActivate?: () => void): () => void {
  return wireColorWheelHover(col, svg, alliedPairs, 'ally-line', 'crest-image', onActivate);
}

function wireEnemyHover(col: HTMLElement, svg: SVGSVGElement, onActivate?: () => void): () => void {
  return wireColorWheelHover(col, svg, enemyPairs, 'enemy-line', 'crest-image-enemy', onActivate);
}

function buildAlliedColumn(
  unlocked: boolean,
  onActivate: () => void,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
): [HTMLElement, () => void] {
  const col = document.createElement('div');
  col.classList.add('level-section', 'level-section--allied');

  const showContent = unlocked || hasCompletedSubgroup('allied');
  if (!showContent) {
    col.classList.add('level-section--locked');
  }

  let clearSelection = () => {};

  if (showContent) {
    // Summary panel (left): title, description, guild list, button
    const summary = document.createElement('div');
    summary.classList.add('level-section-summary');

    const header = document.createElement('h2');
    header.classList.add('level-section-header');
    header.textContent = 'Allied Guilds';
    summary.appendChild(header);

    const explanation = document.createElement('p');
    explanation.classList.add('level-section-explanation');
    explanation.textContent = "Magic's five colors form a circle: ☀️ 💧 💀 🔥 🌿. Allied guilds are pairs of neighboring colors.";
    summary.appendChild(explanation);

    summary.appendChild(buildGuildList(alliedGuilds));

    col.appendChild(summary);

    // Wheel panel (center)
    const wheelPanel = document.createElement('div');
    wheelPanel.classList.add('level-section-wheel');
    const svg = buildAlliedColorWheel();
    wheelPanel.appendChild(svg);
    col.appendChild(wheelPanel);

    // Flavor panel (right): guild name + description + Scryfall link on highlight; Practice button always
    const flavorPanel = document.createElement('div');
    flavorPanel.classList.add('level-section-flavor');
    const flavorName = document.createElement('span');
    flavorName.classList.add('level-section-flavor-name');
    flavorPanel.appendChild(flavorName);
    const flavorDesc = document.createElement('p');
    flavorDesc.classList.add('level-section-flavor-desc');
    flavorPanel.appendChild(flavorDesc);
    const scryfallLink = document.createElement('a');
    scryfallLink.classList.add('level-section-scryfall-link');
    scryfallLink.target = '_blank';
    scryfallLink.rel = 'noopener noreferrer';
    scryfallLink.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const gid = scryfallLink.dataset.guildId;
      if (gid) {
        const span = startSpan('end.scryfall_click', { 'guild.id': gid });
        endSpan(span);
      }
    });
    flavorPanel.appendChild(scryfallLink);
    const btn = document.createElement('button');
    btn.classList.add('next-session-button', 'level-section-button');
    btn.textContent = hasCompletedSubgroup('allied') ? 'Practice' : 'Learn allied guilds';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession('allied', 'session_end_screen');
    });
    flavorPanel.appendChild(btn);
    col.appendChild(flavorPanel);

    // Wire bidirectional hover after all panels are in the DOM
    clearSelection = wireAlliedHover(col, svg, onActivate);
  } else {
    const btn = document.createElement('button');
    btn.classList.add('next-session-button', 'level-section-button', 'next-session-button--primary');
    btn.textContent = 'Learn allied guilds';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession('allied', 'session_end_screen');
    });
    col.appendChild(btn);
  }

  return [col, clearSelection];
}

function buildEnemyColumn(
  unlocked: boolean,
  onActivate: () => void,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
): [HTMLElement, () => void] {
  const col = document.createElement('div');
  col.classList.add('level-section', 'level-section--enemy');
  // Show full content if the user has practiced enemy guilds at all
  const showContent = unlocked || hasCompletedSubgroup('enemy');
  if (!showContent) {
    col.classList.add('level-section--locked');
  }

  let clearSelection = () => {};

  if (showContent) {
    // Summary panel (left): title, description, guild list, button
    const summary = document.createElement('div');
    summary.classList.add('level-section-summary');

    const header = document.createElement('h2');
    header.classList.add('level-section-header');
    header.textContent = 'Enemy Guilds';
    summary.appendChild(header);

    const explanation = document.createElement('p');
    explanation.classList.add('level-section-explanation');
    explanation.textContent = 'Enemy guilds pair colors from opposite sides of the circle.';
    summary.appendChild(explanation);

    summary.appendChild(buildGuildList(enemyGuilds));

    col.appendChild(summary);

    // Wheel panel (center)
    const wheelPanel = document.createElement('div');
    wheelPanel.classList.add('level-section-wheel');
    const svg = buildEnemyColorWheel();
    wheelPanel.appendChild(svg);
    col.appendChild(wheelPanel);

    // Flavor panel (right): guild name + description + Scryfall link on highlight; Practice button always
    const flavorPanel = document.createElement('div');
    flavorPanel.classList.add('level-section-flavor');
    const flavorName = document.createElement('span');
    flavorName.classList.add('level-section-flavor-name');
    flavorPanel.appendChild(flavorName);
    const flavorDesc = document.createElement('p');
    flavorDesc.classList.add('level-section-flavor-desc');
    flavorPanel.appendChild(flavorDesc);
    const scryfallLink = document.createElement('a');
    scryfallLink.classList.add('level-section-scryfall-link');
    scryfallLink.target = '_blank';
    scryfallLink.rel = 'noopener noreferrer';
    scryfallLink.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const gid = scryfallLink.dataset.guildId;
      if (gid) {
        const span = startSpan('end.scryfall_click', { 'guild.id': gid });
        endSpan(span);
      }
    });
    flavorPanel.appendChild(scryfallLink);
    const btn = document.createElement('button');
    btn.classList.add('next-session-button', 'level-section-button');
    btn.textContent = hasCompletedSubgroup('enemy') ? 'Practice' : 'Learn enemy guilds';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession('enemy', 'session_end_screen');
    });
    flavorPanel.appendChild(btn);
    col.appendChild(flavorPanel);

    // Wire bidirectional hover after all panels are in the DOM
    clearSelection = wireEnemyHover(col, svg, onActivate);
  } else {
    const btn = document.createElement('button');
    btn.classList.add('next-session-button', 'level-section-button', 'next-session-button--primary');
    btn.textContent = 'Learn enemy guilds';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession('enemy', 'session_end_screen');
    });
    col.appendChild(btn);
  }

  return [col, clearSelection];
}

export function showSessionEndColumns(
  app: HTMLElement,
  alliedUnlocked: boolean,
  enemyUnlocked: boolean,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
): void {
  // Placeholders for cross-column clear functions; filled in after both columns are built
  let clearAllied = () => {};
  let clearEnemy = () => {};

  const [alliedCol, clearAlliedFn] = buildAlliedColumn(alliedUnlocked, () => clearEnemy(), startSession);
  const [enemyCol, clearEnemyFn] = buildEnemyColumn(enemyUnlocked, () => clearAllied(), startSession);

  clearAllied = clearAlliedFn;
  clearEnemy = clearEnemyFn;

  const container = document.createElement('div');
  container.classList.add('level-sections');
  container.appendChild(alliedCol);
  container.appendChild(enemyCol);

  // Clicking anywhere that isn't a line or guild item clears both selections.
  // Interactive elements (lines, guild items, buttons) already call stopPropagation(),
  // so they will never reach this listener.
  document.addEventListener('click', () => {
    clearAllied();
    clearEnemy();
  });

  app.appendChild(container);
}
