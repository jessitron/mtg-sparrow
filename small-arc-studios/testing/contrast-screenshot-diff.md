# Screenshot-Diff Contrast Technique

## How It Works

1. Collect all text elements on the page with their bounding rects, font sizes, and weights
2. **Screenshot A**: page as rendered (text + background)
3. Hide all text elements via `visibility: hidden` (preserves layout)
4. **Screenshot B**: page without text (background only)
5. For each text element's bounding rect:
   - Compare pixels between A and B
   - Pixels that changed = glyph pixels (where ink meets background)
   - Color in A at glyph pixel = text color
   - Color in B at glyph pixel = background color
   - Compute WCAG 2.1 contrast ratio
6. Restore visibility

## Why the Diff Matters

You can't just sample the center of a text element — you might hit whitespace between words or between lines. The diff tells you exactly which pixels have ink, so you're always measuring real glyph-on-background contrast.

## WCAG Thresholds

- **AA normal text**: 4.5:1
- **AA large text** (18pt+ or 14pt+ bold): 3:1
- **AAA normal text**: 7:1
- **AAA large text**: 4.5:1

## Current Implementation

`tests/contrast-screenshot-diff.mjs` — standalone Playwright script using `pngjs` for PNG decoding.

Run: `npm run test:contrast-diff` (requires test server at localhost:3847)

## Bugs Found and Fixed

### Bug 1: Wrong color readings — `visibility: hidden` removes backgrounds

**Symptom:** BEGIN button reported 1.4:1 contrast (text #404838 on bg #303018). Actual contrast is 7.2:1.

**Root cause:** The original technique used `visibility: hidden` on text elements' parent. For elements with semi-transparent or styled backgrounds (like buttons), this hides the entire element including its background. The diff then sees the underlying page background where the button was, and nearly every pixel in the rect "changes" — making the mode color reflect the semi-transparent fill, not the actual text.

**Fix:** Use `color: transparent` instead. This hides only the text rendering while preserving the element's background, borders, and layout.

### Bug 2: Elements skipped — below-fold content invisible in viewport screenshots

**Symptom:** 25 of 30 About page elements had "0 glyph pixels." The page is 1289px tall, viewport is 800px.

**Root cause:** `page.screenshot()` captures only the viewport. `getBoundingClientRect()` returns coordinates relative to the page when scroll is at 0, so below-fold elements have rects pointing past the screenshot's pixel space.

**Fix:** Use `page.screenshot({ fullPage: true })` and compare against `pngA.width/height` instead of viewport dimensions. Coordinates from `getBoundingClientRect()` at scroll=0 map directly to full-page screenshot pixel positions.

### Bug 3: CSS transitions defeat instant hiding

**Symptom:** Links with `transition: color 200ms ease` still showed 0 glyph pixels even after the `color: transparent` fix.

**Root cause:** Setting `color: transparent` triggers a 200ms CSS transition. The screenshot captures a mid-transition frame where text is still mostly visible, so the A/B diff is near-zero.

**Fix:** Inject `* { transition: none !important; }` into the page before hiding text. This ensures `color: transparent` applies in the same frame.

## Open Questions

### Color quantization error

Colors are quantized to nearest-8 for mode calculation. This means a true #FFFFFF could become #F8F8F8, changing the contrast ratio. The impact on pass/fail decisions hasn't been quantified yet. Worst case: a color at the boundary of a quantization bucket shifts by ±4 per channel, which could change a contrast ratio by ~0.1–0.3 points. This probably doesn't flip pass/fail decisions except at the margin.

## Design Decisions

- **`color: transparent`** not `visibility: hidden` — preserves element backgrounds and borders
- **`* { transition: none !important }`** — ensures instant color changes for the diff
- **`fullPage: true` screenshots** — captures below-fold content
- **`deviceScaleFactor: 1`** — keeps CSS pixel rects aligned with screenshot pixel coordinates
- **Mode color** (most common) rather than average — averages blur antialiased edges
- **`GLYPH_DELTA_THRESHOLD = 30`** — minimum per-channel difference to count a pixel as a glyph
- **`MIN_GLYPH_PIXELS = 3`** — elements with fewer glyph pixels are skipped as too ambiguous

## Improvement Roadmap

1. ~~Fix wrong color readings (BEGIN button)~~ — FIXED: use `color: transparent`
2. ~~Fix element skipping (below-fold)~~ — FIXED: full-page screenshots
3. ~~Fix CSS transition interference~~ — FIXED: disable transitions
4. Evaluate whether color quantization introduces meaningful error
5. Add verbose/debug mode that saves intermediate screenshots and per-element analysis
6. Annotated screenshot output: overlay red boxes on failing elements
7. Generalize beyond mtg-sparrow pages — parameterize the page+state matrix
8. Extend to all page+state combinations (currently 4 pages, target 12)
