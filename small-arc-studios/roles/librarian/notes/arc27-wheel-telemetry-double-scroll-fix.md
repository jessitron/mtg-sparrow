# Arc 27: Wheel Event Telemetry & Double-Scroll Fix

## Arc Details
- **Type**: Technical Arc (Observability + Bug Fix)
- **Version**: v0.23.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS

## Intention
Diagnose and fix the double-scrolling bug on the end screen reel navigation. A single scroll gesture was advancing two sections instead of one. Used observability-first development: instrument first, diagnose from real data, then fix.

## Observable Outcome
A single scroll gesture advances exactly one section. Wheel telemetry in Honeycomb shows clean `gesture_start` → `advance` sequences with no spurious second advances from inertia tails.

## Phases

### Phase 1: Instrumentation
Added `end.wheel_event` span events to every wheel event, including suppressed ones. Attributes:
- `deltaY`, `direction`, `current_index`, `reel_spinning`
- `action`: one of `advance`, `suppressed_cooldown`, `suppressed_bounds`, `suppressed_spinning`
- `time_since_last_ms`, `cooldown_suppressed`

Confirmed in Honeycomb: all attributes present, events nesting under `end.section_view`.

### Phase 2: Diagnosis via Honeycomb
Trace `7a64e014e2b58373ae2176310f67d3bb` made the problem visible:
- 1141 wheel events, 18 advances, 1120 `suppressed_cooldown`, 3 `suppressed_bounds`
- Root cause: trackpad inertia outlasts the 700ms cooldown. Animation finishes at 600ms, `reelSpinning` clears, then at 703ms the cooldown expires and an inertia tail event (deltaY 2–3) advances the reel again.
- Firefox trackpad deltaY values are tiny (1–25 in line-mode) — inertia tail is deltaY 2–3.

### Phase 3: First Fix Attempt — REVERTED
Moved `reelLastWheelTime = now` before the cooldown check, so every wheel event resets the timer.
- Result: Terrible UX — user couldn't scroll twice, couldn't scroll down then up. The more you scroll, the more the cooldown pushes forward. Reverted immediately.

### Phase 4: Accumulated DeltaY Approach — KEPT
Replaced cooldown timer entirely with accumulated deltaY threshold:
- Track running sum of deltaY across wheel events.
- Only advance when |accumulated| >= 700 (threshold tuned by client from real Honeycomb data).
- Reset accumulator after advance or on direction change.
- Moved wheel listener from viewport to `document` for consistent behavior across the page.

### Phase 5: Telemetry Volume Reduction
Dropped `accumulating` span events (99%+ of volume). Only emit:
- `gesture_start`, `direction_change`, `advance`, `suppressed_spinning`, `suppressed_bounds`

Reduces from ~1000+ events per session to ~dozen, while preserving all diagnostic signal.

## Acceptance Criteria — All Met

- [x] Single scroll gesture advances exactly one section
- [x] Can scroll down then immediately scroll up (no cooldown blocking re-scroll)
- [x] Works on trackpad (Firefox and Chrome)
- [x] Wheel telemetry visible in Honeycomb with correct event types
- [x] No `accumulating` events in Honeycomb output

## Key Behavioral Note
`gesture_start` does NOT advance the reel even if deltaY >= threshold — it marks the start of a gesture only. At least two events are required to cross the threshold and advance: one resets the accumulator (gesture_start), and subsequent events accumulate toward 700.

## Test Results
- **Test script**: `tests/wheel-telemetry.mjs`
- **Result**: 17/17 PASS

## Key Files Changed
- `src/ui/guild-columns.ts` — wheel handler replaced: cooldown timer → accumulated deltaY; listener moved to `document`; telemetry events updated
- `tests/wheel-telemetry.mjs` — new test suite (updated twice across arc iterations)

## Observability
- `end.wheel_event` span events: `gesture_start`, `direction_change`, `advance`, `suppressed_spinning`, `suppressed_bounds`
- Confirmed in Honeycomb: gesture_start and advance events present, no accumulating events
- Query: https://ui.honeycomb.io/modernity/environments/sparrow-deck/datasets/sparrow-deck/result/7aGCrT9UDSh

## Decisions
- DEC-090: Replace cooldown-based wheel debounce with accumulated deltaY threshold (700)
- DEC-091: Move wheel listener from viewport element to document
- DEC-092: Reduce wheel telemetry to key events only

## Commits
- `77de553`: Add wheel event telemetry
- `32ffcaf`: Wheel telemetry test (14/14 PASS)
- `79c1aa5`: Fix double-scroll (cooldown reset) — LATER REVERTED
- `77caf97`: Add wheel.deltaY attribute
- `5f3b981`: Revert cooldown-reset fix
- `0ae0c7d`: Accumulated deltaY approach (threshold 700)
- `9a84d3d`: Move wheel listener to document
- `74a31b4`: Updated test (16/16 PASS)
- `3b416d4`: Reduce telemetry volume
- `dd013aa`: Final test (17/17 PASS)

## Lessons Learned
- Cooldown timers are a poor match for trackpad inertia — inertia duration is unpredictable and varies by OS, browser, and device.
- Resetting cooldown on every event is worse than not having a cooldown — it blocks all re-scrolling.
- Firefox uses line-mode deltaY (small integers 1–25), Chrome uses pixel-mode (larger values). Accumulated deltaY naturally handles both.
- Observability-first debugging works: instrumenting first, then using real data to choose the fix, avoided guessing entirely.
