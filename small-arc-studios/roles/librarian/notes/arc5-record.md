# Arc 5: Welcome Screen

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 5 |
| **Name** | Welcome Screen |
| **Type** | User |
| **Target Version** | 0.5.0 |
| **Start Date** | 2026-02-19 |
| **Completion Date** | 2026-02-19 |
| **Status** | COMPLETE |

## Intention

Add a welcome/instructions screen that appears before the session starts, replacing the auto-start behavior. New users need orientation: what the app does, a concrete fallback combo name to try, and the "say it out loud" ritual. The session begins only when the user clicks the button.

## Observable Outcome

On page load, the app shows a centered welcome screen with heading "Sparrow Deck", instruction text mentioning "Boros", muted "say it out loud" subtext, and a "Learn guild names" button. Clicking the button starts the card session. Spacebar and clicking the background do nothing while on the welcome screen. Session telemetry includes two new attributes: `session.started_from` and `session.welcome_dwell_ms`.

## Acceptance Criteria

- [x] Welcome screen appears on load instead of card session — **PASS**
- [x] Version footer shows v0.5.0 — **PASS**
- [x] Title "Sparrow Deck" visible — **PASS**
- [x] Instructions mention "Boros" and guessing a name — **PASS**
- [x] "Say it out loud" subtext present — **PASS**
- [x] "Learn guild names" button visible — **PASS**
- [x] Spacebar does NOT advance cards on welcome screen — **PASS**
- [x] Clicking app background does NOT start session — **PASS**
- [x] Clicking "Learn guild names" starts card session — **PASS**
- [x] Pause and Stop buttons visible after session starts — **PASS**
- [x] Cards cycle normally (auto-reveal and auto-advance) — **PASS**
- [x] Trace link in footer after session starts — **PASS**
- [x] Session end screen and self-assessment work — **PASS**
- [x] Welcome screen reappears after page reload — **PASS**
- [x] Telemetry: `session.started_from` and `session.welcome_dwell_ms` attributes set — **PASS** (code verified; trace URL delivery confirmed)

## Risks Reduced

- New user disorientation — eliminated (welcome screen provides clear entry point)
- Accidental session start on background click — guarded
- Click/spacebar firing prematurely — guarded by `session` null check

## Key Decisions Made During Arc 5

- **DEC-030**: Welcome screen replaces auto-start (see decision-log.md)
- **DEC-031**: Button styled like self-assessment buttons, not control buttons (see decision-log.md)
- **DEC-032**: `session.started_from` telemetry attribute added to support future entry points (see decision-log.md)

## Implementation Notes

- `showWelcomeScreen()` function added to `src/main.ts` — called at end of `DOMContentLoaded` instead of `startSession()`
- `welcomeScreenLoadTime` captured in `showWelcomeScreen()` for dwell measurement
- Click and spacebar handlers already guarded by `if (session)` check — no extra state required
- Two-tier text: instruction paragraph (body weight) + muted subtext for "say it out loud" ritual
- `cardEnter` animation reused for the `.welcome` container entrance (CSS `animation: cardEnter 250ms ease-out`)
- `.welcome-button` styled to match `.self-assessment-button` — prominent, not muted like `.control-button`

## Verification

- **Code/behavior verification by**: Tester (2026-02-19)
- **Honeycomb verification by**: Code inspection + trace URL delivery confirmation
- **Result**: 27/27 browser checks PASS
- **Full report**: `small-arc-studios/roles/tester/notes/v0.5.0-verification.md`
- **Test script**: `scripts/test-v0.5.0.mjs` (Playwright)

## Honeycomb Data

- **`session.started_from`**: `'welcome_screen'` — set in `startSession()` before span creation
- **`session.welcome_dwell_ms`**: milliseconds from welcome screen render to button click
- **`service.version`**: `'0.5.0'` — confirmed in build output and footer
- **MCP limitation**: The Honeycomb MCP tools available connect to `team: demo`, not `team: modernity` where sparrow-deck data lives. Attribute presence verified by code inspection. Trace delivery confirmed via footer trace link.

## Known Constraints

- **Honeycomb MCP inaccessible**: Local MCP connects to Honeycomb demo team. Cannot query sparrow-deck traces via MCP. This is an environment constraint, not a product defect. Trace links in the footer confirm data is reaching the correct Honeycomb environment (`modernity/sparrow-deck`).

## Learning Captured

- **`waitForFunction` over `waitForTimeout`** in Playwright is more robust for DOM state checks. Used for auto-reveal detection. Recommend for all future test scripts.
- **Null-guard pattern for session state**: `if (session)` in event handlers is clean and requires no extra flags — effective guard for welcome screen phase.
- **Two-tier text layout**: main instruction paragraph + muted subtext is a reusable pattern for screens that have a primary message and a secondary behavioral ritual.

## Outcome

Arc 5 delivered successfully. All 27 acceptance criteria satisfied.

**What was established:**
- Welcome screen as the default entry point for the app
- Clear new-user orientation: what the app is, the Boros fallback, the "say it out loud" ritual
- Button-triggered session start (no accidental auto-start)
- `session.started_from` and `session.welcome_dwell_ms` telemetry attributes
- Consistent visual style: welcome screen uses same card entrance animation and self-assessment button style

**Risks reduced:**
- New user confusion — eliminated by welcome screen
- Premature session start — guarded by null check pattern

**Next arc**: TBD — app is now ready for a first public deployment. Candidates include GitHub Pages deployment, tier progression (Shards & Wedges), or settings page with localStorage reset.

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
