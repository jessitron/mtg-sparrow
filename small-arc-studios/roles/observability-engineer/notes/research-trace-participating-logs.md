# Research: Trace-Participating Logs for Sparrow Deck

**Date**: 2026-03-07
**Status**: Research complete, ready for implementation planning

---

## The Problem: Span Events Are Unreliable in the Browser

### What We Have Today

Our telemetry API (`src/telemetry/telemetry.ts`) exposes `addSpanEvent()`, which calls `span.addEvent()` from the OpenTelemetry Traces API. We use this for:

- `progression.subgroup_unlocked` (slides.ts:77)
- `session.pause` / `session.resume` (slides.ts:166)
- `user.tap` (slides.ts:265)
- `end.wheel_event` (guild-columns.ts:1105)

### Why This Is Dangerous

**Span events are only transmitted when the parent span ends.** In a browser:

1. The user closes the tab -- the span never ends, events are lost forever.
2. The user navigates away -- same problem, unless `flushSpans()` fires in time.
3. The browser crashes or the OS kills the tab -- everything is lost.
4. Even when the span *does* end normally, events are invisible in Honeycomb until that moment. For a long-running session span, this means minutes or hours of delay.

Our `flushSpans()` uses `visibilitychange` + `provider.forceFlush()`, but this is a best-effort mitigation. The browser may not give us enough time, and `forceFlush` only sends spans that have already ended.

**Bottom line**: Every `addSpanEvent()` call is a data-loss risk. We should treat span events as unreliable in browser telemetry.

---

## What Are Trace-Participating Logs?

A **trace-participating log** is an independent log record that carries `trace_id` and `span_id` as attributes, correlating it to a trace -- but it is **sent immediately** as its own record, not waiting for any span to end.

In Honeycomb, trace-participating logs appear in the trace waterfall view just like span events do, but they:
- Are sent right away (no waiting for span end)
- Survive tab closes and navigation
- Are queryable independently in the dataset
- Show up in real-time, not after session end

The client wrote about this approach in December 2023: https://jessitron.com/2023/12/22/sending-otlp-logs-from-javascript/

Key quote from that post: "OTel Logs are a little harder to use than span events but are otherwise superior, as they send independently and are queryable separate from the spans they associate with."

---

## Technical Options

### Option A: OpenTelemetry Logs SDK (Recommended)

**How it works**: Set up a `LoggerProvider` alongside our existing `TracerProvider`. Use `logger.emit()` to send log records. The SDK automatically attaches `trace_id` and `span_id` from the active span context.

**Packages needed** (all three are new dependencies):
```
@opentelemetry/api-logs          -- Logs API (currently alpha/experimental)
@opentelemetry/sdk-logs          -- LoggerProvider, processors
@opentelemetry/exporter-logs-otlp-http  -- OTLP HTTP exporter for logs
```

**Setup sketch**:
```typescript
import * as logsAPI from "@opentelemetry/api-logs";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

const logExporter = new OTLPLogExporter({
  url: "https://api.honeycomb.io/v1/logs",
  headers: {
    "x-honeycomb-team": "<API_KEY>",
  },
});

const loggerProvider = new LoggerProvider({
  resource: resource,  // same Resource as our TracerProvider
});

loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(logExporter)
);

logsAPI.logs.setGlobalLoggerProvider(loggerProvider);
```

**Emitting a trace-participating log**:
```typescript
const logger = logsAPI.logs.getLogger("sparrow-deck");

// If called within an active span context, trace_id and span_id
// are automatically attached by the SDK
logger.emit({
  body: "session.pause",
  severityNumber: logsAPI.SeverityNumber.INFO,
  attributes: {
    "event.name": "session.pause",
    "pause.slide_index": 5,
  },
});
```

**Pros**:
- Standard OTel approach; the "right" way to do this
- Automatic trace context correlation
- `SimpleLogRecordProcessor` sends each log immediately (vs. `BatchLogRecordProcessor` which batches)
- Logs are independently queryable in Honeycomb
- Same OTLP endpoint, just `/v1/logs` instead of `/v1/traces`

**Cons**:
- Logs API is still experimental/alpha in the JS SDK (has been since 2023, but functional)
- Three new npm packages
- Browser-specific: the `@opentelemetry/exporter-logs-otlp-http` package is listed under `experimental/packages` in the OTel JS repo
- Need to share the same `Resource` between TracerProvider and LoggerProvider for proper correlation
- The `@honeycombio/opentelemetry-web` SDK does NOT include logs support -- we set this up ourselves

### Option B: Short-Lived Child Spans (Simpler Alternative)

**How it works**: Instead of `span.addEvent()`, create a child span that starts and immediately ends. This produces a real span with its own export lifecycle.

**Setup**: No new packages needed. Uses our existing `startChildSpan` + `endSpan`.

```typescript
// Instead of: addSpanEvent(sessionSpan, 'session.pause', attrs)
// Do:
const eventSpan = startChildSpan('session.pause', sessionSpan, {
  'pause.slide_index': 5,
});
eventSpan.end(); // Ends immediately, eligible for export
```

**Pros**:
- Zero new dependencies
- Uses existing infrastructure
- Each "event" is a real span that gets exported independently
- Shows up in Honeycomb trace waterfall naturally
- Dead simple to implement

**Cons**:
- Still depends on `forceFlush()` for actual transmission (spans are batched by `BatchSpanProcessor`)
- Semantic mismatch: these aren't really "spans" with duration, they're events. Duration will show as ~0ms.
- More spans = more data volume (though for our scale this is negligible)
- Doesn't solve the "immediate send" problem unless we use `SimpleSpanProcessor` (which sends every span immediately but has performance implications)

