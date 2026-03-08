# Arc 38: Mobile Welcome & Responsiveness

## Arc Details
- **Type**: Feature Arc (Responsive Design)
- **Date**: 2026-03-08
- **Status**: COMPLETE — 20/20 PASS

## Intention
Make the welcome page usable on mobile devices. The existing welcome content was designed for desktop and did not work well on small screens. Provide a condensed mobile version that preserves the core experience.

## Observable Outcome
On screens narrower than 600px, visitors see a condensed welcome page with "MTG Colors" heading, three short list items, and a "Start" button. On wider screens, the original desktop content displays unchanged. The mana gas particle canvas does not block interaction. The start button exceeds the 44px minimum tap target at ~61px height.

## What Was Built

### Two-Version HTML Structure
- `.welcome-desktop` block contains the original desktop content
- `.welcome-mobile` block contains condensed mobile content: heading, 3 list items ("See a combo", "Guess a name out loud", "See the name. Say the name."), and Start button
- CSS media query at 600px breakpoint toggles `display` between the two blocks

### Shared Button Wiring
- Both desktop and mobile Start buttons share the `.welcome-start-btn` class
- `welcome.ts` uses `querySelectorAll('.welcome-start-btn')` to wire both buttons

### Z-Index Layering
- Content layer at z-index 1, mana gas canvas at z-index 0
- Ensures interactive elements are not blocked by the canvas overlay

## Team
- **Developer**: Implemented dual-content HTML structure, CSS media query, and shared button wiring.
- **Tester**: 20/20 tests passed covering mobile viewport rendering, tap target size, no horizontal scroll, desktop preservation, and button functionality.

## Acceptance Criteria — All Met

- [x] Mobile welcome content displays on screens < 600px
- [x] Desktop welcome content displays on screens >= 600px
- [x] Start button tap target >= 44px height (~61px measured)
- [x] No horizontal scrolling at 375px viewport width
- [x] Mana gas canvas does not block interaction (z-index layering)
- [x] Both Start buttons navigate to slides page
- [x] 20/20 tests pass

## Key Files
- `index.html` — dual `.welcome-desktop` / `.welcome-mobile` content blocks
- `welcome.css` — media query at 600px breakpoint
- `src/welcome.ts` — `querySelectorAll` wiring for both buttons
- `tests/arc38-mobile-welcome.mjs` — test script

## Observability
- Welcome page telemetry (`welcome.page_view` span) fires regardless of which content version is shown
- Existing mana gas drag telemetry continues to work on both layouts

## Decisions
- DEC-129: CSS media query approach for mobile welcome — two HTML blocks with display toggle
- DEC-130: 600px breakpoint chosen for mobile/desktop split
