# Arc 34 Verification: Trace-Participating Logs

**Date**: 2026-03-07 (re-verified after SDK upgrade)
**Tester**: Quality Engineer (Playwright + Honeycomb MCP)

---

## Re-verification Context

The original verification (below) found that `@honeycombio/opentelemetry-web` v0.10.0 did NOT
include LoggerProvider support, so `emitLog()` calls were no-ops. The SDK has now been upgraded
to **v1.3.0**, which adds LoggerProvider. This re-verification confirms logs now reach Honeycomb.

---

## Browser Test Results (Re-run)

**Script**: `tests/arc-34-trace-logs.mjs`
**Result**: 16/16 PASS

### Phase 1: Source verification (11 tests)
- `telemetry.ts` exports `emitLog()` function -- PASS
- `telemetry.ts` imports `@opentelemetry/api-logs` (logs, SeverityNumber) -- PASS
- `telemetry.ts` calls `logs.getLogger()` to create a logger -- PASS
- `emitLog()` calls `logger.emit()` with body and attributes -- PASS
- Log records use `SeverityNumber.INFO` -- PASS
- `slides.ts` uses `emitLog()` for session.pause, user.tap, progression.subgroup_unlocked -- PASS (3 tests)
- `slides.ts` does NOT call `addSpanEvent()` -- PASS
- `guild-columns.ts` uses `emitLog()` for end.wheel_event -- PASS
- `guild-columns.ts` does NOT call `addSpanEvent()` -- PASS

### Phase 2: Trigger log records (3 tests)
- Navigated to slides page, clicked Pause, Resume, and tapped card area -- PASS
- Network observation: **3 requests to /v1/logs**, 4 total Honeycomb API requests
- Log records sent via /v1/logs endpoint -- PASS

### Phase 3: addSpanEvent audit (2 tests)
- `addSpanEvent()` still exists as exported function definition in telemetry.ts -- PASS
- No call sites remain outside the definition -- PASS

---

## Honeycomb Verification Results

**Workspace**: modernity
**Environment**: sparrow-deck
**Dataset**: sparrow-deck
**Query time**: 2026-03-07 ~23:38 UTC (within 10 minutes of test run)

### LOG RECORDS ARE NOW ARRIVING IN HONEYCOMB

1. **meta.signal_type = log** -- 3 log records found in the last 10 minutes.

2. **body values received**:
   - `session.pause` (1 record)
   - `session.resume` (1 record)
   - `user.tap` (1 record)

3. **Severity**: All 3 records have `severity = info`, `severity_code = 9` (maps to INFO).

4. **SDK version confirmed**: `telemetry.distro.name = @honeycombio/opentelemetry-web`, `telemetry.distro.version = 1.3.0`.

### Trace Correlation: NOT PRESENT

5. **trace.trace_id**: Filtered for `meta.signal_type = log AND trace.trace_id exists` -- **0 results**.
   Log records do NOT carry trace_id or span_id. The OTel Logs API `logger.emit()` does not
   automatically inject trace context from the active span. Manual context propagation is needed
   if trace correlation is desired.

### Columns Present on Log Records

From raw event samples, log records carry these attributes:

| Column | Example Value |
|--------|---------------|
| body | session.pause |
| severity | info |
| severity_code | 9 |
| flags | 0 |
| meta.signal_type | log |
| telemetry.distro.name | @honeycombio/opentelemetry-web |
| telemetry.distro.version | 1.3.0 |
| telemetry.sdk.name | opentelemetry |
| telemetry.sdk.version | 2.6.0 |
| app.navigation | multi_page |
| app.page | slides |
| mtg-sparrow.session.id | (populated) |
| mtg-sparrow.player.id | (populated) |
| service.name | sparrow-deck |
| service.version | 0.19.0 |
| tap.name_revealed | true (on user.tap) |
| tap.time_since_card_ms | 6252 (on user.tap) |
| session.card_index | 0 (on pause/resume) |

Resource attributes (app.navigation, session IDs, service info, browser info) are all present.
Custom attributes passed to `emitLog()` (tap.name_revealed, session.card_index, etc.) are present.

---

## Verdict

### Code Changes: CORRECT AND FUNCTIONAL

The conversion from `addSpanEvent()` to `emitLog()` is correctly implemented and now produces
real log records in Honeycomb thanks to the SDK v1.3.0 upgrade.

### Runtime Behavior: LOGS DELIVERED, NO TRACE CORRELATION

- Log records arrive in Honeycomb as first-class log events (not span events).
- They carry all resource attributes and custom attributes.
- They do NOT carry `trace.trace_id` or `trace.span_id` -- they are standalone log records,
  not yet trace-participating. Manual context injection would be needed for trace correlation.

### Impact Assessment

- No data loss regression -- the 3 tested event types now appear in Honeycomb as logs.
- `progression.subgroup_unlocked` and `end.wheel_event` were not triggered in this test
  (they require specific user flows) but use the same `emitLog()` path.

---

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | emitLog() helper wraps OTel Logs API | PASS |
| 2 | All 5 addSpanEvent call sites converted | PASS |
| 3 | Log records include correct trace_id and span_id | FAIL -- logs arrive but without trace context |
| 4 | Log records appear in Honeycomb trace waterfall | FAIL -- no trace correlation, so not in waterfall |
| 5 | Log records sent immediately | PASS -- 3 /v1/logs requests observed during test |
| 6 | No new package dependencies (beyond SDK upgrade) | PASS |

**Arc 34 status: PARTIALLY COMPLETE** -- 4 of 6 acceptance criteria pass. The remaining 2
require trace context propagation (injecting trace_id/span_id into log records).

---

## Recommendations

1. **The SDK upgrade resolved the primary blocker** -- logs now reach Honeycomb.

2. **Trace correlation requires additional work**: The `emitLog()` function needs to read
   the active span context and pass `trace.trace_id` / `trace.span_id` as attributes
   (or use the OTel context parameter on `logger.emit()`). This could be a small follow-up arc.

3. **Safe to deploy as-is** -- user action telemetry is no longer lost. The events appear as
   queryable log records with all relevant attributes. Trace waterfall integration is a bonus,
   not a regression (span events also didn't appear in the waterfall in most UIs).

---

## Original Verification (2026-03-07, pre-upgrade)

The original verification against SDK v0.10.0 found:
- 0 requests to /v1/logs (LoggerProvider not initialized)
- No `body`, `severity`, or `severity_code` columns existed in the dataset
- emitLog() calls were silently no-ops
- Verdict was "NOT COMPLETE -- data loss regression"

That blocker is now resolved by the upgrade to v1.3.0.
