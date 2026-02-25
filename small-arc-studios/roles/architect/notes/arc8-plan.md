# Arc 8 Architecture Plan: Session End Screen Redesign

**Target version:** 0.8.0
**Date:** 2026-02-25

---

## Context

At v0.7.0, the session end screen shows:
1. Card count + "Session complete/stopped"
2. Self-assessment (if enough cards were shown)
3. `showComboSummary()` — list of combos practiced
4. `showNextSessionButtons()` — two buttons: Allied guilds / Enemy guilds

Arc 8 replaces the bottom two sections with a two-column layout that introduces
progressive disclosure: the enemy column is locked until the user has completed
at least one enemy session.

---

## 1. Progression State — localStorage Shape

The only progression signal needed for Arc 8 is: **has the user completed at
least one enemy session?**

**Key:** `sparrow-deck.progression`

**Shape:**

```json
{
  "enemyUnlocked": true
}
```

**Rationale:**

- A single namespaced JSON object under one key is easy to extend. Future arcs
  may add `allGuildsUnlocked`, `shardsUnlocked`, etc. without introducing new
  localStorage keys.
- The key is namespaced with `sparrow-deck.` to avoid collisions with any other
  content on the same origin.
- The object serialises cleanly with `JSON.stringify` / `JSON.parse`.
- Do not store timestamps or counts in this shape for Arc 8 — keep it minimal.

**When is it written?**

When a session whose `subgroup === "enemy"` ends and `session.completed === true`
(i.e., the user reached the final card, not just stopped early). A stopped enemy
session does NOT unlock the column.

**When is it read?**

At session end screen render time (inside `showSessionEnd()`), before building
the two-column layout.

---

## 2. Module Structure

### New file: `src/progression.ts`

Keep progression logic out of `main.ts`. `main.ts` is already large; side-effect
storage does not belong there.

```ts
// src/progression.ts

const STORAGE_KEY = 'sparrow-deck.progression';

type ProgressionState = {
  enemyUnlocked: boolean;
};

function loadProgression(): ProgressionState {
  // returns default if key missing or JSON invalid
}

function saveProgression(state: ProgressionState): void {
  // writes JSON to localStorage
}

export function isEnemyUnlocked(): boolean {
  return loadProgression().enemyUnlocked;
}

export function markEnemyUnlocked(): void {
  const state = loadProgression();
  if (!state.enemyUnlocked) {
    saveProgression({ ...state, enemyUnlocked: true });
  }
}
```

`loadProgression` must handle `localStorage` exceptions (private browsing mode
in some browsers throws on `setItem`). Wrap both read and write in try/catch;
default to `{ enemyUnlocked: false }` on any error.

### Changes to `src/main.ts`

1. **Version bump:** `APP_VERSION = '0.8.0'`

2. **Import progression helpers:**
   ```ts
   import { isEnemyUnlocked, markEnemyUnlocked } from './progression';
   ```

3. **Call `markEnemyUnlocked()` when an enemy session completes.**
   The right location is inside `showSessionEnd()`, after `actualCount` is
   resolved and before the DOM is built. The condition:

   ```ts
   if (session.subgroup === 'enemy' && session.completed) {
     markEnemyUnlocked();
   }
   ```

   This must happen before calling `isEnemyUnlocked()` during column render, so
   the same session that unlocks the feature also shows the unlocked state
   immediately.

4. **Replace `showComboSummary()` and `showNextSessionButtons()`** with a new
   function (see section 3 below).

5. **Remove `showComboSummary()` and `showNextSessionButtons()`** — they are
   fully superseded. Do not leave dead code.

---

## 3. Two-Column Rendering — Function Structure

Replace the two legacy functions with one new function:

```ts
function showSessionEndColumns(enemyUnlocked: boolean): void
```

Called from `showSessionEnd()` in place of both `showComboSummary()` and
`showNextSessionButtons()`. It appends a two-column container directly to `app`.

### Column layout

```
+---------------------------+---------------------------+
|  ALLIED GUILDS            |  ENEMY GUILDS             |
|                           |                           |
|  <explanation text>       |  [locked]                 |
|                           |  "Learn Enemy Guilds"     |
|  ● Azorius                |  button only              |
|  ● Dimir                  |                           |
|  ● Rakdos                 |  OR (if unlocked):        |
|  ● Gruul                  |  <explanation text>       |
|  ● Selesnya               |  ● Orzhov                 |
|                           |  ● Izzet                  |
|  [ Learn allied guilds ]  |  ● Golgari                |
|                           |  ● Boros                  |
|                           |  ● Simic                  |
|                           |                           |
|                           |  [ Learn enemy guilds ]   |
+---------------------------+---------------------------+
```

**Note:** The combo-practiced list (previously `showComboSummary()`) is removed
in Arc 8. The two-column guild list replaces it entirely. The "combos practiced"
concept is superseded by "here are all the guilds in each subgroup." Confirm this
intent with the client before the Developer begins.

### Sub-functions (internal to `main.ts` or extracted to `src/ui/sessionEnd.ts`)

If `showSessionEndColumns` grows large, extract to `src/ui/sessionEnd.ts`. For
Arc 8, keep it in `main.ts` initially and refactor only if the Developer finds it
unwieldy (over ~80 lines of DOM construction).

Internal helpers:

```ts
function buildAlliedColumn(): HTMLElement
function buildEnemyColumn(unlocked: boolean): HTMLElement
```

