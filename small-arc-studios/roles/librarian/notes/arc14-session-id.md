# Arc 14: Session ID Telemetry

**Status:** Complete — verified by Tester, Playwright 6/6 PASS, Honeycomb confirmed

**Version:** 0.12.0

**Completed:** 2026-03-01

**Type:** Operator Arc

## Intention

Add `mtg-sparrow.session.id` telemetry to all spans while the app is still single-page, before multi-page structural decomposition begins. This provides a correlation key that will survive page navigations in the multi-page architecture.

This arc precedes all structural changes by design (DEC-056): observability-first development means each subsequent arc is verifiable in Honeycomb from day one.

## Observable Outcome

All spans carry two new attributes:
- `mtg-sparrow.session.id`: a 16-character hex ID generated at session start, stored in `sessionStorage`
- `app.navigation`: `'single_page'` on the `app.startup` span (structural marker for this architecture era)

Honeycomb grouping by `mtg-sparrow.session.id` correctly segments telemetry by session.

## Acceptance Criteria

- `mtg-sparrow.session.id` appears on `app.startup`, `session`, and `card` spans ✓
- `app.navigation = 'single_page'` appears on the `app.startup` span ✓
- Session ID is a 16-character hex string ✓
- Session ID persists across page refreshes within the same browser session (sessionStorage) ✓
- New session ID generated for each new browser session ✓
- Honeycomb grouping by `mtg-sparrow.session.id` works ✓

## Implementation

### Session ID Generation
- Generated via `crypto.getRandomValues` producing a 16-character hex string
- Stored in `sessionStorage` under key `mtg-sparrow.session.id`
- Persists across refresh; new tab/browser restart generates a new ID
- Encapsulated in `src/telemetry/` (consistent with DEC-020)

### Resource Attributes Added
- `mtg-sparrow.session.id`: applied as a resource attribute so all spans carry it automatically
- `app.navigation`: `'single_page'` — structural marker on `app.startup` span only

### APP_VERSION
- Bumped from `0.11.0` to `0.12.0`

## Commits

- `c1c6a2e` — Add mtg-sparrow.session.id and app.navigation resource attributes
- `8b98ce6` — Arc 14: Bump APP_VERSION to 0.12.0
- `8d5324e` — Arc 14: Add Playwright verification test for session ID telemetry

## Verification

### Playwright Tests
- 6/6 checks PASS
- Test loads the app in a real browser, waits for spans to flush, then queries Honeycomb to confirm both `mtg-sparrow.session.id` and `app.navigation` attributes are present on `app.startup`, `session`, and `card` spans

### Honeycomb Confirmation
- Both `mtg-sparrow.session.id` and `app.navigation` confirmed present on `app.startup`, `session`, and `card` spans
- Grouping by `mtg-sparrow.session.id` correctly segments data by session

## Known Issues / Pre-existing Bugs

**flushSpans() error on visibilitychange** — `e.forceFlush is not a function` error fires when the page is hidden (tab close, navigate away). Spans still export successfully via the batch timer. This bug predates Arc 14 and was not introduced here. Logged as a known issue to fix before multi-page arcs (17-20) where flush-on-page-hide becomes critical for cross-page observability.

## Next Arc

**Arc 15** — Split CSS into per-page stylesheets (style/welcome/slides/assessment/end) + dead CSS cleanup (DEC-057)
