# Arc History

All completed arcs for the MTG Sparrow (MTG Colors) project.

---

## Phase 1: Core Sparrow Deck (Arcs 1–2b, v0.1.0–0.3.0)

### Arc 1: Project Scaffolding — COMPLETE (v0.1.0, 2026-02-15)
- **Type**: Structural
- **What**: TypeScript + esbuild pipeline, Honeycomb Web SDK via wrapper module, `app.startup` span, `v0.1.0` in footer.
- **Key decisions**: DEC-028 (scripts/ policy), DEC-029 (Honeycomb API key embedded in bundle).
- **Learning**: Bundle 147.3KB (vs ~50KB estimate) — not a concern per client.
- **Verification**: 8/8 PASS. Honeycomb confirmed `app.startup` span with `service.version=0.1.0`.

### Arc 2a: Render a Single Card — COMPLETE (v0.2.0, 2026-02-16)
- **Type**: User
- **What**: `ColorCombo` data type, all 10 guild records, SVG mana pip rendering for all 5 colors, card layout with dark container, click-to-cycle.
- **Key decisions**: Followed DEC-006, DEC-017, DEC-026.
- **Learning**: Inline SVG works well for pip rendering. Headless Playwright needs ~10s delay for SDK span flush.
- **Verification**: 8/8 PASS.

### Arc 2b: Cycle Through a Deck — COMPLETE (v0.3.0, 2026-02-16)
- **Type**: User
- **What**: Core Sparrow Deck interaction loop — shuffled 50-card deck, auto-reveal at 2.5s, auto-advance at 1s, early-tap (click/spacebar), progress counter, session/card span hierarchy in Honeycomb.
- **Key attributes**: `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.dwell_time_ms`, `card.advanced_early`, `session.card_count`, `session.completed`.
- **Verification**: 16/16 PASS. Honeycomb confirmed full span hierarchy.

---

## Phase 1 Enhancements (Arcs 3–6, v0.4.0–0.6.0)

_(Arcs 3 and 4 records not preserved — they predated full record-keeping. Arc 5 is welcome screen.)_

### Arc 5: Welcome Screen — COMPLETE (v0.5.0, 2026-02-19)
- **Type**: User
- **What**: Welcome screen replaces auto-start. Title, instructions with "Boros" example, "say it out loud" subtext, "Learn guild names" button. `session.started_from` and `session.welcome_dwell_ms` telemetry attributes added.
- **Key decisions**: DEC-030 (welcome replaces auto-start), DEC-031 (button styled prominently), DEC-032 (`session.started_from` for future entry points).
- **Verification**: 27/27 PASS.

### Arc 6: Static Welcome Screen — COMPLETE (v0.6.0, 2026-02-20)
- **Type**: Structural
- **What**: Moved welcome screen from JS DOM construction to static HTML. `showWelcomeScreen()` deleted. `welcome.render_mode = 'static_html'` structural marker added.
- **Key decisions**: DEC-033 (static content in HTML, JS wires behavior only).
- **Verification**: 35/35 PASS. Zero UX change, fundamental architectural correction.

---

## Phase 2: Guild Subgroups & End Screen (Arcs 7–10, v0.7.0–0.9.0)

### Arc 7: Guild Subgroups — COMPLETE (v0.7.0, 2026-02-24)
- **Type**: User
- **What**: Split 10 guilds into allied (Azorius, Dimir, Rakdos, Gruul, Selesnya) and enemy (Orzhov, Izzet, Golgari, Boros, Simic) subgroups of 5. Allied is default. End screen shows two navigation buttons. `session.tier` emits `'guild_allied'` or `'guild_enemy'`. `session.subgroup_size = 5`.
- **Key decisions**: DEC-034 (allied/enemy split), DEC-036 (end screen navigation with other subgroup as primary).
- **Note**: Original DEC-034 approval had incorrect groupings; implementation corrected to standard MTG definition.
- **Verification**: 46/46 PASS.

### Arc 8: Session End Screen Redesign — COMPLETE (v0.8.0, 2026-02-25)
- **Type**: User (redirected from planned Card Images arc)
- **What**: Two-column educational layout. Allied always visible (header, educational text, guild list with pips, button). Enemy locked until first completed enemy session — persistent via `sparrow-deck.progression` localStorage. `src/progression.ts` module encapsulates all localStorage. `session.enemy_unlocked` boolean on all sessions. `progression.enemy_unlocked` event on first unlock only.
- **Key decisions**: DEC-037 (two-column educational layout), DEC-038 (localStorage key structure via `sparrow-deck.progression`).
- **Verification**: 50/50 PASS.

### Arc 8 Post-Enhancement: Color Wheel Integration — COMPLETE (v0.8.0, 2026-02-25)
- **Type**: User enhancement (no version bump)
- **What**: SVG pentagon color wheel with allied lines in allied column. Bidirectional hover between wheel lines and guild list (JS bridges SVG/HTML DOM boundary). Wide transparent hit-area overlays on lines. "Learn" vs "Practice" button text based on `completedSubgroups` in localStorage.
- **Key decisions**: DEC-039 (SVG over Canvas for individually-targetable elements), DEC-040 (`<image>` tags for mana symbol reuse in SVG), DEC-041 (JS required for SVG/HTML hover bridge), DEC-042 ("Learn" vs "Practice" based on completion history).

### Arc 9: Enemy Color Wheel — COMPLETE (v0.8.0, 2026-02-25)
- **Type**: User
- **What**: Enemy star-pattern SVG wheel in enemy column. Refactored allied wheel code into generic `buildColorWheel(pairs, lineColor)` and `wireColorWheelHover(svg, guildListEl)`. Enemy column content gated on any enemy practice (not just completion). CSS custom properties `--allied-line-color`, `--enemy-line-color` introduced as future visual differentiation seam.
- **Key decisions**: DEC-043 (generic functions over duplication), DEC-044 (CSS custom properties as seam), DEC-045 (any enemy practice unlocks content), DEC-046 (build system stays esbuild).
- **Verification**: 130/130 PASS.

### Arc 10: Settings Panel — COMPLETE (v0.9.0, 2026-02-25)
- **Type**: User
- **What**: Gear icon replaces version footer. Settings panel: version display, Honeycomb trace link (session-gated), single-tap progress reset with `settings.reset_progress` telemetry. Static HTML in `index.html`, wired by JS.
- **Key decisions**: DEC-047 (gear icon replaces footer), DEC-048 (single-tap reset, no confirmation), DEC-049 (settings panel as static HTML).
- **Verification**: 34/34 PASS.

---

## Phase 3: Card Images (Arcs 11–12, v0.10.0–0.11.0)

### Arc 11: Card Images — Allied Guilds — COMPLETE (v0.10.0, 2026-02-27)
- **Type**: User
- **What**: Allied guild slides show random card image (left) with pips/name (right). 50 card references (10 per guild). Two-column CSS grid, responsive stacking. `slide.card_name` telemetry. Card selected at deck-build time (not render time).
- **Key decisions**: DEC-050 (alt="" — card IS the lesson, no names), DEC-051 (random selection at deck-build time for deterministic per-session behavior), DEC-052 (max-width bumped to 700px).
- **Verification**: 18/18 PASS.

### Arc 12: Card Images — Enemy Guilds — COMPLETE (v0.11.0, 2026-02-27)
- **Type**: User (pure data arc, zero code changes)
- **What**: 50 card references added for 5 enemy guilds (10 per guild). All 10 guilds now have card images.
- **Verification**: 15/15 PASS + 13/13 Arc 11 regression PASS.
- **Note**: The team earned a pizza party after delivering both card image arcs back-to-back.

---

## Multi-Page Decomposition (Arcs 14–21, v0.12.0–0.20.0)

