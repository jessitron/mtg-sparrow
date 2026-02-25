# Arc 9 Verification Report — Enemy Color Wheel (Star Pattern)

**Arc:** Arc 9 — Enemy Color Wheel (Star Pattern)
**Date:** 2026-02-25
**Tester:** Quality Engineer, Small Arc Studio
**Result:** PASS — all 130 checks passed, 0 failures

---

## What Was Verified

The enemy guild column on the session end screen now has an interactive SVG color wheel with star-pattern lines connecting non-adjacent colors (W↔B, U↔R, B↔G, R↔W, G↔U). This mirrors the allied column's pentagon wheel in behavior. Additionally, enemy content now shows after practicing enemy guilds even if stopped early (not just when completed).

### Test Script

`scripts/test-arc9-enemy-wheel.mjs` — run with `node scripts/test-arc9-enemy-wheel.mjs` from the project root. Uses `http-server` on port 8090, started automatically.

---

## Phase 1: Allied Column Pentagon Wheel (Regression)

Verified with locked enemy state (no `enemyUnlocked` in localStorage):

- `.allied-color-wheel` SVG present
- All 5 pentagon line IDs present: `#line-white-blue`, `#line-blue-black`, `#line-black-red`, `#line-red-green`, `#line-green-white`
- `.ally-line`, `.ally-line-vis`, `.ally-line-hit` classes all present
- Hover on `#line-white-blue` gives `.highlight`; `#crest-image` shows `images/azorius.png`
- Tap-to-select on `#line-green-white` (Selesnya) persists after mouseleave

**Screenshot:** `scripts/arc9-phase1-allied-regression.png`

---

## Phase 2: Locked Enemy Column Has No Wheel

Verified with clean localStorage (no enemy unlock):

- `.guild-column--locked` class present on enemy column
- `.enemy-color-wheel` NOT present
- No `.guild-column-item` elements in locked enemy column

---

## Phase 3: Unlocked Enemy Column Has Star Wheel

Set `enemyUnlocked: true` via localStorage, ran a session, stopped early:

- `.enemy-color-wheel` SVG present
- All 5 star-pattern line IDs present:
  - `#line-white-black` (Orzhov)
  - `#line-blue-red` (Izzet)
  - `#line-black-green` (Golgari)
  - `#line-red-white` (Boros)
  - `#line-green-blue` (Simic)
- `.enemy-line`, `.enemy-line-vis`, `.enemy-line-hit` classes present
- 5 enemy guild list items visible
- `#crest-image-enemy` exists with initial `opacity="0"`

**Screenshot:** `scripts/arc9-phase3-enemy-wheel.png`

---

## Phase 4: Enemy Hover on Line — All 5 Guilds

For each enemy guild (Orzhov, Izzet, Golgari, Boros, Simic), hovering the line:

- Line gets `.highlight`
- Both endpoint nodes in `.enemy-color-wheel` get `.highlight`
- `[data-guild-id="..."]` list item gets `.highlight`
- `#crest-image-enemy` opacity becomes `"1"`
- `#crest-image-enemy` href shows the correct guild image (e.g., `images/izzet.png`)
- Moving mouse away clears all highlights and returns crest opacity to `"0"`

**Screenshot:** `scripts/arc9-phase4-enemy-hover.png`

---

## Phase 5: Enemy Hover on List Item — All 5 Guilds

For each enemy guild, hovering the list item:

- Line gets `.highlight`
- Both endpoint nodes get `.highlight`
- Crest becomes visible with correct image
- Moving mouse away clears everything

---

## Phase 6: Enemy Tap-to-Select (Line Click)

Tested with Izzet (`#line-blue-red`):

- Click highlights line; crest shows `images/izzet.png`
- After moving mouse away, highlight PERSISTS (tap-selected)
- Crest opacity stays `"1"` after mouseleave
- Clicking same line again clears highlight and crest returns to `"0"`

**Screenshot:** `scripts/arc9-phase6-enemy-selected.png`

---

## Phase 7: Enemy Deselect by Clicking Background

Tested with Simic (`#line-green-blue`):

- Click selects line
- Clicking enemy column header (outside any line/item) deselects
- Crest returns to `"0"`

---

## Phase 8: Enemy Tap-to-Select via List Item

Tested with Golgari:

- Clicking list item highlights item, line, and crest
- Selection persists after mouseleave
- Second click on same list item deselects

---

## Phase 9: Allied and Enemy Wheels Are Independent

- Selected Azorius in allied wheel; enemy wheel has zero `.enemy-line.highlight`
- While Azorius is selected, selected Izzet in enemy wheel
- Both selections are active simultaneously:
  - `#crest-image` (allied) still shows `images/azorius.png`
  - `#crest-image-enemy` shows `images/izzet.png`
  - `#crest-image` opacity `"1"`, `#crest-image-enemy` opacity `"1"`

**Screenshot:** `scripts/arc9-phase9-both-selected.png`

---

## Phase 10: Structural Checks

- Enemy wheel has exactly 5 `.enemy-line` groups
- Enemy wheel has exactly 5 `.enemy-line-vis` elements
- No `.enemy-line` elements inside `.allied-color-wheel`
- No `.ally-line` elements inside `.enemy-color-wheel`
- Enemy column h2 = "Enemy Guilds"
- Enemy explanation contains "opposite" ("...colors from opposite sides of the circle")
- Allied wheel still has exactly 5 `.ally-line` groups
- No stuck highlights present at test start

---

## Observability Note

No new telemetry attributes were specified for Arc 9. The existing `session.enemy_unlocked` attribute (from Arc 8) continues to function. Structural verification passed; no runtime version marker was updated for this arc (no version bump specified).

---

## Summary

All 130 checks passed across 10 test phases. Arc 9 behavior is fully verified:

1. Allied pentagon wheel continues to work correctly (regression confirmed)
2. Enemy star wheel appears when `enemyUnlocked: true`
3. Star pattern connects the correct non-adjacent color pairs for all 5 enemy guilds
4. Hover and tap-to-select work on both enemy lines and enemy list items
5. Background click deselects
6. Allied and enemy wheels operate independently with simultaneous selection
7. Structural separation between ally-line and enemy-line classes is clean
8. Enemy content appears after a stopped (not just completed) enemy session

**Arc 9 is complete.**
