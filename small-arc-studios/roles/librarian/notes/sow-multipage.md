# SOW: Multi-Page Decomposition

## Date: 2026-03-01

## Engagement Scope

Transform the MTG Sparrow single-page application into a multi-page architecture with separate HTML pages for welcome, slides, assessment, and end screens. Browser navigation (back, forward, refresh) works naturally. Per-page CSS and JS bundles ensure clean separation of concerns.

## Objectives

1. Four independent HTML pages with their own JS and CSS (welcome, slides, assessment, end)
2. Natural browser navigation between pages
3. Per-page telemetry correlated by `mtg-sparrow.session.id`
4. Dead CSS removed, live CSS organized by page ownership
5. `main.ts` decomposed from 950+ lines into focused per-page entry points

## Success Criteria

- Each page loads independently and behaves correctly
- Browser back/forward/refresh work as expected on every page
- All existing Honeycomb queries remain answerable via `mtg-sparrow.session.id`
- Structural marker `app.navigation = 'multi_page'` visible on all spans
- No visual or behavioral regressions

## Assumptions & Exclusions

- No visual redesign — pages look identical to current screens
- No new features — pure structural decomposition
- No server-side anything — static files on GitHub Pages
- Settings panel HTML duplicated across pages (not templated)
- Build stays esbuild (DEC-046)

## Roles

- **Project Lead**: Coordination, arc sequencing, client communication
- **Architect**: Module extraction strategy, build configuration, page contracts
- **Developer**: Implementation
- **Designer**: Consulted only if visual questions arise (not expected)
- **Observability Engineer**: `mtg-sparrow.session.id` design, per-page span strategy
- **Tester**: Browser-based verification of each arc
- **Librarian**: Decision recording, arc history

## Communication Cadence

Client pause after Arc 14 (telemetry foundation) to confirm direction and verify `mtg-sparrow.session.id` in Honeycomb. Then continuous delivery with client choosing when to pause next.

---

## Planned Arcs

### Phase 1: Foundations

#### Arc 14: Add mtg-sparrow.session.id Telemetry
- **Type**: Operator
- **Intention**: Introduce `mtg-sparrow.session.id` as a session correlation field on all spans, while the app is still a single page. This gives us observability tooling from the start — every subsequent arc can be verified in Honeycomb by filtering on this field.
- **Observable Outcome**: Every span emitted by the app carries `mtg-sparrow.session.id`. A new session ID is generated each time the user starts a session. Honeycomb queries can filter and group by this field.
- **Acceptance Criteria**:
  - `mtg-sparrow.session.id` generated (random hex string) when a session starts
  - Set as an attribute on the session span and all card spans
  - Stored in `sessionStorage` (preparing for cross-page use in later arcs)
  - Startup span carries `app.navigation = 'single_page'` (will change to `'multi_page'` later)
  - Visible in Honeycomb — verified by query
  - `app.version` bump
- **Observability**: This arc IS the observability foundation. Verified by Honeycomb query filtering on `mtg-sparrow.session.id`.
- **Risks Reduced**: Establishes the correlation key before any structural changes. Every subsequent arc is observable from day one.

