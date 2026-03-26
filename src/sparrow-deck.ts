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
 * Whether the sequence is for a learner encountering combos for the first time
 * ("new") or a learner who has seen all the combos before ("familiar").
 */
export type Familiarity = 'new' | 'familiar';

/** Pick a random card index in [1, count], or 0 if count is 0. */
function pickCard(count: number): number {
  return count > 0 ? Math.floor(Math.random() * count) + 1 : 0;
}

/**
 * Given a sequence so far and a candidate comboIndex, return the number of
 * positions since this combo last appeared (-1 if it has never appeared).
 */
function positionsSinceLast(sequence: SlideSelection[], comboIndex: number): number {
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i][0] === comboIndex) {
      return sequence.length - 1 - i;
    }
  }
  return -1;
}

/**
 * Append one shuffled batch of the given pool to sequence, enforcing minGap.
 * If a combo would appear too soon, swap it with a later item in the batch.
 */
function appendBatch(
  sequence: SlideSelection[],
  pool: number[],
  cardCounts: number[],
  minGap: number,
): void {
  const batch = shuffle([...pool]);

  for (let i = 0; i < batch.length; i++) {
    const gap = positionsSinceLast(sequence, batch[i]);
    if (minGap > 0 && gap !== -1 && gap < minGap) {
      // Find a later item in the batch that is far enough away
      let swapped = false;
      for (let j = i + 1; j < batch.length; j++) {
        const gapJ = positionsSinceLast(sequence, batch[j]);
        if (gapJ === -1 || gapJ >= minGap) {
          [batch[i], batch[j]] = [batch[j], batch[i]];
          swapped = true;
          break;
        }
      }
      // If no valid swap was found, we accept the violation rather than loop forever
      // (can happen with very small pools)
      if (!swapped) {
        // leave batch[i] as-is
      }
    }
    const comboIndex = batch[i];
    sequence.push([comboIndex, pickCard(cardCounts[comboIndex - 1])]);
  }
}

/**
 * "familiar" strategy: shuffle-and-repeat all combos, with a minimum gap of 2
 * between appearances of the same combo.
 */
function buildFamiliarSequence(cardCounts: number[], length: number): SlideSelection[] {
  const pool = Array.from({ length: cardCounts.length }, (_, i) => i + 1);
  const sequence: SlideSelection[] = [];
  while (sequence.length < length) {
    appendBatch(sequence, pool, cardCounts, 1);
    // Trim to exactly length if we overshot (appendBatch adds full batches)
    if (sequence.length > length) {
      sequence.splice(length);
    }
  }
  return sequence;
}

/** Count how many times comboIndex appears in the sequence. */
function countAppearances(sequence: SlideSelection[], comboIndex: number): number {
  let count = 0;
  for (const [ci] of sequence) {
    if (ci === comboIndex) count++;
  }
  return count;
}

/**
 * "new" strategy: gradually introduce combos.
 * - Start with combos 1 & 2 in the active pool.
 * - Add the next combo once the most-recently-introduced combo has appeared
 *   at least REPS_BEFORE_NEXT times.
 * - Continue until all combos are active.
 * - Then continue with full pool until length is reached.
 * - Length is a minimum — keep going until all combos have been introduced
 *   and each has had at least one full round.
 */
/** How many times the newest combo must appear before the next one is introduced. */
export const REPS_BEFORE_NEXT = 3;

/**
 * Generate batches from a pool until the newest combo has enough reps,
 * then trim to exactly the point where it reached REPS_BEFORE_NEXT.
 *
 * The newestCombo is guaranteed to appear first in the first batch so that
 * its first appearance in the flat sequence is unambiguously at the section start,
 * enabling accurate segment boundary detection.
 */
