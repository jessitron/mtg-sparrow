# SOW: Single-Section End Screen Navigation

## Date: 2026-03-02

## Engagement Scope

Transform the end screen from a multi-row scroll layout into a single-section-at-a-time view with snap navigation. Each completed level occupies the full viewport; arrow buttons move between sections with a slot-machine feel. Context-sensitive CTAs guide users toward locked levels or sharing when they've reached the end.

## Objectives

1. One section visible at a time with CSS scroll-snap transitions
2. Header/footer navigation buttons — context-sensitive based on position and unlock state
3. Empty state for sessions where nothing is unlocked
4. Navigation telemetry in Honeycomb (`end.section_navigate`, `end.start_level_click`)
5. Level dot indicator on left edge (Arc 25)
6. Polish: transitions and mobile tuning (Arc 26)

## Success Criteria

- End screen renders one section at a time, filling the viewport
- Up/down arrows move between sections with snap feel
- First section shows Home button (not up); last shows Share or "Start [Level]"
- Empty state shows home link when no levels unlocked
- Navigation telemetry visible in Honeycomb
- `end.layout_version = 'single_section_v1'` structural marker present
- Works on desktop and mobile

## Assumptions & Exclusions

- **Included**: Allied and enemy guild sections only (two max in current data)
- **Excluded**: Wedge and shard content (future work)
- **Excluded**: Changes to slides, assessment, or welcome pages
- **Excluded**: New progression/unlock logic
- Build stays esbuild, vanilla TypeScript, no framework
- Existing guild flavor text and color wheel interactions preserved

## Roles

- **Project Lead**: Coordination, arc sequencing, client communication
- **Developer**: Layout restructuring, DOM changes, CSS, navigation logic
- **Observability Engineer**: Navigation telemetry design
- **Tester**: Browser-based verification including navigation, CTAs, empty state
- **Librarian**: Decision recording, arc history

## Communication Cadence

Client pause after Arc 24 to confirm the navigation feel before proceeding to indicator and polish arcs.

---

## Planned Arcs

### Arc 24: Single-Section End Screen with Snap Navigation

- **Type**: User Arc
- **Version**: v0.22.0
- **Intention**: Rewrite the end screen layout to a header/body/footer pattern where the body is a scroll-snap container showing one section at a time.
- **Observable Outcome**: The end screen shows one completed level at a time. Arrow buttons in header and footer navigate between sections. The transition has a slot-machine snap feel. Context-sensitive labels guide users when they've reached the first or last section.
- **Acceptance Criteria**:
  - Single section fills the viewport body area
  - CSS scroll-snap-type: y mandatory on the body container
  - Up arrow in header (except at first section, which shows Home)
  - Down arrow in footer (except at last section, which shows "Start [Level]" if locked, or "Share" if all done)
  - Empty state: home link only, no sections
  - All existing guild content preserved (flavor text, color wheel, practice buttons)
  - Works on mobile
- **Observability Plan**:
  - `end.layout_version = 'single_section_v1'` as structural marker
  - `end.section_navigate` with `navigate.direction` and `navigate.target_section`
  - `end.start_level_click` when locked-level CTA is tapped
  - Honeycomb confirmation of all three span types required for completion

### Arc 25: Level Dot Indicator

- **Type**: User Arc
- **Intention**: Add a visual position indicator — four dots on the left edge, one per possible level section. Solid dot = completed, empty dot = locked, larger dot = current section.
- **Observable Outcome**: Users can see at a glance how many sections exist, which they've completed, and which they're currently viewing.
- **Acceptance Criteria**:
  - Four dots vertically arranged on left edge
  - Solid = completed level visible, empty = locked level, larger = current section
  - Dots update as user navigates between sections
  - Works on mobile (not obscured by content)
- **Observability Plan**:
  - Existing navigation telemetry covers position tracking
  - No new spans required

### Arc 26: Polish

- **Type**: User Arc
- **Intention**: Refine transitions, timing, and mobile behavior based on client feedback after Arc 24–25.
- **Observable Outcome**: The navigation feels fluid and intentional. Any rough edges from Arcs 24–25 are resolved.
- **Acceptance Criteria**: TBD based on Arc 24–25 feedback
- **Observability Plan**: Any new telemetry to be defined based on observed issues

---

## Change Management

Tasks tracked via Small Arc Studio task system. Decisions recorded in the Librarian's decision log. Arc completion requires tester verification and Honeycomb confirmation per standard process.
