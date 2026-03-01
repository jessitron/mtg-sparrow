# Arc 14 Observability Verification Report

> Date: 2026-03-01
> Status: BLOCKED — No v0.12.0 spans in Honeycomb

---

## What Arc 14 Implemented (Code Review)

The code is correctly written:

- `mtg-sparrow.session.id` — set as a **resource attribute** in `src/telemetry/init.ts:17`
- `app.navigation = 'single_page'` — set as a **resource attribute** in `src/telemetry/init.ts:18`
- `APP_VERSION = '0.12.0'` — defined in `src/main.ts:17`
- Session ID is generated via `crypto.getRandomValues`, stored/retrieved from `sessionStorage`
- Playwright test (`tests/arc-14-session-id.mjs`) verifies sessionStorage behavior

## Honeycomb Query Results

Queried `sparrow-deck` environment, `sparrow-deck` dataset:

### Column Search
- `app.version` — EXISTS, last written 2026-03-01 21:10:00 ✓
- `session.id` — EXISTS (from v0.11.0, span attribute), last written 2026-03-01 21:10:00
- `mtg-sparrow.session.id` — **DOES NOT EXIST** ✗
- `app.navigation` — **DOES NOT EXIST** ✗

### Version Distribution (last 7 days)
| Version | Span Count |
|---------|-----------|
| 0.11.0  | 413       |
| 0.8.0   | 229       |
| 0.7.0   | 111       |
| (null)  | 1055      |
| **0.12.0** | **0 — no spans** |

Most recent v0.11.0 spans seen at 2026-03-01 21:13 (today, from localhost and github.io).

## Root Cause

**The app has not been run with v0.12.0 code in a browser connected to Honeycomb.**

The code is committed but no browser has loaded it yet. The developer was running v0.11.0 as recently as 21:13 today. No v0.12.0 spans have been transmitted.

## Implications

### What Cannot Be Verified Yet
1. `mtg-sparrow.session.id` appearing on spans (it's a resource attribute — should propagate to all spans)
2. `app.navigation = 'single_page'` appearing on startup span
3. Session ID grouping/filtering in Honeycomb queries

### What the Playwright Test Covers
The Playwright test (`tests/arc-14-session-id.mjs`) verifies:
- Session ID stored in sessionStorage on load
- Session ID is a 16-char hex string
- Session ID persists after interaction
- Session ID persists after page refresh
- New tab gets a different session ID

**Important**: The Playwright test does NOT verify Honeycomb receipt. It only verifies in-browser behavior.

## Concern: Resource Attribute Naming

`mtg-sparrow.session.id` is set as a **resource attribute** (not a span attribute). Resource attributes in the Honeycomb Web SDK should propagate to all spans as top-level columns in Honeycomb. But this needs to be confirmed once spans are actually sent.

The hyphenated namespace (`mtg-sparrow.`) is unconventional — most columns use dot-separated namespaces. Honeycomb should handle it fine, but worth confirming.

## Arc 14 Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| `mtg-sparrow.session.id` on session and card spans | ❓ Cannot verify — no v0.12.0 spans |
| `app.navigation = 'single_page'` on startup span | ❓ Cannot verify — no v0.12.0 spans |
| Visible and queryable in Honeycomb | ❌ Not yet visible |

## Required Action

Developer needs to:
1. Build and run the app with v0.12.0 code
2. Load it in a browser (localhost or deployed)
3. Allow spans to flush to Honeycomb
4. Then re-run this verification

Arc 14 is **NOT complete** from an observability standpoint.
