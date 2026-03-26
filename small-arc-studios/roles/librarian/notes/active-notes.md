# Active Notes

Current state, in-progress work, and upcoming arcs.

---

## Current Status (2026-03-26)

Arc 47 (Progress Bar) completed 2026-03-26. Replaced text card counter with inline progress bar on slides page. 19/19 verification checks passed.

Arc 46 (Dual-Strategy buildSequence) is in progress. Implementation underway: adding `familiarity: "new" | "familiar"` parameter to `buildSequence`, implementing both sequencing strategies, verifying via sequence harness and tests.

Arc 44 (Level Intro Slide) completed 2026-03-25. Exploratory spaced repetition groundwork also completed 2026-03-25 (sequence module refactoring, sequence harness).

Arcs 42-43 (Name Scroll / Scroll Docks) were reverted; Arc 44 supersedes them with a simpler cinematic title card approach.

---

## Cylinder/Scroll Prototype — Research Complete, Not Yet Integrated

**Status**: Prototype complete. Integration into app is a future arc.

### What exists
- `cylinder-prototype.html` — full simulation with SVG spiral (top-down view) + CSS projection (side view)
- `cylinder-css-prototype.html` — pure CSS transitions using the transition module
- `cylinder-projection.js` — pure computation module (no DOM): `computeScaffold()`, `computeProjection()`, `thetaToArcLength()`
- `cylinder-transition.js` — end product: `computeTransition({ spiralLength, stopRemaining })` → start/end CSS values + cubic-bezier timing strings
- `tests/cylinder-projection.test.mjs` — 42 regression tests

### Key findings
- Animation: Archimedean spiral, constant angular velocity + ease-in-out. Paper unrolls faster when coil is large (physically accurate).
- Bezier approximation: Lookup table with 12 ratio points keyed on `stopRemaining/spiralLength`. Max error ~0.6% normalized. Single table works across all stroke/gap variations.
- Decisions: DEC-152 through DEC-159.

### Next steps for integration
- Put content inside the paper strip (the div is already content-ready)
- Use `computeTransition()` to animate page reveals in the app

---

## Level Intro Slide — Delivered (Arc 44, supersedes Arcs 42–43)

Arcs 42-43 (Name Scroll / Scroll Docks) were reverted because the scroll+dock approach didn't work. Arc 44 delivered the valuable part: a cinematic title card that previews level name, subtitle, and all five combo names (in GoudyMediaeval) before the quiz starts. Dismissed by click/tap/spacebar with a 150ms fade.

The cylinder prototype still lays groundwork for a future visual upgrade if a scroll animation is revisited.

---

## Process Change: RFP + SOW → Single Plan Document (DEC-107, 2026-03-07)

The separate RFP (discovery) and SOW (arc planning) stages were merged into a single "Plan" document with two sections. One approval gate instead of two. All plans from Feedback Input onward use this format.

---

## Open Technical Threads

### Mana Gas Three-Color Telemetry
- `mana-gas-encounter` CustomEvent dispatched on triple formation but no Honeycomb listener wired yet.
- `mana-gas.js` is standalone vanilla JS — CustomEvent is the cross-boundary pattern. Future arc wires the listener in bundled code.

### Deploy Markers
- GitHub Actions step exists but requires `HONEYCOMB_API_KEY` secret in repo settings. Client action needed.

### flushSpans() Reliability
- Current implementation calls `forceFlush()` but the OTel provider may not support it. DEC-147 documents the lesson about silent failure. Full reliable flush would require storing the `HoneycombWebSDK` instance and calling `sdk.shutdown()`. Deferred.

---

## Spaced Repetition Groundwork — Arc 46 Underway

**Status**: Foundation in place (Arc 45 exploratory). Arc 46 is implementing the dual-strategy `buildSequence`.

### What exists
- `src/sparrow-deck.ts` — `shuffle`, `buildSequence`, `buildDeck`. `buildSequence` is the pure-numbers ordering layer.
- `SlideSelection = [comboIndex, cardIndex]` — both 1-indexed tuple type, exported from `sparrow-deck.ts`.
- `src/session.ts` — imports `buildDeck` from `sparrow-deck.ts` (local shuffle/buildDeck removed).
- `sequence-harness.html` + `src/sequence-harness.ts` — visual inspection page for sequence aesthetics. Uses abstract labels (A-E combos, F-Z cards). Available in production.
- `tests/test-harness.mjs` — Playwright test for the harness.
- `npm run build:harness` — standalone build script.

### Arc 46: Dual-Strategy buildSequence (active)
- `buildSequence` gains `familiarity: "new" | "familiar"` parameter (DEC-169).
- **"familiar"** strategy: existing shuffle-and-repeat + minimum-gap constraint of 2 (DEC-170).
- **"new"** strategy: gradual introduction — starts with 2 combos, adds one every ~6-8 appearances (DEC-171). Length becomes a minimum.
- Strategy selection rationale: research favors interleaving, but Falco's direct experience supports gradual intro for unfamiliar proper nouns (DEC-172).
- Future signal noted: click-vs-timer-advance as implicit confidence signal for adaptive requeue (DEC-173, deferred).

### Key decisions
- DEC-165: `buildSequence` is domain-agnostic (pure numbers).
- DEC-166: Harness uses abstract labels, not guild names.
- DEC-167: Harness is production-accessible.
- DEC-168: `SlideSelection` tuple, 1-indexed.
- DEC-169–173: Arc 46 strategy decisions (see decision-log.md).

---

## Future Feature Candidates (from TODO.md and prior plans)

- ~~Progress dots for reel navigation~~ — replaced by Arc 47 progress bar
- Space-to-resume pause on slides
- Cylinder unroll animation integration (using `cylinder-transition.js`)
- Four-color combinations (deferred in DEC-004, still out of scope)
- Pronunciation audio for combo names (DEC-018, still deferred)
- Adaptive pacing based on observability data
- `mana-gas-encounter` CustomEvent wired to Honeycomb telemetry
