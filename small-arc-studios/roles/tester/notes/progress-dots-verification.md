# Progress Dots Verification

## Date: 2026-04-01

## What was tested

End screen reel progress dots (`end.html` / `end.css` / `src/ui/guild-columns.ts`).

## Test script

`tests/verify-progress-dots.mjs` — 19 checks, all passing.

## Checks

| # | Check | Result |
|---|-------|--------|
| 1 | 5 dots present in DOM | PASS |
| 2 | Container visible (display: flex) | PASS |
| 3 | Bounding box exists | PASS |
| 4 | Left side position (x=16) | PASS |
| 5 | Vertically centered (midY=400 in 800px viewport) | PASS |
| 6 | First dot active by default | PASS |
| 7-10 | Dots 2-5 NOT active by default | PASS |
| 11-12 | Click 3rd dot: it activates, 1st deactivates | PASS |
| 13 | Bottom chevron button exists | PASS |
| 14-15 | Chevron down: 2nd dot activates, 1st deactivates | PASS |
| 16 | Second chevron down: 3rd dot activates | PASS |
| 17-18 | subgroup=shards: 4th dot active, 1st not | PASS |
| 19 | subgroup=wedges: 3rd dot active | PASS |

## Notes

- Dots are hidden on mobile (max-width: 700px media query) — not tested here as we use 1280x800 viewport
- The `share` section (5th dot, index 4) exists but wasn't specifically deep-linked via URL param testing — it has no subgroup equivalent
- Animation waits (1000-1500ms) are used to let `reelSpinTo` complete before checking state
