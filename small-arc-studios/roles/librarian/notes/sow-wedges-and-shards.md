# SOW: Wedges & Shards — Three-Color Combinations

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-02
**Client**: Jessitron
**RFP Reference**: `rfp-wedges-and-shards.md`
**Target Version**: v0.23.0

---

## Engagement Scope

Add 10 three-color combinations (5 wedges, 5 shards) to MTG Sparrow as two new progression levels following the existing guild levels. Includes flashcard sessions, end screen review sections with triangle-based color wheel visualization, progression gating, welcome screen mana gas encounters, and full observability.

## Objectives

1. Users can learn all 5 wedge names through flashcard sessions
2. Users can learn all 5 shard names through flashcard sessions
3. End screen provides review sections for wedges and shards with the same quality as guild sections
4. Progression gates wedges behind enemy guild completion and shards behind wedge completion
5. Welcome screen mana gas shows 3-color encounter bubbles
6. All new behavior is observable in Honeycomb

## Success Criteria

- All 10 three-color combos have card references and flavor descriptions
- Flashcard sessions work with 3 pips per card
- End screen reel navigates across 4 level sections + share
- Mana gas recognizes 3-particle clusters and labels them
- Honeycomb traces distinguish wedge/shard sessions from guild sessions
- All arcs pass Playwright verification

## Assumptions

- ~10 iconic cards per wedge/shard (commander staples and block-specific cards)
- Same session length (25 cards) as guilds
- Same self-assessment flow
- Triangle visualization on color wheel (3 nodes connected) replaces line visualization (2 nodes connected) for 3-color sections

## Exclusions

- Four-color and WUBRG combos
- Single-color tutorial level
- Mixed-tier bonus levels
- Welcome page redesign beyond mana gas extension

## Roles

- **Project Lead**: Coordination, arc definition, client communication
- **Developer**: Implementation
- **Tester**: Playwright verification, Honeycomb confirmation
- **Librarian**: Decision recording, arc documentation
- **Designer**: Triangle wheel visualization, mana gas bubble sizing
- **Domain Expert (MTG)**: Card curation for all 10 three-color combos

## Communication Cadence

- Client pause after Arc 28 (first arc) to confirm data and direction
- Continuous delivery for remaining arcs
- Client review after final arc

## Change Management

- Decisions recorded in `decision-log.md` (continuing from DEC-092)
- Arc records in librarian notes
- SOW amendments if direction shifts

---

## Planned Arcs

### Phase 1: Foundation

#### Arc 28 — Wedge & Shard Data
- **Type**: Structural
- **Intention**: Add all 10 three-color combo definitions with card references and flavor descriptions to the data layer
- **Observable Outcome**: New combo data is present in the bundle; `combo.tier` version marker distinguishes 3-color entries
- **Acceptance Criteria**:
  - 5 wedge combos defined (Abzan, Jeskai, Sultai, Mardu, Temur) with ~10 cards each
  - 5 shard combos defined (Bant, Esper, Grixis, Jund, Naya) with ~10 cards each
  - Flavor descriptions and Scryfall URLs for all 10
  - Export helpers: `wedges`, `shards` (parallel to `alliedGuilds`, `enemyGuilds`)
  - `data.tier_version = 'three_color_v1'` structural marker in telemetry
- **Risk Reduced**: Validates that the data model handles 3-color combos without friction
- **Expected Learning**: Card curation quality for 3-color combos; whether 10 cards per combo is sufficient

#### Arc 29 — Three-Color Sessions
- **Type**: User
- **Intention**: Users can run flashcard sessions for wedges or shards, seeing 3 mana pips per card
- **Observable Outcome**: Navigating to `slides?subgroup=wedges` or `slides?subgroup=shards` runs a 25-card session with 3-color combos
- **Acceptance Criteria**:
  - `GuildSubgroup` type expanded (or renamed) to include `'wedges' | 'shards'`
  - `createSession` selects the correct combo pool
  - 3 pips render correctly per card (already works, needs verification)
  - Session telemetry: `session.tier = 'wedge'` or `session.tier = 'shard'`
  - Assessment flow passes subgroup through correctly
- **Risk Reduced**: Confirms the slides engine handles 3-color combos end-to-end
- **Expected Learning**: Visual density of 3 pips; whether timing constants need adjustment

### Phase 2: End Screen

