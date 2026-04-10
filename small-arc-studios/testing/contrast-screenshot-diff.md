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

## Known Issues (to fix)

### Wrong color readings on some elements

The BEGIN button on the welcome page reported 1.4:1 contrast with text color #404838 on bg #303018. This is clearly wrong — it's a white button on a dark background. Likely causes:

- **Color quantization**: colors are rounded to nearest 8, which could shift values significantly for light or saturated colors
- **Antialiasing sampling**: the glyph delta threshold (30) may be catching subpixel rendering artifacts rather than true glyph pixels
- **Mode color calculation**: if antialiased edge pixels outnumber core glyph pixels, the mode could reflect edge colors rather than the true text color

**Status: Not yet investigated.** This is the highest priority bug.

### 25 elements skipped on About page

The About page reported 25 elements with "no glyph pixels found." These are likely below-the-fold elements whose bounding rects fall outside the viewport screenshot.

Current approach uses `page.screenshot()` (viewport only), but `getBoundingClientRect()` returns positions relative to the viewport — so elements scrolled out of view have rects that don't correspond to any screenshot pixels.

**Possible fixes:**
- Scroll to each element before capturing
- Use full-page screenshots with adjusted coordinate mapping
- Capture elements in batches, scrolling between batches

**Status: Not yet investigated.** This is the second priority bug.

### Color quantization may introduce error

Colors are quantized to nearest-8 for mode calculation. This means a true #FFFFFF could become #F8F8F8, changing the contrast ratio. The impact on pass/fail decisions needs quantification.

**Status: Not yet investigated.**

## Design Decisions

- `deviceScaleFactor: 1` — keeps CSS pixel rects aligned with screenshot pixel coordinates
- Mode color (most common) rather than average — averages blur antialiased edges
- `GLYPH_DELTA_THRESHOLD = 30` — minimum per-channel difference to count a pixel as a glyph
- `MIN_GLYPH_PIXELS = 3` — elements with fewer glyph pixels are skipped as too ambiguous

## Improvement Roadmap

1. Fix wrong color readings (investigate BEGIN button case)
2. Fix element skipping (handle below-fold elements)
3. Evaluate whether color quantization introduces meaningful error
4. Add verbose/debug mode that saves intermediate screenshots and per-element analysis
5. Annotated screenshot output: overlay red boxes on failing elements
6. Generalize beyond mtg-sparrow pages — parameterize the page+state matrix
