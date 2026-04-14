# Active Notes

Current state, in-progress work, and upcoming arcs.

---

## Current Status (2026-04-13)

### Arc 80: Fix Slide Width Leak — Name Stacking — COMPLETE (v0.49.0, 2026-04-13)

Bug fix: hidden answer name was affecting layout width on the slides page. "Witherbloom" being wider than other college names made the card wider before reveal, leaking the answer.

Fix: `fillCard()` now accepts `poolNames` and renders all pool names stacked in the same CSS grid cell (`grid-area: 1/1`). All names `visibility: hidden` except active one. Card is always as wide as the widest name in the pool. Client-proposed approach — self-adjusting, no hardcoded widths. DEC-275.

10/10 Playwright checks passed. 557px card width consistent across all slides. Version 0.49.0 confirmed in Honeycomb.

### Open follow-up: Update college card images with SOS cards

Card images currently use original STX set cards (DEC-272). After *Secrets of Strixhaven* releases April 24 and cards appear on Scryfall, update card references in `combos.ts` with SOS cards. Data-only change, no code changes needed.

---

## Previous Status (2026-04-11)

### Engagement: Strixhaven Colleges — DELIVERED

**Goal**: Add Strixhaven colleges as a new level in the app for the *Secrets of Strixhaven* set releasing April 24, 2026.

**Plan**:
- Arc 77: Level Abstraction (structural prerequisite) — **COMPLETE** (v0.46.0)
- Arc 78: Strixhaven Colleges Level (user-facing) — **COMPLETE** (v0.47.0)
- Arc 79: Fix Colleges End Page — **COMPLETE** (v0.48.0)
- Arc 80: Fix Slide Width Leak — **COMPLETE** (v0.49.0)

**Domain research**: `small-arc-studios/roles/domain-expert/notes/strixhaven-colleges-research.md`

### Arc 78: Strixhaven Colleges Level — COMPLETE (v0.47.0, 2026-04-11)

5 college combos (Silverquill, Prismari, Witherbloom, Lorehold, Quandrix) with ~17 cards each. Colleges placed as Level 1 for set launch timing. Reuses enemy color wheel. `session.tier = "college"` in telemetry. 5 combo reference pages generated. 70/70 Playwright checks passed. Honeycomb confirmed `app.version = 0.47.0`. Decisions DEC-270 through DEC-273.

### Arc 77: Level Abstraction — COMPLETE (v0.46.0, 2026-04-11)

Replaced hardcoded parallel maps with a data-driven `LEVELS` array. New file `src/levels.ts` is the single source of truth. `slides.ts`, `session.ts`, `guild-columns.ts`, and `end.ts` all simplified. 48/48 Playwright checks passed. Honeycomb confirmed `app.version = 0.46.0`. Decisions DEC-266 through DEC-269.

---

## Previous Status (2026-04-08)

### Arcs 73–76 COMPLETE — Example Deck, Test Affordances, Contrast Check, Screenshot-Diff Contrast Technique

**Arc 73** (v0.44.0): Golgari example deck added — Ygra squirrel deck on Archidekt. `edhrecUrl` field renamed to `deckUrl` on `ExampleDeck` type (DEC-251). Version stayed at 0.44.0.

**Arc 74** (v0.45.0): Test affordances — `?no-gas` on welcome page (skips canvas animation IIFE), `?paused` on slides page (clicks pause button after first card appears). Makes visual states stable for automated testing. DEC-252, DEC-253, DEC-254. 12/12 tests pass.

**Arc 75** (v0.45.0): Contrast check — `@axe-core/playwright` dev dependency, `tests/contrast-check.mjs` checks WCAG AA across 12 page+state combinations, `npm run test:contrast` added. Key findings:
- 1 definite violation: About page `.about-signup-blurb` — 3.2:1 contrast (needs 4.5:1). Fixed in Arc 76.
- 12 "incomplete" results — axe-core can't compute contrast through gradient/transparent backgrounds (expected limitation of the site's visual design).
- Assessment page check actually checks end page (auto-redirect) — known, not worth special-casing (DEC-257).

