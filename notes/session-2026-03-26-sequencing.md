# Session Notes: 2026-03-26 — Smarter Sequencing (Arc 46)

## What happened

Built dual-strategy buildSequence with the client iterating on constraints in real time.

## Key design decisions made WITH the client

- Familiarity parameter ("new" / "familiar") drives strategy choice
- "new" strategy: gradual introduction per Llewellyn Falco's advice for unfamiliar proper nouns
- REPS_BEFORE_NEXT cadence: count reps of the newest combo, not total slides (client's idea)
- MIN_GAP: 0 for pool of 2, 1 for pool >= 3 (client noticed deterministic patterns with gap=2)
- Generate-then-trim sections (client's suggestion: "it's OK to change the sequence after it's generated")
- First section ensures BOTH starting combos reach N reps (client caught this)
- MAX_SECTION_LENGTH = 9 with thinning from longest non-target runs (client proposed this heuristic)
- No consecutive same-card for same combo (client requested)
- Section boundaries API noted for future progress bar work (client's idea)

## Research conducted

- Sparrow Deck Expert checked Falco's GitHub: his implementation is simpler than ours (2 categories only)
- Spaced repetition researcher found: interleaving beats blocking for discrimination, ARTS adaptive spacing shows 25-39% gains
- Tension between research (all-at-once) and Falco (gradual introduction) resolved by familiarity level

## Process notes

- Client corrected me twice for doing work that should be delegated to team members (writing tests, running raw shell commands)
- Tester agents kept getting blocked on Bash permissions — need to use `mode: auto` for agents that run tests
- Property tests caught a real bug: last combo could be added to pool but never appear before loop exit
