# Arc 33: Three-Color Encounter Detection in Mana Gas

## Arc Details
- **Type**: User Arc (Welcome Screen / Mana Gas)
- **Date**: 2026-03-07
- **Status**: COMPLETE — 25/25 PASS
- **Plan**: plan-mana-gas-three-color-encounters.md

## Intention
Add three-color encounter detection to the mana gas simulation on the welcome screen. When three mana symbols of a valid triple (wedge or shard) cluster together, the encounter bubble upgrades from a two-color guild name to a three-color triple name. This makes the progression from pair to triple visible to users — "Dimir + Green = Sultai."

## Observable Outcome
Three-color encounters form when a third matching particle enters a two-color encounter bubble. The encounter displays the triple name in gold text at 22px with a gold stroke, visually distinct from white 18px guild labels. When the third particle drifts away, the encounter downgrades back to the two-color guild. A `mana-gas-encounter` CustomEvent fires on triple formation with `{ type: "triple", name, colors }`.

## What Was Built

### src/mana-gas.js
- **TRIPLES map**: All 10 three-color combos — 5 wedges (Abzan, Jeskai, Sultai, Mardu, Temur) and 5 shards (Bant, Esper, Grixis, Jund, Naya).
- **TRIPLE_BUBBLE_RADIUS**: `R * 2.8` (vs `R * 2` for two-color guilds). Larger bubble accommodates three particles.
- **tripleName(c1, c2, c3)**: Looks up a sorted three-color key in the TRIPLES map.
- **Intruder detection upgraded**: When a third color enters a two-color encounter, checks if the three colors form a valid triple. If yes: upgrades to three-color encounter with gold label and larger bubble. If no: pops the encounter as before.
- **Downgrade behavior**: Three-color encounters revert to two-color guild encounters when the third particle drifts out of range.
- **alreadyIn check**: Updated to also check `e.c` (third particle reference).
- **Visual treatment**: Gold stroke (`rgba(255,215,0,0.4)`), 22px bold gold text for triple names.
- **CustomEvent**: `mana-gas-encounter` dispatched on triple formation with `{ type: "triple", name, colors }`.

## Team
- **Developer**: Implemented upgrade/downgrade model for three-color encounters in mana-gas.js.
- **Tester**: 25/25 tests passed. Triple encounters form readily with aggressive fanning (~14 events in 4 seconds). All 10 combos verified in source. Upgrade, downgrade, and non-matching-intruder-pop all confirmed working.

## Acceptance Criteria — All Met

- [x] All 10 three-color combos defined (5 wedges + 5 shards)
- [x] Third particle entering a two-color encounter upgrades to triple when colors match
- [x] Non-matching third particle pops the encounter (existing behavior preserved)
- [x] Triple encounters downgrade to guild encounters when third particle drifts away
- [x] Gold visual distinction: gold stroke, 22px bold gold text (vs white 18px for guilds)
- [x] Larger bubble radius (2.8x) for triple encounters
- [x] `mana-gas-encounter` CustomEvent dispatched on triple formation
- [x] No listener wired to Honeycomb yet (confirmed as future arc scope)

## Key Files Changed
- `src/mana-gas.js` — TRIPLES map, tripleName(), upgrade/downgrade logic, gold visual treatment, CustomEvent dispatch

## Observability
- `mana-gas-encounter` CustomEvent with `{ type: "triple", name, colors }` dispatched on triple formation
- Honeycomb telemetry forwarding is out of scope for this arc — mana-gas.js is standalone vanilla JS outside the esbuild bundle, so CustomEvent is the cross-boundary communication pattern (same as drag events from Arc 32)
- Future arc will wire the event listener to send spans to Honeycomb

## Decisions
- DEC-108: Upgrade/downgrade model for three-color encounters (not independent O(n^3) detection)
- DEC-109: Triple name replaces guild name (not shown alongside)
- DEC-110: Gold visual distinction for triple encounters (gold stroke, 22px bold gold text)
- DEC-111: Telemetry via CustomEvent — same cross-boundary pattern as drag events

## Lessons Learned
- The upgrade/downgrade model makes the progression from pair to triple visible to users. It also avoids an O(n^3) scan each frame, which would be wasteful given that triples only matter in the context of an existing pair encounter.
