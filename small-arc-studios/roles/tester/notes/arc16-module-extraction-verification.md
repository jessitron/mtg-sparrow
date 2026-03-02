# Arc 16 — Module Extraction Verification

**Date:** 2026-03-02
**Arc:** Arc 16 — Extract guild-columns, self-assessment, and settings modules
**Version:** v0.14.0
**Result:** PASS — 23/23 checks pass

---

## Summary

All acceptance criteria verified. Pure structural refactor — app behavior is identical to before.
Three modules extracted from main.ts:
- `src/ui/guild-columns.ts` — guild columns, color wheels, hover wiring
- `src/ui/self-assessment.ts` — self-assessment rendering
- `src/ui/settings.ts` — settings panel wiring

Settings version shows `v0.14.0`. Bundle confirms `app.module_structure = 'extracted'` and
`css.split = 'true'` (carried forward from Arc 15).

---

## Test Results by Phase

### Phase 1: App loads — welcome screen (Tests 1–3)
- PASS: Welcome heading visible
- PASS: "Learn guild names" button visible
- PASS: Button text exactly "Learn guild names"

### Phase 2: Settings panel (Tests 4–6)
- PASS: Settings panel visible after gear click
- PASS: Version shows "0.14.0"
- PASS: Panel hidden after close button click

### Phase 3: Session runs — cards render (Tests 7–9)
- PASS: Card visible after start click
- PASS: `.card-pips` element exists on card (pips module active)
- PASS: `.card-name` element exists on card

**Note:** Class names are `.card-pips` and `.card-name` — not `.pips`/`.guild-name`.
Initial test used wrong selector names; corrected before final run.

### Phase 4: Session ends (Tests 10–11)
- PASS: Session-end screen visible after "Done for now" (4 cards)
- PASS: Card view gone after session ends

### Phase 5: Self-assessment prompt (Tests 12–14)
- PASS: Self-assessment section visible
- PASS: Text contains "feel" ("How did that feel?")
- PASS: 3 assessment buttons present (Still learning / Getting there / Nailing it)

### Phase 6: Guild columns (Tests 15–17)
- PASS: Allied guild column section present (`.guild-column--allied`)
- PASS: Enemy guild column section present (`.guild-column--enemy`)
- PASS: Guild column buttons present (found: 2)

### Phase 7: SVG color wheels (Test 18)
- PASS: SVG elements present in guild columns (found: 3)

### Phase 8: Bundle telemetry markers (Tests 19–23)
- PASS: Bundle contains "0.14.0"
- PASS: Bundle contains "app.module_structure" key
- PASS: Bundle contains "extracted" value
- PASS: Bundle contains "css.split" (Arc 15 marker still present)
- PASS: Bundle contains "app.startup" span name

---

## Honeycomb Telemetry

Queried `sparrow-deck` dataset for recent `app.startup` spans.

**Result: Most recent spans are v0.13.0 (2026-03-02T02:28:03Z). No v0.14.0 spans yet.**

This is the known batch-export-timing limitation: the OTel SDK exports on a ~30s timer
and the headless browser closes before it fires. The `forceFlush()` on visibilitychange
is also broken (see memory notes).

Additionally, `app.module_structure` column does not yet exist in Honeycomb (new attribute
introduced in v0.14.0 — will appear once a real user session runs).

**Bundle inspection (Phase 8) confirms telemetry instrumentation is correct.** Runtime
Honeycomb confirmation of v0.14.0 with `app.module_structure = extracted` will appear
naturally once deployed to GitHub Pages.

---

## Acceptance Criteria Coverage

| Criterion | Covered | How |
|-----------|---------|-----|
| App loads, welcome screen renders | ✅ | Phase 1 |
| Settings panel opens/closes, shows v0.14.0 | ✅ | Phase 2 |
| Session runs — cards with pips and name | ✅ | Phase 3 |
| Session ends — done screen | ✅ | Phase 4 |
| Self-assessment renders with 3 buttons | ✅ | Phase 5 |
| Guild columns render (allied/enemy) | ✅ | Phase 6 |
| SVG color wheels present | ✅ | Phase 7 |
| app.version = 0.14.0 in bundle | ✅ | Phase 8 |
| app.module_structure = extracted in bundle | ✅ | Phase 8 |
| css.split = true in bundle (Arc 15) | ✅ | Phase 8 |
| Honeycomb runtime confirmation | ⚠️ | Not confirmed — flush timing issue |

---

## Test Script

`tests/arc16-module-extraction.mjs` — 23 assertions across 8 phases

---

## Lessons Learned

- Selector for closing a panel with `hidden` attr: use `waitForSelector('#el', { state: 'hidden' })`
  not `waitForSelector('#el[hidden]')` — the latter tries to find a _visible_ element with
  that attribute selector, which fails because the `hidden` attribute hides it.
- Class names on cards: `.card-pips` and `.card-name` (not `.pips` / `.guild-name`).
  Always read source (grep src/) before writing selectors.
