# Arc 49 Verification: Clean Up End Page URL Parameters

**Date**: 2026-03-26
**Tester**: Quality Engineer (Playwright + Honeycomb MCP)
**Test script**: `tests/arc49-url-param-cleanup.mjs`
**Version**: 0.31.0

---

## Acceptance Criteria Status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | End page URL after assessment contains only `subgroup` param | PASS |
| 2 | End page renders correctly (reel, guild columns, guild list) | PASS |
| 3 | Assessment UI still shows and saves to localStorage | PASS |
| 4 | Skip case (cards < 3) navigates to end?subgroup=X only | PASS |
| 5 | session.summary span has no session.card_count / session.self_assessment from URL | PASS |
| 6 | service.version = 0.31.0 in Honeycomb | PASS |

---

## Test Run Results

**Script**: `tests/arc49-url-param-cleanup.mjs`
**Result**: 29/29 PASS

### Phase 1: Bundle version check
- assessment.js bundle contains version 0.31.0 — PASS
- assessment.js navigateToEnd does NOT include &cards=, &completed=, &assessment= params — PASS

### Phase 2: Assessment UI with cards >= minimum
- .self-assessment-prompt present — PASS
- Prompt text "How did that feel?" — PASS
- 3 .self-assessment-button elements — PASS

### Phase 3: Assessment button navigates to end?subgroup=X only
- Navigated to /end — PASS
- URL contains subgroup= — PASS
- URL does NOT contain &cards= — PASS
- URL does NOT contain &completed= — PASS
- URL does NOT contain &assessment= — PASS
- URL has exactly 1 param (subgroup only) — PASS
- **Actual URL**: `http://localhost:3847/end?subgroup=allied` ✓

### Phase 4: End page renders correctly with only subgroup param
- .level-sections-reel container present — PASS
- .level-section--allied present — PASS
- .level-section--enemy present — PASS
- Allied column unlocked (has progression) — PASS
- Guild list has ≥ 5 items (found 5) — PASS

### Phase 5: Assessment saved to localStorage
- Assessment stored in `sparrow-deck.self-assessment` key — PASS
- Assessment has `allied` subgroup key — PASS
- **Stored value**: `{"allied":"still_learning"}` ✓

### Phase 6: Skip case — cards < 3
- Navigated to end page — PASS
- Skip URL has no &cards= — PASS
- Skip URL has no &completed= — PASS
- Skip URL has no &assessment= — PASS
- **Actual URL**: `http://localhost:3847/end?subgroup=allied` ✓ (Playwright captured this directly via page.url())

### Phase 7: End bundle structural check
- end.js contains version 0.31.0 — PASS
- end.js contains session.summary span name — PASS
- end.js records session.subgroup — PASS
- end.js does NOT read cards/completed/assessment URL params — PASS

### Phase 8: Span flush
- Waited 35s for OTel batch timer — PASS

---

## Honeycomb Verification

**Environment**: sparrow-deck
**Dataset**: sparrow-deck
**Query**: name = "session.summary", service.version = "0.31.0", last 30 min
**Result**: 2 session.summary spans confirmed

### session.summary Span Attributes

| Attribute | Value | Notes |
|-----------|-------|-------|
| name | session.summary | ✓ |
| app.page | end | ✓ |
| app.navigation | multi_page | ✓ |
| service.version | 0.31.0 | ✓ version bumped |
| session.subgroup | allied | ✓ |
| page.search | ?subgroup=allied | ✓ ONLY subgroup param |
| session.card_count | (absent) | ✓ no longer recorded from URL |
| session.self_assessment | (absent) | ✓ no longer recorded from URL |
| mtg-sparrow.session.id | present | ✓ |
| trace.parent_id | present | ✓ child of end.page_view span |

### Key Observation

The `session.summary` span in v0.31.0 now only records `session.subgroup`. Previously it
also read `cards`, `completed`, and `assessment` from URL params and recorded them as
`session.card_count`, `session.completed`, `session.self_assessment`.

Those attributes are now absent from the span — intentional. The assessment value is saved
to localStorage (`sparrow-deck.self-assessment`) by the assessment page before navigating.
The end page reads localStorage for progression, not URL params, so the display is unaffected.

---

## Lessons Learned / Gotchas

1. **End page DOM uses reel layout (not guild-columns)**: The end page was redesigned in a
   previous arc. The correct container is `.level-sections-reel`. Guild sections are
   `.level-section--allied` and `.level-section--enemy`, items are `.level-section-item`.
   The old selectors (`.guild-columns`, `.guild-column--allied`) no longer exist. See arc22
   notes for reel layout details.

2. **page.route abort causes localStorage SecurityError**: When using `page.route('**/end*',
   route => route.abort())` to block navigation, Playwright ends up on an about:blank or
   chrome-error:// page, which denies localStorage access. Use `route.fulfill({...})` with
   a minimal HTML stub instead — this keeps the page at the same origin and localStorage
   remains accessible.

3. **Skip case URL capture**: For the skip case (cards < 2), the assessment page redirects
   immediately on DOMContentLoaded. `page.waitForNavigation()` is not needed — just
   `page.goto()` + `waitForTimeout(1000)` then read `page.url()`. Playwright navigated to
   the end page and `page.url()` returned the correct URL directly.

4. **session.summary span attributes simplified**: Post-cleanup, only `session.subgroup` is
   recorded in the span. Assessment data is now in localStorage (`sparrow-deck.self-assessment`)
   and is NOT in URL params at any point during navigation to end.

---

## Verdict

### COMPLETE

All acceptance criteria pass. The URL parameter cleanup arc:
- Removes `cards`, `completed`, `assessment` params from end page URL
- End page URL is now cleanly `end?subgroup=X` only
- Assessment UI still functional, saves to localStorage
- Skip case still works
- Honeycomb traces confirm correct behavior at service.version 0.31.0

**Arc 49 status: COMPLETE**
