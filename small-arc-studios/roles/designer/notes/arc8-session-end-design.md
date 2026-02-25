# Arc 8 — Session End Screen Redesign: Two-Column Guild Layout

**Arc:** Arc 8 — Card Images
**Date:** 2026-02-25
**Status:** Ready for implementation

---

## Context

Arc 7 introduced subgroup navigation with two stacked buttons at the bottom of the session end screen. Arc 8 replaces that navigation section with a richer two-column layout that teaches users the structural difference between allied and enemy guilds, and turns the enemy guilds into an aspirational destination for users who have only completed allied sessions.

The current post-assessment flow ends with:
1. Combo summary (guilds practiced, with pips and names)
2. Thin divider
3. Label: "You practiced allied/enemy guilds."
4. Two stacked buttons: [Enemy guilds] [Allied guilds] (or reversed)

The new design replaces everything from step 2 onward with a two-column layout.

---

## 1. Layout Structure

### Overall container

Replace the current `.session-next` section (divider + label + button stack) with a new `.guild-columns` container. This container sits below the combo summary, separated by the existing `.session-next-divider`.

```
[combo summary]
[thin divider: .session-next-divider]
[.guild-columns]
  [.guild-column.guild-column--allied]
  [.guild-column.guild-column--enemy]
```

The `.guild-columns` container uses CSS Grid (two equal columns) on wide screens, and stacks vertically on narrow screens. Allied column is always left/first; enemy column is always right/second.

### Left column: Allied Guilds

Always rendered in full — this column never has a "locked" state.

Structure:
```
[.guild-column.guild-column--allied]
  [.guild-column-header]            "Allied Guilds"
  [.guild-column-explanation]       Educational paragraph
  [.guild-column-list]              Five guild rows (pips + name)
    [.guild-column-item] x 5
  [.guild-column-button .next-session-button]   "Learn allied guilds"
```

### Right column: Enemy Guilds

Conditional based on whether the user has completed an enemy session.

**Before enemy session completed (locked state):**
```
[.guild-column.guild-column--enemy.guild-column--locked]
  [.guild-column-button .next-session-button--primary]   "Learn enemy guilds"
```
No header. No explanation. No guild list. Just the button.

**After enemy session completed (unlocked state):**
```
[.guild-column.guild-column--enemy]
  [.guild-column-header]            "Enemy Guilds"
  [.guild-column-explanation]       Educational paragraph
  [.guild-column-list]              Five guild rows (pips + name)
    [.guild-column-item] x 5
  [.guild-column-button .next-session-button]   "Learn enemy guilds"
```

---

## 2. Educational Copy

### Allied Guilds explanation

> On the back of every Magic card is a five-color circle: White, Blue, Black, Red, Green. Allied guilds are color pairs that sit next to each other on that circle. Neighboring colors share philosophies — they cooperate, overlap, and reinforce each other. Azorius (White-Blue) blends law and order. Gruul (Red-Green) blends wildness and ferocity. These are the natural partnerships.

Keep it to 3–4 sentences. The goal is to give users a mental model (the color wheel), not to teach them lore.

**Shorter version (preferred for space):**

> Magic's five colors form a circle: ☀️ 💧 💀 🔥 🌿. Allied guilds are pairs of neighboring colors — colors that share philosophy and overlap in values. Natural partnerships, built on common ground.

### Enemy Guilds explanation

> Enemy guilds pair colors that sit across the circle from each other — opposite in philosophy, in tension by design. Where allied guilds cooperate, enemy guilds create friction. That friction is what makes them interesting. Orzhov (White-Black) pairs law with ruthlessness. Simic (Green-Blue) combines nature with intellect. Strange combinations, but powerful ones.

**Shorter version (preferred for space):**

> Enemy guilds pair colors from opposite sides of the circle — opposites in philosophy, in productive tension. Stranger combinations, harder to remember, but once they click, they stick.

### Which version to use

Use the shorter versions by default. The session end screen already has the combo summary above — the explanation should feel informative, not encyclopedic. Users can read at a glance without scrolling past a wall of text.

---

## 3. The Locked Enemy Column

When the user has not yet completed an enemy session, the enemy column shows only a single call to action. No header. No list. No explanation. This is deliberate:

