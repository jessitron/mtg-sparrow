# Arc 2a: Render a Single Card

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 2a |
| **Name** | Render a Single Card |
| **Type** | User |
| **Target Version** | 0.2.0 |
| **Start Date** | 2026-02-16 |
| **Completion Date** | 2026-02-16 |
| **Status** | COMPLETE |

## Intention

Prove the data-to-DOM rendering pipeline by displaying a single guild card with correct mana pip symbols and combination name. Resolve the biggest visual risk.

## Observable Outcome

A page displays a single guild card showing mana pip symbols (e.g., White and Blue pips for Azorius) with the combination name visible. Clicking cycles through all 10 guilds. The card looks like a card.

## Acceptance Criteria

- [x] Guild data model implemented: all 10 two-color guild records with `id`, `name`, `colors`, `tier` -- **PASS** (Tester verified)
- [x] Data model type supports future tiers (`"guild" | "shard" | "wedge"`) but only guild records present -- **PASS** (Tester verified)
- [x] Mana pip symbols render correctly for all 5 colors (W, U, B, R, G) using standard community symbols -- **PASS** (Tester verified)
- [x] A single card displays: mana pips (large, centered) with combination name -- **PASS** (Tester verified)
- [x] Card has a visible container (rounded rectangle, dark background, contrast for all pip colors) -- **PASS** (Tester verified: `#2a2a3e`, `border-radius: 16px`)
- [x] Pips displayed in WUBRG order for each combination -- **PASS** (Tester verified: follows MTG color wheel convention)
- [x] `APP_VERSION = "0.2.0"` in footer and spans -- **PASS** (Tester verified in UI and Honeycomb)
- [x] All 10 guild cards render correctly (verified by cycling through them manually or via test) -- **PASS** (Playwright test cycles all 10)

## Risks Reduced

- Mana pip rendering risk -- eliminated (SVG inline symbols for all 5 colors proven)
- Data model proven (typed for future tiers, guild data complete)
- Card layout validated (dark container with good contrast for all pip colors)

## Key Files

- `src/data/combos.ts` -- `ColorCombo` type and 10 guild records
- `src/ui/pips.ts` -- SVG pip rendering for W, U, B, R, G
- `src/ui/render.ts` -- Card DOM assembly (pips + name)
- `src/main.ts` -- App entry, version 0.2.0, click-to-cycle through guilds

## Implementation Notes

- **Mana pip approach**: Inline SVG elements (60x60 viewBox) with distinct symbols per color. Each pip has a colored circle background with a symbolic shape inside (sun for W, droplet for U, skull for B, flame for R, tree for G).
- **Card interaction**: Click cycles to next guild using modulo arithmetic on array index. Random start index on page load.
- **No new spans**: Arc 2a adds no new span types beyond the existing `app.startup`. Version marker updated to 0.2.0 is the observability change.

## Key Decisions Made During Arc 2a

No new decisions. This arc followed the plan established in DEC-006 (vanilla TS), DEC-017 (standard community mana symbols), and DEC-026 (guilds data only).

## Verification

- **Code/behavior verification by**: Tester (2026-02-16)
- **Honeycomb verification by**: Tester (2026-02-16)
- **Result**: All 8 acceptance criteria PASS.
- **Full report**: `small-arc-studios/roles/tester/notes/arc2a-verification.md`
- **Test script**: `scripts/test-arc2a.mjs` (Playwright, clicks through all 10 guilds)

## Learning Captured

- **Mana pip asset format**: Inline SVG works well. No need for external image files. Each color is a distinct shape, not just a colored circle.
- **Auto-instrumentations**: Honeycomb Web SDK produces TTFB and FCP spans even with `instrumentations: []`. These are not harmful but are unexpected. Worth noting for the Observability Engineer.
- **Span flush timing**: Headless Playwright browsers need ~10s delay before close for the Honeycomb SDK to flush spans. A dedicated script (`scripts/send-spans-arc2a.mjs`) was created for reliable span generation.
- **Color ordering**: Guild color pairs follow MTG color wheel convention (clockwise), which is the correct community standard. No WUBRG sorting needed -- the data is already in canonical order.

## Outcome

Arc 2a delivered successfully. All acceptance criteria satisfied.

**What was established:**
- Data model (`ColorCombo` type) with all 10 guild records, typed for future tier expansion
- SVG mana pip rendering for all 5 MTG colors
- Card component with dark container, centered pips, and name display
- Click-to-cycle interaction for browsing all guilds
- Version bumped to 0.2.0, confirmed in UI and Honeycomb spans

**Risks reduced:**
- Mana pip rendering -- eliminated
- Data-to-DOM pipeline -- proven
- Card layout contrast -- validated for all 5 pip colors

**Next arc:** Arc 2b -- Cycle Through a Deck (v0.3.0)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
