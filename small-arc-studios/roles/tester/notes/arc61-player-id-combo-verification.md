# Arc 61 Verification: player.id on Combo Page Telemetry

**Date:** 2026-03-30
**Arc:** 61
**Status:** VERIFIED (with caveat — see Honeycomb note)

## What Was Tested

`src/combo-telemetry.ts` now includes `mtg-sparrow.player.id` as a resource attribute,
using localStorage for persistence across sessions (same pattern as main app telemetry).

## Playwright Test

**File:** `tests/arc61-player-id-combo.mjs`

**Results:** 9/9 PASS

| Phase | Test | Result |
|-------|------|--------|
| 1 | Azorius combo page loads; `.combo-name` heading is visible | PASS |
| 1 | Combo name heading contains "azorius" | PASS |
| 2 | `localStorage['mtg-sparrow.player.id']` is set after page load | PASS |
| 2 | player.id is a 16-char hex string | PASS |
| 2 | player.id matches `[0-9a-f]{16}` pattern | PASS |
| 3 | player.id persists when loading a second combo page (dimir.html) | PASS |
| 3 | player.id is identical across both pages | PASS |
| 4 | Fresh browser context generates a new player.id on page load | PASS |
| 4 | Fresh player.id is 16-char hex | PASS |

## Honeycomb Status

**Column confirmed in schema:** `mtg-sparrow.player.id` — LastWritten: 2026-03-30 14:00:00

**Combo page spans with player.id:** 0 as of verification time.

**Explanation:** The column exists in Honeycomb (written by main app non-combo spans at v0.39.0),
but no combo page spans carrying player.id have reached Honeycomb yet. The local build runs v0.39.0
but the production site hasn't been deployed. Playwright test telemetry from headless Chrome appears
to not have exported successfully (previous test runs showed up as v0.38.0 spans; the v0.39.0 build
hadn't been deployed when those runs happened).

**Action required:** After deploying to GitHub Pages, combo page spans with `mtg-sparrow.player.id`
will appear in Honeycomb. The column schema is already registered. A production visit to any combo
page will confirm end-to-end.

## Acceptance Criteria Assessment

| Criterion | Status |
|-----------|--------|
| Combo pages load and function correctly | VERIFIED (Playwright) |
| localStorage has player.id after load | VERIFIED (Playwright) |
| player.id persists across combo pages | VERIFIED (Playwright) |
| player.id appears in Honeycomb telemetry | PENDING — requires production deploy |

## Notes

- The `mtg-sparrow.player.id` column exists in Honeycomb dataset schema (confirmed).
- The implementation matches the main app pattern exactly: 8 crypto bytes → 16-char hex → localStorage.
- The Playwright test uses separate browser contexts to test both persistence and freshness.
