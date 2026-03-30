# Arc 64 Tester Notes — Log Home Page Pause/Fan Button Presses

Date: 2026-03-30

## What Was Tested

- `mana-gas.js` dispatches `mana-gas-stop` CustomEvent on `window` when `#gas-stop-btn` is clicked
- `mana-gas.js` dispatches `mana-gas-fan` CustomEvent on `window` when `#gas-fan-btn` is clicked
- `mana-gas-stop` includes `detail: { paused: boolean }` toggling on each click
- Version confirmed as `0.41.0` via `#settings-version` in the menu panel

## Test File

`tests/arc64-gas-button-events.mjs` — 8 assertions, all pass

## Findings

- `APP_VERSION` is not exposed on `window` — must check via `#settings-version` DOM element (requires opening the menu)
- Menu closes via `#settings-close-btn`, not by re-clicking the hamburger (panel intercepts pointer events)
- Events are dispatched on `window`, not on the button element itself — use `window.addEventListener` in `page.evaluate`
- Toggle behavior confirmed: first click → `paused: true`, second click → `paused: false`
