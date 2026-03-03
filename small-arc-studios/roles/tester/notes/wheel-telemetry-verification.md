# Wheel Telemetry Verification (Arc 27)

**Date:** 2026-03-03
**Test script:** `tests/wheel-telemetry.mjs`
**Result:** 14/14 PASS. Honeycomb confirmed.

---

## What Was Tested

Every wheel event on `.level-sections-viewport` emits an `end.wheel_event` span event on the current
`end.section_view` span. The attributes are:

| Attribute | Type | Values seen in Honeycomb |
|---|---|---|
| `wheel.action` | string | `advance`, `suppressed_cooldown` |
| `wheel.current_index` | integer | `0`, `1` |
| `wheel.direction` | integer | `1` (down), `-1` (up) |
| `wheel.cooldown_suppressed` | boolean | `false`, `true` |
| `wheel.reel_spinning` | boolean | `false` |
| `wheel.time_since_last_ms` | integer | `0`, `805`, `806` |

These are **span events**, not standalone spans. In Honeycomb they appear with `meta.annotation_type = 'span_event'`
and `name = 'end.wheel_event'`, nested under the `end.section_view` span.

---

## Test Phases

1. **Bundle check** — confirmed `end.wheel_event`, `wheel.action`, `wheel.current_index`,
   `wheel.cooldown_suppressed` string literals present in `dist/end.js`. Also confirmed `addEvent`
   (the OTel API used by `addSpanEvent`) is present (note: minification mangles function names,
   so check the OTel API name, not the wrapper).

2. **Wheel down advances section 0 → 1** — dispatched `wheel` event with `deltaY: 120` on
   `.level-sections-viewport`. After 800ms (animation + buffer), verified top nav button
   (`.reel-nav-btn--top`) changed from hidden to visible. Button visibility is the reliable proxy
   for section index in headless Playwright (scroll position is not).

3. **Rapid wheel suppressed by cooldown** — dispatched two wheel events 100ms apart.
   After both + animation time, bottom button still visible (still at section 1, not 2).
   Confirmed 700ms cooldown blocks double-scroll.

4. **Advance to section 2 after cooldown** — dispatched first wheel (→ section 1), waited 1000ms
   (animation + cooldown), dispatched second wheel (→ section 2). Bottom button became hidden
   (section 2 is the last section — share placeholder).

5. **Span flush** — held page alive 35s for OTel batch timer after dispatching wheel events across
   multiple sections. Phase 5 dispatched `advance`, `suppressed_cooldown`, and `advance` actions
   in sequence.

---

## Honeycomb Verification

Query: `wheel.action EXISTS`, last 1h, sparrow-deck environment.

Result: 4 span event rows returned:
- `wheel.action = 'advance'` at `wheel.current_index = 0` (first scroll, leaving section 0)
- `wheel.action = 'advance'` at `wheel.current_index = 1` (second scroll, leaving section 1)
- Trace IDs `eb9a689babe3780ba9c836576b20d8e4` and `2efc5c282fa6fba61b4e53dca1cfcfe2`
- Parent span name: `end.section_view` — confirms events nest under section span correctly

Query URL: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/tejaPMGqL7u

All six wheel attributes confirmed present in Honeycomb column schema with `LastWritten: 2026-03-03 00:59:52`.

---

## Key Lessons

- **Span events vs spans**: `addSpanEvent` / `span.addEvent` emits a span event (annotation), not a child span.
  In Honeycomb, query by `meta.annotation_type = 'span_event'` and `name = 'end.wheel_event'`.
  The `get_dataset_columns` tool returns sample values for span event attributes too.

- **Minified bundles**: `addSpanEvent` is the project wrapper; after minification, check for `addEvent`
  (the underlying OTel API method) in the bundle, not the wrapper function name.

- **Wheel event dispatch in headless Playwright**: `element.dispatchEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })`
  works correctly. The listener in `guild-columns.ts` calls `e.preventDefault()` so `passive: false` is needed —
  this is already set in the source. Dispatched events do fire the listener.

- **Cooldown timing in tests**: The 700ms wheel cooldown requires at least 800ms wait between wheel events
  in tests (animation 600ms + buffer). Use 1000ms for safety when you also need the first animation to finish.

- **Reel DOM selectors** (reel_v1 structure, current as of Arc 27):
  - Viewport: `.level-sections-viewport`
  - Reel: `.level-sections-reel`
  - Top nav: `.reel-nav-btn--top` (has `reel-nav-btn--hidden` class when at section 0)
  - Bottom nav: `.reel-nav-btn--bottom` (has `reel-nav-btn--hidden` class when at last section)
  - Sections: `.level-section--allied`, `.level-section--enemy`, `.level-section--share`