### Arc 14: Session ID Telemetry — COMPLETE (v0.12.0, 2026-03-01)
- **Type**: Operator
- **What**: `mtg-sparrow.session.id` (16-char hex, sessionStorage) as resource attribute on all spans. `app.navigation = 'single_page'` structural marker. Added first, before any structural changes (observability-first per DEC-056).
- **Key decisions**: DEC-055 (per-page telemetry with session.id for correlation), DEC-056 (telemetry first in arc sequencing).
- **Verification**: 6/6 PASS, Honeycomb confirmed both attributes.
- **Note**: Pre-existing `flushSpans()` bug noted — must fix before multi-page arcs.

### Arc 15: CSS Split — COMPLETE (v0.13.0, 2026-03-01)
- **Type**: Structural
- **What**: `style.css` (948 lines) split into 5 files: `style.css` (shared), `welcome.css`, `slides.css`, `assessment.css`, `end.css`. 8 dead CSS rules removed. `css.split = true` structural marker.
- **Key decisions**: DEC-057 (CSS split strategy), DEC-058 (8 dead rules removed during split).
- **Verification**: 23/23 PASS, no visual regressions.

### Arc 16: Module Extraction — COMPLETE (v0.14.0, 2026-03-01)
- **Type**: Structural
- **What**: Three modules extracted from `main.ts` into `src/ui/`: `guild-columns.ts`, `self-assessment.ts`, `settings.ts`. `main.ts` reduced from 957 to 438 lines. `app.module_structure = 'extracted'` structural marker.
- **Key decisions**: DEC-059 (callback pattern for cross-module dependencies), DEC-060 (version bump + marker).
- **Verification**: 23/23 PASS.

### Arc 17: Slides Page — COMPLETE (2026-03-02)
- **Type**: Structural
- **What**: `slides.html` + `src/slides.ts` created. Full card session loop moved to new page. `flushSpans()` bug fixed (DEC-065 — typeof guard + .catch()). `flushSpans()` called before navigation. Slides navigates to `assessment.html` (404 until Arc 18).
- **Key decisions**: DEC-061 (navigate to 404 rather than temporary shim), DEC-062 (no mana gas on slides), DEC-063 (welcome_dwell_ms via URL param), DEC-064 (flushSpans before navigation), DEC-065 (flushSpans bug fix), DEC-066 (assessment/end logic excluded from slides).

### Arc 18: Assessment Page — COMPLETE (2026-03-02)
- **Type**: Structural
- **What**: `assessment.html` + `src/assessment.ts` created. Self-assessment ("How did that feel?") as its own page between slides and end. Skip logic: fewer than 3 cards skips directly to end.html.
- **Key decisions**: DEC-068 (assessment skip logic for short sessions).

### Arc 19: End Page — COMPLETE (2026-03-02)
- **Type**: Structural
- **What**: `end.html` + `src/end.ts` created. Display driven by localStorage, not URL params. Navigation buttons link to `slides.html?subgroup=X&from=end`.
- **Key decisions**: DEC-069 (display from localStorage, telemetry from URL params), DEC-070 (navigation via page links not in-page session start).

### Arc 20: Welcome Page Completion — COMPLETE (2026-03-02)
- **Type**: Structural
- **What**: `main.ts` renamed/replaced by `src/welcome.ts`. Build unified to 4 named entry points: `welcome.js`, `slides.js`, `assessment.js`, `end.js`. `bundle.js` retired. All 4 pages now emit `app.navigation = 'multi_page'`.
- **Key decisions**: DEC-071 (main.ts deleted, replaced by welcome.ts), DEC-072 (all pages emit multi_page structural marker).

### Arc 21: Cross-Page Telemetry Verification — COMPLETE (v0.20.0, 2026-03-02)
- **Type**: Operator
- **What**: End-to-end verification that `mtg-sparrow.session.id` correlates spans across all 4 pages. `flushSpans()` made async and awaited before navigation.
- **Key decisions**: DEC-073 (flushSpans async + awaited before navigation), DEC-074 (URL param stripping by local serve — known limitation, no fix).
- **SOW completion**: Multi-Page Decomposition SOW closed. v0.20.0.

---

## End Screen Refinements (Arcs 22–23, v0.21.0)

### Arc 22: End Screen Row Layout — COMPLETE (v0.21.0, 2026-03-02)
- **Type**: User
- **What**: Two-column layout replaced by full-width stacked rows, one per level. Three-part layout per row: summary (left), color wheel (center), flavor panel (right). Flavor panel shows guild name placeholder (full descriptions in Arc 23). `end.layout_version = 'rows_v1'`.
- **Key decisions**: DEC-075 (row layout), DEC-076 (placeholder in flavor panel), DEC-077 (flavor descriptions in separate `guild-descriptions.ts`).
- **Verification**: 36/36 PASS.

### Arc 23: Guild Flavor Text — COMPLETE (v0.21.0, 2026-03-02)
- **Type**: User
- **What**: Full guild flavor text wired from `guild-descriptions.ts` into flavor panel. Scryfall links. Three iconic cards added (Azor, Voice of Resurgence, Savra). `end.guild_highlight` and `end.scryfall_click` telemetry spans.
- **Key decisions**: DEC-078 (flavor panel content order), DEC-079 (guild interaction telemetry), DEC-080 (iconic card additions).
- **Verification**: 36/36 PASS.
- **SOW completion**: End Screen Refinements SOW closed.

---

## Tangent: Slot Machine / Reel Navigation (2026-03-02, DEC-081–089)

Unplanned exploration session. Slot machine prototype built as standalone page first, then mechanic applied to end screen. Replaced the rows_v1 layout with a reel that shows one section at a time.

### What was delivered:
- `slot-machine.html` prototype (since removed in Arc 37 cleanup)
- End screen reel navigation: one level visible at a time in a clipping viewport, scroll or nav buttons to advance, `cubic-bezier(0.2, 0.8, 0.3, 1.05)` at 600ms with gentle bounce
- 700ms timestamp gate for trackpad inertia (later replaced in Arc 27)
- `end.page_view` root span, `end.section_view` child spans for time-on-section observability
- `end.layout_version = 'reel_v1'`
- Mutable `SpanRef` pattern to avoid stale closures in event handlers

---

## Wedges & Shards (Arcs 27–31, v0.23.0–0.26.0)

### Arc 27: Wheel Telemetry & Double-Scroll Fix — COMPLETE (v0.23.0, 2026-03-02)
- **Type**: Technical (Observability + Bug Fix)
- **What**: Instrumented wheel events in Honeycomb, diagnosed double-scroll root cause from trace data, replaced 700ms cooldown timer with accumulated deltaY threshold (700). Moved listener from viewport to document. Reduced telemetry from ~1000+ events to ~dozen.
- **Key decisions**: DEC-090 (accumulated deltaY over cooldown timer), DEC-091 (listener on document), DEC-092 (reduce telemetry volume).
- **Root cause**: Trackpad inertia outlasts the cooldown — accumulation naturally absorbs it.
- **Verification**: 17/17 PASS.

### Arc 28: Wedge & Shard Data — COMPLETE (v0.23.0, 2026-03-02)
- **Type**: Structural (Data Layer)
- **What**: 10 three-color combos added to existing `guilds` array in `combos.ts`, discriminated by `tier: 'wedge' | 'shard'`. ~100 iconic cards curated across all combos (EDHREC popularity + block legendaries). Flavor descriptions added to `guild-descriptions.ts`. `data.tier_version = 'three_color_v1'` structural marker.
- **Key decisions**: DEC-093 (one array with tier discriminator), DEC-094 (card curation methodology), DEC-095 (descriptions in existing file), DEC-096 (structural marker).
- **Verification**: 59/59 PASS. Honeycomb confirmed structural marker.