function generateSection(
  pool: number[],
  newestCombo: number,
  cardCounts: number[],
  minGap: number,
): SlideSelection[] {
  const section: SlideSelection[] = [];

  // First batch: shuffle and then move newestCombo to front so it appears
  // at the very start of this section. This ensures detectability of section boundaries.
  const firstBatch = shuffle([...pool]);
  const newIdx = firstBatch.indexOf(newestCombo);
  if (newIdx > 0) {
    firstBatch.splice(newIdx, 1);
    firstBatch.unshift(newestCombo);
  }
  for (const comboIndex of firstBatch) {
    section.push([comboIndex, pickCard(cardCounts[comboIndex - 1])]);
  }

  // Continue with regular batches until newestCombo has REPS_BEFORE_NEXT appearances.
  while (countAppearances(section, newestCombo) < REPS_BEFORE_NEXT) {
    appendBatch(section, pool, cardCounts, minGap);
  }
  // Trim: find the position of the Nth appearance of newestCombo and cut there
  let seen = 0;
  for (let i = 0; i < section.length; i++) {
    if (section[i][0] === newestCombo) {
      seen++;
      if (seen === REPS_BEFORE_NEXT) {
        return section.slice(0, i + 1);
      }
    }
  }
  return section;
}

/** A section of a sequence, produced by one call to generateSection or the fill phase. */
export interface SequenceSection {
  /** The combo being introduced in this section, or null for the fill phase. */
  introducedCombo: number | null;
  /** The slides in this section. */
  slides: SlideSelection[];
}

/** Structured result from buildSequenceWithSections when you need section boundaries. */
export interface SequenceWithSections {
  sections: SequenceSection[];
  /** The flat sequence (concatenation of all sections' slides). */
  sequence: SlideSelection[];
}

function buildNewSequenceWithSections(cardCounts: number[], length: number): SequenceWithSections {
  const totalCombos = cardCounts.length;
  const sections: SequenceSection[] = [];
  const pool = totalCombos >= 2 ? [1, 2] : Array.from({ length: totalCombos }, (_, i) => i + 1);

  // Generate introduction sections: each adds a combo, runs until it has enough reps
  let newestCombo = totalCombos >= 2 ? 2 : 1;
  sections.push({ introducedCombo: newestCombo, slides: generateSection(pool, newestCombo, cardCounts, 0) });

  for (let ci = 3; ci <= totalCombos; ci++) {
    pool.push(ci);
    newestCombo = ci;
    sections.push({ introducedCombo: newestCombo, slides: generateSection(pool, newestCombo, cardCounts, 1) });
  }

  // Collect flat sequence so far to check length
  const flat: SlideSelection[] = sections.flatMap((s) => s.slides);

  // Fill remaining length with full-pool shuffles
  const fillSlides: SlideSelection[] = [];
  while (flat.length + fillSlides.length < length) {
    appendBatch(fillSlides, pool, cardCounts, 1);
  }
  sections.push({ introducedCombo: null, slides: fillSlides });

  const sequence = sections.flatMap((s) => s.slides);
  return { sections, sequence };
}

/**
 * Build an ordered sequence of [comboIndex, cardIndex] tuples, exposing section boundaries.
 *
 * - "familiar": returns a single section with introducedCombo: null.
 * - "new": returns one section per introduced combo, plus a fill section.
 */
export function buildSequenceWithSections(
  cardCounts: number[],
  length: number,
  familiarity: Familiarity,
): SequenceWithSections {
  if (familiarity === 'new') {
    return buildNewSequenceWithSections(cardCounts, length);
  }
  const sequence = buildFamiliarSequence(cardCounts, length);
  return { sections: [{ introducedCombo: null, slides: sequence }], sequence };
}

/**
 * Build an ordered sequence of [comboIndex, cardIndex] tuples.
 *
 * - "familiar": shuffle all combos repeatedly with a min-gap-2 constraint.
 * - "new": gradually introduce combos one at a time, then continue with all.
 *
 * The `length` parameter is a minimum. For "new", the sequence may be longer
 * to ensure all combos are introduced.
 */
export function buildSequence(
  cardCounts: number[],
  length: number,
  familiarity: Familiarity,
): SlideSelection[] {
  return buildSequenceWithSections(cardCounts, length, familiarity).sequence;
}

/**
 * Build a deck of `count` slides by shuffling the source combos
 * and repeating as needed. Each slide pre-selects a random card image.
 */
export function buildDeck(combos: ColorCombo[], count: number): Slide[] {
  const cardCounts = combos.map((c) => (c.cards ? c.cards.length : 0));
  const sequence = buildSequence(cardCounts, count, 'familiar');
  return sequence.map(([comboIndex, cardIndex]) => {
    const combo = combos[comboIndex - 1];
    const selectedCard = cardIndex > 0 ? combo.cards![cardIndex - 1] : undefined;
    return { ...combo, selectedCard };
  });
}