#### Arc 15: Split CSS into Per-Page Stylesheets
- **Type**: Structural
- **Intention**: Decompose the monolithic `style.css` into `style.css` (shared) + `welcome.css` + `slides.css` + `assessment.css` + `end.css`. Audit every rule against actual usage and remove dead CSS.
- **Observable Outcome**: Five CSS files, each linked only from the pages that need them. Current single-page app still works (all five files linked from `index.html` during transition). Dead CSS identified and removed.
- **Acceptance Criteria**:
  - `style.css` contains only shared rules (variables, reset, fonts, body, #app, #gas, footer, settings, gas buttons)
  - `welcome.css` contains welcome-screen-only rules
  - `slides.css` contains card/quiz/done-zone rules
  - `assessment.css` contains self-assessment prompt and button rules
  - `end.css` contains guild-column/color-wheel rules
  - All five linked from `index.html` — app looks and behaves identically
  - Any dead CSS rules documented and removed
- **Observability**: Structural marker `css.split = true` on startup span. `app.version` bump.
- **Risks Reduced**: Establishes CSS ownership boundaries before page split. Dead CSS cleaned up.

#### Arc 16: Extract Shared Modules from main.ts
- **Type**: Structural
- **Intention**: Pull logically distinct sections out of `main.ts` into proper modules: guild columns/color wheels → `src/ui/guild-columns.ts`, self-assessment → `src/ui/self-assessment.ts`, settings wiring → `src/ui/settings.ts`. `main.ts` becomes a thin orchestrator calling into these modules.
- **Observable Outcome**: `main.ts` is significantly shorter. Extracted modules are importable by future per-page entry points. App behavior unchanged.
- **Acceptance Criteria**:
  - Guild column building, color wheel building, and hover wiring in `src/ui/guild-columns.ts`
  - Self-assessment rendering in `src/ui/self-assessment.ts`
  - Settings panel wiring in `src/ui/settings.ts`
  - `main.ts` imports and calls these modules — no behavioral change
  - All existing telemetry attributes preserved
- **Observability**: `app.version` bump. Structural marker `app.module_structure = 'extracted'`.
- **Risks Reduced**: Makes the page split mechanical rather than surgical. Each module maps to exactly one future page.

### Phase 2: Page Creation

#### Arc 17: Create slides.html + src/slides.ts
- **Type**: Structural
- **Intention**: Create the slides page as a standalone HTML file with its own entry point. This is the most complex page (card timers, session state, telemetry spans). Welcome page navigates to `slides.html` instead of calling `startSession()`.
- **Observable Outcome**: Clicking "Learn guild names" on the welcome page navigates to `slides.html?subgroup=allied`. The quiz session runs entirely on slides.html. Session end navigates to `assessment.html` with session results as URL params.
- **Acceptance Criteria**:
  - `slides.html` loads independently with `slides.css` + `style.css`
  - Reads `subgroup` and `from` from URL params
  - Card session runs with all existing timing/interaction behavior
  - Card spans fire with all existing attributes
  - Navigates to `assessment.html` on session end (completed or stopped early)
  - `flushSpans()` called before navigation
  - `index.html` welcome button links to `slides.html`
  - esbuild builds `src/slides.ts` as a separate entry point
- **Observability**: `app.page = 'slides'` on all spans. `mtg-sparrow.session.id` generated and stored in sessionStorage.
- **Risks Reduced**: Proves the hardest page works standalone.

#### Arc 18: Create assessment.html + src/assessment.ts
- **Type**: Structural
- **Intention**: Create the self-assessment as its own page. Shows "How did that feel?" with the three options, then navigates to `end.html` with the assessment result as a URL param. A small, focused page.
- **Observable Outcome**: After a slides session, the browser navigates to `assessment.html`. The user sees the self-assessment prompt. After choosing, navigates to `end.html` with session and assessment data in URL params.
- **Acceptance Criteria**:
  - `assessment.html` loads independently with `assessment.css` + `style.css`
  - Reads `subgroup`, `cards`, `completed` from URL params (passed through from slides)
  - Displays self-assessment prompt and three buttons
  - On button click, navigates to `end.html` with all params plus `assessment=<value>`
  - If fewer than minimum cards shown (currently 3), skips straight to end (no assessment)
  - Records `session.self_assessment` on a telemetry span
- **Observability**: `app.page = 'assessment'` on all spans. Reads `mtg-sparrow.session.id` from sessionStorage.

#### Arc 19: Create end.html + src/end.ts
- **Type**: Structural
- **Intention**: Create the end page as a standalone HTML file. Renders guild columns, color wheels, and navigation buttons. Directly navigable — no assessment prompt blocking the view.
- **Observable Outcome**: `end.html` shows guild columns with correct lock/unlock state based on progression. "Learn/Practice" buttons navigate to `slides.html`. The page works when accessed directly (no URL params) or after a session (with params).
- **Acceptance Criteria**:
  - `end.html` loads independently with `end.css` + `style.css`
  - Reads optional `subgroup`, `cards`, `completed`, `assessment` from URL params
  - Progression state updated (localStorage) based on params if present
  - Guild columns render with correct lock/unlock state
  - Color wheels and bidirectional hover work
  - Navigation buttons link to `slides.html` with correct params
  - "Learn/Practice" text based on completion history
  - Works with no URL params (direct access shows guild columns based on localStorage)
- **Observability**: `app.page = 'end'` on all spans. Reads `mtg-sparrow.session.id` from sessionStorage if present.

#### Arc 20: Slim down index.html + create src/welcome.ts
- **Type**: Structural
- **Intention**: Remove all non-welcome code from `index.html`. Create `src/welcome.ts` as a minimal entry point (telemetry init, button wiring, welcome dwell time tracking). Delete `main.ts`.
- **Observable Outcome**: `index.html` is a clean welcome page. No quiz code, no session-end code. The "Learn guild names" button navigates to `slides.html`. `main.ts` is gone.
- **Acceptance Criteria**:
  - `index.html` links only `style.css` + `welcome.css`
  - `src/welcome.ts` handles telemetry init + button click + welcome dwell time
  - `main.ts` deleted (or emptied — all code now in page-specific entry points)
  - Welcome page loads fast with minimal JS
  - Settings panel works on welcome page
  - Build script produces four bundles: `welcome.js`, `slides.js`, `assessment.js`, `end.js`
- **Observability**: `app.page = 'welcome'` on startup span. `session.welcome_dwell_ms` still recorded (passed via URL or sessionStorage to slides page).

### Phase 3: Telemetry & Cleanup

#### Arc 21: Cross-Page Telemetry Verification with mtg-sparrow.session.id
- **Type**: Operator
- **Intention**: Ensure all session-related spans across all pages carry `mtg-sparrow.session.id` for Honeycomb correlation. Verify that every question from the observability plan is answerable.
- **Observable Outcome**: A Honeycomb query filtering on `mtg-sparrow.session.id` returns spans from welcome, slides, and end pages for a single user session.
- **Acceptance Criteria**:
  - `mtg-sparrow.session.id` generated on welcome page, stored in sessionStorage
  - All spans on all pages carry the attribute
  - `session.tier`, `session.subgroup` explicitly on card spans (not just inherited)
  - Honeycomb query demonstrates cross-page session correlation
  - `app.navigation = 'multi_page'` structural marker on all spans
- **Observability**: This arc IS the observability arc. Verified by Honeycomb query results.

---

## Arc Sequencing Notes

- Arc 14 (telemetry) is first deliberately — `mtg-sparrow.session.id` gives us observability for every subsequent arc.
- Arcs 15-16 (CSS split + module extraction) are preparation. The app continues to work as a single page throughout. These could potentially be parallelized.
- Arcs 17-20 (page creation) must be sequential — each page is created and verified before moving to the next.
- Arc 21 (telemetry verification) confirms cross-page correlation works end-to-end after all pages exist.

## Change Management

Arcs tracked in the Librarian's decision log. Each arc produces a version bump and a Honeycomb-verifiable trace.

## Estimated Phases

- **Phase 1** (Arcs 14-16): Foundations — telemetry, CSS split, module extraction
- **Phase 2** (Arcs 17-20): Page creation — slides, assessment, end, welcome
- **Phase 3** (Arc 21): Cross-page telemetry verification
