# Arc 23: Guild Flavor Text & Card Additions

## Arc Details
- **Type**: User Arc
- **Version**: v0.21.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS

## Intention
Add rich, flavorful descriptions for all 10 guilds and wire them into the flavor panel. Add Scryfall links and iconic cards.

## Observable Outcome
Highlighting any guild on the color wheel or list shows a compelling description of that guild's philosophy and personality. Each description includes a "More [Guild] cards →" Scryfall link. Three iconic cards added to guild card lists.

## Acceptance Criteria — All Met

- [x] All 10 guilds have flavor descriptions (philosophy, personality, what they value)
- [x] Flavor panel shows full description on guild highlight (name → description → Scryfall link → Practice button)
- [x] Each description includes a Scryfall link to that guild's cards
- [x] Azor added to Azorius, Voice of Resurgence to Selesnya, Savra to Golgari (Aurelia already in Boros)
- [x] Descriptions are engaging but concise — capture the feel, not the lore
- [x] Works on mobile

## Test Results
- **Test script**: `tests/arc23-guild-flavor-text.mjs`
- **Result**: 36/36 PASS

## Key Files Changed
- `src/data/guild-descriptions.ts` — guild flavor descriptions and Scryfall links (created in Arc 22 parallel work)
- `src/ui/guild-columns.ts` — flavor panel wired to show description and Scryfall link on highlight
- `src/data/combos.ts` — Azor, Voice of Resurgence, Savra added to guild card lists

## Observability
- `end.guild_highlight` span with `guild.id` — fires when a guild is highlighted
- `end.scryfall_click` span with `guild.id` — fires when the Scryfall link is clicked
- Both confirmed in Honeycomb
- Queryable: "Which guilds do people explore most on the end screen?"

## Decisions
- DEC-078: Flavor panel layout order: guild name → description → Scryfall link → Practice button
- DEC-079: Telemetry spans for guild interaction: `end.guild_highlight` and `end.scryfall_click` with `guild.id`
- DEC-080: Three iconic cards added (Azor, Voice of Resurgence, Savra); Aurelia already present

---

## SOW Completion: End Screen Refinements — CLOSED

Arc 23 is the FINAL arc of the End Screen Refinements SOW (Arcs 22–23).

### SOW Success Criteria — All Met
- [x] End screen renders completed levels as full-width rows (Arc 22)
- [x] Color wheel is prominently centered with more space (Arc 22)
- [x] Highlighting a guild shows its flavor description in the flavor panel (Arc 23)
- [x] Each guild description includes a Scryfall link (Arc 23)
- [x] Works well on both desktop and mobile (both arcs)
- [x] Interaction telemetry visible in Honeycomb (Arc 23)

**SOW Status: CLOSED**
