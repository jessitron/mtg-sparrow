# Arc 1 Implementation Notes — Developer

## Files Created

### src/telemetry/init.ts
- Internal SDK initialization. Not exported to app code.
- Uses HoneycombWebSDK with `instrumentations: []` (manual only, per DEC-020).
- Placeholder API key `__HONEYCOMB_API_KEY__` — client will provide the real one.
- Guard against double-init with a null check on the sdk variable.
- Resource attributes: `service.version`, `browser.language`, `browser.platform`.

### src/telemetry/telemetry.ts
- App-facing API. Only file the rest of the app should import from.
- Exports: `initTelemetry`, `startSpan`, `endSpan`, `sendStartupSpan`.
- `startSpan` is generic — accepts name and optional attributes. Extensible for Arc 2b session/card spans.
- `sendStartupSpan` fires a one-shot `app.startup` span with `app.version` attribute.
- Imports `SpanStatusCode` from `@opentelemetry/api` — not used yet but available for error marking in future arcs.

### src/main.ts
- `APP_VERSION = "0.1.0"` exported as a constant.
- On DOMContentLoaded: init telemetry, send startup span, set footer version text.
- Expects an element with `id="app-version"` in index.html (Architect creating that).

## Design Choices

1. **Version defined in main.ts, passed to telemetry** — The SOW says APP_VERSION lives in main.ts and gets passed down. The observability plan example had it in init.ts, but the task assignment is explicit: main.ts owns the version constant.

2. **Lazy tracer creation** — The tracer is created inside `initTelemetry()` rather than at module load. This ensures the SDK is initialized before we try to get a tracer.

3. **Generic startSpan/endSpan** — Rather than domain-specific functions (startSession, startCard), we export generic span helpers for Arc 1. Arc 2b will add domain-specific wrappers when we know the exact API shape from real usage.

4. **No re-export of OTel types** — App code that calls `startSpan` gets back a `Span` type from `@opentelemetry/api`. This is a small leak of the OTel API type into main.ts's type dependency. For Arc 1 this is fine since main.ts doesn't hold onto spans. In Arc 2b when session/card management needs Span references, we should consider wrapping the Span type or using domain-specific functions that hide it.

## For Next Developer

- The `__HONEYCOMB_API_KEY__` placeholder needs to be replaced with the client's real key. Could be done via esbuild's `define` feature or a simple string replacement in the build.
- `SpanStatusCode` is imported but unused — it's there for when we need to mark spans as errored.
- The footer element ID `app-version` must match what the Architect puts in index.html.
