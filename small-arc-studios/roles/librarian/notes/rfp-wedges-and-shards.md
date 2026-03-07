# RFP: Wedges & Shards — Three-Color Combinations

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-02
**Client**: Jessitron
**Version**: Draft for Review

---

## Executive Summary

Expand MTG Sparrow from teaching 10 two-color guild names to also teaching 10 three-color combination names — the 5 **shards** (from Alara) and 5 **wedges** (from Tarkir). This doubles the learning content of the app and introduces a natural "next level" progression after guilds.

---

## Problem Statement

Users who complete both Allied and Enemy guild levels have nowhere to go. Three-color combinations are the natural next step in MTG color identity learning, and they're harder to remember — exactly the kind of thing Sparrow Deck is good at drilling.

---

## Goals

1. Add flashcard sessions for all 5 shards and all 5 wedges
2. Present them as distinct levels that unlock after guilds
3. Provide end-screen review sections with color wheel visualization for 3-color combos
4. Include flavor text and Scryfall links for each shard/wedge
5. Maintain the existing progression unlock flow
6. Full observability for the new tiers

## Non-Goals

- Four-color and WUBRG combos (future work)
- Single-color tutorial level (separate feature)
- Mixed-tier bonus levels

---

## The 10 Three-Color Combinations

### Shards (one color + its two allies, from Alara block)

| Name | Colors | Identity |
|------|--------|----------|
| Bant | G-W-U | Order, growth, community |
| Esper | W-U-B | Artifice, control, perfection |
| Grixis | U-B-R | Death, cruelty, dark power |
| Jund | B-R-G | Primal savagery, survival |
| Naya | R-G-W | Enormous creatures, instinct |

### Wedges (one color + its two enemies, from Tarkir block)

| Name | Colors | Identity |
|------|--------|----------|
| Abzan | W-B-G | Endurance, community through strength |
| Jeskai | U-R-W | Cunning, martial arts, enlightenment |
| Sultai | B-G-U | Ruthlessness, wealth, necromancy |
| Mardu | R-W-B | Speed, aggression, raiding |
| Temur | G-U-R | Savagery, shamanism, wilderness |

---

## Constraints and Assumptions

### Technical Readiness (already in place)
- `ColorCombo.tier` already includes `"shard" | "wedge"` in the type
- `ColorCombo.colors` is `string[]` — handles 3 colors already
- `buildDeck()` is combo-count-agnostic
- `renderPips()` renders any number of color pips
- Progression system uses generic string keys — `'shards'` and `'wedges'` work immediately

### Changes Required
- **Data layer**: New combo entries with card references; new description entries
- **Session**: Expand `GuildSubgroup` type to include `'shards' | 'wedges'`; update `createSession` pool logic
- **End screen**: Two new sections (wedge review, shard review); new color wheel visualization showing triangles instead of lines
- **Progression gating**: Wedges unlock after completing enemy guilds; shards unlock after completing wedges
- **Entry flow**: Way to start wedge/shard sessions (end screen "Start Level" buttons already exist)
- **Welcome screen mana gas**: Extend the encounter detection to recognize 3-particle clusters as shard/wedge names (currently only detects 2-particle guild pairs)

### Level Ordering

Allied Guilds → Enemy Guilds → Wedges → Shards

This ordering reflects escalating difficulty and builds on what was learned previously.

### Assumptions
- ~10 representative cards per shard/wedge (iconic multicolor cards from those color triples)
- Same session length (25 cards) works for 3-color combos
- Same self-assessment flow (Still learning / Getting there / Nailing it)

---

## Risks and Unknowns

| Risk | Impact | Mitigation |
|------|--------|------------|
| Color wheel for 3-color combos is visually complex | Could confuse users | Design spike in first arc; triangles overlaid on the pentagon |
| Card selection for shards/wedges | Some combos have fewer iconic cards than guilds | Domain expert research; supplement with commander staples |
| Unlock gating UX | Users might not understand why shards/wedges are locked | Clear locked-state messaging on end screen |
| Session with 3 pips per card is harder to scan | Slower recognition | This is actually the point — it's the next difficulty level |

---

## Architectural Approach

### Recommended: Incremental Layer Addition

Add wedges and shards as new tiers atop the existing architecture. No restructuring needed.

1. **Data first** — add combo definitions and descriptions
2. **Session support** — expand the type system and pool selection
3. **End screen sections** — add wedge and shard review sections with triangle-based wheel visualization
4. **Progression wiring** — unlock gating and section navigation
5. **Mana gas** — extend 2-particle encounter detection to also detect 3-particle clusters
6. **Polish** — dot indicators, transitions

### Alternative Considered: Generic "Level" Abstraction

Could refactor guilds, shards, and wedges into a single generic "level" system. **Rejected** — the current code is clean enough that adding two more tiers doesn't warrant an abstraction. We'd be designing for hypothetical four-color combos that aren't on the roadmap yet.

---

## Observability Plan

- `session.tier` values: `'shard'`, `'wedge'` (alongside existing `'guild_allied'`, `'guild_enemy'`)
- `end.section` values: `'shards'`, `'wedges'` (new sections)
- `end.combo_highlight` for shard/wedge hover (parallels `end.guild_highlight`)
- `end.layout_version` bump to `'reel_v2'` when sections are added
- Progression unlock events: `progression.subgroup_unlocked` with `'shards'` / `'wedges'`

Questions answerable in Honeycomb after delivery:
- Are users reaching shard/wedge levels?
- Which 3-color combos get the most self-assessment struggle?
- How does session completion rate compare between guilds and 3-color combos?

---

## Testing Strategy

- Playwright tests per arc, following existing pattern
- Bundle content verification (combo names present in built code)
- DOM verification (sections render, navigation works)
- Honeycomb trace verification (new telemetry events reach the backend)

---

## Initial Arc Candidates

1. **Wedge & Shard Data** (Structural) — Add all 10 combo definitions, card references, and descriptions. Version marker. No UI changes.
2. **Three-Color Sessions** (User) — Expand session system to support wedge/shard tiers. Flashcard flow works for 3 pips.
3. **End Screen: Wedge Section** (User) — Add wedge review section to end screen reel with triangle-based color wheel.
4. **End Screen: Shard Section** (User) — Add shard review section. Reuses triangle wheel pattern from wedge arc.
5. **Progression Gating** (User) — Wire unlock flow: enemy guilds complete → wedges unlock; wedges complete → shards unlock.
6. **Mana Gas 3-Color Encounters** (User) — Extend welcome screen particle simulation to detect 3-particle clusters and show wedge/shard names in larger bubbles.
7. **Polish & Indicators** (User) — Level dots updated for 4+ sections, transitions, mobile tuning.

---

## Rough Sizing

7 arcs, each small and deliverable. The data arc is the largest in terms of content (card curation). The end screen arcs have the most UI complexity (triangle wheel visualization). The mana gas arc is a delightful extension of existing physics — when 3 particles of matching colors cluster, a larger bubble forms with the 3-color name. Progression wiring is straightforward given the generic system already in place.

---

*Submitted for client review.*
