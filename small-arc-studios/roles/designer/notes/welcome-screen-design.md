# Welcome Screen Design

**Arc:** Welcome Screen (User Arc)
**Date:** 2026-02-19
**Status:** Ready for implementation

---

## Purpose

First impression for someone who may never have heard of MTG color combo names. The screen must:
- Orient them to the game mechanic in one glance
- Give them a concrete fallback ("Boros") so they are never stuck
- Get out of the way fast — one button, no friction

---

## Copy (Exact Text)

**Heading:** Sparrow Deck

**Instruction paragraph:**
> See a color combo, guess a name — any color combo name.
> In case you don't know any, try "Boros."

**Subtext (smaller, muted):**
> When the right name appears, say it out loud.

**Button label:** Learn guild names

---

## Layout Mockup

```
┌────────────────────────────────────────┐
│                                        │
│           Sparrow Deck                 │
│         (heading, large)               │
│                                        │
│  See a color combo, guess a name —     │
│  any color combo name.                 │
│  In case you don't know any, try       │
│  "Boros."                              │
│         (body text, centered)          │
│                                        │
│  When the right name appears,          │
│  say it out loud.                      │
│         (muted subtext, centered)      │
│                                        │
│   ┌──────────────────────────────┐     │
│   │      Learn guild names       │     │
│   └──────────────────────────────┘     │
│                                        │
└────────────────────────────────────────┘
```

The screen sits inside `#app`, which is already centered (max-width 600px, flex column, justify-content center).

---

## CSS Class Names

Follow existing naming conventions (kebab-case, semantic). Suggested new classes:

| Class | Element | Purpose |
|---|---|---|
| `.welcome` | container div | Wrapper for entire welcome screen, flex column, centered, gap |
| `.welcome-heading` | h1 | App title, large and prominent |
| `.welcome-instructions` | p | Main instruction text |
| `.welcome-subtext` | p | The "say it out loud" instruction, muted tone |
| `.welcome-button` | button | Primary CTA — styled prominently, not like `.control-button` |

### Style Notes

**`.welcome`**
- `text-align: center`
- `display: flex; flex-direction: column; align-items: center; gap: 1.5rem`
- Use `animation: cardEnter 250ms ease-out` — matches card entrance feel

**`.welcome-heading`**
- `font-size: 2rem; font-weight: 700; color: #f0f0f0`
- Matches `.card-name` weight and brightness

**`.welcome-instructions`**
- `font-size: 1.1rem; color: #e0e0e0; line-height: 1.6; max-width: 320px`
- "Boros" should be visually distinguished — wrap in `<strong>` or `<em>` for gentle emphasis. Suggest `<em>` for a soft italic rather than bold, keeping the tone warm not instructional.

**`.welcome-subtext`**
- `font-size: 0.95rem; color: #888`
- Matches `.progress-counter` and `.session-end-label` muted style
- Communicates that this is a soft ritual, not a rule

**`.welcome-button`**
- Modeled on `.self-assessment-button` — prominent, rounded, bordered
- `font-size: 1.1rem; font-weight: 600; color: #e0e0e0`
- `background: #2a2a3e; border: 2px solid #444; border-radius: 12px`
- `padding: 0.9rem 2rem; cursor: pointer`
- Hover: `background: #35355a; border-color: #666` (matches self-assessment hover)
- Active: `transform: scale(0.97)` (consistent micro-interaction)
- `-webkit-tap-highlight-color: transparent` (mobile consistency)

**Do NOT use `.control-button`** for this — that style is small and muted. The welcome CTA should feel welcoming and inviting.

---

## Interaction Notes

- No auto-focus needed. The button is the only interactive element.
- The button click triggers the session start (existing behavior).
- No keyboard shortcut needed on this screen — keep it simple for new users.
- Screen should fade/animate out naturally by being replaced with the first card (existing card animation handles this).
- No back button or way to return to welcome mid-session — the session end screen is the natural resting point.

---

## Accessibility Notes

- Heading uses `<h1>` semantic element.
- Button uses `<button>` (not `<div>`).
- Color contrast: `#e0e0e0` on `#1a1a2e` background — passes WCAG AA for normal text.
- Muted `#888` subtext on `#1a1a2e` — borderline for small text; acceptable given it's supplementary information.

---

## Design Rationale

The welcome screen should feel like the first card of the deck, not a configuration screen. Keeping it minimal — heading, two short paragraphs, one button — respects the app's existing lean aesthetic.

The "say it out loud" line is placed as subtext because it's a ritual, not a rule. New users don't need to understand it immediately; it becomes clear once they're in the session.

"Learn guild names" was chosen as the button label over "Start" or "Begin" because it names the actual goal, which orients the user before the first card appears.
