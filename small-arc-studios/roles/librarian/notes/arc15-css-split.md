# Arc 15: CSS Split into Per-Page Stylesheets

**Status:** Complete — verified by Tester, Playwright 23/23 PASS

**Version:** 0.13.0

**Completed:** 2026-03-01

**Type:** Structural Arc

## Intention

Split the monolithic `style.css` into five per-page stylesheets as groundwork for multi-page decomposition. Remove dead CSS discovered during the split. Add `css.split = true` structural marker to the `app.startup` span so operators can confirm the new CSS loading strategy is in effect.

This arc implements DEC-057 (CSS split decision) and produces DEC-058 (dead CSS cleanup).

## Observable Outcome

Five CSS files replace the monolith:
- `style.css` — shared/global rules (reset, layout, mana symbols, settings panel, gas buttons)
- `welcome.css` — welcome screen styles
- `slides.css` — card/quiz screen styles (flashcard, done zone, progress counter, done button)
- `assessment.css` — self-assessment screen styles
- `end.css` — session-end screen styles (guild columns, color wheel, progression)

Structural marker `css.split = 'true'` on `app.startup` span confirms the new loading strategy.

## Acceptance Criteria

- All 5 CSS files load HTTP 200 when the app starts ✓
- Welcome, card/quiz, and end screens render correctly ✓
- Settings panel shows v0.13.0 ✓
- Bundle contains `css.split` telemetry marker ✓
- No visual or behavioral regressions ✓

## Implementation

### CSS Split
- `style.css` — shared rules only (variables, reset, fonts, body, #app, #gas, footer, settings panel, gas buttons, @keyframes cardEnter)
- `welcome.css` — 7 rules for welcome screen
- `slides.css` — card/quiz/done-zone rules, @keyframes buttonFadeIn, all `#app.app--quiz-active` overrides (consolidated from 3 separate blocks)
- `assessment.css` — 6 self-assessment rules
- `end.css` — guild columns, color wheels, session-end, combo-summary-pips/name, next-session-button (consolidated 2x `.guild-column-item` into one block)
- `card-back.css` — standalone demo file, left alone

### Dead CSS Removed (8 rules)
- `.combo-summary` — earlier session-end design, replaced by guild columns
- `.combo-summary-heading` — same
- `.combo-summary-list` — same
- `.combo-summary-item` — same
- `.session-next-divider` — earlier "next session" navigation block
- `.session-next` — same
- `.session-next-label` — same
- `.session-next-buttons` — same
- Note: `.combo-summary-pips` and `.combo-summary-name` were kept (used inside guild column items)

### Consolidation During Split
- `#app.app--quiz-active`: was 3 separate locations in `style.css` → consolidated into one block in `slides.css`
- `.guild-column-item`: appeared twice → deduplicated in `end.css`

### Structural Marker
- `css.split: 'true'` added to `app.startup` span in `src/telemetry/telemetry.ts`

### APP_VERSION
- Bumped from `0.12.0` to `0.13.0`

## Commits

- `e37b582` — Arc 15: Architect CSS split plan — rule-by-rule mapping with dead CSS analysis
- `d98a2ea` — Arc 15: Split CSS into per-page stylesheets
- `4780bbe` — Arc 15: Link per-page stylesheets from index.html
- `34a91dd` — Arc 15: Bump version to 0.13.0 and add css.split marker
- `650bddc` — Arc 15: Add Playwright verification test for CSS split
- `04a8546` — Arc 15: Tester verification notes — 23/23 pass

## Verification

### Playwright Tests
- 23/23 checks PASS
- All 5 CSS files load HTTP 200, welcome/card/end screens render, settings shows v0.13.0, bundle confirms telemetry markers
- Visual parity confirmed — app looks and behaves identically to before the split

### Observability
- Bundle inspection confirms `css.split` attribute is correctly coded
- Runtime Honeycomb confirmation pending deployment (known flush-timing limitation with headless browser tests — same as Arc 14)

### Tester Notes
- `small-arc-studios/roles/tester/notes/arc15-css-split-verification.md`

## Known Issues

**Flush-timing limitation** — Playwright headless browser closes before OTel batch timer (~30s) fires, so no v0.13.0 spans in Honeycomb yet from tests. Will appear naturally once deployed app is used. Same limitation noted in Arc 14.

## Next Arc

**Arc 16** — Extract modules from main.ts into src/ui/ modules
