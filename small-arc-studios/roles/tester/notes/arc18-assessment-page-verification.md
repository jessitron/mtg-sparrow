# Arc 18 — Assessment Page Verification

**Date:** 2026-03-02
**Arc:** Arc 18 — Create assessment.html + src/assessment.ts
**Version:** v0.16.0
**Result:** PASS — 20/20 checks pass

---

## Summary

assessment.html is a fully functional standalone page. URL params with `cards >= 3` render the
self-assessment UI ("How did that feel?" prompt + 3 buttons). Button clicks navigate to end.html.
The skip path (cards < 3) fires immediately on DOMContentLoaded, redirecting to end.html with no UI shown.
Settings gear works. Honeycomb confirmed spans with `app.page='assessment'`.

---

## Key Finding: Serve Does NOT Strip Params from Clean URLs

Unlike `.html?params` requests (which get redirected and stripped), navigating to
`/assessment?params` (clean URL format) **preserves query params**. The serve package only
strips params when redirecting from `filename.html?params` → `/filename`.

So the test uses `http://localhost:3847/assessment?subgroup=allied&cards=10&completed=true`
and params are correctly available in `window.location.search`.

This differs from Arc 17 slides tests which used `slides.html?...` (triggering the redirect).
Future arc tests should use clean URL format (`/pagename?params`) to avoid param-stripping.

---

## Span Export Strategy

The assessment page navigates to end.html quickly (on button click or skip). The OTel batch
timer (30s) wouldn't fire before navigation in normal test flow.

**Solution:** Added Phase 6 "span flush" — load assessment.html with cards=10, wait 35s before
closing browser. This ensures the batch timer fires and spans reach Honeycomb.

Spans confirmed in Honeycomb from test session.

---

## Test Results by Phase

### Phase 1: Bundle telemetry markers (Tests 1–7)
- PASS: version `0.16.0` in bundle
- PASS: `app.page` attribute key
- PASS: `'assessment'` page value
- PASS: `app.navigation` attribute key
- PASS: `multi_page` navigation value
- PASS: `app.version` attribute key
- PASS: self-assessment content in bundle

### Phase 2: Assessment UI renders (Tests 8–13)
- PASS: `.self-assessment-prompt` element appears
- PASS: Prompt text is "How did that feel?"
- PASS: Three `.self-assessment-button` elements present
- PASS: "Still learning" button present
- PASS: "Getting there" button present
- PASS: "Nailing it" button present

### Phase 3: Button click navigates to end.html (Test 14)
- PASS: Clicking "Getting there" navigates to `/end` (end.html — 404 expected, Arc 19 not yet done)
- NOTE: Serve strips params from `end.html?...` redirect, so assessment= param not verifiable via URL
  (The navigation did happen correctly; params confirmed via bundle code inspection)

### Phase 4: Skip case — cards < 3 (Tests 15–16)
- PASS: Navigate to `/assessment?subgroup=allied&cards=2&completed=false` → redirects to end
- PASS: No self-assessment prompt rendered (page navigated away immediately)

### Phase 5: Settings gear (Tests 17–20)
- PASS: Gear button visible on assessment page
- PASS: Settings panel opens on click
- PASS: Version shows "v0.16.0"
- PASS: Panel closes on close button

### Phase 6: Span flush
- Assessment page kept alive 35s; OTel batch timer fired; spans exported to Honeycomb.

---

## Honeycomb Telemetry

Queried `sparrow-deck` dataset for spans with `app.page = 'assessment'` in last 30 minutes.

**Result: 2 spans confirmed (TTFB + FCP web vitals from headless Chrome test run)**

Sample span attributes confirmed:
- `app.page = 'assessment'` ✓
- `app.navigation = 'multi_page'` ✓
- `service.version = '0.16.0'` ✓
- `mtg-sparrow.session.id` present ✓
- `page.search = '?subgroup=allied&cards=10&completed=true'` ✓ (params preserved!)
- URL: `http://localhost:3847/assessment?subgroup=allied&cards=10&completed=true` ✓

---

## Acceptance Criteria Coverage

| Criterion | Result | How |
|-----------|--------|-----|
| assessment.html loads independently with params | ✅ | Phase 2 |
| "How did that feel?" prompt renders | ✅ | Phase 2 |
| Three self-assessment buttons render | ✅ | Phase 2 |
| Button click navigates to end.html | ✅ | Phase 3 |
| Skip case (cards < 3) navigates without UI | ✅ | Phase 4 |
| Settings gear works | ✅ | Phase 5 |
| Version v0.16.0 | ✅ | Phase 1 + Phase 5 |
| app.page='assessment' in spans | ✅ | Phase 1 + Honeycomb |
| app.navigation='multi_page' in spans | ✅ | Phase 1 + Honeycomb |
| mtg-sparrow.session.id on spans | ✅ | Honeycomb samples |

---

## Test Script

`tests/arc18-assessment-page.mjs` — 20 assertions across 5 phases + span flush

---

## Lessons Learned

- **Clean URL format preserves params in local serve**: `serve` only strips query params when
  redirecting from `filename.html?params` → `/filename`. Navigating directly to `/filename?params`
  (clean URL) serves the file with params intact. Use clean URL format in tests to avoid param issues.

- **Assessment span export requires stay-alive wait**: If assessment page navigates away (skip or
  button click) before the 30s batch timer fires, spans are lost. Add a dedicated span-flush phase
  that loads the page and waits 35s before closing.

- **end.html 404 is expected**: Arc 19 not yet done. Navigation toward end is confirmed by URL
  containing 'end' (`/end` clean URL after serve redirect).