### Arc 29: Three-Color Sessions — COMPLETE (v0.24.0, 2026-03-02)
- **Type**: User
- **What**: `GuildSubgroup` type expanded to include `"wedges"` and `"shards"`. Progression chain extended: allied → enemy → wedges → shards → null. `card.tier = wedge` or `shard` on card spans.
- **Key decisions**: DEC-097 (type expanded in-place, not renamed), DEC-098 (linear progression chain), DEC-099 (`session.tier` uses singular `wedge`/`shard`).
- **Verification**: 24/24 PASS.

### Arc 30: End Screen Wedge Section — COMPLETE (v0.25.0, 2026-03-02)
- **Type**: User
- **What**: Wedge section at reel index 2. `buildTriangleWheel` using SVG polygon elements (not lines) connecting 3 pentagon nodes per wedge. Purple/violet color theme. Cross-column hover deselect extended to 3 columns.
- **Key decisions**: DEC-100 (polygon over lines — communicates three-way binding), DEC-101 (purple/violet theme), DEC-102 (reuse `end.guild_highlight` span name), DEC-103 (section ordering: allied=0, enemy=1, wedges=2).
- **Verification**: 39/39 PASS.

### Arc 31: End Screen Shard Section — COMPLETE (v0.26.0, 2026-03-02)
- **Type**: User
- **What**: Shard section at reel index 3. Reuses triangle wheel pattern from Arc 30, teal/cyan color theme. `end.layout_version = 'reel_v2'` for 5-section layout. 4-column cross-deselect.
- **Key decisions**: DEC-104 (teal/cyan theme), DEC-105 (reuse triangle pattern), DEC-106 (reel_v2 for 5-section layout).

---

## Mana Gas Interactions (Arcs 32–33, 2026-03-07)

### Arc 32: Draggable Mana Symbols — COMPLETE (2026-03-07)
- **Type**: Feature
- **What**: Mouse and touch drag on mana gas particles. Grabbed symbol 20% larger with drop shadow. Pool-ball collision while dragging. Momentum on release. `mana-gas-drag` CustomEvent bridges to bundled telemetry. `mana_gas.drag` span in welcome.ts.
- **Note**: Canvas event listeners won't fire if z-index overlay exists — used document-level listeners with coordinate conversion.

### Arc 33: Three-Color Encounters in Mana Gas — COMPLETE (2026-03-07)
- **Type**: User
- **What**: TRIPLES map (10 combos). Third matching particle upgrades two-color encounter to triple. Triple name replaces guild name. Gold visual treatment (gold stroke, 22px bold gold text, 2.8x bubble radius). Downgrade when third particle drifts. `mana-gas-encounter` CustomEvent dispatched (no Honeycomb listener wired yet).
- **Key decisions**: DEC-108 (upgrade/downgrade model), DEC-109 (triple name replaces guild name), DEC-110 (gold visual distinction), DEC-111 (CustomEvent for cross-boundary communication).
- **Verification**: 25/25 PASS.

---

## Telemetry Improvements (Arc 34, 2026-03-08)

### Arc 34: Trace-Participating OTel Logs — COMPLETE (2026-03-08)
- **Type**: Structural (Telemetry)
- **What**: Replaced `addSpanEvent()` with `emitLog()` using OTel Logs API. Logs sent immediately via `SimpleLogRecordProcessor`, not waiting for parent span end. Upgraded `@honeycombio/opentelemetry-web` from 0.10.x to 1.3.0 (v1.x adds LoggerProvider). 4 call sites converted: `progression.subgroup_unlocked`, `session.pause`/`session.resume`, `user.tap`, `end.wheel_event`. `addSpanEvent()` retained.
- **Key decisions**: DEC-112 (logs over span events for reliability), DEC-113 (SDK upgrade to 1.x), DEC-114 (explicit context passing for trace correlation), DEC-115 (keep addSpanEvent available).
- **Verification**: 16/16 PASS.

---

## Publish Readiness (Arcs 35–39, v0.27.0, 2026-03-08)

### Arc 35: Fix User-Facing Bugs — COMPLETE (2026-03-08)
- **Type**: Bug Fixes
- **What**: Relative home link (`./` not `/`), `aspect-ratio: 5/7` on card images (prevents layout shift), Scryfall image fallback (hide column on error), reel animation fix (opacity-only `reelFadeIn` replaces scale animation that conflicted with translateY transition).
- **Key decisions**: DEC-116 (relative home link), DEC-117 (reserve image space), DEC-118 (graceful Scryfall fallback), DEC-119 (root cause: animation/transition conflict on `transform` property).

### Arc 36: Identity, License, About, Share — COMPLETE (v0.27.0, 2026-03-08)
- **Type**: Feature
- **What**: CC0 LICENSE file. All page titles → "MTG Colors". Domain `mtgcolors.quest`. SVG favicon (WUBRG circles pentagon). Open Graph meta tags. `about.html` page with attributions. "Copy link" button with `utm_source=share&utm_id={session_id}`. UTM params captured as OTel resource attributes (`utm.source`, `utm.referral_session_id`). Share section on end screen.
- **Key decisions**: DEC-120 (domain mtgcolors.quest), DEC-121 (site title "MTG Colors"), DEC-122 (about page as separate HTML), DEC-123 (SVG favicon, og:image deferred), DEC-124 (copy link + UTM tracking), DEC-125 (UTM as resource attributes on all spans).
- **Verification**: 71/71 PASS.

### Arc 37: Cleanup — COMPLETE (v0.27.0, 2026-03-08)
- **Type**: Structural
- **What**: `APP_VERSION` extracted to `src/version.ts` (single source of truth across 5 entry points). Version bumped 0.20.0 → 0.27.0. Five prototype pages removed (`prototype.html`, `color-wheel-test.html`, `mana-gas.html`, `slot-machine.html`, `card-back-demo.html`) with related CSS/TS assets.
- **Key decisions**: DEC-126 (version.ts), DEC-127 (version 0.27.0), DEC-128 (prototypes removed).
- **Verification**: 49/49 PASS.

### Arc 38: Mobile Welcome — COMPLETE (2026-03-08)
- **Type**: Feature (Responsive Design)
- **What**: Two HTML content blocks (`.welcome-desktop`, `.welcome-mobile`) toggled by CSS media query at 600px. Condensed mobile version: "MTG Colors" heading, 3 list items, Start button. Both buttons share `.welcome-start-btn` class.
- **Key decisions**: DEC-129 (dual-block HTML with CSS toggle), DEC-130 (600px breakpoint).
- **Verification**: 20/20 PASS.

### Arc 39: Deploy Markers — COMPLETE (2026-03-08)
- **Type**: Infrastructure
- **What**: Post-deploy step in GitHub Actions sends marker to Honeycomb `__all__` datasets with commit SHA and GitHub link. Local `scripts/deploy-marker.sh` for manual use. Requires `HONEYCOMB_API_KEY` secret in GitHub repo settings (client action needed).
- **Key decisions**: DEC-131 (`__all__` datasets for broad coverage), DEC-132 (post-deploy step in existing workflow), DEC-133 (local script for manual use).

---

## Post-Publish Polish (between plans, 2026-03-08 to 2026-03-09)

### Menu Redesign (post-plan polish, 2026-03-08)
- Settings panel HTML deduplicated — `injectMenuDOM()` in `settings.ts` creates all menu DOM dynamically. No menu HTML in any `.html` file.
- Gear icon → hamburger (☰). Title: "MTG Colors". Items: About, Share, Feedback, Reset Progress, Current trace.
- `--menu-action-color` CSS variable for consistent coloring.
- **IMPORTANT**: `wireSettings()` must be called before any code that accesses menu DOM elements (e.g., trace link wiring).

### Logo Design (2026-03-08)
- `src/ui/logo.ts` with `renderLogo()` — Archimedean spiral as CSS mask on conic gradient (5 mana colors), mana symbol silhouettes in pentagon. Used on about page.
- `images/logo/{W,U,B,R,G}.svg` — silhouettes only (no background circles).
- Logo validated as mirror-finish glitter sticker (DEC-137).
- DEC-134 through DEC-137.

