import { buildSequence } from './sparrow-deck';
import { alliedGuilds, enemyGuilds, wedges, shards } from './data/combos';
import type { ColorCombo } from './data/combos';

const subgroups: Record<string, ColorCombo[]> = {
  allied: alliedGuilds,
  enemy: enemyGuilds,
  wedges: wedges,
  shards: shards,
};

// Distinct background colors for up to 10 combos
const COMBO_COLORS = [
  '#1a3a5c', // deep blue
  '#3a1a1a', // deep red
  '#1a3a1a', // deep green
  '#3a2a00', // deep amber
  '#2a1a3a', // deep purple
  '#003a3a', // deep teal
  '#3a1a2a', // deep maroon
  '#1a2a00', // deep olive
  '#3a3a00', // deep yellow
  '#001a3a', // deep navy
];

function getComboColor(comboIndex: number): string {
  return COMBO_COLORS[(comboIndex - 1) % COMBO_COLORS.length];
}

function renderSequence(sequence: ReturnType<typeof buildSequence>, combos: ColorCombo[]): void {
  const output = document.getElementById('output')!;
  output.innerHTML = '';

  sequence.forEach(([comboIndex, cardIndex], position) => {
    const combo = combos[comboIndex - 1];
    const row = document.createElement('div');
    row.className = 'sequence-row';

    const positionEl = document.createElement('span');
    positionEl.className = 'position';
    positionEl.textContent = String(position + 1).padStart(3, ' ');

    const comboEl = document.createElement('span');
    comboEl.className = 'combo-chip';
    comboEl.style.backgroundColor = getComboColor(comboIndex);
    comboEl.textContent = combo ? combo.name : `Combo ${comboIndex}`;

    const indexEl = document.createElement('span');
    indexEl.className = 'combo-index';
    indexEl.textContent = `#${comboIndex}`;

    const cardEl = document.createElement('span');
    cardEl.className = 'card-index';
    cardEl.textContent = cardIndex > 0 ? `card ${cardIndex}` : 'no card';

    row.appendChild(positionEl);
    row.appendChild(comboEl);
    row.appendChild(indexEl);
    row.appendChild(cardEl);
    output.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const subgroupSelect = document.getElementById('subgroup-select') as HTMLSelectElement;
  const lengthInput = document.getElementById('length-input') as HTMLInputElement;

  generateBtn.addEventListener('click', () => {
    const subgroupKey = subgroupSelect.value;
    const combos = subgroups[subgroupKey] ?? alliedGuilds;
    const length = parseInt(lengthInput.value, 10) || 25;
    const cardCounts = combos.map(c => (c.cards ? c.cards.length : 0));
    const sequence = buildSequence(cardCounts, length);
    renderSequence(sequence, combos);
  });

  // Generate on load with defaults
  generateBtn.click();
});