**Arc 76** (version NOT bumped — see below): Screenshot-diff contrast technique. Internal product. Fills the gap where axe-core reports "incomplete" for gradient/transparent backgrounds.
- `tests/contrast-screenshot-diff.mjs` — two-screenshot pixel-diff technique
- `npm run test:contrast-diff`, HTML report at `tests/contrast-report.html`
- Report shows cropped element screenshots, color swatches, annotated full-page screenshots, plain/annotated toggle
- `data-contrast-check` attribute added to menu and sound toggle buttons for SVG icon coverage
- `.about-signup-blurb` fixed: background changed from `--bg-khaki` to `--bg-brown-light` (5.3:1 contrast)
- **Results**: 56 elements, 20 passing / 36 failing across 4 pages — widespread issues on About and 404 pages
- Report meta-tested against itself: 370 elements, all passing
- **Process change**: Testing techniques are now formally an internal product per the Charter (DEC-264)
- Decisions: DEC-258 through DEC-265

**Version**: 0.45.0 (Arc 76 did not bump version — the technique is internal tooling. However, `data-contrast-check` attributes and the `about.css` fix did change production code. Consider bumping version in the next user-facing arc, or as a standalone structural bump if needed.)

### Contrast findings — open work

Arc 76 found widespread contrast failures:
- About page: body text, links, icons — multiple failures
- 404 page: body text, links, icons — multiple failures
- Slides level intro: subtitle and CTA fail even for large text
- Icons: menu icon as low as 1.5:1 on some pages

These are documented but not yet acted on. Future arc(s) should address contrast remediation.

---

## Previous Status (2026-04-01)

### Arc 72 COMPLETE — Reel Progress Dots (v0.44.0)

**Arc 72** (v0.44.0): 5 progress dots added to end screen reel — one per section (Allied, Enemy, Wedges, Shards, Share). Horizontally aligned with home-spiral logo (`left: 28px`), vertically centered on screen (`top: 50%`). Clicking a dot navigates to that section with reel animation. Active dot syncs with chevrons, scroll, dot clicks, and deep links. Telemetry: `end.progress_dot_click` event. Hidden on mobile (< 700px). DEC-249, DEC-250.

**Version**: 0.44.0

---

## Previous Status (2026-03-30)

### Arcs 64–71 COMPLETE — Button Logging, Card URLs, UX Polish, Operator Tooling (v0.41.0–0.42.0)

**Arc 64** (v0.41.0): Home page pause/fan button logging via CustomEvent dispatches in `mana-gas.js`; `welcome.ts` emits `home.gas_stop` and `home.gas_fan`. 8/8 tests pass. DEC-241.

**Arc 65** (v0.42.0): `slide.card_scryfall_url` attribute added to card spans in `slides.ts`. URL derived from Scryfall image UUID at runtime. 9/9 tests pass. DEC-242.

**Arc 66** (v0.42.0): Space key now resumes a paused deck by delegating to `pauseBtn.click()`. 10/10 tests pass. DEC-243.

**Arc 67** (v0.42.0): End screen URL updated via `history.replaceState` on section switch and initial load. Deep-linking (e.g. `/end?subgroup=shards`) works. 12/12 tests pass. DEC-244.

**Arc 68** (v0.42.0): Group descriptions added to combo index page via `scripts/build-combos.ts`. New `.combo-index-group-description` CSS class. 34/34 tests pass. DEC-245.

**Arc 69** (v0.42.0): End screen reel shows 60px window peek of adjacent sections. Edge-aware (first/last). CSS mask gradient widened. `PEEK_PX = 60` constant. 15/15 tests pass. DEC-246.

**Arc 70** (v0.42.0): "Site Usage Dashboard" Honeycomb board created — no code changes. 6 panels: page views, unique players/day, unique sessions/day, level popularity, sound usage, share/feedback. Board URL: https://ui.honeycomb.io/modernity/environments/sparrow-deck/board/wXrwy7TBMCv. DEC-247.

**Arc 71** (v0.42.0): `404.html` + `404.css` — MTG-themed 404 page ("Lost in the Blind Eternities"). Static HTML/CSS, no JS/telemetry. GitHub Pages serves automatically. 23/23 tests pass. DEC-248.

**Version**: 0.42.0

---

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
- ~~Space-to-resume pause on slides~~ — DELIVERED (Arc 66, v0.42.0)
- Cylinder unroll animation integration (using `cylinder-transition.js`)
- Four-color combinations (deferred in DEC-004, still out of scope)
- ~~Pronunciation audio for combo names~~ — DELIVERED (Arcs 55–57, v0.37.0, 2026-03-27; DEC-213 through DEC-227)
- ~~o11y: put the session id and player ID on every log~~ — RESOLVED: `session.id` and `player.id` were already resource attributes on the main app; `player.id` added to combo pages in Arc 61 (v0.40.0). All pages now have both.
- Adaptive pacing based on observability data
- `mana-gas-encounter` CustomEvent wired to Honeycomb telemetry
