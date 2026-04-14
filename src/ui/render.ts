import { Slide } from '../session';
import { renderPips } from './pips';

export function createCardShell(): HTMLElement {
  const card = document.createElement('div');
  card.classList.add('card');
  return card;
}

function buildNameStack(slide: Slide, poolNames: string[]): HTMLElement {
  const stack = document.createElement('div');
  stack.classList.add('card-name-stack');

  for (const name of poolNames) {
    const nameEl = document.createElement('div');
    nameEl.classList.add('card-name');
    nameEl.classList.add('card-name-hidden');
    nameEl.textContent = name;
    if (name === slide.name) {
      nameEl.dataset.active = 'true';
    }
    stack.appendChild(nameEl);
  }

  return stack;
}

export function fillCard(card: HTMLElement, slide: Slide, poolNames: string[]): void {
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

    // Right column: pips + name stack
    const quizCol = document.createElement('div');
    quizCol.classList.add('card-quiz-column');
    quizCol.appendChild(renderPips(slide.colors));
    quizCol.appendChild(buildNameStack(slide, poolNames));
    newChildren.push(quizCol);
  } else {
    // Toggle class before replaceChildren so layout only recalculates once
    card.classList.remove('card--with-image');

    // Original layout: no card image
    newChildren.push(renderPips(slide.colors));
    newChildren.push(buildNameStack(slide, poolNames));
  }

  // Atomically swap all children — no empty-card frame
  card.replaceChildren(...newChildren);
}

export function revealName(card: HTMLElement): void {
  const name = card.querySelector('.card-name[data-active="true"]');
  if (name) {
    name.classList.remove('card-name-hidden');
  }
}
