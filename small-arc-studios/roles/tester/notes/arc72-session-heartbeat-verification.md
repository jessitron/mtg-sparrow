# Arc 72 — Session Heartbeat Verification

## Date
2026-03-30

## Test Script
`tests/arc72-session-heartbeat.mjs`

## What Was Tested

### Phase 1 — Fresh session fires a heartbeat POST to Honeycomb
- Opened the app in a fresh Playwright browser context (no sessionStorage)
- Intercepted outbound `POST https://api.honeycomb.io/1/events/sparrow-deck`
- Verified exactly 1 heartbeat fired on page load
- Verified HTTP method is POST
- Verified `X-Honeycomb-Team` header is present
- Verified all required payload fields are present and non-empty:
  - `event.type = session.heartbeat`
  - `event.source = direct`
  - `session.id` (non-empty hex string)
  - `player.id` (non-empty hex string)
  - `page.hostname = localhost`
  - `page.url`, `page.path`
  - `app.version = 0.42.0`
  - `app.page = welcome`
  - `browser.language = en-US`
  - `screen.width = 1280`, `screen.height = 720`
  - `viewport.width = 1280`, `viewport.height = 720`

### Phase 2 — No second heartbeat on same-session navigation
- Navigated to `/slides.html` in the same browser context (same sessionStorage)
- Confirmed heartbeat count remained at 1 (no additional POST)

### Phase 3 — Exactly one heartbeat per new session
- Opened a second brand-new browser context (fresh session)
- Loaded home page, then navigated to `/slides.html`
- Confirmed exactly 1 heartbeat total (not 2)

## Results
**23 / 23 checks PASS**

## Honeycomb Query
Queried `WHERE event.type = session.heartbeat AND event.source = direct` in last 30 minutes.
Found 1 sample — a pre-seeded test fixture (`session.id = test-heartbeat-001`, `utm.source = testing`).
The Playwright browser requests were fulfilled locally by `page.route()` interception (correct behavior for test isolation — real browser fetches are not forwarded to Honeycomb in headless tests).

## Verdict
PASS. The session heartbeat feature works correctly:
- Fires exactly once per new session
- Carries all required fields
- Does not re-fire on same-session navigation
