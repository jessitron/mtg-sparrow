# SOW: Draggable Mana Symbols

**Prepared by**: Small Arc Studio, Project Lead
**Date**: 2026-03-07
**Client**: Jessitron
**RFP Reference**: rfp-draggable-mana-symbols.md

---

## Scope

Add drag interaction (mouse and touch) to mana gas symbols on the welcome screen. Dragged symbols collide with others (pool ball sliding), appear slightly larger with a shadow while held, and release with momentum.

---

## Design Decisions (from RFP review)

- **Visual feedback**: Grabbed symbol scales up slightly and gains a drop shadow ("picked up off the table")
- **Collision while dragging**: Yes — dragged symbol pushes others aside like a pool ball sliding across the table
- **Release momentum**: Velocity derived from recent drag movement, so the symbol "throws" on release

---

## Planned Arcs

### Arc 32: Draggable Mana Symbols

**Type**: Feature
**Scope**: `mana-gas.js` only

**Acceptance Criteria**:
1. Mouse: `mousedown` on a symbol grabs it; `mousemove` drags; `mouseup` releases
2. Touch: `touchstart` / `touchmove` / `touchend` mirrors mouse behavior
3. Grabbed symbol renders ~20% larger with a drop shadow
4. Dragged symbol collides with and pushes other symbols (pool ball physics)
5. On release, symbol continues moving with velocity from the drag gesture
6. Released symbol returns to normal size/shadow and rejoins standard physics
7. Existing stop and fan buttons still work correctly
8. Encounter detection (guild name bubbles) works normally when dragged symbols meet others

**Observability**:
- Telemetry span: `gas.drag` with attributes: `color`, `duration_ms`, `release_velocity`
- Structural marker: not required (no version change — enhancement to existing standalone JS)

**Verification**:
- Manual: drag a symbol into another, see collision + guild name bubble
- Playwright: TBD by tester (canvas interaction may require coordinate-based mouse events)
- Honeycomb: `gas.drag` spans visible in sparrow-deck environment

---

## Timeline

One arc. Single delivery.

---

## Pause Cadence

Review after Arc 32 completion. This is a standalone engagement.
