# Decision Log

Decisions are recorded as they are made. Each entry includes context, alternatives considered, and rationale.

---

## DEC-001: Engagement Accepted
- **Date**: 2026-02-15
- **Decision**: Small Arc Studio accepts the Sparrow Deck for MTG Color Combinations engagement.
- **Context**: Client (MTG Deck Builder) submitted RFP for a static web app applying the Sparrow Deck learning technique to MTG color combination names.
- **Rationale**: Well-scoped problem with clear deliverable. Two distinct research domains (Sparrow Deck technique + MTG color names) that can be investigated in parallel.

## DEC-002: Parallel Domain Research
- **Date**: 2026-02-15
- **Decision**: Two domain experts assigned to research concurrently — one for Sparrow Deck technique, one for MTG color combinations.
- **Context**: Both research areas are independent and can proceed simultaneously.
- **Rationale**: Accelerates discovery phase; findings will be synthesized during Direction Establishment.

---

## DEC-003: Not a Quiz — Perceptual Learning, Not Testing
- **Date**: 2026-02-15
- **Decision**: The application must be designed as a perceptual learning tool, not a quiz or test. No scoring, no pass/fail, no accuracy metrics as goals.
- **Context**: Sparrow Deck research (RF-001) reveals that the technique's effectiveness depends on rapid-fire exposure engaging the brain's pattern recognition system. Scoring and grading would encourage analytical deliberation, which is the opposite of what drives learning here.
- **Implications**:
  - No score displays, leaderboards, or accuracy percentages
  - No "wrong answer" penalties or friction
  - Speed and volume of exposure are the primary UX goals
  - Confidence tracking (as a progress signal, not a grade) may be appropriate
  - Timer-driven 3-minute sessions, not completion-driven
- **Rationale**: This is the foundational UX constraint. Every design decision should be evaluated against whether it supports rapid perceptual exposure or undermines it with analytical friction.

## DEC-004: Four-Color Naming Convention — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: Skip four-color combinations. Focus on the 20 core names (10 guilds + 5 shards + 5 wedges). Four-color may be added later as a future enhancement.
- **Decided by**: Client
- **Context**: Four-color naming is genuinely unsettled in the MTG community. Three competing conventions were considered (Nephilim, Sans-X, both).
- **Rationale**: The 20 core names are the most useful and universally stable. Omitting four-color simplifies scope for initial delivery without losing significant value. Can be revisited.
- **Status**: CLOSED

## DEC-005: Learning Tiers Map to Sparrow Deck Progressive Difficulty
- **Date**: 2026-02-15
- **Decision**: The natural tier structure of MTG color names aligns with Sparrow Deck progressive difficulty design.
- **Context**: RF-001 (Sparrow Deck research) recommended progressive difficulty. RF-002 (MTG research) independently identified a natural tier structure based on community usage frequency and name stability.
- **Mapping** (updated per DEC-004 resolution):
  - Tier 1: 10 Guild names (two-color) — most commonly used, start here
  - Tier 2: 10 Shard + Wedge names (three-color) — next in frequency
  - Four-color and WUBRG deferred to future enhancement
- **Rationale**: Both domain research streams converge on this structure independently, which is a strong signal that it's the right progression.

## DEC-006: Architecture — Vanilla TypeScript + esbuild (No Framework)
- **Date**: 2026-02-15
- **Amended**: 2026-02-15 — Client requested esbuild instead of Vite (DEC-009)
- **Decision**: Use Vanilla TypeScript with esbuild as the build tool. No UI framework.
- **Context**: Three options evaluated (Vanilla TS, Preact, SvelteKit). The app's interaction is simple — show card, flip, next, repeat with timer. See RF-003 for full analysis.
- **Alternatives rejected**:
  - Preact: component model for a problem that doesn't need one
  - SvelteKit: heaviest tooling for the simplest problem; framework scaffolding would outweigh app code
- **Rationale**: Complexity proportional to the problem. Engineering attention should go to observability (OTel + Honeycomb), not UI abstraction. ~50KB total bundle keeps load fast.

## DEC-007: Hosting — GitHub Pages — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: GitHub Pages for hosting. esbuild output → `dist/` → deploy via GitHub Actions. Free, zero ops.
- **Decided by**: Client
- **Note**: Repo is not on GitHub yet but will be.
- **Status**: CLOSED

## DEC-008: Observability — Honeycomb Web SDK → Honeycomb — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: Use Honeycomb Web SDK (not raw OTel Web SDK) sending to Honeycomb. Amended by DEC-020.
- **Context**: Observability is a core requirement per the Small Arc model. Client has a Honeycomb account and will supply API keys.
- **Resolved items**:
  - ~~Client needs a Honeycomb account~~ — Client has one, will supply keys
  - Ingest-only API key will be in the JS bundle — accepted pattern
- **Status**: CLOSED — approach and account confirmed. SDK choice refined in DEC-020.

## DEC-009: Build Tool — esbuild Instead of Vite (Client Amendment)
- **Date**: 2026-02-15
- **Decision**: Use esbuild instead of Vite as the build tool. Client preference.
- **Context**: Original architecture recommendation (DEC-006) proposed Vite. Client prefers esbuild's simplicity.
- **Impact**: Minimal. Both produce static output from TypeScript. esbuild is faster and simpler but lacks Vite's dev server with HMR. Dev workflow may need a separate file watcher or manual refresh.
- **Updated stack**: Vanilla TypeScript + esbuild + GitHub Pages + OTel Web SDK → Honeycomb
- **Amends**: DEC-006

## DEC-010: No Flip Animation — Name Fades Over Pips
- **Date**: 2026-02-15
- **Decision**: Cards don't "flip." The combination name fades/slides in over the mana pips (200-300ms transition).
- **Context**: Designer identified that keeping pips visible during the answer maintains the visual association between colors and name. A flip animation would break this connection and add unnecessary delay.
- **Rationale**: Serves the perceptual learning model (DEC-003) — the learner sees colors and name simultaneously, reinforcing the association.

## DEC-011: Auto-Reveal After Tunable Delay (Amended)
- **Date**: 2026-02-15
- **Amended**: 2026-02-15 — Changed from "auto-advance after 800ms" to "auto-reveal after tunable delay"
- **Further refined**: 2026-02-15 — Client inline feedback: answer appears after ~3s, next card auto-advances. Delays start at ~1.5s, must be easy to change. These are tuning parameters.
- **Decision**: The card shows mana pips, the user says the name aloud, then the name auto-reveals after a tunable delay (starting ~1.5-3s). After reveal, the next card appears automatically. No tapping required in the default flow. All timing values are tuning parameters, easy to adjust based on observability data.
- **Context**: The original model required a tap to reveal. The amended model removes even that interaction — the user's only job is to say the name aloud before the answer appears. This creates a pure rhythm: see → say → see answer → see next → say...
- **Rationale**: Maximizes perceptual learning pacing (DEC-003). Eliminates all interaction friction. The learner focuses entirely on recognition, not on tapping.

## DEC-012: Tap Skips Ahead Early (Amended)
- **Date**: 2026-02-15
- **Amended**: 2026-02-15 — Changed from "tap-anywhere to reveal" to "tap skips ahead early"
- **Decision**: Tap/click/spacebar skips ahead to the next card early, before the auto-reveal timer fires. The entire card remains the tap target. This is optional — the default flow requires no interaction at all.
- **Context**: With auto-reveal (DEC-011), tap is no longer the primary interaction. It becomes an accelerator for users who want to move faster than the default pace. Client confirmed: early tap gives observability signal about which combos the learner already knows.
- **Rationale**: Preserves the zero-friction default while giving advanced users control over pacing. Also provides a "tapped early" observability signal.

## DEC-013: No Scores, Streaks, or Leaderboards
- **Date**: 2026-02-15
- **Decision**: Deliberately omit all evaluative metrics: no score, no percentage correct, no streaks, no leaderboards, no "you got X wrong" summary.
- **Context**: These features trigger evaluation anxiety and analytical thinking — the opposite of perceptual learning.
- **Rationale**: Direct enforcement of DEC-003. Session end screen shows card count only (volume of exposure).

## DEC-014: Tier Unlock After One Session (Not Accuracy-Based)
- **Date**: 2026-02-15
- **Decision**: Tiers unlock after completing one session at the prior tier, regardless of accuracy.
- **Context**: Accuracy-based gating creates "I need to get good before I move on" — a trap that slows learning. The Sparrow Deck model values exposure volume.
- **Tier structure**: Guilds (default) → Shards & Wedges → All Core → (future: Deep Cuts → Everything)
- **Rationale**: Trust the learner. Unlocking just makes tiers available; the user self-selects progression.

## DEC-015: Ambient "Say It Out Loud" Prompting (No Microphone)
- **Date**: 2026-02-15
- **Decision**: Use a subtle visual prompt ("say it" text or speech bubble icon) on each card. No microphone, no audio detection.
- **Context**: The verbal component is critical to the technique but inherently invisible to the interface. Microphone adds permission friction, privacy concerns, technical complexity, and false negatives.
- **Approach**: First card of first session shows a slightly larger onboarding hint. Then fades to subtle reminder.
- **Rationale**: The prompt is a nudge, not a gate. Trust the learner.

## DEC-016: Learning Direction — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: Colors→Name only. User sees mana pips, guesses the combination name. Reverse direction (Name→Colors) is a potential future enhancement.
- **Decided by**: Client
- **Context**: Domain research (RF-001) suggests both directions are valuable but different skills. Designer recommended starting with colors→name only.
- **Rationale**: Aligns with the core Sparrow Deck use case — "see stimulus, classify it." Keeps initial scope focused.
- **Status**: CLOSED

## DEC-017: Mana Symbol Assets — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: Use standard community mana symbols (as seen on Scryfall/Gatherer). No custom variants needed.
- **Decided by**: Client
- **Context**: These symbols are licensed for use by free community sites, and this app is free. No trademark concern.
- **Status**: CLOSED

## DEC-018: Sound Effects — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: No sound effects. Pronunciation audio for the combination names is a potential future enhancement.
- **Decided by**: Client
- **Status**: CLOSED

## DEC-019: Language Scope — RESOLVED
- **Date**: 2026-02-15
- **Resolved**: 2026-02-15
- **Decision**: English only. No localization planned.
- **Decided by**: Client
- **Status**: CLOSED

## DEC-020: Honeycomb Web SDK, Wrapped in App Module
- **Date**: 2026-02-15
- **Decision**: Use the Honeycomb Web SDK (not raw OpenTelemetry Web SDK) for browser telemetry. All Honeycomb calls must be wrapped in the app's own telemetry module — no direct Honeycomb imports scattered through the codebase.
- **Context**: Client recommendation. The Honeycomb Web SDK is a higher-level wrapper around OTel that simplifies browser instrumentation. Wrapping it in our own module (e.g., `src/telemetry/tracing.ts`) provides an abstraction boundary: the rest of the app calls our helpers, not Honeycomb directly.
- **Implications**:
  - Only `src/telemetry/` imports from `@honeycombio/opentelemetry-web`
  - App code calls our own span/trace helpers
  - If the telemetry backend changes, only one module changes
  - This is an architectural constraint, not just a preference
- **Amends**: DEC-008 (SDK choice refined)

## DEC-021: Fixed Card Count Per Session, Not Timer
- **Date**: 2026-02-15
- **Decision**: Sessions are driven by a fixed card count (~50 cards), not a countdown timer. At ~3.5s per card with auto-advance, this fills roughly 3 minutes. Early tapping shortens the session. No timer UI.
- **Decided by**: Client (Proposal annotation)
- **Context**: Original design (DEC-011) assumed a 3-minute timer with cards cycling until time expired. Client prefers a fixed number of cards so that early tapping rewards speed with a shorter session.
- **Implications**:
  - No countdown timer in the UI
  - Session length varies based on user pacing
  - `session.card_count` is predetermined, not measured at end
  - `session.duration_ms` becomes more interesting as an observability signal (how long did N cards take?)
- **Amends**: Supersedes the timer-driven model in DEC-011 and RF-004

## DEC-022: Subgroups Within Guilds
- **Date**: 2026-02-15
- **Decision**: Start with a configurable subset of guilds (e.g., 4-5), not all 10. The subset size is an adjustable parameter.
- **Decided by**: Client (Proposal annotation)
- **Context**: The Sparrow Deck technique originally distinguishes only 2 things. With 10 guilds, the cognitive load may be too high for a first session. Starting with a smaller subset aligns better with the perceptual learning model.
- **Rationale**: Progressive exposure — even within the guild tier, start small.

## DEC-023: Tier Structure Updated
- **Date**: 2026-02-15
- **Decision**: Updated tier progression: Guild Subgroup → All Guilds → Shards & Wedges → All Core (mixed 20).
- **Decided by**: Client (Proposal annotation)
- **Context**: Client clarified that "All Core" is the mixed tier of all 20 combos. The original "All Core" confusion was about naming, not concept. Added a guild subgroup tier at the front.
- **Amends**: DEC-005, DEC-014 (tier structure)
- **Previous tiers**: Guilds → Shards & Wedges → All Core
- **New tiers**: Guild Subgroup → All Guilds → Shards & Wedges → All Core (mixed 20)

## DEC-024: Post-Session Self-Assessment
- **Date**: 2026-02-15
- **Decision**: After each session, prompt "How did that feel?" with options like "Still learning / Getting there / Nailing it". This is self-reflection, not scoring. Also captured as an observability signal.
- **Decided by**: Client (Proposal annotation)
- **Context**: Client wants user feedback after sessions. This aligns with DEC-003 (not a quiz) because it's subjective self-assessment, not objective accuracy measurement.
- **Implications**:
  - New UI element on session end screen
  - New span attribute: `session.self_assessment` (or similar)
  - Queryable in Honeycomb: do people feel better over time?

## DEC-025: Settings Page with LocalStorage Reset
- **Date**: 2026-02-15
- **Decision**: Provide a visible settings page with the ability to reset tier unlock state (clear localStorage). A proper feature, not a secret URL.
- **Decided by**: Client (Proposal annotation)
- **Context**: Client identified this as essential for testing and as a user feature. Users may want to restart their progression.
- **Rationale**: Necessary for testing; also useful for users who want to practice from scratch.

## DEC-026: Guilds Data Only in Initial Arcs
- **Date**: 2026-02-15
- **Decision**: Initial arcs implement guild data only (10 two-color combinations). Shards & Wedges data added in a later arc. Data model should be typed to support future tiers.
- **Decided by**: Client (Proposal annotation)
- **Context**: Client requested starting with guilds only. Keeps initial scope tight and allows learning about the interaction before adding more content.

## DEC-027: Bundle Size and Timer Precision Deprioritized
- **Date**: 2026-02-15
- **Decision**: Loading performance and timer precision are not concerns. Deprioritized from the risk table.
- **Decided by**: Client (Proposal annotation)
- **Context**: Client explicitly stated these are not concerns. The app is small and the timing doesn't need to be frame-perfect.

## DEC-028: All Commands Via Scripts Directory
- **Date**: 2026-02-15
- **Decision**: All bash commands must be wrapped in shell scripts in `scripts/`. No raw `npx`, `npm`, `grep`, etc. commands run directly. If a script exists, use it; if a new command is needed, create the script first, then run it.
- **Context**: Team policy to streamline client approval — client approves scripts once rather than each command individually.
- **Existing scripts**: `scripts/build.sh`, `scripts/dev.sh`, `scripts/serve.sh`, `scripts/typecheck.sh` (created by Architect).
- **Implications**: All roles must follow this convention. Tester expected to create verification scripts as needed.

## DEC-029: Honeycomb API Key Provided
- **Date**: 2026-02-15
- **Decision**: Client provided ingest-only Honeycomb API key. Key is configured in `src/telemetry/init.ts` and embedded in the JS bundle.
- **Context**: Arc 1 requires a working telemetry pipeline. The key is ingest-only, so exposure in the bundle is the accepted pattern per DEC-008.
- **Renumbered from**: DEC-028 (DEC-028 now used for scripts policy)
- **Status**: CLOSED

## DEC-030: Welcome Screen Replaces Auto-Start
- **Date**: 2026-02-19
- **Decision**: The app now shows a welcome screen on load instead of auto-starting a card session. The session begins only when the user clicks "Learn guild names."
- **Context**: Arc 5 (Welcome Screen). The previous behavior started a card session immediately on `DOMContentLoaded`. New users had no orientation — no explanation of what the app does, no fallback name to try, no "say it out loud" ritual.
- **Rationale**: Perceptual learning requires engagement. A user who doesn't know what's expected won't benefit from the first few cards. One screen, one button, no friction — consistent with the app's lean aesthetic (DEC-003).
- **Implementation**: `showWelcomeScreen()` called at end of `DOMContentLoaded`. Session starts only on button click.

## DEC-031: Welcome Button Styled Like Self-Assessment Buttons
- **Date**: 2026-02-19
- **Decision**: The "Learn guild names" button on the welcome screen is styled to match `.self-assessment-button` (prominent, rounded, bordered) rather than `.control-button` (small and muted).
- **Context**: Designer recommendation. The welcome CTA must feel inviting — it's the first action a new user takes. Using the muted control button style would undersell the entry point.
- **Rationale**: Visual hierarchy: the most important action should feel most prominent. Self-assessment button style already exists and signals "primary action" in the app's visual language.

