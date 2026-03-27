# Arc 57 — Combo Page Play Button Verification

**Date**: 2026-03-27
**APP_VERSION**: 0.37.0

## What was verified

Arc 57 added a pronunciation play button to combo reference pages.
The button is injected by `combo-telemetry.ts` into the DOM after `.combo-name`
using `insertAdjacentElement('afterend', playBtn)`. It calls `playComboAudio(comboId)`
from `src/audio.ts` (same function used in Arc 56), and emits a `sound.play` log event
with `sound.combo_id`, `sound.context: 'combo-page'`, and `sound.play_result`.

## Test results

All 18 assertions PASSED in `tests/arc57-combo-play-button.mjs`.

### Checks performed

**Phase 1 — Button visible and accessible (simic):**
1. Play button present ✓
2. Play button visible ✓
3. aria-label includes combo name ("Play pronunciation of Simic") ✓
4. title includes combo name ("Hear "Simic" pronounced") ✓

**Phase 2 — Button visible (azorius):**
5. Button present ✓
6. aria-label includes "azorius" ✓

**Phase 3 — Button visible (grixis):**
7. Button present ✓
8. aria-label includes "grixis" ✓

**Phase 4 — Click triggers correct audio (simic):**
9. Audio request made after click ✓
10. Request URL is `/audio/simic.mp3` ✓

**Phase 5 — Correct audio for azorius:**
11. Audio request made ✓
12. Request URL is `/audio/azorius.mp3` ✓

**Phase 6 — Sound disabled → no request:**
13. No audio request when sound is off ✓

**Phase 7 — No play button on non-combo pages:**
14. No button on welcome (index) ✓
15. No button on slides ✓
16. No button on about ✓

**Phase 8 — DOM placement:**
17. Button is immediately after `.combo-name` (nextElementSibling) ✓

**Phase 9 — Version marker:**
18. Version 0.37.0 visible in menu ✓

## Architecture notes

- The combo ID comes from `body[data-combo-id]`, which is set in every combo HTML file.
- The button uses `insertAdjacentElement('afterend', ...)` on `.combo-name` — so the button
  lives at the same DOM level as the h1, not nested inside it.
- Sound enabled/disabled is read at click time via `isSoundEnabled()` → localStorage.
  Setting it before the click (but after page load) works fine.
- The telemetry event (`sound.play`) is fired regardless of audio success/failure.
- The `combo-play-btn` CSS class is defined in `combo.css` (not `style.css`), so it only
  applies on pages that load `combo.css` — ensuring no button interference elsewhere.

## Test strategy

- Network interception via `page.on('request', ...)` to detect `/audio/*.mp3` — same
  proven approach as Arc 56.
- localStorage set via `page.evaluate()` after `waitForLoadState('networkidle')`.
- DOM assertion for button placement uses `comboName.nextElementSibling === playBtn`.
- Non-combo pages verified by checking `.combo-play-btn` count === 0.

## Gotchas / lessons learned

- The button is injected by `combo-telemetry.ts` which runs as a module script.
  `waitForLoadState('networkidle')` is sufficient to ensure injection has happened.
- Both `aria-label` and `title` use the combo name from `comboNameEl.textContent` — the
  actual text content of the h1, not the combo ID. So "Simic" not "simic".
- The `sound.context` attribute distinguishes combo-page clicks from slides reveals —
  useful for Honeycomb queries like "where are users using audio most?".

## Test script

`tests/arc57-combo-play-button.mjs` — 9 phases, 18 checks covering button presence on
3 combo pages, correct audio URL for 2 combos, sound-off suppression, absence on 3
non-combo pages, DOM placement, and version marker.
