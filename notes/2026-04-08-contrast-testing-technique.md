# Contrast Testing via Screenshot Diff

## Problem

How do you test whether all text on a page has sufficient contrast against its actual rendered background — accounting for gradients, backdrop-filter, layered elements, images, and non-rectangular containers?

## Technique: Two-Screenshot Diff

### Core Idea

Take two screenshots of the same page: one with text visible, one with text hidden. The pixel difference tells you exactly where glyphs are and what colors are involved.

### Steps

1. **Collect all text elements** on the page
2. **Screenshot A**: page as-is (text + background)
3. **Hide all text**: set `visibility: hidden` on each text element (preserves layout)
4. **Screenshot B**: page without text (background only)
5. **For each text element's bounding rect**:
   - Compare pixels in A vs B
   - Any pixel that changed = a glyph pixel
   - Color in A at that pixel = text color
   - Color in B at that pixel = background color
   - Compute WCAG contrast ratio
6. **Restore visibility**

### Why the diff matters

You can't just sample the center of a text element — you might hit whitespace between words or between lines. The diff tells you exactly which pixels have ink, so you're always measuring real glyph-on-background contrast.

### Contrast ratio math

WCAG 2.1 formula: relative luminance of lighter color + 0.05, divided by relative luminance of darker color + 0.05.

- **WCAG AA**: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold)
- **WCAG AAA**: 7:1 for normal text, 4.5:1 for large text

### Example output

```
.welcome-heading: contrast 12.4:1 ✅ (WCAG AAA)
.subtitle:        contrast 3.8:1 ⚠️  (WCAG AA only)
.footer-link:     contrast 2.1:1 ❌  (fails WCAG AA)
```

Could also annotate a screenshot with red boxes around failing elements — a visual report of visual problems.

### Performance

- One Playwright page load: ~1-2s
- Two screenshots: ~200-400ms
- Pixel math per element: negligible
- Full page check: ~2-3 seconds total

### Consider axe-core first

[axe-core](https://github.com/dequelabs/axe-core) is a standard accessibility testing library that checks color contrast (among other things). It integrates into Playwright via `@axe-core/playwright`.

- It handles the 90% case: text on solid backgrounds, standard CSS colors
- It understands WCAG large-text thresholds automatically
- It reports results as "violations" (definite fails) vs "incomplete" (needs manual review)

**Where axe-core may punt**: `backdrop-filter`, `color-mix()` with transparency, layered/overlapping elements, images behind text. These show up as "incomplete" — axe-core can't determine the effective background.

**Recommended approach**: Start with axe-core. See what it catches and what it flags as incomplete. The screenshot-diff technique above fills the gap for cases axe-core can't resolve — but this site may not need it if backgrounds are straightforward enough for axe-core to handle.

### Implementation context

- Runs in Playwright (headless Chrome)
- Screenshots via `page.screenshot()` → pixel data via node-canvas
- DOM queries via `page.evaluate()` for element positions
- Pairs with the [visual fit test](2026-04-08-visual-fit-testing-technique.md) — same page load, shared screenshots
