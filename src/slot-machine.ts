import { colorEmojiMap } from './data/combos';

const SYMBOLS = Object.values(colorEmojiMap); // [sun, water, skull, fire, leaf]
const SYMBOL_SIZE = 120; // px, must match CSS .slot-symbol height

let currentIndex = 0;
let spinning = false;
let lastWheelSpinTime = 0;
const WHEEL_COOLDOWN_MS = 700;

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

async function advance(reel: HTMLElement, direction: 1 | -1) {
  if (spinning) return;
  spinning = true;

  const nextIndex = (currentIndex + direction + SYMBOLS.length) % SYMBOLS.length;
  await spinTo(reel, nextIndex);
  currentIndex = nextIndex;

  spinning = false;
}

document.addEventListener('DOMContentLoaded', () => {
  const reel = document.getElementById('reel')!;
  const lever = document.getElementById('lever') as HTMLButtonElement;
  const slotWindow = document.querySelector('.slot-window') as HTMLElement;

  buildReel(reel);

  lever.addEventListener('click', () => advance(reel, 1));

  // Scroll (wheel) inside the window moves one slot per gesture.
  // Trackpads fire dozens of wheel events per swipe — use a timestamp
  // gate that blocks all events for 1s after firing, which outlasts
  // both the transition (600ms) and the trailing inertia events.
  slotWindow.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelSpinTime < WHEEL_COOLDOWN_MS) return;
    lastWheelSpinTime = now;

    const direction = e.deltaY > 0 ? 1 : -1;
    advance(reel, direction as 1 | -1);
  }, { passive: false });
});
