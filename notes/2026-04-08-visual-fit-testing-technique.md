# Visual Fit Testing Technique

## Problem

How do you test whether text fits inside a non-rectangular CSS shape (e.g. an element with `border-radius: 60% / 45%`)?

Standard overflow checks (`scrollWidth > clientWidth`) only detect rectangular overflow. They can't tell you if text visually pokes past curved edges.

The direction is not: does this particular text element fit within this particular background.
It is more general: what is behind this particular text?

## Technique: Range + elementFromPoint

1. Get the **rendered text bounds** (not the element box) using a `Range`:

```js
const title = document.querySelector('.welcome-heading');
const range = document.createRange();
range.selectNodeContents(title);
const textRect = range.getBoundingClientRect();
```

This returns the bounding box of the actual glyphs — tighter than the element's padding/border box.

2. Hide the text with `visibility: hidden` (preserves layout, unlike `display: none`).

3. Probe the corners with `elementFromPoint`:

```js
title.style.visibility = 'hidden';
[[textRect.left, textRect.top], [textRect.right, textRect.top],
 [textRect.left, textRect.bottom], [textRect.right, textRect.bottom]]
  .forEach(([x, y]) => {
    const el = document.elementFromPoint(x, y);
    console.log(`(${Math.round(x)},${Math.round(y)}):`, el?.className || el?.tagName);
  });
title.style.visibility = '';
```

If a corner is inside the rounded container, `elementFromPoint` returns the container (`.welcome`). If it's outside, it returns whatever is behind it (body, background element).

## Why this works

- `Range.getBoundingClientRect()` measures the **ink**, not the box
- `visibility: hidden` removes the element from hit-testing but keeps layout intact
- `elementFromPoint` asks "what's actually rendered here?" — it respects border-radius, clip-path, and any CSS shape
- No math, no assumptions about shape — works for ellipses, polygons, anything CSS can draw

## Where this applies

- Title in the welcome card (`border-radius: 60% / 45%`)
- Any text inside a non-rectangular container
- Could be automated in Playwright via `page.evaluate()`

## Key APIs

- `Range.getBoundingClientRect()` — actual rendered text bounds
- `element.style.visibility = 'hidden'` — hide from hit-testing, preserve layout
- `document.elementFromPoint(x, y)` — what element is rendered at this pixel?
