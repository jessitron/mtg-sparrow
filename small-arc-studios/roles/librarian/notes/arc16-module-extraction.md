# Arc 16: Extract Shared Modules from main.ts

**Status:** Complete — verified by Tester, Playwright 23/23 PASS

**Version:** 0.14.0

**Completed:** 2026-03-02

**Type:** Structural Arc

## Intention

Pull logically distinct sections out of `main.ts` into focused modules under `src/ui/`. This reduces `main.ts` from a 957-line monolith to a thin orchestrator (~438 lines) and establishes the modular structure needed before page-by-page decomposition in Arcs 17–20.

## Observable Outcome

Three new modules in `src/ui/`:
- `src/ui/guild-columns.ts` — guild column building, color wheel building, hover wiring, `showSessionEndColumns`
- `src/ui/self-assessment.ts` — `AssessmentOption`, `SELF_ASSESSMENT_MIN_CARDS`, `ASSESSMENT_OPTIONS`, `buildSelfAssessment`
- `src/ui/settings.ts` — `wireSettings` (panel open/close, version display, reset progress, trace URL)

Structural marker `app.module_structure = 'extracted'` on `app.startup` span confirms the extraction is in effect.

## Acceptance Criteria

- App loads, welcome screen renders correctly ✓
- Settings panel opens/closes, shows v0.14.0 ✓
- Session runs — cards with pips and name render ✓
- Session ends — end screen visible ✓
- Self-assessment renders with 3 buttons ✓
- Guild columns render (allied + enemy) ✓
- SVG color wheels present ✓
- Bundle contains `app.module_structure = 'extracted'` ✓
- Bundle contains `css.split = 'true'` (Arc 15 marker, carried forward) ✓

## Implementation

### Extracted Modules

**`src/ui/guild-columns.ts`**
- `buildGuildColumns(guilds, isEnemy)` — builds the DOM for allied or enemy guild column sections
- `buildColorWheel(...)` — SVG pentagon/star color wheel construction
- `wireColorWheelHover(...)` — bidirectional hover wiring between wheel lines and guild list items
- `showSessionEndColumns(session, getSessionSpan)` — orchestrates end-screen guild column rendering

**`src/ui/self-assessment.ts`**
- `AssessmentOption` type
- `SELF_ASSESSMENT_MIN_CARDS` constant
- `ASSESSMENT_OPTIONS` array
- `buildSelfAssessment(onSelect)` — builds self-assessment DOM with callbacks

**`src/ui/settings.ts`**
- `wireSettings(version, resetProgress, getSessionSpan)` — wires settings panel: open/close toggle, version display, reset progress button, Honeycomb trace URL link

### Cross-Module Dependency Pattern
Where modules needed callbacks into main.ts:
- `startSession` passed as a callback to `guild-columns` (for "Start a session" buttons on end screen)
- `getSessionSpan` passed as a callback to `settings` (for Honeycomb trace URL)

### main.ts
- Reduced from 957 lines to 438 lines
- Now acts as thin orchestrator: imports from modules, wires up event listeners, manages session state
- APP_VERSION bumped from `0.13.0` to `0.14.0`

### Structural Marker
- `app.module_structure: 'extracted'` added to `app.startup` span in `src/telemetry/telemetry.ts`

## Commits

- `dfa04a0` — Arc 16: Extract guild-columns, self-assessment, and settings modules
- `d184487` — Arc 16: Slim main.ts to thin orchestrator, bump to v0.14.0
- `b8db734` — Arc 16: Add tester verification script and notes

## Verification

### Playwright Tests
- 23/23 checks PASS across 8 phases
- App load, settings (v0.14.0), session run, session end, self-assessment, guild columns, SVG wheels, bundle markers
- Test script: `tests/arc16-module-extraction.mjs`

### Observability
- Bundle inspection confirms `app.module_structure = 'extracted'` is correctly coded in startup span
- Runtime Honeycomb confirmation pending deployment (known flush-timing limitation — same as Arcs 14 and 15)
- Most recent Honeycomb spans at time of verification: v0.13.0 (2026-03-02T02:28:03Z)

### Tester Notes
- `small-arc-studios/roles/tester/notes/arc16-module-extraction-verification.md`

## Known Issues

**Flush-timing limitation** — Playwright headless browser closes before OTel batch timer (~30s) fires, so no v0.14.0 spans in Honeycomb from tests. `forceFlush()` on visibilitychange is also broken. Will appear naturally once deployed app is used. Same limitation noted in Arcs 14 and 15.

## Next Arc

**Arc 17** — Create `slides.html` + `src/slides.ts`
