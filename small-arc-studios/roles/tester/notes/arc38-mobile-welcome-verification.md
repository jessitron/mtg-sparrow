# Arc 38: Mobile Welcome & Responsiveness — Verification

## Date: 2026-03-08

## Results: 20/20 PASS

### Acceptance Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Desktop unchanged at 1024px+ (heading, paragraph, list, button) | PASS |
| 2 | Mobile content at 375px (condensed heading, short list, Start button) | PASS |
| 3 | No paragraph on mobile | PASS |
| 4 | Mobile "Start" button navigates to slides | PASS |
| 5 | Desktop "Learn guild names" button navigates to slides | PASS |
| 6 | Mobile button >= 44px height (measured 60.78px) | PASS |
| 7 | No horizontal scrolling at 375px (scrollWidth == 375) | PASS |
| 8 | Mana gas doesn't block clicks (button enabled + clickable) | PASS |

## Implementation Notes

- Responsive switching uses CSS `display: none` / `display: contents` on `.welcome-desktop` and `.welcome-mobile` divs
- Media query breakpoint at 600px
- Two completely separate content blocks in HTML (not just restyled)
- Mobile button gets `min-height: 44px` via CSS, actual rendered height was ~61px
- Canvas is behind content so no pointer-events issue

## Test Approach

- Used `page.setViewportSize()` via browser context `viewport` option to test both sizes
- Verified visibility of desktop/mobile divs, text content, navigation behavior
- Measured actual button bounding box for tap target compliance
- Checked `document.documentElement.scrollWidth` for overflow detection

## Test Script

`tests/arc38-mobile-welcome.mjs`
