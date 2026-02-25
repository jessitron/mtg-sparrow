# Learn vs Practice Button Text — Tester Verification Notes

**Date:** 2026-02-25
**Test script:** `scripts/test-learn-practice.mjs`
**Result:** PASS — 29/29 tests passed, 0 failures

---

## What Was Tested

Two changes introduced after Arc 8 base delivery:

1. **Locked enemy column button is vertically centered** — `margin-top: auto` override removed in favour of `justify-content: center` on the locked column, so the button sits at the visual midpoint of the column.
2. **"Learn" vs "Practice" button text** — Buttons read "Learn allied/enemy guilds" on first visit; after a session of that type has been completed, `markSubgroupCompleted` fires and the next view of the end screen shows "Practice allied/enemy guilds".

---

## Acceptance Criteria Verification

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Locked enemy column shows ONLY the button (no `<p>` elements, no `.guild-column-explanation`) | PASS |
| 2 | Button is vertically centered in locked column (offset 0.0px, well within 20% tolerance) | PASS |
| 3 | After first allied session ends, allied button reads "Practice allied guilds" | PASS |
| 4 | Enemy button reads "Learn enemy guilds" until an enemy session is completed | PASS |
| 5 | After enemy session completion (simulated via localStorage), enemy button reads "Practice enemy guilds" | PASS |
| 6 | 8px line thickness (`stroke-width="8"` on all 5 `.ally-line-vis` elements) still intact | PASS |
| 7 | Column header "Allied Guilds" still has `text-align: center` | PASS |
| 8 | Hover highlighting still works on SVG lines (highlight applied and clears correctly) | PASS |

---

## Phase Detail

### Phase 1 — Fresh state, first allied session

- Cleared `sparrow-deck.progression` from localStorage before loading.
- Ran a session: 4 cards → Stop → self-assessment.
- Locked enemy column: 0 `<p>` elements, no `.guild-column-explanation`, button present.
- Vertical centering: column mid = 483.0px, button mid = 483.0px, offset = **0.0px** (tolerance = 139.1px). Perfect centre.
- `justify-content: center` confirmed on `.guild-column--locked`.
- Allied button text after first session: **"Practice allied guilds"** — `markSubgroupCompleted('allied')` fires in `showSessionEnd` before columns are built, so the first end-screen already shows "Practice".
- Enemy button text: **"Learn enemy guilds"** — no enemy session completed yet.

### Phase 2 — Second allied session, Practice persists

- Clicked "Practice allied guilds" to start another session.
- After completion: allied button still **"Practice allied guilds"**, enemy button still **"Learn enemy guilds"**.

### Phase 3 — Simulated enemy completion

- Set localStorage: `{ enemyUnlocked: true, completedSubgroups: ["allied", "enemy"] }`.
- Reloaded, ran another allied session to reach end screen.
- Enemy column unlocked (`.guild-column--locked` absent).
- Enemy button: **"Practice enemy guilds"**.
- Allied button: **"Practice allied guilds"**.

### Phase 4 — Structural checks

- All 5 `.ally-line-vis` elements: `stroke-width="8"` (values: 8, 8, 8, 8, 8).
- `.guild-column-header` `text-align: center` confirmed.
- `#line-white-blue` SVG line: hover adds `.highlight` class, removes it on mouse leave. `.guild-column--has-highlight` class correctly toggled on the column.

---

## Screenshots

- `scripts/learn-practice-phase1.png` — Post-first-session end screen (locked enemy, Practice allied)
- `scripts/learn-practice-phase2.png` — Post-second-session (Practice persists, locked enemy still Learn)
- `scripts/learn-practice-phase3.png` — Post-enemy-unlock (Practice on both columns, unlocked layout)

---

## Verdict

**PASS.** All acceptance criteria are satisfied. The Learn/Practice logic correctly tracks per-subgroup completion via `completedSubgroups` in `sparrow-deck.progression` localStorage. The locked enemy column is clean (no teaser text) and vertically centered. Structural features from prior arcs remain intact.
