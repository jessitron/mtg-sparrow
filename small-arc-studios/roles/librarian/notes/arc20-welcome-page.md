# Arc 20: Slim index.html, create src/welcome.ts, delete main.ts

**Status:** Complete — verified by Tester, Playwright 32/32 PASS, Honeycomb confirmed

**Version:** 0.18.0

**Completed:** 2026-03-02

**Type:** Structural Arc

## Intention

Complete the multi-page decomposition by renaming `main.ts` → `welcome.ts`, slimming `index.html` to only include welcome-page assets, and consolidating the build to four named entry points. At this point, `app.navigation = 'multi_page'` is the structural marker on all four pages — the decomposition is complete.

## Observable Outcome

`index.html` loads with only `style.css` + `welcome.css` and `dist/welcome.js`. The welcome page emits `app.navigation = 'multi_page'`, confirming the final page has been migrated.

Four bundles exist: `welcome.js`, `slides.js`, `assessment.js`, `end.js`. The old `bundle.js` no longer exists as a source artifact (may persist as local build artifact in gitignored `dist/`).

## Acceptance Criteria

- `src/main.ts` renamed to `src/welcome.ts` ✓
- `src/main.ts` deleted ✓
- `index.html` references `dist/welcome.js` (not `bundle.js`) ✓
- `index.html` references only `style.css` + `welcome.css` ✓
- Build produces four entry points: `welcome.js`, `slides.js`, `assessment.js`, `end.js` ✓
- `app.navigation = 'multi_page'` on welcome page spans in Honeycomb ✓
- All Playwright tests pass ✓

## Implementation

### Renamed Files

**`src/main.ts` → `src/welcome.ts`**
- Changed `app.page = 'welcome'` in `initTelemetry()`
- Changed `app.navigation = 'multi_page'` (was `'single_page'`)

### Modified Files

**`index.html`**
- Script tag updated: `bundle.js` → `welcome.js`
- Removed: `slides.css`, `assessment.css`, `end.css` (never belonged on welcome page)
- Kept: `style.css` + `welcome.css`

**`package.json`** — four clean entry points
- `src/welcome.ts → dist/welcome.js`
- `src/slides.ts → dist/slides.js`
- `src/assessment.ts → dist/assessment.js`
- `src/end.ts → dist/end.js`
- Removed: old `bundle.js` build entry

**`scripts/dev.sh`** — updated to watch all four entry points

**`README.md`** — updated to v0.18.0

### Decisions Made

- DEC-071: main.ts deleted, replaced by welcome.ts — four separate entry points, no shared bundle
- DEC-072: All four pages now emit app.navigation='multi_page' — structural marker complete

### Structural Marker

- `app.page: 'welcome'` — resource attribute in `initTelemetry()`
- `app.navigation: 'multi_page'` — resource attribute in `initTelemetry()` (changed from `'single_page'`)

## Verification

### Playwright Tests
- 32/32 checks PASS
- Welcome page load, correct CSS files, correct bundle, navigation to slides, telemetry marker
- Test script: `tests/arc20-welcome-page.mjs`

### Honeycomb Telemetry
- Queried `sparrow-deck` for `app.navigation = 'multi_page'` on welcome spans — confirmed
- `app.page = 'welcome'`, `app.navigation = 'multi_page'`, `app.version = '0.18.0'` confirmed

### Tester Notes

- Stale `dist/bundle.js` remains as local artifact — `dist/` is gitignored. Not a code bug. A clean step in the build would prevent confusion.

## Known Issues / Forward Notes

**Stale build artifacts** — `dist/bundle.js` persists from old builds since `dist/` is gitignored. A `rm -f dist/*.js` clean step before build would help. See lesson in decision log.

## Next Arc

**Arc 21** — Cross-page telemetry verification in Honeycomb
