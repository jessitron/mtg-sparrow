# Arc 36 Verification: License, About Page, Site Identity, and Share

## Date: 2026-03-08

## Results: 71/71 PASS + Honeycomb telemetry confirmed

### Criterion Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | CC0 LICENSE file at repo root | PASS | Contains "CC0 1.0 Universal" |
| 2 | Page titles say "MTG Colors" | PASS | All 5 pages (welcome, slides, assessment, end, about) |
| 3 | Open Graph meta tags on all pages | PASS | og:title, og:description, og:type, meta description on all 5 |
| 4 | Favicon link on all pages | PASS | `images/favicon.svg` exists and linked from all pages |
| 5 | About page content | PASS | Scryfall, MTG Wiki, Wizards of the Coast acknowledged; CC0 license mentioned; home link (./) present; settings gear present |
| 6 | About link in settings | PASS | All 5 pages have `a.settings-about-link` with href="about" |
| 7 | Copy link button in settings | PASS | All 5 pages have `#settings-share-btn`; clicking changes text to "Copied!" |
| 8 | UTM parameters | PASS | telemetry.ts captures utm_source → utm.source and utm_id → utm.referral_session_id as resource attributes |
| 9 | End screen share section | PASS | `.level-section--share` with `.share-copy-btn` button |
| 10 | Telemetry spans | PASS | Both `about.page_view` and `share.copy_link` confirmed in Honeycomb |

### Honeycomb Verification

Queried `sparrow-deck` dataset in `sparrow-deck` environment:
- `about.page_view`: app.page=about, app.version=0.20.0, duration_ms=2133
- `share.copy_link`: share.session_id present, share.url includes utm_source=share&utm_id params

### Test Script

`tests/arc36-identity-share.mjs` — 71 assertions covering all 10 criteria.

### Observations

- The assessment page title says "MTG Colors — Session End" which is the same as the end page. Minor UX note but not a failure — both are valid "MTG Colors" titles.
- Copy link in settings builds URL with utm_source=share and utm_id=sessionId. End screen share button builds a clean URL pointing to home page (strips /end path).
- About page is a proper standalone page at /about with its own CSS and JS bundle (dist/about.js).
- Settings panel HTML is duplicated across all page HTML files (not injected by JS). This is consistent with the project's "static content in HTML" convention.
