# Arc 24: Single-Section End Screen with Snap Navigation

## Arc Details
- **Type**: User Arc
- **Version**: v0.22.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS

## Background

This is the second implementation of Arc 24. The original implementation was reverted by the client — it did not match the desired interaction feel. The client provided clearer requirements and the team reimplemented from scratch.

## Intention

Transform the end screen from a multi-row stacked layout (rows_v1) into a single-section-at-a-time view with snap navigation (single_section_v1). One level fills the viewport at a time; header and footer buttons navigate between sections.

## Observable Outcome

The end screen shows one completed level at a time, filling the body area. Tapping the up or down arrow snaps to the adjacent section with a slot-machine feel. The header shows Home (first section) or an up arrow. The footer shows Down, or "Start [Level]" for a locked next level, or "Share" when all done. An empty state shows only a home link when nothing is unlocked.

## Acceptance Criteria — All Met

- [x] Single section fills the viewport body area
- [x] CSS scroll-snap-type: y mandatory on body container
- [x] Up arrow in header (except first section → Home button)
- [x] Down arrow in footer (except last section → "Start [Level]" or "Share")
- [x] Empty state: home link only, no sections
- [x] Guild content preserved (flavor text, color wheel, practice buttons)
- [x] Works on mobile

## Test Results
- **Test script**: `tests/arc24-single-section-nav.mjs`
- **Result**: 34/34 PASS
- **Honeycomb confirmation**: All three span types present (`end.section_navigate`, `end.start_level_click`, `end.layout_version = 'single_section_v1'`)

## Key Files Changed
- `src/end.ts` — APP_VERSION bumped to 0.22.0, `end.layout_version = 'single_section_v1'`
- `src/ui/guild-columns.ts` — `showSessionEndColumns` rewritten with header/body/footer pattern
- `end.css` — new snap layout styles (scroll-snap-type, section height, header/footer overlay)
- `tests/arc24-single-section-nav.mjs` — verification test script

## Observability
- `end.layout_version = 'single_section_v1'` — structural marker confirming new layout is active
- `end.section_navigate` with `navigate.direction` (up/down) and `navigate.target_section` — fires on each navigation action
- `end.start_level_click` — fires when the locked-level CTA is tapped
- All three confirmed in Honeycomb
- Queryable: "How often do users navigate to all sections vs. stop at the first?"

## Decisions
- DEC-086: Reimplemented Arc 24 with header/footer navigation pattern; original implementation reverted by client
- DEC-087: Scroll snap via CSS scroll-snap-type: y mandatory for section transitions
- DEC-088: Context-sensitive button labels based on position and unlock state
- DEC-089: Empty state shows only home link when no levels unlocked

---

## SOW Status: Single-Section End Screen Navigation

Arc 24 is the first arc of the Single-Section End Screen Navigation SOW (Arcs 24–26).

### SOW Progress
- [x] Arc 24: Single-section view with snap navigation — COMPLETE
- [ ] Arc 25: Level dot indicator — PLANNED
- [ ] Arc 26: Polish (transitions, mobile tuning) — PLANNED

**Client pause after Arc 24 — confirm navigation feel before proceeding.**
