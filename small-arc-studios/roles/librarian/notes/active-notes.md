# Active Notes

Current state, in-progress work, and upcoming arcs.

---

## Current Status (2026-03-30)

### Arcs 59, 60, 61, 63 COMPLETE — Combos Navigation, Menu, Telemetry & Bug Fix (v0.40.0)

**Arc 59** (v0.39.0): Added "Combos" link to hamburger menu (`src/ui/menu.ts`), between "Levels" and "About", linking to `/combo/`. 9/9 tests pass. DEC-236.

**Arc 60** (v0.40.0): Added prev/next navigation to all 20 combo pages via `scripts/build-combos.ts`. Allied → Enemy → Wedges → Shards ordering. No wrapping on first/last pages. CSS in `combo.css`. 40/40 tests pass. DEC-237, DEC-238.

**Arc 61** (v0.40.0): Added `mtg-sparrow.player.id` resource attribute to `src/combo-telemetry.ts` using same localStorage key as main app — enables cross-page player correlation in Honeycomb. 9/9 tests pass; schema confirmed. Full Honeycomb verification requires production deploy. DEC-239.

**Arc 63** (v0.40.0): Fixed `updateNavButtons()` in `src/ui/guild-columns.ts` — added `'shards'` to `nextIsNewLevel` condition. 7/7 tests pass. DEC-240.

**Version**: 0.40.0

---

### Arc 58 COMPLETE — iOS Safari Audio Unlock Bug Fix + Viewport Instrumentation (v0.38.0)

Bug fix arc triggered by real-world iPad testing. Audio worked on desktop but was silently blocked by Safari's autoplay policy on iOS. Fixed by calling `unlockAudio()` (a silent WAV played from the level intro dismiss gesture) before any timer-driven audio fires, and by reusing the unlocked `HTMLAudioElement` in `playAudio()`. Combo pages unaffected. Decisions DEC-228 through DEC-231.

The same iPad testing session also revealed layout issues (exit button below fold on iPad; too-small slide area on ultrawide). The Observability Engineer added viewport/screen instrumentation as an extension to Arc 58:
- Resource attributes: `screen.width`, `screen.height`, `viewport.width`, `viewport.height` (on every span)
- Session span attributes: `session.page_height`, `session.viewport_height`, `session.has_scrollbar`, `session.slide_height_pct`
- Honeycomb board "Screen & Viewport Analysis" created for ongoing layout monitoring

Decisions DEC-232 through DEC-235. See arc-history.md for full record.

---

## Previous Status (2026-03-27)

### Arcs 55–57 COMPLETE — Audio Pronunciation Feature Delivered (v0.37.0)

All three audio arcs delivered and complete.

- **Arc 55**: Sound toggle UI on all main pages; `mtg-sparrow.sound.enabled` in localStorage; default ON; `sound.toggle` telemetry event. Version bumped to 0.37.0.
- **Arc 56**: `playComboAudio()` in `src/audio.ts` called at 3 `revealName` sites; respects toggle; `sound.enabled` + `sound.play_result` on card span.
- **Arc 57**: Play button injected inside combo name `<h1>` via `combo-telemetry.ts`/`DOMContentLoaded`; uses `playAudio()` (bypasses toggle — explicit user action).

**Key architectural notes**:
- Two audio functions: `playComboAudio()` (toggle-aware, for auto-play) and `playAudio()` (unconditional, for explicit buttons).
- 33 audio files in `audio/` (20 combos + mono colors + not-colors + colorless + WUBRG variants).
- Combo index page links changed from relative to absolute paths (`/combo/id.html`) for local dev server compatibility.
- `combo-telemetry.ts` play button injection must be inside `DOMContentLoaded`.

**Decisions**: DEC-213 through DEC-227. See arc-history.md for full arc records.

---

## Previous Status (2026-03-26)

Static combo reference pages delivered outside formal arc process. 20 combo pages at `combo/<id>.html` + index at `combo/index.html`. Build script `npm run build:combos`. End page "More X cards →" links now point to combo pages (renamed telemetry event: `end.combo_page_click`). No version bump yet. Decisions DEC-195 through DEC-202. See arc-history.md for full details.

Arc 49 (Clean Up End Page URL Parameters) completed 2026-03-26. Removed `cards`, `completed`, and `assessment` URL params from assessment→end navigation. `navigateToEnd` now passes only `subgroup`. End page simplified to read assessment from localStorage. `session.summary` span retained but carries only `session.subgroup`. Version bumped to 0.31.0. 29/29 Playwright checks PASS. Decision DEC-193.

