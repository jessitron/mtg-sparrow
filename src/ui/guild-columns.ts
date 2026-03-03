import { renderPip } from './pips';
import { alliedGuilds, enemyGuilds, wedges, ColorCombo } from '../data/combos';
import { guildDescriptionMap } from '../data/guild-descriptions';
import { Span } from '@opentelemetry/api';
import { startChildSpan, endSpan, addSpanEvent } from '../telemetry/telemetry';
import { hasCompletedSubgroup } from '../progression';
import { GuildSubgroup } from '../session';

// Mutable ref so hover handlers always use the current section span
type SpanRef = { current: Span };

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

// Wedge triples: each is [primary color, enemy1, enemy2]
const wedgeTriples: [string, string, string][] = [
  ['white', 'black', 'green'],   // Abzan
  ['blue',  'red',   'white'],   // Jeskai
  ['black', 'green', 'blue'],    // Sultai
  ['red',   'white', 'black'],   // Mardu
  ['green', 'blue',  'red'],     // Temur
];

// Maps sorted 3-color code key (e.g. "BGW") → wedge combo id
const colorTripleToComboId: Record<string, string> = {};
for (const wedge of wedges) {
  const key = [...wedge.colors].sort().join('');
  colorTripleToComboId[key] = wedge.id;
}

/**
 * Build the flavor panel with all guild descriptions pre-rendered and stacked.
 * Only the active guild's entry is visible; the tallest sets the panel height.
 */
function buildFlavorPanel(
  guilds: ColorCombo[],
  subgroup: GuildSubgroup,
  sectionSpanRef: SpanRef,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
): HTMLElement {
  const flavorPanel = document.createElement('div');
  flavorPanel.classList.add('level-section-flavor');

  // Stack container: all entries occupy the same grid cell
  const stack = document.createElement('div');
  stack.classList.add('level-section-flavor-stack');

  for (const guild of guilds) {
    const entry = document.createElement('div');
    entry.classList.add('level-section-flavor-entry');
    entry.dataset.guildId = guild.id;

    const name = document.createElement('span');
    name.classList.add('level-section-flavor-name');
    name.textContent = guild.name;
    entry.appendChild(name);

    const desc = guildDescriptionMap[guild.id];
    if (desc) {
      const descEl = document.createElement('p');
      descEl.classList.add('level-section-flavor-desc');
      descEl.textContent = desc.description;
      entry.appendChild(descEl);

      const link = document.createElement('a');
      link.classList.add('level-section-scryfall-link');
      link.href = desc.scryfallUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `More ${guild.name} cards →`;
      link.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const span = startChildSpan('end.scryfall_click', sectionSpanRef.current, { 'guild.id': guild.id });
        endSpan(span);
      });
      entry.appendChild(link);
    }

    stack.appendChild(entry);
  }

  flavorPanel.appendChild(stack);

  // Practice/Learn button — always visible, outside the stack
  const btn = document.createElement('button');
  btn.classList.add('next-session-button', 'level-section-button');
  btn.textContent = hasCompletedSubgroup(subgroup) ? 'Practice' : `Learn ${subgroup} guilds`;
  btn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    startSession(subgroup, 'session_end_screen');
  });
  flavorPanel.appendChild(btn);

  return flavorPanel;
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
 * Build a triangle wheel SVG for wedge combos.
 * Each triple is rendered as a polygon (triangle) connecting 3 color nodes.
 */
