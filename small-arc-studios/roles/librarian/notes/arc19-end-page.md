# Arc 19: Create end.html + src/end.ts

**Status:** Complete — verified by Tester, Playwright 32/32 PASS, Honeycomb confirmed

**Version:** 0.17.0

**Completed:** 2026-03-02

**Type:** Structural Arc

## Intention

Create the end page as a standalone HTML file with its own entry point. This page shows the guild columns summary, color wheels, and navigation buttons. It reads optional URL params from the assessment page, but falls back gracefully to localStorage — making it safely directly navigable without params.

## Observable Outcome

After self-assessment on `assessment.html`, the browser navigates to `end.html?cards=N&completed=N&subgroup=X&self_assessment=X`. The user sees the full guild columns layout with navigation buttons to return to slides.

A `session.summary` telemetry span fires with `cards`, `completed`, `self_assessment`, and `subgroup` attributes.

Structural markers `app.page = 'end'` and `app.navigation = 'multi_page'` on all spans confirm the page separation is live.

## Acceptance Criteria

- `end.html` loads independently with `end.css` + `style.css` ✓
- Reads optional `cards`, `completed`, `subgroup`, `self_assessment` from URL params ✓
- Falls back to localStorage if URL params not present ✓
- Renders guild columns (allied and enemy) with correct unlock state ✓
- Updates progression in localStorage (unlocks enemy if completed allied session) ✓
- `session.summary` span emitted with `cards`, `completed`, `self_assessment`, `subgroup` ✓
- Navigation buttons navigate to `slides.html` (not in-page session start) ✓
- `flushSpans()` called before navigation ✓
- esbuild builds `src/end.ts` as a separate entry point ✓

## Implementation

### New Files

**`end.html`**
- Standalone page linking `style.css` + `end.css`
- Contains guild columns static structure
- Loads `dist/end.js`

**`src/end.ts`**
- Reads optional `cards`, `completed`, `subgroup`, `self_assessment` from URL params
- Falls back to localStorage for display state if params absent
- Updates progression in localStorage
- Renders guild columns with correct locked/unlocked state
- Emits `session.summary` span with session attributes
- Navigation buttons link to `slides.html?subgroup=X&from=end`
- Structural markers: `app.page = 'end'`, `app.navigation = 'multi_page'`

### Modified Files

**`package.json`** — four-entry esbuild build
- Added `src/end.ts → dist/end.js`

**`README.md`** — updated to v0.17.0

### Decisions Made

- DEC-069: End page display driven by localStorage, not URL params — safely directly navigable
- DEC-070: Navigation buttons on end page use page navigation (slides.html) not in-page session start

### Structural Marker

- `app.page: 'end'` — resource attribute in `initTelemetry()`
- `app.navigation: 'multi_page'` — resource attribute in `initTelemetry()`

## Verification

### Playwright Tests
- 32/32 checks PASS
- URL param reading, localStorage fallback, progression update, guild column rendering, navigation buttons, telemetry span attributes
- Test script: `tests/arc19-end-page.mjs`

### Honeycomb Telemetry
- Queried `sparrow-deck` for `app.page = 'end'` — confirmed spans with correct attributes
- `session.summary` span with `cards`, `completed`, `self_assessment`, `subgroup` confirmed

## Next Arc

**Arc 20** — Slim index.html, create src/welcome.ts, delete main.ts
