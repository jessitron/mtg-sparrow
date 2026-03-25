# Arc 45 Verification: Footer Redesign

**Date**: 2026-03-25
**Test script**: `tests/test-footer-redesign.mjs`
**Result**: 32/32 PASS

## What Was Verified

### Phase 1: Names row content
- `.footer-names` row is visible on card 1
- `.footer-names-text` contains all 5 allied guild names: Azorius, Dimir, Rakdos, Gruul, Selesnya
- Names are separated by ` · ` (U+00B7 middle dot with spaces)

### Phase 2: Hide/show toggle
- `.footer-names-toggle` button shows `[hide]` initially
- Clicking `[hide]` hides `.footer-names-text` and changes button text to `[show names]`
- Toggle button remains visible when names are hidden
- `.footer-names` row itself remains in DOM
- Clicking `[show names]` restores `.footer-names-text` and resets button to `[hide]`

### Phase 3: Controls row structure
- `.footer-controls` row is visible
- `.progress-counter` shows "1 / N" on first card (N = 25 for allied)
- `#pause-btn` and `.footer-pause-btn` both exist
- `.done-button` exists
- `.footer-controls` uses `justify-content: flex-end`

### Phase 4: Exit button visibility
- Exit button has `opacity: 0` and `pointer-events: none` on card 1
- After advancing to card 2, Exit button gains `button-visible` class (triggering fade-in animation)

### Phase 5: Pause button shape
- `.footer-pause-btn` has `border-radius: 50%` (circular)

### Phase 6: Pause interaction
- Clicking pause changes innerHTML (icon swap between play/pause SVG)
- A `paused` or `--paused` class appears somewhere in DOM

### Phase 7: Exit navigation
- Clicking Exit navigates to `/assessment?...` which may redirect to `/end?...` if too few cards shown
- Both URLs are accepted as valid exit destinations

## Implementation Notes

### Allied guild names
The task description said "Azorius, Orzhov, Boros, Selesnya, Simic" but those are mixed.
Actual allied guilds (as stored in comboPoolMap): **Azorius, Dimir, Rakdos, Gruul, Selesnya**.

### Card count is 25, not 10
Task said "5 combos × 2 reps = 10" but actual allied session has 25 cards (5 combos × 5 reps).
The test uses a regex pattern `/^\s*1\s*\/\s*\d+\s*$/` to match "1 / N" without hardcoding N.

### Card advance timing
`handleAdvance()` does NOT immediately move to the next card. When `revealTimer` is active:
- Clears the reveal timer
- Starts a new `setTimeout(goToNextCard, ADVANCE_DELAY_MS)` = 2000ms

After clicking the card, the test must wait ~2500ms before checking the counter.
Do NOT use 500ms wait — card won't have advanced yet.

### Exit button visibility via CSS class
The base `.done-button` style has `opacity: 0`. Visibility is conferred by:
- `.done-button.button-visible` — CSS animation fade-in, pointer-events: auto
- `.done-button.button-steady` — opacity: 1, no animation, pointer-events: auto

Check for these classes rather than computed `opacity` (animation may still be mid-transition).

### Exit navigates through assessment → end
`stopSession()` → `navigateToAssessment(cardsShown)` → redirects to `assessment?...`
If `cards < SELF_ASSESSMENT_MIN_CARDS`, assessment page immediately redirects to `end?...`.
The test accepts both `/assessment` and `/end` in the final URL.

## Honeycomb Observability

### Confirmed columns exist
- `session.card_count` — sample value: 25 (confirmed for allied)
- `session.completed` — sample value: false (early exit test)

### Pending columns (new in Arc 45)
- `session.names_hidden` — set as span attribute when user hides names
- Log events `session.names_hide` / `session.names_show` — emitted on each toggle

These won't appear in the Honeycomb schema until a real user session exercises the hide/show toggle.
The code is wired correctly (verified in slides.ts lines 187–193).
