# Arc 18: Create assessment.html + src/assessment.ts

**Status:** Complete — verified by Tester, Playwright 20/20 PASS, Honeycomb confirmed

**Version:** 0.16.0

**Completed:** 2026-03-02

**Type:** Structural Arc

## Intention

Create the assessment page as a standalone HTML file with its own entry point. This page receives session results from `slides.html` via URL params, prompts the user for a self-assessment, and navigates to `end.html`.

## Observable Outcome

After a session on `slides.html`, the browser navigates to `assessment.html?cards=N&completed=N&subgroup=X&from=slides`. The user sees the self-assessment prompt ("How did that feel?") with three options. Selecting one navigates to `end.html` with the result appended as a URL param.

Structural markers `app.page = 'assessment'` and `app.navigation = 'multi_page'` on all spans confirm the page separation is live.

## Acceptance Criteria

- `assessment.html` loads independently with `assessment.css` + `style.css` ✓
- Reads `cards`, `completed`, `subgroup`, `from` from URL params ✓
- Self-assessment prompt renders with three options ✓
- Skip logic: fewer than 3 cards → navigates directly to `end.html` without showing prompt ✓
- Selecting an option records `session.self_assessment` on telemetry span ✓
- Navigates to `end.html` with URL params ✓
- `flushSpans()` called before navigation ✓
- esbuild builds `src/assessment.ts` as a separate entry point ✓

## Implementation

### New Files

**`assessment.html`**
- Standalone page linking `style.css` + `assessment.css`
- Loads `dist/assessment.js`

**`src/assessment.ts`**
- Reads `cards`, `completed`, `subgroup`, `from`, `welcome_dwell_ms` from URL params on load
- Skip logic: if `cards < 3`, navigates directly to `end.html`
- Shows self-assessment prompt with "Still learning / Getting there / Nailing it" options
- Records `session.self_assessment` on telemetry span
- Calls `flushSpans()` before navigation
- Structural markers: `app.page = 'assessment'`, `app.navigation = 'multi_page'`

### Modified Files

**`package.json`** — three-entry esbuild build
- Added `src/assessment.ts → dist/assessment.js`

**`README.md`** — updated to v0.16.0

### Decisions Made

- DEC-068: Assessment page skip logic — fewer than 3 cards skips self-assessment entirely

### Structural Marker

- `app.page: 'assessment'` — resource attribute in `initTelemetry()`
- `app.navigation: 'multi_page'` — resource attribute in `initTelemetry()`

## Verification

### Playwright Tests
- 20/20 checks PASS
- URL param reading, self-assessment display, option click, navigation to end.html, skip logic, telemetry markers
- Test script: `tests/arc18-assessment-page.mjs`

### Honeycomb Telemetry
- Queried `sparrow-deck` for `app.page = 'assessment'` — confirmed spans with correct attributes
- `app.page = 'assessment'`, `app.navigation = 'multi_page'`, `session.self_assessment` present

## Next Arc

**Arc 19** — Create `end.html` + `src/end.ts`
