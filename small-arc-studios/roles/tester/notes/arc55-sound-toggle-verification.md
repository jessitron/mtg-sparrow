# Arc 55 — Sound Toggle UI & Persistence Verification

**Date**: 2026-03-27
**APP_VERSION**: 0.37.0

## What was verified

Arc 55 added a sound toggle button (speaker icon) to the welcome page and slides page,
positioned to the left of the hamburger menu. It reads/writes `mtg-sparrow.sound.enabled`
in localStorage via the storage adapter. Default is sound ON.

## Test results

All 17 assertions PASSED in `tests/arc55-sound-toggle.mjs`.

### Checks performed

**Phase 1 — Welcome page button:**
1. Sound toggle button (#sound-toggle-btn) exists ✓
2. Sound toggle button is visible ✓
3. Button has a non-empty title attribute ✓

**Phase 2 — Slides page button:**
4. Sound toggle button exists on slides page ✓
5. Sound toggle button is visible on slides page ✓

**Phase 3 — Toggle behavior:**
6. Default title is "Sound on — click to mute" (no key in storage → default ON) ✓
7. Default icon shows speaker-on (has wave path `M15.54` / `M19.07`) ✓
8. After click, title is "Sound off — click to unmute" ✓
9. After click, icon shows speaker-off (`<line>` X elements) ✓
10. After second click, title is back to "Sound on — click to mute" ✓

**Phase 4 — Persistence:**
11. localStorage[`mtg-sparrow.sound.enabled`] = "false" after clicking off ✓
12. After page reload, button shows sound-off state ✓
13. localStorage[`mtg-sparrow.sound.enabled`] = "true" after clicking on ✓
14. After second reload, button shows sound-on state ✓

**Phase 5 — Not on combo pages:**
15. Button is NOT present on rakdos combo page ✓

**Phase 6 — Not on about page:**
16. Button is NOT present on about page ✓

**Phase 7 — Version:**
17. Menu shows version 0.37.0 ✓

## Honeycomb verification

Queried `sparrow-deck` environment for `body = "sound.toggle"` over 24h window.
No events found — expected, because the test server runs locally without Honeycomb
credentials, so telemetry is not sent during local test runs.

The `sound.toggle` event will be visible in Honeycomb once a real user toggles sound
in the deployed app. The event is emitted via `recordEvent` → `emitLog` pipeline, same
pattern as `share.copy_link` (confirmed working in Arc 54).

**Query URL**: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/7SPkKoMSHJZ

## Key architecture notes

- `src/audio.ts` — pure preference module; reads/writes `mtg-sparrow.sound.enabled` via
  `storageSetItem` (the storage adapter), and fires `recordEvent('sound.toggle', {sound.enabled})`.
- `src/ui/sound-toggle.ts` — creates and appends button to `document.body`, wired by callers.
- Only `welcome.ts` and `slides.ts` call `wireSoundToggle(recordEvent)` — combo pages do not.
- Button appended to `<body>`, fixed position at `top: 12px; right: 48px` (left of hamburger
  at `right: 12px`).

## Gotchas / lessons learned

- `addInitScript` in Playwright runs on EVERY navigation including page.reload(), so using it
  to seed localStorage will clear the data you just wrote. Use `page.evaluate()` after load
  instead.
- The schema validation hook may report `body` and `service.version` as unknown if the local
  schema cache is stale — `find_columns` with those terms confirmed they do exist.
- The version element in the menu is `#settings-version` (not `.menu-version`).
- The menu panel is hidden (`.hidden`) until opened — but `#settings-version` is still
  queryable by Playwright even when hidden, just not via `isVisible`. Use `textContent()`
  directly.

## Test script

`tests/arc55-sound-toggle.mjs` — 7 phases, 17 checks covering button presence on
welcome/slides, absence on combo/about, toggle icon behavior, localStorage persistence
across reload, and version marker.
