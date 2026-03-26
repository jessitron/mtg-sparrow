/**
 * Property-based tests for buildSequence.
 *
 * Build & run:
 *   npx esbuild tests/sequence-properties.test.ts --bundle --outfile=tests/sequence-properties.test.mjs --format=esm --platform=node
 *   node tests/sequence-properties.test.mjs
 *
 * Or: npm run test:sequence
 */

import {
  buildSequence,
  buildSequenceWithSections,
  Familiarity,
  MAX_SECTION_LENGTH,
  REPS_BEFORE_NEXT,
  SlideSelection,
} from '../src/sparrow-deck';

// ============================================================
// Test infrastructure
// ============================================================

let passed = 0;
let failed = 0;
const TRIALS = 50; // run each property test many times with fresh randomness

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function section(name: string) {
  console.log(`\n  ${name}`);
}

// ============================================================
// Helpers
// ============================================================

function comboIndices(seq: SlideSelection[]): number[] {
  return seq.map(([ci]) => ci);
}

/** Count appearances of a specific combo in a sequence. */
function count(seq: SlideSelection[], comboIndex: number): number {
  return seq.filter(([ci]) => ci === comboIndex).length;
}

/** Find the minimum gap between consecutive appearances of the same combo. */
function minGap(seq: SlideSelection[]): number {
  const lastSeen = new Map<number, number>();
  let minG = Infinity;
  seq.forEach(([ci], i) => {
    const prev = lastSeen.get(ci);
    if (prev !== undefined) {
      const gap = i - prev - 1;
      if (gap < minG) minG = gap;
    }
    lastSeen.set(ci, i);
  });
  return minG;
}

/** Find the position where a combo first appears. */
function firstAppearance(seq: SlideSelection[], comboIndex: number): number {
  return seq.findIndex(([ci]) => ci === comboIndex);
}

/** Count distinct combos in a slice of the sequence. */
function distinctCombosInRange(seq: SlideSelection[], start: number, end: number): Set<number> {
  const s = new Set<number>();
  for (let i = start; i < Math.min(end, seq.length); i++) {
    s.add(seq[i][0]);
  }
  return s;
}

// ============================================================
// Property tests: FAMILIAR strategy
// ============================================================

section('familiar: min-gap constraint');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, 'familiar');
  const gap = minGap(seq);
  assert(
    `familiar trial ${t + 1}: no immediate repeats`,
    gap >= 1,
    `got immediate repeat (gap ${gap})`
  );
}

section('familiar: exact length');
for (let t = 0; t < TRIALS; t++) {
  const length = 20 + Math.floor(Math.random() * 30);
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, length, 'familiar');
  assert(
    `familiar trial ${t + 1}: length = ${length}`,
    seq.length === length,
    `got ${seq.length}`
  );
}

section('familiar: all combos appear');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'familiar');
  const distinct = new Set(comboIndices(seq));
  assert(
    `familiar trial ${t + 1}: all 5 combos appear`,
    distinct.size === 5,
    `got ${distinct.size} distinct`
  );
}

section('familiar: card indices in range');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [3, 5, 8, 2, 10];
  const seq = buildSequence(cardCounts, 30, 'familiar');
  let allValid = true;
  let detail = '';
  for (const [ci, card] of seq) {
    const maxCard = cardCounts[ci - 1];
    if (card < 1 || card > maxCard) {
      allValid = false;
      detail = `combo ${ci} got card ${card}, max ${maxCard}`;
      break;
    }
  }
  assert(`familiar trial ${t + 1}: card indices valid`, allValid, detail);
}

// ============================================================
// Property tests: NEW strategy
// ============================================================

section('new: starts with only 2 combos');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');
  // The first batch is size 2, so positions 0-1 should only have combos 1 and 2
  const firstTwo = distinctCombosInRange(seq, 0, 2);
  assert(
    `new trial ${t + 1}: first 2 slots have <= 2 combos`,
    firstTwo.size <= 2,
    `got ${firstTwo.size}: {${[...firstTwo].join(', ')}}`
  );
}

