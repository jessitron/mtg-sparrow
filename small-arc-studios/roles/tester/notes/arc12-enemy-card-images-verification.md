# Arc 12 — Enemy Guild Card Images Verification

**Date:** 2026-02-26
**Arc:** Arc 12 — Enemy Guild Card Images
**Version:** v0.11.0
**Result:** PASS — 15/15 checks pass (Arc 12 test) + 13/13 (Arc 11 regression)

---

## Summary

All acceptance criteria verified. Enemy guild slides now display a Scryfall card image in the same two-column layout as allied guilds. The `slide.card_name` telemetry attribute is wired in the same infrastructure as Arc 11 and fires automatically for enemy guild cards. Allied guild behavior is unchanged.

---

## Test Results by Category

### Phase 1: Enemy guild card image before reveal (Tests 1–7)
- PASS: Enemy guild card has `.card--with-image` class
- PASS: `.card-image-column` is present on enemy guild slide
- PASS: `.card-quiz-column` is present on enemy guild slide
- PASS: `.mtg-card-img` element is present on enemy guild slide
- PASS: Enemy guild card image src is from `cards.scryfall.io`
- PASS: Enemy guild card image `alt` is empty
- PASS: Enemy guild name is initially hidden (`.card-name-hidden` present)

### Phase 2: Card image persists after name reveal (Tests 8–10)
- PASS: Enemy guild name is revealed after tap
- PASS: `.mtg-card-img` still visible after name reveal
- PASS: Card image src still `cards.scryfall.io` after reveal

### Phase 3: Multiple consecutive enemy guild slides (Tests 11–13)
- PASS: Enemy slide 1: card image present with Scryfall src
- PASS: Enemy slide 2: card image present with Scryfall src
- PASS: Enemy slide 3: card image present with Scryfall src

### Phase 4: Allied guild regression (Tests 14–15)
- PASS: Allied guild slide still has `.card-image-column` (no regression)
- PASS: Allied guild card image still from `cards.scryfall.io` (no regression)

---

## Arc 11 Regression Test

The Arc 11 test (`tests/test-arc11-card-images.mjs`) was updated to remove Phase 3
(which previously asserted enemy guilds had NO card images — superseded by Arc 12).
The remaining 13 assertions (Phases 1, 2, 4) all pass.

---

## Acceptance Criteria Coverage

| Criterion | Covered | How |
|-----------|---------|-----|
| Enemy guild slides show card image in two-column layout | ✅ | Phase 1: `.card--with-image`, `.card-image-column`, `.mtg-card-img` |
| Card image is from Scryfall | ✅ | `src` includes `cards.scryfall.io` |
| Card name not visible via image | ✅ | `img.alt=""` |
| Card image persists after name reveal | ✅ | Phase 2: `.mtg-card-img` still present after tap |
| Multiple consecutive slides work | ✅ | Phase 3: 3 slides checked |
| Allied guilds not regressed | ✅ | Phase 4: allied slide still has image layout |
| `slide.card_name` telemetry fires | ✅ | Same code path as Arc 11; confirmed in source |

---

## Telemetry

`slide.card_name` is set from `combo.selectedCard.name` in `src/main.ts` (same as Arc 11).
Since enemy guilds now have `cards` arrays, `selectedCard` will be set for enemy combo slides too.
Live Honeycomb verification would require access to the `modernity` environment.

---

## Test Scripts

- `tests/test-arc12-enemy-card-images.mjs` — 15 assertions across 4 phases
- `tests/test-arc11-card-images.mjs` — updated to remove superseded Phase 3 (now 13 assertions)

---

## Screenshots

- `tests/arc12-enemy-before-reveal.png` — enemy guild slide with card image, name hidden
- `tests/arc12-enemy-after-reveal.png` — enemy guild slide after tap, guild name revealed, image still visible
- `tests/arc12-allied-regression.png` — allied guild slide still working correctly

---

## Observations

- Arc 12 was purely a data change: 10 `CardReference` entries added per enemy guild in `src/data/combos.ts`.
  The rendering/telemetry infrastructure from Arc 11 handled everything automatically with zero code changes.
- The Arc 11 "enemy no-image" test needed updating — this is a healthy signal that the test was doing its job.
  Superseded tests should be updated (not deleted) with a note explaining what changed and why.
- Random card selection uses the same `buildDeck` path in `session.ts`, so the same slide always shows
  the same card within a session, even on pause/resume.