### Slides Button Cleanup (2026-03-09)
- "Done for now" button restyled to match site-wide turquoise pattern.
- Controls moved from `position: fixed` overlay into normal flow.
- `button-steady` class prevents animation replay on DOM re-insertion.

### Logo Polish (2026-03-09)
- Entrance spin animation added to logo spiral (starts 20° clockwise, eases back over 0.8s), moved to static CSS `.logo-spiral` class.
- CSS placeholder sizing on `.about-logo` to prevent layout shift.
- Mana symbol `alt=""` to prevent letter flash during load.

---

## Email Signup & Feedback (Arcs 40–41, 2026-03-09 to 2026-03-10)

### Arc 40: Email Signup on About Page — COMPLETE (2026-03-09)
- **Type**: Enhancement
- **What**: "Pause on my Upkeep" section on about page with ConvertKit inline form (data-uid=df1fad2ec7). Positioned after intro, before Acknowledgments. `about.has_signup_form` boolean on page_view, `about.signup_interact` child span on click.
- **Key decisions**: DEC-139 (ConvertKit embed), DEC-140 (placement above Acknowledgments), DEC-141 ("Pause on my Upkeep" heading), DEC-142 (track form presence + click, not submission).
- **Verification**: 17/17 PASS.

### Arc 41: Feedback Modal & Telemetry — COMPLETE (2026-03-10)
- **Type**: User
- **What**: "Feedback" button in hamburger menu → modal (textarea 500 char, optional email, Submit). `feedback.submit` span to Honeycomb with message, email, page, session_id, message_length. Context provider pattern: each page registers a lazy function for per-page attributes (slides: card name; end: section/combo; assessment: subgroup). Dialog-open/close CustomEvents pause/resume slideshow with counter-based tracking and `pausedByDialog` flag. Spacebar handler checks `e.target.tagName` to skip TEXTAREA/INPUT.
- **Key decisions**: DEC-143 (feedback to Honeycomb, no external service), DEC-144 (context provider pattern), DEC-145 (dialog-open/close custom events), DEC-146 (spacebar tagName check).
- **Verification**: 86/86 PASS (3 test files).

---

## Debug Mode (between plans, 2026-03-12)

- Debug mode stored in localStorage (`mtg-sparrow.debug`), toggled via `?debug=on`/`?debug=off` URL param on any page.
- "Current trace" link in menu only visible in debug mode.
- Page reload on toggle with 3-second activation modal (allows telemetry XHR to complete before navigation).
- `app.debug` as resource attribute on all spans for Honeycomb filtering.
- DEC-147 (silent failure is never graceful), DEC-148 (debug mode via URL param), DEC-149 (page reload on toggle), DEC-150 (modal as flush window), DEC-151 (app.debug resource attribute).

---

## Name Scroll (Arcs 42–43, 2026-03-14)

### Arc 42: Level Intro Screen — COMPLETE (2026-03-14)
- **Type**: User
- **What**: Level intro screen before slides: large "LEVEL N" heading and scroll div listing 5 combo names. Click/tap triggers Space-driven sequence (scroll slides left, first card appears). `session.has_name_scroll = true` structural marker.
- **Plan**: plan-name-scroll.md. Source: advice from Llewellyn Falco (Sparrow Deck creator) — with 5 names per level, learners need to see the options upfront.
- **Verification**: 23/23 PASS.

### Arc 43: Scroll Docks as Persistent Reference — COMPLETE (2026-03-14)
- **Type**: User
- **What**: Scroll from intro repositions to left edge of viewport and remains visible during all slides. Current combo name highlights in the scroll when answer is revealed.
- **Key decision**: DEC-160 (CTA unified to "BEGIN" on all screen sizes).

---

## Cylinder/Scroll Prototype (2026-03-14, separate from arcs)

Research prototype for a scroll-unroll animation — not yet integrated into the app.
- Files: `cylinder-prototype.html`, `cylinder-css-prototype.html`, `cylinder-projection.js`, `cylinder-transition.js`
- 42 regression tests in `tests/cylinder-projection.test.mjs`
- Pure CSS transitions via cubic-bezier approximation (`computeTransition({ spiralLength, stopRemaining })`)
- Decisions: DEC-152 through DEC-159
- See `active-notes.md` for current status.

---

## Sequence Generation Module (Exploratory, 2026-03-25)

### Refactoring: Sequence Generation — COMPLETE (2026-03-25)
- **Type**: Structural (exploratory groundwork, not part of a formal SOW)
- **What**: Extracted deck-building logic from `session.ts` into `src/sparrow-deck.ts`. Introduced `buildSequence(cardCounts, length)` as a pure-numbers abstraction layer where spaced repetition heuristics will live. `buildDeck` calls `buildSequence` and maps tuples to Slide objects. `SlideSelection` type (`[comboIndex, cardIndex]`, both 1-indexed) exported. Sequence harness page (`sequence-harness.html` + `src/sequence-harness.ts`) added for visual inspection of sequence aesthetics — uses abstract labels (A-E combos, F-Z cards), no domain knowledge. Harness added to deploy workflow and `npm run build:harness`. Playwright test script at `tests/test-harness.mjs`.
- **Key decisions**: DEC-165, DEC-166, DEC-167, DEC-168
- **Files changed**: `src/sparrow-deck.ts` (new), `src/session.ts` (import refactor), `src/sequence-harness.ts` (new), `sequence-harness.html` (new), `tests/test-harness.mjs` (new), `package.json`, `.github/workflows/deploy.yml`, `run`
- **Purpose**: Establishes the structural foundation for spaced repetition — the pure ordering layer exists independently, can be tested aesthetically in isolation, and is ready for heuristic experimentation.
- **Note**: No formal plan or SOW — exploratory groundwork preceding a future spaced repetition arc.

---

## Level Intro Slide (Arc 44, 2026-03-25)

### Arc 44: Level Intro Slide — COMPLETE (2026-03-25)
- **Type**: User
- **What**: Level intro slide appears before quiz cards on the slides page. Shows "LEVEL N" (Jost 800, large uppercase) with a thin khaki decorative rule, subtitle (e.g. "Allied Guilds"), and the five combo names in GoudyMediaeval bold separated by middle-dots. Click/tap/spacebar dismisses with a 150ms fade, then the quiz starts. CTA hint pulses gently in turquoise.
- **Level mapping**: allied=1, enemy=2, wedges=3, shards=4
- **Context**: Previous Arcs 42-43 attempted a scroll metaphor with persistent docked reference — reverted because it didn't work. Arc 44 delivers only the preview (the valuable part), not the persistent reference. Cinematic title card approach: no card chrome, no borders, content floats on background.
- **Key decisions**: DEC-161 (cinematic title card, no chrome), DEC-162 (GoudyMediaeval for name priming), DEC-163 (--combo-name-size CSS variable as single source of truth), DEC-164 (session span attributes instead of separate span).
- **Telemetry**: `session.has_level_intro = true` and `session.intro_dwell_ms` as attributes on the session span.
- **Verification**: 36/36 PASS (test script: tests/test-level-intro.mjs).
- **Files changed**: src/slides.ts, slides.css, style.css.

---

## Dual-Strategy buildSequence (Arc 46, 2026-03-25)

### Arc 46: Dual-Strategy buildSequence — COMPLETE (2026-03-25–2026-03-26)
- **Type**: Feature (Spaced Repetition)
- **What**: `buildSequence` gains a `familiarity: "new" | "familiar"` parameter selecting the sequencing strategy. Two strategies delivered:
  - **"familiar"**: Shuffle-and-repeat with MIN_GAP=1 (pool >= 3) or 0 (pool=2) to prevent same-combo back-to-back without making the sequence deterministic.
  - **"new"**: Gradual introduction — starts with 2 combos, adds one when the most-recently-introduced combo has appeared REPS_BEFORE_NEXT (=3) times. Generate-then-trim approach: sections are over-generated then trimmed at exactly N reps. First section requires BOTH starting combos to reach N. MAX_SECTION_LENGTH=9 with thinning of non-target runs.