## DEC-032: session.started_from Telemetry Attribute
- **Date**: 2026-02-19
- **Decision**: Add `session.started_from` attribute to session spans. Current value: `'welcome_screen'`. Also add `session.welcome_dwell_ms` measuring time from welcome screen render to button click.
- **Context**: With multiple potential session entry points in the future (welcome screen, session end "go again", settings page), knowing how a session was started becomes useful for cohort analysis.
- **Rationale**: `session.started_from` is forward-looking observability — costs nothing now, enables future segmentation. `session.welcome_dwell_ms` provides a concrete behavioral signal: how long did the user read before clicking?
- **Attribute values**: `session.started_from = 'welcome_screen'`, `session.welcome_dwell_ms = <integer ms>`

## DEC-033: Welcome Screen Rendered as Static HTML
- **Date**: 2026-02-20
- **Decision**: Move welcome screen content from JavaScript DOM construction into static HTML in `index.html`. Delete `showWelcomeScreen()`. JS wires the button click handler only.
- **Context**: Arc 5 introduced the welcome screen but implemented it by dynamically building DOM elements in JS (`document.createElement`, `appendChild`, `textContent`). Client identified this as architecturally incorrect — static content was being withheld from the browser until JS executed.
- **Alternatives considered**: Keep JS-built DOM (rejected: wrong boundary, slower first paint, no graceful degradation).
- **Rationale**: Correct architectural boundary — static content belongs in HTML, dynamic behavior belongs in JS. Faster first meaningful paint. Graceful degradation if JS fails to load. Eliminates ~30 lines of unnecessary DOM manipulation.
- **Structural marker**: `welcome.render_mode = 'static_html'` added to session spans.
- **Version**: 0.6.0

## DEC-034: Guild Subgroup Split — Allied vs Enemy Color Pairs
- **Date**: 2026-02-20
- **Implemented**: 2026-02-24
- **Decision**: Split the 10 guilds into two subgroups of 5, using the natural MTG distinction between allied-color pairs and enemy-color pairs.
  - **Allied** (adjacent on color wheel): Azorius (WU), Dimir (UB), Rakdos (BR), Gruul (RG), Selesnya (GW)
  - **Enemy** (opposite on color wheel): Orzhov (WB), Izzet (UR), Golgari (BG), Boros (RW), Simic (GU)
- **Context**: DEC-022 established that 10 guilds is too many to start with. The allied/enemy split is a natural MTG grouping — allied colors are adjacent on the color wheel, enemy colors are opposite. Starting with 5 is consistent with the Sparrow Deck progressive difficulty model.
- **Note**: The groupings listed at approval time contained errors (Golgari/Boros were listed as allied; Rakdos/Selesnya as enemy). The implementation corrected these to match the standard MTG definition.
- **Decided by**: Client
- **Status**: IMPLEMENTED in Arc 7 (v0.7.0)

## DEC-036: Session End Screen Subgroup Navigation Buttons
- **Date**: 2026-02-24
- **Decision**: After the session end screen (self-assessment + combo summary), show a divider and contextual label ("You practiced allied/enemy guilds.") followed by two navigation buttons. The other subgroup is styled as the primary action (purple-blue `#6666aa` accent border). The current subgroup is styled as secondary. Sessions started from the end screen carry `session.started_from = 'session_end_screen'`.
- **Context**: Arc 7 introduced two subgroups. Users need a clear path to practice the other subgroup or repeat the current one. Placing the other subgroup as primary nudges progression without forcing it.
- **Rationale**: Consistent with DEC-003 (no friction), DEC-024 (self-assessment context), DEC-032 (session.started_from telemetry). The button styling borrows the existing `.self-assessment-button` pattern for visual consistency.
- **Telemetry**: `session.started_from = 'session_end_screen'` on any session launched from this screen.

## DEC-035: Card Images to Replace/Augment Mana Pips
- **Date**: 2026-02-20
- **Decision**: Replace or augment the mana pip display with real Magic card art. Multiple images per combo so the visual stimulus varies across repetitions within a session.
- **Context**: Client request. More faithful to the original Sparrow Deck technique, which uses different exemplars of the same category. Prevents learners from memorizing a specific pip arrangement rather than learning color recognition. Noted as a future enhancement since the RFP.
- **Status**: DEFERRED — originally planned as Arc 8, redirected by client to session end screen redesign (DEC-037). Now a future arc candidate.

## DEC-037: Session End Screen Redesign — Two-Column Educational Layout
- **Date**: 2026-02-25
- **Decision**: Replace the Arc 7 session end screen (combo summary + subgroup navigation buttons) with a two-column educational layout. Allied column is always fully visible: header, educational explanation of adjacent color wheel pairs, all 5 allied guilds with mana pips, "Learn allied guilds" button. Enemy column is locked until the user completes a full enemy session: locked state shows only teaser text and a primary "Learn enemy guilds" button; unlocked state mirrors the allied column structure.
- **Context**: Arc 8 was redirected from Card Images (DEC-035) to this redesign at client direction. The two-column layout replaces and extends the combo summary — it teaches the allied/enemy distinction explicitly rather than just enabling navigation.
- **Rationale**: The end screen becomes an educational moment, not just a navigation utility. The sparse locked column creates effective visual contrast and communicates "more is coming" without revealing it. Consistent with DEC-003 (no friction) and DEC-005 (progressive exposure).
- **Status**: IMPLEMENTED in Arc 8 (v0.8.0)

## DEC-038: Progressive Disclosure via localStorage — sparrow-deck.progression
- **Date**: 2026-02-25
- **Decision**: Store progression state in localStorage under key `sparrow-deck.progression` as a JSON object `{enemyUnlocked: boolean}`. Only a completed (not stopped) enemy session triggers unlock. Encapsulated in `src/progression.ts` — all localStorage access goes through this module.
- **Context**: Arc 8 introduced the first piece of persistent user state. The enemy column unlock must survive page reloads. Using a structured JSON object under a namespaced key allows future progression fields to be added without key proliferation.
- **Rationale**: `markEnemyUnlocked()` returns a boolean indicating whether state changed — enabling one-time telemetry emission (`progression.enemy_unlocked` span event) without additional state tracking. try/catch wrapping handles private browsing gracefully (defaults to locked/false).
- **Telemetry**: `session.enemy_unlocked` boolean on all session spans; `progression.enemy_unlocked` span event on first unlock only.
- **Status**: IMPLEMENTED in Arc 8 (v0.8.0)

## DEC-039: SVG Over Canvas for Color Wheel
- **Date**: 2026-02-25
- **Decision**: Implement the MTG color wheel as an SVG, not an HTML5 Canvas.
- **Context**: The color wheel has ~15 visual elements: 5 mana symbols, 5 allied lines, and 5 hit-area overlays. Each element needs to be individually targetable by JavaScript for bidirectional hover interaction with the HTML guild list.
- **Alternatives rejected**:
  - Canvas: would require reimplementing a scene graph and custom hit-testing. No DOM nodes means no `addEventListener` per element and no CSS class toggling.
- **Rationale**: SVG is the correct choice when elements must be individually addressable DOM nodes. Canvas's advantage (pixels, performance) is irrelevant at this scale. SVG's per-element event model maps directly to the interaction requirement.

## DEC-040: `<image>` Tags for Mana Symbol Reuse in SVG
- **Date**: 2026-02-25
- **Decision**: Render mana symbols inside the color wheel SVG using `<image href="images/X.svg">` tags rather than inlining the full SVG paths.
- **Context**: The five mana symbol SVGs (W, U, B, R, G) already exist in `images/` and are used elsewhere in the app.
- **Alternatives rejected**:
  - Inlining SVG paths: more verbose, duplicates asset data, harder to maintain.
  - Canvas `drawImage()`: would require the Canvas approach, rejected in DEC-039.
- **Rationale**: Clean reuse of existing assets. Standard SVG embedding pattern. Keeps the wheel-building code short and the mana symbols consistent with their usage elsewhere in the app.

## DEC-041: Bidirectional Hover via JavaScript — SVG/HTML Boundary
- **Date**: 2026-02-25
- **Decision**: Implement bidirectional hover between the SVG color wheel and the HTML guild list using JavaScript event listeners that add/remove CSS classes on both sides.
- **Context**: Hovering a line in the wheel should highlight the line, both endpoint mana symbols, and the matching guild row below. Hovering a guild row should highlight the row and the corresponding line and symbols. Non-highlighted elements should dim.
- **Constraint**: CSS `:hover` and sibling selectors cannot cross the SVG/HTML DOM boundary. A purely CSS solution is not possible.
- **Approach**: Wide transparent `<line>` overlays (24px `stroke-width`, `pointer-events: stroke`) act as hit areas. `mouseenter`/`mouseleave` listeners on both hit areas and guild rows add `.highlight` to targets and `.dim` to all others.
- **Rationale**: JavaScript bridging the SVG/HTML boundary is the standard pattern for this class of interaction. The hit-area overlay approach is well-established for making thin SVG lines interactive without changing their visual appearance.

## DEC-042: "Learn" vs "Practice" Button Text Based on Completion History
- **Date**: 2026-02-25
- **Decision**: Session-start buttons on the end screen read "Learn [subgroup] guilds" until the user has completed at least one session of that subgroup type, then switch to "Practice [subgroup] guilds". Tracked via `completedSubgroups: string[]` in `sparrow-deck.progression` localStorage (extending `ProgressionState` in `src/progression.ts`).
- **Context**: Post-Arc-8 enhancement. The original buttons always said "Learn allied guilds" / "Learn enemy guilds" regardless of history. After practicing, "Learn" becomes semantically incorrect — the user is returning for more repetitions.
- **Timing**: `markSubgroupCompleted()` is called in `showSessionEnd()` before the button column is rendered, so even the first post-session view shows "Practice" — which is accurate by then.
- **New `src/progression.ts` API**:
  - `hasCompletedSubgroup(subgroup: string): boolean`
  - `markSubgroupCompleted(subgroup: string): void` (idempotent)
  - `ProgressionState.completedSubgroups: string[]` (defaults to `[]`)
- **Rationale**: Accurate language reduces cognitive friction. "Practice" signals mastery-building; "Learn" signals introduction. Distinguishing them costs little and improves the user experience meaningfully over repeated visits.

## DEC-043: Refactor Allied Wheel Code into Generic Shared Functions
- **Date**: 2026-02-25
- **Decision**: Refactor the allied-specific color wheel builder into generic `buildColorWheel(pairs, lineColor)` and `wireColorWheelHover(svg, guildListEl)` functions, shared by both allied and enemy wheels.
- **Context**: Arc 9 required an enemy wheel with the same interaction model as the allied wheel. Duplicating the allied code would create two near-identical implementations diverging over time.
- **Alternatives rejected**:
  - Duplication: fastest in the short term, costliest over subsequent arcs.
  - Separate helper module: considered but unnecessary; both functions belong in `src/main.ts` alongside the session end screen code that calls them.
- **Rationale**: Generic functions parameterized on `pairs` and `lineColor` remove duplication entirely. The refactor was small and the combined result is shorter than two separate implementations would have been.

## DEC-044: CSS Custom Properties for Line Colors
- **Date**: 2026-02-25
- **Decision**: Introduce `--allied-line-color` and `--enemy-line-color` CSS custom properties. Both currently set to `#c8b88a`; ready for future visual differentiation of the two wheel styles.
- **Context**: The allied pentagon and enemy star are geometrically distinct, but future arcs may want to reinforce the distinction with color. Plumbing the colors through CSS custom properties costs nothing now and avoids a JavaScript change later.
- **Rationale**: Zero-cost future seam. One-line CSS change in a future arc enables visual differentiation without touching JavaScript.

## DEC-045: Enemy Column Content Gated on Any Enemy Practice
- **Date**: 2026-02-25
- **Decision**: Show enemy column content (wheel + guild list) when `hasCompletedSubgroup('enemy') || isEnemyUnlocked()`. Stopping an enemy session early counts as having practiced; the user need not complete a full session.
- **Context**: Arc 8's unlock gate required a completed enemy session to preserve progressive disclosure. Arc 9 loosened this because the enemy wheel is an extension of content the user has already been exposed to — stopping early still means the user encountered enemy guild names.
- **Previous behavior**: `isEnemyUnlocked()` only — required completing a full enemy session.
- **New behavior**: Either condition unlocks the content.
- **Rationale**: Stopping early is still meaningful engagement. Requiring completion to see the wheel penalizes users who stop early but have already encountered the content. The progressive disclosure goal is met by the initial encounter, not by completion.

## DEC-046: Build System Stays esbuild
- **Date**: 2026-02-25
- **Decision**: The build system remains esbuild. Do not migrate to vite or any other bundler.
- **Context**: This decision was surfaced explicitly during Arc 9 to prevent drift.
- **Rationale**: esbuild was chosen for its simplicity (DEC-009). The project has no unmet needs that justify a bundler change. Migrating would add tooling overhead with no user benefit.
- **Note**: Also recorded in project memory to persist across sessions.

## DEC-047: Gear Icon Replaces Version Footer
- **Date**: 2026-02-25
- **Decision**: The `<footer id="app-version">` is removed. A gear icon button (`id="settings-btn"`) takes its place. Version info and the Honeycomb trace link are moved into the settings panel.
- **Context**: Arc 10 (Settings). The footer had quietly accumulated version display and trace link responsibilities with no clear structure. A dedicated settings panel gives each element appropriate affordance.
- **Alternatives rejected**: Keeping the footer and adding a settings panel alongside it — would duplicate the trace link and create two places to look for version info.
- **Rationale**: Single access point for operational metadata. Cleaner UI; no persistent footer cluttering the session view.

## DEC-048: Reset Is Single-Tap, No Confirmation
- **Date**: 2026-02-25
- **Decision**: "Reset progress" in the settings panel takes immediate effect on tap. No confirmation dialog.
- **Context**: The app stores no account data, no cloud state, no irreplaceable user input. The only persistent state is `sparrow-deck.progression` (an unlock flag and a list of completed subgroups). A reset is a deliberate restart.
- **Alternatives rejected**: Confirmation dialog — adds friction without protecting anything of value. The action is reversible in practice (progress re-accumulates by practicing).
- **Rationale**: Consistent with DEC-003 (no friction). Deliberate user action; no confirmation needed.

## DEC-049: Settings Panel as Static HTML in index.html
- **Date**: 2026-02-25
- **Decision**: The settings panel is authored as static HTML in `index.html` and wired via `DOMContentLoaded`. It is not dynamically constructed in JavaScript.
- **Context**: Arc 10 (Settings). Following DEC-033 (static content belongs in HTML, dynamic behavior in JS).
- **Alternatives rejected**: Dynamic DOM construction — introduces the same architectural mistake corrected by DEC-033.
- **Rationale**: Consistent with established project pattern. Static markup is inspectable, faster to first paint, and keeps JavaScript focused on behavior.

---

## Planned Arcs

### Arc 7: Guild Subgroups (User Arc) — COMPLETE (v0.7.0)
- **Delivered**: 2026-02-24
- **Outcome**: Allied/enemy subgroups implemented. Default start is allied guilds. End screen provides one-tap navigation to the other subgroup. `session.tier` emits `'guild_allied'` or `'guild_enemy'`. 46/46 checks PASS.

### Arc 8: Session End Screen Redesign (User Arc) — COMPLETE (v0.8.0)
- **Delivered**: 2026-02-25
- **Outcome**: Two-column educational layout replaces combo summary and subgroup navigation buttons. Allied column always fully visible. Enemy column locked until first completed enemy session; unlock persists via localStorage. `session.enemy_unlocked` boolean on all session spans; `progression.enemy_unlocked` event on first unlock. 50/50 checks PASS.
- **Note**: Originally planned as "Card Images" (DEC-035). Redirected by client.

### Arc 8 Post-Enhancements: Color Wheel Integration — COMPLETE (v0.8.0)
- **Delivered**: 2026-02-25
- **Outcome**: SVG pentagon color wheel integrated into Allied Guilds column. Bidirectional hover between wheel lines and guild list. "Learn" vs "Practice" button text based on completion history. Locked enemy column simplified to vertically centered button only. Column headers centered.
- **Record**: `arc8-post-enhancements-record.md`
- **Decisions**: DEC-039, DEC-040, DEC-041, DEC-042

### GitHub Pages Deployment — COMPLETE
- **Delivered**: prior to Arc 8
- **Note**: DEC-007 resolved. Deployment is live.

### All Guilds Tier — COMPLETE
- **Delivered**: prior to Arc 8
- **Note**: All 10 guilds available after completing both subgroups.

### Arc 9: Enemy Color Wheel (User Arc) — COMPLETE (v0.8.0)
- **Delivered**: 2026-02-25
- **Outcome**: Enemy SVG star-pattern color wheel integrated into the enemy guilds column. Generic `buildColorWheel()` and `wireColorWheelHover()` shared by both allied and enemy wheels. Enemy column content visible after any enemy practice (including stopped sessions). CSS custom properties `--allied-line-color` and `--enemy-line-color` introduced. `npm test` and `npm run typecheck` scripts added. 130/130 checks PASS.
- **Record**: `arc9-record.md`
- **Decisions**: DEC-043, DEC-044, DEC-045, DEC-046

