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

## Files created
- `cylinder-prototype.html` — full simulation with SVG spiral + CSS projection
- `cylinder-css-prototype.html` — CSS-only prototype using the transition module
- `cylinder-projection.js` — pure computation module
- `cylinder-transition.js` — CSS transition parameter module
- `tests/cylinder-projection.test.mjs` — regression tests
- `tests/cylinder-projection-graph.mjs` — graph generation
- `tests/cylinder-bezier-fit.mjs` — bezier fitting with Nelder-Mead optimization
- `tests/cylinder-bezier-by-ratio.mjs` — ratio analysis
- Various report .txt, .csv, .html outputs in tests/

## What's next
- "Spiral length" should control paper amount in CSS prototype
- Content inside the paper strip
- Integration with the app
