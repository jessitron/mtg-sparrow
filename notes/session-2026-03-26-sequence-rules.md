# Session: Sequence Rules Testing & Documentation (2026-03-26)

## What happened

1. Client noticed the property tests for `buildSequence` had a no-op assertion (`gap >= 0` is always true) — it wasn't actually enforcing no-repeat constraints.

2. **Tester** updated property tests to properly enforce:
   - Familiar mode: `gap >= 1` (no immediate repeats) — this already passed
   - New mode: no immediate repeats in sections 3+ (introducing combos D, E), but repeats allowed in sections 1–2 (introducing A+B, C)
   - Tests failed as expected: 27/50 trials showed gap-0 violations in later sections

3. **Developer** found the root cause: `thinSection` was removing items from non-target runs without checking if neighbors would become adjacent same-combo repeats. Fix: before removing, check if `result[candidate-1]` and `result[candidate+1]` share a combo; if so, try another position. If no safe removal exists, stop thinning.

4. **Developer** added a rules documentation section to the sequence harness page (`sequence-harness.html`). Shows constraints per strategy, updates live when switching the dropdown. Values interpolated from actual constants.

## Key insight

The `minGap` helper computes `i - prev - 1`, so adjacent appearances give gap = 0, not gap = -1. A test asserting `gap >= 0` can never fail — you need `gap >= 1` to enforce no immediate repeats.

## Commits
- `05fc6e6` — Enforce no-repeat constraint in property tests
- `b27452c` → `b736048` — Fix thinSection + add rules docs to harness page
