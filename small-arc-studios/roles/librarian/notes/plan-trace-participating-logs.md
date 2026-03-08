# Plan: Trace-Participating Logs

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-07
**Client**: Jessitron

---

## Section 1: Discovery

### Problem Statement

We use `addSpanEvent()` for in-page user actions (pause, resume, tap, wheel navigation). Span events are only sent when their parent span ends. In a browser, spans may never end — the user closes the tab, navigates away, or the browser crashes. These events are lost forever. Even when the span does end, events aren't visible in Honeycomb until the page closes.

### Goals

1. Replace `addSpanEvent()` calls with trace-participating log records
2. Log records are sent immediately (not waiting for span end)
3. Log records carry trace_id and span_id so they appear in Honeycomb's trace waterfall
4. Zero new package dependencies

### Non-Goals

- Changing the span structure itself
- Adding new telemetry events (only converting existing ones)
- Replacing the startup span or page view spans

### Technical Discovery

**Key finding**: The `@honeycombio/opentelemetry-web` SDK (v0.10.0) **already initializes the full OTel Logs pipeline**:

- `configureLogExporters()` creates an HTTP JSON log exporter pointed at Honeycomb
- `LoggerProvider` is created with `SimpleLogRecordProcessor` — logs sent immediately, not batched
- `logs.setGlobalLoggerProvider()` is called — the global API is wired up
- `@opentelemetry/api-logs` v0.55.0 is already installed as a transitive dependency
- `forceFlush()` already flushes the LoggerProvider too

**Usage pattern**:
```typescript
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const logger = logs.getLogger('sparrow-deck');

// Emit a trace-participating log — automatically picks up active span context
logger.emit({
  severityNumber: SeverityNumber.INFO,
  body: 'session.pause',
  attributes: { 'session.card_index': 5 },
});
```

**Important caveat**: The log record picks up trace context from the *active* context, not from a span reference we pass in. Our code currently passes parent spans explicitly via `startChildSpan(name, parent, attrs)`. We may need to use the OTel context API to set the active span before emitting the log, or manually set trace_id/span_id on the log record attributes.

### Call sites to convert

1. `src/slides.ts` — `addSpanEvent(sessionSpan, 'session.pause', ...)`
2. `src/slides.ts` — `addSpanEvent(sessionSpan, 'session.resume', ...)`
3. `src/slides.ts` — `addSpanEvent(cardSpan, 'user.tap', ...)`
4. `src/slides.ts` — `addSpanEvent(sessionSpan, 'progression.subgroup_unlocked', ...)`
5. `src/ui/guild-columns.ts` — `addSpanEvent(sectionSpanRef.current, 'end.wheel_event', ...)`

### Risks and Unknowns

| Risk | Mitigation |
|------|------------|
| Active context may not have the right span | Test with explicit context setting; check if manual trace_id works |
| Log records might not correlate in Honeycomb | Verify in Honeycomb via MCP after implementation |
| SDK version 0.10.0 might have bugs in log path | This is a well-tested code path in the upstream SDK |

### Observability Strategy

This arc IS the observability improvement. Verification: emit a log, check Honeycomb, confirm it appears in the trace waterfall with the correct trace_id.

### Testing Strategy

- Playwright: trigger a pause action, then query Honeycomb for log records with `session.pause`
- Verify log records appear in the same trace as the session span
- Compare before/after: span events vs log records in the trace waterfall

---

## Section 2: Arcs

### Arc 34: Convert Span Events to Trace-Participating Logs

**Type**: Operator

**Intention**: Replace `addSpanEvent()` calls with OTel log records that are sent immediately and survive page abandonment.

**Observable Outcome**: User actions (pause, resume, tap, scroll) appear as log records in Honeycomb trace waterfall immediately, without waiting for the parent span to end.

**Acceptance Criteria**:
1. A `emitLog()` helper in `src/telemetry/telemetry.ts` wraps the OTel Logs API
2. All 5 `addSpanEvent()` call sites are converted to use `emitLog()`
3. Log records include the correct trace_id and span_id
4. Log records appear in Honeycomb's trace waterfall
5. Log records are sent immediately (verifiable by checking Honeycomb before closing the page)
6. No new package dependencies added

**Tests Included**:
- Playwright: navigate to slides, click pause, query Honeycomb for the log record
- Verify trace correlation in Honeycomb via MCP

**Observability Plan**:
- The arc itself delivers observability improvement
- Verify by querying Honeycomb for log records in the sparrow-deck dataset
- Compare trace waterfall before and after

**Risks Reduced**:
- Eliminates data loss from abandoned spans
- Makes user actions visible in real-time

**Expected Learning**:
- Whether the Honeycomb SDK's log pipeline works correctly from the browser
- Whether active context propagation works for our explicit-parent pattern
- Whether log records and span events can coexist during transition

### Communication Cadence

Pause for client review after Arc 34 is complete.

---

*Submitted for client review.*
