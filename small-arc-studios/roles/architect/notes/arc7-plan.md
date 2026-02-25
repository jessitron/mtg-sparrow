# Arc 7 Implementation Plan: Guild Subgroups

**Target version:** 0.7.0
**Date:** 2026-02-24

---

## Summary of Changes

Arc 7 splits the 10 guilds into allied and enemy subgroups. Sessions default to 5 guilds. The welcome screen defaults to allied. The session end screen offers two buttons to start another session from either subgroup.

---

## File-by-File Breakdown

### 1. `src/data/combos.ts`

**Change:** Add a `subgroup` field to `ColorCombo` type and tag each guild.

```ts
export type ColorCombo = {
  id: string;
  name: string;
  colors: string[];
  tier: "guild" | "shard" | "wedge";
  subgroup?: "allied" | "enemy";  // only present on guilds
};
```

Tag each guild entry:
- `azorius, dimir, rakdos, gruul, selesnya` → `subgroup: "allied"`
- `orzhov, izzet, golgari, boros, simic` → `subgroup: "enemy"`

Export two derived arrays for convenience:

```ts
export const alliedGuilds = guilds.filter(g => g.subgroup === "allied");
export const enemyGuilds  = guilds.filter(g => g.subgroup === "enemy");
```

**Why filtered arrays and not inline literals?** Keeps guilds as a single source of truth. Derived arrays are always in sync.

---

### 2. `src/session.ts`

**Change:** Add a `GuildSubgroup` type and update `createSession()` to accept it.

```ts
export type GuildSubgroup = "allied" | "enemy";

export const SESSION_CARD_COUNT = 5;   // changed from 50 to 5
```

Wait — the task says "defaults sessions to 5 guilds." That means 5 guilds in the pool, not 5 cards. Re-read: "defaults to 5 guilds instead of 10." The card count stays 50 — what changes is the source combo pool. Confirm with developer: SESSION_CARD_COUNT stays 50, pool shrinks to 5 guilds per subgroup.

Update `createSession()`:

```ts
import { alliedGuilds, enemyGuilds } from './data/combos';

export function createSession(subgroup: GuildSubgroup = "allied"): SessionState {
  const pool = subgroup === "allied" ? alliedGuilds : enemyGuilds;
  return {
    deck: buildDeck(pool, SESSION_CARD_COUNT),
    cardCount: SESSION_CARD_COUNT,
    currentIndex: 0,
    completed: false,
    startTime: Date.now(),
    subgroup,               // store on state for telemetry access
  };
}
```

Update `SessionState` to include `subgroup`:

```ts
export type SessionState = {
  deck: ColorCombo[];
  cardCount: number;
  currentIndex: number;
  completed: boolean;
  startTime: number;
  subgroup: GuildSubgroup;
};
```

---

### 3. `src/main.ts`

Three areas change:

#### 3a. Version bump

```ts
export const APP_VERSION = '0.7.0';
```

#### 3b. Session telemetry

In `startSession(subgroup: GuildSubgroup)`, update the session span:

```ts
sessionSpan = startSpan('session', {
  'session.tier': subgroup === "allied" ? 'guild_allied' : 'guild_enemy',
  'session.subgroup_size': 5,
  'session.card_count': session.cardCount,
  // ... rest unchanged
});
```

#### 3c. `startSession()` signature

```ts
function startSession(subgroup: GuildSubgroup = "allied"): void {
  session = createSession(subgroup);
  // ...
}
```

The welcome screen button already calls `startSession()` with no args — default covers it.

#### 3d. Session end screen — "next session" buttons

After `showComboSummary()` is called (inside the self-assessment click handler), append a button row:

```ts
function showNextSessionButtons(container: HTMLElement): void {
  const row = document.createElement('div');
  row.classList.add('next-session-buttons');

  for (const sg of ['allied', 'enemy'] as GuildSubgroup[]) {
    const btn = document.createElement('button');
    btn.classList.add('next-session-button');
    btn.textContent = sg === 'allied' ? 'Allied guilds' : 'Enemy guilds';
    btn.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      startSession(sg);
    });
    row.appendChild(btn);
  }

  container.appendChild(row);
}
```

