# Arc 1: Project Scaffolding — Verification Report

**Verified by:** Tester (Quality Engineer)
**Date:** 2026-02-15
**Verdict:** PASS (all code-level and build-level criteria met)

---

## Acceptance Criteria Results

### 1. TypeScript + esbuild build pipeline — PASS
- `scripts/build.sh` completes successfully
- esbuild produces `dist/bundle.js` (150.8 KB) and `dist/bundle.js.map` (1.2 MB) in 42ms
- `scripts/typecheck.sh` (`tsc --noEmit`) completes with zero errors

### 2. index.html loads and renders with version in footer — PASS
- index.html contains `<footer id="app-version">v0.1.0</footer>`
- Local server (`scripts/serve.sh` via `npx serve . -l 3000`) serves the page at localhost:3000
- curl confirms the full HTML is served correctly

### 3. Honeycomb Web SDK initialized via wrapper module — PASS
- `src/telemetry/init.ts` imports `HoneycombWebSDK` from `@honeycombio/opentelemetry-web`
- Configures serviceName as `sparrow-deck`, sets resource attributes including `service.version`
- `src/telemetry/telemetry.ts` provides the app-facing API (`initTelemetry`, `startSpan`, `endSpan`, `sendStartupSpan`)

### 4. App code does not import from Honeycomb/OTel directly — PASS
- Searched all `.ts` files in `src/` for `@honeycombio/opentelemetry-web` and `@opentelemetry/api`
- Only matches are inside `src/telemetry/init.ts` and `src/telemetry/telemetry.ts` (the wrapper module)
- `src/main.ts` imports only from `./telemetry/telemetry` — correct encapsulation

### 5. app.startup span sent on page load — PASS (code-level)
- `src/main.ts` calls `sendStartupSpan(APP_VERSION)` on DOMContentLoaded
- `src/telemetry/telemetry.ts` creates a span named `app.startup` with `app.version` attribute
- **Note:** Actual Honeycomb query verification deferred to Observability Engineer

### 6. APP_VERSION = "0.1.0" as service.version — PASS
- `src/main.ts` defines `APP_VERSION = '0.1.0'`
- `initTelemetry(APP_VERSION)` passes it to `init(version)` in `src/telemetry/init.ts`
- `init.ts` sets `resourceAttributes: { 'service.version': version }` — correct wiring

### 7. Version v0.1.0 visible in UI footer — PASS
- `index.html` has `<footer id="app-version">v0.1.0</footer>` (static fallback)
- `src/main.ts` dynamically updates: `versionEl.textContent = \`v${APP_VERSION}\``
- Both static HTML and JS runtime agree on `v0.1.0`

### 8. Build output is valid — PASS
- `dist/bundle.js` exists (150,831 bytes)
- `dist/bundle.js.map` exists (1,247,455 bytes)
- Build format is ESM with minification and sourcemaps enabled

---

## Observations

- **Telemetry encapsulation is clean.** The wrapper pattern in `src/telemetry/` correctly isolates vendor dependencies. App code only touches the facade.
- **`telemetry.ts` imports `SpanStatusCode` but doesn't use it.** Minor — not a blocker, but worth noting for cleanup.
- **API key is hardcoded in `init.ts`.** This is a known pattern for browser-side telemetry (the key is for ingest only), but the team should confirm this is the intended Honeycomb ingest key.
- **Server script uses `npx serve`** which is fine for development. Works as expected on port 3000.

## Remaining Verification

- **Honeycomb span verification** — Observability Engineer should confirm `app.startup` span appears in Honeycomb with `service.version: 0.1.0`. This requires loading the page in a real browser (not curl, since the JS needs to execute).

## Verdict

All 8 acceptance criteria are met at the code and build level. Arc 1 is verified from the Tester perspective, pending Observability Engineer confirmation of actual span delivery to Honeycomb.
