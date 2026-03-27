# Arc 53 — documentLoad Telemetry Verification

**Date**: 2026-03-26
**APP_VERSION**: 0.35.0

## What was verified

Arc 53 added `DocumentLoadInstrumentation` to both the main app telemetry and a new
`combo-telemetry.ts` entry point that is injected into all combo pages.

## Test results

All 10 assertions PASSED in `tests/arc53-documentload.mjs`.

### Checks performed
1. Welcome page loads (title present) ✓
2. Combo page (rakdos.html) has `data-combo-id="rakdos"` on body ✓
3. Combo page title mentions "rakdos" ✓
4. `window.recordEvent` is a function on combo pages ✓
5. `combo-telemetry.js` bundle contains version `0.35.0` ✓
6. Bundle contains `app.page` attribute reference ✓
7. Bundle contains `combo.id` attribute reference ✓
8. Bundle is non-trivial (>100 bytes) ✓
9. Azorius combo page has `data-combo-id="azorius"` ✓
10. Span flush wait completed ✓

## Honeycomb verification

Queried `sparrow-deck` environment for documentLoad spans with `app.page = "combo"`:

- `name = "documentLoad"` confirmed in sparrow-deck dataset
- `app.page = "combo"` confirmed
- `combo.id = "rakdos"` confirmed
- `service.version = "0.35.0"` confirmed
- Full trace with 18 spans: 1 documentLoad root + 1 documentFetch + 16 resourceFetch spans
- **Trace link**: https://ui.honeycomb.io/modernity/environments/sparrow-deck/trace?trace_id=d542c5df8b082d6407d21b61cacc044b

## Key architecture notes

- Combo pages use a **separate** HoneycombWebSDK init in `combo-telemetry.ts` (not the main app's `init.ts`)
- `combo.id` is read from `document.body.getAttribute('data-combo-id')` (injected by `scripts/build-combos.ts`)
- `window.recordEvent` is exposed for future inline interactivity (share button etc.)
- The module script tag is placed immediately after `<body data-combo-id="...">` opens
- `forceFlush()` is called inside `window.recordEvent` for immediate export

## Test script

`tests/arc53-documentload.mjs` — tests rakdos and azorius pages, includes 35s flush wait.
