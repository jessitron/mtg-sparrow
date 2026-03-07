# Arc 34 Verification: Trace-Participating Logs

**Date**: 2026-03-07
**Tester**: Quality Engineer (Playwright + Honeycomb MCP)

---

## Browser Test Results

**Script**: `tests/arc-34-trace-logs.mjs`
**Result**: 15/15 PASS

### Phase 1: Source verification
- `telemetry.ts` exports `emitLog()` function -- PASS
- `telemetry.ts` imports `@opentelemetry/api-logs` (logs, SeverityNumber) -- PASS
- `telemetry.ts` calls `logs.getLogger()` to create a logger -- PASS
- `emitLog()` calls `logger.emit()` with body and attributes -- PASS
- Log records use `SeverityNumber.INFO` -- PASS
- `slides.ts` uses `emitLog()` for session.pause, user.tap, progression.subgroup_unlocked -- PASS
- `slides.ts` does NOT call `addSpanEvent()` -- PASS
- `guild-columns.ts` uses `emitLog()` for end.wheel_event -- PASS
- `guild-columns.ts` does NOT call `addSpanEvent()` -- PASS

### Phase 2: Trigger log records
- Navigated to slides page, clicked Pause, Resume, and tapped card area -- PASS
- Network observation: **0 requests to /v1/logs**, 1 request to /v1/traces

### Phase 3: addSpanEvent audit
- `addSpanEvent()` still exists as exported function definition in telemetry.ts -- PASS
- No call sites remain outside the definition -- PASS

---

## Honeycomb Verification Results

**Workspace**: modernity
**Environment**: sparrow-deck
**Dataset**: sparrow-deck

### Critical Finding: LOG RECORDS ARE NOT ARRIVING IN HONEYCOMB

1. **meta.signal_type** -- All 330 events in the last 30 minutes have `meta.signal_type = trace`. Zero records have `log` signal type.

2. **meta.annotation_type** -- Only values are empty (spans) and `span_event`. No log annotation type exists.

3. **No body/severity columns** -- The columns `body`, `SeverityText`, `SeverityNumber` do not exist in the dataset schema at all.

4. **user.tap and end.wheel_event data** -- These DO appear in Honeycomb, but as `meta.annotation_type = span_event` (the old format). This data is from the client's real browser sessions (Firefox, localhost:3000), not from our test. The client is still running the pre-Arc-34 code.

5. **Network capture** -- The Playwright browser sent 0 requests to `/v1/logs`. Only 1 request to `/v1/traces`.

### Root Cause

**The `@honeycombio/opentelemetry-web` v0.10.0 SDK does NOT initialize a LoggerProvider.**

- Searched the SDK source (`node_modules/@honeycombio/opentelemetry-web/dist/esm/index.js`) for `LoggerProvider`, `setGlobalLoggerProvider`, `logExport`, `v1/logs` -- zero matches.
- The SDK only sets up tracing (TracerProvider) and possibly metrics.
- `@opentelemetry/api-logs` v0.55.0 IS installed as a transitive dependency, so the import compiles.
- But `logs.getLogger()` returns a **no-op logger** because no LoggerProvider is registered.
- `logger.emit()` calls silently do nothing -- no error, no export, no data.

### The Plan's Discovery Was Incorrect

The plan document (`plan-trace-participating-logs.md`) stated:
> "configureLogExporters() creates an HTTP JSON log exporter pointed at Honeycomb"
> "LoggerProvider is created with SimpleLogRecordProcessor -- logs sent immediately"
> "logs.setGlobalLoggerProvider() is called -- the global API is wired up"

None of this is true for v0.10.0 of the SDK. The SDK does not have log export support.

---

## Verdict

### Code Changes: CORRECT but INERT

The conversion from `addSpanEvent()` to `emitLog()` is correctly implemented:
- The `emitLog()` wrapper properly calls the OTel Logs API
- All 5 call sites are converted
- The code compiles and runs without errors

### Runtime Behavior: FAILING SILENTLY

Log records are NOT delivered to Honeycomb because no LoggerProvider is configured. The emitLog() calls are no-ops at runtime.

### Impact

With this change deployed, the 5 converted event types (session.pause, session.resume, user.tap, progression.subgroup_unlocked, end.wheel_event) will **stop appearing in Honeycomb entirely**. They were previously delivered as span events; now they call emitLog() which does nothing.

This is a **data loss regression**.

---

## Recommendations

1. **Do NOT deploy Arc 34 as-is** -- it will cause loss of telemetry data for user actions.

2. **Option A**: Manually configure a LoggerProvider with an OTLP log exporter pointing at Honeycomb. This requires adding `@opentelemetry/sdk-logs` and `@opentelemetry/exporter-logs-otlp-http` as dependencies (violates the "no new dependencies" acceptance criterion).

3. **Option B**: Revert to `addSpanEvent()` until the Honeycomb Web SDK adds native log support.

4. **Option C**: Keep `emitLog()` but also keep the `addSpanEvent()` calls as a fallback, so data continues to flow while logs are not yet working.

---

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | emitLog() helper wraps OTel Logs API | PASS |
| 2 | All 5 addSpanEvent call sites converted | PASS |
| 3 | Log records include correct trace_id and span_id | FAIL -- no logs sent |
| 4 | Log records appear in Honeycomb trace waterfall | FAIL -- no logs arrive |
| 5 | Log records sent immediately | FAIL -- no logs sent |
| 6 | No new package dependencies | PASS |

**Arc 34: NOT COMPLETE** -- 3 of 6 acceptance criteria fail.