function buildTriangleWheel(
  triples: [string, string, string][],
  wheelClass: string,
  triClass: string,
  triVisClass: string,
  triHitClass: string,
  crestId: string,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.setAttribute('xmlns', SVG_NS);
  svg.classList.add(wheelClass);

  // Draw triangles first (behind nodes)
  for (const [aId, bId, cId] of triples) {
    const a = colorNodes.find(n => n.id === aId)!;
    const b = colorNodes.find(n => n.id === bId)!;
    const c = colorNodes.find(n => n.id === cId)!;
    const points = `${a.cx},${a.cy} ${b.cx},${b.cy} ${c.cx},${c.cy}`;
    const groupId = `tri-${aId}-${bId}-${cId}`;

    const triGroup = document.createElementNS(SVG_NS, 'g');
    triGroup.setAttribute('id', groupId);
    triGroup.classList.add(triClass);

    // Wide transparent hit-area polygon
    const hitPoly = document.createElementNS(SVG_NS, 'polygon');
    hitPoly.classList.add(triHitClass);
    hitPoly.setAttribute('points', points);
    hitPoly.setAttribute('fill', 'transparent');
    hitPoly.setAttribute('stroke', 'transparent');
    hitPoly.setAttribute('stroke-width', '16');
    hitPoly.setAttribute('pointer-events', 'fill');
    triGroup.appendChild(hitPoly);

    // Visible polygon
    const visPoly = document.createElementNS(SVG_NS, 'polygon');
    visPoly.classList.add(triVisClass);
    visPoly.setAttribute('points', points);
    visPoly.setAttribute('pointer-events', 'none');
    triGroup.appendChild(visPoly);

    svg.appendChild(triGroup);
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

  // Crest image in center
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
  sectionSpanRef: SpanRef,
  onActivate: () => void = () => {},
): () => void {
  // Track tap-selected pair for mobile (null = nothing selected)
  let selectedPair: [string, string] | null = null;

  const crestImg = svg.getElementById(crestId) as SVGImageElement | null;
  const flavorEntries = col.querySelectorAll<HTMLElement>('.level-section-flavor-entry');

  // Helper: set/clear highlight class on all related elements for a given pair
  function setHighlight(aId: string, bId: string, on: boolean): void {
    const lineEl = svg.getElementById(`line-${aId}-${bId}`);
    const nodeA  = svg.getElementById(`node-${aId}`);
    const nodeB  = svg.getElementById(`node-${bId}`);
    const guildId = colorPairToGuildId[[colorNodeToCode[aId], colorNodeToCode[bId]].sort().join('')];
    const listItem = col.querySelector<HTMLElement>(`.level-section-item[data-guild-id="${guildId}"]`);

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
      // Activate the matching flavor entry
      flavorEntries.forEach(entry => {
        entry.classList.toggle('active', entry.dataset.guildId === guildId);
      });
      const hlSpan = startChildSpan('end.guild_highlight', sectionSpanRef.current, { 'guild.id': guildId });
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
      // Deactivate all flavor entries
      flavorEntries.forEach(entry => entry.classList.remove('active'));
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

function wireAlliedHover(col: HTMLElement, svg: SVGSVGElement, sectionSpanRef: SpanRef, onActivate?: () => void): () => void {
  return wireColorWheelHover(col, svg, alliedPairs, 'ally-line', 'crest-image', sectionSpanRef, onActivate);
}

function wireEnemyHover(col: HTMLElement, svg: SVGSVGElement, sectionSpanRef: SpanRef, onActivate?: () => void): () => void {
  return wireColorWheelHover(col, svg, enemyPairs, 'enemy-line', 'crest-image-enemy', sectionSpanRef, onActivate);
}

/**
 * Wire hover, click, and tap-select for a triangle wheel.
 * Works like wireColorWheelHover but for triples.
 */
function wireTriangleWheelHover(
  col: HTMLElement,
  svg: SVGSVGElement,
  triples: [string, string, string][],
  triClass: string,
  crestId: string,
  sectionSpanRef: SpanRef,
  onActivate: () => void = () => {},
): () => void {
  let selectedTriple: [string, string, string] | null = null;

  const crestImg = svg.getElementById(crestId) as SVGImageElement | null;
  const flavorEntries = col.querySelectorAll<HTMLElement>('.level-section-flavor-entry');

  function setHighlight(aId: string, bId: string, cId: string, on: boolean): void {
    const groupId = `tri-${aId}-${bId}-${cId}`;
    const triEl = svg.getElementById(groupId);
    const nodeA  = svg.getElementById(`node-${aId}`);
    const nodeB  = svg.getElementById(`node-${bId}`);
    const nodeC  = svg.getElementById(`node-${cId}`);
    const key = [colorNodeToCode[aId], colorNodeToCode[bId], colorNodeToCode[cId]].sort().join('');
    const comboId = colorTripleToComboId[key];
    const listItem = col.querySelector<HTMLElement>(`.level-section-item[data-guild-id="${comboId}"]`);

    if (on) {
      triEl?.classList.add('highlight');
      nodeA?.classList.add('highlight');
      nodeB?.classList.add('highlight');
      nodeC?.classList.add('highlight');
      listItem?.classList.add('highlight');
      col.classList.add('level-section--has-highlight');
      if (crestImg && comboId) {
        const src = `images/${comboId}.png`;
        crestImg.setAttributeNS(XLINK_NS, 'href', src);
        crestImg.setAttribute('href', src);
        crestImg.setAttribute('opacity', '1');
      }
      flavorEntries.forEach(entry => {
        entry.classList.toggle('active', entry.dataset.guildId === comboId);
      });
      if (comboId) {
        const hlSpan = startChildSpan('end.guild_highlight', sectionSpanRef.current, { 'guild.id': comboId });
        endSpan(hlSpan);
      }
    } else {
      triEl?.classList.remove('highlight');
      nodeA?.classList.remove('highlight');
      nodeB?.classList.remove('highlight');
      nodeC?.classList.remove('highlight');
      listItem?.classList.remove('highlight');
      col.classList.remove('level-section--has-highlight');
      if (crestImg) crestImg.setAttribute('opacity', '0');
      flavorEntries.forEach(entry => entry.classList.remove('active'));
    }
  }

  function clearSelection(): void {
    if (!selectedTriple) return;
    setHighlight(selectedTriple[0], selectedTriple[1], selectedTriple[2], false);
    selectedTriple = null;
  }

  function handleTripleClick(aId: string, bId: string, cId: string): void {
    if (selectedTriple && selectedTriple[0] === aId && selectedTriple[1] === bId && selectedTriple[2] === cId) {
      selectedTriple = null;
      setHighlight(aId, bId, cId, false);
    } else {
      onActivate();
      if (selectedTriple) {
        setHighlight(selectedTriple[0], selectedTriple[1], selectedTriple[2], false);
      }
      selectedTriple = [aId, bId, cId];
      setHighlight(aId, bId, cId, true);
    }
  }

  // Wire hover and click on each triangle group
  for (const [aId, bId, cId] of triples) {
    const groupId = `tri-${aId}-${bId}-${cId}`;
    const triEl = svg.getElementById(groupId);
    if (!triEl) continue;
    triEl.addEventListener('mouseenter', () => {
      if (selectedTriple) return;
      setHighlight(aId, bId, cId, true);
    });
    triEl.addEventListener('mouseleave', () => {
      if (selectedTriple) return;
      setHighlight(aId, bId, cId, false);
    });
    triEl.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      handleTripleClick(aId, bId, cId);
    });
  }

  // Wire hover and click on each wedge list item
  for (const [aId, bId, cId] of triples) {
    const key = [colorNodeToCode[aId], colorNodeToCode[bId], colorNodeToCode[cId]].sort().join('');
    const comboId = colorTripleToComboId[key];
    const listItem = col.querySelector<HTMLElement>(`[data-guild-id="${comboId}"]`);
    if (!listItem) continue;
    listItem.addEventListener('mouseenter', () => {
      if (selectedTriple) return;
      setHighlight(aId, bId, cId, true);
    });
    listItem.addEventListener('mouseleave', () => {
      if (selectedTriple) return;
      setHighlight(aId, bId, cId, false);
    });
    listItem.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      handleTripleClick(aId, bId, cId);
    });
  }

  return clearSelection;
}

