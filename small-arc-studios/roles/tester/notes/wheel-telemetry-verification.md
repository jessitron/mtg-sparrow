# Wheel Telemetry Verification (Arc 27)

**Date:** 2026-03-03 (updated twice — handler reworked mid-arc, then telemetry volume reduced)
**Test script:** `tests/wheel-telemetry.mjs`
**Final result:** 17/17 PASS. Honeycomb confirmed.

---

## Arc 27 Final: Accumulated-Delta Handler + Reduced Telemetry Volume

The wheel handler went through two rounds of changes during Arc 27:
1. Reworked from cooldown-based to accumulated-deltaY — listener moved to `document`
2. Reduced telemetry volume — `accumulating` events no longer emitted; `gesture_start` and `direction_change` added

### Evolution summary
- **v1** (original): listener on `.level-sections-viewport`, 700ms cooldown timer, actions: `advance | suppressed_cooldown | suppressed_spinning | suppressed_bounds`
- **v2**: listener on `document`, accumulate `deltaY` until `|accumulated| >= 700`, actions: `accumulating | advance | suppressed_spinning | suppressed_bounds`
- **v3 (final)**: same accumulation, but `accumulating` NOT emitted; added `gesture_start` (wasZero) and `direction_change`; emitted actions: `gesture_start | direction_change | advance | suppressed_spinning | suppressed_bounds`

---

## What Was Tested (final v3 implementation)

Every wheel event on the document **except `accumulating`** emits an `end.wheel_event` span event
on the current `end.section_view` span. The attributes are:

| Attribute | Type | Values seen in Honeycomb (recent) |
|---|---|---|
| `wheel.action` | string | `gesture_start`, `advance`, `suppressed_bounds` (+ `direction_change`, `suppressed_spinning` in code) |
| `wheel.accumulated_deltaY` | integer | e.g. `100`, `700`, `740` |
| `wheel.deltaY` | integer | e.g. `100`, `120`, `90` |
| `wheel.current_index` | integer | `0`, `1`, `2` |
| `wheel.direction` | integer | `1` (down), `-1` (up) |
| `wheel.reel_spinning` | boolean | `false`, `true` |

Note: `accumulating` events from earlier test runs (v2) are still present in Honeycomb history —
this is expected. Only recent events (after final deployment) should show `gesture_start`/`advance`.

These are **span events**, not standalone spans. They appear with `meta.annotation_type = 'span_event'`
and `name = 'end.wheel_event'`, nested under `end.section_view`.

---

## Test Phases (17/17 PASS)

1. **Bundle check** — confirmed all attribute keys, `gesture_start` and `direction_change` values present,
   old `WHEEL_COOLDOWN_MS` absent. `addEvent` (OTel API) present after minification.

2. **Small wheel does NOT advance** — single `deltaY: 100` event. Top button stays hidden (section 0).
   100 < 700 threshold. Also: first event is `gesture_start`, not `advance`, even if large.

3. **Accumulated deltaY >= 700 advances** — 7 × `deltaY: 120` = 840 dispatched in one `evaluate()` call.
   First event = `gesture_start`, then `accumulating` (silent), threshold crossed → `advance`. Top button visible.

4. **Document-wide listener** — two events of `deltaY: 800` dispatched on `document.body`.
   First = `gesture_start` (no advance), second crosses threshold → `advance`. Section advances.
   **Key insight**: single large event does NOT advance (wasZero → gesture_start, action != advance → return).

5. **Direction change resets accumulator** — 300 + 300 = 600 down, then `-100` up.
   Accumulator resets to -100, no advance. Still at section 0.

6. **Advance to section 2** — two separate batches of 8 × 100. Each batch: gesture_start then advance.
   Bottom button hides at section 2 (last section).

7. **Span flush** — dispatched gesture_start, advance, and suppressed_bounds events,
   held page 35s for OTel batch timer.

---

## Honeycomb Verification (final run, 2026-03-03 ~01:35–01:37)

Recent span events (last 1h query) showed only `gesture_start` and `advance` — no `accumulating`.
Older rows (01:32) still show `accumulating` from the v2 test run — expected historical data.

Sample from final run:
- `gesture_start` at `wheel.current_index=0`, `wheel.accumulated_deltaY=100`
- `advance` at `wheel.current_index=0`, `wheel.accumulated_deltaY=740`
- `gesture_start` at `wheel.current_index=1`, `wheel.accumulated_deltaY=100`, `wheel.reel_spinning=true`
- `advance` at `wheel.current_index=1`, `wheel.accumulated_deltaY=700`

Parent span: `end.section_view` on all events — correct nesting confirmed.

Query URL: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/7aGCrT9UDSh

---

## Key Lessons

- **Span events vs spans**: `addSpanEvent` / `span.addEvent` emits a span event (annotation), not a child span.
  In Honeycomb, filter by `meta.annotation_type = 'span_event'` and `name = 'end.wheel_event'`.

- **Minified bundles**: Check for `addEvent` (the OTel API method), not `addSpanEvent` (wrapper — mangled by minifier).

- **gesture_start blocks advance**: Even a single `deltaY: 800` event does NOT advance — `wasZero=true` → `gesture_start`, and `if (action !== 'advance') return`. Need a second event to trigger `advance`.

- **Dispatch in evaluate()**: Use `page.evaluate(() => document.dispatchEvent(new WheelEvent(...)))` for document-level events. Multiple events in one `evaluate()` call accumulate synchronously.

- **Reel DOM selectors** (reel_v1, current as of Arc 27 final):
  - Viewport: `.level-sections-viewport`
  - Reel: `.level-sections-reel`
  - Top nav: `.reel-nav-btn--top` (`reel-nav-btn--hidden` when at section 0)
  - Bottom nav: `.reel-nav-btn--bottom` (`reel-nav-btn--hidden` when at last section)
  - Sections: `.level-section--allied`, `.level-section--enemy`, `.level-section--share`
  - Wheel listener target: `document` (not `.level-sections-viewport`)
