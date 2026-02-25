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
- **Status**: PLANNED — to be implemented in Arc 8, after guild subgroups

---

## Planned Arcs

### Arc 7: Guild Subgroups (User Arc) — COMPLETE (v0.7.0)
- **Delivered**: 2026-02-24
- **Outcome**: Allied/enemy subgroups implemented. Default start is allied guilds. End screen provides one-tap navigation to the other subgroup. `session.tier` emits `'guild_allied'` or `'guild_enemy'`. 46/46 checks PASS.

### Arc 8: Card Images (User Arc)
- **Intention**: Replace or augment mana pip display with real Magic card images. Each combo has multiple card images; different images shown on each repetition within a session.
- **Scope**:
  - Source card images (community assets, Scryfall API, or bundled)
  - Display design: how card art interacts with the name reveal
  - Multiple images per combo for varied exemplars
  - Observability: `card.image_id` or similar attribute on card spans
- **Depends on**: Arc 7 (guild subgroups should be in place first so card images cover the right set)
- **Note**: This is a larger arc — may need design and domain expert input on image sourcing and display

---

## Future Enhancements (from client Proposal annotations)

Items noted by client but explicitly out of scope for initial delivery:

- **Real card images**: Use different real Magic card images per repetition of a combo (more faithful to original Sparrow Deck technique)
- **Adaptive pacing**: Increase speed after practice, based on observability data
- **Page refresh detection**: Use localStorage to notice page refreshes, which could indicate errors (complements Honeycomb Web SDK automatic session ID)

---

*Entries added as decisions are made. Format: DEC-NNN with date, decision, context, and rationale.*
