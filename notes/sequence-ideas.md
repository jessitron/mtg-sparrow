# Sequence Ideas - Noted for Later

## Adaptive Requeue via Click-vs-Timer Signal (2026-03-25)

We don't have explicit right/wrong results in Sparrow Deck (no quiz scoring).
But we could infer confidence from **whether the learner clicked/tapped to advance
vs. let the timer auto-advance**. A click suggests they had an answer; waiting
suggests uncertainty.

This could feed an adaptive requeue strategy (show uncertain combos sooner,
confident combos later). Research (ARTS) shows 25-39% efficiency gains from
adaptive within-session spacing.

Not implemented yet. Requires buildSequence to become dynamic rather than
pre-computed.
