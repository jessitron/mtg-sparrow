import { buildSequence, SlideSelection } from './sparrow-deck';

// Combo labels: A, B, C, D, E, ...
function comboLabel(comboIndex: number): string {
  return String.fromCharCode(64 + comboIndex); // 1→A, 2→B, etc.
}

// Card labels: F, G, H, ... Z (maps card index 1–21 to F–Z)
function cardLabel(cardIndex: number): string {
  return cardIndex > 0 ? String.fromCharCode(69 + cardIndex) : '–'; // 1→F, 2→G, etc.
}

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

function renderSequence(sequence: SlideSelection[]): void {
  const output = document.getElementById('output')!;
  output.innerHTML = '';

  sequence.forEach(([comboIndex, cardIndex], position) => {
    const row = document.createElement('div');
    row.className = 'sequence-row';

    const positionEl = document.createElement('span');
    positionEl.className = 'position';
    positionEl.textContent = String(position + 1).padStart(3, ' ');

    const comboEl = document.createElement('span');
    comboEl.className = 'combo-chip';
    comboEl.style.backgroundColor = getComboColor(comboIndex);
    comboEl.textContent = comboLabel(comboIndex);

    const cardEl = document.createElement('span');
    cardEl.className = 'card-index';
    cardEl.textContent = cardLabel(cardIndex);

    row.appendChild(positionEl);
    row.appendChild(comboEl);
    row.appendChild(cardEl);
    output.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const comboCountInput = document.getElementById('combo-count-input') as HTMLInputElement;
  const cardsPerComboInput = document.getElementById('cards-per-combo-input') as HTMLInputElement;
  const lengthInput = document.getElementById('length-input') as HTMLInputElement;

  generateBtn.addEventListener('click', () => {
    const comboCount = parseInt(comboCountInput.value, 10) || 5;
    const cardsPerCombo = parseInt(cardsPerComboInput.value, 10) || 10;
    const length = parseInt(lengthInput.value, 10) || 25;
    const cardCounts = Array.from({ length: comboCount }, () => cardsPerCombo);
    const sequence = buildSequence(cardCounts, length);
    renderSequence(sequence);
  });

  // Generate on load with defaults
  generateBtn.click();
});
