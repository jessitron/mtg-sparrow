# Plan: Publish Readiness

## Section 1: Discovery

### Problem Statement

MTG Sparrow has strong core functionality — slides, assessment, end screen, progression, telemetry — but hasn't been reviewed for public-facing readiness. Before sharing the URL with real users, we need to fix known bugs, establish legal/identity basics, polish rough edges, and ensure the production deploy pipeline supports ongoing operation.

### Goals

- Fix bugs that break user flow (home link, end screen flash, layout shift)
- Establish legal and identity foundations (license, about page, meta tags)
- Clean up artifacts that shouldn't be public (prototype HTML files)
- Ensure production telemetry supports day-one operations (deploy markers)
- Make the welcome experience work on mobile

### Non-Goals

- New features (progression buttons, single-color tutorial, share functionality)
- Content changes beyond mobile welcome text curation
- Custom domain setup (separate concern)
- Patreon/monetization integration

### Constraints & Assumptions

- GitHub Pages hosting remains the deployment target
- esbuild pipeline, no framework changes
- Client will curate mobile welcome text (we provide the responsive structure)
- CC0 license as specified by client

### Risks & Unknowns

- **Scryfall image reliability**: Unknown how gracefully the app handles Scryfall being slow/down. Needs investigation in Arc 35.
- **Prototype HTML exposure**: Files like `prototype.html`, `slot-machine.html` etc. are publicly accessible on GitHub Pages. Need to either exclude from deploy or remove.
- **Mobile testing**: We haven't systematically tested on mobile viewports. Arc 38 may surface additional issues.

### Architectural Approach

No structural changes needed. This is a polish and hardening pass across the existing architecture.

### Observability Strategy

- Deploy markers in Honeycomb (Arc 38) enable correlating user-reported issues with specific deploys
- Feedback mechanism (if included) routes user feedback through telemetry
- Existing telemetry unchanged — we're hardening what's already there

### Testing Strategy

- Each arc verified by tester in real browser (existing standard)
- Mobile arc verified at common mobile viewport widths
- Production verification after deploy for home link fix

---

## Section 2: Arcs

### Phase 1: Bug Fixes

**Arc 35: Fix User-Facing Bugs**

- Type: User
- Intention: Eliminate the three bugs that most damage user experience
- Observable Outcome: End screen home link works in production; no Allied→Enemy flash on end screen; slides don't shift when card images load
- Acceptance Criteria:
  - Home link navigates correctly on GitHub Pages (relative URL, not "/")
  - End screen sections open with a scroll/reveal transition, hiding the initial render
  - Slide layout reserves space for card image before it loads
  - Scryfall image load failure shows graceful fallback (not broken image icon)
- Observability: Existing telemetry covers these flows. Verify end screen traces show no anomalous timing from the reveal transition.
- Risks Reduced: Users hitting dead ends or seeing jarring visual glitches on first visit

### Phase 2: Legal & Identity

**Arc 36: License, About Page, Site Identity, and Share**

- Type: User
- Intention: Establish the site's legal and public identity, and give users a way to share it
- Observable Outcome: Site has a license, an about page with proper acknowledgements, a favicon, rich meta tags for link previews, and a "Copy link" share button
- Acceptance Criteria:
  - CC0 LICENSE file in repo root
  - About page accessible from settings menu, acknowledging: Scryfall, MTG Wiki (mana/guild symbols), Wizards of the Coast (guild flavor descriptions)
  - Page `<title>` updated from "MTG Color Combos" to something more polished
    - Client: But MTG Color Combos is the name of the app right now. Let's leave this and revisit after we pick a real domain name.
  - Open Graph meta tags (title, description, image) for social sharing previews
  - Favicon present
  - "Copy link" button in settings menu and on end screen under "Share"
  - Copied URL includes `?utm_source=share&utm_id={session_id}` so shared traffic is identifiable
  - Arriving with a `utm_id` param records it as a telemetry attribute so we can trace referral chains
- Observability: `about.page_view` span when about page is visited. `share.copy_link` event recording the session ID. Inbound `utm_id` and `utm_source` recorded as span attribute on page view, queryable in Honeycomb to answer "how many visitors came from shares, and which sessions generated them?"
- Risks Reduced: Legal exposure, unprofessional first impression when link is shared, no way for happy users to spread the word

### Phase 3: Polish & Cleanup

**Arc 37: Clean Up Public-Facing Artifacts**

- Type: Structural
- Intention: Remove development artifacts that shouldn't be publicly accessible
- Observable Outcome: Prototype and test HTML files are not served in production
- Acceptance Criteria:
  - `prototype.html`, `color-wheel-test.html`, `mana-gas.html`, `slot-machine.html`, `card-back-demo.html` are removed
  - CSS files and rules specific to those are also removed.
  - Extract `APP_VERSION` to a shared module (currently duplicated in 4 entry points)
  - `app.version` is present on every event in Honeycomb.
  - No broken internal references after cleanup
  - Build still works normally
- Observability: increment version number. Get version number in every log, span, and (if they still exist) span event.
- Risks Reduced: Users stumbling onto half-finished prototype pages

**Arc 38: Mobile Welcome & Responsiveness**

- Type: User
- Intention: Make the welcome screen work well on phone-sized screens
- Observable Outcome: Welcome page is readable and functional at 375px width
- Client says: it's quite good on my phone now. Too much text, is all.
- Acceptance Criteria:
  - Welcome text is shorter on mobile (client to provide curated copy, or responsive hiding of detail)
    - Copy should say: "MTG Color Combos/1. See a combo/2. Guess a name out loud/3. See the name. Say the name."
    - Then the button says "Start"
  - Button is easily tappable
  - Mana gas canvas doesn't interfere with interaction on small screens
  - No horizontal scrolling
- Observability: Existing welcome.page_view telemetry. Can filter by viewport width to see mobile vs desktop usage.
- Risks Reduced: Losing mobile users on first page

### Phase 4: Operations

**Arc 39: Deploy Markers**

- Type: Operator
- Intention: Enable correlating user experience with specific deployments
- Observable Outcome: Each deploy to GitHub Pages creates a marker in Honeycomb
- Acceptance Criteria:
  - Deploy script (or GitHub Action) sends a marker to Honeycomb on successful deploy
  - Marker includes commit SHA and timestamp
  - Marker visible in Honeycomb query timeline
- Observability: This arc _is_ observability. Markers queryable in Honeycomb.
- Risks Reduced: Blind debugging when something breaks after a deploy

---

### Communication Cadence

- **Pause after Arc 35** (bug fixes): Client confirms bugs are resolved before moving to identity/polish work
- **Continuous through Arcs 36-39** unless client requests otherwise

### Change Management

- Decisions recorded in decision-log.md by Librarian (continuing DEC-xxx sequence)
- Plan amendments explicit if scope changes