function buildAlliedColumn(
  unlocked: boolean,
  onActivate: () => void,
  sectionSpanRef: SpanRef,
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

    // Flavor panel (right): all guild descriptions pre-rendered and stacked
    col.appendChild(buildFlavorPanel(alliedGuilds, 'allied', sectionSpanRef, startSession));

    // Wire bidirectional hover after all panels are in the DOM
    clearSelection = wireAlliedHover(col, svg, sectionSpanRef, onActivate);
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
  sectionSpanRef: SpanRef,
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

    // Flavor panel (right): all guild descriptions pre-rendered and stacked
    col.appendChild(buildFlavorPanel(enemyGuilds, 'enemy', sectionSpanRef, startSession));

    // Wire bidirectional hover after all panels are in the DOM
    clearSelection = wireEnemyHover(col, svg, sectionSpanRef, onActivate);
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

function buildWedgeColumn(
  unlocked: boolean,
  onActivate: () => void,
  sectionSpanRef: SpanRef,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
): [HTMLElement, () => void] {
  const col = document.createElement('div');
  col.classList.add('level-section', 'level-section--wedges');

  const showContent = unlocked || hasCompletedSubgroup('wedges');
  if (!showContent) {
    col.classList.add('level-section--locked');
  }

  let clearSelection = () => {};

  if (showContent) {
    // Summary panel (left): title, description, combo list
    const summary = document.createElement('div');
    summary.classList.add('level-section-summary');

    const header = document.createElement('h2');
    header.classList.add('level-section-header');
    header.textContent = 'Wedges';
    summary.appendChild(header);

    const explanation = document.createElement('p');
    explanation.classList.add('level-section-explanation');
    explanation.textContent = "Wedges combine one color with its two enemies — three colors that don't naturally agree.";
    summary.appendChild(explanation);

    summary.appendChild(buildGuildList(wedges));

    col.appendChild(summary);

    // Wheel panel (center)
    const wheelPanel = document.createElement('div');
    wheelPanel.classList.add('level-section-wheel');
    const svg = buildTriangleWheel(wedgeTriples, 'wedge-color-wheel', 'wedge-triangle', 'wedge-triangle-vis', 'wedge-triangle-hit', 'crest-image-wedge');
    wheelPanel.appendChild(svg);
    col.appendChild(wheelPanel);

    // Flavor panel (right)
    col.appendChild(buildFlavorPanel(wedges, 'wedges', sectionSpanRef, startSession));

    // Wire hover after all panels are in the DOM
    clearSelection = wireTriangleWheelHover(col, svg, wedgeTriples, 'wedge-triangle', 'crest-image-wedge', sectionSpanRef, onActivate);
  } else {
    const btn = document.createElement('button');
    btn.classList.add('next-session-button', 'level-section-button', 'next-session-button--primary');
    btn.textContent = 'Learn wedges';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession('wedges', 'session_end_screen');
    });
    col.appendChild(btn);
  }

  return [col, clearSelection];
}