### Arc 10: Settings (User Arc) — COMPLETE (v0.9.0)
- **Delivered**: 2026-02-25
- **Outcome**: Gear icon replaces version footer. Settings panel overlay provides version display, Honeycomb trace link (session-gated), and single-tap progress reset. `settings.reset_progress` telemetry event on reset. APP_VERSION bumped to 0.9.0. 34/34 checks PASS.
- **Record**: `arc10-record.md`
- **Decisions**: DEC-047, DEC-048, DEC-049

### Arc 11: Card Images — Allied Guilds (User Arc) — COMPLETE (v0.10.0)
- **Delivered**: 2026-02-27
- **Outcome**: Allied guild quiz slides display a random Scryfall card image on the left with pips/name on the right. 50 card references (10 per allied guild). Two-column CSS grid layout, responsive stacking on mobile. `slide.card_name` telemetry attribute on card spans. Enemy guild slides unchanged. 18/18 checks PASS.
- **Record**: `arc11-card-images.md`
- **Decisions**: DEC-050, DEC-051, DEC-052

### Arc 12: Card Images — Enemy Guilds (User Arc) — COMPLETE (v0.11.0)
- **Delivered**: 2026-02-27
- **Outcome**: Enemy guild card images added — pure data arc, zero code changes. 50 card references (10 per enemy guild). All 10 guilds now have card images. 15/15 checks PASS + 13/13 Arc 11 regression PASS.
- **Record**: `arc12-enemy-guild-cards.md`

### PIZZA PARTY
- **Date**: 2026-02-27
- **Context**: After delivering Arc 11 and Arc 12 back-to-back — card images for all 10 guilds, from research through implementation and verification — the client declared the team earned a pizza party.
- **Status**: CELEBRATED

### Arc 14: Session ID Telemetry (Operator Arc) — COMPLETE (v0.12.0)
- **Delivered**: 2026-03-01
- **Outcome**: `mtg-sparrow.session.id` (16-char hex, sessionStorage) added as resource attribute on all spans. `app.navigation = 'single_page'` structural marker on `app.startup` span. APP_VERSION bumped to 0.12.0. Playwright 6/6 PASS; Honeycomb confirmed both attributes on app.startup, session, and card spans.
- **Pre-existing bug noted**: `flushSpans()` forceFlush error on visibilitychange — spans export via batch timer, not introduced by Arc 14. Must fix before Arc 17-20.
- **Record**: `arc14-session-id.md`
- **Decisions**: DEC-055, DEC-056

