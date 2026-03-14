# Session 2026-03-14: Cylinder/Scroll Prototype

## What we built

An animation prototype for a scroll unrolling, with two views:
1. **Top-down SVG spiral** — Archimedean spiral that unrolls into a straight line along a wall
2. **Side CSS projection** — paper strip + cylinder rectangle showing the scroll from the side

## Key decisions and discoveries

### Spiral mechanics
- Archimedean spiral (like the app logo), drawn counterclockwise, rolls clockwise (down the wall)
- Drawing direction and rolling direction are independent concerns — decoupled in the code
- Outermost point anchored on the left (wall), straight line extends downward

### Animation physics
- **Constant angular velocity** is more physical than constant arc-length velocity
- Paper unrolls faster when coil is large (more circumference per revolution), slower when small
- Ease-in-out applied on top of angular velocity for smooth start/stop
- The ratio `stopRemaining / spiralLength` is the key variable for curve shape

### Pure computation extraction
- `cylinder-projection.js` — pure functions (no DOM): `computeScaffold()`, `computeProjection()`, `thetaToArcLength()`
- Regression tests: 42 assertions across 6 param sets × 5 unroll percentages
- Graphs script generates CSV + HTML visualization of all curves

### CSS bezier fitting
- Fitted cubic-bezier() curves to approximate the spiral-based animation
- `coilRectHeight` fits perfectly with a single fixed bezier (~0.5px error)
- `paperStripHeight` and `coilRectTop` need bezier params interpolated from the ratio
- Lookup table with 12 ratio points, linear interpolation between them
- Max error: ~0.6% normalized, scales with absolute pixel range

### Module: cylinder-transition.js
- `computeTransition({ spiralLength, stopRemaining })` → start/end values + cubic-bezier strings
- Uses `cylinder-projection.js` for geometry, interpolates beziers from ratio table
- Enables pure CSS transitions — no per-frame JS needed

### Stroke/gap sensitivity
- Bezier table was built at strokeWidth=6, turnGap=6
- Tested across 1/1 to 12/16 — max error ~12px only at extremes, typically under 8px
- Single bezier table sufficient for all stroke/gap combos

## Files created
- `cylinder-prototype.html` — full simulation with SVG spiral + CSS projection
- `cylinder-css-prototype.html` — CSS-only prototype using the transition module
- `cylinder-projection.js` — pure computation module (no DOM)
- `cylinder-transition.js` — CSS transition parameter module (the end product)
- `tests/cylinder-projection.test.mjs` — 42 regression assertions
- `tests/cylinder-projection-graph.mjs` — graph generation (CSV + HTML)
- `tests/cylinder-bezier-fit.mjs` — bezier fitting with Nelder-Mead optimization
- `tests/cylinder-bezier-by-ratio.mjs` — ratio→bezier analysis
- `tests/cylinder-fixed-bezier-report.mjs` — fixed bezier error measurement
- `tests/cylinder-stroke-gap-sensitivity.mjs` — stroke/gap impact on approximation
- Various report .txt, .csv, .html outputs in tests/

## Decisions recorded
DEC-152 through DEC-159 in the decision log.

## Process notes
- Drawing direction and rolling direction were tangled — took several iterations to get both right independently. The key was decoupling them: spiral point generation controls drawing, positioning logic controls rolling.
- The bezier fitting initially had a degenerate local minimum (x1=1.0) for 400/30 — multi-start optimization fixed it. Always use multiple starting points with Nelder-Mead.
- The paper strip's top edge is at the anchor point (tangent to coil), NOT the top of the coil. This was a conceptual confusion that the client caught.

## What's next
- Content inside the paper strip (the paper div is already content-ready)
- Integration with the app — use `computeTransition()` to animate page reveals
- Consider whether easing should be configurable or always ease-in-out
