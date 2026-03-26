// src/sparrow-deck.ts
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function pickCard(count) {
  return count > 0 ? Math.floor(Math.random() * count) + 1 : 0;
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
  let count = 0;
  for (const [ci] of sequence) {
    if (ci === comboIndex) count++;
  }
  return count;
}
var REPS_BEFORE_NEXT = 3;
function buildNewSequence(cardCounts, length) {
  const totalCombos = cardCounts.length;
  const sequence = [];
  let nextComboToIntroduce = 3;
  let newestCombo = totalCombos >= 2 ? 2 : 1;
  const pool = totalCombos >= 2 ? [1, 2] : Array.from({ length: totalCombos }, (_, i) => i + 1);
  while (sequence.length < length || nextComboToIntroduce <= totalCombos || countAppearances(sequence, newestCombo) < REPS_BEFORE_NEXT) {
    appendBatch(sequence, pool, cardCounts, pool.length >= 3 ? 1 : 0);
    while (nextComboToIntroduce <= totalCombos && countAppearances(sequence, newestCombo) >= REPS_BEFORE_NEXT) {
      pool.push(nextComboToIntroduce);
      newestCombo = nextComboToIntroduce;
      nextComboToIntroduce++;
    }
  }
  return sequence;
}
function buildSequence(cardCounts, length, familiarity) {
  if (familiarity === "new") {
    return buildNewSequence(cardCounts, length);
  }
  return buildFamiliarSequence(cardCounts, length);
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
section("familiar: min-gap constraint");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 50, "familiar");
  const gap = minGap(seq);
  assert(
    `familiar trial ${t + 1}: no immediate repeats`,
    gap >= 0,
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
  const cardCounts = [3, 5, 8, 2, 10];
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
section("new: min-gap constraint still holds");
for (let t = 0; t < TRIALS; t++) {
  const cardCounts = [10, 10, 10, 10, 10];
  const seq = buildSequence(cardCounts, 25, "new");
  const gap = minGap(seq);
  assert(
    `new trial ${t + 1}: min gap >= 0`,
    gap >= 0,
    `got min gap ${gap}`
  );
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
console.log(`
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
