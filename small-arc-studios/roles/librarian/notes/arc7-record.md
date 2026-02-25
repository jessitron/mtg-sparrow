# Arc 7: Guild Subgroups

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 7 |
| **Name** | Guild Subgroups |
| **Type** | User Arc |
| **Target Version** | 0.7.0 |
| **Start Date** | 2026-02-24 |
| **Completion Date** | 2026-02-24 |
| **Status** | COMPLETE |

## Intention

Split the 10 guilds into two subgroups of 5 using the natural MTG allied/enemy distinction. The allied subgroup (colors adjacent on the color wheel) becomes the default starting experience. After a session, the user can navigate to either subgroup from the end screen. This reduces initial cognitive load and respects the Sparrow Deck progressive exposure model.

## Observable Outcome

The app now starts every new user on the allied guild subgroup (5 cards: Azorius, Dimir, Rakdos, Gruul, Selesnya). After a session ends and the user completes self-assessment and reviews the combo summary, a new section appears with a contextual label and two buttons — one for allied guilds, one for enemy guilds — allowing one-tap navigation to either subgroup. The session trace in Honeycomb records `session.tier` as `'guild_allied'` or `'guild_enemy'`, `session.subgroup_size = 5`, and (for sessions started from the end screen) `session.started_from = 'session_end_screen'`.

## Acceptance Criteria

- [x] App starts on allied guild subgroup by default — **PASS**
- [x] Version footer shows v0.7.0 — **PASS**
- [x] Session uses only 5 allied guild cards (Azorius, Dimir, Rakdos, Gruul, Selesnya) — **PASS**
- [x] No enemy guild cards appear during an allied session — **PASS**
- [x] After self-assessment and combo summary, a divider and label appear — **PASS**
- [x] Label reads "You practiced allied guilds." for allied session — **PASS**
- [x] Label reads "You practiced enemy guilds." for enemy session — **PASS**
- [x] Two subgroup buttons appear: "Allied guilds" and "Enemy guilds" — **PASS**
- [x] The other subgroup button is styled as primary (accent border `#6666aa`) — **PASS**
- [x] The current subgroup button is styled as secondary — **PASS**
- [x] Clicking "Enemy guilds" button starts an enemy session — **PASS**
- [x] Enemy session uses only 5 enemy guild cards (Orzhov, Izzet, Golgari, Boros, Simic) — **PASS**
- [x] Session started from end screen has `session.started_from = 'session_end_screen'` — **PASS**
- [x] `session.tier` emits `'guild_allied'` for allied sessions — **PASS**
- [x] `session.tier` emits `'guild_enemy'` for enemy sessions — **PASS**
- [x] `session.subgroup_size = 5` on all guild sessions — **PASS**
- [x] `APP_VERSION` constant is `'0.7.0'` — **PASS**
- [x] `service.version` in telemetry init is `'0.7.0'` — **PASS**
- [x] `alliedGuilds` and `enemyGuilds` exported from `combos.ts` — **PASS**
- [x] `subgroup` field on `ColorCombo` type is `"allied" | "enemy"` — **PASS**
- [x] All 10 guilds tagged with correct subgroup — **PASS**
- [x] Welcome screen still shows and "Learn guild names" button starts allied session — **PASS**
- [x] Pause and Stop buttons work during subgroup sessions — **PASS**
- [x] Self-assessment works after subgroup sessions — **PASS**
- [x] Combo summary shows only the 5 cards practiced — **PASS**

**Full verification**: 46/46 checks PASS

## Key Decisions Made During Arc 7

- **DEC-034 implemented**: Guild subgroup split confirmed as Azorius/Dimir/Rakdos/Gruul/Selesnya (allied) and Orzhov/Izzet/Golgari/Boros/Simic (enemy). Grouping in the original DEC-034 approval text contained errors (Golgari/Boros listed as allied; Rakdos/Selesnya as enemy); implementation used the standard MTG definition and the decision log was corrected.
- **DEC-036**: Session end screen navigation design — two subgroup buttons with the other subgroup as primary, carrying `session.started_from = 'session_end_screen'` telemetry.

