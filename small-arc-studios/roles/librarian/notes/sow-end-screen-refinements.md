# SOW: End Screen Refinements

## Date: 2026-03-02

## Engagement Scope

Transform the end screen from a two-column guild summary into a full-width, row-based interactive reference with rich flavor text for each guild. Each completed level gets a full-width information section with summary, color circle, and guild descriptions.

## Objectives

1. Each completed level displayed as a full-width row instead of a narrow column
2. Three-part layout per level: summary, centered color wheel, and flavor panel
3. Flavorful descriptions for all 10 guilds — philosophy, personality, Scryfall links
4. Iconic card additions where needed (e.g., Aurelia for Boros)
5. Layout pattern extensible to wedges and shards in the future

## Success Criteria

- End screen renders completed levels as full-width rows
- Color wheel is prominently centered with more space than current column layout
- Highlighting a guild shows its flavor description in the flavor panel
- Each guild description includes a Scryfall link
- Works well on both desktop and mobile
- Interaction telemetry visible in Honeycomb

## Assumptions & Exclusions

- **Included**: Allied and enemy guild content only
- **Excluded**: Wedge and shard content (future work)
- **Excluded**: Single-section navigation with arrows (future SOW)
- **Excluded**: Changes to slides, assessment, or welcome pages
- No new progression/unlock logic
- Build stays esbuild, vanilla TypeScript, no framework

## Roles

- **Project Lead**: Coordination, arc sequencing, client communication
- **Developer**: Layout restructuring, DOM changes, CSS, wiring
- **Domain Expert**: Guild flavor text research and writing
- **Designer**: Consulted on layout decisions and mobile responsiveness
- **Observability Engineer**: Interaction telemetry design
- **Tester**: Browser-based verification of layout, interactions, mobile
- **Librarian**: Decision recording, arc history

## Communication Cadence

Client pause after Arc 22 (layout) to confirm the visual direction before wiring in flavor content.

---

## Planned Arcs

### Arc 22: End Screen Row Layout

- **Type**: User Arc
- **Intention**: Restructure the end screen from two side-by-side columns to full-width rows, each with a three-part layout (summary, centered color wheel, flavor panel placeholder).
- **Observable Outcome**: Each completed level renders as a full-width row. The color wheel is centered and larger. A placeholder flavor panel appears on guild highlight. Mobile layout stacks vertically.
- **Acceptance Criteria**:
  - Allied and enemy guilds each render as a full-width row
  - Each row has: summary section (title, description, combo list), centered color wheel, flavor panel area
  - Color wheel interaction (highlight/tap) still works
  - Flavor panel shows guild name on highlight (placeholder for Arc 23 content)
  - Responsive: three-part layout on desktop, stacked on mobile
  - Existing functionality preserved (Learn/Practice buttons, progression state)
- **Observability Plan**:
  - Existing telemetry preserved (session summary span, navigation events)
  - Add `end.layout_version = 'rows_v1'` span attribute for structural tracking
- **Risks**: CSS restructuring may need iteration to get the three-part balance right

### Arc 23: Guild Flavor Text & Card Additions

- **Type**: User Arc
- **Intention**: Add rich, flavorful descriptions for all 10 guilds and wire them into the flavor panel. Add Scryfall links and iconic cards.
- **Observable Outcome**: Highlighting any guild on the color wheel or list shows a compelling description of that guild's philosophy, personality, and worldview. Each description includes a "More [Guild] cards" Scryfall link. Iconic cards added to guild card lists.
- **Acceptance Criteria**:
  - All 10 guilds have flavor descriptions (philosophy, adjectives, personality, what they value)
  - Flavor panel shows full description on guild highlight
  - Each description includes a Scryfall link to that guild's cards
  - Aurelia added to Boros card list (and other iconic cards as appropriate)
  - Descriptions are engaging but concise — capture the *feel*, not the lore
  - Works on mobile (flavor text readable, not truncated)
- **Observability Plan**:
  - Track guild highlight interactions: `end.guild_highlight` with guild ID
  - Track Scryfall link clicks: `end.scryfall_click` with guild ID
  - Queryable in Honeycomb: "Which guilds do people explore most on the end screen?"
- **Risks**: Content tone — descriptions need to be evocative without being overwhelming
- **Expected Learning**: Which guilds generate the most curiosity

---

## Change Management

Tasks tracked via Small Arc Studio task system. Decisions recorded in the Librarian's decision log. Arc completion requires tester verification and Honeycomb confirmation per standard process.
