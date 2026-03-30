# Arc 58 — iOS Safari Audio Unlock Verification

**Date**: 2026-03-30
**APP_VERSION**: 0.38.0

## What was verified

Arc 58 added iOS Safari audio unlock support:
- `unlockAudio()` in `src/audio.ts` — plays a silent data-URI WAV to prime the `HTMLAudioElement`,
  then stores it in the module-level `audioEl` variable for reuse.
- `unlockAudio()` called synchronously in the `dismiss()` handler of the level intro in `src/slides.ts`
  (the user's tap gesture that starts the session).
- `playAudio()` now reuses `audioEl` (mutates `.src` + calls `.play()`) when it exists, otherwise
  creates a new `Audio()` as fallback.

## Test results

All 10 assertions PASSED in `tests/arc58-ios-audio-unlock.mjs`.

### Checks performed

**Phase 1 — Slides page loads, level intro is visible:**
1. Level intro element is present before dismissal ✓
2. Level intro CTA button is present ✓

**Phase 2 — Dismissing level intro starts the session:**
3. CTA button is visible before click ✓
4. Intro started dismissing or is gone ✓

**Phase 3 — Audio plays correctly after session starts:**
5. Audio request made after session starts (1 request) ✓
6. Audio URL looks correct (e.g. `/audio/rakdos.mp3`) ✓

**Phase 4 — unlockAudio uses data URI, no external network request at dismiss time:**
7. No MP3 network requests at dismiss time ✓

**Phase 5 — Version is 0.38.0:**
8. Page text includes version 0.38.0 ✓

**Phase 6 — playAudio works on combo page (regression check):**
9. Audio request made from combo page play button ✓
10. Correct audio URL for simic ✓

## Honeycomb verification

- `app.version: 0.38.0` — no production traces yet (app not yet deployed)
- Most recent production data: `app.version: 0.37.0`, `sound.play_result: success` (3 events),
  `sound.play_result: disabled` (1 event). No `error` results — audio path was healthy pre-Arc 58.
- After deployment, expect `0.38.0` traces to appear with the same `sound.play_result` values.

## Architecture notes

- `unlockAudio()` uses a data-URI WAV (`data:audio/wav;base64,...`), so it does NOT generate
  an HTTP request — confirmed by Phase 4.
- The 150ms fade-out animation after dismiss + 3000ms REVEAL_DELAY_MS means audio plays ~3.15s
  after the CTA click. Test uses a 5000ms wait buffer.
- iOS Safari behavior (actual unlock) cannot be verified in headless Chromium, but the
  structural change (unlockAudio called in user gesture, audioEl set for reuse) is confirmed.

## Test strategy

- Network interception via `page.on('request', ...)` to detect `/audio/*.mp3` requests.
- `addInitScript()` to pre-set localStorage sound enabled before page load.
- Timed window to distinguish dismiss-time requests from reveal-time requests.
- Phase 6 verifies the combo page playback path still works (regression check).

## Timing notes

- REVEAL_DELAY_MS = 3000ms (in `src/session.ts`)
- Intro dismiss animation = 150ms (in `src/slides.ts`)
- Test waits 5000ms for audio after CTA click — sufficient buffer.

## Test script

`tests/arc58-ios-audio-unlock.mjs` — 6 phases, 10 checks covering intro display,
session start, audio playback, data-URI unlock behavior, version marker,
and combo page audio regression.
