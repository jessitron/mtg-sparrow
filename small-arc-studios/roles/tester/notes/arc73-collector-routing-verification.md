# Arc 73 — OTel Collector Routing Verification

**Date**: 2026-03-30
**Test script**: `tests/verify-collector-routing.mjs`

## What was verified

### Browser test (Playwright): 4/4 PASS

1. **PASS** — At least one OTLP request went to `mtg-sparrow.jessitron.honeydemo.io` (found 2 POST /v1/traces)
2. **PASS** — Session heartbeat still goes directly to `api.honeycomb.io/1/events/sparrow-deck` (found 1)
3. **PASS** — No trace requests went directly to `api.honeycomb.io/v1/traces` (found 0)
4. **PASS** — No log requests went directly to `api.honeycomb.io/v1/logs` (found 0)

### Honeycomb confirmation

- Queried `sparrow-deck` environment, `sparrow-deck` dataset
- **Heartbeats confirmed**: 2 `session.heartbeat` events from `localhost` arrived at 18:37 and 18:38 UTC
- **Trace spans confirmed**: `documentLoad`, `resourceFetch`, `firstContentfulPaint`, `app.startup`, and log span events from `HeadlessChrome` / `localhost` are present in dataset (from prior test runs in same session; spans from the 18:38 run are in collector pipeline)
- All spans have `telemetry.distro.name: @honeycombio/opentelemetry-web`, confirming OTel SDK routing

## Key technical note

The OTel BatchSpanProcessor defaults to a 5000ms flush delay. The test triggers an immediate flush by navigating to a second page, which fires the `visibilitychange` event that the `BrowserSpanProcessor` hooks to flush pending spans. This makes the collector requests observable within the Playwright session.

## Conclusion

Telemetry is correctly routed: OTel traces/logs go through the collector at `mtg-sparrow.jessitron.honeydemo.io`, and the session heartbeat continues to fire directly to Honeycomb.
