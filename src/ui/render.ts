import { Slide } from '../session';
import { renderPips } from './pips';

export function renderCard(slide: Slide): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card');

  if (slide.selectedCard) {
    card.classList.add('card--with-image');

    // Left column: card image
    const imgCol = document.createElement('div');
    imgCol.classList.add('card-image-column');

    const img = document.createElement('img');
    img.classList.add('mtg-card-img');
    img.src = slide.selectedCard.imageUrl;
    img.alt = '';
    img.width = 180;
    img.height = 252;
    imgCol.appendChild(img);
    card.appendChild(imgCol);

    // Right column: pips + name
    const quizCol = document.createElement('div');
    quizCol.classList.add('card-quiz-column');
    quizCol.appendChild(renderPips(slide.colors));

    const name = document.createElement('div');
    name.classList.add('card-name');
    name.classList.add('card-name-hidden');
    name.textContent = slide.name;
    quizCol.appendChild(name);

    card.appendChild(quizCol);
  } else {
    // Original layout: no card image
    card.appendChild(renderPips(slide.colors));

    const name = document.createElement('div');
    name.classList.add('card-name');
    name.classList.add('card-name-hidden');
    name.textContent = slide.name;
    card.appendChild(name);
  }

  return card;
}

export function revealName(card: HTMLElement): void {
  const name = card.querySelector('.card-name');
  if (name) {
    name.classList.remove('card-name-hidden');
  }
}
