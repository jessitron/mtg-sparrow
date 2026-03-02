# Arc 23 — Guild Descriptions, Scryfall Links, and Telemetry Verification

**Date:** 2026-03-02
**Arc:** Arc 23 — Wire guild descriptions into flavor panel, add Scryfall links and iconic cards
**Version:** v0.19.0 (no version bump in this arc)
**Result:** PASS — 36/36 checks pass

---

## Summary

Guild flavor descriptions are now wired into the end screen flavor panel. On highlight:
- Guild name appears (`.level-section-flavor-name`)
- Full flavor description appears (`.level-section-flavor-desc`, ~400 chars for Azorius)
- Scryfall link appears (`.level-section-scryfall-link`) with text "More [Guild] cards →" and
  a color-filtered scryfall.com URL

On unhighlight: all three elements clear. The Practice button is always visible in the flavor
panel regardless of highlight state.

New telemetry spans:
- `end.guild_highlight` with `guild.id` on each guild hover
- `end.scryfall_click` with `guild.id` on Scryfall link click

Both confirmed in Honeycomb. Multiple guilds observed (azorius, dimir, gruul, izzet) from
automated test runs.

---

## Key Design Notes

- **CSS class rename**: `guild-column--*` → `level-section--*`, `guild-column-*` → `level-section-*`.
  This was a polish commit in Arc 22 not previously recorded in tester notes — Arc 22 tests used
  the OLD class names and still passed at the time (pre-Arc 22 polish). The arc23 test uses
  the new names.

- **Practice button moved**: From `.level-section-summary` into `.level-section-flavor` panel.
  Button text changed from `"Practice allied guilds"` to just `"Practice"` when completed.

- **Flavor panel structure** (unlocked column, 4 elements):
  1. `.level-section-flavor-name` — guild name (opacity: 0 → 1 on highlight via CSS)
  2. `.level-section-flavor-desc` — description text (opacity: 0 → 1 on highlight)
  3. `.level-section-scryfall-link` — anchor (opacity: 0 → 1 on highlight)
  4. `.next-session-button.level-section-button` — always visible

- **Scryfall link**: `target="_blank"`, `rel="noopener noreferrer"`. Clicking opens new tab
  and fires `end.scryfall_click` span via click handler before browser handles navigation.

- **SVG hover interception**: Playwright's `.hover()` fails on SVG sub-elements when the parent
  SVG intercepts pointer events — especially for elements lower on the page (enemy wheel).
  Use `page.$eval(id, el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })))`
  for reliable SVG event dispatch in tests.

---

## Iconic Cards Confirmed in Data

| Guild | Card | Added? |
|-------|------|--------|
| Azorius | Azor, the Lawbringer | ✓ Already present |
| Selesnya | Voice of Resurgence | ✓ Added in Arc 23 |
| Golgari | Savra, Queen of the Golgari | ✓ Added in Arc 23 |
| Boros | Aurelia, the Warleader | ✓ Already present |

---

## Test Results by Phase

### Phase 1: Bundle markers (Tests 1–6)
- PASS: dist/end.js HTTP 200
- PASS: `end.guild_highlight` span name in bundle
- PASS: `end.scryfall_click` span name in bundle
- PASS: `guild.id` attribute key in bundle
- PASS: Azorius description text in bundle ("insufferable")
- PASS: scryfall.com URLs in bundle

### Phase 2: Hover allied guild — description and link appear (Tests 7–16)
- PASS: `.level-section-flavor-desc` element present
- PASS: `.level-section-scryfall-link` element present
- PASS: Description empty before hover
- PASS: `#line-white-blue` exists
- PASS: Flavor name "Azorius" on hover
- PASS: Description 408 chars on hover
- PASS: Description contains "insufferable" (Azorius snippet)
- PASS: Scryfall link text "More Azorius cards →"
- PASS: Scryfall link href points to scryfall.com
- PASS: Scryfall link href contains W+U filter

### Phase 3: Scryfall link attributes (Tests 17–18)
- PASS: target="_blank"
- PASS: rel contains "noopener"

### Phase 4: Unhighlight clears all (Tests 19–22)
- PASS: Description populated during hover
- PASS: Description clears after mouse leave
- PASS: Scryfall link text clears
- PASS: Guild name clears

### Phase 5: Enemy guild Izzet (Tests 23–27)
- PASS: `#line-blue-red` exists
- PASS: Flavor name "Izzet"
- PASS: Description contains "reckless"
- PASS: Link text "More Izzet cards →"
- PASS: Link href points to scryfall.com

### Phase 6: Practice button always visible (Tests 28–30)
- PASS: Button inside `.level-section-flavor` panel
- PASS: Visible without hover
- PASS: Text is "Practice" (completed subgroup)

### Phase 7: Iconic cards in bundle (Tests 31–34)
- PASS: Azor the Lawbringer (Azorius)
- PASS: Voice of Resurgence (Selesnya)
- PASS: Savra (Golgari)
- PASS: Aurelia (Boros)

### Phase 8: Scryfall click telemetry (Tests 35–36)
- PASS: Scryfall link populated before click
- PASS: Click fires (popup opened and closed)

### Phase 9: Span flush (35s wait for OTel batch)

---

## Honeycomb Telemetry

Queried `sparrow-deck` for `name in [end.guild_highlight, end.scryfall_click]` in last 1 hour.

**10 spans confirmed:**

`end.guild_highlight` spans — guild.id values observed:
- `azorius` (multiple)
- `dimir`
- `gruul`
- `izzet`

`end.scryfall_click` spans:
- `guild.id = 'azorius'` ✓

All spans have `app.page = 'end'`, `app.navigation = 'multi_page'`, `service.version = 0.19.0`.

---

## Acceptance Criteria Coverage

| Criterion | Result | How |
|-----------|--------|-----|
| Highlighting shows full flavor description | ✅ | Phase 2 |
| Scryfall link with "More [Guild] cards →" text | ✅ | Phase 2 |
| Scryfall link opens in new tab (target=_blank) | ✅ | Phase 3 |
| Descriptions readable on mobile (element present) | ✅ | Phase 2 (structure) |
| Iconic cards added to data | ✅ | Phase 7 |
| end.guild_highlight span in Honeycomb | ✅ | Honeycomb |
| end.scryfall_click span in Honeycomb | ✅ | Honeycomb |
| Unhighlighting clears description | ✅ | Phase 4 |

---

## Test Script

`tests/arc23-guild-descriptions.mjs` — 36 assertions across 8 phases + span flush

---

## Lessons Learned

- **SVG hover interception (enemy wheel)**: Playwright `.hover()` on SVG `<g>` sub-elements
  can fail with "element is not stable" when the parent SVG intercepts pointer events. This is
  particularly an issue for elements that require scrolling into view or are mid-animation.
  Use `page.$eval(id, el => el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })))`
  as a reliable alternative — it bypasses Playwright's hover mechanics and fires the event
  directly. The `bubbles: true` is needed for event delegation to work correctly.

- **Arc 22 polish renamed all CSS classes**: `guild-column--*` → `level-section--*`. The arc22
  tests were committed before the polish commit, so they use the old names. Future arc22
  regression runs would fail. Consider updating arc22 tests or noting this in the test header.
