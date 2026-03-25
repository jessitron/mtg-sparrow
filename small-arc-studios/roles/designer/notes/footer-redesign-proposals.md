# Footer Redesign — Slides Page

**Date:** 2026-03-25
**Trigger:** Client request to rearrange the footer, add combo name reference row, and consider pause button positioning.
**Status:** CHOSEN DIRECTION approved by client (see top section). Original proposals preserved below for context.

---

## Chosen Direction — Client-Approved Layout

Two rows below the card.

### Row 1: Names Reference

```
  Azorius · Orzhov · Boros · Selesnya · Simic        [hide]
```

- Five combo names with middle-dot separators, matching the level intro screen aesthetic
- Font: GoudyMediaeval, bold, same as `.level-intro-names`
- Color: muted (#e0e0e0 at ~0.6 opacity) — reference, not headline
- `[hide]` toggle right-aligned, minimal styling (0.7rem, #555)
- When hidden, names text disappears but toggle stays right-aligned in the same position, text changes to `[show names]`
- Default: visible on first session at a level; preference persisted to localStorage by level slug
- **Visible from card 1** — this is reference for the session, not a reward for progress

### Row 2: Controls

```
                                        2/25  [⏸]  [Exit]
```

- Everything right-aligned — nothing on the left
- **Right cluster** (left to right): Card counter ("2/25", muted #888, 0.9rem), pause button, "Exit" button
- Counter reads as context for the controls beside it

### Pause Button Styling

The pause button is styled to match the home screen gas buttons (`.gas-btn`):

- **Size**: 48px (scaled down from 64px to fit footer context — 64px would dominate the row)
- **Shape**: Circular, `border-radius: 50%`
- **Background**: `rgba(255,255,255,0.08)` (matching `.gas-btn`)
- **Border**: `1px solid rgba(255,255,255,0.25)` (matching `.gas-btn`)
- **Icon**: SVG pause bars (two vertical rectangles), same as `#gas-stop-btn` on the home screen
- **Hover**: `background: rgba(255,255,255,0.2)`
- **When paused**: border tint shifts to indicate active state (e.g., turquoise border like `rgba(100,200,200,0.6)`)
- **Position**: In the footer grid, NOT `position: fixed` — it flows with the layout
- **Resume state**: SVG swaps to a play triangle icon

### "Exit" Button

- Label: "Exit" (replaces "Done for now" — shorter, clearer)
- Styling: current `.done-button` treatment (turquoise accent border, 1.1rem, prominent)
- Hidden on card 1, fades in on card 2+ (existing `buttonFadeIn` animation)
- Far right position in the controls cluster

### CSS Layout

```css
/* Names row */
.footer-names {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

/* Controls row — everything right-aligned */
.footer-controls {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}
```

### Desktop Layout (wider than 600px)

```
┌───────────────────────────────────────────────────┐
│                                                   │
│               [ CARD CONTENT ]                    │
│                                                   │
├───────────────────────────────────────────────────┤
│ Azorius · Orzhov · Boros · Selesnya · Simic [hide]│  ← names row
├───────────────────────────────────────────────────┤
│                                 2/25 [⏸] [Exit]  │  ← controls row (right-aligned)
└───────────────────────────────────────────────────┘
```

### Mobile Layout (under 600px)

```
┌─────────────────────────────┐
│                             │
│      [ CARD CONTENT ]       │
│                             │
├─────────────────────────────┤
│ Azorius · Orzhov · Boros    │  ← names wrap to
│ · Selesnya · Simic   [hide] │     two lines (OK)
├─────────────────────────────┤
│               2/25 [⏸] [Exit]│  ← controls (right-aligned)
└─────────────────────────────┘
```

- Names may wrap to two lines on narrow screens — acceptable, row auto-sizes
- Controls row stays single-line
- Pause button scales to 40px on mobile for tighter fit
- All interactive elements maintain 44px minimum touch target

### Interaction Notes

- All footer controls use `stopPropagation` to prevent accidental card advance
- Counter and pause visible from card 1
- "Exit" fades in on card 2+
- Pause/resume toggles the SVG icon (pause bars ↔ play triangle)
- Names toggle is instant (no animation needed — it's reference, not drama)

---

## Original Proposals (for context)

The following proposals were explored before the client chose the direction above.

---

## Context: What Exists Now

The current `.done-zone` is a 3-column grid (`1fr auto 1fr`):

- Left: Pause button + progress counter ("3 / 10")
- Center: "Done for now" button (fades in after card 2)
- Right: Empty spacer

The pause button is subtle (`.control-button` — 0.75rem, #777 text, transparent bg). The "Done for now" button is prominent (`.done-button` — larger, turquoise accent border).

The level intro screen shows the combo names separated by middle dots: `Azorius · Orzhov · Boros · Selesnya · Simic` in GoudyMediaeval, bold, centered.

The home screen has gas-control buttons fixed bottom-right (`position: fixed; bottom: 30px; right: 110px`).

---

## What Must Be Preserved

- Pause button
- Card counter (N / total)
- "Done for now" button (hidden on card 1, fades in on card 2+)
- All footer controls must `stopPropagation` — the entire card area advances the session

---

## Design Principles (Abbreviated)

- The card is the star. Controls must not distract.
- Zero required actions — tapping is an accelerator, not a gate.
- Trust the learner. Don't patronize.
- Mobile-first — many users on phones.

---

## The Names Reference Problem

The five combo names (e.g., `Azorius · Orzhov · Boros · Selesnya · Simic`) serve a different purpose than the controls — they are **reference content**, not UI chrome. The learner can glance at the list to check their own answer or orient themselves in the level.

Key design tension: this content is most valuable early in a session (learner is still building associations) and least valuable later (recognition is forming). But we cannot know when any individual learner no longer needs it. Therefore the toggle must be easy, and the default state matters.

**Default state recommendation:** Names visible by default for first session at a level. User can hide. Their preference should persist across session within a level (localStorage by level slug).

---

## Proposal A: Stacked Footer — Names Above Controls

The names row and the controls row stack vertically. Names sit closest to the card; controls sit at the very bottom edge.

```
┌─────────────────────────────────────────┐
│                                         │
│            [ CARD CONTENT ]             │
│                                         │
│ ─────────────────────────────────────── │
│  Azorius · Orzhov · Boros · Selesnya   │  ← names row
│  · Simic                        [hide] │
│ ─────────────────────────────────────── │
│  ⏸  3 / 10          Done for now       │  ← controls row
└─────────────────────────────────────────┘
```

When names are hidden:

```
┌─────────────────────────────────────────┐
│                                         │
│            [ CARD CONTENT ]             │
│                                         │
│ ─────────────────────────────────────── │
│  [show names]                           │  ← collapsed row, just the toggle
│ ─────────────────────────────────────── │
│  ⏸  3 / 10          Done for now       │  ← controls row (unchanged)
└─────────────────────────────────────────┘
```

**Visual hierarchy:**

- Names row: GoudyMediaeval font (matching intro screen), muted opacity (~0.6) so it reads as reference, not headline. Middle-dot separators match the intro screen aesthetic — familiar cadence.
- [hide] / [show names]: minimal, right-aligned, 0.7rem, #555 — nearly invisible until needed. A tap target, not a label.
- Controls row: unchanged from current layout except the pause button moves to left, counter stays left, "Done for now" moves right (natural left-to-right reading: status → action).

**Toggle behavior:**

- Tap [hide] to collapse names row to a single-line stub showing [show names] at minimum tap height (44px).
- Preference persisted to localStorage keyed by level slug.
- No animation needed — instant collapse is fine; the names are reference, not drama.

**Pause button position:**

- Keep in the footer. The home-screen gas controls live in a different visual world (background animation controls). Mixing them would blur the metaphor. The footer pause fits the "session controls" mental model.

**Mobile considerations:**

- On narrow screens, the names may wrap to two lines. That is acceptable — the names row auto-sizes. The control row stays single-line.
- The two-row structure adds ~40-60px of height total. On a 667px-tall iPhone SE, this is about 9% of screen height. Acceptable if the card shrinks gracefully.
- Both rows are `position: sticky` or `fixed` — no scrolling required.

**Tradeoffs:**

- Pro: Clean separation of "reference" (names) vs. "controls" (pause, counter, done). They can breathe.
- Pro: Names placement near the card is spatially logical — glance down from card to see names.
- Con: Adds footer height. On very small phones (SE-class), this competes with card height.
- Con: Two visual zones might feel like two different UI elements rather than one coherent footer.

---

## Proposal B: Integrated Bar — Names Inline with Controls

A single unified bar. Names are the center content. Controls bracket them.

```
┌─────────────────────────────────────────┐
│                                         │
│            [ CARD CONTENT ]             │
│                                         │
│ ─────────────────────────────────────── │
│ ⏸ 3/10  Azorius · Orzhov · Boros ···  Done for now │
└─────────────────────────────────────────┘
```

When names are hidden (tap the names area to toggle):

```
┌─────────────────────────────────────────┐
│            [ CARD CONTENT ]             │
│ ─────────────────────────────────────── │
│ ⏸ 3/10       · · ·                Done for now │
└─────────────────────────────────────────┘
```

The middle dots become a "collapsed" indicator — three dots to suggest "there is content here." Tapping them expands to show the full names inline.

**Visual hierarchy:**

- Left: Pause + counter (tight cluster, small, control-button style)
- Center: Names in GoudyMediaeval, smaller than the intro screen version (~0.8rem), muted. Center-justified in the available space. Names overflow-ellipsis or scroll on very narrow screens.
- Right: "Done for now" button (accent border, prominent)
- The names zone is the natural center of gravity — it draws the eye but stays quiet.

**Toggle behavior:**

- Tap anywhere in the names zone to toggle. The names zone has a subtle tap affordance (perhaps a very faint underline or [·] indicator).
- Collapsed state: shows `· · ·` centered, still tappable.
- No explicit [show] / [hide] label — the interaction is discoverable by accident and doesn't need instruction.

**Pause button position:**

- Remains in footer left.

**Mobile considerations:**

- This is aggressive on a narrow screen. Five names plus middle dots plus pause plus counter plus "Done for now" is a lot of content in a single row.
- On screens under 375px wide, the names would need aggressive truncation: "Azorius · Orzhov ···" with the rest hidden.
- The single-bar approach saves vertical height — only one row of footer chrome.

**Tradeoffs:**

- Pro: Minimum footer height — single row. Maximizes card space.
- Pro: Unified visual feel — everything in one place.
- Con: Overcrowded on small screens. The names are the casualty — they shrink until unreadable.
- Con: Toggle affordance is implicit. Users who don't notice the `· · ·` won't know names are available.
- Con: Names in GoudyMediaeval at 0.8rem on a dark background may be too small to read quickly.

**Verdict:** Elegant on desktop, fragile on mobile. Not recommended as primary approach for a mobile-first app.

---

## Proposal C: Names as Drawer Above Footer, Pause Relocated to Corner

Inspired by the home-screen gas controls — the pause button moves to a **fixed bottom-right position** (matching home screen), and the footer shrinks to counter + "Done for now." The names become a **pull-up drawer** that lives just above the footer.

```
┌─────────────────────────────────────────┐
│            [ CARD CONTENT ]             │
│                                         │
│                                         │  ← drawer handle (collapsed)
│ ─────────── ↑ names ─────────────────── │
│  3 / 10              Done for now    ⏸ │  ← footer bar
└─────────────────────────────────────────┘
                                       (⏸ is fixed bottom-right, home-screen style)
```

Drawer open:

```
┌─────────────────────────────────────────┐
│            [ CARD CONTENT ]             │
│ ─────────────────────────────────────── │
│  Azorius · Orzhov · Boros · Selesnya   │
│  · Simic                           [▼] │  ← tap to close
│ ─────────────────────────────────────── │
│  3 / 10              Done for now    ⏸ │
└─────────────────────────────────────────┘
```

Pause button is `position: fixed; bottom: 30px; right: 30px` — same position as home screen gas controls, but a different icon (pause symbol, not a flame/freeze icon). This creates spatial consistency between sessions.

**Visual hierarchy:**

- Footer bar: binary. Left = where I am (counter). Right = what I can do (Done for now). Pause is in its own fixed layer, separate from session-flow controls.
- Drawer handle: a subtle `↑ names` or just a `───` line the user can tap. Low visual weight. The closed drawer is a line, not a button.
- Drawer open: Names in their full intro-screen treatment — GoudyMediaeval, middle dots, centered. Same font and layout as the level intro, so the reference feels like a callback to "what I was shown before this started."

**Toggle behavior:**

- Tap the drawer handle (the line or a small `↑` indicator) to open.
- Tap [▼] or anywhere in the names area to close.
- Drawer slides up with a short `200ms ease-out` transition (not elaborate, just oriented).
- Default: open for first session at a level. Auto-closes after 10 cards if the user hasn't interacted with it (they've probably internalized the names or stopped needing reference). Only auto-close once — if the user manually reopens, don't auto-close again.

**Pause button position:**

- This is the proposal that actually explores the home-screen position.
- **Argument for it:** The pause button applies to the background animation (freeze the stars/particles). Its position on the home screen is tied to that function. Moving it to the footer on the slides page would mean two different positions for "the same button" that does different things in different contexts. That inconsistency might be worse than the current inconsistency.
- **Argument against it:** The home screen pause is for the ambient animation. The slides page pause is for the session (a very different thing). Having them in the same visual position could create confusion — "does this pause the animation or my session?"
- **Recommendation:** Keep the pause button in the footer for the slides page. The position should match function, not form. These are not the same control.

**Mobile considerations:**

- The footer bar is single-row — minimum height. Most of the screen is available for the card.
- The drawer overlay appears in front of the card when open — this is fine because the user opened it intentionally.
- The fixed pause button at bottom-right: ensure it has at least 44px touch target and doesn't overlap with the "Done for now" button. Right: 20px, bottom: 20px with enough clearance.
- The drawer handle needs a tall enough tap target. A 32px invisible tap zone above the footer line is sufficient.

**Tradeoffs:**

- Pro: Footer is as minimal as possible. Card dominates.
- Pro: Names get their full treatment when visible — same font, same dots, same feel as the intro. This creates a strong callback ("these are the names I saw before").
- Pro: Auto-close behavior honors the "less UI over time" principle — the reference fades as it becomes less needed.
- Con: Drawer pattern adds interaction complexity. Users on a fast mobile session may not discover the drawer handle.
- Con: The auto-close behavior could feel surprising or inconsistent. Needs care.
- Con: Two fixed-position elements (pause at corner, drawer handle) could collide on some screen sizes.

---

## Recommendation

**Proposal A (Stacked Footer)** is the strongest for this project's constraints:

1. Mobile-first clarity — two rows is more readable than one overcrowded row or a partially-hidden drawer.
2. The names row placement matches its semantic role: reference sits between the card content and the session controls, in reading order.
3. The toggle is explicit — [hide] / [show names] — no hidden interactions to discover.
4. Lowest implementation risk. No new interaction patterns (drawer, fixed layers).
5. The names row can adopt the GoudyMediaeval font and middle-dot separators from the intro screen, creating visual continuity between "what I was shown" and "what I can reference."

**On the pause button position:** Keep it in the footer. The home-screen controls serve the ambient background animation; the slides-page pause serves the session. They are different functions and should live in their different natural positions. Moving the pause to the fixed corner would create spatial consistency but semantic confusion.

**On the toggle default:** Names visible by default for the first session at each level. User-hidden state persists to localStorage by level slug. This respects the learner who already knows the names (hide immediately) and helps the learner who doesn't (shown automatically).

**On the counter format:** Suggest moving the counter to the right of the pause button (left cluster), and using a less prominent format: `3 · 10` or just `3/10` without the word "of" or "/". Frees center space for "Done for now" to sit cleanly right-justified.

---

## Revised Controls Row Layout (Proposal A Refined)

```
┌─────────────────────────────────────────┐
│  ⏸  3 / 10                Done for now │
└─────────────────────────────────────────┘
```

- Left cluster: pause icon + counter as a pair. Both are informational/secondary. The pause is a minimal icon, no text.
- Right: "Done for now" — the one action in this row. Right-aligned so thumb can reach it on mobile without crossing the screen.
- No center column needed — the space between left cluster and right button is natural whitespace.

CSS: `display: flex; justify-content: space-between; align-items: center;` — simpler than the current 3-column grid.

---

## Open Questions for the Project Lead

1. Should the names row be visible **before** card 1 (appears with the session) or **after** card 1 (same as the current "Done for now" fade-in pattern)?
   - Recommendation: visible immediately. The names are reference for the session, not a reward for progress.

2. Should the names in the reference row be **tappable** (tap a name to highlight which card just showed that combo)? This could be a future enhancement — note it, don't build it now.

3. The pause button currently does what exactly in the slides session? Pausing auto-advance? If the session doesn't have auto-advance (it's tap-driven), what does pause do? Clarify before implementation — the control may be vestigial.
