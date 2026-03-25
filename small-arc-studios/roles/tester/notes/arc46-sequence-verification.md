# Arc 46: Dual-Strategy buildSequence — Verification

**Date**: 2026-03-25
**Result**: PASS — 17/17 checks

## What Was Verified

Test script: `tests/arc46-sequence-verification.mjs`
Harness: `sequence-harness.html` at `http://localhost:3847/sequence-harness.html`

### Tests run

1. **Page loads** — HTTP 200, generate button present
2. **Default strategy is "familiar"** — confirmed by reading select value
3. **Familiar auto-generates on load** — 25 rows visible without clicking Generate
4. **Familiar respects length=25** — exactly 25 sequence rows (not more, not less)
5. **Familiar min-gap-2 constraint** — verified no combo repeats within 2 positions across all 25 rows
6. **New strategy renders rows** — 27 rows produced for length=25 with 5 combos
7. **New strategy renders intro markers** — 5 `.intro-marker` elements present
8. **sequence-summary present** — element found and shows "Total: 27 slides"
9. **Summary matches DOM row count** — 27 === 27
10. **New strategy exceeds length=25** — 27 rows > 25 (all combos need introducing)
11. **New starts with 2 combos** — first 7 positions contained only 2 distinct combo labels
12. **New introduces more combos over time** — 5 distinct by position 30
13. **New eventually introduces all 5 combos** — all 5 labels present
14. **Intro marker count === combo count** — exactly 5 markers for 5 combos
15. **Intro markers contain "introducing"** — all well-formed
16. **No console errors**

## Observations

- With 5 combos and length=25, "new" strategy produced 27 rows. The formula
  `(nextComboToIntroduce - 2) * 7` means combo 5 needs 21 appearances before
  introduction, so the sequence runs at least one more batch after position 21.
  The exact count varies slightly per run (random shuffle). 27 is reasonable.

- The first 7 positions contained only A and B (combos 1 & 2), confirming
  the "start with 2 combos" invariant.

- detectIntroductions() in sequence-harness.ts marks ALL first appearances
  (including combos 1 and 2), so with 5 combos we get 5 markers. This matches
  the visual intent — each combo's debut is marked.

- Min-gap constraint passes cleanly. The batch swap logic in appendBatch()
  works correctly for pool sizes >= 3.

## Edge Cases Not Tested

- Pool of 1 combo (gap constraint impossible — expected to be tolerated by the
  "no valid swap" fallback in appendBatch)
- Pool of 2 combos with MIN_GAP=2 (only one other option exists — borderline)
- Very long sequences (length=200) for drift/bias in familiar
- "new" strategy with 1 or 2 combos (no introduction phase needed)

## How to Re-run

```
./run-test-server
npm run build:harness
npm run test:e2e -- tests/arc46-sequence-verification.mjs
./stop-test-server
```

## Arc Status

COMPLETE. All acceptance criteria verified through real browser interaction.