// --- Reel navigation (slot-machine feel) ---

const REEL_TRANSITION = 'transform 600ms cubic-bezier(0.2, 0.8, 0.3, 1.05)';
const WHEEL_DELTA_THRESHOLD = 700;

let reelIndex = 0;
let reelSpinning = false;
let reelAccumulatedDelta = 0;

function reelSpinTo(
  reel: HTMLElement,
  viewport: HTMLElement,
  sections: HTMLElement[],
  index: number,
): Promise<void> {
  return new Promise((resolve) => {
    // Calculate Y offset by summing heights of preceding sections
    let targetY = 0;
    for (let i = 0; i < index; i++) {
      targetY += sections[i].offsetHeight;
    }

    reel.style.transition = REEL_TRANSITION;
    reel.style.transform = `translateY(${-targetY}px)`;

    // Animate viewport height to match the target section
    viewport.style.height = `${sections[index].offsetHeight}px`;

    reel.addEventListener('transitionend', function handler(e: TransitionEvent) {
      if (e.target !== reel) return;
      reel.removeEventListener('transitionend', handler);
      resolve();
    });
  });
}

const SECTION_LABELS = ['allied', 'enemy', 'wedges', 'share'];

function startSectionSpan(pageSpan: Span, index: number): Span {
  return startChildSpan('end.section_view', pageSpan, {
    'end.section': SECTION_LABELS[index] ?? `section_${index}`,
    'end.section_index': index,
  });
}

