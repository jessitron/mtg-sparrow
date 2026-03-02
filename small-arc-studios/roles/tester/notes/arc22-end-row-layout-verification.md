# Arc 22 — End Screen Row Layout Verification

**Date:** 2026-03-02
**Arc:** Arc 22 — Restructure end screen to full-width row layout
**Version:** v0.19.0
**Result:** PASS — 36/36 checks pass

---

## Summary

End screen now renders each guild section (Allied, Enemy) as a full-width row with three panels:
- **Summary panel** (left): title, description, guild list, action button
- **Wheel panel** (center): color wheel SVG
- **Flavor panel** (right): guild name appears on hover

Layout uses CSS grid (`display: grid; grid-template-columns: 1fr minmax(220px, 320px) 1fr`)
on desktop, collapses to single column at mobile breakpoint (≤700px).

Flavor panel behavior is new: `.guild-column-flavor-name` starts invisible (`opacity: 0`),
transitions to visible when `.guild-column--has-highlight` is applied on hover. Text is set
by `wireColorWheelHover` via the `flavorNameEl` reference.

Honeycomb confirmed `session.summary` span with `end.layout_version = 'rows_v1'` attribute.

---

## Key Design Notes

- **Three-panel structure per row**: each unlocked `.guild-column` contains `.guild-column-summary`,
  `.guild-column-wheel`, and `.guild-column-flavor` as direct children (verified: exactly 3).
- **Locked state unchanged**: locked columns still use `display: flex` (not grid) and show
  only a centered button — same as Arc 19.
- **Flavor name driven by CSS opacity**: `guild-column-flavor-name` uses `opacity: 0` by default;
  `.guild-column--has-highlight .guild-column-flavor-name` sets `opacity: 1`. The text is set
  in JS but CSS controls visibility. Transition is 200ms.
- **Browser resolves grid columns to pixel values**: `getComputedStyle().gridTemplateColumns`
  returns resolved pixel values like `"341.333px 320px 341.333px"` (not the original CSS
  `"1fr minmax(220px, 320px) 1fr"`). Column count check splits on whitespace.
- **`addInitScript` runs in browser context**: Node.js variables are NOT available inside
  `addInitScript` callbacks. Always inline data or use the function argument form.

---

## Test Results by Phase

### Phase 1: Bundle telemetry markers (Tests 1–5)
- PASS: dist/end.js serves HTTP 200
- PASS: version `0.19.0` in bundle
- PASS: `end.layout_version` attribute key in bundle
- PASS: `rows_v1` layout version value in bundle
- PASS: `session.summary` span name in bundle

### Phase 2: Row structure — three panels per guild row (Tests 6–14)
- PASS: `.guild-columns` container present
- PASS: Allied row has `.guild-column-summary`
- PASS: Allied row has `.guild-column-wheel`
- PASS: Allied row has `.guild-column-flavor`
- PASS: Enemy row has `.guild-column-summary`
- PASS: Enemy row has `.guild-column-wheel`
- PASS: Enemy row has `.guild-column-flavor`
- PASS: Allied row has 3 child panels
- PASS: Enemy row has 3 child panels

### Phase 3: Desktop CSS grid — three-column layout (Tests 15–17)
- PASS: Allied column present for style check
- PASS: Allied column uses `display: grid` on desktop
- PASS: Allied column has 3 grid template columns (resolved: `"341.333px 320px 341.333px"`)

### Phase 4: Mobile layout — stacked (Tests 18–20)
- PASS: Allied column present at 400px viewport
- PASS: Single column at mobile (`"320px"` — one resolved value)
- PASS: All three panels present on mobile (just stacked vertically)

### Phase 5: Flavor panel shows guild name on highlight (Tests 21–26)
- PASS: Flavor name empty before hover
- PASS: `#line-white-blue` exists in allied SVG
- PASS: Flavor name shows "Azorius" on hover
- PASS: Allied column gains `.guild-column--has-highlight` class on hover
- PASS: Flavor name clears when mouse leaves

### Phase 6: Color wheel hover — line + list item highlight (Tests 27–31)
- PASS: `#line-white-blue` gains `.highlight` on hover
- PASS: Azorius guild list item gains `.highlight` on hover
- PASS: `#line-white-blue` loses `.highlight` on mouse leave
- PASS: `#line-white-black` exists in enemy SVG
- PASS: `#line-white-black` gains `.highlight` on hover (enemy wheel working)

### Phase 7: Existing functionality preserved (Tests 32–37)
- PASS: Allied column locked when no localStorage
- PASS: Enemy column locked when no localStorage
- PASS: Locked allied column still has navigation button
- PASS: Settings gear visible
- PASS: Settings panel opens
- PASS: Settings version shows "v0.19.0"

### Phase 8: Span flush
- End page kept alive 35s with URL params; `session.summary` span exported to Honeycomb.

---

## Honeycomb Telemetry

Queried `sparrow-deck` dataset for `name = 'session.summary'` with `end.layout_version exists`
in last 1 hour.

**Result: 1 span confirmed**

- `name = 'session.summary'`
- `end.layout_version = 'rows_v1'` ✓
- `app.page = 'end'`
- `app.navigation = 'multi_page'`
- `app.version = '0.19.0'`
- `service.version = '0.19.0'`
- `session.subgroup = 'allied'`
- `session.card_count = 10`
- `session.completed = true`
- `session.self_assessment = 'getting_there'`
- `mtg-sparrow.session.id` present ✓

---

## Acceptance Criteria Coverage

| Criterion | Result | How |
|-----------|--------|-----|
| Allied and enemy guilds each render as full-width row | ✅ | Phase 2 |
| Each row has three panels: summary, wheel, flavor | ✅ | Phase 2 |
| Color wheel interaction still works | ✅ | Phase 6 |
| Flavor panel shows guild name on highlight | ✅ | Phase 5 |
| Desktop: three-part grid layout | ✅ | Phase 3 |
| Mobile: stacked layout at ≤700px | ✅ | Phase 4 |
| Existing functionality preserved | ✅ | Phase 7 |
| `end.layout_version = 'rows_v1'` in Honeycomb | ✅ | Honeycomb |

---

## Test Script

`tests/arc22-end-row-layout.mjs` — 36 assertions across 7 phases + span flush

---

## Lessons Learned

- **`addInitScript` browser context**: Variables from Node.js scope are NOT available inside
  `addInitScript` callbacks. Must inline data directly in the function body, or pass them as
  arguments using the two-argument form: `page.addInitScript((data) => { ... }, data)`.

- **Grid column counting**: `getComputedStyle().gridTemplateColumns` on a live grid resolves
  `1fr` and `minmax()` to pixel values (e.g., `"341px 320px 341px"`). Splitting by whitespace
  gives the correct count. On a `display: flex` element (locked columns), this property may
  return the raw CSS value which can have spaces inside `minmax()` — be aware of this.

- **Flavor name opacity vs text**: The flavor name element always has text set in JS on hover,
  but becomes visible via CSS `opacity` transition. Testing `textContent` directly works for
  "shows guild name" — the element is present and has text even before it's visually opaque.
  Testing by checking `textContent === ''` for "empty" state also works since JS sets it to
  empty string on mouseleave.
