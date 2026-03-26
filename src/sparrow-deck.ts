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

/** Minimum number of cards required per color combo when building a deck. */
export const MIN_CARDS_PER_COMBO = 10;

/**
 * Whether the sequence is for a learner encountering combos for the first time
 * ("new") or a learner who has seen all the combos before ("familiar").
 */
export type Familiarity = 'new' | 'familiar';

/** Pick a random card index in [1, count], or 0 if count is 0. */
function pickCard(count: number): number {
  return count > 0 ? Math.floor(Math.random() * count) + 1 : 0;
}

/** Pick a random card index in [1, count] that differs from `avoid`. */
function pickDifferentCard(count: number, avoid: number): number {
  if (count <= 1) return count > 0 ? 1 : 0;
  let card: number;
  do {
    card = Math.floor(Math.random() * count) + 1;
  } while (card === avoid);
  return card;
}

/**
 * Walk a sequence of sections and ensure no combo shows the same card
 * on consecutive appearances. State carries across section boundaries.
 * Mutates the slides in place.
 */
function dedupConsecutiveCards(sections: SequenceSection[], cardCounts: number[]): void {
  const lastCard = new Map<number, number>(); // comboIndex → last cardIndex shown
  for (const section of sections) {
    for (const slide of section.slides) {
      const [comboIndex, cardIndex] = slide;
      const prev = lastCard.get(comboIndex);
      if (prev !== undefined && prev === cardIndex) {
        slide[1] = pickDifferentCard(cardCounts[comboIndex - 1], prev);
      }
      lastCard.set(comboIndex, slide[1]);
    }
  }
}

/**
 * Walk a sequence of sections and ensure no card image (identified by
 * [comboIndex, cardIndex]) appears more than maxAppearances times total.
 * When a card would exceed the limit, pick a different card index for that
 * combo that is still under the limit and different from the previous card
 * shown for that combo (to preserve the consecutive-dedup property).
 * Mutates the slides in place.
 */
