# Arc 34: Trace-Participating OTel Log Records

## Arc Details
- **Type**: Structural Arc (Telemetry)
- **Date**: 2026-03-08
- **Status**: COMPLETE — 16/16 PASS
- **Plan**: plan-trace-participating-logs.md

## Intention
Replace `addSpanEvent()` calls with trace-participating OTel log records that are sent immediately to Honeycomb, not waiting for the parent span to end. Span events only ship when the parent span ends, which may never happen in a browser (tab close, navigation). Log records solve this reliability gap.

## Observable Outcome
Log records arrive in Honeycomb with populated trace_id and flags=1 (sampled), appearing in the trace waterfall identically to span events. Before this arc, logs had empty trace_id and flags=0. After this arc, all four converted event types ship immediately and correlate with their parent trace.

## What Was Built

### src/telemetry/telemetry.ts
- **`emitLog(name, parentSpan?, attributes?)`**: New function using `@opentelemetry/api-logs`. Emits a log record with the given name and attributes. When a parent span is provided, sets it as active context via `trace.setSpan(context.active(), span)` so the log record inherits trace_id and span_id.
- **Logger initialization**: `logs.getLogger()` called in `initTelemetry()` to obtain a Logger instance.

### src/slides.ts
- Converted 3 `addSpanEvent()` calls to `emitLog()`:
  - `progression.subgroup_unlocked`
  - `session.pause` / `session.resume`
  - `user.tap`

### src/ui/guild-columns.ts
- Converted 1 `addSpanEvent()` call to `emitLog()`:
  - `end.wheel_event`

### package.json
- Upgraded `@honeycombio/opentelemetry-web` from `^0.10.0` to `^1.3.0`. v1.x adds LoggerProvider with SimpleLogRecordProcessor and OTLP HTTP log exporter — required for `logs.getLogger()` to return a functioning logger instead of a no-op.

## Team
- **Developer**: Implemented `emitLog()`, converted all call sites, upgraded SDK.
- **Tester**: 16/16 tests passed. Honeycomb verification confirmed log records arrive with trace_id populated and flags=1 (sampled). Visible in trace waterfall.

## Acceptance Criteria — All Met

- [x] `emitLog()` function available in telemetry module
- [x] Log records sent immediately (SimpleLogRecordProcessor, not batched)
- [x] Log records carry trace_id and span_id when parent span provided
- [x] All 4 former addSpanEvent call sites converted
- [x] Log records appear in Honeycomb trace waterfall
- [x] Honeycomb Web SDK upgraded to 1.x
- [x] `addSpanEvent()` retained in codebase for potential future use

## Key Files Changed
- `src/telemetry/telemetry.ts` — `emitLog()`, logger initialization
- `src/slides.ts` — 3 call sites converted
- `src/ui/guild-columns.ts` — 1 call site converted
- `package.json` — SDK upgrade to ^1.3.0

## Observability
- Log records in Honeycomb with trace_id and flags=1 (sampled)
- Before: span events only shipped when parent span ended (unreliable in browser)
- After: log records ship immediately via SimpleLogRecordProcessor

## Decisions
- DEC-112: Trace-participating logs over span events
- DEC-113: Upgrade Honeycomb Web SDK to 1.x
- DEC-114: Explicit context passing for trace correlation
- DEC-115: Keep addSpanEvent available

## Lessons Learned
- The project was on `@honeycombio/opentelemetry-web` v0.10.0 from its earliest days. The `^0.10.0` semver range doesn't cross the 0.x→1.x boundary, so the SDK was never auto-upgraded. The 1.x line (with LoggerProvider support) was available but we missed it. Lesson: periodically check for major version bumps on key dependencies.
