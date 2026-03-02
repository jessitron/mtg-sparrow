# Arc 21: Cross-Page Telemetry Verification

## Arc Details
- **Type**: Operator
- **Version**: v0.19.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS

## Intention
Verify that all session-related spans across all four pages carry `mtg-sparrow.session.id` for Honeycomb correlation. Confirm every question from the observability plan is answerable.

## Observable Outcome
A Honeycomb query filtering on `mtg-sparrow.session.id` returns spans from welcome, slides, assessment, and end pages for a single user session — all carrying `app.navigation = 'multi_page'`.

## Acceptance Criteria — All Met

- [x] `mtg-sparrow.session.id` generated on welcome page, stored in sessionStorage
- [x] All spans on all pages carry the attribute
- [x] `session.tier`, `session.subgroup` explicitly on card spans
- [x] Honeycomb query demonstrates cross-page session correlation
- [x] `app.navigation = 'multi_page'` structural marker on all spans
- [x] app.startup spans on welcome, slides, assessment, end — all with consistent session ID
- [x] session.summary span on end page carries full session context

## Test Results
- **Test script**: `tests/arc21-cross-page-telemetry.mjs`
- **Result**: 17/17 PASS

## Gaps Found and Fixed

### flushSpans() fire-and-forget (Fixed)
- **Problem**: `flushSpans()` returned `void` — callers in `slides.ts` and `assessment.ts` were not awaiting it before navigating. Spans sent to the OTel exporter but navigation could fire before network flush completed.
- **Fix**: `flushSpans()` changed to return `Promise<void>` and is now `await`-ed before `window.location.href` assignments in both `slides.ts` and `assessment.ts`.
- **Impact**: Improves span delivery reliability across all connection speeds.
- **Decision**: DEC-073

### Local serve URL param stripping (Known limitation — no fix needed)
- **Problem**: `serve` (npm package) redirects `/slides.html?subgroup=allied` to `/slides.html` in some contexts, stripping URL params. This caused test intermittency on the local server.
- **Root cause**: Local-only behavior of the `serve` static file server when handling `.html` extension URLs.
- **Production impact**: None — GitHub Pages preserves URL params correctly.
- **Resolution**: No fix needed. Known limitation, documented for future reference.
- **Decision**: DEC-074

## Honeycomb Verification
All four pages verified in Honeycomb with spans carrying:
- `mtg-sparrow.session.id` (consistent across pages within a session)
- `app.navigation = 'multi_page'` (all pages)
- `app.page = 'welcome'` / `'slides'` / `'assessment'` / `'end'` (per-page)
- Span types confirmed: `app.startup` (all pages), card spans (slides), `session.summary` (end)

---

## SOW Completion: Multi-Page Decomposition

Arc 21 is the FINAL arc of the Multi-Page Decomposition SOW (Arcs 14–21).

### SOW Success Criteria — All Met
- [x] Each page loads independently and behaves correctly
- [x] Browser back/forward/refresh work as expected on every page
- [x] All existing Honeycomb queries remain answerable via `mtg-sparrow.session.id`
- [x] Structural marker `app.navigation = 'multi_page'` visible on all spans
- [x] No visual or behavioral regressions

### Phase Summary
- **Phase 1** (Arcs 14–16): Foundations — `mtg-sparrow.session.id`, CSS split, module extraction — **COMPLETE**
- **Phase 2** (Arcs 17–20): Page creation — slides, assessment, end, welcome — **COMPLETE**
- **Phase 3** (Arc 21): Cross-page telemetry verification — **COMPLETE**

### Final Version: v0.19.0

The single-page application begun in the original engagement has been fully decomposed into four independent HTML pages, each with its own JS bundle, CSS, and telemetry. All sessions are correlated in Honeycomb by `mtg-sparrow.session.id`. The architecture is observable, maintainable, and structurally honest.

**SOW Status: CLOSED**
