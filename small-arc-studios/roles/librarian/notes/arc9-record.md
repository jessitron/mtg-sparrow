# Arc 9: Enemy Color Wheel (Star Pattern)

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 9 |
| **Name** | Enemy Color Wheel (Star Pattern) |
| **Type** | User Arc |
| **Target Version** | 0.8.0 (unchanged) |
| **Start Date** | 2026-02-25 |
| **Completion Date** | 2026-02-25 |
| **Status** | COMPLETE |

## Intention

Add an interactive SVG color wheel to the unlocked enemy guild column, showing the star pattern formed by non-adjacent color connections (W↔B, U↔R, B↔G, R↔W, G↔U). Refactor the allied wheel code into shared generic functions to eliminate duplication. Gate the enemy column content on any enemy practice — including sessions stopped early — rather than requiring a completed session.

## Observable Outcome

After unlocking the enemy column (or after stopping an enemy session early), the enemy guilds column shows the same structure as the allied column: header, educational text, an SVG star-pattern color wheel, and a guild list with bidirectional hover. The enemy wheel's star lines connect non-adjacent colors. CSS custom properties (`--allied-line-color`, `--enemy-line-color`) allow visual differentiation of the two wheel styles in future arcs.

## Acceptance Criteria

All 130/130 Playwright checks passed.

- Enemy column shows color wheel when enemy content is visible
- Enemy wheel renders star-pattern lines (W↔B, U↔R, B↔G, R↔W, G↔U)
- Bidirectional hover works between enemy wheel and enemy guild list
- Allied wheel continues to function correctly after refactor
- Enemy column content visible after stopping an enemy session early
- `--allied-line-color` and `--enemy-line-color` CSS custom properties present
- `npm test` and `npm run typecheck` scripts available in package.json

## Key Decisions Made During Arc 9

- **DEC-043 implemented**: Refactored allied wheel code into generic shared `buildColorWheel()` and `wireColorWheelHover()` functions rather than duplicating for the enemy wheel.
- **DEC-044 implemented**: CSS custom properties `--allied-line-color` and `--enemy-line-color` introduced; both currently `#c8b88a`, ready for future visual differentiation.
- **DEC-045 implemented**: Enemy column content gated on `hasCompletedSubgroup('enemy') || isEnemyUnlocked()` — stopping early counts as having practiced; user need not complete a full session to see the enemy wheel.
- **DEC-046 implemented**: Build system confirmed as esbuild — do not migrate to vite.

## Files Involved

- `src/main.ts` — `buildColorWheel()` and `wireColorWheelHover()` generalized; `colorPairToGuildId` extended to include enemy guild IDs; enemy wheel construction and wiring added; enemy column content gate updated
- `style.css` — `--allied-line-color` and `--enemy-line-color` CSS custom properties added
- `package.json` — `npm test` and `npm run typecheck` scripts added

## Implementation Notes

### Refactor: generic color wheel functions (`src/main.ts`)

`buildColorWheel(pairs, lineColor)` and `wireColorWheelHover(svg, guildListEl)` replace the allied-specific wheel builder. Both functions accept the edge set (either `alliedPairs` or `enemyPairs`) and operate identically for both wheels. The caller provides the edge definitions and a line color; the functions handle SVG construction and event wiring.

### Enemy pair definitions (`src/main.ts`)

```ts
const enemyPairs = [
  { a: 'W', b: 'B', guild: 'orzhov' },
  { a: 'U', b: 'R', guild: 'izzet' },
  { a: 'B', b: 'G', guild: 'golgari' },
  { a: 'R', b: 'W', guild: 'boros' },
  { a: 'G', b: 'U', guild: 'simic' },
];
```

Star lines skip the adjacent vertex, connecting the non-adjacent color pairs that define enemy guild relationships.

### `colorPairToGuildId` extension (`src/main.ts`)

The lookup map was extended to cover all 10 guilds (5 allied + 5 enemy), enabling the generic hover wiring to resolve guild names for both wheel types.

### Enemy column content gate (`src/main.ts`)

Previously: `isEnemyUnlocked()` (required completing a full enemy session).
Now: `hasCompletedSubgroup('enemy') || isEnemyUnlocked()` — stopping an enemy session early marks the subgroup as started/practiced, making the wheel visible on return.

### CSS custom properties (`style.css`)

```css
:root {
  --allied-line-color: #c8b88a;
  --enemy-line-color: #c8b88a;
}
```

Both properties are plumbed through to `buildColorWheel()`. Setting them to different values in a future arc will visually distinguish the allied pentagon from the enemy star without touching JavaScript.

### `package.json` scripts

`npm test` (runs the Playwright test suite) and `npm run typecheck` added as convenience aliases alongside the existing `scripts/` shell scripts. No change to build tooling.

## Observability

No new telemetry spans introduced in this arc. The enemy wheel is a UI addition. The existing `session.enemy_unlocked` boolean and `hasCompletedSubgroup` localStorage state already provide the behavioral signal for when the enemy content becomes visible.

## Verification

- **Verification by**: Tester (2026-02-25)
- **Result**: 130/130 browser checks PASS
- **Test script**: `scripts/test-arc9-enemy-wheel.mjs` (Playwright)

## Learning Captured

- **Generic functions over duplication**: The allied wheel code was already written. The refactor into `buildColorWheel()` and `wireColorWheelHover()` took only modest effort and eliminates the maintenance burden of two near-identical implementations. Duplication is a debt; the refactor paid it immediately.
- **CSS custom properties as a future seam**: Introducing `--allied-line-color` and `--enemy-line-color` costs nothing now and creates a clean visual differentiation hook. The next arc can change the enemy star to a distinct color with a one-line CSS change.
- **Progressive content gating**: The original enemy unlock gate (requiring a completed session) was strict by design — to preserve the progressive disclosure of Arc 8. Arc 9 loosened it to "any enemy practice" because by the time a user sees the enemy wheel, they understand the structure. Stopping early still counts as having encountered the content.
- **Star topology is visually distinct from pentagon**: The enemy star diagonals (non-adjacent connections) are geometrically distinct from the allied pentagon edges. No additional styling differentiation was needed to communicate the structural difference; the topology itself carries the information.

## Outcome

Arc 9 delivered successfully. All 130 acceptance criteria satisfied.

**What was delivered:**
- Enemy SVG color wheel with star-pattern lines in the enemy guilds column
- Generic `buildColorWheel()` and `wireColorWheelHover()` shared by both allied and enemy wheels
- `colorPairToGuildId` extended to cover all 10 guilds
- `--allied-line-color` and `--enemy-line-color` CSS custom properties
- Enemy column content visible after any enemy practice (including stopped sessions)
- `npm test` and `npm run typecheck` convenience scripts in package.json

**Version**: 0.8.0 (no structural version bump — UI addition only)

**Next arc candidates:**
- Card Images (DEC-035) — replace/augment mana pips with real Magic card art
- Settings page with localStorage reset (DEC-025)
- Visual differentiation of allied vs enemy wheel lines (follow-on to DEC-044)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
