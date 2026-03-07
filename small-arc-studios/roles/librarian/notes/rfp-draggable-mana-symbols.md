# RFP: Draggable Mana Symbols

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-07
**Client**: Jessitron
**Version**: Draft for Review

---

## Executive Summary

Add click-and-drag (mouse) and touch-and-drag (mobile) interaction to the mana gas simulation on the welcome screen. Users can grab a mana symbol, move it to a new position, and release it with momentum. This makes the gas simulation interactive and playful, and sets the stage for manually triggering encounter detection (currently two-color guilds, with three-color combos planned separately).

---

## Problem Statement

The mana gas simulation is currently passive — symbols float and collide on their own. The user can fan them (randomize velocities) or pause, but cannot directly interact with individual symbols. When testing encounter detection (e.g., pushing two colors together to see a guild name), the user must wait for collisions to happen naturally, which is slow and frustrating.

---

## Goals

1. Let users grab and drag individual mana symbols on the welcome screen canvas.
2. On release, impart momentum based on the drag gesture so symbols "throw" naturally.
3. Support both mouse (desktop) and touch (mobile) interaction.
4. Dragged symbols should still participate in the physics simulation (collisions, boundary bouncing) after release.
5. Maintain the existing gas aesthetics and feel.

---

## Constraints

- The gas simulation is a standalone vanilla JS file (`mana-gas.js`) — no framework dependencies.
- Canvas-based rendering — hit detection must use coordinate math, not DOM events on elements.
- Must not break existing stop/fan button behavior.
- Mobile touch should feel natural (no long-press delay, no interference with page scroll if applicable).

---

## Candidate Arcs

### Arc A: Mouse drag interaction
- `mousedown` hit-tests particles, locks one to cursor
- `mousemove` updates position while dragged
- `mouseup` releases with velocity derived from recent movement
- Dragged particle skips physics updates while held
- Telemetry: `gas.drag_start`, `gas.drag_release` with color and velocity

### Arc B: Touch drag interaction
- `touchstart` / `touchmove` / `touchend` mirror mouse behavior
- Prevent default to avoid scroll interference on the canvas
- Same velocity-on-release behavior
- May be combined with Arc A if implementation is straightforward

---

## Observability

- Telemetry spans for drag interactions (start, release, color, release velocity)
- Existing gas simulation telemetry (if any) unaffected

---

## Open Questions

1. Should there be a visual indicator that a symbol is "grabbed" (e.g., slight scale-up, glow, reduced transparency)?
2. Should dragged symbols push other symbols out of the way, or pass through them while held?

---

## Recommendation

This is a small, self-contained enhancement to `mana-gas.js`. If mouse and touch implementations are similar enough, a single arc may suffice. The Project Lead recommends scoping as one arc with both input methods, splitting only if touch interaction proves significantly more complex.
