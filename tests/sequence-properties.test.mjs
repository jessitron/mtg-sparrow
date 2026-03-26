// src/sparrow-deck.ts
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
var MIN_CARDS_PER_COMBO = 10;
function pickCard(count2) {
  return count2 > 0 ? Math.floor(Math.random() * count2) + 1 : 0;
}
function pickDifferentCard(count2, avoid) {
  if (count2 <= 1) return count2 > 0 ? 1 : 0;
  let card;
  do {
    card = Math.floor(Math.random() * count2) + 1;
  } while (card === avoid);
  return card;
}
function dedupConsecutiveCards(sections, cardCounts) {
  const lastCard = /* @__PURE__ */ new Map();
  for (const section2 of sections) {
    for (const slide of section2.slides) {
      const [comboIndex, cardIndex] = slide;
      const prev = lastCard.get(comboIndex);
      if (prev !== void 0 && prev === cardIndex) {
        slide[1] = pickDifferentCard(cardCounts[comboIndex - 1], prev);
      }
      lastCard.set(comboIndex, slide[1]);
    }
  }
}
function enforceMaxCardAppearances(sections, cardCounts, maxAppearances) {
  const appearances = /* @__PURE__ */ new Map();
  const lastCard = /* @__PURE__ */ new Map();
  for (const section2 of sections) {
    for (const slide of section2.slides) {
      const [comboIndex] = slide;
      let cardIndex = slide[1];
      const key = `${comboIndex}-${cardIndex}`;
      const count2 = appearances.get(key) ?? 0;
      if (count2 >= maxAppearances) {
        const totalCards = cardCounts[comboIndex - 1];
        const prev = lastCard.get(comboIndex);
        let found = false;
        for (let attempt = 1; attempt <= totalCards; attempt++) {
          const candidate = attempt;
          if (candidate === cardIndex) continue;
          if (candidate === prev) continue;
          const candidateKey = `${comboIndex}-${candidate}`;
          if ((appearances.get(candidateKey) ?? 0) < maxAppearances) {
            slide[1] = candidate;
            cardIndex = candidate;
            found = true;
            break;
          }
        }
        if (!found) {
        }
      }
      const finalKey = `${comboIndex}-${slide[1]}`;
      appearances.set(finalKey, (appearances.get(finalKey) ?? 0) + 1);
      lastCard.set(comboIndex, slide[1]);
    }
  }
}
function positionsSinceLast(sequence, comboIndex) {
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (sequence[i][0] === comboIndex) {
      return sequence.length - 1 - i;
    }
  }
  return -1;
}
function appendBatch(sequence, pool, cardCounts, minGap2) {
  const batch = shuffle([...pool]);
  for (let i = 0; i < batch.length; i++) {
    const gap = positionsSinceLast(sequence, batch[i]);
    if (minGap2 > 0 && gap !== -1 && gap < minGap2) {
      let swapped = false;
      for (let j = i + 1; j < batch.length; j++) {
        const gapJ = positionsSinceLast(sequence, batch[j]);
        if (gapJ === -1 || gapJ >= minGap2) {
          [batch[i], batch[j]] = [batch[j], batch[i]];
          swapped = true;
          break;
        }
      }
      if (!swapped) {
      }
    }
    const comboIndex = batch[i];
    sequence.push([comboIndex, pickCard(cardCounts[comboIndex - 1])]);
  }
}
function buildFamiliarSequence(cardCounts, length) {
  const pool = Array.from({ length: cardCounts.length }, (_, i) => i + 1);
  const sequence = [];
  while (sequence.length < length) {
    appendBatch(sequence, pool, cardCounts, 1);
    if (sequence.length > length) {
      sequence.splice(length);
    }
  }
  return sequence;
}
function countAppearances(sequence, comboIndex) {
  let count2 = 0;
  for (const [ci] of sequence) {
    if (ci === comboIndex) count2++;
  }
  return count2;
}
var REPS_BEFORE_NEXT = 3;
var MAX_SECTION_LENGTH = 9;
function thinSection(section2, targetCombos) {
  const result = [...section2];
  while (result.length > MAX_SECTION_LENGTH) {
    const runs = [];
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
      break;
    }
    const sortedRuns = [...runs].sort((a, b) => b.length - a.length || b.start - a.start);
    let removeIdx = -1;
    outer: for (const run of sortedRuns) {
      const mid = run.start + Math.floor(run.length / 2);
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
      break;
    }
    result.splice(removeIdx, 1);
  }
  return result;
}
function generateSection(pool, targetCombos, cardCounts, minGap2) {
  const section2 = [];
  const firstBatch = shuffle([...pool]);
  const frontCombo = targetCombos[0];
  const newIdx = firstBatch.indexOf(frontCombo);
  if (newIdx > 0) {
    firstBatch.splice(newIdx, 1);
    firstBatch.unshift(frontCombo);
  }
  for (const comboIndex of firstBatch) {
    section2.push([comboIndex, pickCard(cardCounts[comboIndex - 1])]);
  }
  while (targetCombos.some((c) => countAppearances(section2, c) < REPS_BEFORE_NEXT)) {
    appendBatch(section2, pool, cardCounts, minGap2);
  }
  let trimmed = section2;
  const counts = new Map(targetCombos.map((c) => [c, 0]));
  for (let i = 0; i < section2.length; i++) {
    const ci = section2[i][0];
    if (counts.has(ci)) {
      counts.set(ci, counts.get(ci) + 1);
    }
    if ([...counts.values()].every((v) => v >= REPS_BEFORE_NEXT)) {
      trimmed = section2.slice(0, i + 1);
      break;
    }
  }
  return thinSection(trimmed, targetCombos);
}
function buildNewSequenceWithSections(cardCounts, length) {
  const totalCombos = cardCounts.length;
  const sections = [];
  const pool = totalCombos >= 2 ? [1, 2] : Array.from({ length: totalCombos }, (_, i) => i + 1);
  const startingCombos = totalCombos >= 2 ? [1, 2] : [1];
  sections.push({ introducedCombo: startingCombos[startingCombos.length - 1], slides: generateSection(pool, startingCombos, cardCounts, 0) });
  for (let ci = 3; ci <= totalCombos; ci++) {
    pool.push(ci);
    sections.push({ introducedCombo: ci, slides: generateSection(pool, [ci], cardCounts, 1) });
  }
  const flat = sections.flatMap((s) => s.slides);
  const fillSlides = [];
  while (flat.length + fillSlides.length < length) {
    appendBatch(fillSlides, pool, cardCounts, 1);
  }
  sections.push({ introducedCombo: null, slides: fillSlides });
  for (let pass = 0; pass < 5; pass++) {
    dedupConsecutiveCards(sections, cardCounts);
    enforceMaxCardAppearances(sections, cardCounts, 2);
  }
  const sequence = sections.flatMap((s) => s.slides);
  return { sections, sequence };
}
function buildSequenceWithSections(cardCounts, length, familiarity) {
  if (familiarity === "new") {
    return buildNewSequenceWithSections(cardCounts, length);
  }
  const sequence = buildFamiliarSequence(cardCounts, length);
  const sections = [{ introducedCombo: null, slides: sequence }];
  for (let pass = 0; pass < 5; pass++) {
    dedupConsecutiveCards(sections, cardCounts);
    enforceMaxCardAppearances(sections, cardCounts, 2);
  }
  return { sections, sequence };
}
function buildSequence(cardCounts, length, familiarity) {
  return buildSequenceWithSections(cardCounts, length, familiarity).sequence;
}