section('new: newest combo gets reps before next is introduced');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');

  // For combos 3, 4, 5: each should have appeared at least 3 times
  // before the NEXT combo's first appearance (or end of sequence)
  let allOk = true;
  let detail = '';
  for (let ci = 3; ci <= 5; ci++) {
    const nextCi = ci + 1;
    const nextFirst = nextCi <= 5 ? firstAppearance(seq, nextCi) : seq.length;
    if (nextFirst === -1) continue; // next combo not found (shouldn't happen)

    // Count how many times combo ci appeared before nextFirst
    const reps = seq.slice(0, nextFirst).filter(([c]) => c === ci).length;
    if (reps < REPS_BEFORE_NEXT) {
      allOk = false;
      detail = `combo ${ci} had only ${reps} reps (need ${REPS_BEFORE_NEXT}) before combo ${nextCi} appeared at position ${nextFirst}`;
      break;
    }
  }
  assert(`new trial ${t + 1}: newest gets >= 3 reps before next`, allOk, detail);
}

section('new: newest combo appears at most REPS_BEFORE_NEXT times in its introduction segment');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');

  // For combos 3, 4, 5: count appearances of combo K in [firstAppearance(K), firstAppearance(K+1))
  // That count should be <= REPS_BEFORE_NEXT (the intro section ends right at the Nth appearance)
  let allOk = true;
  let detail = '';
  for (let ci = 3; ci <= 5; ci++) {
    const segStart = firstAppearance(seq, ci);
    if (segStart === -1) continue; // combo not in sequence (shouldn't happen)

    const nextCi = ci + 1;
    const segEnd = nextCi <= 5 ? firstAppearance(seq, nextCi) : seq.length;
    const effectiveEnd = segEnd === -1 ? seq.length : segEnd;

    // Count appearances of combo ci in [segStart, effectiveEnd)
    const reps = seq.slice(segStart, effectiveEnd).filter(([c]) => c === ci).length;
    if (reps > REPS_BEFORE_NEXT) {
      allOk = false;
      detail = `combo ${ci} appeared ${reps} times in its segment [${segStart}, ${effectiveEnd}) — expected at most ${REPS_BEFORE_NEXT}`;
      break;
    }
  }
  assert(`new trial ${t + 1}: newest combo <= ${REPS_BEFORE_NEXT} reps in its segment`, allOk, detail);
}

section('new: all combos eventually appear');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');
  const distinct = new Set(comboIndices(seq));
  assert(
    `new trial ${t + 1}: all 5 combos appear`,
    distinct.size === 5,
    `got ${distinct.size} distinct`
  );
}

section('new: length >= requested minimum');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');
  assert(
    `new trial ${t + 1}: length >= 25`,
    seq.length >= 25,
    `got ${seq.length}`
  );
}

section('new: no immediate repeats in sections 3+');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, 'new');
  let allOk = true;
  let detail = '';
  // Sections at index 0 and 1 may have repeats (small pool); check index 2+
  for (let si = 2; si < sections.length; si++) {
    const sec = sections[si];
    const gap = minGap(sec.slides);
    if (gap < 1) {
      allOk = false;
      detail = `section ${si} (introducedCombo=${sec.introducedCombo}) has immediate repeat (gap ${gap})`;
      break;
    }
  }
  assert(`new trial ${t + 1}: no immediate repeats in sections 3+`, allOk, detail);
}

section('new: combos 3–5 introduced in order after 1 & 2');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');
  let inOrder = true;
  let detail = '';
  // Combos 1 & 2 are both in the starting pool (order is random within first batch).
  // Only check that 3, 4, 5 appear in order and after both 1 and 2.
  const positions = [3, 4, 5].map(ci => firstAppearance(seq, ci));
  const latestStarter = Math.max(firstAppearance(seq, 1), firstAppearance(seq, 2));
  if (positions[0] <= latestStarter) {
    inOrder = false;
    detail = `combo 3 at position ${positions[0]}, but starter combo appeared at ${latestStarter}`;
  }
  for (let i = 1; i < positions.length && inOrder; i++) {
    if (positions[i] <= positions[i - 1]) {
      inOrder = false;
      detail = `combo ${i + 3} at position ${positions[i]}, combo ${i + 2} at position ${positions[i - 1]}`;
    }
  }
  assert(`new trial ${t + 1}: combos 3–5 introduced in order`, inOrder, detail);
}

