# Arc 7 — Session End Screen Design: Subgroup Navigation

**Arc:** Arc 7 — Guild Subgroups
**Date:** 2026-02-24
**Status:** Ready for implementation

---

## Context

Arc 7 splits the 10 guilds into allied pairs (Azorius, Dimir, Golgari, Gruul, Boros) and enemy pairs (Orzhov, Izzet, Simic, Rakdos, Selesnya). After a session, the user needs a way to continue with either subgroup. The session end screen currently shows:

1. Card count ("50 cards")
2. "Session complete" or "Session stopped"
3. "How did that feel?" self-assessment (3 buttons)
4. After assessment: combo summary list ("Combos practiced")

The new requirement is: after the combo summary, offer navigation to the next session.

---

## Design Answers

### 1. When do the subgroup buttons appear?

After self-assessment and combo summary — not replacing either.

The self-assessment and combo summary serve reflection. The subgroup buttons serve action. These are sequential mental modes: first reflect, then choose what's next. Showing the buttons before the summary would interrupt reflection. Replacing the summary with buttons would be jarring — the summary has already entered the DOM and the user may be reading it.

The buttons appear appended below the combo summary, with a separator and a brief contextual label.

### 2. Button labels

- "Allied guilds" — for the allied subgroup (Azorius, Dimir, Golgari, Gruul, Boros)
- "Enemy guilds" — for the enemy subgroup (Orzhov, Izzet, Simic, Rakdos, Selesnya)

These are the natural MTG terms (DEC-034). They are short, specific, and match the domain language the user will learn to use. Do not use "Group 1" / "Group 2" or compass directions.

### 3. Which button is "primary"?

The button for the other subgroup — i.e., the one the user has not just played — is visually distinguished as the natural next step.

Rationale: The Sparrow Deck model values progressive exposure. If the user just practiced allied guilds, they are ready to try enemy guilds. Highlighting the other group nudges progression without forcing it. The current group remains available — some users will want repetition and that should be accessible.

**Primary button** (highlighted border, higher contrast): the other subgroup.
**Secondary button** (standard style): the subgroup just played.

This requires the session end function to know which subgroup was active. Arc 7 must pass this information through.

### 4. Visual separator

Yes. A thin horizontal rule or spacing divider between the combo summary and the next-session section. This marks the transition from "what you did" to "what you do next."

Use a `<div class="session-next-divider">` — a horizontal line in a muted color (`#333` or `#444`). Keep it minimal, not a heavy visual break.

### 5. Indicating the current subgroup

The current subgroup is indicated by labeling the section prompt above the buttons. Example:

> "You practiced allied guilds."

This is rendered as muted small text (matching `.session-end-label` style). It names what just happened, gives the secondary button its implicit meaning ("same again"), and sets up the primary button's contrast ("try the other group").

---

## Full Flow After Assessment Click

```
[combo summary appears — "Combos practiced" heading + list]

[thin divider line]

[muted label: "You practiced allied guilds."]

[Primary button: "Enemy guilds"]        ← highlighted, natural next step
[Secondary button: "Allied guilds"]     ← available, same again
```

---

## Implementation Spec for Developer

### New CSS classes needed

**`.session-next`** — container for the next-session section
```css
.session-next {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: cardEnter 250ms ease-out;
  width: 100%;
  max-width: 280px;
}
```

**`.session-next-divider`** — thin separator between combo summary and next-session section
```css
.session-next-divider {
  width: 100%;
  max-width: 260px;
  height: 1px;
  background: #333;
  margin: 0.75rem 0;
}
```

**`.session-next-label`** — muted contextual label ("You practiced allied guilds.")
```css
.session-next-label {
  font-size: 0.9rem;
  color: #888;
  text-align: center;
}
```

**`.session-next-buttons`** — button column container
```css
.session-next-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
```

