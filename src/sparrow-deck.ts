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

/** A [comboIndex, cardIndex] pair, both 1-indexed. */
export type SlideSelection = [number, number];

/**
 * Build an ordered sequence of [comboIndex, cardIndex] tuples by shuffling
 * combo positions [1, comboCount] and repeating until `length` entries are produced.
 * For each combo appearance, picks a random card index in [1, cardCounts[comboIndex-1]].
 * If a combo has no cards (count 0), cardIndex will be 0.
 */
export function buildSequence(cardCounts: number[], length: number): SlideSelection[] {
  const comboCount = cardCounts.length;
  const positions = Array.from({ length: comboCount }, (_, i) => i + 1);
  const sequence: SlideSelection[] = [];
  while (sequence.length < length) {
    const batch = shuffle([...positions]);
    for (const comboIndex of batch) {
      if (sequence.length >= length) break;
      const count = cardCounts[comboIndex - 1];
      const cardIndex = count > 0 ? Math.floor(Math.random() * count) + 1 : 0;
      sequence.push([comboIndex, cardIndex]);
    }
  }
  return sequence;
}

/**
 * Build a deck of `count` slides by shuffling the source combos
 * and repeating as needed. Each slide pre-selects a random card image.
 */
export function buildDeck(combos: ColorCombo[], count: number): Slide[] {
  const cardCounts = combos.map((c) => (c.cards ? c.cards.length : 0));
  const sequence = buildSequence(cardCounts, count);
  return sequence.map(([comboIndex, cardIndex]) => {
    const combo = combos[comboIndex - 1];
    const selectedCard = cardIndex > 0 ? combo.cards![cardIndex - 1] : undefined;
    return { ...combo, selectedCard };
  });
}
