# Arc 54 — Shared Menu with Event-Based Telemetry Verification

**Date**: 2026-03-26
**APP_VERSION**: 0.36.0

## What was verified

Arc 54 extracted the hamburger menu into `src/ui/menu.ts`, refactored telemetry events from
zero-duration spans to logger-based logs via `recordEvent`, and wired the menu into combo pages
via `combo-telemetry.ts`.

## Test results

All 23 assertions PASSED in `tests/arc54-shared-menu.mjs`.

### Checks performed

**Combo page (rakdos.html):**
1. Hamburger menu button (#menu-btn) exists ✓
2. Menu button is visible ✓
3. Menu panel opens on click ✓
4. Version shows v0.36.0 ✓
5. Levels link (href="end") is present ✓
6. About link (href="about") is present ✓
7. Share button is present ✓
8. Feedback button is present ✓
9. Title link says "MTG Colors" ✓
10. Reset Progress button is NOT in combo menu ✓
11. Current trace link is NOT in combo menu ✓
12. Share button text changes to "Copied!" on click ✓
13. Copied URL contains utm_source=share ✓
14. Copied URL contains utm_id param ✓
15. Feedback button opens feedback modal (dialog role + textarea found) ✓

**Welcome page (/):**
16. Hamburger menu button exists ✓
17. Menu panel opens ✓
18. Reset Progress button IS present ✓
19. Share button is present ✓
20. Version shows v0.36.0 ✓

**Bundle / window:**
21. window.recordEvent is a function on azorius combo page ✓
22. combo-telemetry.js bundle contains version 0.36.0 ✓
23. Telemetry flush wait completed ✓

## Honeycomb verification

Queried `sparrow-deck` environment for share.copy_link log events (service.version = 0.36.0):

- `body = "share.copy_link"` confirmed ✓
- `meta.signal_type = "log"` confirmed — events are logs, not spans ✓
- `service.version = "0.36.0"` confirmed ✓
- `app.page = "combo"` confirmed ✓
- `combo.id = "rakdos"` confirmed ✓
- `share.url` contains utm_source=share and utm_id params ✓
- Two log events arrived (one from Phase 3 test, one from Phase 7 flush)

**Query URL**: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/fH5RJWZQoWS

## Key architecture notes

- `src/ui/menu.ts` is framework-agnostic: receives `recordEvent` and `getSessionId` as callbacks
- Combo pages: `showResetProgress: false`, `showTraceLink: false`
- Welcome/main pages: `showResetProgress: true`, `showTraceLink: true`
- Share events are **logger logs** (`meta.signal_type = "log"`), not spans — this is the Arc 54 refactor
- The `combo-telemetry` library name appears in Honeycomb as `library.name = "combo-telemetry"`

## Test script

`tests/arc54-shared-menu.mjs` — 7 phases, covers combo menu contents, share button, feedback modal,
welcome menu, window.recordEvent, bundle version check, and telemetry flush.
