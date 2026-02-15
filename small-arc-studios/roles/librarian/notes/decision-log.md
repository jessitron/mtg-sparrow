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

## DEC-011: Auto-Advance After Reveal (800ms Hold)
- **Date**: 2026-02-15
- **Decision**: After revealing the answer, auto-advance to the next card after ~800ms. User can also tap to skip the hold and advance faster.
- **Context**: Auto-advance maintains rhythm. The user's only job is tapping to reveal. This creates a steady beat: see → say → tap → see → tap...
- **Rationale**: Supports rapid-fire pacing (DEC-003). Reduces interaction to a single repeated gesture.

## DEC-012: Tap-Anywhere Reveal (Full Card as Tap Target)
- **Date**: 2026-02-15
- **Decision**: The entire card is the tap/click target. No small buttons. Spacebar/Enter on desktop.
- **Context**: Mobile-first design. Removing precision requirements supports speed and accessibility.
- **Rationale**: Minimizes motor friction. One action, zero aiming.

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

---

*Entries added as decisions are made. Format: DEC-NNN with date, decision, context, and rationale.*
