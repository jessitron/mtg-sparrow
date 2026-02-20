# Arc 6: Static Welcome Screen

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 6 |
| **Name** | Static Welcome Screen |
| **Type** | Structural |
| **Target Version** | 0.6.0 |
| **Start Date** | 2026-02-20 |
| **Completion Date** | 2026-02-20 |
| **Status** | COMPLETE |

## Intention

Move the welcome screen content from JavaScript DOM construction to static HTML. Arc 5 introduced the welcome screen but implemented it by building DOM elements dynamically in `showWelcomeScreen()` — a pattern the client identified as architecturally wrong. Static content belongs in the HTML source, not in JavaScript that recreates it at runtime.

## Observable Outcome

On page load, the browser renders the welcome screen directly from the HTML source — no JS required to show it. After JS loads, it wires the button's click handler and populates the card count. The welcome screen experience is identical to Arc 5 for the user, but the rendering path is fundamentally different. Session telemetry includes a new structural marker: `welcome.render_mode = 'static_html'`.

## Acceptance Criteria

- [x] Welcome screen appears on load — **PASS**
- [x] Version footer shows v0.6.0 — **PASS**
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
- [x] Telemetry: `welcome.render_mode = 'static_html'` attribute set — **PASS** (code verified)
- [x] `showWelcomeScreen()` function deleted from JS — **PASS**
- [x] No DOM construction calls (`createElement`, `appendChild`, `textContent`) for welcome content in JS — **PASS**
- [x] Welcome HTML present in `index.html` before any JS runs — **PASS** (static `<section class="welcome">` confirmed)
- [x] JS wires button click handler (does not create button) — **PASS**

## Structural Version Marker

- **Attribute**: `welcome.render_mode`
- **Value**: `'static_html'`
- **Set on**: session root span, in `startSession()` before span creation
- **Purpose**: Distinguishes sessions from this arc forward from any future arc that might change the rendering approach. Also provides baseline for confirming the static migration delivered the right behavior.

## Key Decisions Made During Arc 6

- **DEC-033**: Welcome screen rendered as static HTML instead of JS DOM construction (see decision-log.md)

## Implementation Notes

- `showWelcomeScreen()` function deleted from `src/main.ts`
- Welcome HTML moved into `index.html` as a static `<section class="welcome">` block
- JS now wires only the button click handler — no element creation
- Card count `<span>` in the welcome HTML is populated by JS on `DOMContentLoaded` (this is appropriate dynamic behavior)
- `welcome.render_mode = 'static_html'` added to `startSession()` span attributes
- Eliminated ~30 lines of DOM manipulation code
- `service.version` updated to `'0.6.0'` in `src/telemetry/init.ts`

## Verification

- **Code/behavior verification by**: Tester (2026-02-20)
- **Honeycomb verification by**: Code inspection + structural marker confirmed in source
- **Result**: 35/35 browser checks PASS
- **Full report**: `small-arc-studios/roles/tester/notes/v0.6.0-verification.md`
- **Test script**: `scripts/test-v0.6.0.mjs` (Playwright)

## Honeycomb Data

- **`welcome.render_mode`**: `'static_html'` — set in `startSession()` before span creation
- **`service.version`**: `'0.6.0'` — confirmed in build output and footer
- **MCP limitation**: The Honeycomb MCP tools available connect to `team: demo`, not `team: modernity` where sparrow-deck data lives. Attribute presence verified by code inspection. Trace delivery confirmed via footer trace link.

## Known Constraints

- **Honeycomb MCP inaccessible**: Local MCP connects to Honeycomb demo team. Cannot query sparrow-deck traces via MCP. This is an environment constraint, not a product defect.

## Learning Captured

- **Static content belongs in HTML**: JS should enhance existing content, not create it from scratch. DOM construction for static content delays first paint and creates a brittle dependency on JS execution.
- **JS should wire, not build**: The correct pattern is `document.querySelector()` + event listeners on pre-existing HTML elements. `document.createElement()` is for truly dynamic content.
- **Graceful degradation**: When static content lives in HTML, the page has meaningful content even before JS loads. This is a progressive enhancement pattern worth applying broadly.
- **Structural arcs can be zero-UX-change**: Arc 6 changed nothing visible to users — the value is in correctness of architecture, future maintainability, and load performance.

## Outcome

Arc 6 delivered successfully. All 35 acceptance criteria satisfied.

**What was established:**
- Welcome screen rendered from static HTML, not JS DOM construction
- `showWelcomeScreen()` function deleted — no longer exists
- `welcome.render_mode = 'static_html'` telemetry marker on all sessions going forward
- Version bumped to 0.6.0
- ~30 lines of unnecessary DOM manipulation removed

**Architecture boundary confirmed:**
- Static content lives in `index.html`
- JS is responsible for behavior, not content reconstruction

**Next arc candidates:**
- GitHub Pages deployment (DEC-007)
- Tier progression: Shards & Wedges (DEC-005, DEC-023)
- Settings page with localStorage reset (DEC-025)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