- The ally column is rich and complete, which makes the enemy column feel like something to unlock — not something broken or unavailable.
- Showing guild names and pips would reduce the incentive to try enemy guilds. Let the mystery pull them in.
- The single prominent button ("Learn enemy guilds") is visually the primary action — it should carry the `--primary` modifier (accent border `#6666aa`).

### Visual treatment of the locked column

The locked column should feel inviting but restrained. It is not greyed out or disabled — it is a door not yet opened.

Options considered:
1. Just the button, centered vertically in the column — clean and direct.
2. Button plus a single teaser line: "Five more guilds to discover." — adds a hint of mystery.

**Recommendation: Option 2.** The teaser line helps users understand there is more here without revealing what. One short line only. Position it above the button.

Teaser copy:
> Five more combinations. Ready when you are.

CSS treatment: same `.guild-column-explanation` class as the unlocked state, but with a subtler style — slightly more muted text color (`#777` instead of `#aaa`). This visually signals incompleteness without being dismissive.

---

## 4. Responsive Behavior

### Wide screens (600px and above)

Two columns side by side, equal width, with a gap between them.

```css
.guild-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
}
```

The `#app` container is already `max-width: 600px`. On most mobile browsers in landscape or tablet view, two columns fit comfortably.

### Narrow screens (below 480px)

Stack vertically: allied column on top, enemy column below. This preserves reading order — learn allied first, then encounter enemy.

```css
@media (max-width: 480px) {
  .guild-columns {
    grid-template-columns: 1fr;
  }
}
```

On narrow screens, the locked enemy column (just a button + teaser) will be compact — a few lines at most. That is appropriate: the user has just scrolled past a rich allied column, and the contrast is part of the design intent.

### Column alignment

Each column is `flex-direction: column` internally, with the button pinned to the bottom using `margin-top: auto` on the button. This keeps the "Learn" buttons at the same vertical position when both columns are fully unlocked — aligned footer buttons in a two-column grid feel intentional and professional.

In the locked state, the column has minimal content, so `justify-content: flex-end` or `align-items: center` with centered button is appropriate.

---

## 5. Visual Hierarchy

### Within each unlocked column

1. **Header** (`.guild-column-header`): Column title. Large enough to anchor the section. Suggest `font-size: 1.1rem`, `font-weight: 700`, `color: #f0f0f0`.

2. **Explanation** (`.guild-column-explanation`): Smaller, muted. Suggest `font-size: 0.875rem`, `color: #aaa`, `line-height: 1.5`. Not bold — this is supporting text, not a headline.

3. **Guild list** (`.guild-column-list`): The core content. Each row reuses `.combo-summary-item` styling — pips followed by name. This is already established design language from the combo summary. Pips at `28px` as currently styled. Guild name at `font-size: 0.95rem`, `color: #ccc`.

4. **Button** (`.guild-column-button`): Sits at the bottom of the column. Reuses `.next-session-button` base class. Full width within the column. The allied button uses the secondary style (standard border `#444`). The enemy button's style depends on state:
   - If enemy session completed: secondary style (standard), since this is a "learn again" option, not the primary progression nudge.
   - If enemy session not completed: primary style (`#6666aa` border), since this is the natural next step.

### Allied vs. enemy column contrast

The unlocked allied column is visually full: header, explanation, 5 guild rows, button. The locked enemy column is visually minimal: teaser text, button. This contrast is intentional and communicates "there is more here to discover." Do not equalize them with padding or filler — the visual weight difference is the message.

### Relationship to combo summary above

The combo summary (`.combo-summary`) shows only the guilds practiced in the session — typically 5 items for a completed allied session. The new columns below show all 10 guilds total. This progression (what I practiced → all that exists) reinforces the educational framing without explaining it explicitly.

---

## 6. CSS Class Naming Suggestions

New classes required:

| Class | Purpose |
|---|---|
| `.guild-columns` | Two-column grid container |
| `.guild-column` | Individual column (allied or enemy) |
| `.guild-column--allied` | Modifier for allied column |
| `.guild-column--enemy` | Modifier for enemy column |
| `.guild-column--locked` | Modifier for locked (unvisited enemy) state |
| `.guild-column-header` | "Allied Guilds" / "Enemy Guilds" heading |
| `.guild-column-explanation` | Educational paragraph |
| `.guild-column-list` | Ordered list of guilds |
| `.guild-column-item` | Single guild row (pips + name) |
| `.guild-column-button` | The "Learn X guilds" button within a column |

