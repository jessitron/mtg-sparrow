# UI Tweaks Verification

**Date:** 2026-02-25
**Test script:** `scripts/test-ui-tweaks.mjs`
**Screenshot:** `scripts/ui-tweaks-screenshot.png`

## Summary

**FAIL** — 13 passed, 1 failed

---

## Tweak 1: Allied lines are 8px thick

**PASS**

All 5 `.ally-line-vis` SVG line elements have `stroke-width="8"` as set in `buildAlliedColorWheel()` in `src/main.ts`.

```
Found 5 .ally-line-vis elements: 8, 8, 8, 8, 8
PASS: All .ally-line-vis elements have stroke-width="8"
```

---

## Tweak 2: Column header is centered

**PASS**

`.guild-column-header` has `text-align: center` in `style.css` (line 311). Computed style confirmed by Playwright:

```
Computed text-align on .guild-column-header: "center"
PASS: Allied Guilds header has computed text-align: center
```

---

## Tweak 3: Locked enemy column — no teaser text, button only, vertically centered

**PARTIAL FAIL**

### Sub-checks that passed:
- `.guild-column--locked` element is present
- No `<p>` elements in the locked column (0 found) — teaser text removal confirmed
- No `.guild-column-explanation` element in locked column
- "Learn enemy guilds" button is present with correct text
- Computed `justify-content: center` on locked column
- Computed `align-items: center` on locked column

### Sub-check that failed:
**Button is NOT visually vertically centered in the column**

```
Column mid: 476.9, Button mid: 797.8, Offset: 321.0, Tolerance: 104.4
FAIL: Button is vertically centered in locked column (offset 321.0px ≤ tolerance 104.4px)
```

### Root cause

The CSS has a conflict:

- `.guild-column--locked` sets `justify-content: center` (intended to center the button)
- `.guild-column-button` sets `margin-top: auto`

In a flex column, `margin-top: auto` on a child consumes all available space above that child, pushing it to the bottom. This overrides `justify-content: center`.

**Visual result (confirmed in screenshot):** The "Learn enemy guilds" button appears at the bottom of the enemy column, aligned horizontally with the "Learn allied guilds" button at the bottom of the allied column. It is NOT centered in its column's available height.

The `justify-content: center` rule is correctly written but the `margin-top: auto` on `.guild-column-button` (which applies to ALL column buttons, including the locked enemy button) defeats it.

---

## Fix Required

Remove or override `margin-top: auto` on the button within the locked column context. For example:

```css
.guild-column--locked .guild-column-button {
  margin-top: 0;
}
```

This would allow `justify-content: center` to take effect and center the single button vertically.

---

## Files Checked

- `/Users/jessitron/code/jessitron/sparrow-deck/src/main.ts` — `buildEnemyColumn()` and `buildAlliedColorWheel()`
- `/Users/jessitron/code/jessitron/sparrow-deck/style.css` — `.guild-column--locked`, `.guild-column-button`, `.guild-column-header`