#### Arc 30 — End Screen: Wedge Section
- **Type**: User
- **Intention**: Add a wedge review section to the end screen reel with triangle-based color wheel
- **Observable Outcome**: End screen has a "Wedges" section showing all 5 wedges with color wheel triangles, flavor text, and Scryfall links
- **Acceptance Criteria**:
  - Wedge section appears in reel after enemy guilds section
  - Color wheel shows triangles connecting 3 color nodes (instead of lines between 2)
  - Hover/click highlights wedge name, flavor text, Scryfall link
  - Telemetry: `end.section = 'wedges'`, `end.combo_highlight` for wedge hovers
  - Navigation buttons work (Up to enemy guilds, Down to shards when available)
- **Risk Reduced**: Validates triangle visualization design
- **Expected Learning**: Whether triangle overlays on the pentagon are readable

#### Arc 31 — End Screen: Shard Section
- **Type**: User
- **Intention**: Add a shard review section to the end screen reel
- **Observable Outcome**: End screen has a "Shards" section showing all 5 shards with triangle wheel, flavor text, and Scryfall links
- **Acceptance Criteria**:
  - Shard section appears after wedge section in reel
  - Reuses triangle wheel pattern from Arc 30
  - Hover/click highlights shard name, flavor, Scryfall link
  - Telemetry: `end.section = 'shards'`, `end.combo_highlight` for shard hovers
  - Section ordering: allied → enemy → wedges → shards → share
  - `end.layout_version = 'reel_v2'`
- **Risk Reduced**: Confirms the pattern generalizes
- **Expected Learning**: Whether 5 sections + share feels like too many in the reel

### Phase 3: Progression & Welcome

#### Arc 32 — Progression Gating
- **Type**: User
- **Intention**: Wire the unlock flow so users progress through levels in order
- **Observable Outcome**: Wedges are locked until enemy guilds are completed; shards are locked until wedges are completed. Locked sections show a clear locked state in the end screen.
- **Acceptance Criteria**:
  - Completing enemy guild session marks `'enemy'` completed and unlocks `'wedges'`
  - Completing wedge session marks `'wedges'` completed and unlocks `'shards'`
  - Locked sections in reel show lock indicator and "Complete [previous level] to unlock"
  - "Start Level" button only appears on unlocked, incomplete sections
  - Telemetry: `progression.subgroup_unlocked` with `'wedges'` / `'shards'`
- **Risk Reduced**: Validates the full progression chain works across 4 levels
- **Expected Learning**: Whether the unlock messaging is clear enough

#### Arc 33 — Mana Gas 3-Color Encounters
- **Type**: User
- **Intention**: Welcome screen mana gas recognizes 3-particle clusters and shows wedge/shard names
- **Observable Outcome**: When three mana symbols of matching colors drift close together on the welcome screen, a larger bubble forms with the 3-color combo name
- **Acceptance Criteria**:
  - `COMBOS_3` lookup maps sorted color triples to wedge/shard names
  - 3-particle proximity detection (triangle of 3 particles within threshold distance)
  - Larger bubble radius for 3-color encounters than 2-color
  - Combo name displayed above the bubble
  - Existing 2-color guild encounters still work
  - A 3-color encounter takes priority if it subsumes a 2-color encounter
- **Risk Reduced**: Confirms the physics simulation scales to higher-order encounters
- **Expected Learning**: Frequency of 3-particle encounters; whether bubble sizing feels right

### Phase 4: Polish

#### Arc 34 — Polish & Indicators
- **Type**: User
- **Intention**: Visual polish for the expanded level system
- **Observable Outcome**: Level indicators, transitions, and mobile experience are tuned for 4+ levels
- **Acceptance Criteria**:
  - Level dot indicator updated (4 level dots + share, not just 2)
  - Smooth transitions between sections
  - Mobile viewport handles wider content
  - Section open animation (0-height → full-height transition) to prevent flash of wrong section
- **Risk Reduced**: Validates the full experience feels cohesive
- **Expected Learning**: Whether further polish is needed or if this is shippable

---

## Estimated Phasing

| Phase | Arcs | Focus |
|-------|------|-------|
| 1: Foundation | 28–29 | Data + sessions |
| 2: End Screen | 30–31 | Review sections with triangle wheels |
| 3: Progression & Welcome | 32–33 | Unlock flow + mana gas |
| 4: Polish | 34 | Indicators, transitions, mobile |

---

## Payment Milestones

N/A (internal project)

---

## Change Management

Arc sequencing may evolve based on learning. Completed arcs remain complete and valuable. If the triangle wheel visualization proves problematic, we may substitute a simpler list-based display and revisit visualization later.

---

*Submitted for client approval.*
