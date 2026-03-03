# Arc 29: Three-Color Sessions

## Arc Details
- **Type**: User Arc (Session Logic)
- **Version**: v0.24.0
- **Date**: 2026-03-02
- **Status**: COMPLETE — PASS
- **SOW**: sow-wedges-and-shards.md

## Intention
Wire the three-color combo data layer (Arc 28) into active sessions. Users who complete the allied and enemy levels should unlock and be able to practice wedge and shard sessions. No UI changes needed — `renderPips` already handled 3-color combos.

## Observable Outcome
Users can start wedge and shard sessions after completing prior tiers. Honeycomb confirms `card.tier = wedge` and `card.tier = shard` on card spans during three-color sessions.

## What Was Built

### src/session.ts
- `GuildSubgroup` type expanded from `"allied" | "enemy"` to `"allied" | "enemy" | "wedges" | "shards"`
- `createSession` uses a `poolMap` for all 4 tiers — wedges and shards pools draw from the wedges/shards export helpers in combos.ts
- No schema changes needed; the type expansion is backward-compatible

### src/slides.ts
- `session.tier` telemetry attribute emits `wedge` or `shard` (singular, matching the `tier` field in combo data), not `guild_wedges`
- Progression unlock chain extended: allied → enemy → wedges → shards → null

## Team
- **Developer**: Implemented session logic following existing patterns in session.ts and slides.ts
- **Tester**: 24/24 PASS, Honeycomb verified `card.tier = wedge` and `card.tier = shard` on card spans

## Acceptance Criteria — All Met

- [x] `GuildSubgroup` type includes `"wedges"` and `"shards"`
- [x] `createSession` correctly draws cards from wedge and shard pools
- [x] Progression chain: allied → enemy → wedges → shards
- [x] `card.tier = wedge` and `card.tier = shard` visible in Honeycomb
- [x] All existing tests continue to pass (no regressions)

## Test Results
- **Result**: 24/24 PASS
- **Honeycomb verification**: `card.tier = wedge` and `card.tier = shard` confirmed on card spans in sparrow-deck environment

## Key Files Changed
- `src/session.ts` — `GuildSubgroup` type expanded; `createSession` uses `poolMap` for all 4 tiers
- `src/slides.ts` — `session.tier` telemetry uses `wedge`/`shard`; progression chain extended

## Observability
- `card.tier = wedge` and `card.tier = shard` on card spans during three-color sessions
- Confirmed in Honeycomb: sparrow-deck environment
- **Note**: Session root spans don't always arrive in Honeycomb due to a pre-existing flush/navigation timing race. Card child spans confirm telemetry is correct. Not a regression.

## Decisions
- DEC-097: `GuildSubgroup` type expanded in-place rather than renamed
- DEC-098: Progression unlock chain uses a simple linear map: allied → enemy → wedges → shards → null
- DEC-099: `session.tier` telemetry uses `wedge`/`shard` (singular), not `guild_wedges`

## Commits
- `eabb95d`: Implementation (session.ts, slides.ts)