// tests/sequence-properties.test.ts
var passed = 0;
var failed = 0;
var TRIALS = 50;
function assert(label, condition, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}${detail ? " \u2014 " + detail : ""}`);
  }
}
function section(name) {
  console.log(`
  ${name}`);
}
function comboIndices(seq) {
  return seq.map(([ci]) => ci);
}
function count(seq, comboIndex) {
  return seq.filter(([ci]) => ci === comboIndex).length;
}
function minGap(seq) {
  const lastSeen = /* @__PURE__ */ new Map();
  let minG = Infinity;
  seq.forEach(([ci], i) => {
    const prev = lastSeen.get(ci);
    if (prev !== void 0) {
      const gap = i - prev - 1;
      if (gap < minG) minG = gap;
    }
    lastSeen.set(ci, i);
  });
  return minG;
}
function firstAppearance(seq, comboIndex) {
  return seq.findIndex(([ci]) => ci === comboIndex);
}
function distinctCombosInRange(seq, start, end) {
  const s = /* @__PURE__ */ new Set();
  for (let i = start; i < Math.min(end, seq.length); i++) {
    s.add(seq[i][0]);
  }
  return s;
}
var VARIED_CARD_COUNTS = [10, 12, 10, 11, 15];
if (!VARIED_CARD_COUNTS.every((n) => n >= MIN_CARDS_PER_COMBO)) {
  throw new Error(`Test setup error: VARIED_CARD_COUNTS contains values below MIN_CARDS_PER_COMBO (${MIN_CARDS_PER_COMBO})`);
}
section("familiar: min-gap constraint");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, "familiar");
  const gap = minGap(seq);
  assert(
    `familiar trial ${t + 1}: no immediate repeats`,
    gap >= 1,
    `got immediate repeat (gap ${gap})`
  );
}
section("familiar: exact length");
for (let t = 0; t < TRIALS; t++) {
  const length = 20 + Math.floor(Math.random() * 30);
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, length, "familiar");
  assert(
    `familiar trial ${t + 1}: length = ${length}`,
    seq.length === length,
    `got ${seq.length}`
  );
}
section("familiar: all combos appear");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "familiar");
  const distinct = new Set(comboIndices(seq));
  assert(
    `familiar trial ${t + 1}: all 5 combos appear`,
    distinct.size === 5,
    `got ${distinct.size} distinct`
  );
}
section("familiar: card indices in range");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = VARIED_CARD_COUNTS;
  const seq = buildSequence(cardCounts, 30, "familiar");
  let allValid = true;
  let detail = "";
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
section("new: starts with only 2 combos");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  const firstTwo = distinctCombosInRange(seq, 0, 2);
  assert(
    `new trial ${t + 1}: first 2 slots have <= 2 combos`,
    firstTwo.size <= 2,
    `got ${firstTwo.size}: {${[...firstTwo].join(", ")}}`
  );
}
section("new: newest combo gets reps before next is introduced");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  let allOk = true;
  let detail = "";
  for (let ci = 3; ci <= 5; ci++) {
    const nextCi = ci + 1;
    const nextFirst = nextCi <= 5 ? firstAppearance(seq, nextCi) : seq.length;
    if (nextFirst === -1) continue;
    const reps = seq.slice(0, nextFirst).filter(([c]) => c === ci).length;
    if (reps < REPS_BEFORE_NEXT) {
      allOk = false;
      detail = `combo ${ci} had only ${reps} reps (need ${REPS_BEFORE_NEXT}) before combo ${nextCi} appeared at position ${nextFirst}`;
      break;
    }
  }
  assert(`new trial ${t + 1}: newest gets >= 3 reps before next`, allOk, detail);
}
section("new: newest combo appears at most REPS_BEFORE_NEXT times in its introduction segment");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  let allOk = true;
  let detail = "";
  for (let ci = 3; ci <= 5; ci++) {
    const segStart = firstAppearance(seq, ci);
    if (segStart === -1) continue;
    const nextCi = ci + 1;
    const segEnd = nextCi <= 5 ? firstAppearance(seq, nextCi) : seq.length;
    const effectiveEnd = segEnd === -1 ? seq.length : segEnd;
    const reps = seq.slice(segStart, effectiveEnd).filter(([c]) => c === ci).length;
    if (reps > REPS_BEFORE_NEXT) {
      allOk = false;
      detail = `combo ${ci} appeared ${reps} times in its segment [${segStart}, ${effectiveEnd}) \u2014 expected at most ${REPS_BEFORE_NEXT}`;
      break;
    }
  }
  assert(`new trial ${t + 1}: newest combo <= ${REPS_BEFORE_NEXT} reps in its segment`, allOk, detail);
}
section("new: all combos eventually appear");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  const distinct = new Set(comboIndices(seq));
  assert(
    `new trial ${t + 1}: all 5 combos appear`,
    distinct.size === 5,
    `got ${distinct.size} distinct`
  );
}
section("new: length >= requested minimum");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  assert(
    `new trial ${t + 1}: length >= 25`,
    seq.length >= 25,
    `got ${seq.length}`
  );
}
section("new: no immediate repeats in sections 3+");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, "new");
  let allOk = true;
  let detail = "";
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
section("new: combos 3\u20135 introduced in order after 1 & 2");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  let inOrder = true;
  let detail = "";
  const positions = [3, 4, 5].map((ci) => firstAppearance(seq, ci));
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
  assert(`new trial ${t + 1}: combos 3\u20135 introduced in order`, inOrder, detail);
}
section("new: no introduction section exceeds MAX_SECTION_LENGTH");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, "new");
  let allOk = true;
  let detail = "";
  for (const sec of sections) {
    if (sec.introducedCombo !== null && sec.slides.length > MAX_SECTION_LENGTH) {
      allOk = false;
      detail = `section introducing combo ${sec.introducedCombo} has ${sec.slides.length} slides (max ${MAX_SECTION_LENGTH})`;
      break;
    }
  }
  assert(`new trial ${t + 1}: no intro section exceeds MAX_SECTION_LENGTH`, allOk, detail);
}
section("new: thinning preserves all target combo appearances");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, "new");
  let allOk = true;
  let detail = "";
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
section("new: first section has both combos 1 and 2 at REPS_BEFORE_NEXT appearances");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const { sections } = buildSequenceWithSections(cardCounts, 25, "new");
  const firstSection = sections[0];
  const combo1Count = count(firstSection.slides, 1);
  const combo2Count = count(firstSection.slides, 2);
  const ok = combo1Count >= REPS_BEFORE_NEXT && combo2Count >= REPS_BEFORE_NEXT;
  assert(
    `new trial ${t + 1}: first section has >= ${REPS_BEFORE_NEXT} appearances each of combos 1 and 2`,
    ok,
    ok ? "" : `combo 1: ${combo1Count}, combo 2: ${combo2Count}`
  );
}
section("familiar: no consecutive same-card for same combo");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, "familiar");
  const lastCard = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (let i = 0; i < seq.length; i++) {
    const [ci, card] = seq[i];
    const prev = lastCard.get(ci);
    if (prev !== void 0 && prev === card) {
      allOk = false;
      detail = `combo ${ci} showed card ${card} twice in a row (positions ${i - 1}+)`;
      break;
    }
    lastCard.set(ci, card);
  }
  assert(`familiar trial ${t + 1}: no consecutive same-card`, allOk, detail);
}
section("new: no consecutive same-card for same combo");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  const lastCard = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (let i = 0; i < seq.length; i++) {
    const [ci, card] = seq[i];
    const prev = lastCard.get(ci);
    if (prev !== void 0 && prev === card) {
      allOk = false;
      detail = `combo ${ci} showed card ${card} twice in a row (positions ${i - 1}+)`;
      break;
    }
    lastCard.set(ci, card);
  }
  assert(`new trial ${t + 1}: no consecutive same-card`, allOk, detail);
}
section("familiar: no card image appears more than twice (standard counts)");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, "familiar");
  const imageCounts = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (const [ci, card] of seq) {
    const key = `${ci}-${card}`;
    const prev = imageCounts.get(key) ?? 0;
    imageCounts.set(key, prev + 1);
    if (prev + 1 > 2) {
      allOk = false;
      detail = `combo ${ci} card ${card} appeared ${prev + 1} times`;
      break;
    }
  }
  assert(`familiar trial ${t + 1}: no card image appears > 2 times (10,10,10,10,10)`, allOk, detail);
}
section("familiar: no card image appears more than twice (varied counts)");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = VARIED_CARD_COUNTS;
  const seq = buildSequence(cardCounts, 50, "familiar");
  const imageCounts = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (const [ci, card] of seq) {
    const key = `${ci}-${card}`;
    const prev = imageCounts.get(key) ?? 0;
    imageCounts.set(key, prev + 1);
    if (prev + 1 > 2) {
      allOk = false;
      detail = `combo ${ci} card ${card} appeared ${prev + 1} times`;
      break;
    }
  }
  assert(`familiar trial ${t + 1}: no card image appears > 2 times (10,12,10,11,15)`, allOk, detail);
}
section("new: no card image appears more than twice (standard counts)");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  const imageCounts = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (const [ci, card] of seq) {
    const key = `${ci}-${card}`;
    const prev = imageCounts.get(key) ?? 0;
    imageCounts.set(key, prev + 1);
    if (prev + 1 > 2) {
      allOk = false;
      detail = `combo ${ci} card ${card} appeared ${prev + 1} times`;
      break;
    }
  }
  assert(`new trial ${t + 1}: no card image appears > 2 times (10,10,10,10,10)`, allOk, detail);
}
section("new: no card image appears more than twice (varied counts)");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = VARIED_CARD_COUNTS;
  const seq = buildSequence(cardCounts, 25, "new");
  const imageCounts = /* @__PURE__ */ new Map();
  let allOk = true;
  let detail = "";
  for (const [ci, card] of seq) {
    const key = `${ci}-${card}`;
    const prev = imageCounts.get(key) ?? 0;
    imageCounts.set(key, prev + 1);
    if (prev + 1 > 2) {
      allOk = false;
      detail = `combo ${ci} card ${card} appeared ${prev + 1} times`;
      break;
    }
  }
  assert(`new trial ${t + 1}: no card image appears > 2 times (10,12,10,11,15)`, allOk, detail);
}
console.log(`
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
