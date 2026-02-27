# Arc 12: Card Images for Enemy Guilds

**Status:** In progress

**Type:** User Arc

## Intention

Extend the card image learning experience to enemy guilds. Players should see representative card art for enemy guild slides, just as they do for allied guilds.

## Observable Outcome

Enemy guild quiz slides display a random representative card image on the left, matching the existing allied guild behavior from Arc 11.

## Acceptance Criteria

- 10 representative cards selected per enemy guild (Orzhov WB, Izzet UR, Golgari BG, Boros RW, Simic GU)
- Card selection follows same criteria as allied guilds: iconic, Ravnica set origin, mechanically relevant, recognizable
- Client revisions from Arc 11 apply: no split/room cards, max 2 cards per guild with the guild name in the card name
- Card images appear on enemy guild slides in the same side-by-side layout
- `slide.card_name` telemetry works for enemy guild cards
- Allied guild behavior unchanged

## Observability Plan

- Same as Arc 11: `slide.card_name` attribute on card spans (already implemented, just needs data)

## Tests

- E2E: enemy guild slide renders with a card image visible