**`.next-session-button`** — base style, matching `.self-assessment-button`
```css
.next-session-button {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e0e0e0;
  background: #2a2a3e;
  border: 2px solid #444;
  border-radius: 12px;
  padding: 0.9rem 1.5rem;
  cursor: pointer;
  transition: background 200ms ease, border-color 200ms ease, transform 100ms ease;
  -webkit-tap-highlight-color: transparent;
}

.next-session-button:hover {
  background: #35355a;
  border-color: #666;
}

.next-session-button:active {
  transform: scale(0.97);
}
```

**`.next-session-button--primary`** — modifier for the highlighted "other" button
```css
.next-session-button--primary {
  border-color: #6666aa;
  color: #f0f0f0;
}

.next-session-button--primary:hover {
  border-color: #8888cc;
  background: #35355a;
}
```

The primary modifier uses a cool purple-blue accent (`#6666aa`) that feels native to the dark purple theme (`#1a1a2e`, `#2a2a3e`) without introducing a jarring new color. It is not a filled/solid button — the border accent is sufficient to signal priority without overwhelming the muted aesthetic.

### DOM construction (in JS, appended to `app` after `showComboSummary`)

The new `showNextSessionButtons(currentSubgroup)` function should:

1. Create `.session-next-divider` and append to `app`
2. Create `.session-next` container
3. Add `.session-next-label` with text: `"You practiced ${currentSubgroupLabel}."`
   - `currentSubgroupLabel` should be `"allied guilds"` or `"enemy guilds"` (lowercase, matches button labels)
4. Create `.session-next-buttons` container
5. Create two `.next-session-button` elements:
   - The "other" subgroup button gets the `--primary` modifier class
   - The "current" subgroup button does not
6. Order: primary button first (top), secondary button second (bottom)
   - Top button = the nudge toward progression
   - Bottom button = the "go again" fallback
7. Each button click starts a new session with the appropriate subgroup

### Button text (exact)

- Primary (other subgroup): `"Enemy guilds"` or `"Allied guilds"` (whichever was not just played)
- Secondary (current subgroup): the one just played

No icons, no emoji, no arrows. The words carry the meaning.

### Telemetry

When a subgroup button is clicked, the new session span should include:
- `session.started_from = 'session_end_screen'`
- `session.tier = 'guild_allied'` or `'guild_enemy'` (consistent with DEC-034 naming convention)

The existing `session.started_from` attribute (DEC-032) was designed for exactly this — recording different session entry points.

---

## What Not to Add

- No "All guilds" button (explicitly excluded per the task brief and the progressive exposure model)
- No "Back to welcome screen" or "Done" button — the user can refresh or close; do not add navigation clutter
- No icons or emoji on the buttons — this session end screen is already visually rich with pips in the combo summary
- No animation beyond the standard `cardEnter` on the container — consistent with all other sections on this screen

---

## Accessibility Notes

- Both buttons use `<button>` elements
- The contextual label (`"You practiced allied guilds."`) gives screen readers the context needed to understand why two buttons appear
- Primary/secondary distinction is not conveyed by color alone — the primary button has a visually distinct border color AND is positioned first in DOM order (which is the natural reading order)
- The `--primary` modifier border color (`#6666aa` on `#1a1a2e`) meets WCAG AA for UI component contrast

---

## Design Rationale

The key tension: we want to nudge toward progression (enemy guilds, if they just did allied) without requiring it. The primary/secondary button hierarchy solves this without removing choice.

The pattern is consistent with the app's existing visual language: buttons in columns, same `.self-assessment-button` sizing and radius, same hover/active micro-interactions. The only new visual element is the border accent on the primary button, which is minimal and fits the purple-blue palette.

Appending after the combo summary preserves the reflection moment. The user reads what they practiced, then naturally looks below for what to do next. The divider and label create a clear section break without heavy visual weight.

The flow respects the app's philosophy (DEC-003): no evaluation, no pressure, just "here's what you did, here's where you can go."
