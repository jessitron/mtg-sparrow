import { Slide } from '../session';
import { renderPips } from './pips';

export function createCardShell(): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card');
  return card;
}

export function fillCard(card: HTMLElement, slide: Slide): void {
  const newChildren: HTMLElement[] = [];

  if (slide.selectedCard) {
    // Toggle class before replaceChildren so layout only recalculates once
    card.classList.add('card--with-image');

    // Left column: card image
    const imgCol = document.createElement('div');
    imgCol.classList.add('card-image-column');

    const img = document.createElement('img');
    img.classList.add('mtg-card-img');
    img.width = 250;
    img.height = 350;
    img.src = slide.selectedCard.imageUrl;
    img.alt = '';
    img.onerror = () => {
      card.classList.remove('card--with-image');
      imgCol.style.display = 'none';
    };
    imgCol.appendChild(img);
    newChildren.push(imgCol);

    // Right column: pips + name
    const quizCol = document.createElement('div');
    quizCol.classList.add('card-quiz-column');
    quizCol.appendChild(renderPips(slide.colors));

    const name = document.createElement('div');
    name.classList.add('card-name');
    name.classList.add('card-name-hidden');
    name.textContent = slide.name;
    quizCol.appendChild(name);

    newChildren.push(quizCol);
  } else {
    // Toggle class before replaceChildren so layout only recalculates once
    card.classList.remove('card--with-image');

    // Original layout: no card image
    newChildren.push(renderPips(slide.colors));

    const name = document.createElement('div');
    name.classList.add('card-name');
    name.classList.add('card-name-hidden');
    name.textContent = slide.name;
    newChildren.push(name);
  }

  // Atomically swap all children — no empty-card frame
  card.replaceChildren(...newChildren);
}

export function revealName(card: HTMLElement): void {
  const name = card.querySelector('.card-name');
  if (name) {
    name.classList.remove('card-name-hidden');
  }
}
