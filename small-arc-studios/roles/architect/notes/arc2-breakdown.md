# Arc 2 Breakdown — Architecture Notes

> Architect: Small Arc Studio
> Date: 2026-02-15
> Status: Approved structure, updated with client feedback

---

## Context

The original Arc 2 ("Card Data & Deck Logic") bundled:
- 10 guild color combination records (client scoped down from 20)
- Shuffle and tier filtering logic
- Unit tests for data integrity and deck operations
- Version bump to 0.2.0

The client requested this be broken into smaller arcs, each producing observable change.

## Design Considerations

The Designer proposed:
- **Arc 2a**: Render a single card (data model + pip rendering + card layout)
- **Arc 2b**: Cycle through a deck (shuffle + auto-advance iteration)

This split is approved. Here's the architectural reasoning:

### Why this boundary is correct

1. **Arc 2a isolates the hardest visual unknowns.** Mana pip rendering, card layout, and the data-to-DOM pipeline are the riskiest parts of this work. Proving one card renders correctly is a meaningful milestone.

2. **Arc 2b isolates the interaction loop.** Auto-advance timing, shuffle, fixed card count, and card cycling are independent concerns. Separating them means we can tune the timing without re-risking the rendering.

3. **Each arc is independently observable.** A rendered card is visible. Cards cycling is visible. Neither requires the other to demonstrate value.

### Type classification

- **Arc 2a: User arc.** Although it introduces structural data, the observable outcome is user-facing: a card rendered on screen. The data model is a means to that end.
- **Arc 2b: User arc.** The cycling/auto-advance behavior is user-facing interaction.

Both produce version bumps (0.2.0 and 0.3.0) for trace distinguishability.

### What stays out

- Tier selection UI: deferred to a later arc
- "Say it" prompt: deferred to polish
- Early-tap acceleration: included in Arc 2b as part of the interaction loop (it's the only user input during cycling)

### Session model (updated per client feedback)

**Fixed card count, not timer.** Sessions are ~50 cards, sized so that auto-advance pacing (~3.5s per card) fills approximately 3 minutes. Users who tap early see the same number of cards but finish sooner. No countdown timer needed.

This is an important architectural simplification: session length is determined by card count, not elapsed time. The session ends when all cards have been shown.

### Tier structure (updated per client feedback)

The full tier progression is:
1. **Guild subgroup** — a configurable subset of guilds (e.g. 4-5 guilds). Subgroup size is adjustable.
2. **All Guilds** — all 10 two-color guild names
3. **Shards & Wedges** — 5 shards + 5 wedges
4. **All Core** — mixed deck of all 20 combinations

For Arcs 2a/2b, we implement guild data only. The subgroup concept is noted but tier selection UI is deferred.

### Data model scope

We implement all 10 guild records. The data model type supports future tiers (shard, wedge) but only guild records are present. The deck in Arc 2b draws from all 10 guilds (no subgroup filtering yet).

### Interaction model

Per client feedback confirmed by Designer:
- Auto-reveal: pips show for ~2.5s, then name fades in automatically
- Tap/click/spacebar is an optional early-advance accelerator
- No mandatory tap required
- The reveal delay (~2.5s) is a tuning parameter, easily adjustable

### Telemetry notes

- Arc 2a: version marker only (0.2.0). No new spans — just proves rendering works.
- Arc 2b: card spans begin. Each card cycle produces a child span with `card.combo_id`, `card.combo_name`, `card.colors`, `card.dwell_time_ms`, `card.advanced_early`. This is where observability gets interesting — we can start asking "which cards do people tap early on?"

---

## Risk assessment

- **Mana pip rendering** is the biggest visual risk. We need SVG or image assets for the 5 mana symbols. Source: standard community symbols (Scryfall/Gatherer style per DEC-017). Arc 2a resolves this risk.
- **Auto-advance timing** needs to feel right. Arc 2b lets us tune the ~2.5s reveal delay and ~1s name display independently.
- **Fixed card count** is simpler than a timer — no countdown logic, no "finish current card when time runs out" edge case. Session completion is deterministic.

## Deprioritized concerns (per client)

- Bundle size: not a concern
- Timer precision: not applicable (no timer)