## Implementation Notes

### Data model (`src/data/combos.ts`)
- Added `subgroup?: "allied" | "enemy"` to the `ColorCombo` interface
- All 10 guild records tagged with their subgroup
- Exported `alliedGuilds` and `enemyGuilds` as derived filtered arrays

### Session creation (`src/session.ts`)
- `createSession(subgroup: GuildSubgroup = "allied")` accepts subgroup parameter
- Defaults to `"allied"` — no callers need to change for the welcome screen flow
- `SessionState` carries `.subgroup` field
- Pool for deck building filters to the relevant 5 guilds

### Session end screen (`src/main.ts`)
- After self-assessment and combo summary, `showSubgroupNav()` appends a `<div class="subgroup-nav">` section
- The section includes a `<p>` contextual label and two `<button>` elements
- Subgroups ordered: other (primary) first, current (secondary) second
- Primary button styled with CSS class `subgroup-btn--primary` and inline `border-color: #6666aa`
- Button click calls `startSession(sg, 'session_end_screen')` — a clean two-argument call

### Telemetry (`src/main.ts`, `src/telemetry/telemetry.ts`)
- `session.tier` now emits `'guild_allied'` or `'guild_enemy'` (was `'guild'`)
- `session.subgroup_size = 5` added as a fixed attribute on guild sessions
- `session.started_from` extended: `'session_end_screen'` joins `'welcome_screen'` as a known value

### Version
- `APP_VERSION` constant: `'0.7.0'`
- Footer `<span>` updated to `v0.7.0`
- `service.version` in `src/telemetry/init.ts`: `'0.7.0'`

## Verification

- **Verification by**: Tester (2026-02-24)
- **Result**: 46/46 browser checks PASS
- **Test script**: `scripts/test-v0.7.0.mjs` (Playwright)
- **Screenshots**: `scripts/` directory

## Honeycomb Data

- **`session.tier`**: `'guild_allied'` or `'guild_enemy'` — set in `startSession()` span attributes
- **`session.subgroup_size`**: `5` — fixed attribute on all guild subgroup sessions
- **`session.started_from`**: `'welcome_screen'` or `'session_end_screen'`
- **`service.version`**: `'0.7.0'` — confirmed in build output and footer

## Known Constraints

- **Honeycomb MCP inaccessible**: Local MCP connects to Honeycomb demo team. Cannot query sparrow-deck traces via MCP. Attribute presence verified by code inspection and test script.

## Learning Captured

- **Correct grouping matters**: The DEC-034 approval text had incorrect allied/enemy assignments. The implementation team applied the correct MTG standard (adjacent on color wheel = allied) and updated the record. Decision logs must reflect what was actually built, not only what was originally discussed.
- **Default parameters are powerful**: `createSession(subgroup = "allied")` meant all existing callers required no changes. Progressive enhancement through defaults kept the diff minimal.
- **End screen navigation is light**: The subgroup navigation section is ~30 lines of DOM construction in `showSubgroupNav()`. Keeping it as a separate function keeps `showSessionEndScreen()` readable.
- **`session.started_from` pays off**: Established in DEC-032 for the welcome screen, this attribute now captures a second entry point with zero additional design cost. Forward-looking telemetry attributes have compounding value.

## Outcome

Arc 7 delivered successfully. All 46 acceptance criteria satisfied.

**What was delivered:**
- Allied/enemy guild subgroup data model with `alliedGuilds` and `enemyGuilds` exports
- Default session starts with allied guilds (5 cards)
- Session end screen navigation with two subgroup buttons
- `session.tier` emits `'guild_allied'` or `'guild_enemy'`
- `session.subgroup_size = 5` on all guild sessions
- `session.started_from = 'session_end_screen'` for end-screen-initiated sessions
- Version bumped to 0.7.0

**Next arc candidates:**
- Arc 8: Card Images — replace/augment mana pips with real Magic card art (DEC-035)
- All Guilds tier — unlock all 10 guilds after completing both subgroups
- Settings page with localStorage reset (DEC-025)
- GitHub Pages deployment (DEC-007)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
