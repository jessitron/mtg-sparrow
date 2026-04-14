# Arc 81 Tester Notes — Sharp Edges at Scroll Boundaries

**Arc:** 81  
**Feature:** Contextual CSS mask-image on `.level-sections-viewport` based on scroll position  
**Test file:** `tests/arc-081-sharp-scroll-edges.mjs`  
**Date:** 2026-04-13  
**Result:** PASS (18/18)

## What Was Verified

The end page reel viewport now applies contextual `mask-image` gradients:

| State | Classes | Mask behavior |
|-------|---------|---------------|
| First section | `at-top` | Top sharp (black 0%), bottom fades |
| Middle sections | (neither) | Both edges fade |
| Last section (Share) | `at-end` | Top fades, bottom sharp (black 100%) |
| Only one section | `at-top at-end` | No masking |

## Test Coverage

1. **Version check**: `dist/end.js` contains `0.50.0` ✓
2. **Initial state**: viewport has `at-top`, lacks `at-end`; top nav hidden, bottom nav visible ✓
3. **Mask at top**: computed `mask-image` starts with `rgb(0,0,0) 0%` (sharp), ends with `rgba(0,0,0,0) 100%` (fades) ✓
4. **After one advance**: `at-top` removed, `at-end` not present (still in middle) ✓
5. **At last section**: viewport has `at-end`, lacks `at-top`; top nav visible, bottom nav hidden ✓
6. **Mask at last section**: computed mask starts with `rgba(0,0,0,0) 0%` (fades), ends with `rgb(0,0,0) 100%` (sharp) ✓

## Implementation Notes

- The end page is at `/end` (not `/#end` or `index.html`)
- The reel has 6 sections: 5 level columns (colleges, allied, enemy, wedges, shards) + Share
- Transition is 600ms — tests wait 800ms after each nav click
- Chromium reports mask-image values using rgb/rgba notation in computed styles:
  - Sharp edge: `rgb(0, 0, 0)` 
  - Faded edge: `rgba(0, 0, 0, 0)`
- The `-webkit-mask-image` property mirrors `mask-image` in Chromium — only one check needed

## Key selectors tested

- `.level-sections-viewport` — the reel container (classes: `at-top`, `at-end`)
- `.reel-nav-btn--top` / `.reel-nav-btn--bottom` — nav arrows
- `.reel-nav-btn--hidden` — applied when at boundary and arrow is inactive
