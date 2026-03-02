# Arc 19 — End Page Verification

**Date:** 2026-03-02
**Arc:** Arc 19 — Create end.html + src/end.ts
**Version:** v0.17.0
**Result:** PASS — 32/32 checks pass

---

## Summary

end.html is a fully functional standalone page. Both guild columns render (locked or unlocked
based on localStorage). With progression set, the allied column shows color wheel, guild list
with 5 items, and "Practice allied guilds" button. Color wheel hover highlights line + list item.
Navigation button links correctly to slides.html. Settings gear works at v0.17.0.

Honeycomb confirmed 3 spans including the custom `session.summary` span with all expected
attributes (session.card_count, session.completed, session.self_assessment, session.subgroup).

---

## Key Design Notes

- **Display driven by localStorage, NOT URL params.** URL params (subgroup, cards, completed,
  assessment) are only used to record the `session.summary` span. The guild column content
  (locked/unlocked) comes from `localStorage['sparrow-deck.progression']`.

- **Both columns always present.** Even with no localStorage, both `.guild-column--allied` and
  `.guild-column--enemy` are rendered — but with `.guild-column--locked` class and no content,
  just the navigation button.

- **URL params preserved** when using clean URL format `/end?params` (not `end.html?params`).
  The session.summary span was confirmed to have `session.subgroup=allied`, `session.card_count=10`,
  `session.self_assessment=getting_there`, `session.completed=true`.

---

## Test Results by Phase

### Phase 1: Bundle telemetry markers (Tests 1–8)
- PASS: dist/end.js serves HTTP 200
- PASS: version `0.17.0` in bundle
- PASS: `app.page` attribute key
- PASS: `'end'` page value
- PASS: `app.navigation` attribute key
- PASS: `multi_page` navigation value
- PASS: `session.summary` span name
- PASS: `app.version` attribute key

### Phase 2: Fresh page — both columns locked (Tests 9–15)
- PASS: `.guild-columns` container present
- PASS: `.guild-column--allied` present
- PASS: `.guild-column--enemy` present
- PASS: Allied column has `.guild-column--locked` (no localStorage)
- PASS: Enemy column has `.guild-column--locked` (no localStorage)
- PASS: Allied locked column still has navigation button
- PASS: Enemy locked column still has navigation button

### Phase 3: Allied unlocked via localStorage (Tests 16–21)
- PASS: Allied column is unlocked (no `.guild-column--locked`)
- PASS: Header says "Allied Guilds"
- PASS: `.allied-color-wheel` SVG is present
- PASS: Guild list present
- PASS: Guild list has 5 items
- PASS: Button says "Practice allied guilds" (since completedSubgroups includes allied)

### Phase 4: Navigation button → slides.html (Tests 22–23)
- PASS: Clicking allied button navigates toward `/slides`
- NOTE: Serve strips params from `slides.html?...` redirect; nav confirmed by URL path
  (slides URL params subgroup=allied&from=session_end_screen verified in code, not capturable)

### Phase 5: Color wheel hover (Tests 24–27)
- PASS: `#line-white-blue` group exists in allied SVG
- PASS: `#line-white-blue` gains `.highlight` class on mouseenter
- PASS: Azorius list item gains `.highlight` on hover
- PASS: `#line-white-blue` loses `.highlight` on mouseleave

### Phase 6: Direct access with URL params (Tests 28–29)
- PASS: End page loads at `/end?subgroup=allied&cards=10&completed=true&assessment=getting_there`
- PASS: Allied column renders (display from localStorage)
- URL params preserved (clean URL format confirmed working)

### Phase 7: Settings gear (Tests 30–33)
- PASS: Gear button visible
- PASS: Settings panel opens
- PASS: Version shows "v0.17.0"
- PASS: Panel closes on close button

### Phase 8: Span flush
- End page kept alive 35s with URL params; session.summary span exported to Honeycomb.

---

## Honeycomb Telemetry

Queried `sparrow-deck` dataset for spans with `app.page = 'end'` in last 30 minutes.

**Result: 3 spans confirmed**

1. **TTFB** (web vitals) — `app.page=end`, `app.navigation=multi_page`, `service.version=0.17.0`,
   `mtg-sparrow.session.id=5cc76615af0fe8e8`
2. **FCP** (web vitals) — same session
3. **session.summary** (custom span) ✓
   - `name = 'session.summary'`
   - `app.page = 'end'`
   - `app.navigation = 'multi_page'`
   - `app.version = '0.17.0'`
   - `session.subgroup = 'allied'`
   - `session.card_count = 10`
   - `session.completed = true`
   - `session.self_assessment = 'getting_there'`
   - `mtg-sparrow.session.id` present ✓

All expected attributes on the session.summary span are correct.

---

## Acceptance Criteria Coverage

| Criterion | Result | How |
|-----------|--------|-----|
| end.html loads as standalone page | ✅ | Phase 2/6 |
| Both guild columns always render | ✅ | Phase 2 |
| Locked state when no progression | ✅ | Phase 2 |
| Allied column shows content when unlocked | ✅ | Phase 3 |
| Color wheel present | ✅ | Phase 3 |
| Guild list 5 items | ✅ | Phase 3 |
| Navigation button → slides.html | ✅ | Phase 4 |
| Color wheel hover highlights | ✅ | Phase 5 |
| Direct access with URL params | ✅ | Phase 6 |
| Settings gear works, version v0.17.0 | ✅ | Phase 7 |
| app.page='end' spans in Honeycomb | ✅ | Honeycomb |
| session.summary span with all attrs | ✅ | Honeycomb |
| mtg-sparrow.session.id on spans | ✅ | Honeycomb |

---

## Test Script

`tests/arc19-end-page.mjs` — 32 assertions across 7 phases + span flush

---

## Lessons Learned

- **localStorage must be set via `page.addInitScript()`** before page load, not after.
  The initScript runs before any page JavaScript, so localStorage is ready when DOMContentLoaded fires.

- **Display is independent of URL params**: End page always loads the column display from
  localStorage. URL params only affect which span attributes get recorded. This means the
  page is safe to access directly at any time.

- **session.summary span confirmed**: The custom span (not just web vitals) reached Honeycomb
  with all session attributes intact, including the assessment value.