function enforceMaxCardAppearances(
  sections: SequenceSection[],
  cardCounts: number[],
  maxAppearances: number,
): void {
  const appearances = new Map<string, number>(); // "comboIndex-cardIndex" → count
  const lastCard = new Map<number, number>(); // comboIndex → last cardIndex shown

  for (const section of sections) {
    for (const slide of section.slides) {
      const [comboIndex] = slide;
      let cardIndex = slide[1];
      const key = `${comboIndex}-${cardIndex}`;
      const count = appearances.get(key) ?? 0;

      if (count >= maxAppearances) {
        // This card has hit its limit — find an alternative
        const totalCards = cardCounts[comboIndex - 1];
        const prev = lastCard.get(comboIndex);
        let found = false;
        // Try all possible card indices in order; pick first one under the limit and not consecutive
        for (let attempt = 1; attempt <= totalCards; attempt++) {
          const candidate = attempt;
          if (candidate === cardIndex) continue; // already at limit
          if (candidate === prev) continue; // would create consecutive repeat
          const candidateKey = `${comboIndex}-${candidate}`;
          if ((appearances.get(candidateKey) ?? 0) < maxAppearances) {
            slide[1] = candidate;
            cardIndex = candidate;
            found = true;
            break;
          }
        }
        // If no valid candidate found (extremely unlikely with 10+ cards),
        // leave as-is rather than infinite loop
        if (!found) {
          // accept the violation
        }
      }

      const finalKey = `${comboIndex}-${slide[1]}`;
      appearances.set(finalKey, (appearances.get(finalKey) ?? 0) + 1);
      lastCard.set(comboIndex, slide[1]);
    }
  }
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

/** Maximum number of slides allowed in a single section. */
export const MAX_SECTION_LENGTH = 9;

/**
 * Thin a section to at most MAX_SECTION_LENGTH slides by removing non-target items.
 * Finds all runs of consecutive non-target items and repeatedly removes one item
 * from the longest run until the section is short enough or no non-target items remain.
 * Target combo appearances are never removed.
 */
function thinSection(section: SlideSelection[], targetCombos: number[]): SlideSelection[] {
  const result = [...section];

  while (result.length > MAX_SECTION_LENGTH) {
    // Find all runs of consecutive non-target items
    type Run = { start: number; length: number };
    const runs: Run[] = [];
    let runStart = -1;

    for (let i = 0; i <= result.length; i++) {
      const isNonTarget = i < result.length && !targetCombos.includes(result[i][0]);
      if (isNonTarget && runStart === -1) {
        runStart = i;
      } else if (!isNonTarget && runStart !== -1) {
        runs.push({ start: runStart, length: i - runStart });
        runStart = -1;
      }
    }

    if (runs.length === 0) {
      // No non-target items left to remove; stop thinning
      break;
    }

    // Sort runs by length descending (last one wins ties, to spread removals evenly from the end).
    // We prefer longer runs but may need to skip a run of length 1 whose removal would create
    // an adjacent same-combo repeat.
    const sortedRuns = [...runs].sort((a, b) => b.length - a.length || b.start - a.start);

    // Find a safe removal position: try each run in order, within each run scan for a position
    // whose removal won't create an adjacent same-combo repeat.
    // A removal at index i creates a repeat if result[i-1] and result[i+1] have the same combo.
    let removeIdx = -1;
    outer: for (const run of sortedRuns) {
      const mid = run.start + Math.floor(run.length / 2);
      // Try mid first, then scan outward within the run
      for (let offset = 0; offset < run.length; offset++) {
        for (const candidate of offset === 0 ? [mid] : [mid - offset, mid + offset]) {
          if (candidate < run.start || candidate >= run.start + run.length) continue;
          const leftCombo = candidate > 0 ? result[candidate - 1][0] : null;
          const rightCombo = candidate + 1 < result.length ? result[candidate + 1][0] : null;
          if (leftCombo === null || rightCombo === null || leftCombo !== rightCombo) {
            removeIdx = candidate;
            break outer;
          }
        }
      }
    }

    if (removeIdx === -1) {
      // No safe removal found; stop thinning
      break;
    }
    result.splice(removeIdx, 1);
  }

  return result;
}

/**
 * Generate batches from a pool until every combo in `targetCombos` has at least
 * REPS_BEFORE_NEXT appearances, then trim to the point where the last one reached it.
 *
 * The first targetCombo is placed first in the first batch so its first appearance
 * is unambiguously at the section start, enabling accurate segment boundary detection.
 */
function generateSection(
  pool: number[],
  targetCombos: number[],
  cardCounts: number[],
  minGap: number,
): SlideSelection[] {
  const section: SlideSelection[] = [];

  // First batch: shuffle and then move first target to front.
  const firstBatch = shuffle([...pool]);
  const frontCombo = targetCombos[0];
  const newIdx = firstBatch.indexOf(frontCombo);
  if (newIdx > 0) {
    firstBatch.splice(newIdx, 1);
    firstBatch.unshift(frontCombo);
  }
  for (const comboIndex of firstBatch) {
    section.push([comboIndex, pickCard(cardCounts[comboIndex - 1])]);
  }

  // Continue until every target combo has enough reps.
  while (targetCombos.some(c => countAppearances(section, c) < REPS_BEFORE_NEXT)) {
    appendBatch(section, pool, cardCounts, minGap);
  }

  // Trim: find the earliest position where ALL targets have reached REPS_BEFORE_NEXT.
  let trimmed = section;
  const counts = new Map(targetCombos.map(c => [c, 0]));
  for (let i = 0; i < section.length; i++) {
    const ci = section[i][0];
    if (counts.has(ci)) {
      counts.set(ci, counts.get(ci)! + 1);
    }
    if ([...counts.values()].every(v => v >= REPS_BEFORE_NEXT)) {
      trimmed = section.slice(0, i + 1);
      break;
    }
  }

  // Thin: if section exceeds MAX_SECTION_LENGTH, remove non-target items from longest runs.
  return thinSection(trimmed, targetCombos);
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

  // First section: both starting combos need REPS_BEFORE_NEXT appearances each
  const startingCombos = totalCombos >= 2 ? [1, 2] : [1];
  sections.push({ introducedCombo: startingCombos[startingCombos.length - 1], slides: generateSection(pool, startingCombos, cardCounts, 0) });

  for (let ci = 3; ci <= totalCombos; ci++) {
    pool.push(ci);
    sections.push({ introducedCombo: ci, slides: generateSection(pool, [ci], cardCounts, 1) });
  }

  // Collect flat sequence so far to check length
  const flat: SlideSelection[] = sections.flatMap((s) => s.slides);

  // Fill remaining length with full-pool shuffles
  const fillSlides: SlideSelection[] = [];
  while (flat.length + fillSlides.length < length) {
    appendBatch(fillSlides, pool, cardCounts, 1);
  }
  sections.push({ introducedCombo: null, slides: fillSlides });

  // Run both passes until stable. In practice converges in 1–2 iterations.
  for (let pass = 0; pass < 5; pass++) {
    dedupConsecutiveCards(sections, cardCounts);
    enforceMaxCardAppearances(sections, cardCounts, 2);
  }
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
  const sections: SequenceSection[] = [{ introducedCombo: null, slides: sequence }];
  // Run both passes until stable. In practice converges in 1–2 iterations.
  for (let pass = 0; pass < 5; pass++) {
    dedupConsecutiveCards(sections, cardCounts);
    enforceMaxCardAppearances(sections, cardCounts, 2);
  }
  return { sections, sequence };
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
export function buildDeck(combos: ColorCombo[], count: number, familiarity: Familiarity = 'familiar'): Slide[] {
  // Shuffle combos so the introduction order (for "new" strategy) is random
  const shuffled = [...combos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cardCounts = shuffled.map((c) => (c.cards ? c.cards.length : 0));
  for (let i = 0; i < shuffled.length; i++) {
    if (cardCounts[i] < MIN_CARDS_PER_COMBO) {
      throw new Error(
        `Color combo "${shuffled[i].name}" has only ${cardCounts[i]} cards; at least ${MIN_CARDS_PER_COMBO} are required.`
      );
    }
  }
  const sequence = buildSequence(cardCounts, count, familiarity);
  return sequence.map(([comboIndex, cardIndex]) => {
    const combo = shuffled[comboIndex - 1];
    const selectedCard = cardIndex > 0 ? combo.cards![cardIndex - 1] : undefined;
    return { ...combo, selectedCard };
  });
}
