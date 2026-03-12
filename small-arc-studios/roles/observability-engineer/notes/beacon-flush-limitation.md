# Browser OTel Span Flushing: The sendBeacon Limitation

**Date**: 2026-03-12
**Relevance**: All browser-based OpenTelemetry implementations sending to authenticated backends

---

## The Problem in Brief

Browser OpenTelemetry cannot reliably deliver spans that are emitted immediately before page navigation. This is a fundamental constraint of browser HTTP APIs, not a bug in the OTel SDK or Honeycomb. Understanding why requires following the chain from the Beacon API up through the SDK.

---

## Finding 1: sendBeacon Cannot Send Custom HTTP Headers

The [Beacon API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon) signature is:

```js
navigator.sendBeacon(url, data)
```

It accepts only a URL and an optional body (Blob, FormData, or string). There is no parameter for HTTP headers.

**Consequence**: Honeycomb requires an `x-honeycomb-team` API key header for authentication. sendBeacon cannot provide this header. Therefore, **sendBeacon cannot be used to send telemetry directly to Honeycomb's OTLP endpoint** (or any other authenticated OTLP backend).

---

## Finding 2: The OTel SDK Never Uses sendBeacon for Honeycomb

In `@opentelemetry/otlp-exporter-base`, the transport selection logic in `create-legacy-browser-delegate.js` is:

```js
const useXhr = !!config.headers || typeof navigator.sendBeacon !== 'function';
```

If **any** headers are configured, the SDK falls back to XHR instead of sendBeacon. The Honeycomb SDK always configures headers — at minimum `x-honeycomb-team`, and often `x-honeycomb-dataset` and others.

**Result**: sendBeacon transport is **never activated** when sending directly to Honeycomb. The SDK always uses `XMLHttpRequest`.

---

## Finding 3: XHR Requests Are Cancelled on Page Navigation

`XMLHttpRequest` in-flight requests are **aborted** when the browser unloads or navigates away from the page. The browser does not wait for them to complete.

Critically: `sdk.forceFlush()` resolves when spans are handed to the exporter (i.e., when the XHR is created and sent), **not** when the HTTP request completes and receives a response.

**Impact**: Spans emitted right before navigation — often the most interesting moments, such as a user clicking a submit button or completing an assessment — are the most likely to be silently dropped. No error is thrown. No retry occurs.

---

## Finding 4: Workarounds (and Their Trade-offs)

### Workaround A: `visibilitychange` flush (already implemented, Arc 17)

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sdk.forceFlush();
});
```

**Good for**: User-initiated navigation (tab close, switching tabs, clicking a link that triggers a page load).
**Not reliable for**: Programmatic navigation (`location.replace()`, `location.href = ...`) that fires synchronously in JS before `visibilitychange` has time to flush.

### Workaround B: Delay before programmatic navigation

Insert an artificial pause (e.g. 200–500ms) before calling `location.replace()` or `location.href =`. This gives the XHR time to complete.

**Good for**: Controlled navigations where you control the code.
**Our implementation**: The debug mode modal provides a 3-second visual countdown, which incidentally solves this for debugging workflows.
**Not ideal for**: Production UX where you don't want artificial delays.

### Workaround C: `fetch` with `keepalive: true`

The modern equivalent of sendBeacon that **does** support custom headers:

```js
fetch(url, {
  method: 'POST',
  headers: { 'x-honeycomb-team': apiKey, 'Content-Type': 'application/json' },
  body: payload,
  keepalive: true,  // survives page unload
});
```

`keepalive: true` tells the browser to complete the request even if the page navigates away — exactly what we need.

**Limitation**: The OTel SDK (as of `@opentelemetry/otlp-exporter-base` 0.x/1.x) does not offer `fetch` with `keepalive` as a configurable transport. It supports only XHR and sendBeacon. Implementing this would require a custom exporter.

### Workaround D: Local OTel Collector (the proper fix)

Run an OpenTelemetry Collector on `localhost` (or same-origin in production). The browser sends to:

```
http://localhost:4318/v1/traces   (no auth headers needed — same-origin trust)
```

The collector then forwards to Honeycomb with the API key injected server-side.

**Benefits**:
- No auth headers needed for the browser request → sendBeacon works → spans survive navigation.
- API key never exposed in the browser bundle.
- Collector can batch, retry, and enrich spans.

**Trade-offs**: Requires running a sidecar process locally and a forwarding service in production. Significant infrastructure overhead for a small project.

---

## Finding 5: Scope of Impact

This is **not specific to Honeycomb or this project**. It affects:

- Any browser OTel setup sending to an authenticated OTLP backend (Honeycomb, Datadog, Grafana Cloud, Jaeger with auth, etc.)
- Any span emitted in the `beforeunload`, `visibilitychange`, or synchronous pre-navigation window

The pattern of "emit a span, then navigate" is extremely common (form submissions, button clicks that trigger page transitions, assessment completions). These are high-value spans that developers want most — and the ones most at risk of loss.

---

## Practical Guidance for This Project

| Scenario | Risk Level | Current Mitigation |
|---|---|---|
| User clicks browser back/forward | Low | visibilitychange flush (Arc 17) |
| User closes tab | Low | visibilitychange flush (Arc 17) |
| JS calls `location.replace()` | **High** | None (debug modal delay is dev-only) |
| Assessment completion → end page | **High** | None |
| Slides → assessment navigation | **High** | None |

**Recommendation**: For any programmatic navigation, add a short awaited delay (100–300ms) after `forceFlush()` before navigating. This is imperfect but low-cost and meaningfully reduces loss.

```ts
await sdk.forceFlush();
await new Promise(resolve => setTimeout(resolve, 200));
location.replace('/next-page.html');
```

The proper long-term fix is a local OTel Collector, but that's a significant infrastructure investment not yet warranted.

---

## References

- MDN: [Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- MDN: [fetch() `keepalive` option](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#keepalive)
- OTel SDK source: `@opentelemetry/otlp-exporter-base` → `src/platform/browser/create-legacy-browser-delegate.ts`
- Arc 17: initial `visibilitychange` flush implementation
