# Arc 37: Clean Up Public-Facing Artifacts — Verification

## Date: 2026-03-08

## Results: 49/49 PASS, 0 FAIL

### Criterion 1: Prototype pages removed (404)
**PASS** — All 5 prototype pages return 404 for both `.html` and clean URL variants:
- prototype, color-wheel-test, mana-gas, slot-machine, card-back-demo
- Tested 10 URLs total (with and without .html extension)

### Criterion 2: Related CSS removed (404)
**PASS** — `css/card-back.css` and `css/slot-machine.css` both return 404

### Criterion 3: Related TS removed
**PASS** — `src/slot-machine.ts` does not exist on disk

### Criterion 4: APP_VERSION extracted to src/version.ts
**PASS** — `src/version.ts` exists with `export const APP_VERSION = '0.27.0'`

### Criterion 5: All entry points import from version.ts
**PASS** — All 5 entry points (welcome.ts, slides.ts, assessment.ts, end.ts, about.ts) import from `'./version'` with no local `const APP_VERSION` definitions

### Criterion 6: app.version on every event (service.version resource attribute)
**PASS** — Honeycomb query confirms `service.version = '0.27.0'` appears on spans (app.startup, TTFB, CLS, FCP all verified in sparrow-deck environment). This is a resource attribute, so it propagates to all spans from each page.

### Criterion 7: No broken references — all 5 real pages load correctly
**PASS** — All pages return HTTP 200, have no JS errors, and contain meaningful content:
- welcome (648 chars), slides (237), assessment (333), end (333), about (889)

### Criterion 8: Build works
**PASS** — `npm run build` succeeds (esbuild produces all 5 bundles: welcome.js, slides.js, assessment.js, end.js, about.js)

## Honeycomb Evidence
- Query URL: https://ui.honeycomb.io/modernity/environments/sparrow-deck/result/adwSDzZouH1
- 4 spans found with `service.version = '0.27.0'` in last hour
- Resource attributes confirmed: `service.version`, `app.version`, `app.page`, `app.navigation`

## Test Script
`tests/arc37-cleanup.mjs` — 49 assertions across 8 test sections

## Notes for Future Tester
- The `serve` static server returns 404 for both `.html` and clean URL variants of removed files — good to test both.
- `service.version` is set as an OTel resource attribute via `initTelemetry()`, so it propagates to ALL spans from a page, not just custom ones. This is the right pattern for version tracking.
- Version is centralized in `src/version.ts` — single source of truth for the entire app.
