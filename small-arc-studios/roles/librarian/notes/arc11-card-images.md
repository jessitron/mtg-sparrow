# Arc 11: Card Images on Slides

**Status:** Complete — verified by Tester, 18/18 checks pass

**Version:** 0.10.0

**Completed:** 2026-02-27

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

## Implementation Record

### What was built
- `CardReference` type added to `src/data/combos.ts` with `name` and `imageUrl` fields
- 10 cards per allied guild embedded in the guild data (50 total card references)
- `Slide` type in `src/session.ts` extends `ColorCombo` with optional `selectedCard`; random card chosen at deck-build time
- Two-column CSS grid layout in `.card--with-image`: card image left (180px), quiz content right
- Responsive: stacks vertically at 500px breakpoint
- `#app` max-width increased from 600px to 700px to accommodate side-by-side layout
- `slide.card_name` telemetry attribute on card spans
- `img.alt=""` — card name intentionally not exposed as visible text (card is the lesson, not the name)
- Enemy guild slides untouched — no `selectedCard` means original single-column layout

### Verification
- Tester: 18/18 Playwright E2E checks pass across 4 phases (allied before reveal, after reveal, enemy no-image, multiple consecutive slides)
- Screenshots captured: `tests/arc11-before-reveal.png`, `tests/arc11-after-reveal.png`, `tests/arc11-enemy-guild.png`
- Test script: `tests/test-arc11-card-images.mjs`
- Telemetry: `slide.card_name` confirmed in source; traces sent to Honeycomb during test runs

### Decisions made during implementation
- DEC-036: Card image `alt` set to empty string — the card art is supplementary learning material, not a label. The card name must not appear as text anywhere on the slide.
- DEC-037: Random card selection happens at deck-build time (not render time) — ensures the same slide always shows the same card image across pause/resume.
- DEC-038: `#app` max-width bumped to 700px (from 600px) to give the side-by-side layout enough room.

### Observations
- Scryfall images load from external CDN — there may be a brief flash before the image appears, especially on slow connections. Acceptable for now; could add a placeholder/skeleton in a future arc.
- Mobile stacking verified via CSS inspection but not via E2E at a mobile viewport. Acceptable gap — layout is pure CSS grid.

### Next arc candidates
- Card images for enemy guilds (requires card research for enemy guilds)
- Settings page enhancements (DEC-025)
- Loading/skeleton states for card images
- Answer buttons / interactive quiz mode
