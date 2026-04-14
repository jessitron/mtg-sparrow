# Arc 80 Verification: Slide Width Fix (v0.49.0)

## What Was Tested

The fix for card width varying between slides when different-width college names were active.

**Root cause of bug:** Previously only the current slide's name was in the DOM (opacity:0 but still
influencing layout). "Witherbloom" is wider than other college names, so its slide showed a wider card.

**Fix:** All 5 pool names are now rendered in a `.card-name-stack` CSS grid, stacked in the same cell
(`grid-area: 1/1`). All are `visibility: hidden` except the active one. The widest name always
determines the card width, so the card width never changes between slides.

## Test Script

`tests/arc-080-slide-width.mjs`

## Results

10/10 PASS on first run.

### Checks

1. `dist/slides.js` contains "0.49.0" — PASS
2. `.card-name-stack` exists in DOM — PASS
3. Exactly 5 `.card-name` elements in stack — PASS
4. Exactly 1 has `data-active="true"` — PASS
5. Active name is visible after 3s reveal delay — PASS
6. Active name does not have `card-name-hidden` class after reveal — PASS
7. All 4 measured card widths identical (557px each) — PASS
   - Slides measured: Quandrix (557px), Silverquill (557px), Quandrix (557px), Silverquill (557px)
8. Non-active names have `visibility:hidden` (computed style) — PASS
9. Active name has `visibility:visible` (computed style) — PASS

## Honeycomb Observability

- Version 0.49.0 confirmed in traces (6 spans: 3 unnamed root spans + 3 card spans)
- Appears in `sparrow-deck` dataset, environment `sparrow-deck`

## Timing Note

Each card cycle is REVEAL_DELAY_MS (3000ms) + ADVANCE_DELAY_MS (2000ms) = 5000ms total.
The test uses 5300ms per cycle (300ms buffer for crossfade) and measures width 1500ms into each cycle.

## Key Pattern

For width-consistency tests: measure `boundingBox().width` via `page.locator('.card').first().boundingBox()`.
Round to integer pixels — sub-pixel differences from subpixel rendering are not meaningful here.

## CSS Mechanism

```css
.card-name-stack {
  display: grid;
}
.card-name-stack .card-name {
  grid-area: 1 / 1;
  visibility: hidden;
}
.card-name-stack .card-name[data-active="true"] {
  visibility: visible;
}
```

The key: all children share `grid-area: 1/1`, so the grid tracks expand to fit the widest child.
Width is fixed at the widest name, regardless of which is active.
