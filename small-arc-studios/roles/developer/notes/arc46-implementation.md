# Arc 46 — Dual-Strategy buildSequence

## What Was Built

Added a `Familiarity` type and a third parameter to `buildSequence` in `src/sparrow-deck.ts`.
Two strategies are available: `"familiar"` (improved existing) and `"new"` (gradual introduction).

## Strategy: "familiar"

Same shuffle-and-repeat as before, but now enforces a minimum gap of 2 between successive
appearances of the same combo. Implementation: after shuffling a batch, walk through it left
to right; if `batch[i]` would appear too soon (gap < MIN_GAP), scan right for a later item
that *is* far enough away and swap them. If no valid swap exists (tiny pool), accept the
violation rather than loop forever.

Key function: `appendBatch(sequence, pool, cardCounts)`.

## Strategy: "new"

Gradual introduction of combos:
- Pool starts with combos 1 & 2.
- Every INTRO_CADENCE (7) total appearances, the next combo is added to the pool.
- The `length` parameter is a minimum — the loop continues until all combos are introduced,
  even if that requires exceeding `length`.

The threshold formula: combo N (1-indexed) gets introduced when
`sequence.length >= (N - 2) * INTRO_CADENCE`. So:
- Combo 1 & 2: at position 0 (start)
- Combo 3: after 7 appearances
- Combo 4: after 14 appearances
- etc.

## Backward Compatibility

`buildDeck` passes `'familiar'` to `buildSequence`, so all existing behavior is preserved
(plus the gap improvement).

## Harness Updates

- Added a `Strategy` dropdown (familiar/new) to `sequence-harness.html`.
- Added `.intro-marker` and `.sequence-summary` CSS classes.
- The harness inserts "── introducing X ──" separators before each combo's first appearance
  when using the "new" strategy.
- Total slide count is shown at the bottom (important for "new" where sequence may be longer
  than the requested length).

## Files Changed

- `src/sparrow-deck.ts` — Familiarity type, buildFamiliarSequence, buildNewSequence, refactored buildSequence
- `src/sequence-harness.ts` — familiarity control, intro markers, summary
- `sequence-harness.html` — Strategy dropdown, CSS for new element classes

## Design Decisions

- MIN_GAP = 2 was chosen as the minimum distance spec. Prevents consecutive appearances.
- INTRO_CADENCE = 7 is in the middle of the requested 6–8 range.
- Length overshoot for "new" is intentional and documented in the JSDoc.
- The gap-enforcement swap is best-effort: with 2 combos in the pool it's impossible to
  always maintain gap=2, so violations are accepted gracefully.
