# Session Heartbeat — Direct-to-Honeycomb Signal

> Added: 2026-03-30
> File: `src/telemetry/telemetry.ts`

---

## Purpose

A fire-and-forget `fetch()` event sent directly to the Honeycomb Events API
**once per new session**. This bypasses the OTel collector pipeline entirely,
so it can serve as a reference signal when comparing direct vs collector-routed
telemetry, and as a health check to detect if the collector is down.

---

## Implementation

- **Function**: `sendSessionHeartbeat()` in `src/telemetry/telemetry.ts`
- **Trigger**: Called inside `initTelemetry()` only when `storedSession === null`
  (i.e., when a new sessionStorage entry is created — exactly once per browser session)
- **Transport**: Raw `fetch()` to `https://api.honeycomb.io/1/events/sparrow-deck`
- **Auth**: `Authorization: <raw ingest key>` (no "Bearer" prefix, per Honeycomb Events API spec)
- **Error handling**: `.catch()` logs `console.warn` — never throws, never blocks init

---

## Event Fields

| Field | Source |
|---|---|
| `event.type` | `"session.heartbeat"` (fixed) |
| `event.source` | `"direct"` (fixed — distinguishes from collector path) |
| `session.id` | sessionStorage `mtg-sparrow.session.id` |
| `player.id` | localStorage `mtg-sparrow.player.id` |
| `page.hostname` | `window.location.hostname` |
| `page.url` | `window.location.href` |
| `page.path` | `window.location.pathname` |
| `app.version` | version param passed to `initTelemetry()` |
| `app.page` | page param passed to `initTelemetry()` (empty string if absent) |
| `browser.language` | `navigator.language` |
| `screen.width` | `window.screen.width` |
| `screen.height` | `window.screen.height` |
| `viewport.width` | `window.innerWidth` |
| `viewport.height` | `window.innerHeight` |

---

## Honeycomb Query to Verify

To find heartbeats in Honeycomb:
- Dataset: `sparrow-deck`
- Filter: `event.type = session.heartbeat`
- Or: `event.source = direct`

---

## Notes

- The API key is duplicated (as a constant `HONEYCOMB_API_KEY`) in `telemetry.ts`,
  alongside the same key in `init.ts`. This was a deliberate tradeoff: the heartbeat
  is intentionally separate from the OTel SDK, so a shared import would couple the concerns.
- This event does NOT go through OTel spans or logs — it appears as a raw Honeycomb event,
  not in traces.
