# Crest + Tap-to-Select Verification

**Date:** 2026-02-25
**Arc:** Arc 8 (session end screen redesign — guild crest + tap-to-select)
**Test script:** `scripts/test-crest-tap.mjs`
**Result: PASS — 56/56 tests passed, 0 failures**

---

## Features Verified

### 1. Guild Crest in Center of Pentagon

The `#crest-image` SVG `<image>` element is rendered at the center of the pentagon (x=150, y=150, 100×100px). On hover or click-select of any line or guild list item, its `opacity` attribute transitions to `"1"` and `href` is set to the correct PNG path. On unhover / deselect, opacity returns to `"0"`.

All 5 crests mapped correctly:
- `line-white-blue` → `images/azorius.png`
- `line-blue-black` → `images/dimir.png`
- `line-black-red` → `images/rakdos.png`
- `line-red-green` → `images/gruul.png`
- `line-green-white` → `images/selesnya.png`

### 2. Tap-to-Select (Mobile)

Click/tap behavior on lines and guild list items:

| Scenario | Result |
|---|---|
| Click line | Highlight + crest appear and persist after mouseleave |
| Click same line again | Highlight + crest cleared (deselect) |
| Click different line | Previous deselected, new highlighted with correct crest |
| Click outside (column background, header) | Selection dismissed, crest hidden |
| Click guild list item | Same select/deselect behavior as clicking lines |
| Hover while pair selected | Hovered pair does NOT receive highlight; selected pair stays highlighted with correct crest |

---

## Phase-by-Phase Results

| Phase | Description | Result |
|---|---|---|
| 1 | Crest element present + initial opacity = 0 | 2/2 PASS |
| 2 | Hover crest visibility for all 5 lines | 15/15 PASS |
| 3 | Correct crest per color pair mapping | 5/5 PASS |
| 4 | Click to select — highlight + crest persist after mouseleave | 4/4 PASS |
| 5 | Click same line to deselect | 2/2 PASS |
| 6 | Click different line to switch | 4/4 PASS |
| 7 | Click elsewhere to dismiss | 3/3 PASS |
| 8 | Click guild list item — select/deselect behavior | 6/6 PASS |
| 9 | Hover blocked by active selection | 4/4 PASS |
| 10 | Previous features intact (header, 5 items, locked enemy, 8px lines, no stuck state) | 11/11 PASS |

**Total: 56 passed, 0 failed**

---

## Screenshots

- `scripts/crest-tap-hover-azorius.png` — Azorius line hovered, crest visible in pentagon center
- `scripts/crest-tap-selected-stays.png` — Azorius selected via click, crest persists after mouse moved away
- `scripts/crest-tap-dimir-list-selected.png` — Dimir selected via list item click, dimir crest shown

---

## Notes

- The `opacity` attribute (not CSS) is used for fade — Playwright can read this directly via `getAttribute('opacity')`. The CSS `transition: opacity 150ms` is present in the DOM but Playwright's headless mode still confirmed the final opacity value correctly.
- Hit areas remain 24px stroke-width (well above the 12px minimum threshold).
- Enemy column remains locked throughout (no regression).
