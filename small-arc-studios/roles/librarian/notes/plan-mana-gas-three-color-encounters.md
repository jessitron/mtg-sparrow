# Plan: Mana Gas Three-Color Encounters

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-07
**Client**: Jessitron

---

## Section 1: Discovery

### Problem Statement

The mana gas simulation on the welcome screen detects two-color guild encounters but treats a third color as an "intruder" that pops the bubble. Now that wedge and shard data exist in the app, three-color clusters should be recognized and displayed — turning what was a disruption into a teaching moment.

### Goals

1. Detect when three particles of colors matching a valid wedge or shard cluster together
2. Display the three-color combo name in a larger encounter bubble
3. Upgrade existing two-color encounters when a matching third color arrives
4. Downgrade back to two-color when the third particle drifts away
5. Emit telemetry for three-color encounters
6. Maintain existing two-color guild encounter behavior for non-matching intruders

### Non-Goals

- Four-color or five-color detection
- Changes to the end screen or session system
- Changes to drag behavior

### Domain Research

The 10 three-color combos each contain exactly two guilds:

| Combo | Colors | Contains Guilds |
|-------|--------|-----------------|
| Bant | G-W-U | Selesnya (GW) + Simic (GU) + Azorius (WU) |
| Esper | W-U-B | Azorius (WU) + Dimir (UB) + Orzhov (WB) |
| Grixis | U-B-R | Dimir (UB) + Rakdos (BR) + Izzet (UR) |
| Jund | B-R-G | Rakdos (BR) + Gruul (RG) + Golgari (BG) |
| Naya | R-G-W | Gruul (RG) + Selesnya (GW) + Boros (RW) |
| Abzan | W-B-G | Orzhov (WB) + Golgari (BG) + Selesnya (GW) |
| Jeskai | U-R-W | Izzet (UR) + Boros (RW) + Azorius (WU) |
| Sultai | B-G-U | Golgari (BG) + Simic (GU) + Dimir (UB) |
| Mardu | R-W-B | Boros (RW) + Orzhov (WB) + Rakdos (BR) |
| Temur | G-U-R | Simic (GU) + Izzet (UR) + Gruul (RG) |

### Constraints and Technical Readiness

- `mana-gas.js` is standalone vanilla JS (not in esbuild bundle) — cannot import from combos.ts
- Three-color combo lookup must be defined inline in mana-gas.js, similar to the existing `GUILDS` map
- Encounter detection already runs in the animation loop — must remain performant
- The "intruder" check (lines 370-379) is the natural upgrade point

### Architectural Approach

**Upgrade/downgrade model**: When a third particle enters a two-color encounter bubble and the three colors form a valid combo, the encounter upgrades to a three-color encounter. When the third particle leaves, it downgrades back to the two-color encounter. If the intruder's color doesn't form a valid three-color combo, the encounter still pops as before.

Implementation:
1. Add a `TRIPLES` map (sorted 3-color key to combo name) alongside the existing `GUILDS` map
2. Modify the intruder detection: before popping, check if the intruding particle's color + the encounter's two colors form a valid triple
3. If valid: upgrade the encounter object to track three particles (`a`, `b`, `c`), show the triple name, use a larger bubble radius
4. Three-color encounters check if any of the three particles has left the bubble; if so, find which two remain close and downgrade to the appropriate guild encounter
5. Larger bubble radius for three-color encounters (e.g., `R * 2.8` vs `R * 2`)

**Alternative considered**: Detect three-color clusters independently of two-color encounters (scan all triples of particles each frame). Rejected — O(n^3) per frame is expensive with 35 particles, and the upgrade model is more natural and more visible to users.

### Observability Strategy

- `CustomEvent('mana-gas-encounter')` dispatched when a three-color encounter forms
  - `detail: { type: 'triple', name: 'Sultai', colors: ['B','G','U'] }`
- Existing two-color encounters can also emit events for parity (separate arc if desired)
- Welcome page JS can listen and forward to telemetry

### Testing Strategy

- Manual verification: observe three matching colors clustering and seeing the combo name
- Playwright test: inject particle positions programmatically to force a known three-color cluster, verify the encounter event fires
- Honeycomb trace verification for the encounter event

---

## Section 2: Arcs

### Arc 33: Three-Color Encounter Detection

**Type**: User

**Intention**: When three mana particles whose colors form a valid wedge or shard cluster together on the welcome screen, display the three-color combo name in an encounter bubble.

**Observable Outcome**: Users see wedge and shard names appear in the mana gas when three matching colors drift together. The bubble is visibly larger than guild encounter bubbles. When the cluster breaks apart, it downgrades to a guild encounter or disappears.

**Acceptance Criteria**:
1. A `TRIPLES` map contains all 10 three-color combos (5 wedges + 5 shards)
2. When a third particle enters a two-color encounter and the three colors form a valid triple, the bubble upgrades to show the triple name
3. Three-color bubbles have a larger radius than two-color bubbles
4. When a particle leaves a three-color encounter, it downgrades to the appropriate two-color guild encounter (if two remain close)
5. Non-matching intruders still pop two-color encounters as before
6. A `mana-gas-encounter` CustomEvent fires when a three-color encounter forms
7. Performance remains smooth (no perceptible frame drops)

**Tests Included**:
- Playwright: force particle positions to create a three-color cluster, verify encounter event
- Visual verification by tester in headed browser

**Observability Plan**:
- `mana-gas-encounter` CustomEvent with type, name, colors
- Welcome.js listener wires to telemetry span
- Honeycomb query: filter by `mana_gas.encounter.type = 'triple'`

**Risks Reduced**:
- Validates the upgrade/downgrade model before any polish work

**Expected Learning**:
- How often three-color encounters naturally form with 35 particles and current physics
- Whether the bubble size feels right

### Future Arc (if desired): Encounter Telemetry Wiring

Wire the `mana-gas-encounter` event listener in welcome.js to emit telemetry spans. Could also add two-color encounter events for completeness.

### Communication Cadence

Pause for client review after Arc 33 is complete.

---

*Submitted for client review.*
