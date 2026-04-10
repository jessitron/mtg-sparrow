# Plan: Contrast Verification

## Section 1: Discovery

### Problem Statement

We have no automated way to detect text contrast failures across the site. With multiple pages, dark/gradient backgrounds, semi-transparent overlays, and dynamic states, contrast problems can creep in unnoticed. We want to catch them.

### Goals

- Detect WCAG AA contrast violations across all pages and meaningful visual states
- Make hard-to-reach visual states easy to reach (for this and future visual testing)
- Establish a reusable contrast check that can be run on demand

### Non-Goals

- CI integration (all development happens locally)
- Fixing every contrast issue found (that's a follow-up)
- Visual-fit testing (text overflowing curved containers — separate concern, separate arc)
- Screenshot-diff pixel comparison (only if axe-core's "incomplete" results prove insufficient)

### Constraints & Technical Readiness

- Playwright already installed (`^1.58.2`)
- No test runner framework — tests are standalone scripts, which is fine
- axe-core has a first-party Playwright integration (`@axe-core/playwright`)
- The site has ~8 distinct page templates, but slides page has multiple important states

### Risks

- **axe-core may punt on complex backgrounds** — the mana gas canvas, semi-transparent overlays, gradient backgrounds could all land in "incomplete" (needs-manual-review). We'll triage those results and decide if the screenshot-diff technique is worth building.
- **Dynamic states are timing-sensitive** — pausing via URL param mitigates this.

### Architectural Approach

**Test affordances first, then contrast check.**

Add URL parameters that make visual states stable and addressable:
- `?no-gas=true` on welcome page — disables mana gas canvas animation
- `?paused=true` on slides page — starts in paused state so timer doesn't advance

Then write a single Playwright script that loads each page+state combination, runs axe-core's color-contrast rule, and reports violations vs incompletes.

**Alternative considered:** Jump straight to the screenshot-diff technique from the notes. Rejected because axe-core handles the common case with zero pixel math, and we don't know yet whether the complex cases exist on this site.

**Alternative considered:** Make slides states URL-addressable (`?state=intro|card|revealed`). Deferred — Playwright can likely step through states while paused via `page.evaluate()`. If that proves flaky, we add URL params in a follow-up.

### Observability Strategy

- `APP_VERSION` bump to 0.45.0
- The contrast check itself is a dev-time tool, not runtime — no Honeycomb telemetry needed for the check script
- If we fix contrast issues, those CSS changes will be visible in the version bump

### Testing Strategy

The arc *is* a test. Success = the script runs, reports results, and we know the contrast status of every page.

---

## Section 2: Arcs

### Phase 1: Foundation

#### Arc 74: Test Affordances

**Type:** Structural

**Intention:** Make hard-to-reach visual states easy to reach via URL parameters, for this and future visual testing.

**Observable Outcome:** Loading `/slides?paused=true` starts the session paused. Loading `/?no-gas=true` renders the welcome page without canvas animation.

**Acceptance Criteria:**
- `?paused=true` on slides page: session starts paused, no timer running, stable visual state
- `?no-gas=true` on welcome page: mana gas canvas does not animate, text is on a stable background
- No behavior change without the params — zero impact on normal usage
- Version bump to 0.45.0

**Tests:** Playwright script verifying each param works as described.

**Observability:** Version attribute 0.45.0 distinguishes this structural change in traces.

**Risk Reduced:** Visual testing is no longer a race against timers and animations.

---

#### Arc 75: Contrast Check

**Type:** Operator

**Intention:** Detect WCAG AA color contrast violations across all pages and visual states.

**Observable Outcome:** A runnable script that reports contrast violations and incompletes for every page+state.

**Acceptance Criteria:**
- `@axe-core/playwright` added as dev dependency
- Script checks all page+state combinations:
  - Welcome (desktop, with `?no-gas=true`)
  - Welcome (mobile viewport)
  - Slides — level intro (paused)
  - Slides — card visible, name hidden (paused)
  - Slides — card visible, name revealed (paused)
  - Assessment
  - End page (with a completed session in localStorage)
  - About
  - Combo index
  - Combo detail (one representative, e.g. azorius)
  - 404
  - Menu dropdown (on at least one page)
- Output: clear report of violations (fail) vs incompletes (needs review) per page+state
- Script is runnable via `npm run test:contrast` or equivalent

**Tests:** The script is the test.

**Observability:** Version attribute. If contrast fixes are needed, they become a follow-up arc with their own observability.

**Risk Reduced:** We know the contrast status of the entire site. No more guessing.

---

### Communication Cadence

Pause for client review after Arc 74 (test affordances), since that changes production code. Arc 75 is additive tooling — can proceed immediately if Arc 74 is approved.

### Change Management

Decisions tracked in Librarian's decision log as usual.