Existing classes that carry over unchanged:
- `.next-session-button` — base button style
- `.next-session-button--primary` — accent border for the primary action
- `.combo-summary-pips` — reusable for guild list pip groups
- `.combo-summary-name` — reusable for guild name text
- `.mana-pip` — individual pip images
- `.session-next-divider` — the thin rule above the columns

### Avoid

Do not add a new button class for the column buttons unless the styling genuinely differs from `.next-session-button`. The goal is to extend existing patterns, not proliferate classes. Use `.guild-column-button` as a structural wrapper selector only if needed for layout (e.g., `margin-top: auto`), not for visual styling.

---

## 7. State Determination

The developer will need a way to know whether the user has completed an enemy session. This information is not currently tracked in any persistent state — each page load starts fresh.

Design implications:
- For this arc, the simplest signal is: if the current session's subgroup is `"enemy"`, the enemy column is unlocked. This means: if the user just completed an enemy session, they see the full enemy column.
- If the user just completed an allied session (the first-time case), the enemy column is locked.

This is a session-local decision — no localStorage, no cookies. The state is derived from `currentSubgroup`.

**Edge case:** What does a user who has just completed an enemy session see on the allied side? The allied column is always fully unlocked. No locked state for allied guilds.

---

## 8. What Is Removed

The following elements from Arc 7's design are replaced and should not carry forward:

- `.session-next-label` ("You practiced allied guilds.") — replaced by the two-column layout header and educational copy, which give more context with less awkward phrasing.
- `.session-next-buttons` (the two stacked buttons) — replaced by the per-column buttons.
- The `.session-next` container — replaced by `.guild-columns`.

The `.session-next-divider` is retained as the visual boundary between combo summary and the column layout.

---

## 9. Animation

The `.guild-columns` container should use the existing `cardEnter` animation (opacity fade + subtle scale) on entry, consistent with every other section that appears after self-assessment. Duration: `250ms ease-out`. No staggered animation between columns — they appear as a unit.

---

## 10. Accessibility Notes

- Column headers (`h2` or equivalent) should be proper heading elements, not styled `div`s, to support screen reader navigation.
- The locked enemy column should not use `disabled`, `aria-disabled`, or any hint that the button is inactive. It is fully active — it is the primary call to action. Only the surrounding content is absent.
- The teaser text ("Five more combinations. Ready when you are.") should be in a `<p>` element associated with the column, not hidden with `aria-hidden`.
- Pip images carry `alt` attributes already (single letter: "W", "U", "B", "R", "G"). This is sufficient for screen reader users who will hear the guild name immediately after.
- Color is not the only signal distinguishing primary from secondary buttons — the primary button also appears first in DOM order (inside the locked enemy column) or carries visually distinct border weight.

---

## Summary: What the User Sees

### First-time allied session completion

```
[50 cards | Session complete]
[How did that feel? — 3 buttons]
--- assessment clicked ---
[Combos practiced: pips + names of 5 guilds]
[thin divider]

Allied Guilds                    |  Five more combinations.
Magic's five colors form         |  Ready when you are.
a circle... [explanation]        |
                                 |
☀️💧 Azorius                   |  [Learn enemy guilds]  ← primary
💧💀 Dimir                     |
💀🔥 Rakdos                    |
🔥🌿 Gruul                     |
🌿☀️ Selesnya                  |

[Learn allied guilds]            |
```

### After first enemy session completion

```
[same above structure]

Allied Guilds                    |  Enemy Guilds
Magic's five colors form         |  Enemy guilds pair colors
a circle... [explanation]        |  from opposite sides...
                                 |
☀️💧 Azorius                   |  ☀️💀 Orzhov
💧💀 Dimir                     |  💧🔥 Izzet
💀🔥 Rakdos                    |  💀🌿 Golgari
🔥🌿 Gruul                     |  🔥☀️ Boros
🌿☀️ Selesnya                  |  🌿💧 Simic

[Learn allied guilds]            |  [Learn enemy guilds]
```

Both buttons are secondary style when the user has practiced both groups — neither is the "primary" next step, so the visual hierarchy relaxes.