Each returns a `div.guild-column` element. `showSessionEndColumns` creates a
`div.guild-columns` wrapper, appends both, appends to `app`.

### Data source

Columns use `alliedGuilds` and `enemyGuilds` from `src/data/combos.ts` directly
(already imported via the `colorEmojiMap` import — may need explicit import of
the arrays). Do NOT re-filter `guilds` inside `main.ts`; use the exported
derived arrays.

### Button wiring

Both "Learn allied guilds" and "Learn enemy guilds" buttons call
`startSession(sg, 'session_end_screen')` — same pattern as the existing
`showNextSessionButtons`. Locked enemy button calls
`startSession('enemy', 'session_end_screen')` when clicked; unlocking happens at
that session's end, not at click time.

---

## 4. Telemetry Plan

### On session start (`startSession`)

Add one new attribute to the session span:

| Attribute | Type | Value |
|---|---|---|
| `session.enemy_unlocked` | boolean | result of `isEnemyUnlocked()` at session start |

This allows Honeycomb queries to segment by user progression tier. Read it
before calling `markEnemyUnlocked()` — we want to know what state the user was
in when they *started* the session, not after.

Wait — `markEnemyUnlocked()` is called at session *end*, not start. So reading
`isEnemyUnlocked()` at session start is safe and correct regardless of order.

### On session end screen render

No new span required, but record a span event on the session span when the enemy
column is first unlocked during the current page load:

| Event name | Attribute | Value |
|---|---|---|
| `progression.enemy_unlocked` | `progression.trigger` | `'enemy_session_complete'` |

Only emit this event when `markEnemyUnlocked()` actually writes (i.e., the state
transitions from false to true). `markEnemyUnlocked()` can accept an optional
callback, or the caller can check `isEnemyUnlocked()` before and after and emit
the event in `showSessionEnd()`.

Simpler approach: `markEnemyUnlocked()` returns a boolean indicating whether the
state *changed*. If true, `showSessionEnd()` emits the event on `sessionSpan`
(which is still open at that moment).

### Version bump telemetry

`app.version` attribute on all spans moves from `'0.7.0'` to `'0.8.0'`
automatically via the `APP_VERSION` constant.

---

## 5. Risks and Concerns

| Risk | Mitigation |
|---|---|
| `localStorage` unavailable (private browsing, storage quota exceeded) | Wrap all storage access in try/catch; default to unlocked=false on read failure; silently swallow write failures. Progression loss on private mode is acceptable — it is not critical data. |
| "Does stopped enemy session unlock?" — ambiguity | Architecture says NO — only `session.completed === true` triggers unlock. Confirm with client/Project Lead before Developer implements. |
| `showComboSummary` removal — the combo list was informational content | The two-column guild list replaces it. Confirm the client wants this substitution, not an additive change. |
| `sessionSpan` may be null when `showSessionEnd` is called | Existing code already guards against this. The span event for `progression.enemy_unlocked` should be conditional on `sessionSpan !== null`. |
| Two-column layout on narrow mobile screens | CSS must handle single-column fallback. The Designer should specify the breakpoint. Flag for Designer review before merge. |
| `alliedGuilds` and `enemyGuilds` are currently imported in `session.ts` but not `main.ts` | `main.ts` currently imports only `colorEmojiMap` from `combos.ts`. The Developer must add `alliedGuilds` and `enemyGuilds` to that import. |
| The "enemy unlocked on first completed enemy session" rule means a user who completes an enemy session and then clears localStorage loses their progress | Acceptable for current scope. Progression is lightweight and re-earnable. |

---

## Implementation Order (recommended for Developer)

1. `src/progression.ts` — new file, no dependencies on anything being changed.
   Type-check immediately.
2. `src/main.ts` — version bump to `0.8.0`, import progression helpers,
   add `session.enemy_unlocked` attribute to `startSession`.
3. `src/main.ts` — add `markEnemyUnlocked()` call and optional span event in
   `showSessionEnd()`.
4. `src/main.ts` — implement `buildAlliedColumn()`, `buildEnemyColumn()`,
   `showSessionEndColumns()`.
5. `src/main.ts` — remove `showComboSummary()` and `showNextSessionButtons()`.
   Wire `showSessionEndColumns()` into `showSessionEnd()` at both call sites
   (the short-circuit path for too-few cards, and the self-assessment handler).
6. CSS — add `.guild-columns`, `.guild-column`, `.guild-column--locked` rules.
   The Designer owns this but the Developer needs stubs to make it testable.

---

## Contracts for Developer

- `isEnemyUnlocked()` and `markEnemyUnlocked()` are the only public exports of
  `progression.ts`. `main.ts` does not touch `localStorage` directly.
- `showSessionEndColumns(enemyUnlocked: boolean)` replaces both legacy functions.
  It receives the boolean as a parameter — it does not read `localStorage`
  itself. The caller (`showSessionEnd`) is responsible for reading progression
  state and passing it in. This keeps the rendering function pure.
- `buildAlliedColumn()` and `buildEnemyColumn(unlocked)` return `HTMLElement`.
  They do not append to `app` directly.
- Guild lists are sourced from `alliedGuilds` / `enemyGuilds` exports — not
  hardcoded strings.
- `e.stopPropagation()` is required on all button click handlers per the
  established pattern (prevent `handleAdvance` from firing).
