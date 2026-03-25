import { ColorCombo } from './data/combos';
import { Slide } from './session';

/**
 * Shuffle an array in place using Fisher-Yates.
 * Returns the same array (mutated).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a deck of `count` slides by shuffling the source combos
 * and repeating as needed. Each slide pre-selects a random card image.
 */
export function buildDeck(combos: ColorCombo[], count: number): Slide[] {
  const deck: Slide[] = [];
  while (deck.length < count) {
    const batch = shuffle([...combos]);
    for (const combo of batch) {
      if (deck.length >= count) break;
      const selectedCard = combo.cards && combo.cards.length > 0
        ? combo.cards[Math.floor(Math.random() * combo.cards.length)]
        : undefined;
      deck.push({ ...combo, selectedCard });
    }
  }
  return deck;
}
