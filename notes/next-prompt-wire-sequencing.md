# Next Prompt: Wire New Sequence Generation Into the App

Paste this to start the next session:

---

Arc 46 built a dual-strategy `buildSequence` in `src/sparrow-deck.ts` with a `familiarity` parameter ("new" | "familiar"). Currently `buildDeck` hardcodes "familiar". We need to wire in the "new" strategy for first-time learners.

Key context:
- `buildDeck` in `src/sparrow-deck.ts` calls `buildSequence(cardCounts, count, 'familiar')` — this is where the familiarity needs to be passed through
- `buildDeck` is called from `src/session.ts` — trace the call to see where session/level state is available
- Self-assessment results are stored somewhere (check `src/` for assessment-related files) — the most-recent self-assessment determines familiarity
- "Still learning" or first attempt → "new" strategy; anything higher → "familiar"
- The "new" strategy may produce MORE slides than requested (it's a minimum, not a cap) — the session needs to handle variable-length decks
- `buildSequenceWithSections` returns section boundaries — consider whether the session/slides page should know about sections (future progress bar work, noted in DEC-180)

Also: the sequence harness shows 5 columns side-by-side for comparing randomized outputs. Check `sequence-harness.html` to see how the current strategies look.

Property tests: `npm run test:sequence` (800/800 passing). Don't break them.
