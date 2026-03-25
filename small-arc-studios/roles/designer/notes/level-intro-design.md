# Level Intro Slide — Design Specification
## Arc 44

**Date:** 2026-03-25
**Status:** Ready for implementation

---

## Purpose

Before the quiz cards begin, show the user which level they are entering and list the five combo names they will see. This sets expectations, primes memory (a learning technique), and gives the user a moment to orient before the first card appears.

This is a single, dismissible screen. It is not a persistent reference — it disappears completely when dismissed and never reappears during the session.

---

## Level Identity

| Subgroup | Level Number | Combo Names |
|----------|-------------|-------------|
| allied   | 1           | Azorius, Dimir, Rakdos, Gruul, Selesnya |
| enemy    | 2           | Orzhov, Izzet, Golgari, Boros, Simic |
| wedges   | 3           | Abzan, Jeskai, Sultai, Mardu, Temur |
| shards   | 4           | Bant, Esper, Grixis, Jund, Naya |

The combo names and their order must be read from the same source arrays used by `session.ts` (`alliedGuilds`, `enemyGuilds`, `wedges`, `shards` from `src/data/combos.ts`), in array order. Do not hardcode the names.

---

## 1. Layout and Visual Hierarchy

The slide is a full-viewport overlay. It sits in `#app`, replacing the card content before `startSession()` is called. It is removed when dismissed, and `startSession()` proceeds.

```
+-----------------------------------------------+
|                                                |
|                                                |
|              LEVEL 1                           |
|           (large, centered)                    |
|                                                |
|           Allied Guilds                        |
|           (subtitle, centered, muted)          |
|                                                |
|      Azorius   Dimir   Rakdos                  |
|           Gruul   Selesnya                     |
|      (names, centered, comfortable spacing)    |
|                                                |
|                                                |
|         tap or press space to begin            |
|         (small, muted, bottom-centered)        |
|                                                |
+-----------------------------------------------+
```

The layout uses a flex column with `justify-content: center; align-items: center` filling the viewport. The three content zones (level number, names list, CTA hint) are separated by substantial vertical space.

The names are arranged in a wrapping centered row — not a vertical list, not a grid. This is intentional: a list invites scanning and memorization; a loose arrangement feels more like a preview. The names wrap naturally at narrow widths.

---

## 2. Typography

### "LEVEL N"
- Font: Jost (the body sans-serif already loaded on the page)
- Weight: 800 (the heaviest available in Jost; if not loaded, 700)
- Size: `clamp(3rem, 10vw, 5.5rem)`
- Transform: `uppercase` (or write it uppercase in the DOM — "LEVEL 1")
- Color: `#f0f0f0`
- Letter spacing: `0.15em` — the wide tracking gives a title-card authority that distinguishes this from card content
- No GoudyMediaeval here. GoudyMediaeval is for card names (the answer); Jost for structure/UI chrome. "LEVEL N" is structure.

### Subtitle (level category name)
- Font: Jost
- Weight: 400
- Size: `1.1rem`
- Color: `#c8b88a` (the `--allied-line-color` / `--enemy-line-color` khaki tone from the palette — warm, not harsh)
- Letter spacing: `0.08em`
- Text: "Allied Guilds", "Enemy Guilds", "Wedges", or "Shards" — a human-readable label for the subgroup

### Combo names list
- Font: GoudyMediaeval, bold weight (these ARE the names the user will learn; using the same font as the card answers reinforces the association)
- Size: `clamp(1.2rem, 3.5vw, 1.6rem)`
- Color: `#e0e0e0`
- Letter spacing: `0.03em`
- The five names are separated by a middle-dot separator character ( · ) or a thin space and em-dash. Prefer a centered dot: visually quieter than commas.

  Example rendered line: `Azorius · Dimir · Rakdos · Gruul · Selesnya`

  At narrow widths this wraps. The container should be `max-width: min(90vw, 480px); text-align: center`.

### CTA hint
- Font: Jost
- Weight: 400
- Size: `0.85rem`
- Color: `#666` (same tone as `.progress-counter` and other tertiary text)
- Text: `tap anywhere · or press space`
- This should pulse subtly (see Animation section) to invite interaction without being urgent

---

## 3. Color and Styling

The slide should feel like it belongs in the existing dark-brown session context — not like a separate modal or splash screen.

### Container
- No card border-radius, no card box-shadow, no `.card` class
- Background: transparent (the existing radial gradient body background shows through)
- The slide sits directly in `#app`, which already has the centered flex layout

### No border, no box, no card chrome
The previous implementation (Arcs 42-43) used a scroll metaphor that was visually complex. This design deliberately avoids any container shape. The content floats on the dark background. This makes it feel like a cinematic title card rather than a dialog or panel.

### Level number accent
A single horizontal rule or decorative line is placed below "LEVEL N" — thin (1px), `width: clamp(60px, 12vw, 100px)`, color `#c8b88a` (the khaki accent). This visually anchors the level number without adding a surrounding box.

---

## 4. Animation and Transition

### Entrance
The entire intro block uses the existing `cardEnter` keyframe (opacity 0→1, scale 0.95→1, 250ms ease-out). This is consistent with how every card enters. No separate animation needed.

```css
animation: cardEnter 250ms ease-out;
```

### CTA hint pulse
The hint text pulses with a gentle opacity animation to invite interaction:

```css
@keyframes levelIntroHintPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.85; }
}
```
- Duration: `2.5s`
- Timing: `ease-in-out`
- Iteration: `infinite`
- Delay: `800ms` (let the entrance animation complete before pulsing begins)

