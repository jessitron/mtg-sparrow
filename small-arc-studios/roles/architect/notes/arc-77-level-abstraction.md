# Arc 77 — Level Abstraction Design

**Date:** 2026-04-11  
**Status:** Design complete, ready for implementation

---

## Problem Summary

The 4 levels (allied guilds, enemy guilds, wedges, shards) are represented as parallel hardcoded structures spread across 5 files. Adding a 5th level would require touching all of them. This arc makes the level system data-driven.

---

## The `LevelDefinition` Interface

```typescript
export interface LevelDefinition {
  /** Canonical identifier — used in URLs, localStorage, telemetry */
  id: GuildSubgroup;

  /** Display title shown in level intro and section header (e.g. "Allied Guilds") */
  title: string;

  /** Short descriptor shown in level intro body (e.g. "Allied guilds are pairs...") */
  description: string;

  /** The combo pool — typed to the combo data shape in combos.ts */
  pool: ColorCombo[];

  /**
   * Build the end-page column for this level.
   * Returns [the column element, a clear-hover function].
   * The builder has full control over visualization (pair wheels vs triangle wheels).
   */
  buildColumn: (
    unlocked: boolean,
    onActivate: () => void,
    sectionSpanRef: SpanRef,
    startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
  ) => [HTMLElement, () => void];
}
```

**Notes on field choices:**

- `id` is typed `GuildSubgroup` (see type derivation below). It stays a string literal, not an enum, to stay compatible with URL params, localStorage, and telemetry span attributes without any mapping.
- `title` is used in three places today: `subtitleMap` in `slides.ts`, the `<h2>` in each column builder, and the locked-state button text. The `description` field absorbs the per-level explanation text currently hardcoded inside each builder.
- `pool` replaces both `comboPoolMap` in `slides.ts` and `poolMap` in `session.ts`. The `createSession` pool lookup becomes `LEVELS.find(l => l.id === subgroup)!.pool`.
- `buildColumn` keeps the four existing builder functions as private implementations. They are registered here rather than called by name in `showSessionEndColumns`. No behavior change — just the dispatch mechanism changes.

---

## Where `LEVELS` Lives

**File: `src/levels.ts`** (new file)

This file:
- Imports `alliedGuilds`, `enemyGuilds`, `wedges`, `shards` from `./data/combos`
- Imports the four builder functions from `./ui/guild-columns`
- Exports `LEVELS: LevelDefinition[]` as the canonical ordered array
- Exports `GuildSubgroup` as a derived type (see below)

Why a new file rather than hanging it off an existing one?
- `session.ts` is about runtime session state — importing UI builders there would create a circular dependency (guild-columns imports from session)
- `guild-columns.ts` already imports from session — putting LEVELS there keeps the circular risk alive
- `levels.ts` is a pure data/config file; it sits above session and below UI

The four builder functions stay in `guild-columns.ts` as private (unexported) functions. `levels.ts` imports them. `guild-columns.ts` imports `LEVELS` from `levels.ts` only for the `showSessionEndColumns` dispatcher.

Wait — that's a circular dependency: `levels.ts` imports from `guild-columns.ts`, and `guild-columns.ts` imports from `levels.ts`. **To avoid this:**

**Revised approach:** Keep builder functions in `guild-columns.ts`, unexported. `levels.ts` does NOT import from `guild-columns.ts`. Instead, `showSessionEndColumns` in `guild-columns.ts` builds the LEVELS array internally using an `import` of the combo pools and its own local builder references.

Actually the cleanest resolution: **LEVELS is defined inside `guild-columns.ts`** as a module-level constant, since that's where the builder functions live. Then `slides.ts` and `session.ts` import only what they need from `levels.ts` via a separate small module that re-exports the non-UI parts.

**Final resolution (cleanest):**

Split into two files:
1. **`src/levels.ts`** — contains `LevelDefinition` interface (without `buildColumn`), the non-UI fields, and `GuildSubgroup` derivation. No UI imports.
2. **`src/ui/guild-columns.ts`** — defines a local `UILevelDefinition` that extends `LevelDefinition` with `buildColumn`, builds `UI_LEVELS` internally, and uses it in `showSessionEndColumns`.

