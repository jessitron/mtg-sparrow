# Arc 1: Project Scaffolding

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 1 |
| **Name** | Project Scaffolding |
| **Type** | Structural |
| **Target Version** | 0.1.0 |
| **Start Date** | 2026-02-15 |
| **Completion Date** | 2026-02-15 |
| **Status** | COMPLETE |

## Intention

Establish the build pipeline, telemetry foundation, and version marking system. Prove that spans flow from the browser to Honeycomb.

## Observable Outcome

The app loads in a browser, displays `v0.1.0` in the footer, and sends an `app.startup` span to Honeycomb.

## Acceptance Criteria

- [x] TypeScript + esbuild build pipeline produces a working static page — **PASS** (Tester verified)
- [x] `index.html` loads and renders a minimal page with version in footer — **PASS** (Tester verified)
- [x] Honeycomb Web SDK initialized via wrapper module (`src/telemetry/`) — **PASS** (Tester verified)
- [x] App code does not import from `@honeycombio/opentelemetry-web` or `@opentelemetry/api` directly (only via wrapper) — **PASS** (Tester verified)
- [x] `app.startup` span sent to Honeycomb on page load — **PASS** (confirmed via Honeycomb query)
- [x] `APP_VERSION = "0.1.0"` appears as `service.version` resource attribute and in the startup span — **PASS** (confirmed in Honeycomb)
- [x] Version `v0.1.0` visible in UI footer — **PASS** (Tester verified)
- [x] Query Honeycomb: `service.name = "sparrow-deck"` returns the startup span with correct version — **PASS** (name=app.startup, service.name=sparrow-deck, service.version=0.1.0, app.version=0.1.0)

## Risks Being Reduced

- Build pipeline risk
- Honeycomb connectivity
- Telemetry wrapper pattern

## Expected Learning

- Actual bundle size of Honeycomb Web SDK with esbuild
- Whether auto-instrumentations need explicit disabling or are off by default
- Dev workflow ergonomics with esbuild (watch mode, refresh cycle)

## Key Decisions Made During Arc 1

- **DEC-028**: All bash commands must go through shell scripts in `scripts/`. No raw commands. Client approves scripts once.
- **DEC-029**: Honeycomb ingest-only API key provided by client, configured in `src/telemetry/init.ts`. Embedded in bundle per accepted pattern (DEC-008).

## Implementation Notes

- **Bundle size**: 147.3KB — significantly larger than the ~50KB estimate in RF-003/Proposal. Not a concern per client priorities (DEC-027). Recorded as learning for future estimates.

## Verification

- **Code/build verification by**: Tester (2026-02-15)
- **Runtime verification by**: Observability Engineer / Project Lead (2026-02-15)
- **Result**: All 8 acceptance criteria PASS.
- **Full report**: `small-arc-studios/roles/tester/notes/arc1-verification.md`
- **Minor observations** (non-blocking):
  - `SpanStatusCode` is imported but unused in `telemetry.ts`
  - API key hardcoded in `init.ts` (expected per DEC-008/DEC-029)
- **Honeycomb environment**: `sparrow-deck`
- **Honeycomb dataset**: `sparrow-deck`

## Outcome

Arc 1 delivered successfully. All acceptance criteria satisfied.

**What was established:**
- TypeScript + esbuild build pipeline producing static output
- Honeycomb Web SDK initialized via telemetry wrapper module (`src/telemetry/`)
- Architectural constraint enforced: no direct OTel/Honeycomb imports outside wrapper
- `app.startup` span flowing to Honeycomb with correct resource attributes
- Version `v0.1.0` visible in UI footer and on every span

**Risks reduced:**
- Build pipeline risk — eliminated
- Honeycomb connectivity — verified end-to-end
- Telemetry wrapper pattern — proven

**Learning captured:**
- Bundle size is 147.3KB (vs ~50KB estimate) — not a concern per DEC-027, but noted for future estimates
- Honeycomb environment/dataset: `sparrow-deck`

**Next arc:** Arc 2a — Render a Single Card (v0.2.0)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