### Arc 15: CSS Split into Per-Page Stylesheets (Structural Arc) — COMPLETE (v0.13.0)
- **Delivered**: 2026-03-01
- **Outcome**: `style.css` (948 lines) split into 5 files. Architect analyzed the CSS and produced a split plan. Developer executed in 3 commits. Tester verified 23/23 Playwright assertions PASS. No visual or behavioral regressions.
- **Split result**:
  - `style.css` — shared rules only (variables, reset, fonts, body, #app, #gas, footer, settings panel, gas buttons, @keyframes cardEnter)
  - `welcome.css` — 7 rules for welcome screen
  - `slides.css` — card/quiz/done-zone rules, @keyframes buttonFadeIn, all `#app.app--quiz-active` overrides (consolidated from 3 separate blocks)
  - `assessment.css` — 6 self-assessment rules
  - `end.css` — guild columns, color wheels, session-end, combo-summary-pips/name, next-session-button (consolidated 2× `.guild-column-item` into one block)
  - `card-back.css` — standalone demo file, left alone
- **Dead CSS removed** (8 rules): `.session-footer`, `.footer-left`, `.stop-btn`, `.pause-btn`, `.paused-overlay`, `.card-image-container.revealed`, `.card-back`, `.card-back.revealed`
- **Structural marker**: `css.split = true` on `app.startup` span; APP_VERSION bumped to 0.13.0
- **Observability note**: Bundle inspection confirms `css.split` attribute is correctly coded. Runtime Honeycomb confirmation pending deployment (known flush-timing limitation with headless browser tests).
- **Decisions**: DEC-057, DEC-058

### Arc 16: Module Extraction from main.ts (Structural Arc) — COMPLETE (v0.14.0)
- **Delivered**: 2026-03-02
- **Outcome**: Three modules extracted from `main.ts` into `src/ui/`: `guild-columns.ts`, `self-assessment.ts`, `settings.ts`. `main.ts` reduced from 957 to 438 lines; now a thin orchestrator. Structural marker `app.module_structure = 'extracted'` on `app.startup` span. 23/23 Playwright checks PASS.
- **Observability note**: Bundle inspection confirms `app.module_structure = 'extracted'` is correctly coded. Runtime Honeycomb confirmation pending deployment (known flush-timing limitation).
- **Decisions**: DEC-059, DEC-060

### Arc 13: Candidates
- **Visual differentiation** of allied vs enemy wheel lines (follow-on to DEC-044)
- **Shards & Wedges tier** — three-color combinations (DEC-005)
- **Loading/skeleton states** for card images (slow connections)
- **Answer buttons / interactive quiz mode**

---

## Future Enhancements (from client Proposal annotations)

Items noted by client but explicitly out of scope for initial delivery:

- **Real card images**: Use different real Magic card images per repetition of a combo (more faithful to original Sparrow Deck technique) — see DEC-035
- **Adaptive pacing**: Increase speed after practice, based on observability data
- **Page refresh detection**: Use localStorage to notice page refreshes, which could indicate errors (complements Honeycomb Web SDK automatic session ID)

---

## DEC-050: Card Image Alt Text Empty
- **Date**: 2026-02-27
- **Decision**: Card image `alt` attribute set to empty string (`""`). The card art is supplementary learning material; the card name must not appear as visible text anywhere on the slide.
- **Context**: Arc 11 (Card Images). The card IS the lesson — showing the name would undermine the perceptual learning model.
- **Rationale**: Consistent with DEC-003. Accessibility note: the image is decorative in context; the functional content (guild name + mana pips) has its own accessible elements.

## DEC-051: Random Card Selection at Deck-Build Time
- **Date**: 2026-02-27
- **Decision**: Random card selection happens at deck-build time (`session.ts:buildDeck`), not at render time. The `Slide` type extends `ColorCombo` with an optional `selectedCard`.
- **Context**: Arc 11. This means the same slide always shows the same card image across pause/resume within a session.
- **Rationale**: Deterministic per-session behavior. Avoids confusing visual changes if the user pauses and resumes.

## DEC-052: App Container Width Increase for Card Images
- **Date**: 2026-02-27
- **Decision**: `#app` max-width increased from 600px to 700px to accommodate the side-by-side card image layout.
- **Context**: Arc 11. The original 600px was too narrow for a card image (180px) plus quiz content in a two-column grid.
- **Note**: Subsequently overridden during quiz sessions by the full-screen flashcard CSS (client-requested enhancement post-Arc 11).

---

## DEC-053: Multi-Page Architecture — SPA to Separate HTML Pages
- **Date**: 2026-03-01
- **Decision**: Decompose the single-page app into four separate HTML pages: welcome (`index.html`), slides (`slides.html`), assessment (`assessment.html`), and end (`end.html`). Each page has its own JS entry point and CSS. Navigation is standard browser links. Back button and refresh work naturally.
- **Context**: The SPA constructs all screens via DOM manipulation in a single `index.html`. Navigation is invisible to the browser. The three screens (welcome, quiz, end) represent genuinely separate concerns with almost no shared runtime state.
- **Alternatives rejected**: Client-side routing (still one bundle, pushState) — client explicitly wanted true separate pages for separate concerns.
- **Rationale**: Architecturally honest separation. Each page loads independently. Browser navigation works. `main.ts` (950+ lines) decomposes naturally into focused entry points.
- **Documents**: `rfp-multipage.md`, `sow-multipage.md`

## DEC-054: Self-Assessment as Separate Page
- **Date**: 2026-03-01
- **Decision**: The self-assessment ("How did that feel?") becomes its own page (`assessment.html`) rather than living on the end page. The end page is directly navigable without an assessment prompt blocking the view.
- **Context**: Client wants `end.html` to be a stable landing page showing guild columns and navigation. The self-assessment is a post-session reflection that belongs between slides and end.
- **Flow**: Slides → Assessment → End. Assessment passes its result as a URL param to End.
- **Rationale**: End page should be directly accessible. Self-assessment is a brief transitional moment, not part of the guild exploration experience.

## DEC-055: Per-Page Telemetry with mtg-sparrow.session.id
- **Date**: 2026-03-01
- **Decision**: No cross-page trace continuity. Each page creates its own root spans. All spans carry `mtg-sparrow.session.id` (namespaced to avoid collision with auto-instrumentation session IDs) stored in `sessionStorage` for Honeycomb correlation across pages.
- **Context**: In-memory OTel spans cannot survive page navigations. Attempting to propagate trace context across pages requires low-level OTel plumbing that violates the telemetry abstraction boundary (DEC-020).
- **What we lose**: Single trace waterfall view of a full session in Honeycomb.
- **What we keep**: Every aggregation query. All card-level and session-level attributes. Per-page observability.
- **Rationale**: Architectural honesty. Each page's telemetry reflects what happened in that page's JS context. The questions we care about are answered by aggregation, not trace waterfalls.

## DEC-056: Telemetry First in Arc Sequencing
- **Date**: 2026-03-01
- **Decision**: Arc 14 (first arc of the multi-page engagement) adds `mtg-sparrow.session.id` to all spans while the app is still a single page. This precedes any structural changes.
- **Context**: Client requirement — "I want the telemetry at the beginning so I can check it during development."
- **Rationale**: Observability-first development. Every subsequent arc is verifiable in Honeycomb from day one.

## DEC-057: CSS Split into Per-Page Stylesheets
- **Date**: 2026-03-01
- **Decision**: Split `style.css` into five files: `style.css` (shared), `welcome.css`, `slides.css`, `assessment.css`, `end.css`. Audit for dead CSS and remove it during the split.
- **Context**: The current CSS has clean natural seams matching the page split. Dead CSS from prototype components likely exists.
- **Rationale**: Clarity of ownership — when working on a page, all its styles are in one file. Confidence about scope — modifying `end.css` cannot break slides. Dead CSS cleanup is a natural byproduct.

## DEC-058: Dead CSS Cleanup During Arc 15 Split
- **Date**: 2026-03-01
- **Decision**: During the Arc 15 CSS split, 8 dead CSS rules were identified and removed: `.combo-summary`, `.combo-summary-heading`, `.combo-summary-list`, `.combo-summary-item`, `.session-next-divider`, `.session-next`, `.session-next-label`, `.session-next-buttons`. Note: `.combo-summary-pips` and `.combo-summary-name` were kept (used inside guild column items on the end screen).
- **Context**: These rules were relics of an earlier session-end design that showed combo summaries and "next session" navigation inline. The current end screen uses guild columns instead. No live code references any of these selectors. The Architect cross-checked against all HTML and JS before removal.
- **Tradeoffs**: Dead CSS removal is permanent; if any rule was misidentified as dead, recovery requires git history. The Architect cross-checked against all HTML and JS before removal.
- **Rationale**: Dead CSS is noise. The split forced an audit; removing confirmed-dead rules keeps the new per-page files lean.

## DEC-059: Module Extraction Strategy — Three Modules from main.ts
- **Date**: 2026-03-02
- **Decision**: Extract three modules from `main.ts` into `src/ui/`: `guild-columns.ts`, `self-assessment.ts`, and `settings.ts`. Use a callback pattern for cross-module dependencies rather than shared mutable state.
- **Context**: Arc 16. `main.ts` had grown to 957 lines combining guild column logic, self-assessment rendering, settings wiring, and session orchestration. Module extraction is groundwork for per-page decomposition (Arcs 17–20).
- **Callback pattern**: `startSession` passed as callback to `guild-columns` (for end-screen session buttons); `getSessionSpan` passed as callback to `settings` (for Honeycomb trace URL link).
- **Alternatives considered**: Shared module exports vs. callbacks. Callbacks chosen to avoid circular import risk and keep modules self-contained.
- **Rationale**: Each extracted module has a clear single concern. Callbacks keep the dependency direction clean — modules do not reach back into main.ts. `main.ts` becomes a thin orchestrator, which is its role as the single-page entry point.

## DEC-060: Arc 16 Complete — v0.14.0, app.module_structure = 'extracted'
- **Date**: 2026-03-02
- **Decision**: Arc 16 declared complete. Version bumped to 0.14.0. Structural marker `app.module_structure = 'extracted'` added to `app.startup` span.
- **Verification**: 23/23 Playwright checks PASS. Bundle inspection confirms telemetry markers. Runtime Honeycomb confirmation pending deployment (known flush-timing limitation).
- **Result**: `main.ts` reduced from 957 to 438 lines. Three focused modules in `src/ui/`. App behavior and tests fully preserved.

## DEC-061: slides.html Navigates to assessment.html (404 Until Arc 18)
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: `slides.html` navigates to `assessment.html` on session end, even though `assessment.html` does not exist until Arc 18. Sessions 404 at the end during this arc.
- **Alternatives rejected**: Temporary workaround (e.g., navigate back to index.html or show an in-page message) — rejected as unnecessary complexity that would need to be undone.
- **Rationale**: Clean architectural separation over temporary shims. The 404 is expected, temporary, and unambiguous. Arc 18 resolves it.

## DEC-062: No Mana Gas on Slides Page
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: The animated mana gas background (`#gas` canvas, `animateGas()`) is welcome-page ambiance only. `slides.html` has no gas animation.
- **Context**: The gas effect was introduced as a welcome-screen ambient visual. It creates cognitive noise during the card session.
- **Rationale**: The slides page is focus mode — cards only. Removing distraction improves the learning experience. Each page should include only what it needs.

## DEC-063: welcome_dwell_ms Passed via URL Param
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: The `welcome_dwell_ms` value (time user spent on welcome page before starting) is passed from `index.html` → `slides.html` via URL query parameter, not sessionStorage.
- **Alternatives rejected**: sessionStorage — would work, but URL params make data flow explicit and visible. The value is single-use and ephemeral.
- **Rationale**: Explicit data flow. URL params are the right mechanism for data that belongs to a single page transition. SessionStorage is reserved for data that persists across the full session (`mtg-sparrow.session.id`).

## DEC-064: flushSpans() Called Before Page Navigation
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: `flushSpans()` is called explicitly before each `window.location.href` navigation in `slides.ts`. Cannot rely on the `visibilitychange` handler — page navigation fires before visibility change settles.
- **Context**: When navigating away, in-memory OTel spans would be lost without an explicit flush attempt.
- **Rationale**: Best-effort span preservation before navigation. Even if `forceFlush` is not available (see DEC-065), the call structure ensures any future improvement is wired in the right place.

## DEC-065: flushSpans() Bug Fix — typeof Guard + .catch()
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: Fixed `flushSpans()` in `src/telemetry/telemetry.ts` to guard against missing `forceFlush` method with `typeof provider.forceFlush === 'function'` before calling, plus `.catch(() => {})` to suppress async errors.
- **Context**: `trace.getTracerProvider()` returns the OTel global `ProxyTracerProvider`, which only implements `getTracer()` — not `forceFlush()`. Calling it threw a `TypeError` synchronously, silently aborting the calling function (navigation never happened). This was the known bug from project memory: "flushSpans() forceFlush error on visibilitychange."
- **Symptom**: Clicking "Done for now" had no effect — no navigation, no error visible to user.
- **Fix**: `if (typeof provider.forceFlush === 'function') { provider.forceFlush().catch(() => {}); }`
- **Remaining limitation**: Spans still export via 30s OTel batch timer. A proper synchronous flush requires storing the `HoneycombWebSDK` instance and calling `sdk.shutdown()`. Deferred to future arc.
- **Rationale**: Defensive guard resolves the crash. Navigation now works. Spans reach Honeycomb via batch timer. The bug was blocking multi-page delivery; this fix unblocks Arcs 17–20.

## DEC-066: Assessment and End Screen Logic Excluded from slides.ts
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: `showSessionEnd`, `buildSelfAssessment`, and guild column rendering are NOT included in `src/slides.ts`. These become the responsibility of `assessment.html` (Arc 18) and `end.html` (Arc 19) respectively.
- **Context**: The existing `main.ts` showed all post-session UI in the same JS context. The multi-page architecture assigns each screen to its own page.
- **Rationale**: Clean separation of concerns. Each page's entry point handles only what that page needs to render and behave. `slides.ts` ends when navigation fires — it does not know what comes next beyond the URL.

## DEC-067: Two Separate esbuild Calls for Multi-Entry Build
- **Date**: 2026-03-02
- **Arc**: 17
- **Decision**: The build uses two separate esbuild calls — one producing `dist/bundle.js` (from `src/main.ts`), one producing `dist/slides.js` (from `src/slides.ts`) — rather than a single esbuild call with `--outdir` and entry name patterns.
- **Alternatives rejected**: `esbuild src/main.ts src/slides.ts --outdir=dist --entry-names=[name]` — would produce `dist/main.js` and `dist/slides.js`, requiring `index.html` to be updated from `bundle.js` to `main.js`.
- **Rationale**: Backward compatibility with existing `index.html` referencing `dist/bundle.js`. Avoids a two-file change (build config + HTML) during Arc 17. When Arc 20 creates `welcome.ts` and deletes `main.ts`, the build can be unified cleanly at that point.

## DEC-068: Assessment Page Skip Logic
- **Date**: 2026-03-02
- **Arc**: 18
- **Decision**: If a session has fewer than 3 cards, skip the self-assessment prompt entirely and navigate directly to `end.html`.
- **Context**: A very short session (1–2 cards) doesn't provide enough exposure for meaningful self-reflection. Showing "How did that feel?" after 1 card would be premature.
- **Rationale**: The self-assessment is useful when the user has actually done some learning. The 3-card threshold is a minimal floor; it keeps the feature meaningful without excessive filtering.

## DEC-069: End Page Display Driven by localStorage, Not URL Params
- **Date**: 2026-03-02
- **Arc**: 19
- **Decision**: The end page reads URL params if available (for `session.summary` telemetry) but drives its display state — which guild columns are unlocked — entirely from localStorage.
- **Context**: The end page must be safely directly navigable (bookmarkable, shareable). If display depended on URL params, direct access would show a broken or empty page.
- **Rationale**: URL params are session ephemera; localStorage holds persistent progression state. Separating these concerns makes the page resilient. The telemetry gets richer data when params are present; the display is never broken when they aren't.

## DEC-070: Navigation Buttons on End Page Use Page Navigation (slides.html)
- **Date**: 2026-03-02
- **Arc**: 19
- **Decision**: Navigation buttons on the end page link to `slides.html?subgroup=X&from=end` using standard page navigation, not an in-page `startSession()` call.
- **Context**: With multi-page architecture, each page is self-contained. There is no `startSession()` on the end page — the slides page owns session state. The end page's job is display + navigation only.
- **Rationale**: Consistent with DEC-053 (multi-page architecture). Keeps the end page's scope narrow. The slides page receives the `from=end` param for telemetry attribution.

## DEC-071: main.ts Deleted, Replaced by welcome.ts
- **Date**: 2026-03-02
- **Arc**: 20
- **Decision**: `src/main.ts` was renamed to `src/welcome.ts` and deleted. The build now has four named entry points: `welcome.js`, `slides.js`, `assessment.js`, `end.js`. The old `bundle.js` no longer exists as a build output.
- **Context**: Arc 17 introduced `bundle.js` as a backward-compatibility shim (DEC-067). Arc 20 completes the migration — `index.html` updated to reference `welcome.js`, and the build config cleaned up.
- **Rationale**: The `bundle.js` naming was a temporary bridge. Arc 20 was the right moment to complete the rename — all four pages exist, all four entry points are active. The code now accurately reflects its own structure.

## DEC-072: All Four Pages Emit app.navigation='multi_page' — Structural Marker Complete
- **Date**: 2026-03-02
- **Arc**: 20
- **Decision**: After Arc 20, all four pages (welcome, slides, assessment, end) emit `app.navigation = 'multi_page'` as a resource attribute. The welcome page was the last to be updated (it had been emitting `'single_page'`).
- **Context**: `app.navigation` was introduced in Arc 14 as the structural marker for the multi-page decomposition (DEC-053). It serves as runtime evidence that all pages are participating in the new architecture.
- **Rationale**: The structural marker is only meaningful when it's consistent across all pages. Arc 20 closes the loop. Honeycomb queries on `app.navigation = 'multi_page'` now return spans from all four pages.

## DEC-073: flushSpans() Made Async and Awaited Before Navigation
- **Date**: 2026-03-02
- **Arc**: 21
- **Decision**: `flushSpans()` changed from `void` to returning `Promise<void>`. All callers in `slides.ts` and `assessment.ts` now `await flushSpans()` before setting `window.location.href`.
- **Context**: Arc 21 telemetry verification revealed that spans were being exported fire-and-forget — navigation could fire before the OTel exporter had time to flush over the network. This was a reliability gap, not a correctness bug (spans were queued, just at risk under slow connections).
- **Rationale**: Awaiting the flush ensures span delivery completes (or times out gracefully) before the page unloads. This improves reliability across all connection speeds. DEC-064 established the pattern; this closes the gap in the implementation.

## DEC-074: Local Serve URL Param Stripping — Known Limitation, No Fix
- **Date**: 2026-03-02
- **Arc**: 21
- **Decision**: The `serve` static file server strips URL params when redirecting `.html` extension URLs (e.g., `/slides.html?subgroup=allied` → `/slides.html`). No fix applied.
- **Context**: Discovered during Arc 21 testing. The local server's `.html` redirect behavior caused intermittent test failures when using full-extension URLs. GitHub Pages preserves URL params correctly.
- **Rationale**: This is a local development environment limitation only. Production behavior (GitHub Pages) is correct. Applying a workaround (e.g., configuring the local server differently or removing `.html` from links) would add complexity for a non-production concern. Documented so the team does not re-investigate.

---

## SOW Completion: Multi-Page Decomposition — CLOSED
- **Date**: 2026-03-02
- **Final Version**: v0.19.0
- **Arc Range**: Arcs 14–21 (8 arcs)

All success criteria from the Multi-Page Decomposition SOW are met:
- Four independent HTML pages: welcome, slides, assessment, end
- Per-page JS bundles (welcome.js, slides.js, assessment.js, end.js)
- Per-page CSS files (style.css + welcome/slides/assessment/end)
- `mtg-sparrow.session.id` correlates all session spans across pages in Honeycomb
- `app.navigation = 'multi_page'` structural marker on all spans
- Browser back/forward/refresh work naturally on every page
- No visual or behavioral regressions

**Phase 1** (Arcs 14–16): Foundations — telemetry ID, CSS split, module extraction — COMPLETE
**Phase 2** (Arcs 17–20): Page creation — slides, assessment, end, welcome — COMPLETE
**Phase 3** (Arc 21): Cross-page telemetry verification — COMPLETE

---

---

## DEC-075: End Screen Layout Changed to Full-Width Stacked Rows
- **Date**: 2026-03-02
- **Arc**: 22
- **Decision**: End screen layout changed from a two-column grid (allied | enemy) to full-width stacked rows — one row per completed level. Each row has a three-part internal layout: summary section (left), centered color wheel (middle), flavor panel (right).
- **Context**: The previous two-column layout constrained the color wheel width (280px max) and left no room for descriptive text alongside each guild. The new row layout gives each completed level its own visual presence.
- **Rationale**: Full-width rows allow the color wheel to breathe (360px max), create space for the flavor panel in Arc 23, and are more extensible to future content (wedges, shards). The three-part layout mirrors the natural structure: what you learned, what it looks like, what it means.

## DEC-076: Flavor Panel Placeholder Shows Guild Name on Highlight
- **Date**: 2026-03-02
- **Arc**: 22
- **Decision**: In Arc 22, the flavor panel shows the highlighted guild's name as a text placeholder. Full descriptions are deferred to Arc 23.
- **Context**: Arc 22 establishes the visual structure and interaction pattern. The flavor panel DOM exists and responds to hover/tap, but content is not yet authored.
- **Rationale**: Establishing the layout and interaction in Arc 22 (a client pause point) allows the client to confirm the visual direction before investing in content authoring. The placeholder makes the interaction intent clear without committing to content.

## DEC-077: Guild Flavor Descriptions in Separate Data File
- **Date**: 2026-03-02
- **Arc**: 22 (data created in parallel with Arc 22 delivery)
- **Decision**: Guild flavor descriptions are authored in `src/data/guild-descriptions.ts` as a standalone data structure, separate from `src/data/combos.ts`.
- **Context**: The domain expert researched and wrote descriptions for all 10 guilds, including Scryfall links and optional iconic card additions. Rather than embedding this in the existing combos data structure, a dedicated file was created.
- **Rationale**: Separation of concerns — flavor/lore content is distinct from mechanical game data. A separate file makes the descriptions easier to review, extend, and maintain independently. Wiring into the UI is Arc 23's job.

---

---

## DEC-078: Flavor Panel Layout Order
- **Date**: 2026-03-02
- **Arc**: 23
- **Decision**: The flavor panel displays content in this order: guild name → description (3–5 sentences) → "More [Guild] cards →" Scryfall link → Practice button.
- **Context**: The flavor panel was a placeholder in Arc 22 (guild name only). Arc 23 wires in the full content from `src/data/guild-descriptions.ts`.
- **Rationale**: Top-to-bottom reading order matches information hierarchy — identify (name), understand (description), explore (Scryfall), practice (action). The Practice button is last because it's an action, not content.

## DEC-079: Guild Interaction Telemetry — end.guild_highlight and end.scryfall_click
- **Date**: 2026-03-02
- **Arc**: 23
- **Decision**: Two telemetry spans track user behavior on the end screen: `end.guild_highlight` (fires when a guild is highlighted) and `end.scryfall_click` (fires when the Scryfall link is clicked), both carrying `guild.id`.
- **Context**: Arc 23 SOW specified interaction telemetry as an observability goal, with the intent of answering "Which guilds do people explore most on the end screen?"
- **Rationale**: Lightweight event spans are sufficient for this intent — no page load overhead, just user-initiated interactions. `guild.id` on both spans enables cross-event analysis per guild.

## DEC-080: Iconic Cards Added — Azor, Voice of Resurgence, Savra
- **Date**: 2026-03-02
- **Arc**: 23
- **Decision**: Three iconic cards added to guild card lists: Azor the Lawbringer (Azorius), Voice of Resurgence (Selesnya), Savra, Queen of the Golgari (Golgari). Aurelia, the Warleader was already present in Boros.
- **Context**: Domain expert identified these as the most iconic missing representatives during Arc 22 research. Arc 23 wired them in alongside the flavor text.
- **Rationale**: Iconic cards reinforce flavor identity — each guild should have at least one immediately recognizable card that embodies its personality. These three were gaps; others were already covered.

---

## SOW Completion: End Screen Refinements — CLOSED
- **Date**: 2026-03-02
- **Final Version**: v0.21.0
- **Arc Range**: Arcs 22–23 (2 arcs)

All success criteria from the End Screen Refinements SOW are met:
- End screen renders completed levels as full-width rows with three-part layout
- Color wheel prominently centered (360px max-width)
- Guild highlight shows full flavor description, Scryfall link, and Practice button
- Interaction telemetry (`end.guild_highlight`, `end.scryfall_click`) visible in Honeycomb
- Works on desktop and mobile
- `end.layout_version = 'rows_v1'` structural marker present

**Arc 22**: End Screen Row Layout — COMPLETE
**Arc 23**: Guild Flavor Text & Card Additions — COMPLETE

---

## Tangent Session: Slot Machine Exploration + End Screen Reel Overhaul — 2026-03-02

This session was an unplanned exploration outside the formal SOW process. The client and team experimented with slot-machine reel mechanics, first as a standalone prototype, then applied directly to the end screen. The result replaced the stacked-row layout entirely.

---

## DEC-081: Slot Machine Prototype Created as Standalone Exploration Page
- **Date**: 2026-03-02
- **Context**: Outside formal SOW. Client wanted to explore a reel/slot-machine navigation pattern to see if it felt right for the end screen.
- **Decision**: A standalone page at `/slot-machine` was created (`slot-machine.html`, `slot-machine.css`, `src/slot-machine.ts`) with a single reel of five mana symbols, a pull button, and scroll-to-spin. Added as a separate esbuild entry point in `package.json`.
- **Rationale**: Building the mechanic in isolation allowed fast experimentation with the animation feel without risking the end screen. The prototype confirmed the reel approach was worth applying to the real page.
- **Alternatives considered**: Prototyping directly in end screen (riskier), or skipping prototype (less confidence in the mechanic).

## DEC-082: Reel Navigation Pattern Chosen for End Screen Sections
- **Date**: 2026-03-02
- **Context**: The end screen previously showed completed level sections (Allied, Enemy) as stacked full-width rows (`rows_v1`). The slot machine prototype demonstrated a reel alternative.
- **Decision**: End screen sections are now faces on a reel — one visible at a time in a clipping viewport. Scroll inside the viewport or top/bottom nav buttons advance sections with a slot-machine animation.
- **Rationale**: The reel pattern focuses attention on one level at a time, preventing the end screen from feeling like a wall of content. It also sets up the dot indicator arc naturally. The prototype validated the tactile feel before committing.
- **Alternatives considered**: Scroll-snap (tried and reverted in Arc 24 attempt 1), stacked rows (was the prior state, visually crowded), tabs (not consistent with the app's navigation style).

## DEC-083: Cubic-Bezier(0.2, 0.8, 0.3, 1.05) at 600ms for Slot Machine Feel
- **Date**: 2026-03-02
- **Context**: Many easing options were tried. The goal was a "pulls and settles" feeling, not a linear or simple ease-out.
- **Decision**: `cubic-bezier(0.2, 0.8, 0.3, 1.05)` at 600ms duration is used for all reel transitions — both in the slot machine prototype and in the end screen. The `1.05` overshoot creates a gentle bounce-back.
- **Rationale**: The overshoot past 1.0 produces a physical "slot machine snap" sensation. 600ms is long enough to feel intentional but short enough not to feel sluggish. This constant is shared between both implementations (`REEL_TRANSITION` in `guild-columns.ts`, same literal in `slot-machine.ts`).
- **Code reference**: `transform 600ms cubic-bezier(0.2, 0.8, 0.3, 1.05)`

## DEC-084: Trackpad Wheel Cooldown — 700ms Timestamp Gate
- **Date**: 2026-03-02
- **Context**: Trackpads emit dozens of `wheel` events per swipe (momentum scrolling). Without throttling, a single swipe would spin through all sections.
- **Decision**: A timestamp-based gate blocks all wheel events for 700ms after the first event fires. This outlasts both the 600ms transition and typical trackpad inertia trailing events.
- **Rationale**: A debounce (delay-based) approach would introduce lag. A timestamp gate fires immediately on the first event, then ignores all events for a fixed window — matching the "one gesture = one section" intent. 700ms was determined empirically to absorb inertia without feeling sticky.
- **Alternatives considered**: `requestAnimationFrame` throttle (too coarse), debounce (adds lag), passive listener without prevention (can't call `preventDefault`).
- **Code reference**: `WHEEL_COOLDOWN_MS = 700` in both `slot-machine.ts` and `guild-columns.ts`.

## DEC-085: end.page_view Root Span Added — Spans Were Previously Orphaned
- **Date**: 2026-03-02
- **Context**: The end screen emitted `session.summary`, `end.guild_highlight`, and `end.scryfall_click` spans, but had no root span. These spans had no parent and appeared as disconnected traces in Honeycomb.
- **Decision**: A root span `end.page_view` is now started immediately in `end.ts` and stays open until the user leaves the page (via `visibilitychange` or navigation). All other spans on the end screen are children of this span.
- **Rationale**: A root span establishes a single trace per page visit, enabling Honeycomb to show end-screen activity as a coherent trace rather than isolated orphans. This is consistent with the telemetry pattern used on other pages.
- **Structural marker**: `end.layout_version` is set on the `end.page_view` span.

## DEC-086: end.section_view Spans for Time-on-Section Observability
- **Date**: 2026-03-02
- **Context**: With reel navigation, users land on one section, may dwell, then navigate. There was no way to observe how long users spend on each level's end screen.
- **Decision**: A child span `end.section_view` is started each time the user arrives at a section (including on page load for section 0). It carries `end.section_index` and `end.section_name` attributes. It is ended when the user navigates away from that section or leaves the page.
- **Rationale**: Section spans provide time-on-section observability — a key product signal for "which level do users linger on?" They also provide a natural parent for guild interaction events (`end.guild_highlight`, `end.scryfall_click`), which were previously orphaned under page_view.
- **Replaces**: `end.section_navigate` event spans (removed — the section_view boundaries capture the same information more richly).

## DEC-087: Mutable SpanRef Pattern for Event Handlers Referencing Current Section Span
- **Date**: 2026-03-02
- **Context**: Guild hover and Scryfall click handlers are registered once when a section is built. But the current active section span changes as the user navigates. Closure over a stale span reference would attribute all events to the wrong (initial) span.
- **Decision**: A mutable wrapper object `SpanRef = { current: Span }` is passed to event handlers by reference. When the section changes, `sectionSpanRef.current` is updated to the new section span. Handlers always access `.current`, so they automatically reference the live span.
- **Rationale**: This is a minimal, zero-overhead solution to the "stale closure" problem. The alternative (re-registering event handlers on every section change) would require teardown logic and is more error-prone.
- **Type**: `type SpanRef = { current: Span }` defined in `src/ui/guild-columns.ts`.

## DEC-088: Trace Link in Settings Always Visible (Not Gated on Session Arrival)
- **Date**: 2026-03-02
- **Context**: Previously, the trace link in the settings panel was conditionally shown only when the user arrived from a session (i.e., `subgroup` URL param was present). Direct visits had no trace link.
- **Decision**: The trace link is now always shown in settings. It is wired to the `end.page_view` trace ID, which exists on every page load.
- **Rationale**: With the new `end.page_view` root span, there is always a valid trace to link to. Hiding it from direct visits was an accidental limitation. Operators and developers should always be able to inspect what happened.

## DEC-089: end.layout_version Changed from rows_v1 to reel_v1
- **Date**: 2026-03-02
- **Context**: The previous structural marker `end.layout_version = 'rows_v1'` referred to the stacked-row layout from Arc 22. The end screen layout is now fundamentally different.
- **Decision**: `end.layout_version` is now `'reel_v1'` on all `end.page_view` spans.
- **Rationale**: Structural markers must change when the architecture changes. `reel_v1` distinguishes this version from both the old column layout (pre-Arc 22) and the rows layout (Arc 22–23). This enables Honeycomb queries to segment by layout version over time.

## DEC-090: Replace Cooldown-Based Wheel Debounce with Accumulated DeltaY Threshold
- **Date**: 2026-03-02
- **Context**: The end screen reel navigation used a 700ms cooldown timer (DEC-084) to prevent double-scrolling from trackpad inertia. Observability data (trace 7a64e014e2b58373ae2176310f67d3bb) revealed the root cause: trackpad inertia outlasts the 700ms cooldown. The animation finishes at 600ms, `reelSpinning` clears, then at 703ms the cooldown expires and an inertia tail event advances the reel again.
- **Decision**: Replace the cooldown timer entirely with accumulated deltaY threshold. Track a running sum of deltaY across wheel events. Only advance when |accumulated| >= 700. Reset accumulator after advance or on direction change.
- **Rationale**: Cooldown timers are fundamentally mismatched to trackpad inertia — inertia duration is unpredictable and varies by OS, browser, and device. Accumulated deltaY naturally absorbs inertia: the initial strong gesture clears the threshold quickly, then the inertia tail (deltaY 2–3) does not accumulate enough to trigger again. The threshold of 700 was tuned by the client using real Honeycomb data.
- **Alternatives considered**: Resetting the cooldown on every event (tested and REVERTED — this blocked all re-scrolling; the more you scroll, the more the cooldown pushes forward).
- **Note**: Firefox uses line-mode deltaY (small integers 1–25), Chrome uses pixel-mode (larger values). Accumulated deltaY handles both correctly.

## DEC-091: Move Wheel Listener from Viewport Element to Document
- **Date**: 2026-03-02
- **Context**: The wheel event listener was registered on the viewport element. As sections shrink or the cursor moves, the listener could miss events when the pointer was outside the viewport element bounds.
- **Decision**: Register the wheel listener on `document` instead of the viewport element.
- **Rationale**: Ensures consistent scroll behavior regardless of cursor position. Especially important when section content is smaller than the full page.

## DEC-092: Reduce Wheel Telemetry to Key Events Only
- **Date**: 2026-03-02
- **Context**: Initial wheel telemetry instrumentation (added for diagnosis) emitted a span event for every wheel event including `accumulating` events. A single session produced 1000+ events, overwhelming the trace view.
- **Decision**: Drop `accumulating` span events. Only emit: `gesture_start`, `direction_change`, `advance`, `suppressed_spinning`, `suppressed_bounds`.
- **Rationale**: Diagnostic signal is fully preserved for the meaningful transitions (gesture start, direction change, advance, suppression reasons). The high-frequency `accumulating` events added noise without diagnostic value. This reduces telemetry from ~1000+ events per session to ~dozen.

---

## DEC-093: Three-Color Combos in Existing guilds Array, Discriminated by tier Field
- **Date**: 2026-03-02
- **Arc**: 28
- **Decision**: The 10 three-color combos (wedges and shards) are appended to the existing `guilds` array in `src/data/combos.ts`. A `tier` field (`'guild' | 'wedge' | 'shard'`) discriminates them. Export helpers `wedges` and `shards` filter by tier.
- **Alternatives rejected**: A separate `threeColorCombos` array — would require changes to all consumers of the data and adds a naming split that doesn't reflect the unified nature of the data model.
- **Rationale**: Keeping one array keeps exports, filtering, and iteration simple. The `tier` field is the natural discriminator. Existing code that iterates `guilds` for two-color content can filter by `tier === 'guild'`; future UI code can filter for wedges or shards specifically.

## DEC-094: Card Curation Methodology — EDHREC Popularity + Block Legendaries
- **Date**: 2026-03-02
- **Arc**: 28
- **Decision**: ~10 iconic cards per combo curated using two criteria: (1) EDHREC popularity within the color identity, (2) original block legendaries (Khans of Tarkir for wedges, Shards of Alara for shards). No card appears in more than one combo's list.
- **Rationale**: EDHREC popularity ensures cards are recognizable to experienced players. Block legendaries anchor the combo to its canonical MTG identity. The ~10 card count matches the established guild card count, keeping data structure consistent. No duplicates across combos prevents confusion.

## DEC-095: Flavor Descriptions Added to Existing guild-descriptions.ts
- **Date**: 2026-03-02
- **Arc**: 28
- **Decision**: Flavor descriptions for all 10 three-color combos are added to the existing `guildDescriptionMap` in `src/data/guild-descriptions.ts`. No new file created.
- **Alternatives rejected**: A separate `threeColorDescriptions.ts` file — would require changes to all consumers and splits content that serves identical purposes.
- **Rationale**: The `guildDescriptionMap` is keyed by combo ID string, which works for any combo regardless of tier. Reusing the file keeps the data model consistent and the UI lookup code unchanged.

## DEC-096: Structural Marker data.tier_version = 'three_color_v1' on app.startup
- **Date**: 2026-03-02
- **Arc**: 28
- **Decision**: `data.tier_version = 'three_color_v1'` is added as an attribute on the `app.startup` span, following the same pattern as `app.module_structure = 'extracted'` (DEC-060).
- **Context**: Arc 28 adds a substantial data layer change (10 new combos). A structural marker makes this version detectable in Honeycomb without code inspection.
- **Rationale**: Structural markers are how operators know what version of the data model is running. `three_color_v1` clearly signals that three-color combo data is present. Future arcs adding four-color data would emit `four_color_v1`.

---

## Arc 28: Wedge & Shard Data — COMPLETE (v0.23.0)
- **Delivered**: 2026-03-02
- **Outcome**: 10 three-color combos (5 wedges, 5 shards) added to data layer. ~100 iconic cards curated across all combos. Flavor descriptions and Scryfall URLs added to guild-descriptions.ts. `data.tier_version = 'three_color_v1'` structural marker confirmed in Honeycomb. 59/59 PASS.
- **Record**: `arc28-wedge-shard-data.md`
- **Decisions**: DEC-093, DEC-094, DEC-095, DEC-096

---

## DEC-097: GuildSubgroup Type Expanded In-Place Rather Than Renamed
- **Date**: 2026-03-02
- **Arc**: 29
- **Decision**: The `GuildSubgroup` type in `src/session.ts` is expanded to `"allied" | "enemy" | "wedges" | "shards"` rather than renamed to something more accurate like `SessionTier`.
- **Context**: `GuildSubgroup` is technically a misnomer now that it covers wedges and shards (which are three-color, not guild-level). Renaming would require touching many files with no behavioral benefit.
- **Rationale**: Correctness of naming is a minor concern compared to churn risk at this stage. The `tier` field in combo data provides the meaningful semantic label. This can be cleaned up in a future refactor arc if the naming confusion causes real problems.

## DEC-098: Linear Progression Unlock Chain: allied → enemy → wedges → shards → null
- **Date**: 2026-03-02
- **Arc**: 29
- **Decision**: Session progression uses a simple sequential map: allied → enemy → wedges → shards → null. Completing any tier unlocks the next one. No branching.
- **Rationale**: Linear progression matches the learning intent — each tier is harder than the last (two-color → three-color). A simple map is easy to reason about, extend, and test. No product requirement exists for non-linear unlocking at this time.

## DEC-099: session.tier Telemetry Uses wedge/shard (Singular), Not guild_wedges
- **Date**: 2026-03-02
- **Arc**: 29
- **Decision**: The `session.tier` attribute on card spans emits `wedge` or `shard` (singular), matching the `tier` field values in combo data (`tier: 'wedge' | 'shard'`).
- **Alternatives rejected**: `guild_wedges` / `guild_shards` — inconsistent with the combo data model and misleading (wedges/shards are not guilds).
- **Rationale**: Telemetry attribute values should match the data model directly. `wedge` and `shard` are the canonical tier names in `combos.ts`. Using these values keeps the signal clean and queryable without translation.

---

## Arc 29: Three-Color Sessions — COMPLETE (v0.24.0)
- **Delivered**: 2026-03-02
- **Outcome**: Wedge and shard sessions now playable. `GuildSubgroup` type expanded. Progression chain extended. `card.tier = wedge/shard` confirmed in Honeycomb. 24/24 PASS.
- **Record**: `arc29-three-color-sessions.md`
- **Decisions**: DEC-097, DEC-098, DEC-099

---

## DEC-100: Triangle Wheel Uses SVG Polygon Elements (Not Lines)
- **Date**: 2026-03-02
- **Arc**: 30
- **Decision**: The wedge wheel uses SVG `<polygon>` elements to connect 3 pentagon nodes per wedge, forming a filled triangle shape.
- **Alternatives rejected**: Line-based approach (as used in guild wheels) — lines suggest pairwise relationships, not a three-way binding. Polygons visually communicate that all three colors belong together.
- **Rationale**: Visual distinction from guild line-based wheels is intentional. The polygon shape communicates the three-way nature of wedge combos more clearly and differentiates the section at a glance.

## DEC-101: Purple/Violet Color Theme for Wedge Triangles
- **Date**: 2026-03-02
- **Arc**: 30
- **Decision**: Wedge triangle polygons use a purple/violet color theme, distinct from allied (gold) and enemy (red-orange).
- **Rationale**: Each end screen section uses a distinct color language. Purple/violet is not used elsewhere in the UI and reads as "three-color magic" — appropriately distinct and recognizable.

## DEC-102: Reused end.guild_highlight Telemetry Span Name for Wedge Highlights
- **Date**: 2026-03-02
- **Arc**: 30
- **Decision**: Wedge combo highlights emit `end.guild_highlight` spans (the same span name used for allied and enemy highlights), with the wedge combo ID as `guild.id`.
- **Alternatives rejected**: A new span type `end.wedge_highlight` — would require updates to dashboards and queries without adding signal value.
- **Rationale**: The span structure is identical across all combo types. `guild.id` values for wedges (e.g., `mardu`, `temur`) are already distinct. No new span type is needed; filtering by `guild.id` distinguishes them.

## DEC-103: Wedge Section at Reel Index 2
- **Date**: 2026-03-02
- **Arc**: 30
- **Decision**: `SECTION_LABELS = ['allied', 'enemy', 'wedges', 'share']`. Wedge section is at reel index 2, between enemy and share.
- **Rationale**: Matches the natural progression order (two-color → three-color), and mirrors the session unlock chain (allied → enemy → wedges). Share remains last as it is always the final section.

---

## Arc 30: End Screen — Wedge Section — COMPLETE (v0.25.0)
- **Delivered**: 2026-03-02
- **Outcome**: Wedge section added to end screen reel at index 2. Triangle SVG polygon wheel with purple/violet theme. Cross-column deselect for all 3 columns. `end.guild_highlight` spans with wedge combo IDs confirmed in Honeycomb. 39/39 PASS.
- **Record**: `arc30-wedge-end-screen.md`
- **Decisions**: DEC-100, DEC-101, DEC-102, DEC-103

---

## DEC-104: Teal/Cyan Color Theme for Shard Triangles
- **Date**: 2026-03-02
- **Arc**: 31
- **Decision**: Shard triangle polygons use a teal/cyan color theme, distinct from allied (gold), enemy (red-orange), and wedges (purple/violet).
- **Rationale**: Each end screen section uses a distinct color language. Teal/cyan differentiates shards from wedges and the two-color sections. Shards and wedges are both three-color, so visual distinction is especially important to avoid confusion.

## DEC-105: Reuse Triangle Wheel Pattern from Arc 30 for Shards
- **Date**: 2026-03-02
- **Arc**: 31
- **Decision**: The shard wheel uses the same SVG polygon triangle approach as the wedge wheel (Arc 30), parameterized by color theme via CSS classes.
- **Alternatives rejected**: A distinct visualization shape for shards — the triangle polygon communicates the three-way color binding equally well for shards. Reuse reduces implementation complexity.
- **Rationale**: Pattern reuse is appropriate when the underlying data structure is identical. Shards and wedges are both five three-color combos mapped onto pentagon nodes. Only the color theme differs.

## DEC-106: end.layout_version Bumped to 'reel_v2' for 5-Section Layout
- **Date**: 2026-03-02
- **Arc**: 31
- **Decision**: `end.layout_version` bumped from `reel_v1` to `reel_v2` when the shard section is added, making the layout 5 sections: allied, enemy, wedges, shards, share.
- **Rationale**: The structural marker tracks the number and arrangement of end screen sections. Adding a fifth section changes the layout meaningfully enough to warrant a version bump, enabling Honeycomb queries to distinguish pre- and post-shard sessions.

---

## Arc 31: End Screen — Shard Section — COMPLETE (v0.26.0)
- **Delivered**: 2026-03-02
- **Outcome**: Shard section added to end screen reel at index 3. Triangle wheel reuses Arc 30 polygon pattern with teal/cyan theme. 4-column cross-deselect. `end.layout_version = 'reel_v2'`. `end.guild_highlight` spans with shard combo IDs confirmed in Honeycomb.
- **Record**: `arc31-record.md`
- **Decisions**: DEC-104, DEC-105, DEC-106

---

## DEC-107: Merge RFP and SOW into Single Plan Document
- **Date**: 2026-03-07
- **Decision**: The separate RFP (discovery) and SOW (arc planning) stages are replaced by a single "Plan" stage. One document with two sections — Discovery and Arcs — and one client approval gate.
- **Context**: After several engagements (multipage, end screen refinements, wedges & shards), the client observed that the RFP and SOW duplicated significant content: goals/objectives, assumptions, non-goals/exclusions, and arc candidates were restated between documents. Two approval gates slowed things down without adding clarity.
- **Alternatives Considered**: (1) Keep both but make the RFP lighter. Rejected — the overlap is structural, not just verbosity. (2) Keep both documents but combine the approval gate. Rejected — if they're approved together, they should be one document.
- **Rationale**: The unique value of the RFP was discovery (domain research, risk identification, architectural options). The unique value of the SOW was detailed arc definitions. These compose naturally into one document. Roles, definition of done, and other stable process elements stay in the process docs rather than being restated each time.
- **Impact**: Updated PROCESS.md, CLAUDE.md, ROLES.md, and all role JOB.md files. Prior RFP and SOW documents in librarian notes are historical records and remain unchanged.

---

## DEC-108: Upgrade/Downgrade Model for Three-Color Encounters
- **Date**: 2026-03-07
- **Decision**: Three-color encounters upgrade from existing two-color encounters when a matching third particle enters the bubble, and downgrade back to two-color when the third particle drifts away.
- **Context**: Need to detect when three mana symbols of a valid triple (wedge or shard) cluster together in the gas simulation.
- **Alternatives Considered**: Independent O(n^3) triple detection each frame. Rejected for performance reasons and because the upgrade model makes the progression visible to users — "Dimir + Green = Sultai" is more interesting than a triple appearing from nothing.
- **Rationale**: The upgrade model is both more efficient (only checks when a third particle enters an existing encounter) and more visually meaningful (users see the pair become a triple).

## DEC-109: Triple Name Replaces Guild Name (Not Shown Alongside)
- **Date**: 2026-03-07
- **Decision**: When a triple forms, the encounter label shows only the triple name (e.g., "Sultai"), replacing the guild name (e.g., "Dimir"). The two names are not shown simultaneously.
- **Context**: The encounter bubble has limited visual space. Showing both names would be cluttered and confusing.
- **Rationale**: The triple is the higher-order concept. Client confirmed this preference.

## DEC-110: Gold Visual Distinction for Triple Encounters
- **Date**: 2026-03-07
- **Decision**: Triple encounters use gold stroke (`rgba(255,215,0,0.4)`) and 22px bold gold text, distinct from white 18px text for two-color guild encounters.
- **Context**: Users need to visually distinguish three-color encounters from two-color encounters at a glance.
- **Alternatives Considered**: Different bubble shape, particle effects, animation. Gold color was chosen as visually distinct without being garish, and gold has a natural association with "higher tier" or "upgrade."
- **Rationale**: Clear visual hierarchy — white for guilds, gold for triples — communicates the upgrade without requiring the user to read the label.

## DEC-111: Telemetry via CustomEvent for Triple Encounters
- **Date**: 2026-03-07
- **Decision**: Triple encounter formation dispatches a `mana-gas-encounter` CustomEvent with `{ type: "triple", name, colors }`. No Honeycomb listener is wired yet.
- **Context**: mana-gas.js is standalone vanilla JS outside the esbuild bundle and cannot import the telemetry module. This is the same cross-boundary communication pattern established for drag events in Arc 32 (`mana-gas-drag`).
- **Rationale**: Consistent pattern. A future arc will wire the event listener in the bundled code to forward spans to Honeycomb.

## DEC-112: Trace-Participating Logs Over Span Events
- **Date**: 2026-03-08
- **Decision**: Replace `addSpanEvent()` calls with OTel log records emitted via `emitLog()`. Log records are sent immediately via SimpleLogRecordProcessor, not waiting for the parent span to end.
- **Context**: Span events only ship when the parent span ends. In a browser, the parent span may never end — tab close, navigation away, or long-lived page spans all cause span events to be lost silently. Four call sites were affected: `progression.subgroup_unlocked`, `session.pause`/`session.resume`, `user.tap`, and `end.wheel_event`.
- **Alternatives Considered**: (1) Force-ending parent spans more aggressively — adds complexity and changes trace structure. (2) Using `sendBeacon` — bypasses the OTel pipeline and loses trace correlation.
- **Rationale**: Log records participate in traces (carry trace_id and span_id) and appear in Honeycomb's trace waterfall identically to span events, but ship immediately. Best of both worlds: trace correlation + delivery reliability.

## DEC-113: Upgrade Honeycomb Web SDK to 1.x
- **Date**: 2026-03-08
- **Decision**: Upgrade `@honeycombio/opentelemetry-web` from `^0.10.0` to `^1.3.0`.
- **Context**: v0.10.0 had no LoggerProvider — `logs.getLogger()` returned a no-op logger, so log records were silently discarded. v1.x initializes the full logs pipeline automatically (LoggerProvider, SimpleLogRecordProcessor, OTLP HTTP log exporter).
- **Rationale**: This was the only way to get log records flowing without manually configuring the OTel Logs SDK. The 1.x line has been stable and available; the `^0.10.0` semver range simply never crossed the major version boundary.

## DEC-114: Explicit Context Passing for Trace Correlation
- **Date**: 2026-03-08
- **Decision**: `emitLog()` accepts an optional parent Span and uses `trace.setSpan(context.active(), span)` to set the active context before emitting the log record.
- **Context**: The OTel Logs API doesn't automatically inherit trace context from explicitly-managed spans. The app manages spans directly (not via the OTel context API's implicit propagation), so log records would otherwise have empty trace_id.
- **Rationale**: Same pattern used by `startChildSpan()`. Ensures log records appear in the correct trace waterfall without requiring a change to how the app manages span lifecycle.

## DEC-115: Keep addSpanEvent Available
- **Date**: 2026-03-08
- **Decision**: Retain the `addSpanEvent()` function definition in telemetry.ts even though no call sites remain.
- **Context**: All four call sites were converted to `emitLog()`. The function is still exported and usable.
- **Rationale**: Span events are still appropriate for events that are tightly coupled to a span's lifecycle and guaranteed to ship with it (e.g., error details on a span that will definitely end). Removing the function would require re-implementing it if such a case arises.

---

## DEC-116: Relative Home Link for GitHub Pages Compatibility
- **Date**: 2026-03-08
- **Arc**: 35 (Fix User-Facing Bugs)
- **Decision**: Change end screen home link from `href="/"` to `href="./"` so it works on GitHub Pages.
- **Context**: The site is hosted at `/<repo-name>/` on GitHub Pages. An absolute `/` link navigates to the GitHub Pages root, not the app root.
- **Rationale**: Relative `./` resolves correctly regardless of deployment path prefix.

## DEC-117: Reserve Image Space with Explicit Width/Height
- **Date**: 2026-03-08
- **Arc**: 35 (Fix User-Facing Bugs)
- **Decision**: Set `width=180 height=252` on Scryfall card images to prevent layout shift during loading.
- **Context**: MTG cards have a ~5:7 aspect ratio. Without explicit dimensions, the browser allocates zero space until the image loads, causing visible layout shift on slides.
- **Rationale**: HTML width/height attributes let the browser reserve the correct space before load, eliminating CLS with no CSS changes needed.

## DEC-118: Graceful Scryfall Image Fallback
- **Date**: 2026-03-08
- **Arc**: 35 (Fix User-Facing Bugs)
- **Decision**: On Scryfall image load failure, remove `card--with-image` class and hide the image column, falling back to pips-only layout.
- **Context**: Scryfall is a third-party service; image loads can fail due to network issues, rate limiting, or missing images.
- **Rationale**: Users should never see a broken image icon. The pips-only layout is the existing fallback and remains fully functional.

## DEC-119: Remove cardEnter Animation from Reel, Use Opacity-Only reelFadeIn
- **Date**: 2026-03-08
- **Arc**: 35 (Fix User-Facing Bugs)
- **Decision**: Remove the `cardEnter` CSS animation (which used `transform: scale()`) from `.level-sections-reel` and replace it with an opacity-only `reelFadeIn` on `.level-sections-viewport`.
- **Context**: The reel navigation uses `transform: translateY()` as a CSS transition to scroll between sections. The `cardEnter` animation also applied `transform` (scale 0.95→1) over 250ms. CSS animations take precedence over transitions on the same property, so the translateY transition never ran — the reel snapped instead of scrolling smoothly. This was the root cause of the Allied→Enemy flash bug. Multiple earlier approaches (synchronous positioning, opacity loading class, height-transition reveal) reduced the flash but did not eliminate it because the animation/transition conflict remained.
- **Alternatives considered**:
  - Synchronous reel positioning before first paint (commit 53ebe88) — reduced but didn't eliminate flash
  - Loading class with opacity reveal (commit 8423cff) — masked initial flash but scroll still snapped
  - Height-transition reveal (commit a6a2cd9) — complex and still flickered
- **Rationale**: The fix is CSS-only and addresses the root cause: `transform` must be reserved for navigation. Visual entrance effect moved to opacity, which doesn't conflict with transform transitions.

---

## DEC-120: Domain Name `mtgcolors.quest` Selected
- **Date**: 2026-03-08
- **Decision**: Domain name `mtgcolors.quest` selected for the project.
- **Context**: The project was previously hosted on GitHub Pages under a default URL. The client chose a custom domain. This resolves the open question in Arc 36's acceptance criteria where `<title>` updates were deferred until a domain name was chosen.
- **Rationale**: Client decision. The name is descriptive, memorable, and matches the app's purpose (learning MTG color combinations).
- **Impact**: Arc 36 (License, About Page, Site Identity, and Share) can now proceed with the final site title. The plan noted custom domain setup as a "separate concern" — the client is handling the DNS/GitHub Pages configuration themselves.

## DEC-121: Site Title "MTG Colors"
- **Date**: 2026-03-08
- **Decision**: All page titles updated from "MTG Color Combos" to "MTG Colors".
- **Context**: The client chose the domain `mtgcolors.quest` (DEC-120). The site title should match the domain identity.
- **Decided by**: Client
- **Rationale**: Consistent branding between domain and page title. Shorter, cleaner.

## DEC-122: About Page as Separate HTML Page
- **Date**: 2026-03-08
- **Decision**: About page implemented as a standalone HTML page (`about.html`) rather than a modal within the settings panel.
- **Context**: The project follows a multi-page architecture (DEC-053). An about page needs room for attributions (Scryfall, MTG Wiki, Wizards of the Coast) and license information.
- **Rationale**: Follows the established multi-page pattern. Gives attributions proper visibility rather than cramming them into a settings dropdown.

## DEC-123: SVG Favicon with WUBRG Pentagon
- **Date**: 2026-03-08
- **Decision**: Favicon is an SVG with five colored circles in WUBRG pentagon formation. No `og:image` meta tag yet — deferred until client provides one.
- **Context**: The site needed a favicon for browser tabs and bookmarks. SVG favicons are supported by modern browsers and scale cleanly.
- **Rationale**: The five mana colors in pentagon formation is the most recognizable MTG symbol that can be represented without copyrighted imagery. `og:image` deferred as a separate concern.

## DEC-124: Share via Copy Link with UTM Tracking
- **Date**: 2026-03-08
- **Decision**: Share functionality uses a "Copy link" button that constructs a URL with `utm_source=share` and `utm_id={session_id}`. No native share API, no social buttons.
- **Context**: The app needs a lightweight sharing mechanism. UTM parameters enable referral chain analysis in Honeycomb without requiring a backend.
- **Rationale**: Copy-to-clipboard is the simplest cross-platform sharing pattern. UTM parameters are a well-understood convention that works with any analytics tool. The session_id in utm_id enables tracing referral chains.

## DEC-125: UTM Parameters as OTel Resource Attributes
- **Date**: 2026-03-08
- **Decision**: `utm_source` and `utm_id` from the URL are captured as OTel resource attributes (`utm.source`, `utm.referral_session_id`), appearing on ALL spans for the session.
- **Context**: Resource attributes propagate to every span automatically, unlike span attributes which only appear on the span where they're set.
- **Rationale**: Referral context should be visible on every span in the session, enabling Honeycomb queries like "show me all sessions that came from a share link" without filtering to specific span names. Follows the pattern established for `app.page` and `app.navigation` (DEC-066).

---

## Arc 36 Completion Record
- **Date**: 2026-03-08
- **Arc**: Arc 36 — License, About Page, Site Identity, and Share
- **Status**: COMPLETE — 71/71 PASS
- **Decisions**: DEC-121 through DEC-125
- **Detailed record**: arc36-identity-share.md

---

## DEC-126: APP_VERSION Extracted to src/version.ts
- **Date**: 2026-03-08
- **Decision**: The `APP_VERSION` constant is defined in a single module (`src/version.ts`) and imported by all 5 entry points.
- **Context**: Previously each entry point (index, slides, assessment, end, about) declared its own `APP_VERSION` constant. This created duplication risk — a version bump required editing 5 files identically.
- **Rationale**: Single source of truth eliminates version drift between pages. The `service.version` resource attribute on OTel spans is only as trustworthy as the constant feeding it.

## DEC-127: Version Bumped to 0.27.0
- **Date**: 2026-03-08
- **Decision**: Version bumped from 0.20.0 to 0.27.0 in both `package.json` and `src/version.ts`.
- **Context**: The version had not been bumped since Arc 21 (v0.20.0), despite significant feature work through Arcs 22–37. The publish readiness plan called for an accurate version.
- **Rationale**: Reflects the true arc count and signals that cleanup has occurred. `service.version` resource attribute propagates to all spans and logs automatically.

## DEC-128: Five Prototype Pages Removed
- **Date**: 2026-03-08
- **Decision**: Removed prototype.html, color-wheel-test.html, mana-gas.html, slot-machine.html, and card-back-demo.html along with their CSS and TS assets.
- **Context**: These pages were development artifacts from early exploration. They would confuse visitors if discovered on the public site, and they reference outdated code paths.
- **Rationale**: Public-facing deployments should only contain production pages. Historical references in librarian notes are preserved as documentation of what existed and why it was removed.

---

## Arc 37 Completion Record
- **Date**: 2026-03-08
- **Arc**: Arc 37 — Clean Up Public-Facing Artifacts
- **Status**: COMPLETE — 49/49 PASS
- **Decisions**: DEC-126 through DEC-128
- **Detailed record**: arc37-cleanup.md

---

## DEC-129: CSS Media Query Approach for Mobile Welcome
- **Date**: 2026-03-08
- **Decision**: Use two HTML content blocks (`.welcome-desktop` and `.welcome-mobile`) with a CSS media query display toggle at 600px, rather than JavaScript-based detection.
- **Context**: The welcome page needed a mobile-friendly version with condensed content. Options considered: (1) CSS media query with dual HTML blocks, (2) JS-based viewport detection swapping content, (3) purely responsive CSS reshuffling existing content.
- **Rationale**: CSS-only approach keeps both versions in the HTML for SEO and no-JS fallback. No runtime detection needed. Simpler than trying to reflow the existing desktop content into a mobile-friendly layout with CSS alone.

## DEC-130: 600px Breakpoint for Mobile/Desktop Split
- **Date**: 2026-03-08
- **Decision**: 600px chosen as the breakpoint between mobile and desktop welcome content.
- **Context**: Common phone widths range from 375px (iPhone SE) to 428px (iPhone 14 Pro Max). Tablets start around 768px.
- **Rationale**: 600px covers all common phone widths while preserving the desktop layout on tablets. It is a standard responsive design breakpoint that avoids edge cases.

---

## Arc 38 Completion Record
- **Date**: 2026-03-08
- **Arc**: Arc 38 — Mobile Welcome & Responsiveness
- **Status**: COMPLETE — 20/20 PASS
- **Decisions**: DEC-129, DEC-130
- **Detailed record**: arc38-mobile-welcome.md

---

## DEC-131: Deploy Markers via Honeycomb Markers API to `__all__` Datasets
- **Date**: 2026-03-08
- **Arc**: 39 (Deploy Markers)
- **Decision**: Deploy markers are sent to Honeycomb's `__all__` datasets endpoint rather than a specific dataset.
- **Context**: Honeycomb markers can target a specific dataset or `__all__`. The project has telemetry across the default dataset; operators may view different datasets when debugging.
- **Alternatives considered**: Per-dataset markers — would require maintaining a dataset list and updating it if new datasets are added. `__all__` covers everything.
- **Rationale**: Posting to `__all__` ensures the marker appears on every query timeline regardless of which dataset the operator is viewing. Zero maintenance overhead when datasets change.

## DEC-132: Marker as Post-Deploy Step in GitHub Actions
- **Date**: 2026-03-08
- **Arc**: 39 (Deploy Markers)
- **Decision**: The deploy marker is sent as a step within the existing deploy job in `.github/workflows/deploy.yml`, not as a separate workflow.
- **Alternatives considered**: (1) Separate workflow triggered by deploy completion — adds complexity and a second workflow file. (2) GitHub Action marketplace action — adds a third-party dependency for a single curl call.
- **Rationale**: Simpler. The step only runs after a successful deploy (it follows the deploy step in the same job). It shares the job's git context, so it can derive the commit SHA directly. No additional workflow orchestration needed.

## DEC-133: Local Deploy Marker Script
- **Date**: 2026-03-08
- **Arc**: 39 (Deploy Markers)
- **Decision**: A standalone `scripts/deploy-marker.sh` script is provided for manual marker creation.
- **Context**: Operators may want to create markers outside of CI — for example, when testing locally or when a deploy happens through a non-standard path.
- **Rationale**: Follows the project convention of scripts in `scripts/` directory (DEC-028). Derives SHA and repo URL from git so it works without configuration beyond the API key.

---

## Arc 39 Completion Record
- **Date**: 2026-03-08
- **Arc**: Arc 39 — Deploy Markers
- **Status**: COMPLETE — Structural verification
- **Decisions**: DEC-131, DEC-132, DEC-133
- **Detailed record**: arc39-deploy-markers.md

---

## Publish Readiness Plan — COMPLETE
- **Date**: 2026-03-08
- **Plan document**: plan-publish-readiness.md
- **Status**: All 5 arcs delivered
- **Arcs**:
  - Arc 35: Fix User-Facing Bugs (home link, layout shift, Scryfall fallback, reel animation) — DEC-116 through DEC-119
  - Arc 36: License, About Page, Site Identity, and Share — 71/71 PASS — DEC-120 through DEC-125
  - Arc 37: Clean Up Public-Facing Artifacts — 49/49 PASS — DEC-126 through DEC-128
  - Arc 38: Mobile Welcome & Responsiveness — 20/20 PASS — DEC-129, DEC-130
  - Arc 39: Deploy Markers — Structural verification — DEC-131 through DEC-133
- **Outcome**: MTG Sparrow is publish-ready. Known bugs fixed, legal foundations in place, prototype artifacts removed, mobile welcome works, deploy markers configured. Version 0.27.0. Client action needed: add `HONEYCOMB_API_KEY` secret to GitHub repo settings for deploy markers to function.

---

## DEC-134: Logo Design — Archimedean Spiral over WUBRG Conic Gradient
- **Date**: 2026-03-08
- **Decision**: The MTG Colors logo uses an Archimedean spiral shape masked over a conic gradient of the five mana colors, with mana symbol silhouettes arranged in a pentagon and "mtgcolors.quest" text in Orbitron font. Prototyped in `logo-prototype.html`.
- **Context**: The site needed a visual identity beyond the favicon. The spiral form echoes the color wheel concept central to the app while the conic gradient naturally blends the five mana colors.
- **Rationale**: The spiral is distinctive, avoids direct reproduction of Wizards of the Coast IP, and works at multiple sizes. Orbitron font matches the tech-meets-fantasy aesthetic.

## DEC-135: Symbol-Only SVG Mana Silhouettes for Logo
- **Date**: 2026-03-08
- **Decision**: New SVG assets created at `images/logo/{W,U,B,R,G}.svg` — mana symbol silhouettes without colored background circles.
- **Context**: The logo needed mana symbols that work as transparent overlays on the gradient, not the standard colored-circle mana pips used elsewhere in the app.
- **Rationale**: Silhouettes integrate cleanly with the spiral mask effect and remain legible at small sizes. Separate from the existing mana symbol assets to avoid coupling logo needs with card display needs.

## DEC-136: Reusable renderLogo() Module
- **Date**: 2026-03-08
- **Decision**: Logo rendering extracted into `src/ui/logo.ts` as a reusable `renderLogo()` function, integrated into the about page.
- **Context**: The logo prototype was a standalone HTML page. Extracting the rendering logic into a module makes it available to any page that needs it.
- **Rationale**: Follows the project pattern of keeping rendering logic in `src/ui/` modules. The about page is the natural first integration point. Additional pages can import the same module.

## DEC-137: Logo Physical Artifact — Mirror-Finish Glitter Sticker
- **Date**: 2026-03-08
- **Decision**: Client ordered the logo as a mirror-finish glitter sticker, validating the design for physical media use.
- **Context**: A logo that works as a physical sticker demonstrates sufficient contrast and recognizability at small scale.
- **Rationale**: Recorded as a milestone — the logo design is confirmed satisfactory by the client for both digital and physical contexts.

## DEC-138: Scope End Screen Wheel Listener to Viewport
- **Date**: 2026-03-08
- **Decision**: Changed the end screen `wheel` event listener from `document` to the `.level-sections-viewport` element.
- **Context**: The reel navigation captured all wheel events on the entire document via `e.preventDefault()`. At higher browser zoom levels (e.g. 150%), content extended below the fold but users could not scroll to reach it. The scroll hijacking cost exceeded its benefit.
- **Rationale**: Scoping to the viewport element preserves reel navigation when scrolling over the info section while restoring normal page scrolling everywhere else. Minimal change, maximum accessibility improvement.

## DEC-139: Email Signup Uses ConvertKit Inline Embed
- **Date**: 2026-03-09
- **Decision**: Email signup on the About page uses a ConvertKit inline form embed (data-uid="df1fad2ec7"), not a custom form. ConvertKit handles all email infrastructure.
- **Context**: Client wanted a way for engaged readers to follow future updates. A hosted embed avoids building and maintaining email infrastructure.
- **Rationale**: ConvertKit handles GDPR compliance, deliverability, and subscriber management. The embed is a single script tag — minimal code surface, no server-side work required.

## DEC-140: Signup Section Placed Above Acknowledgments
- **Date**: 2026-03-09
- **Decision**: The "Pause on my Upkeep" signup section is placed after the intro paragraph and before Acknowledgments — highest visibility position for engaged readers.
- **Context**: Multiple placement options were considered. Client chose above Acknowledgments to maximize visibility while still letting the intro paragraph establish context.
- **Rationale**: Readers who scroll past the intro are already engaged; the signup form catches them at peak interest before they reach the credits section.

## DEC-141: Section Heading "Pause on my Upkeep"
- **Date**: 2026-03-09
- **Decision**: The email signup section is titled "Pause on my Upkeep" — an MTG-themed heading referencing the upkeep phase.
- **Context**: Several options were brainstormed. Client chose this one for its MTG flavor and the double meaning (pause = the upkeep phase trigger; also "pause and follow along").
- **Rationale**: Consistent with the app's MTG-native voice. Memorable and distinctive compared to generic "Subscribe" or "Newsletter" headings.

## DEC-142: Telemetry Tracks Form Presence and Click Engagement, Not Submission
- **Date**: 2026-03-09
- **Decision**: `about.has_signup_form` boolean attribute records form presence on page load; `about.signup_interact` child span fires on click in the form container. Submission is not tracked.
- **Context**: ConvertKit handles the form submit internally via its own JS. There is no reliable hook to intercept submission from outside the embed.
- **Rationale**: Click engagement is a meaningful signal (intent to interact) and is technically accessible. Submission tracking would require ConvertKit webhook integration — disproportionate effort for this arc.

## DEC-143: Feedback Goes to Honeycomb as Telemetry, Not External Service
- **Date**: 2026-03-10
- **Decision**: User feedback is captured as a `feedback.submit` span in Honeycomb (`sparrow-deck` dataset), not routed to an external service (Google Forms, Typeform, etc.).
- **Context**: The app needed a way to collect user feedback before wider publishing. Options considered: external form services, email mailto link, custom backend, Honeycomb telemetry.
- **Alternatives rejected**: External form services break the in-app experience and lose session correlation. A custom backend is disproportionate effort. A mailto link is friction-heavy.
- **Rationale**: Honeycomb is already instrumented. Sending feedback as a span gives automatic session correlation, queryability with existing tools, and zero additional infrastructure. The client can query "What are users saying?" alongside "What did they do just before submitting?"

## DEC-144: Context Provider Pattern for Per-Page Feedback Enrichment
- **Date**: 2026-03-10
- **Decision**: Each page registers a context provider function (`registerFeedbackContext(fn)`) that returns page-specific attributes. The provider is called lazily at submit time so it captures current state.
- **Context**: Feedback submitted from the slides page should include which card was showing; from the end page, which section was active; from assessment, which subgroup was in progress. This information is only meaningful at the moment of submission.
- **Alternatives rejected**: Passing attributes at registration time would capture state at page load, not at submission. A global state object would create tight coupling between pages and the feedback module.
- **Rationale**: The lazy provider pattern decouples the feedback module from page internals. Each page owns its own context definition. Attributes captured include: `feedback.unlocked_levels` (all pages), plus slide/end/assessment-specific state.

## DEC-145: Dialog-Open/Close Custom Events for Slideshow Pause Coordination
- **Date**: 2026-03-10
- **Decision**: Opening any dialog (settings menu or feedback modal) dispatches a `dialog-open` custom event; closing dispatches `dialog-close`. The slides page listens and pauses/resumes the slideshow using a counter (`dialogOpenCount`) and a `pausedByDialog` flag that preserves user's manual pause state.
- **Context**: The feedback modal is a second overlay that can open while the slideshow is running. The slideshow needs to pause so users can write feedback without the cards advancing. Coordination is needed across the settings panel and feedback modal.
- **Alternatives rejected**: Having the feedback module directly call slideshow APIs would create direct coupling across unrelated modules. A shared mutable pause flag would be fragile when multiple dialogs overlap.
- **Rationale**: Custom events decouple the modules. The counter approach (not boolean) correctly handles the edge case of transitioning from settings to feedback without an intervening resume. The `pausedByDialog` flag prevents auto-resuming a slideshow that the user had manually paused.

## DEC-146: Spacebar Handler Checks e.target.tagName to Skip TEXTAREA/INPUT
- **Date**: 2026-03-10
- **Decision**: The slides page spacebar handler checks `e.target.tagName` and skips TEXTAREA and INPUT elements, so typing a space in the feedback textarea does not advance the slides.
- **Context**: The slides page intercepts the spacebar key to pause/resume the slideshow. After adding the feedback modal (which contains a textarea), pressing space in the textarea was triggering slideshow navigation instead of inserting a character.
- **Alternatives rejected**: Stopping propagation from the modal — fragile and would need maintenance every time a new focusable element was added. Checking `e.defaultPrevented` — not reliable across all browsers.
- **Rationale**: Checking `e.target.tagName` is explicit, reliable, and minimal. It directly expresses the intent: "don't intercept keyboard events when the user is typing in a form field."

## DEC-147: Silent Failure Is Never Graceful
- **Date**: 2026-03-12
- **Decision**: Functions that can fail must make failure visible. A resolved promise must mean success. Silent fallbacks that return success on failure are bugs, not graceful degradation.
- **Context**: `flushSpans()` had two silent failure modes: (1) if `forceFlush` didn't exist on the provider, it logged nothing and returned `Promise.resolve()`; (2) if `forceFlush` threw, `.catch()` swallowed the error and also returned `Promise.resolve()`. Both paths were indistinguishable from success to the caller. During debug mode implementation, a `debug.mode_changed` span was recorded and the page reloaded after flush — but the span never appeared in Honeycomb. We spent multiple iterations debugging the wrong layers (initialization order, async/await timing) before the client added `console.warn` to `flushSpans()` and discovered the provider didn't support `forceFlush` at all. The code had been silently pretending to flush the whole time.
- **Lesson**: When a function returns a promise, callers trust the contract: resolved means done, rejected means failed. Swallowing errors and returning resolved violates that contract. `console.warn` is not an error signal — callers cannot react to it. If a function cannot do what it promises, it must reject or throw. Silent fallbacks that mask failure are not graceful — they are deceptive, and they cost debugging time in all the wrong places.

## DEC-148: Debug Mode Toggle via URL Parameter
- **Date**: 2026-03-12
- **Decision**: Debug mode stored in localStorage (`mtg-sparrow.debug`). Toggled via `?debug=on` or `?debug=off` URL parameter on any page. The "Current trace" link in the menu is only visible when debug mode is active.
- **Context**: The trace link is useful for development but confusing for end users. Debug mode gates developer-facing UI.
- **Alternatives rejected**: Hidden key combo or devtools flag considered, but URL params are shareable and easy to use without opening devtools.

## DEC-149: Debug Mode Page Reload on Toggle
- **Date**: 2026-03-12
- **Decision**: When `?debug=on` or `?debug=off` is detected, the page updates localStorage, emits a `debug.mode_changed` span, shows a modal, then reloads via `location.replace()` with the param stripped. The reload ensures the `app.debug` resource attribute is correct from the start of the new page session.
- **Context**: Resource attributes are set once at `initTelemetry()` time. Rather than have a stale `app.debug` value on the pre-toggle trace, we reload so every span on the new page has the correct value.

## DEC-150: Debug Activation Modal as Flush Window
- **Date**: 2026-03-12
- **Decision**: A full-screen modal with animation ("debug ACTIVATED" / "debug DEACTIVATED") displays for 3 seconds before reload. This serves dual purpose: user feedback and time for the telemetry XHR to complete.
- **Context**: The OTel SDK uses XHR (not sendBeacon) because Honeycomb requires auth headers that sendBeacon can't carry. XHR requests are aborted on page navigation. The modal delay keeps the page alive long enough for the flush to succeed.

## DEC-151: app.debug Resource Attribute on All Spans
- **Date**: 2026-03-12
- **Decision**: `app.debug` is set as a resource attribute in `initTelemetry()`, so it appears on every span and log. Value is the string "true" or "false" read from localStorage at init time.
- **Context**: Allows filtering debug traffic in Honeycomb queries. Being a resource attribute means it's automatic — no per-span work needed.

## DEC-152: Archimedean Spiral for Scroll Animation
- **Date**: 2026-03-14
- **Decision**: Use an Archimedean spiral (same as the app logo) for the scroll unroll prototype. Drawn counterclockwise, it rolls clockwise (down the wall).
- **Context**: Cylinder/scroll prototype exploring unroll animation geometry.
- **Alternatives**: Logarithmic spiral.
- **Rationale**: Consistent with existing logo; constant spacing makes coil diameter predictable.

## DEC-153: Constant Angular Velocity Animation
- **Date**: 2026-03-14
- **Decision**: Animate by interpolating theta linearly (constant angular velocity) rather than by constant arc-length velocity.
- **Context**: Paper unrolls faster when the coil is large, slower when small — which is what this model produces.
- **Alternatives**: Linear arc-length interpolation.
- **Rationale**: Physically accurate — a real scroll turning at constant speed produces this behavior. Also makes coil height change linearly.

## DEC-154: Ease-In-Out on Angular Velocity
- **Date**: 2026-03-14
- **Decision**: CSS ease-in-out applied on top of the constant angular velocity model for smooth start/stop. Angular velocity ramps up, cruises, ramps down.
- **Context**: Pure constant angular velocity produces an abrupt start and stop.
- **Alternatives**: Easing on arc-length directly.
- **Rationale**: Layering easing on the physical model preserves the natural feel while smoothing the edges.

## DEC-155: CSS Projection with Divs
- **Date**: 2026-03-14
- **Decision**: Side projection rendered as CSS divs, not SVG. Paper strip is a content-ready div; coil is a div with cylinder gradient (no border-radius).
- **Context**: Prototype explores how the scroll animation will translate to real content delivery.
- **Alternatives**: SVG for both views.
- **Rationale**: Paper strip will eventually hold real content; CSS transitions are the target delivery mechanism.

## DEC-156: Pure Computation Extraction
- **Date**: 2026-03-14
- **Decision**: Spiral geometry extracted to `cylinder-projection.js` with no DOM dependencies. Functions: `computeScaffold()`, `computeProjection()`, `thetaToArcLength()`.
- **Context**: Prototype logic needed to be testable and analysable outside the browser.
- **Rationale**: Enables Node-based testing and analysis without a DOM environment.

## DEC-157: Cubic Bezier Approximation for CSS Transitions
- **Date**: 2026-03-14
- **Decision**: Fit cubic-bezier() timing functions to replace per-frame JS computation. Bezier params depend on the ratio `stopRemaining/spiralLength`, not individual parameter values. Lookup table with 12 ratio points, linear interpolation. Max error ~0.6% normalized.
- **Context**: Goal is pure CSS transitions with no animation JS at runtime.
- **Alternatives**: Per-frame JS computation.
- **Rationale**: Enables pure CSS transitions; fitting on ratio rather than raw values makes the table compact and general.

## DEC-158: Bezier Params Stable Across Stroke/Gap Variations
- **Date**: 2026-03-14
- **Decision**: Use a single bezier lookup table (built at strokeWidth=6, turnGap=6) for all stroke/gap combinations. No multi-dimensional lookup needed.
- **Context**: Tested bezier table across various stroke/gap combos. Max error ~12px only at extreme values (12/16); typical error under 8px.
- **Rationale**: Single table is sufficient; the added complexity of a multi-dimensional lookup is not justified by the error margin.

## DEC-159: cylinder-transition.js Module API
- **Date**: 2026-03-14
- **Decision**: `cylinder-transition.js` exposes `computeTransition({ spiralLength, stopRemaining })` returning start/end CSS values plus cubic-bezier strings for `paperStripHeight`, `coilRectTop`, and `coilRectHeight`. Uses real spiral computation for endpoints, interpolated beziers for timing.
- **Context**: Encapsulates the full transition calculation so callers need no knowledge of spiral geometry.
- **Rationale**: Clean separation — callers provide scroll position context, module returns ready-to-apply CSS transition values.

## DEC-160: Welcome Page CTA Unified to "BEGIN"
- **Date**: 2026-03-14
- **Decision**: The first call-to-action button on the welcome/main page is now labeled "BEGIN" on all screen sizes.
- **Context**: Previously, the button read "Learn guild names" on desktop and "Start" on mobile — two different labels for the same action.
- **Rationale**: A single bold word is clearer and more inviting. Unified labeling removes the inconsistency between responsive breakpoints.

## DEC-161: Cinematic Title Card — No Chrome
- **Date**: 2026-03-25
- **Decision**: Level intro uses a cinematic title card approach: content floats on the background with no card borders, no card chrome, no scroll container.
- **Context**: Previous Arcs 42-43 used a scroll metaphor with a persistent docked reference, which was reverted because the approach didn't work. Arc 44 delivers only the upfront preview (the valuable part identified by Llewellyn Falco's advice).
- **Alternatives**: Reviving the scroll metaphor; a bordered card frame.
- **Rationale**: Simpler approach. The cinematic float creates presence without UI complexity. The persistent reference is cut — it was the part that didn't work.

## DEC-162: GoudyMediaeval Font for Name Priming
- **Date**: 2026-03-25
- **Decision**: Combo names on the level intro slide are rendered in GoudyMediaeval bold — the same font used for card answer names during the quiz.
- **Context**: The goal of the intro is to prime visual recognition before the quiz starts.
- **Alternatives**: A different display font; plain sans-serif.
- **Rationale**: Using the same font as the answer cards builds an immediate visual association. Learners see the name in the intro, then recognize the same letterforms when the card is revealed.

## DEC-163: --combo-name-size CSS Variable as Single Source of Truth
- **Date**: 2026-03-25
- **Decision**: `--combo-name-size` CSS custom property extracted as the single source of truth for combo name font size, shared between level intro names and card answer names. Mobile override via `:root` reassignment at 600px.
- **Context**: Both the intro slide and the card answers render combo names. Previously these could drift independently.
- **Rationale**: One variable prevents size divergence between intro and quiz. Mobile override at the root level propagates to both consumers automatically.

## DEC-164: Intro Telemetry as Session Span Attributes
- **Date**: 2026-03-25
- **Decision**: Level intro telemetry (`session.has_level_intro = true`, `session.intro_dwell_ms`) recorded as attributes on the existing session span rather than as a separate child span.
- **Context**: The intro is a fixed preamble before the quiz, not a variable user event.
- **Alternatives**: Separate `intro.view` child span; log event.
- **Rationale**: The intro is a fixed preamble to every session, not a variable event worth its own span. Session attributes keep the trace clean and allow filtering sessions by intro presence without adding span count.

## DEC-165: buildSequence Operates on Pure Numbers
- **Date**: 2026-03-25
- **Decision**: `buildSequence(cardCounts: number[], length: number): SlideSelection[]` operates entirely on indices (combo index, card index) — no domain types, no Slide objects, no guild names.
- **Context**: Spaced repetition heuristics need to control the ordering of slides. Decoupling the ordering logic from domain types allows it to be tested independently of card data.
- **Alternatives**: Pass Slide objects directly; pass ComboCard pairs.
- **Rationale**: A pure-numbers function can be exercised in isolation with abstract test data (e.g., the sequence harness with letter labels). The mapping from indices to actual Slide objects is a separate, testable step in `buildDeck`.

## DEC-166: Sequence Harness Uses Abstract Letter Labels
- **Date**: 2026-03-25
- **Decision**: The sequence harness (`sequence-harness.html`) displays combos as A-E and cards as F-Z — abstract letter labels with no domain knowledge (no guild names, no MTG terminology).
- **Context**: The harness is a visual tool for inspecting sequence aesthetics: are combos well-distributed? Do cards repeat too soon? These questions are domain-agnostic.
- **Rationale**: Keeping the harness domain-agnostic means it can be used to evaluate any sequence ordering strategy without coupling to MTG content. It tests the shape of a sequence, not its meaning.

## DEC-167: Sequence Harness is Production-Accessible
- **Date**: 2026-03-25
- **Decision**: The sequence harness is added to the deploy workflow and built by default — it's accessible in production at `/sequence-harness.html`, not a dev-only tool.
- **Context**: The harness has no sensitive functionality. Making it production-accessible means it's always available for quick visual inspection without a local build.
- **Alternatives**: Dev-only page excluded from deploy; hidden behind a flag.
- **Rationale**: No harm in public accessibility; convenience of always-on availability outweighs any concern. The harness is a pure visualization tool.

## DEC-168: SlideSelection is a [comboIndex, cardIndex] Tuple, Both 1-Indexed
- **Date**: 2026-03-25
- **Decision**: `SlideSelection` is defined as `[number, number]` where the first element is the combo index (1-indexed) and the second is the card index within that combo (1-indexed).
- **Context**: `buildSequence` needs a compact representation of a card position in the deck. A tuple is simpler than a named object for a pure-numbers layer.
- **Rationale**: 1-indexed to match natural human counting in the harness display. Both elements are bounded (1..comboCount, 1..cardsPerCombo), making validation straightforward.

---

## DEC-169: buildSequence Gains a Familiarity Parameter
- **Date**: 2026-03-25
- **Arc**: 46
- **Decision**: `buildSequence` accepts a second parameter `familiarity: "new" | "familiar"` that selects the sequencing strategy. The function remains domain-agnostic — pure numbers, no guild types.
- **Context**: Arc 46. Two learner profiles exist: someone encountering the combo names for the first time ("new"), and someone who has seen them before ("familiar"). The right sequencing strategy differs between them.
- **Rationale**: A single parameter cleanly selects strategy at the call site. Keeping the function domain-agnostic preserves its testability and the architectural boundary established in DEC-165.

## DEC-170: "familiar" Strategy Adds Minimum-Gap Constraint
- **Date**: 2026-03-25
- **Arc**: 46
- **Decision**: The "familiar" strategy is the existing shuffle-and-repeat approach, augmented with a minimum-gap constraint of 2 positions. The same combo cannot appear within 2 positions of a previous occurrence — prevents the same combo appearing back-to-back at batch boundaries.
- **Context**: The existing shuffle-based approach is good for distributed interleaving but can produce accidental clustering at batch seams. A minimum-gap of 2 eliminates the most jarring repeats without overly constraining distribution.
- **Rationale**: Low-overhead fix to a known aesthetic problem with the shuffle-and-repeat pattern. Gap of 2 is the minimum meaningful constraint (prevents direct adjacency).

## DEC-171: "new" Strategy Uses Gradual Introduction
- **Date**: 2026-03-25
- **Arc**: 46
- **Decision**: The "new" strategy starts with 2 combos in the active pool and adds one more combo every ~6-8 total appearances. The `length` parameter becomes a minimum — the sequence may be longer than requested to ensure all combos are introduced and each gets at least one full round.
- **Context**: Direct advice from Llewellyn Falco (Sparrow Deck creator) for learning unfamiliar arbitrary proper nouns. Starting with fewer items reduces the cognitive load of tracking category names that have no semantic anchor.
- **Alternatives rejected**: Full interleaving from the start (standard spaced repetition default — see DEC-172).
- **Rationale**: When category names are unfamiliar arbitrary proper nouns (higher cognitive load than visual discrimination), gradual introduction reduces overwhelm and allows each name to stabilize before new ones are added. Falco's direct experience with the technique supports this.

## DEC-172: Research Basis — Familiarity Level Selects Strategy
- **Date**: 2026-03-25
- **Arc**: 46
- **Decision**: Use familiarity level to select sequencing strategy: "new" learners get gradual introduction; "familiar" learners get full interleaved shuffle.
- **Context**: Spaced repetition research (Kornell & Bjork 2008, ARTS studies) generally favors all-at-once interleaving for discrimination tasks — seeing all categories from the start produces better learning outcomes. However, Falco's direct experience with the Sparrow Deck technique indicates gradual introduction helps when category names are unfamiliar arbitrary proper nouns (higher cognitive load than pure visual discrimination). The research and the practitioner advice are not contradictory — they apply to different learner states.
- **Rationale**: Resolution by familiarity level. Returning learners ("familiar") already know the names and benefit from full interleaving. First-time learners ("new") face the additional challenge of arbitrary proper noun acquisition and benefit from gradual introduction. The `familiarity` parameter makes this explicit at the call site.

## DEC-173: Click-vs-Timer-Advance as Future Confidence Signal
- **Date**: 2026-03-25
- **Arc**: 46
- **Decision**: Click-vs-timer-advance (whether the user tapped early or let the timer run) is noted as a potential implicit confidence signal for within-session adaptive requeue. Not implemented in Arc 46.
- **Context**: During Arc 46 planning, the team observed that early taps indicate higher confidence and timer advances may indicate lower confidence. This could inform adaptive spacing within a session.
- **Rationale**: Noted for a future arc. Arc 46 scope is limited to the two fixed strategies (new/familiar). Adaptive requeue based on confidence signals is a meaningful enhancement that requires its own plan.

---

## DEC-174: REPS_BEFORE_NEXT Cadence — Triggered by New Combo Appearance Count
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: Introduction of the next combo is gated on the most-recently-introduced combo having appeared at least N times (REPS_BEFORE_NEXT, currently 3), not on total slides elapsed.
- **Context**: An earlier approach counted total slides elapsed since the last introduction. The client identified this as wrong — the cadence should be about learning the new arrival, not how much total content has passed.
- **Rationale**: Tracking appearances of the newest combo directly measures the exposure needed for it to stick. Total elapsed slides could vary widely based on pool size, causing the new combo to be underrepresented or overrepresented.

## DEC-175: MIN_GAP = 0 for Pool of 2, MIN_GAP = 1 for Pool >= 3
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: With only 2 combos in the pool, MIN_GAP is 0 (immediate repeats allowed). Once 3+ combos are in the pool, MIN_GAP = 1 (same combo cannot appear back-to-back).
- **Context**: The client observed that with pool=3 and min-gap=2, the shuffle was fully deterministic — only CBA or CAB patterns could repeat. This eliminated meaningful randomness. Reducing to min-gap=1 restored it. With only 2 combos (A and B), enforcing any gap is unnecessarily constraining since alternating is the only non-repeat option anyway.
- **Rationale**: Minimum gap should prevent boring/obvious repetition without making the sequence deterministic. Pool size determines what "non-deterministic" means.

## DEC-176: Generate-Then-Trim Approach for Section Construction
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: Each introduction section is generated with extra batches, then trimmed at the exact point where the target combo(s) reach REPS_BEFORE_NEXT appearances. Item-by-item generation with mid-batch pool expansion was not used.
- **Context**: The client suggested this directly: "It's OK to change the sequence after it's generated." Generate-then-trim is simpler to reason about than tracking mid-batch state.
- **Rationale**: Generating surplus then trimming is a clean functional approach — produce more than needed, cut precisely. Mid-batch expansion would require stateful generation logic that's harder to test and reason about.

## DEC-177: First Section Requires Both Starting Combos to Reach REPS_BEFORE_NEXT
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: The first section introduces two combos simultaneously (A and B). Both must reach REPS_BEFORE_NEXT appearances before the section ends and the third combo (C) is introduced. Neither is shortchanged.
- **Context**: The first section is special — it has two target combos rather than one. The question was whether to gate on the first or both reaching N reps.
- **Rationale**: Both combos are new in the first section. Gating on both ensures equal treatment and prevents one combo from being underexposed relative to the other before more content is added.

## DEC-178: MAX_SECTION_LENGTH = 9 with Thinning
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: After trimming at REPS_BEFORE_NEXT, if a section exceeds 9 slides, non-target items are removed from the longest runs of consecutive non-target items (removing from the middle of each run) until the section is <= 9.
- **Context**: With larger pool sizes, sections can grow long with many non-target filler items between target appearances.
- **Rationale**: Long sections with many filler items dilute focus on the new combo being introduced. Thinning by removing from the middle of the longest non-target runs preserves variety (keeps items near the edges of runs) while reducing total length. Target items are never removed.

## DEC-179: No Consecutive Same-Card for Same Combo (dedupConsecutiveCards)
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: A post-processing pass (dedupConsecutiveCards) ensures that when a combo appears twice in the sequence, it does not show the same card image both times in a row. If a repeat would occur, a different card index is substituted. Applies across section boundaries. Applies to BOTH familiar and new strategies.
- **Context**: With small card sets per combo and low min-gap values, the same card image could appear twice consecutively for the same combo, which would look like a stuck deck rather than purposeful repetition.
- **Rationale**: Visual variety within repetition is important for the perceptual learning effect. Showing the same image twice in a row undermines the sense of seeing the name from different angles. This is a pure quality-of-experience improvement.

## DEC-180: Section Boundaries Exported via buildSequenceWithSections
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: The API returns `SequenceSection[]` alongside the flat sequence. Each section records its `introducedCombo` (or null for the fill phase). The flat sequence remains the primary consumer interface; sections are supplementary metadata.
- **Context**: During implementation, section structure was an internal detail. The client noted it might be useful later for progress bar display — "getting cute with the progress bar."
- **Rationale**: Exporting the section boundaries costs nothing and creates a seam for future UI enhancements. The flat sequence API remains unchanged for current consumers.

## DEC-181: Property-Based Testing for Sequence Generation (800 Tests)
- **Date**: 2026-03-26
- **Arc**: 46
- **Decision**: 800 property tests (50 trials × 16 properties) verify both strategies. Tests use exported constants (REPS_BEFORE_NEXT, MAX_SECTION_LENGTH) so they auto-adjust when tuning constants. Run via `npm run test:sequence`.
- **Context**: Sequence generation involves randomness, making example-based tests insufficient — a specific example might pass by luck. Properties that must hold across all random trials are more meaningful.
- **Rationale**: Property-based testing is appropriate for randomized algorithms. Key properties: no immediate repeats, exact/minimum length, all combos appear, valid card indices, no consecutive same-card, ordered introduction, segment trimming, max section length, thinning preserves targets, first section dual-combo coverage.

---

## DEC-182: Full-Deck Gradient Precomputed at Session Start
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: The mana color gradient for the progress bar is precomputed once when the session starts and set directly on the track element's background. It does not change as cards advance.
- **Alternatives rejected**: Recomputing the gradient on each advance — would cause band positions to shift as the "revealed" portion changed, creating a wiggle effect as the gradient rescaled.
- **Rationale**: Precomputing the full-deck gradient means the color bands represent fixed positions in the session timeline. The cover-reveal approach then uncovers them progressively without any gradient recalculation.

## DEC-183: Cover-Reveal Approach Over Growing Fill
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: Progress is revealed by shrinking a cover element (`.progress-bar-cover`) that sits on top of the gradient track, rather than growing a fill element from the left.
- **Alternatives rejected**: Growing fill — requires the gradient to rescale as the fill width changes, which shifts color stop positions and creates visual wiggle at the leading edge.
- **Rationale**: With a fixed-width gradient on the track and an opaque cover that shrinks from the right, the revealed colors are always correct because they reflect the pre-rendered full-deck positions. No gradient recalculation needed.

## DEC-184: Cover Background Matches Page (var(--bg-brown-dark))
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: The `.progress-bar-cover` uses `var(--bg-brown-dark)` as its background color so it is visually opaque and blends with the page behind the progress bar.
- **Alternatives rejected**: Transparent cover — would show the full gradient underneath immediately. Semi-transparent cover — would create a ghost of future colors, undermining the reveal metaphor.
- **Rationale**: Opaque cover is the simplest correct implementation of the cover-reveal approach. The color must match the page background exactly.

## DEC-185: Color Stops at Band Midpoints for Smooth Blending
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: Each color stop in the CSS gradient is positioned at the midpoint of its band (not at the start or end), so color transitions blend smoothly between adjacent mana colors.
- **Alternatives rejected**: Stops at band boundaries — would create hard color edges between bands. Stops at band starts — same problem.
- **Rationale**: Midpoint placement means the gradient smoothly interpolates from one mana color's center to the next, which is more visually pleasing and communicates the flow of the session deck.

## DEC-186: Cover Animates at Constant Speed Over Full Card Duration
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: The cover shrinks using a CSS transition with `linear` timing over the full card duration (REVEAL_DELAY_MS + ADVANCE_DELAY_MS = 5s). This makes the bar move at a constant speed matching the card timer.
- **Alternatives rejected**: Ease-in/ease-out transitions — would make progress speed appear non-uniform, which could be misleading about how much time is left.
- **Rationale**: The progress bar should convey time, not just position. Constant-speed movement at the same rate as the card timer makes it readable as a clock.

## DEC-187: User Tap Transitions Bar from Current Position to Next Target
- **Date**: 2026-03-26
- **Arc**: 48
- **Decision**: When the user taps to advance early, the browser transitions the cover width from wherever it currently is to the next target position (rather than jumping or resetting).
- **Rationale**: The smooth transition from the interrupted position to the next target maintains visual continuity. The user sees the bar catch up instantly (in transition terms), which acknowledges their tap without jarring visual discontinuity.

---

## Arc 48: Mana Color Gradient Progress Bar — COMPLETE
- **Delivered**: 2026-03-26
- **Outcome**: Progress bar on slides page displays a gradient of mana colors from the deck sequence, revealed progressively as the user advances through cards. Cover-reveal approach eliminates wiggle. Constant-speed animation. Smooth transitions on early tap. Tests updated for cover-reveal approach.
- **Commits**: e496d7a, 6d727b4, dc5357b, 8641f97, 7cd70eb, 91c2229
- **Decisions**: DEC-182, DEC-183, DEC-184, DEC-185, DEC-186, DEC-187

---

## DEC-188: localStorage Adapter Pattern — Centralize Writes via src/storage.ts
- **Date**: 2026-03-26
- **Arc**: 49
- **Decision**: All production localStorage writes in `src/` are routed through a thin adapter module (`src/storage.ts`) that exports `storageSetItem`, `storageRemoveItem`, and `storageClear`. Each function performs the operation then emits a `localStorage.update` log via `emitLog`.
- **Alternatives rejected**: Monkey-patching `localStorage` globally — harder to test and fragile. Inline `emitLog` calls at each call site — no compile-time enforcement and easy to miss.
- **Rationale**: The adapter provides compile-time safety (TypeScript enforces usage) and greppability (all storage writes are visible in one file). Telemetry is guaranteed for every write without trusting individual developers to remember.

## DEC-189: Deliberate Exception — Player ID Write in telemetry.ts Stays Direct
- **Date**: 2026-03-26
- **Arc**: 49
- **Decision**: `src/telemetry/telemetry.ts` keeps a direct `localStorage.setItem` call for writing the player ID rather than using the adapter.
- **Rationale**: The adapter calls `emitLog`, which is defined in telemetry.ts — using the adapter from telemetry.ts would create a circular dependency (storage.ts → telemetry.ts → storage.ts). This write also happens before telemetry is initialized. Acceptable because the player ID is already visible as a resource attribute on every trace.

## DEC-190: Adapter Logs Are Standalone — No Parent Span
- **Date**: 2026-03-26
- **Arc**: 49
- **Decision**: The adapter calls `emitLog(body, undefined, attrs)` — no parent span is passed. Storage mutation logs arrive without trace context.
- **Alternatives rejected**: Passing an optional span parameter at every call site — adds complexity and most call sites don't have a convenient span reference.
- **Rationale**: Keeps the adapter simple and decoupled from calling context. Storage mutations are independently queryable in Honeycomb by key, value, and operation. Future enhancement could add an optional span parameter if trace correlation becomes necessary.

## DEC-191: try/catch Around emitLog in Adapter
- **Date**: 2026-03-26
- **Arc**: 49
- **Decision**: Each adapter function wraps the `emitLog` call in a try/catch so that a telemetry failure never prevents the localStorage operation from succeeding.
- **Rationale**: The localStorage write is the primary operation; telemetry is secondary. The adapter must not degrade reliability of state persistence, especially during app initialization when telemetry may not yet be ready.

## DEC-192: Language Scope Remains English-Only Despite Multi-Language Player Base
- **Date**: 2026-03-26
- **Decision**: English-only scope (DEC-019) is maintained. Market research (RF-007) establishing a ~10M potential audience across 6 MTG languages does not change the current scope.
- **Context**: Client provided market research showing 35–50M total players, ~10M in the new-player target window, and that MTG is published in 6 languages with Japanese likely the second-largest. DEC-019 had previously decided English-only.
- **Alternatives considered**: Begin localization work (Japanese as first target). Add language detection and a "coming soon" signal.
- **Rationale**: The English-only scope is still appropriate for initial delivery. The research establishes meaningful future opportunity — particularly Japanese — but localization is a significant scope expansion. It is recorded here as a known future consideration rather than current obligation.
- **Future signal**: If data from Honeycomb shows significant non-English browser traffic (`browser.language`), that would be a concrete trigger to revisit.

---

*Entries added as decisions are made. Format: DEC-NNN with date, decision, context, and rationale.*