Arc 49 (localStorage Adapter) completed 2026-03-26 (earlier). All localStorage writes now routed through `src/storage.ts` adapter, emitting `localStorage.update` logs with `storage.adapter_version: "v1"`. Deliberate exception for player ID write in telemetry.ts (circular dependency). 11/11 verification checks PASS. Decisions DEC-188 through DEC-191.

Arc 48 (Mana Color Gradient Progress Bar) completed 2026-03-26. Progress bar now shows a mana-color gradient from the deck sequence, revealed progressively using cover-reveal approach. Decisions DEC-182 through DEC-187.

Arc 47 (Progress Bar) completed 2026-03-26. Replaced text card counter with inline progress bar on slides page. 19/19 verification checks passed.

Arc 46 (Dual-Strategy buildSequence) completed 2026-03-26. Both strategies (new/familiar) implemented and verified with 800 property tests. `buildSequenceWithSections` exports section boundary metadata — future integration point for progress bar display (DEC-180).

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

## Spaced Repetition — Arc 46 Complete

**Status**: Arc 45 (exploratory groundwork) and Arc 46 (dual-strategy buildSequence) both complete.

### What exists
- `src/sparrow-deck.ts` — `shuffle`, `buildSequence`, `buildDeck`, `buildSequenceWithSections`. `buildSequence` is the pure-numbers ordering layer.
- `SlideSelection = [comboIndex, cardIndex]` — both 1-indexed tuple type, exported from `sparrow-deck.ts`.
- `src/session.ts` — imports `buildDeck` from `sparrow-deck.ts` (local shuffle/buildDeck removed).
- `sequence-harness.html` + `src/sequence-harness.ts` — visual inspection page for sequence aesthetics. Uses abstract labels (A-E combos, F-Z cards). Available in production.
- `tests/test-harness.mjs` — Playwright test for the harness.
- `npm run build:harness` — standalone build script.
- `npm run test:sequence` — 800 property tests (50 trials × 16 properties) for both strategies.

### Arc 46 summary
- `buildSequence` takes `familiarity: "new" | "familiar"` (DEC-169).
- **"familiar"**: shuffle-and-repeat, MIN_GAP=1 for pool>=3 (DEC-170, DEC-175).
- **"new"**: gradual introduction, generate-then-trim, REPS_BEFORE_NEXT=3, MAX_SECTION_LENGTH=9 with thinning (DEC-171, DEC-174, DEC-176, DEC-177, DEC-178).
- **Both strategies**: `dedupConsecutiveCards` post-processing (DEC-179).
- `buildSequenceWithSections` exports `SequenceSection[]` — future integration point for progress bar (DEC-180).

### Future integration point
- Section boundaries (`SequenceSection[]` from `buildSequenceWithSections`) carry `introducedCombo` per section. Could power a progress bar that shows which combo is being introduced. Client noted this as a "getting cute" opportunity (DEC-180).

### Key decisions
- DEC-165: `buildSequence` is domain-agnostic (pure numbers).
- DEC-166: Harness uses abstract labels, not guild names.
- DEC-167: Harness is production-accessible.
- DEC-168: `SlideSelection` tuple, 1-indexed.
- DEC-169–181: Arc 46 strategy and implementation decisions (see decision-log.md).

---

## Version Bump for Combo Pages — RESOLVED

Combo pages were delivered outside the formal arc process with no version bump. This was resolved by Arc 55, which bumped `APP_VERSION` to v0.37.0.

---

## Future Feature Candidates (from TODO.md and prior plans)

- ~~Progress dots for reel navigation~~ — replaced by Arc 47 progress bar
- Combo reference pages — DELIVERED (outside formal arc, 2026-03-26) — 20 static pages at `combo/<id>.html` + index. Scryfall links now go through combo pages first.
- Space-to-resume pause on slides
- Cylinder unroll animation integration (using `cylinder-transition.js`)
- Four-color combinations (deferred in DEC-004, still out of scope)
- ~~Pronunciation audio for combo names~~ — DELIVERED (Arcs 55–57, v0.37.0, 2026-03-27; DEC-213 through DEC-227)
- ~~o11y: put the session id and player ID on every log~~ — RESOLVED: `session.id` and `player.id` were already resource attributes on the main app; `player.id` added to combo pages in Arc 61 (v0.40.0). All pages now have both.
- Adaptive pacing based on observability data
- `mana-gas-encounter` CustomEvent wired to Honeycomb telemetry