- **Post-processing**: `dedupConsecutiveCards` pass ensures no same card image repeats consecutively for the same combo. Applies to both strategies and across section boundaries.
- **API**: `buildSequenceWithSections` returns `SequenceSection[]` alongside flat sequence. Each section records `introducedCombo` (or null for fill phase). Seam for future progress bar enhancement.
- **Research basis**: Kornell & Bjork 2008 / ARTS studies favor all-at-once interleaving for discrimination tasks. Llewellyn Falco (technique creator) advised gradual intro for unfamiliar arbitrary proper nouns. Resolution: familiarity level drives strategy choice.
- **Testing**: 800 property tests (50 trials × 16 properties). Tests use exported constants so they auto-adjust when tuning. `npm run test:sequence`.
- **Key decisions**: DEC-169 (familiarity parameter), DEC-170 ("familiar" min-gap strategy), DEC-171 ("new" gradual introduction), DEC-172 (research basis), DEC-173 (adaptive requeue deferred), DEC-174 (REPS_BEFORE_NEXT cadence), DEC-175 (MIN_GAP by pool size), DEC-176 (generate-then-trim), DEC-177 (first section dual-combo), DEC-178 (MAX_SECTION_LENGTH + thinning), DEC-179 (dedupConsecutiveCards), DEC-180 (section boundaries exported), DEC-181 (property-based testing).
- **Verification**: Complete. All 800 property tests pass. All 16 properties verified across both strategies.

---

## localStorage Adapter (Arc 49, 2026-03-26)

### Arc 49: localStorage Adapter — COMPLETE (2026-03-26)
- **Type**: Structural + Operator
- **What**: Centralized all localStorage writes through a telemetry-emitting adapter. `src/storage.ts` exports `storageSetItem`, `storageRemoveItem`, and `storageClear`. Each function performs the localStorage operation then emits a `localStorage.update` log via `emitLog` with attributes: `storage.key`, `storage.value`, `storage.operation`, `storage.adapter_version`. All production `src/` files migrated to use the adapter. Structural marker: `storage.adapter_version: "v1"` on every log.
- **Deliberate exception**: `src/telemetry/telemetry.ts` keeps direct `localStorage.setItem` for player ID — would cause circular dependency; write also happens before telemetry is initialized (DEC-189).
- **Key decisions**: DEC-188 (adapter pattern), DEC-189 (telemetry.ts exception), DEC-190 (standalone logs, no parent span), DEC-191 (try/catch around emitLog).
- **Files changed**: `src/storage.ts` (new), all production `src/` files that called localStorage directly
- **Verification**: Tester confirmed 11/11 checks PASS. Honeycomb shows `localStorage.update` logs with correct attributes. 800/800 sequence property tests pass.

---

## Mana Color Gradient Progress Bar (Arc 48, 2026-03-26)

### Arc 48: Mana Color Gradient Progress Bar — COMPLETE (2026-03-26)
- **Type**: User (Visual Enhancement)
- **What**: The progress bar on the slides page now displays a gradient of mana colors derived from the deck sequence, revealed progressively as the user advances through cards. The full-deck gradient is precomputed once at session start and set on the track element. A `.progress-bar-cover` element (opaque, `var(--bg-brown-dark)`) sits on top and shrinks from the right to uncover the gradient — the "cover-reveal" approach.
- **Key decisions**: DEC-182 (precompute at session start), DEC-183 (cover-reveal over growing fill), DEC-184 (opaque cover matches page color), DEC-185 (color stops at band midpoints), DEC-186 (linear constant-speed animation over full card duration), DEC-187 (tap transitions from current position to next target).
- **Files changed**: `src/slides.ts`, `slides.css`, `tests/arc47-progress-bar.mjs`
- **Commits**: e496d7a, 6d727b4, dc5357b, 8641f97, 7cd70eb, 91c2229
- **Verification**: Tests updated for cover-reveal approach and passing.

---

## Clean URL Parameters (Arc 49, v0.31.0, 2026-03-26)

### Arc 49: Clean Up End Page URL Parameters — COMPLETE (v0.31.0, 2026-03-26)
- **Type**: Structural (Cleanup)
- **What**: Removed `cards`, `completed`, and `assessment` URL parameters from the assessment→end navigation. `navigateToEnd` in `src/assessment.ts` now passes only `subgroup`. `src/end.ts` no longer reads `cards`, `completed`, or `assessment` from the URL — assessment is in localStorage, and the telemetry for those values was already captured in the assessment page's span. `session.summary` span on the end page retained but simplified to `session.subgroup` only (no `card_count` or `self_assessment` attributes). `feedback.context` similarly stripped of those attributes.
- **Key decisions**: DEC-193 (keep session.summary span, simplify to subgroup only).
- **Files changed**: `src/assessment.ts`, `src/end.ts`, `src/version.ts` (bumped to 0.31.0).
- **Verification**: 29/29 Playwright checks PASS. Honeycomb traces confirmed `session.summary` spans at v0.31.0 with `session.subgroup` only.

---

## Social Share Card (Arc 50, v0.32.0, 2026-03-26)

### Arc 50: Social Share Card — COMPLETE (v0.32.0, 2026-03-26)
- **Type**: User
- **Goal**: Make shared links to mtgcolors.quest display an eye-catching preview card on social platforms (Discord, Slack, Twitter, etc.).
- **What**: Static `og:image` (1200×630 PNG) with the real logo (conic-gradient spiral + mana pip pentagon), GoudyMediaeval title font, turquoise accent bar, and warm brown background with concentric ring decoration. `og:image` and `twitter:card` meta tags added to all pages. Playwright-based generation script produces the image at build time.
- **Design process**: Designer created 3 initial options; client chose Option 1 (logo-centric layout). Iterated through several rounds: added real logo from About page, tried guild collage background (reverted), switched to GoudyMediaeval font, changed five-color bar to single turquoise accent bar.
- **Key decisions**: DEC-194 (final og:image design approved).
- **Files changed**: `public/og-image.png` (new), generation script (new), `index.html` and all page HTML files (meta tags added), `src/version.ts` (bumped to 0.32.0).
- **Verification**: Meta tags confirmed present on all pages. og:image renders correctly in social platform preview tools. App version confirmed at v0.32.0.

---

## Static Combo Reference Pages (Outside Formal Arc, 2026-03-26)

### Unversioned Work: Static Combo Reference Pages
- **Type**: Feature (SEO / Reference Content)
- **Status**: COMPLETE — delivered outside the formal arc process, no version bump applied
- **What**: 21 static HTML pages at `combo/` — one per color combination (20 combos: allied guilds, enemy guilds, wedges, shards) plus a combo index. Each combo page shows the combo name, mana pip images, the pentagon/star SVG with highlighted connections (turquoise `#6C9FB0`), a card image gallery, and flavor description from `guild-descriptions.ts`. Index page (`combo/index.html`) presents all combos in a card grid grouped by tier (5 per subgroup), with "Learn these names" buttons.
- **End page change**: "More X cards →" links on the end screen now point to `combo/<id>.html` instead of Scryfall. Telemetry event renamed from `end.scryfall_click` to `end.combo_page_click`.
- **Build**: `npm run build:combos` runs `scripts/build-combos.ts` (TypeScript generator) via `scripts/build-combos.sh`. Also added: `npm run summarize:combos` (`scripts/summarize-combos.ts`) to print card data summary for debugging.
- **Documentation**: `scripts/README.md` added documenting all available scripts.
- **Key design decisions**:
  - Static HTML (not SPA/query-param) for SEO crawlability — DEC-195
  - No hamburger menu on combo pages — pure static HTML — DEC-196
  - No visible color names ("White / Blue") — teach combo names, not color names — DEC-197
  - Pentagon SVG highlighted in turquoise — DEC-198
  - Mana pip images everywhere, no emoji in rendered HTML — DEC-199
  - Generated pages checked into git for GitHub Pages — DEC-200
  - End page links changed from Scryfall to combo pages — DEC-201
  - Index card grid: 5/3/2 columns responsive — DEC-202