This keeps the clean separation: `levels.ts` has no DOM/builder dependencies; `guild-columns.ts` has the full picture for rendering.

**`src/levels.ts` exports:**
```typescript
export interface LevelDefinition {
  id: string;
  title: string;
  description: string;
  pool: ColorCombo[];
}

export const LEVELS: LevelDefinition[] = [
  { id: 'allied', title: 'Allied Guilds', description: 'Allied guilds are pairs of neighboring colors.', pool: alliedGuilds },
  { id: 'enemy',  title: 'Enemy Guilds',  description: 'Enemy guilds pair colors from opposite sides of the circle.', pool: enemyGuilds },
  { id: 'wedges', title: 'Wedges',        description: 'Wedges combine one color with the two across from it.', pool: wedges },
  { id: 'shards', title: 'Shards',        description: 'Shards combine one color with the two on either side.', pool: shards },
];

export type GuildSubgroup = typeof LEVELS[number]['id']; // = string (narrowed below)
```

See the GuildSubgroup section for type narrowing details.

---

## `GuildSubgroup` Type Derivation

Today: `export type GuildSubgroup = "allied" | "enemy" | "wedges" | "shards";` in `session.ts`.

After this arc: derive it from the `LEVELS` array.

The challenge is that `typeof LEVELS[number]['id']` is just `string` unless the array is declared `as const`. But `LEVELS` contains objects with non-literal fields (arrays, etc.), so a full `as const` is impractical.

**Recommended approach:** Keep the union type explicit but move it to `levels.ts` and derive the `LEVELS` array from it:

```typescript
// src/levels.ts

export type GuildSubgroup = 'allied' | 'enemy' | 'wedges' | 'shards';

export interface LevelDefinition {
  id: GuildSubgroup;
  title: string;
  description: string;
  pool: ColorCombo[];
}

export const LEVELS: LevelDefinition[] = [ ... ];
```

This is the right tradeoff: the type is the source of truth; the array is checked against it. If a future arc adds a 5th level, you add to the union AND add an entry to `LEVELS` — and TypeScript will enforce completeness anywhere a `Record<GuildSubgroup, ...>` is used.

Remove `GuildSubgroup` from `session.ts` — it re-exports from `levels.ts`:
```typescript
export type { GuildSubgroup } from './levels';
```
...or importers switch directly to `./levels`. Either works; re-export avoids churn in files that only care about session.

---

## Files That Change and How

### 1. `src/levels.ts` (NEW)

Define `GuildSubgroup`, `LevelDefinition`, and `LEVELS`. Import combo pools. No DOM or builder imports.

### 2. `src/session.ts`

- Remove `GuildSubgroup` definition; import it from `./levels`
- Remove local `poolMap` in `createSession`; replace with `LEVELS.find(l => l.id === subgroup)!.pool`

```typescript
// Before:
const poolMap: Record<GuildSubgroup, typeof alliedGuilds> = {
  allied: alliedGuilds, enemy: enemyGuilds, wedges, shards,
};
const pool = poolMap[subgroup];

// After:
import { LEVELS } from './levels';
const pool = LEVELS.find(l => l.id === subgroup)!.pool;
```

### 3. `src/slides.ts`

- Remove `levelNumberMap`, `subtitleMap`, `comboPoolMap`
- Import `LEVELS` from `./levels`
- In `showLevelIntro`: derive level number from `LEVELS.findIndex(l => l.id === subgroup) + 1`
- Derive subtitle from `level.title`, combo names from `level.pool`
- Remove `nextSubgroupMap` in `navigateToAssessment`; derive next subgroup from LEVELS array order:

```typescript
// Before:
const nextSubgroupMap: Record<GuildSubgroup, GuildSubgroup | null> = {
  allied: 'enemy', enemy: 'wedges', wedges: 'shards', shards: null,
};
const nextSubgroup = nextSubgroupMap[session.subgroup];

// After:
import { LEVELS } from './levels';
const currentIndex = LEVELS.findIndex(l => l.id === session.subgroup);
const nextSubgroup = currentIndex >= 0 && currentIndex < LEVELS.length - 1
  ? LEVELS[currentIndex + 1].id
  : null;
```