### Dismissal
When dismissed (tap, click, or spacebar), the intro element should fade out quickly and be removed:

```css
@keyframes levelIntroDismiss {
  from { opacity: 1; }
  to   { opacity: 0; }
}
```
- Duration: `150ms`
- Timing: `ease-in`
- After the animation completes, remove the element from the DOM and call `startSession()`

There should be no slide or scale on dismissal — just a clean opacity fade. The subsequent card entrance (`cardEnter`) provides the positive visual transition into the session.

---

## 5. Call-to-Action

The CTA must be ambient, not demanding. The user should understand they need to act without feeling pressured.

**Text:** `tap anywhere · or press space`

Placement: vertically below the names list with generous separation (`margin-top: clamp(2rem, 5vh, 3.5rem)`). This should sit in the lower portion of the viewport without being stuck to the bottom edge.

The pulsing animation (above) does most of the work of saying "this is waiting for you." The text itself should be minimal.

**No button is rendered.** Consistent with the card interaction model: the entire viewport is the tap target. The CTA is informational only.

On mobile, omit "or press space" from the text. Use only `tap to begin`. The device type can be detected at render time or approximated via `window.matchMedia('(pointer: coarse)')`.

---

## 6. Mobile Considerations (600px breakpoint)

The `@media (max-width: 600px)` block in `slides.css` governs the existing mobile card layout. The level intro should follow the same breakpoint.

### At 600px and below:

- "LEVEL N" size: `clamp(2.5rem, 12vw, 3.5rem)` — scale down to prevent overflow
- Subtitle size: `1rem`
- Combo names: `clamp(1rem, 4vw, 1.3rem)` — ensure wrapping works gracefully
- The names will almost certainly wrap to multiple lines on very narrow screens. This is acceptable and expected. The wrapping behavior should be tested at 320px width.
- CTA hint text: `tap to begin` only (no spacebar mention)
- Vertical spacing between zones: reduce by ~25% to keep everything visible without scrolling. The entire intro must fit in a single viewport height. Use `min-height: 100svh` (safe area viewport height) if available, falling back to `100vh`.

### Touch targets
The entire `#app` area handles the tap, consistent with the card interaction. No special touch handling needed.

---

## 7. DOM Structure

Suggested structure, for developer reference:

```html
<div class="level-intro">
  <div class="level-intro-body">
    <p class="level-intro-number">LEVEL 1</p>
    <hr class="level-intro-rule" aria-hidden="true">
    <p class="level-intro-subtitle">Allied Guilds</p>
    <p class="level-intro-names">Azorius · Dimir · Rakdos · Gruul · Selesnya</p>
  </div>
  <p class="level-intro-cta">tap anywhere · or press space</p>
</div>
```

The `.level-intro-body` wrapper groups the three title elements so spacing between the body block and the CTA hint can be controlled independently.

---

## 8. CSS Class Summary

| Class | Purpose |
|-------|---------|
| `.level-intro` | Full-height flex column container, centers body + CTA |
| `.level-intro-body` | Groups level number, rule, subtitle, names |
| `.level-intro-number` | "LEVEL N" — large Jost uppercase |
| `.level-intro-rule` | Thin decorative hr under level number |
| `.level-intro-subtitle` | Subgroup category name in khaki |
| `.level-intro-names` | Five combo names in GoudyMediaeval |
| `.level-intro-cta` | Tap hint, muted, pulsing |
| `.level-intro--dismissing` | Applied on dismiss; triggers fade-out animation |

---

## 9. Implementation Notes for Developer

- The intro renders before `startSession()` is called. The existing `DOMContentLoaded` handler currently calls `startSession()` immediately. The intro should intercept this: render the intro, then call `startSession()` only when dismissed.
- The intro must NOT capture or block the existing `dialog-open` / `dialog-close` event listeners. If the settings menu is opened while the intro is showing, the intro should remain visible (not treated as a dialog interaction).
- The spacebar handler in `DOMContentLoaded` checks `if (session)` before calling `handleAdvance()`. During the intro, `session` is null, so a separate keydown handler is needed for the spacebar on this screen. It should be removed (or become a no-op) as soon as the intro is dismissed.
- The click handler on `#app` currently calls `handleAdvance()` only if `session` is truthy. During the intro phase, a separate click listener should dismiss the intro. Remove it when dismissed.
- Telemetry: emit a log event `session.level_intro_dismissed` with attribute `intro.dwell_ms` (time from intro render to dismissal). This gives visibility into how long users spend on this screen.

---

## Design Rationale

The previous attempt (Arcs 42-43) added a scroll metaphor and a persistent docked reference panel. It was reverted because it was too complex and didn't work cleanly. The core insight from that failure: the value is in the *preview before the session*, not in *reference during the session*. This design delivers only the preview.

The five names are shown in GoudyMediaeval because that is the font in which they will appear on the answer cards. Seeing them in the same typographic voice primes recognition — the brain registers the word shape, not just the spelling. This is subtle but consistent with the app's core technique of building automatic recall through exposure.

"LEVEL N" uses Jost (not GoudyMediaeval) to signal that this is structural UI, not content to memorize. Users should not feel they need to read "LEVEL 1" carefully.

No button is rendered because a button implies a considered decision. This is not a decision — it is an orientation pause. Tapping anywhere (the same interaction as advancing cards) reinforces that the user is already in the session mode.