- **Files created**: `combo.css`, `combo/index.html`, `combo/azorius.html`, `combo/dimir.html`, `combo/rakdos.html`, `combo/gruul.html`, `combo/selesnya.html`, `combo/orzhov.html`, `combo/izzet.html`, `combo/golgari.html`, `combo/boros.html`, `combo/simic.html`, `combo/abzan.html`, `combo/jeskai.html`, `combo/sultai.html`, `combo/mardu.html`, `combo/temur.html`, `combo/bant.html`, `combo/esper.html`, `combo/grixis.html`, `combo/jund.html`, `combo/naya.html`, `scripts/build-combos.ts`, `scripts/build-combos.sh`, `scripts/summarize-combos.ts`, `scripts/summarize-combos.sh`, `scripts/README.md`
- **Files modified**: `package.json` (new npm scripts), `src/ui/guild-columns.ts` (link changed to combo pages), `README.md`
- **Note**: No version bump — done outside formal arc process. Next formal arc should bump the version.

---

## Per-Combo Social Share Cards (Arc 51, v0.33.0, 2026-03-26)

### Arc 51: Per-Combo Social Share Cards — COMPLETE (v0.33.0, 2026-03-26)
- **Type**: User
- **Goal**: Each combo page (e.g., `mtgcolors.quest/combo/azorius.html`) gets its own unique `og:image` showing the pentagon with highlighted colors, combo name, and tier — so shared links display combo-specific preview cards on social platforms (Discord, Slack, Twitter, etc.).
- **What**:
  - 20 unique `og:image` PNGs (1200×630) generated via Playwright, one per combo, stored in `images/combo/`
  - Generation script separate from HTML build — runs independently since images change less often than page content
  - `og:image` + `twitter:card` meta tags added to `build-combos.ts` template, pointing to combo-specific images
  - Combo index page uses the site-wide generic `og:image` (no combo-specific image for the index)
- **Design**: Reuses Arc 50's visual style — brown gradient background, concentric ring decoration, GoudyMediaeval font, turquoise accent bar — for visual consistency across share cards.
- **Key decisions**: DEC-203 (separate build step for combo og:images).
- **Files changed**: `images/combo/` (20 new PNGs), generation script (new), `scripts/build-combos.ts` (og:image meta tags), `src/version.ts` (bumped to 0.33.0).
- **Verification**: og:image meta tags confirmed on all combo pages. Images render correctly in social platform preview tools. App version confirmed at v0.33.0.

---

## documentLoad Telemetry (Arc 53, v0.35.0, 2026-03-26)

### Arc 53: documentLoad Telemetry — COMPLETE (v0.35.0, 2026-03-26)
- **Type**: Operator
- **What**:
  1. Revised DEC-020 — added `DocumentLoadInstrumentation` to `src/telemetry/init.ts`. Previously `instrumentations: []`, now `instrumentations: [new DocumentLoadInstrumentation()]` — gives page load waterfall visibility (DNS, TLS, request, response timing).
  2. Created `src/combo-telemetry.ts` — standalone entry point for static combo pages. Initializes own HoneycombWebSDK with DocumentLoadInstrumentation, sets `app.page: "combo"` and `combo.id` as resource attributes, exposes `window.recordEvent(name, attrs)` for future interactivity (share buttons).
  3. Updated `scripts/build-combos.ts` to inject `<script type="module" src="../dist/combo-telemetry.js">` and `data-combo-id` attribute into all 20 combo pages.
  4. Added `combo-telemetry` entry to esbuild build and dev scripts in `package.json`.
  5. Bumped `APP_VERSION` to 0.35.0.
- **Key decisions**: DEC-020 REVISED (DocumentLoadInstrumentation added), DEC-205 (combo pages get standalone telemetry bundle), DEC-206 (window.recordEvent bridge for future interactivity), DEC-207 (CWV from separate SDK path, independent of instrumentations array).
- **Verification**: Tester confirmed 10/10 checks PASS. documentLoad spans arriving in Honeycomb with correct attributes. Trace: 18 spans (documentLoad → documentFetch → 16 resourceFetch).
- **Commits**: 0937d3f, e2c07c6, 596b6ca, 0a89053

---

## Shared Menu with Event-Based Telemetry (Arc 54, v0.36.0, 2026-03-26)

