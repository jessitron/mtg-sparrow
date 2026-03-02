import { colorEmojiMap } from './data/combos';

const SYMBOLS = Object.values(colorEmojiMap); // [sun, water, skull, fire, leaf]
const SYMBOL_SIZE = 120; // px, must match CSS .slot-symbol height

let currentIndex = 0;
let spinning = false;

function buildReel(reel: HTMLElement) {
  reel.innerHTML = '';
  for (const sym of SYMBOLS) {
    const div = document.createElement('div');
    div.className = 'slot-symbol';
    div.textContent = sym;
    reel.appendChild(div);
  }
  // Position at first symbol
  reel.style.transform = `translateY(0px)`;
}

function spinTo(reel: HTMLElement, targetIndex: number): Promise<void> {
  return new Promise((resolve) => {
    const targetY = -(targetIndex * SYMBOL_SIZE);

    // Cubic bezier: fast start, gentle overshoot, settle back
    // This is the "slot machine feel" — it overshoots slightly then bounces back
    reel.style.transition = `transform 600ms cubic-bezier(0.2, 0.8, 0.3, 1.05)`;
    reel.style.transform = `translateY(${targetY}px)`;

    reel.addEventListener('transitionend', function handler() {
      reel.removeEventListener('transitionend', handler);
      resolve();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const reel = document.getElementById('reel')!;
  const lever = document.getElementById('lever') as HTMLButtonElement;

  buildReel(reel);

  lever.addEventListener('click', async () => {
    if (spinning) return;
    spinning = true;
    lever.disabled = true;

    // Move to next symbol (wrapping)
    const nextIndex = (currentIndex + 1) % SYMBOLS.length;
    await spinTo(reel, nextIndex);
    currentIndex = nextIndex;

    spinning = false;
    lever.disabled = false;
  });
});
