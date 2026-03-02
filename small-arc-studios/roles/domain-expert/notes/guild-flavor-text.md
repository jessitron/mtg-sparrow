# Guild Flavor Text Research

Research date: 2026-03-02
Sources:
- https://magic.wizards.com/en/news/feature/flavorful-guide-guilds-ravnica-2018-10-03
- https://magic.wizards.com/en/news/feature/flavorful-guide-guilds-ravnica-allegiance-2019-02-07
- Prior domain research in ravnica-guilds.md and allied/enemy-guild-cards.md

## Deliverable

Guild descriptions written to `src/data/guild-descriptions.ts` as a typed TypeScript data structure.

The file exports:
- `GuildDescription` type: `{ id, description, scryfallUrl }`
- `guildDescriptions` array: all 10 guilds in allied/enemy order (matching combos.ts ordering)
- `guildDescriptionMap` record: keyed by guild id for easy lookup

## Writing Principles Applied

- Focus on philosophy, worldview, adjectives — not lore events or named characters
- 3–5 sentences per guild: punchy and evocative
- Each description captures the *feel* of the guild, what they believe, and their personality
- Descriptions written from the inside (how they see themselves) with slight ironic distance

## Scryfall URL Pattern

Format: `https://scryfall.com/search?q=c%3D{colors}+-is%3Aub`
- `c%3D` = color exactly equals
- `+-is%3Aub` = exclude Universes Beyond
- Color codes: w (white), u (blue), b (black), r (red), g (green)

| Guild    | Colors | URL param |
|----------|--------|-----------|
| Azorius  | W/U    | wu        |
| Dimir    | U/B    | ub        |
| Rakdos   | B/R    | br        |
| Gruul    | R/G    | rg        |
| Selesnya | G/W    | gw        |
| Orzhov   | W/B    | wb        |
| Izzet    | U/R    | ur        |
| Golgari  | B/G    | bg        |
| Boros    | R/W    | rw        |
| Simic    | G/U    | gu        |

## Iconic Cards — Assessment

The existing card lists in `src/data/combos.ts` are comprehensive. No critical gaps found.
Notable observations:
- **Azorius**: Could add Azor, the Lawbringer (the sphinx who founded the guild) — not currently listed
- **Selesnya**: Could add Voice of Resurgence (iconic, powerful token maker) — not currently listed
- **Golgari**: Could add Savra, Queen of the Golgari (original guild leader from Ravnica: City of Guilds block)

These are optional enhancements; the developer should decide if adding cards is in scope for Arc 23.