### 4. `src/ui/guild-columns.ts`

**The biggest change.** Introduce a local `UILevelDefinition` that adds `buildColumn`:

```typescript
interface UILevelDefinition extends LevelDefinition {
  buildColumn: (
    unlocked: boolean,
    onActivate: () => void,
    sectionSpanRef: SpanRef,
    startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
  ) => [HTMLElement, () => void];
}

const UI_LEVELS: UILevelDefinition[] = [
  { ...LEVELS[0], buildColumn: buildAlliedColumn },
  { ...LEVELS[1], buildColumn: buildEnemyColumn },
  { ...LEVELS[2], buildColumn: buildWedgeColumn },
  { ...LEVELS[3], buildColumn: buildShardColumn },
];
```

**`SECTION_LABELS`**: Currently `['allied', 'enemy', 'wedges', 'shards', 'share']`. Replace with:
```typescript
const SECTION_LABELS = [...UI_LEVELS.map(l => l.id), 'share'];
```

**`showSessionEndColumns`**: Replace 4 named boolean params with a single array:
```typescript
export function showSessionEndColumns(
  app: HTMLElement,
  unlockedSubgroups: Record<GuildSubgroup, boolean>,  // or: boolean[] parallel to UI_LEVELS
  pageSpan: Span,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
  initialSubgroup?: GuildSubgroup,
): () => void
```

Wait — the caller (`end.ts`) currently passes 4 named booleans. Changing the signature here means updating `end.ts` too. Two options:

**Option A:** Use `Record<GuildSubgroup, boolean>` — still requires `end.ts` to build the record.  
**Option B:** Use `boolean[]` parallel to `UI_LEVELS` — couples caller to array order silently.  
**Option C (recommended):** The function derives unlocked status internally from `isSubgroupUnlocked`:

```typescript
export function showSessionEndColumns(
  app: HTMLElement,
  pageSpan: Span,
  startSession: (subgroup: GuildSubgroup, startedFrom: string) => void,
  initialSubgroup?: GuildSubgroup,
): () => void {
  const cols = UI_LEVELS.map(level => {
    const unlocked = isSubgroupUnlocked(level.id);
    // ...
  });
}
```

This eliminates the 4 boolean params entirely, removes duplication between `end.ts` and `guild-columns.ts`, and makes future level additions require zero changes to `end.ts`.

**`initialSubgroup` index lookup**: Replace hardcoded ternary chain with:
```typescript
const initialIndex = initialSubgroup
  ? Math.max(0, UI_LEVELS.findIndex(l => l.id === initialSubgroup))
  : 0;
```

**The per-column `onActivate` closures**: Today each column's `onActivate` clears the others by name. With an array, this becomes:
```typescript
const clearFns: (() => void)[] = new Array(UI_LEVELS.length).fill(() => {});

const cols = UI_LEVELS.map((level, i) => {
  const onActivate = () => clearFns.forEach((fn, j) => { if (j !== i) fn(); });
  const [el, clearFn] = level.buildColumn(unlocked, onActivate, sectionSpanRef, startSession);
  return { el, clearFn };
});

cols.forEach(({ clearFn }, i) => { clearFns[i] = clearFn; });
```

### 5. `src/end.ts`

Remove the 4 named `isSubgroupUnlocked` calls (lines 56-59). Remove the 4 boolean args from `showSessionEndColumns` call. The call becomes simpler:

```typescript
// Before:
const alliedUnlocked = isSubgroupUnlocked('allied');
const enemyUnlocked = isSubgroupUnlocked('enemy');
const wedgesUnlocked = isSubgroupUnlocked('wedges');
const shardsUnlocked = isSubgroupUnlocked('shards');

const endCurrentSection = showSessionEndColumns(
  app, alliedUnlocked, enemyUnlocked, wedgesUnlocked, shardsUnlocked,
  pageSpan, startSession, initialSubgroup,
);

// After:
const endCurrentSection = showSessionEndColumns(
  app, pageSpan, startSession, (subgroup as GuildSubgroup) || undefined,
);
```

