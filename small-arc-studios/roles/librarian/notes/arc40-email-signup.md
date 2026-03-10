# Arc 40: Email Signup Section

## Arc Details
- **Type**: Enhancement Arc (Engagement / Growth)
- **Date**: 2026-03-09
- **Status**: COMPLETE — 17/17 PASS — Shipped to production

## Intention
Add an email signup section to the About page so engaged readers can follow future updates to MTG Colors.

## Observable Outcome
The About page now includes a "Pause on my Upkeep" section with a ConvertKit inline form. Telemetry records whether the form was present at page load and whether the user clicked inside the form container.

## What Was Built

### About Page — New Section
- "Pause on my Upkeep" section added to `about.html`, positioned after the intro paragraph and before Acknowledgments
- ConvertKit inline embed (data-uid="df1fad2ec7") provides the actual form (email input + subscribe button)
- ConvertKit handles email infrastructure, GDPR, and deliverability

### Styling
- `about.css` updated with signup section styles: subtle dark border, border-radius, background tint
- Visually distinct from surrounding content without being jarring

### Telemetry
- `about.has_signup_form` boolean resource attribute added to `about.page_view` span — confirms form was present at page load
- `about.signup_interact` child span fires on click anywhere inside the form container — tracks engagement intent
- Submission not tracked (no accessible hook into ConvertKit's internal submit handler)

## Test Results
17/17 PASS. Test script: `tests/test-arc40-signup.mjs`

## Team
- **Developer**: Implemented section HTML, CSS styles, ConvertKit embed, telemetry.
- **Tester**: 17/17 PASS across all acceptance criteria.

## Acceptance Criteria — All Met

- [x] "Pause on my Upkeep" section appears on About page
- [x] Section positioned above Acknowledgments
- [x] ConvertKit embed renders correctly
- [x] `about.has_signup_form` attribute present on page_view span
- [x] `about.signup_interact` span fires on form container click
- [x] Styled with subtle border and background tint
- [x] 17/17 tests pass

## Key Files
- `about.html` — new signup section with ConvertKit embed
- `about.css` — signup section styles
- `src/about.ts` — telemetry additions (has_signup_form, signup_interact)
- `tests/test-arc40-signup.mjs` — test script

## Observability
- `about.has_signup_form` confirms form presence at runtime (structural marker)
- `about.signup_interact` tracks click engagement in Honeycomb trace waterfall

## Decisions
- DEC-139: Email signup uses ConvertKit inline embed — ConvertKit handles email infrastructure
- DEC-140: Signup section placed above Acknowledgments for maximum visibility with engaged readers
- DEC-141: Section heading "Pause on my Upkeep" — MTG-themed, client's choice
- DEC-142: Telemetry tracks form presence and click engagement, not submission
