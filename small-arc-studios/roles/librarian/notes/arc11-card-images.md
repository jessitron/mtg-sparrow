# Arc 11: Card Images on Slides

**Status:** Approved by client, ready for implementation

**Type:** User Arc

## Intention

Teach players to visually recognize guild cards alongside mana color symbols. The card image is part of the learning — not a reward or decoration.

## Observable Outcome

Each quiz slide displays a random representative card image on the left, with the existing mana symbols and answer buttons on the right. The card is visible from the moment the slide appears.

## Acceptance Criteria

- Card image appears on the left of each slide, from the start of the slide
- One random card selected from the guild's 10-card pool per slide
- Mana symbols, answer buttons, and guild name reveal remain unchanged on the right
- No card name displayed anywhere
- Responsive: stacks vertically on mobile
- Card images load from Scryfall URLs
- Only allied guilds have cards for now (existing guilds without card data continue working as before)

## Observability Plan

- Trace attribute: `slide.card_name` on slide events so we can see which cards are being shown
- Queryable in Honeycomb: which cards appear most/least frequently

## Tests

- E2E: slide renders with a card image visible
- E2E: card image is present before answering

## Design Decision

- Layout: Option A (side-by-side) — card on left, quiz content on right
- Designer mockup: `small-arc-studios/roles/designer/notes/mockups/option-a-side-by-side.html`
- Client explicitly chose this over reveal-as-reward (Option D) because the card IS the lesson

## Card Data

- 10 cards per allied guild selected and approved by client
- Card list: `small-arc-studios/roles/domain-expert/notes/allied-guild-cards.md`
- Allied guilds only: Azorius (WU), Dimir (UB), Rakdos (BR), Gruul (RG), Selesnya (GW)
- Client revisions applied:
  - No split/room cards (they display sideways)
  - Max 2 cards per guild with the guild name in the card name