// ============================================================
// Property tests: NEW strategy — section-level (buildSequenceWithSections)
// ============================================================

section('new: no introduction section exceeds MAX_SECTION_LENGTH');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, 'new');
  let allOk = true;
  let detail = '';
  for (const sec of sections) {
    if (sec.introducedCombo !== null && sec.slides.length > MAX_SECTION_LENGTH) {
      allOk = false;
      detail = `section introducing combo ${sec.introducedCombo} has ${sec.slides.length} slides (max ${MAX_SECTION_LENGTH})`;
      break;
    }
  }
  assert(`new trial ${t + 1}: no intro section exceeds MAX_SECTION_LENGTH`, allOk, detail);
}

section('new: thinning preserves all target combo appearances');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, 'new');
  let allOk = true;
  let detail = '';
  for (const sec of sections) {
    if (sec.introducedCombo === null) continue;
    const targetCount = count(sec.slides, sec.introducedCombo);
    if (targetCount !== REPS_BEFORE_NEXT) {
      allOk = false;
      detail = `section introducing combo ${sec.introducedCombo} has ${targetCount} appearances of target (expected ${REPS_BEFORE_NEXT})`;
      break;
    }
  }
  assert(`new trial ${t + 1}: each intro section has exactly REPS_BEFORE_NEXT target appearances`, allOk, detail);
}

section('new: first section has both combos 1 and 2 at REPS_BEFORE_NEXT appearances');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, 'new');
  // The first intro section is the one whose introducedCombo is the last of the starting pair.
  // Both combo 1 and combo 2 should appear REPS_BEFORE_NEXT times in it.
  const firstSection = sections[0];
  const combo1Count = count(firstSection.slides, 1);
  const combo2Count = count(firstSection.slides, 2);
  const ok = combo1Count >= REPS_BEFORE_NEXT && combo2Count >= REPS_BEFORE_NEXT;
  assert(
    `new trial ${t + 1}: first section has >= ${REPS_BEFORE_NEXT} appearances each of combos 1 and 2`,
    ok,
    ok ? '' : `combo 1: ${combo1Count}, combo 2: ${combo2Count}`,
  );
}

// ============================================================
// Property tests: card dedup (both strategies)
// ============================================================

section('familiar: no consecutive same-card for same combo');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, 'familiar');
  const lastCard = new Map<number, number>();
  let allOk = true;
  let detail = '';
  for (let i = 0; i < seq.length; i++) {
    const [ci, card] = seq[i];
    const prev = lastCard.get(ci);
    if (prev !== undefined && prev === card) {
      allOk = false;
      detail = `combo ${ci} showed card ${card} twice in a row (positions ${i - 1}+)`;
      break;
    }
    lastCard.set(ci, card);
  }
  assert(`familiar trial ${t + 1}: no consecutive same-card`, allOk, detail);
}

section('new: no consecutive same-card for same combo');
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, 'new');
  const lastCard = new Map<number, number>();
  let allOk = true;
  let detail = '';
  for (let i = 0; i < seq.length; i++) {
    const [ci, card] = seq[i];
    const prev = lastCard.get(ci);
    if (prev !== undefined && prev === card) {
      allOk = false;
      detail = `combo ${ci} showed card ${card} twice in a row (positions ${i - 1}+)`;
      break;
    }
    lastCard.set(ci, card);
  }
  assert(`new trial ${t + 1}: no consecutive same-card`, allOk, detail);
}

// ============================================================
// Summary
// ============================================================

console.log(`\n  ────────────────────────`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
