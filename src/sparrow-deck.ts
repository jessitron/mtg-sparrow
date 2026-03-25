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
 * Build an ordered sequence of 1-indexed combo positions by shuffling
 * positions [1, comboCount] and repeating until `length` entries are produced.
 * Each number in the result is in [1, comboCount].
 */
export function buildSequence(comboCount: number, length: number): number[] {
  const positions = Array.from({ length: comboCount }, (_, i) => i + 1);
  const sequence: number[] = [];
  while (sequence.length < length) {
    const batch = shuffle([...positions]);
    for (const pos of batch) {
      if (sequence.length >= length) break;
      sequence.push(pos);
    }
  }
  return sequence;
}

/**
 * Build a deck of `count` slides by shuffling the source combos
 * and repeating as needed. Each slide pre-selects a random card image.
 */
export function buildDeck(combos: ColorCombo[], count: number): Slide[] {
  const sequence = buildSequence(combos.length, count);
  return sequence.map((pos) => {
    const combo = combos[pos - 1];
    const selectedCard = combo.cards && combo.cards.length > 0
      ? combo.cards[Math.floor(Math.random() * combo.cards.length)]
      : undefined;
    return { ...combo, selectedCard };
  });
}
