# Hover Highlight Verification Report

**Feature:** Bidirectional hover highlighting — Allied Guilds section
**Date:** 2026-02-25
**Tester:** Quality Engineer, Small Arc Studio
**Result:** PASS — all 134 checks passed, 0 failures

---

## What Was Verified

Bidirectional hover highlighting between the Allied Guilds color wheel SVG
and the guild list below it on the session end screen.

### Test Script

`scripts/test-hover-highlight.mjs` — run with `node scripts/test-hover-highlight.mjs`
against a local `http-server` on port 8085.

---

## Phase 1: Layout Structure

- Allied column (`.guild-column--allied`) present
- Allied color wheel SVG (`.allied-color-wheel`) present
- Guild list (`.guild-column-list`) present

---

## Phase 2: SVG Elements Present

All 5 line groups confirmed present with correct IDs:

| Guild    | Line ID              | Hit Line | Vis Line |
|----------|----------------------|----------|----------|
| Azorius  | `#line-white-blue`   | PASS     | PASS     |
| Dimir    | `#line-blue-black`   | PASS     | PASS     |
| Rakdos   | `#line-black-red`    | PASS     | PASS     |
| Gruul    | `#line-red-green`    | PASS     | PASS     |
| Selesnya | `#line-green-white`  | PASS     | PASS     |

All 5 color nodes present: `#node-white`, `#node-blue`, `#node-black`, `#node-red`, `#node-green`

All 5 guild list items present with `data-guild-id` attributes: azorius, dimir, rakdos, gruul, selesnya

---

## Phase 3: No Highlights on Initial Load

- No `.guild-column--has-highlight` on initial load
- No `.ally-line.highlight` on initial load
- No `.color-node.highlight` on initial load
- No `.guild-column-item.highlight` on initial load

---

## Phase 4: SVG Line Hover — All 5 Pairs

For each allied pair, hovering the line group element produces:

- `.highlight` class on the line group itself
- `.highlight` class on both endpoint color nodes (scale-up via CSS transform)
- `.highlight` class on the matching guild list item (warm background)
- `.guild-column--has-highlight` on the allied column (dimming other elements)

All highlight states clear completely when mouse leaves (no stuck state).

Tested: Azorius, Dimir, Rakdos, Gruul, Selesnya — all PASS

**Screenshot:** `scripts/hover-highlight-screenshot-line.png` (Azorius line highlighted)

---

## Phase 5: Guild List Item Hover — All 5 Pairs

For each guild list item, hovering produces:

- `.highlight` on the list item itself
- `.highlight` on the matching SVG line group
- `.highlight` on both endpoint color nodes
- `.guild-column--has-highlight` on the allied column

All highlight states clear completely when mouse leaves.

Tested: Azorius, Dimir, Rakdos, Gruul, Selesnya — all PASS

**Screenshot:** `scripts/hover-highlight-screenshot-list.png` (Azorius list item highlighted)

---

## Phase 6: No Stuck Highlights

After completing all hover tests:

- No stuck `.ally-line.highlight`
- No stuck `.color-node.highlight`
- No stuck `.guild-column-item.highlight`
- No stuck `.guild-column--has-highlight`

---

## Phase 7: Layout Integrity

After all hover testing, the layout is intact:

- Allied column header still reads "Allied Guilds"
- Allied column still shows 5 guild items
- Enemy column still present

---

## Phase 8: Wide Hitbox Verification

All 5 hit-area lines have `stroke-width="16"`, well above the 12px minimum
required for comfortable hovering. The transparent hit-area line sits behind
the visible 2px line, making lines easy to hover without precise cursor placement.

---

## Acceptance Criteria Confirmation

1. **Hover a line in the SVG** — line, both nodes, matching list item all get `.highlight`. PASS
2. **Hover a guild list item** — matching line, both nodes, list item all get `.highlight`. PASS
3. **Non-highlighted elements dim** via `.guild-column--has-highlight` on the column. PASS
4. **All 5 allied pairs work**: Azorius (W+U), Dimir (U+B), Rakdos (B+R), Gruul (R+G), Selesnya (G+W). PASS
5. **Highlight clears cleanly** on mouse leave — no stuck highlights confirmed. PASS
6. **Lines have wide hover hitboxes** — transparent 16px stroke behind 2px visible line. PASS
7. **Existing layout not broken** — both columns still render correctly. PASS

---

## Summary

All 134 checks passed. Bidirectional hover highlighting is fully verified across
all 5 allied pairs, in both directions (line-to-list and list-to-line), with
clean state management (no stuck highlights) and wide hitboxes for comfortable
interaction.

**The hover highlight feature is verified. Arc delivery may proceed.**