async function reelAdvance(
  reel: HTMLElement,
  viewport: HTMLElement,
  sections: HTMLElement[],
  direction: 1 | -1,
  pageSpan: Span,
  sectionSpanRef: SpanRef,
  onNavigate?: () => void,
) {
  if (reelSpinning) return;

  const nextIndex = reelIndex + direction;
  if (nextIndex < 0 || nextIndex >= sections.length) return;

  reelSpinning = true;
  reelIndex = nextIndex;

  // Update nav buttons immediately so arrows animate alongside the reel
  onNavigate?.();

  // End the current section span, start the new one
  endSpan(sectionSpanRef.current);
  sectionSpanRef.current = startSectionSpan(pageSpan, nextIndex);

  await reelSpinTo(reel, viewport, sections, nextIndex);

  reelSpinning = false;
}

/** Returns a cleanup function that ends the current section span. */
export function showSessionEndColumns(
  app: HTMLElement,
  alliedUnlocked: boolean,
  enemyUnlocked: boolean,
  wedgesUnlocked: boolean,
  pageSpan: Span,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
  initialSubgroup?: GuildSubgroup,
): () => void {
  const initialIndex = initialSubgroup === 'enemy' ? 1
    : initialSubgroup === 'wedges' ? 2
    : 0;
  reelIndex = initialIndex;

  // Start the first section span; interactions nest under it
  const sectionSpanRef: SpanRef = { current: startSectionSpan(pageSpan, initialIndex) };

  // Placeholders for cross-column clear functions; filled in after all columns are built
  let clearAllied = () => {};
  let clearEnemy = () => {};
  let clearWedge = () => {};

  const [alliedCol, clearAlliedFn] = buildAlliedColumn(alliedUnlocked, () => { clearEnemy(); clearWedge(); }, sectionSpanRef, startSession);
  const [enemyCol, clearEnemyFn] = buildEnemyColumn(enemyUnlocked, () => { clearAllied(); clearWedge(); }, sectionSpanRef, startSession);
  const [wedgeCol, clearWedgeFn] = buildWedgeColumn(wedgesUnlocked, () => { clearAllied(); clearEnemy(); }, sectionSpanRef, startSession);

  clearAllied = clearAlliedFn;
  clearEnemy = clearEnemyFn;
  clearWedge = clearWedgeFn;

  // Build share section (placeholder — real implementation comes later)
  const shareSection = document.createElement('div');
  shareSection.classList.add('level-section', 'level-section--share');
  const shareHeader = document.createElement('h2');
  shareHeader.textContent = 'Share';
  shareSection.appendChild(shareHeader);

  // Build reel structure: viewport clips to one section, reel translates
  const sections = [alliedCol, enemyCol, wedgeCol, shareSection];

  const reel = document.createElement('div');
  reel.classList.add('level-sections-reel');
  for (const section of sections) {
    reel.appendChild(section);
  }

  const viewport = document.createElement('div');
  viewport.classList.add('level-sections-viewport');
  viewport.appendChild(reel);

  // Top button: up chevron shape (clip-path in CSS)
  const topBtn = document.createElement('button');
  topBtn.classList.add('reel-nav-btn', 'reel-nav-btn--top');
  topBtn.setAttribute('aria-label', 'Scroll up');

  // Bottom button: down chevron shape (clip-path in CSS)
  const bottomBtn = document.createElement('button');
  bottomBtn.classList.add('reel-nav-btn', 'reel-nav-btn--bottom');
  bottomBtn.setAttribute('aria-label', 'Scroll down');

  function updateNavButtons() {
    const atTop = reelIndex <= 0;
    const atEnd = reelIndex >= sections.length - 1;

    if (atTop) {
      topBtn.classList.add('reel-nav-btn--hidden');
    } else {
      topBtn.classList.remove('reel-nav-btn--hidden');
    }

    if (atEnd) {
      bottomBtn.classList.add('reel-nav-btn--hidden');
    } else {
      bottomBtn.classList.remove('reel-nav-btn--hidden');
    }

    const nextLabel = SECTION_LABELS[reelIndex + 1];
    const nextIsNewLevel = (nextLabel === 'allied' || nextLabel === 'enemy' || nextLabel === 'wedges') && !hasCompletedSubgroup(nextLabel);

    if (!atEnd && nextIsNewLevel) {
      bottomBtn.textContent = 'Next Level';
      bottomBtn.classList.add('reel-nav-btn--has-label');
    } else {
      bottomBtn.textContent = '';
      bottomBtn.classList.remove('reel-nav-btn--has-label');
    }
  }

  topBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    if (reelIndex <= 0) return;
    reelAdvance(reel, viewport, sections, -1, pageSpan, sectionSpanRef, updateNavButtons);
  });

  bottomBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    reelAdvance(reel, viewport, sections, 1, pageSpan, sectionSpanRef, updateNavButtons);
  });

  // Clicking anywhere that isn't a line or guild item clears all selections.
  document.addEventListener('click', () => {
    clearAllied();
    clearEnemy();
    clearWedge();
  });

  app.appendChild(topBtn);
  app.appendChild(viewport);
  app.appendChild(bottomBtn);

  // Set initial viewport height and position, then wire scroll navigation
  requestAnimationFrame(() => {
    // Position reel at the initial section without animation
    if (initialIndex > 0) {
      let targetY = 0;
      for (let i = 0; i < initialIndex; i++) {
        targetY += sections[i].offsetHeight;
      }
      reel.style.transform = `translateY(${-targetY}px)`;
    }
    viewport.style.height = `${sections[initialIndex].offsetHeight}px`;
    updateNavButtons();

    document.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      const wasZero = reelAccumulatedDelta === 0;

      // If direction reversed, reset accumulator to start fresh in new direction
      const directionChanged = (e.deltaY > 0 && reelAccumulatedDelta < 0) || (e.deltaY < 0 && reelAccumulatedDelta > 0);
      if (directionChanged) {
        reelAccumulatedDelta = e.deltaY;
      } else {
        reelAccumulatedDelta += e.deltaY;
      }

      const direction = reelAccumulatedDelta > 0 ? 1 : reelAccumulatedDelta < 0 ? -1 : 0;
      const nextIndex = reelIndex + direction;
      const thresholdReached = Math.abs(reelAccumulatedDelta) >= WHEEL_DELTA_THRESHOLD;

      let action: string;
      if (wasZero) {
        action = 'gesture_start';
      } else if (directionChanged) {
        action = 'direction_change';
      } else if (!thresholdReached) {
        action = 'accumulating';
      } else if (reelSpinning) {
        action = 'suppressed_spinning';
      } else if (nextIndex < 0 || nextIndex >= sections.length) {
        action = 'suppressed_bounds';
      } else {
        action = 'advance';
      }

      if (action !== 'accumulating') {
        addSpanEvent(sectionSpanRef.current, 'end.wheel_event', {
          'wheel.deltaY': Math.round(e.deltaY),
          'wheel.accumulated_deltaY': Math.round(reelAccumulatedDelta),
          'wheel.direction': direction,
          'wheel.current_index': reelIndex,
          'wheel.reel_spinning': reelSpinning,
          'wheel.action': action,
        });
      }

      if (action !== 'advance') return;
      reelAccumulatedDelta = 0;

      reelAdvance(reel, viewport, sections, direction as 1 | -1, pageSpan, sectionSpanRef, updateNavButtons);
    }, { passive: false });
  });

  // Return cleanup: end the current section span when the page is done
  return () => endSpan(sectionSpanRef.current);
}