Call `showNextSessionButtons(app)` after `showComboSummary(actualCount)` in the assessment click handler.

**Gotcha:** `startSession` is defined later in the file. The callback closes over it — this is fine because by the time the button is clicked, `startSession` is fully defined. No hoisting issues with `function` declarations.

---

### 4. `index.html` (welcome screen)

The "Learn guild names" button invokes `startSession()` with no args, which defaults to `"allied"`. No change needed to the button label per the spec ("Button still says 'Learn guild names', defaults to allied"). No HTML changes required unless the Project Lead decides to add subgroup choice at welcome — Arc 7 spec does not require this.

---

### 5. `README.md`

Update:
- **Current version** badge: `v0.5.0` → `v0.7.0`
- **Arc History** table: add Arc 6 (v0.6.0, Static Welcome Screen, COMPLETE) and Arc 7 (v0.7.0, Guild Subgroups, COMPLETE)
- **What's Implemented** section: mention subgroup split and "next session" buttons
- **Observability** section: update `session.tier` values to `guild_allied` / `guild_enemy`, add `session.subgroup_size`

---

## Implementation Order

1. `src/data/combos.ts` — add `subgroup` field and export derived arrays. Everything downstream depends on this.
2. `src/session.ts` — update `SessionState`, `GuildSubgroup` type, `createSession()` signature. No UI yet, easy to test in isolation.
3. `src/main.ts` — in order within the file:
   a. Bump version constant
   b. Update `startSession()` signature and telemetry
   c. Add `showNextSessionButtons()` helper
   d. Wire `showNextSessionButtons()` into the assessment click handler
4. `README.md` — update after code is verified

Type-check after each step: `./scripts/typecheck.sh`

---

## Contracts / Interfaces for Developer

- `GuildSubgroup = "allied" | "enemy"` is the canonical string union. Use it everywhere — do not use raw strings.
- `createSession(subgroup)` is the single point of pool selection. `main.ts` must not filter guilds directly.
- `session.subgroup` must be read from `SessionState` when emitting telemetry — do not duplicate the subgroup logic in `startSession`.
- `showNextSessionButtons` must call `startSession(sg)` not `createSession(sg)` — `startSession` handles the full lifecycle (span creation, DOM update).
- The click handler on next-session buttons must call `e.stopPropagation()` to avoid triggering the app-level click listener (`handleAdvance`).

---

## Risks and Gotchas

| Risk | Mitigation |
|---|---|
| App-level click listener fires when user clicks "Allied guilds" / "Enemy guilds" button | Use `e.stopPropagation()` in each button handler. Already done for Pause/Stop — follow that pattern. |
| `session` module-level variable is replaced by `startSession` but old `sessionSpan` may still be open | Check: after self-assessment the session span is closed (`endSessionSpan` is called). Confirmed in current code — safe. |
| `SESSION_CARD_COUNT` is 50 but pool is now 5 — deck repeats each guild 10x per session | This is intentional for perceptual learning. No change needed. |
| TypeScript will error if `SessionState.subgroup` is added but existing call sites don't pass it | `createSession` has a default param. `SessionState` init in `createSession` sets it. No external construction of `SessionState` — no migration risk. |
| README says `v0.5.0` in the "Current version" line — it was not updated for v0.6.0 | Fix it now as part of Arc 7 README update. Note this for the Librarian. |

---

## Observability Checklist

- [ ] `session.tier` emits `'guild_allied'` or `'guild_enemy'` (not `'guild'`)
- [ ] `session.subgroup_size` emits `5`
- [ ] Next-session buttons start a new top-level session span (not a child of the old one)
- [ ] Version footer link updates to new trace ID on each new session start
