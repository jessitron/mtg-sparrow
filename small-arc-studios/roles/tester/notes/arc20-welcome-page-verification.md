# Arc 20 — Welcome Page Verification

**Date:** 2026-03-02
**Arc:** Arc 20 — Slim index.html, create src/welcome.ts, delete main.ts
**Version:** v0.18.0
**Result:** PASS — 32/32 checks pass (after cleaning stale local artifact)

---

## Summary

The multi-page decomposition is complete. index.html now loads `dist/welcome.js` and only
`style.css` + `welcome.css`. `src/main.ts` is deleted. Build produces exactly four bundles.
Welcome screen renders correctly, button navigates to slides.html with dwell time param.
Settings gear works at v0.18.0. Honeycomb confirmed `app.startup` spans with `app.navigation=
'multi_page'` — the structural change from single-page to multi-page is fully observable.

---

## Stale Artifact Finding

**First run: 1 failure — `dist/bundle.js` still existed.**

`dist/bundle.js` was a stale file from earlier builds, left over from before Arc 20. Since
`dist/` is in `.gitignore`, it's never tracked by git — on a fresh clone + build it would
not exist. The build script no longer produces it (confirmed: build output shows only 4 bundles).

**Resolution:** Deleted the stale `dist/bundle.js` and `dist/bundle.js.map` locally, then re-ran
the test. 32/32 PASS on second run.

**Implication:** No code change needed. Any developer who built this project before Arc 20 would
have a stale `bundle.js` in their local `dist/`. It won't be served (index.html doesn't reference
it) but it could cause confusion. Cleaned up locally.

---

## Test Results by Phase

### Phase 1: Build artifacts (Tests 1–6)
- PASS: dist/welcome.js exists
- PASS: dist/slides.js exists
- PASS: dist/assessment.js exists
- PASS: dist/end.js exists
- PASS: dist/bundle.js does NOT exist (after cleaning stale local file)
- PASS: src/main.ts does NOT exist

### Phase 2: index.html structure (Tests 7–13)
- PASS: Links style.css
- PASS: Links welcome.css
- PASS: Does NOT link slides.css
- PASS: Does NOT link assessment.css
- PASS: Does NOT link end.css
- PASS: Loads dist/welcome.js
- PASS: Does NOT reference dist/bundle.js

### Phase 3: Bundle telemetry markers (Tests 14–20)
- PASS: dist/welcome.js serves HTTP 200
- PASS: version "0.18.0"
- PASS: `app.page` key
- PASS: `'welcome'` page value
- PASS: `app.navigation` key
- PASS: `multi_page` navigation value
- PASS: `app.startup` span name

### Phase 4: Welcome screen UI (Tests 21–24)
- PASS: h1.welcome-heading present
- PASS: Heading says "Learn MTG Color Combinations"
- PASS: #start-button present
- PASS: Button says "Learn guild names"

### Phase 5: Button navigates to slides.html (Tests 25–28)
- PASS: Navigates to /slides
- PASS: URL includes `subgroup=allied`
- PASS: URL includes `from=welcome`
- PASS: URL includes `welcome_dwell_ms=` param (e.g. 329ms)

### Phase 6: Settings gear (Tests 29–32)
- PASS: Gear button visible
- PASS: Settings panel opens
- PASS: Version shows "v0.18.0"
- PASS: Panel closes on close button

### Phase 7: Span flush
- Welcome page kept alive 35s; OTel batch timer fired; spans exported to Honeycomb.

---

## Honeycomb Telemetry

Queried `sparrow-deck` dataset for spans with `app.page = 'welcome'` in last 30 minutes.

**Result: 6 spans confirmed (2 test runs × 3 span types)**

`app.startup` span attributes confirmed:
- `name = 'app.startup'` ✓
- `app.page = 'welcome'` ✓
- `app.navigation = 'multi_page'` ✓ **(was 'single_page' in all previous arcs)**
- `app.version = '0.18.0'` ✓
- `service.version = '0.18.0'` ✓
- `app.module_structure = 'extracted'` ✓
- `css.split = true` ✓
- `mtg-sparrow.session.id` present ✓

The structural change from single-page to multi-page architecture is now fully observable
in Honeycomb. Every page (welcome/slides/assessment/end) emits `app.navigation='multi_page'`.

---

## Acceptance Criteria Coverage

| Criterion | Result | How |
|-----------|--------|-----|
| index.html loads style.css + welcome.css only | ✅ | Phase 2 |
| Script is dist/welcome.js (not bundle.js) | ✅ | Phase 2 |
| src/main.ts deleted | ✅ | Phase 1 |
| dist/bundle.js not produced by build | ✅ | Phase 1 |
| Four bundles: welcome/slides/assessment/end | ✅ | Phase 1 |
| Welcome screen heading + button | ✅ | Phase 4 |
| Button navigates to slides with params | ✅ | Phase 5 |
| Settings gear works, version v0.18.0 | ✅ | Phase 6 |
| app.page='welcome' in Honeycomb | ✅ | Honeycomb |
| app.navigation='multi_page' in Honeycomb | ✅ | Honeycomb (was single_page!) |
| mtg-sparrow.session.id present | ✅ | Honeycomb |

---

## Test Script

`tests/arc20-welcome-page.mjs` — 32 assertions across 6 phases + span flush

---

## Lessons Learned

- **Stale build artifacts in gitignored `dist/`**: When a build entry point is removed,
  the old output file stays in `dist/` until manually deleted or the directory is cleaned.
  A test checking for the absence of `bundle.js` will fail on a developer machine that
  had previously built the old version. This is a local hygiene issue, not a code bug.
  Consider adding a `clean` npm script (`rm -rf dist/`) as a pre-build step for major
  structural changes like this one.

- **`app.navigation='multi_page'` now on ALL pages**: The multi-page decomposition arcs
  (17-20) unified all four pages under `multi_page` navigation. Pre-Arc 17 spans show
  `single_page`; post-Arc 17 spans show `multi_page`. This is the key structural marker
  that proves the decomposition is complete and observable.