### Option C: Manual Fetch to OTLP Endpoint (Escape Hatch)

**How it works**: Construct OTLP JSON log payloads manually, send via `fetch()` or `navigator.sendBeacon()`.

**Pros**:
- No new OTel packages at all
- `sendBeacon()` survives page unload reliably
- Full control over timing

**Cons**:
- Must manually construct OTLP JSON format (error-prone)
- Must manually extract and attach trace_id/span_id
- No OTel SDK benefits (resource attributes, processors, etc.)
- Maintenance burden: OTLP format changes require manual updates
- Not recommended unless the SDK approach proves unworkable

---

## Honeycomb Compatibility

**Confirmed**: Honeycomb's OTLP endpoint (`https://api.honeycomb.io`) accepts log records at `/v1/logs`.

**Dataset routing**: In Honeycomb (non-Classic), the `service.name` resource attribute determines which dataset receives data. As long as our logs use the same `service.name` ("sparrow-deck") as our traces, they land in the same dataset.

**Trace correlation**: Log records with matching `trace_id` and `span_id` appear in the trace waterfall alongside spans. This is the same visual experience as span events, but with independent delivery.

**API key**: Same `x-honeycomb-team` header we already use for traces.

---

## Recommended Approach

**Option A (OTel Logs SDK)** is the recommended path, with **Option B (short-lived spans)** as a pragmatic intermediate step.

### Migration strategy:

1. **Phase 1 (quick win)**: Convert existing `addSpanEvent()` calls to short-lived child spans (Option B). This is a small code change, zero new dependencies, and immediately reduces data-loss risk since each event becomes an independently-exportable span.

2. **Phase 2 (proper solution)**: Add the OTel Logs SDK packages and implement a `LoggerProvider` in `init.ts`. Replace the short-lived spans with `logger.emit()` calls. Use `SimpleLogRecordProcessor` for immediate export.

3. **Phase 3 (reliability)**: Investigate using `navigator.sendBeacon()` as a transport for the OTLP log exporter during page unload, to maximize delivery reliability.

### Why this order:

- Phase 1 gives us immediate improvement with near-zero risk
- Phase 2 gives us the architecturally correct solution
- Phase 3 addresses the last-mile delivery concern

---

## Complexity Estimate

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Short-lived spans | Small (1 arc) | Very low -- refactor existing calls |
| Phase 2: Logs SDK setup | Medium (1-2 arcs) | Medium -- new packages, experimental API, need to share Resource |
| Phase 3: Beacon transport | Small-medium (1 arc) | Medium -- custom exporter or transport layer |

---

## Unknowns Requiring Spike Work

1. **Resource sharing**: The `@honeycombio/opentelemetry-web` SDK creates its own `Resource` internally. We need to verify we can create a `LoggerProvider` with an identical `Resource` so that `service.name`, `session.id`, and other resource attributes match between traces and logs. May need to extract the Resource from the existing provider.

2. **Browser bundle size**: The three new packages (`api-logs`, `sdk-logs`, `exporter-logs-otlp-http`) add to the bundle. Need to measure the impact via esbuild.

3. **CORS**: The Honeycomb `/v1/logs` endpoint must accept browser CORS requests the same way `/v1/traces` does. This is almost certainly true but should be verified.

4. **Active span context in our code**: The automatic trace context attachment only works if there's an active span in the OTel context. Our code uses `startSpan()` but may not always set the span as active in context (we pass parent spans explicitly via `startChildSpan`). We may need to manually extract trace_id/span_id and attach them as log attributes.

5. **`mana-gas.js` boundary**: The mana-gas module is standalone vanilla JS (not in the esbuild bundle). It currently uses CustomEvent dispatch for cross-boundary communication. Logs from the gas simulation would need a similar bridge pattern, or we accept that gas events remain as-is.

---

## Key Institutional Knowledge

**Client insight (2026-03-07)**: Span events in browser telemetry are fundamentally unreliable because they depend on the parent span ending and being exported. In a browser context, there are many scenarios where this never happens. Trace-participating logs solve this by being sent independently while still correlating to the trace. This is not just a nice-to-have -- it's a critical reliability improvement for any browser-based observability.

The client authored the original research on this topic: https://jessitron.com/2023/12/22/sending-otlp-logs-from-javascript/

---

## Sources

- [OpenTelemetry JS SDK](https://opentelemetry.io/docs/languages/js/)
- [OTel JS SDK 2.0 Announcement](https://opentelemetry.io/blog/2025/otel-js-sdk-2-0/)
- [@opentelemetry/sdk-logs on npm](https://www.npmjs.com/package/@opentelemetry/sdk-logs)
- [@opentelemetry/api-logs on npm](https://www.npmjs.com/package/@opentelemetry/api-logs)
- [@opentelemetry/exporter-logs-otlp-http on GitHub](https://github.com/open-telemetry/opentelemetry-js/blob/main/experimental/packages/exporter-logs-otlp-http/README.md)
- [Honeycomb: Send Logs from OTel SDKs](https://docs.honeycomb.io/send-data/logs/opentelemetry/sdk/)
- [Honeycomb: JS SDK Logs Example](https://docs.honeycomb.io/send-data/logs/opentelemetry/sdk/javascript)
- [Honeycomb: Send Data with OpenTelemetry](https://docs.honeycomb.io/send-data/opentelemetry)
- [Sending OTLP Logs from JavaScript (jessitron.com)](https://jessitron.com/2023/12/22/sending-otlp-logs-from-javascript/)
- [OTel Logs Specification](https://opentelemetry.io/docs/specs/otel/logs/)
- [OTel Browser Getting Started](https://opentelemetry.io/docs/languages/js/getting-started/browser/)