Also remove the `import { isSubgroupUnlocked, getUnlockedSubgroups }` — only `getUnlockedSubgroups` remains needed (for the feedback context).

---

## Migration Order

This is a structural refactor — no behavior change — so the order matters for keeping things compilable throughout.

1. **Create `src/levels.ts`** with `GuildSubgroup`, `LevelDefinition`, `LEVELS`. All imports are from `./data/combos`. No other code changes yet.

2. **Update `src/session.ts`**: Remove `GuildSubgroup` definition; re-export from `./levels`. Remove local `poolMap`; use `LEVELS.find`. TypeScript will flag any missed imports of `GuildSubgroup` from session — fix them to import from `./levels` directly, or leave the re-export in place.

3. **Update `src/slides.ts`**: Remove three parallel maps. Import `LEVELS` from `./levels`. Update `showLevelIntro` and `navigateToAssessment`. No interface changes — just internal logic.

4. **Update `src/ui/guild-columns.ts`**: Add `UILevelDefinition`, `UI_LEVELS`, update `SECTION_LABELS`, refactor `showSessionEndColumns` signature (Option C above — pull `isSubgroupUnlocked` calls inside), update the column-building loop.

5. **Update `src/end.ts`**: Remove the 4 unlock checks and boolean args. Update the `showSessionEndColumns` call. Clean up unused imports.

6. **Build and verify**: `npm run build` must pass. Behavior must be identical.

---

## Risks and Edge Cases

### `GuildSubgroup` type proliferation
The type is currently imported from `session.ts` in at least 3 files (`end.ts`, `guild-columns.ts`, `slides.ts`). Moving it to `levels.ts` means updating all those imports. Safest path: add a re-export in `session.ts` for one arc, clean up the re-export in a follow-on arc.

### `buildColumn` in `UILevelDefinition` vs builder function signatures
The builder functions today take `(unlocked, onActivate, sectionSpanRef, startSession)`. If Option C is adopted (unlocked derived internally), the `buildColumn` signature changes too — it no longer accepts `unlocked`. Make sure the internal builders are refactored consistently.

If Option C is too much change at once, adopt it in two steps:
- Arc 77: structural refactor, keep `unlocked` as a param
- Arc 78: pull `isSubgroupUnlocked` calls into `guild-columns.ts`

### The `SECTION_LABELS` array includes `'share'`
The share section is NOT a level and must stay appended separately. The derivation `[...UI_LEVELS.map(l => l.id), 'share']` is correct. Do not accidentally include 'share' in `LEVELS`.

### `ColorCombo` type in `levels.ts`
`LEVELS[n].pool` is typed `ColorCombo[]`. The import chain is `levels.ts → data/combos.ts`. This is fine — `combos.ts` has no UI or session imports.

### `initialSubgroup` from URL as `string`, not `GuildSubgroup`
`end.ts` casts `subgroup as GuildSubgroup`. This cast is unsafe if the URL is manipulated. Not a new problem, but worth noting. A future arc could add validation via `LEVELS.some(l => l.id === subgroup)`.

### `findIndex` returning `-1`
In `slides.ts`, `LEVELS.findIndex(l => l.id === subgroup)` will return -1 for an unknown subgroup. Level number would be 0, which is wrong. Add a guard:
```typescript
const levelIndex = LEVELS.findIndex(l => l.id === subgroup);
const levelNum = levelIndex >= 0 ? levelIndex + 1 : 0;
```
Log an error or fall back gracefully.

---

## What Does NOT Change

- `src/progression.ts` — already string-based, zero changes needed
- The four builder functions (`buildAlliedColumn`, etc.) — stay as private functions in `guild-columns.ts`, just registered rather than called by name
- The share section — stays separate, appended after the level columns
- URL param format (`?subgroup=allied`) — `GuildSubgroup` values are still the same strings
- localStorage keys — `progression.ts` uses arbitrary strings, LEVELS.id values match
- Telemetry attribute names — `session.subgroup` values unchanged