### Arc 54: Shared Menu with Event-Based Telemetry — COMPLETE (v0.36.0, 2026-03-26)
- **Type**: Structural + User
- **What**:
  1. **Extracted menu module** (`src/ui/menu.ts`) from `src/ui/settings.ts`. Accepts a `recordEvent` callback and `MenuOptions` config — zero direct telemetry imports.
  2. **Refactored menu telemetry from zero-duration spans to logs.** Share (`share.copy_link`) and Feedback (`feedback.submit`) actions now emit via `emitLog` (OTel log API). On main app pages, logs carry trace context (linked to page's root span). On combo pages, standalone logs.
  3. **Refactored `feedback.ts`** — `wireFeedback` now accepts `recordEvent` and `getSessionId` as parameters instead of importing telemetry directly.
  4. **Updated all main app page entry points** (welcome.ts, slides.ts, assessment.ts, end.ts, about.ts) to use `wireMenu()` with a page-specific `recordEvent` wrapping `emitLog` with the page's root span.
  5. **Wired menu into combo pages** via `combo-telemetry.ts`. Combo pages now have hamburger menu with Share, Feedback, Home, Levels, About. No Reset Progress or trace link.
  6. **Deleted `src/ui/settings.ts`** — dead code after extraction.
  7. **Bumped APP_VERSION to 0.36.0.**
- **Key decisions**: DEC-208 (menu accepts recordEvent callback), DEC-209 (menu telemetry via emitLog not spans), DEC-210 (combo menu scope), DEC-211 (settings.ts deleted), DEC-212 (feedback.ts decoupled from telemetry).
- **Verification**: Tester confirmed 23/23 checks PASS. Honeycomb confirmed `share.copy_link` as log (`meta.signal_type = "log"`). `service.version = 0.36.0`, `app.page = combo`, `combo.id = rakdos` all confirmed. Query: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/fH5RJWZQoWS
- **Commits**: Multiple (menu extraction, page updates, combo wiring, version bump); 7e9a563 (delete dead settings.ts); 6cfdff3 (tester script and notes).

---

## Audio Pronunciation Feature — Arcs 55–57 COMPLETE (v0.37.0, 2026-03-27)

### Arc 55: Sound Toggle UI & Persistence — COMPLETE (v0.37.0, 2026-03-27)
- **Type**: User + Structural
- **What**: Speaker icon button on welcome, slides, assessment, about, and end pages. Slides page version is larger/higher-contrast, matching the pause button style. Preference stored in `localStorage` under key `mtg-sparrow.sound.enabled`, default ON. `sound.toggle` telemetry event emitted on each activation. APP_VERSION bumped to 0.37.0.
- **Architecture**:
  - `src/audio.ts` — sound preference state + playback logic
  - `src/ui/sound-toggle.ts` — toggle button UI, accepts `recordEvent` callback
- **Key decisions**: DEC-213 (plan approved), DEC-214 (toggle not in hamburger), DEC-215 (default ON), DEC-216 (localStorage persistence), DEC-217 (sound.toggle event), DEC-220 (module architecture)
- **Status**: COMPLETE

### Arc 56: Slides Audio on Reveal — COMPLETE (v0.37.0, 2026-03-27)
- **Type**: User
- **What**: `playComboAudio()` in `src/audio.ts` called at all 3 `revealName` sites in the slides page. Respects the sound toggle — skips playback if sound is disabled. `sound.enabled` (bool) and `sound.play_result` ("success" | "error" | "skipped") added as attributes on the card span.
- **Key decisions**: DEC-218 (attributes on slide span, not separate events), DEC-219 (20 MP3 files in `audio/`, client-recorded), DEC-221 (path: `../audio/{id}.mp3`)
- **Note**: `playComboAudio()` checks the sound toggle — distinct from `playAudio()` which is unconditional (see Arc 57).
- **Status**: COMPLETE

### Arc 57: Combo Page Play Button — COMPLETE (v0.37.0, 2026-03-27)
- **Type**: User
- **What**: Play button injected inline inside the combo name `<h1>` on each combo page. Injection happens via `combo-telemetry.ts` inside a `DOMContentLoaded` listener (required because the script tag is above `.combo-name` in the DOM). Button calls `playAudio()` directly — bypasses the global sound toggle because this is an explicit user action, not auto-play.
- **Bug fixes during delivery**:
  - Combo index page links changed from relative paths to absolute paths (`/combo/id.html`) for local dev server compatibility.
  - Play button moved from `afterend` (outside `<h1>`) to inside the `<h1>` (inline with name).
  - Combo index page got `combo-telemetry.js` inclusion for hamburger menu (`data-combo-id="index"`).
  - `DOMContentLoaded` wrapper added for play button injection (script runs before `.combo-name` is parsed).
  - Combo play button uses `playAudio()` not `playComboAudio()` — explicit user clicks should not be gated by the auto-play toggle.
- **Key decisions**: DEC-221 (audio path), plus new decisions below.
- **Status**: COMPLETE

**New decisions for Arcs 55–57:**
- **DEC-222**: Combo page play button bypasses the global sound toggle — it is an explicit user action, not auto-play.
- **DEC-223**: Sound toggle appears on all main app pages (welcome, slides, assessment, about, end) but NOT on combo/static pages.
- **DEC-224**: Slides page sound toggle is larger/higher-contrast, matching the pause button style (fixed-position, always visible during session).
- **DEC-225**: Two audio functions: `playComboAudio()` (respects toggle) for auto-play on slide reveal; `playAudio()` (unconditional) for explicit play buttons.
- **DEC-226**: `combo-telemetry.ts` play button injection must be inside `DOMContentLoaded` — the script tag runs before `.combo-name` is parsed in the DOM.
- **DEC-227**: 33 audio files provided by client (20 combos + 5 mono colors + not-colors variants + colorless + WUBRG variants), stored in `audio/` directory.

---

## iOS Safari Audio Unlock (Arc 58, v0.38.0, 2026-03-30)

### Arc 58: iOS Safari Audio Unlock — COMPLETE (v0.38.0, 2026-03-30)
- **Type**: Bug Fix
- **What**: Fixed audio playback on iPad/iOS Safari, where `new Audio().play()` from timer callbacks is blocked by Safari's autoplay policy. Audio worked on desktop but silently failed on iPad.
- **Root cause**: Safari requires the first `.play()` call on an Audio element to originate from a synchronous user gesture. Timer callbacks (which fire the combo name reveal) don't qualify.
- **Solution**:
  1. `unlockAudio()` added to `src/audio.ts` — creates a module-level `HTMLAudioElement` and plays a silent WAV data URI to "unlock" it for Safari during a user gesture.
  2. `playAudio()` now reuses that unlocked element (mutates `.src` + calls `.play()`) instead of creating `new Audio()` each time.
  3. Falls back gracefully to `new Audio()` if `unlockAudio()` was never called (combo pages continue to work — their play button IS a direct user gesture).
  4. `unlockAudio()` called synchronously in the level intro dismiss handler (`src/slides.ts`) — the user's tap to start the session, which happens before any timers fire.
- **Historical note**: A similar Audio element reuse approach was added in commit 3bec583, then removed as "unnecessary" in commit add51a3. It turns out iOS needs it. Arc 58 restores the pattern with a clear rationale.
- **Context**: Bug discovered during client's weekend iPad testing. The level intro screen (Arc 44) serendipitously provided the perfect user gesture hook.
- **Key decisions**: DEC-228, DEC-229, DEC-230, DEC-231.
- **Files changed**: `src/audio.ts`, `src/slides.ts`, `src/version.ts` (bumped to 0.38.0).
- **Verification**: iOS Safari audio playback confirmed working on iPad.

### Arc 58 Addition: Viewport & Screen Instrumentation (2026-03-30)

Following delivery of the iOS audio fix, the Observability Engineer extended Arc 58 with viewport and screen dimension telemetry, prompted by the same iPad testing session that revealed layout issues (exit button below fold on iPad; too-small slide area on ultrawide).

- **New resource attributes** (in `src/telemetry/telemetry.ts`):
  - `screen.width`, `screen.height` — physical screen dimensions
  - `viewport.width`, `viewport.height` — browser viewport dimensions
  - These are resource attributes (describe the environment) and appear on every span.

- **New session span attributes** (in `src/slides.ts`, added to the session span):
  - `session.page_height` — total scrollable page height
  - `session.viewport_height` — viewport height at session start
  - `session.has_scrollbar` — boolean, true if page content exceeds viewport
  - `session.slide_height_pct` — card container height as % of viewport (captured via `requestAnimationFrame` after layout renders)

- **Honeycomb Board**: "Screen & Viewport Analysis" created at https://ui.honeycomb.io/modernity/environments/sparrow-deck/board/r1frVgioD4x
  - Uses existing columns (`screen.width`, `browser.width`, `screen.height`) for immediate panels
  - Placeholder queries for new columns (`viewport.width`, `viewport.height`, `session.slide_height_pct`) will populate after deploy

- **Key decisions**: DEC-232, DEC-233, DEC-234, DEC-235.
- **Files changed**: `src/telemetry/telemetry.ts`, `src/slides.ts`.
- **Context**: Client's weekend iPad testing — exit button was below fold; husband's ultrawide had too-small slide area. Board enables ongoing monitoring across device types.

---

## Combos Menu Link, Navigation & Telemetry (Arcs 59–61, v0.39.0–0.40.0, 2026-03-30)

### Arc 59: Add Combos Link to Hamburger Menu — COMPLETE (v0.39.0, 2026-03-30)
- **Type**: User
- **What**: Added a "Combos" link to the hamburger menu in `src/ui/menu.ts`, positioned between "Levels" and "About", linking to `/combo/`.
- **Key decisions**: DEC-236 (placement between Levels and About).
- **Files changed**: `src/ui/menu.ts`, `src/version.ts` (bumped to 0.39.0).
- **Verification**: 9/9 Playwright tests pass.

### Arc 60: Next/Previous Navigation on Combo Pages — COMPLETE (v0.40.0, 2026-03-30)
- **Type**: User
- **What**: Added prev/next navigation to all 20 combo pages via `scripts/build-combos.ts`. Each page gets a `.combo-nav` bar with up to three links: ← previous combo, "All combinations" (center), → next combo. First page (Azorius) has no prev; last page (Naya) has no next.
- **Navigation order**: Allied → Enemy → Wedges → Shards (mirrors the combo index page group ordering).
- **CSS**: `.combo-nav` styles added to `combo.css`.
- **Key decisions**: DEC-237 (ordering follows index group order), DEC-238 (no wrapping on first/last pages).
- **Files changed**: `scripts/build-combos.ts`, `combo.css`, `src/version.ts` (bumped to 0.40.0).
- **Verification**: 40/40 Playwright tests pass.

### Arc 61: Add player.id to Combo Page Telemetry — COMPLETE (v0.40.0, 2026-03-30)
- **Type**: Operator
- **What**: Added `mtg-sparrow.player.id` as a resource attribute to `src/combo-telemetry.ts`. Combo pages previously had `session.id` but not `player.id`, preventing cross-page player correlation in Honeycomb.
- **Implementation**: Same localStorage key (`sparrow-deck.player_id`) and generation pattern (`crypto.randomUUID()`) as the main app telemetry in `src/telemetry/telemetry.ts`. No version bump (already on 0.40.0 from Arc 60).
- **Key decisions**: DEC-239 (same localStorage key as main app for cross-page correlation).
- **Files changed**: `src/combo-telemetry.ts`.
- **Verification**: 9/9 Playwright tests pass; Honeycomb column confirmed in schema. Full end-to-end Honeycomb verification requires production deploy.

---

## "Next Level" Button Visibility Fix (Arc 63, v0.40.0, 2026-03-30)

### Arc 63: Fix "Next Level" Button Visibility on End Screen — COMPLETE (v0.40.0, 2026-03-30)
- **Type**: User (bug fix)
- **What**: Fixed `updateNavButtons()` in `src/ui/guild-columns.ts` — added `'shards'` to the `nextIsNewLevel` condition. Previously only `'allied'`, `'enemy'`, and `'wedges'` were listed, so the shards→next transition incorrectly failed to show the "Next Level" button label.
- **Key decisions**: DEC-240 (condition was missing 'shards').
- **Files changed**: `src/ui/guild-columns.ts`.
- **Verification**: 7/7 Playwright tests pass.

---

## Home Page Logging, Card URLs, UX Polish & Operator Tooling (Arcs 64–71, v0.41.0–0.42.0, 2026-03-30)

### Arc 64: Log Home Page Pause/Fan Buttons — COMPLETE (v0.41.0, 2026-03-30)
- **Type**: Operator
- **What**: Added CustomEvent dispatches in `mana-gas.js` for the pause (`mana-gas-stop`) and fan (`mana-gas-fan`) buttons. `welcome.ts` listens for these and emits `home.gas_stop` and `home.gas_fan` log events.
- **Pattern**: Follows the existing `mana-gas-drag` CustomEvent approach — `mana-gas.js` is standalone vanilla JS and CustomEvents are the cross-boundary mechanism into the bundled telemetry layer.
- **Key decisions**: DEC-241 (CustomEvent pattern consistent with mana-gas-drag).
- **Files changed**: `mana-gas.js`, `src/welcome.ts`, `src/version.ts` (bumped to 0.41.0).
- **Verification**: 8/8 Playwright tests pass.

### Arc 65: Add Scryfall URL to Card Spans — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: Operator
- **What**: Added `slide.card_scryfall_url` attribute to card spans in `slides.ts`. The URL is derived at runtime from the Scryfall image UUID already present in card data, via regex extraction — not stored separately in card data.
- **Key decisions**: DEC-242 (URL derived from UUID at runtime).
- **Files changed**: `src/slides.ts`, `src/version.ts` (bumped to 0.42.0).
- **Verification**: 9/9 Playwright tests pass.

### Arc 66: Space Key Resumes When Paused — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: User
- **What**: Space keydown handler in `slides.ts` now checks `paused` state. When paused, it delegates to `pauseBtn.click()` — the same pattern used by the dialog-close handler.
- **Key decisions**: DEC-243 (delegates to pauseBtn.click() for state consistency).
- **Files changed**: `src/slides.ts`.
- **Verification**: 10/10 Playwright tests pass.

### Arc 67: Update End Screen URL on Section Switch — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: User
- **What**: `history.replaceState` updates the `?subgroup=` param whenever a reel section is navigated to, and also sets the param on initial load so the default section is reflected. Deep-linking works: loading `/end?subgroup=shards` starts on Shards.
- **Key decisions**: DEC-244 (uses existing `?subgroup=` param with history.replaceState, no hash).
- **Files changed**: `src/ui/guild-columns.ts`.
- **Verification**: 12/12 Playwright tests pass.

### Arc 68: Combo Index Overview Text — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: User
- **What**: Added group descriptions to the combo index page via `scripts/build-combos.ts`. Updated intro paragraph; added per-group descriptions for Allied Guilds, Enemy Guilds, Wedges, and Shards. New CSS class `.combo-index-group-description` in `combo.css`.
- **Key decisions**: DEC-245 (descriptions hardcoded in build script, not a separate data file).
- **Files changed**: `scripts/build-combos.ts`, `combo.css`.
- **Verification**: 34/34 Playwright tests pass.

### Arc 69: End Screen Window Peek Effect — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: User (design)
- **What**: Reel viewport now shows 60px of adjacent sections (30px peeking on each side). First section shows bottom peek only; last section shows top peek only. CSS mask gradient widened from 5%/95% to 12%/88% to accommodate the wider fade. `PEEK_PX = 60` constant introduced in `guild-columns.ts`.
- **Key decisions**: DEC-246 (PEEK_PX=60, edge-aware first/last, split top/bottom).
- **Files changed**: `src/ui/guild-columns.ts`, relevant CSS.
- **Verification**: 15/15 Playwright tests pass.

### Arc 70: Honeycomb Site Usage Board — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: Operator
- **What**: Created "Site Usage Dashboard" board via Honeycomb MCP. No code changes required.
- **Board URL**: https://ui.honeycomb.io/modernity/environments/sparrow-deck/board/wXrwy7TBMCv
- **6 panels**: page views by page, unique players/day, unique sessions/day, level popularity, sound usage, share/feedback actions.
- **Key decisions**: DEC-247 (board created in sparrow-deck environment).
- **Files changed**: none.
- **Verification**: Board accessible and panels rendering.

### Arc 71: Cute 404 Page — COMPLETE (v0.42.0, 2026-03-30)
- **Type**: User (delight)
- **What**: Created `404.html` and `404.css` — an MTG-themed 404 page with "Lost in the Blind Eternities" heading, five mana pip circles, gradient "404" text, flavor text, and links to home, `/combo/`, and `/about`. Static HTML/CSS only; no JS or telemetry.
- **Implementation note**: GitHub Pages serves a `404.html` at the repo root automatically for any unmatched paths.
- **Key decisions**: DEC-248 (static HTML/CSS only — keeps it lightweight).
- **Files created**: `404.html`, `404.css`.
- **Verification**: 23/23 Playwright tests pass.

---

## Search Engine & LLM Discoverability (Arc 52, v0.34.0, 2026-03-26)

### Arc 52: Search Engine & LLM Discoverability — COMPLETE (v0.34.0, 2026-03-26)
- **Type**: User
- **Goal**: Make mtgcolors.quest findable and useful to search engines and AI crawlers.
- **Context**: The combo pages (built outside formal arc process) provide rich, crawlable textual content. This arc ensures crawlers can find and understand it.
- **What**:
  - `robots.txt` — allows all crawlers, points to sitemap
  - `sitemap.xml` — all 27 user-facing pages: 5 top-level pages + combo index + 20 combo pages
  - `llms.txt` — structured plain-text site description following llmstxt.org convention; includes full reference of all 20 color combinations so LLMs can answer questions about MTG color names directly
  - `README.md` updated to note these discoverability files and remind maintainers to update them when adding pages
- **Key decisions**: DEC-204 (static discoverability files, not generated).
- **Files created**: `robots.txt`, `sitemap.xml`, `llms.txt`.
- **Files modified**: `README.md`, `src/version.ts` (bumped to v0.34.0).
- **Verification**: All three files present and well-formed. sitemap covers all 27 user-facing URLs. llms.txt lists all 20 combo names with color identities.
