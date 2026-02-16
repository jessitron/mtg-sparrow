import { ColorCombo } from '../data/combos';
import { renderPips } from './pips';

export function renderCard(combo: ColorCombo): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card');

  const pips = renderPips(combo.colors);
  card.appendChild(pips);

  const name = document.createElement('div');
  name.classList.add('card-name');
  name.classList.add('card-name-hidden');
  name.textContent = combo.name;
  card.appendChild(name);

  return card;
}

export function revealName(card: HTMLElement): void {
  const name = card.querySelector('.card-name');
  if (name) {
    name.classList.remove('card-name-hidden');
  }
}
