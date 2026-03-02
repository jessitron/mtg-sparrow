# RFP: End Screen Refinements

## Date: 2026-03-02

## Executive Summary

Transform the end screen from a two-column guild summary into a rich, row-based interactive reference. Each completed level gets a full-width information section with a summary, color circle, and flavorful guild descriptions. This lays the groundwork for extending to wedges and shards later.

## Problem Statement

The current end screen shows two columns (Allied and Enemy guilds) side by side. Each column has a color wheel, a guild list, and action buttons. This works, but:

- The columns are cramped, especially on mobile
- There's no descriptive content about what each guild *means* — their philosophy, flavor, personality
- The color wheel is squeezed into a narrow column when it deserves center stage
- The layout doesn't scale to four levels (allied, enemy, wedges, shards)

The client wants the end screen to become a place where learners can *explore* color combinations, not just see that they completed them.

## Goals

1. **Row layout**: Each level is a full-width row instead of a narrow column
2. **Three-part information sections**: Summary (title + description + combo list), color circle (centered), and flavor panel (shows description on highlight)
3. **Flavor text**: Each guild gets a rich description — philosophy, adjectives, how they see the world — plus a Scryfall link
4. **Card list additions**: Ensure iconic cards (like Aurelia for Boros) are included
5. **Extensible to future levels**: The layout pattern works when wedges and shards are added later

## Non-Goals

- Single-section navigation with arrows (separate future SOW)
- Wedge or shard content (future work; but the layout must accommodate them)
- Changes to the slides or assessment pages
- Changes to progression/unlock logic

## Constraints and Assumptions

- Vanilla TypeScript, esbuild, no framework
- The end screen is already its own page (end.html + src/end.ts)
- Color wheel SVG implementation exists and works well — reuse it
- Guild data structures exist in src/data/combos.ts
- Mobile responsiveness required
- Flavor text is new content that needs domain research

## Risks and Unknowns

- **Layout complexity**: Three-part rows with a centered wheel and a dynamic flavor panel need careful CSS
- **Content quality**: Flavor descriptions need to capture the *feel* of each guild without being too long or too lore-heavy
- **Mobile behavior**: The three-part layout needs to stack gracefully on small screens
- **Highlight interaction**: The flavor panel appears when a guild is highlighted — this interaction needs to feel natural on both desktop and mobile (hover vs tap)

## Architectural Approach

### Layout Structure (per level)

```
.level-section (full width row)
  ├── .level-summary (left on desktop)
  │   ├── h2 title ("Allied Guilds")
  │   ├── p description (what these color combos are)
  │   └── ul combo list (color pips + names)
  ├── .level-wheel (center on desktop)
  │   └── SVG color wheel (can be larger now!)
  └── .level-flavor (right on desktop)
      └── (blank until highlight, then shows guild description)
```

Desktop: three columns in a row. Mobile: stacked vertically.

### Data Changes

- Add `description` field to each ColorCombo (or a separate flavor data file)
- Add `levelDescription` for each subgroup/tier
- Add Scryfall search links per combo
- Add missing iconic cards

### Observability Plan

- Span attributes for which level section is viewed
- Track guild highlight interactions (which guilds do people explore?)
- Scryfall link clicks as events

## Testing Strategy

- E2E: End screen renders all completed levels as rows
- E2E: Color wheel highlight shows flavor text
- E2E: Mobile layout stacks correctly
- Visual verification by tester
- Honeycomb query confirming interaction telemetry

## Initial Arc Candidates

### Phase 1: Layout & Content

**Arc 22: End screen row layout**
- Type: User Arc
- Convert columns to full-width rows with three-part structure
- Reuse existing wheel, adapt CSS
- Flavor panel placeholder (shows guild name on highlight for now)

**Arc 23: Guild flavor text & card additions**
- Type: User Arc
- Domain expert researches and writes descriptions for all 10 guilds
- Add descriptions to data model
- Wire flavor panel to show descriptions on highlight
- Add Scryfall links
- Add missing iconic cards (Aurelia for Boros, etc.)

### Phase 2: Navigation (future SOW)

**Arc 24+: Single-section navigation with arrows**
- One level visible at a time
- Up/down arrows to navigate between levels
- "Next Level" button for uncompleted levels
- Home button at top, share button at bottom

## Rough Sizing

- Arc 22: Medium — primarily CSS restructuring + DOM changes in end.ts
- Arc 23: Medium — content creation + data model extension + wiring
- Phase 2 arcs: To be scoped in a future SOW after Phase 1 ships

## Recommendation

Start with Arc 22 (layout) and Arc 23 (content) in parallel tracks. The developer works on layout while the domain expert drafts flavor text. Arc 23 depends on Arc 22 for the flavor panel wiring, but the content research can begin immediately.

This keeps the end screen functional throughout — we're changing layout, not breaking features.
