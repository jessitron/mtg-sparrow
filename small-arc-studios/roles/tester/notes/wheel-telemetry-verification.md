# Wheel Telemetry Verification (Arc 27)

**Date:** 2026-03-03 (updated same day — wheel handler reworked mid-arc)
**Test script:** `tests/wheel-telemetry.mjs`
**Final result:** 16/16 PASS. Honeycomb confirmed.

---

## Arc 27 Final: Accumulated-Delta Wheel Handler

The wheel handler was reworked from a cooldown-based approach to an accumulated-deltaY approach
during Arc 27. The test was updated accordingly. The final implementation is what is verified here.

### What changed from the initial approach
- Old: listener on `.level-sections-viewport`, 700ms cooldown timer between events
- New: listener on `document`, accumulate `deltaY` until `|accumulated| >= 700`, then advance

---

## What Was Tested (final implementation)

Every wheel event on the document emits an `end.wheel_event` span event on the current
`end.section_view` span. The attributes are:

| Attribute | Type | Values seen in Honeycomb |
|---|---|---|
| `wheel.action` | string | `accumulating`, `advance`, `suppressed_spinning`, `suppressed_bounds` |
| `wheel.accumulated_deltaY` | integer | e.g. `177`, `752`, `-831` |
| `wheel.deltaY` | integer | e.g. `64`, `120`, `-35` |
| `wheel.current_index` | integer | `0`, `1`, `2` |
| `wheel.direction` | integer | `1` (down), `-1` (up) |
| `wheel.reel_spinning` | boolean | `false`, `true` |

These are **span events**, not standalone spans. In Honeycomb they appear with `meta.annotation_type = 'span_event'`
and `name = 'end.wheel_event'`, nested under the `end.section_view` span.

---

## Test Phases (16/16 PASS)

1. **Bundle check** — confirmed all new attribute keys present in `dist/end.js`, `accumulating` action
   value present, old `WHEEL_COOLDOWN_MS` constant absent. Used `addEvent` (not `addSpanEvent`) since
   minification mangles wrapper function names.

2. **Small wheel does NOT advance** — single `deltaY: 100` event dispatched on `document`.
   Top button remains hidden (still at section 0). 100 < 700 threshold.

3. **Accumulated deltaY >= 700 advances** — 7 × `deltaY: 120` = 840 dispatched via `document.dispatchEvent`.
   Crosses threshold on 6th event (720). Top button becomes visible (now at section 1).

4. **Document-wide listener** — dispatched single `deltaY: 800` on `document.body` (not the viewport).
   Section advanced. Confirms listener is on `document`, not scoped to `.level-sections-viewport`.

5. **Direction change resets accumulator** — 300 + 300 = 600 down, then `-100` up.
   Accumulator resets to -100. No advance. Still at section 0.

6. **Advance to section 2** — two separate batches of 7 × 120 (each batch crosses threshold separately,
   accumulator resets to 0 on advance). Bottom button hides at section 2 (last section).

7. **Span flush** — dispatched accumulating, advance, and suppressed_bounds events,
   then held page 35s for OTel batch timer.

---

## Honeycomb Verification

Columns confirmed present with recent `LastWritten` timestamps (2026-03-03 01:10–01:23):

- `wheel.accumulated_deltaY`: sample values `497, -33, 565, -1236, -423, -1008, 752, -810, 177, -831`
- `wheel.deltaY`: sample values `64, 11, 7, -35, -34, -96, 96, 80, 17, -6`
- `wheel.action`: all four values confirmed — `advance`, `suppressed_spinning`, `suppressed_bounds`, `accumulating`
- `wheel.current_index`: values `0`, `1`, `2`
- `wheel.direction`: values `-1`, `1`
- `wheel.reel_spinning`: values `false`, `true`

Parent span confirmed as `end.section_view` — events nest under section span correctly.

---

## Key Lessons

- **Span events vs spans**: `addSpanEvent` / `span.addEvent` emits a span event (annotation), not a child span.
  In Honeycomb, query by `meta.annotation_type = 'span_event'` and `name = 'end.wheel_event'`.
  The `get_dataset_columns` tool returns sample values for span event attributes too.

- **Minified bundles**: `addSpanEvent` is the project wrapper; after minification, check for `addEvent`
  (the underlying OTel API method) in the bundle, not the wrapper function name.

- **Wheel event dispatch in headless Playwright**: Use `page.evaluate(() => document.dispatchEvent(new WheelEvent(...)))`
  rather than `element.dispatchEvent` via Playwright's handle — the latter doesn't bubble to `document`
  the same way. The listener calls `e.preventDefault()` with `{ passive: false }` so events fire correctly.

- **Accumulated-delta testing**: Dispatch multiple events in a single `evaluate()` call to ensure
  they accumulate synchronously before any async rendering kicks in. A single large `deltaY: 800`
  also works for single-event advance tests.

- **Reel DOM selectors** (reel_v1 structure, current as of Arc 27):
  - Viewport: `.level-sections-viewport`
  - Reel: `.level-sections-reel`
  - Top nav: `.reel-nav-btn--top` (has `reel-nav-btn--hidden` class when at section 0)
  - Bottom nav: `.reel-nav-btn--bottom` (has `reel-nav-btn--hidden` class when at last section)
  - Sections: `.level-section--allied`, `.level-section--enemy`, `.level-section--share`
  - Wheel listener target: `document` (not `.level-sections-viewport`)
