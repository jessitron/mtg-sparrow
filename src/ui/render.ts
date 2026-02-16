import { ColorCombo } from '../data/combos';
import { renderPips } from './pips';

export function renderCard(combo: ColorCombo): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card');

  const pips = renderPips(combo.colors);
  card.appendChild(pips);

  const name = document.createElement('div');
  name.classList.add('card-name');
  name.textContent = combo.name;
  card.appendChild(name);

  return card;
}
