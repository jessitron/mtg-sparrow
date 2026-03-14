/**
 * Cylinder scroll transition module.
 *
 * Given (spiralLength, stopRemaining), computes:
 * - Start/end CSS values for paperStripHeight, coilRectTop, coilRectHeight
 * - A cubic-bezier() timing function for each property
 * - Suggested animation duration
 *
 * The bezier params are interpolated from a lookup table keyed by
 * the ratio stopRemaining/spiralLength. This ratio is the only
 * variable that meaningfully affects the curve shape.
 *
 * No DOM access — safe to run in Node for testing.
 */

import { computeScaffold, computeProjection, thetaToArcLength } from './cylinder-projection.js';

// ============================================================
// Bezier lookup table: ratio → bezier params
// ============================================================
// Fitted from 800px spiral at various stopRemaining values.
// Same-ratio different-length combos produce near-identical params
// (spread < 0.007), confirming ratio is the right key.

const BEZIER_TABLE = {
  // Each entry: [ratio, x1, y1, x2, y2]
  paperStripHeight: [
    [0.0125, 0.435, 0.094, 0.395, 1.067],
    [0.0250, 0.433, 0.087, 0.405, 1.057],
    [0.0375, 0.434, 0.084, 0.413, 1.053],
    [0.0500, 0.431, 0.077, 0.422, 1.049],
    [0.0750, 0.432, 0.071, 0.433, 1.039],
    [0.1000, 0.432, 0.067, 0.443, 1.033],
    [0.1250, 0.432, 0.063, 0.450, 1.026],
    [0.1500, 0.434, 0.061, 0.458, 1.026],
    [0.1875, 0.437, 0.058, 0.466, 1.018],
    [0.2500, 0.441, 0.055, 0.476, 1.010],
    [0.3125, 0.451, 0.064, 0.463, 0.968],
    [0.3750, 0.449, 0.050, 0.491, 0.998],
  ],
  coilRectTop: [
    [0.0125, 0.430, 0.084, 0.409, 1.069],
    [0.0250, 0.433, 0.083, 0.411, 1.047],
    [0.0375, 0.434, 0.080, 0.415, 1.032],
    [0.0500, 0.432, 0.075, 0.428, 1.042],
    [0.0750, 0.433, 0.070, 0.438, 1.035],
    [0.1000, 0.428, 0.058, 0.450, 1.032],
    [0.1250, 0.434, 0.062, 0.454, 1.023],
    [0.1500, 0.434, 0.058, 0.462, 1.024],
    [0.1875, 0.438, 0.057, 0.469, 1.016],
    [0.2500, 0.442, 0.054, 0.478, 1.007],
    [0.3125, 0.448, 0.053, 0.485, 1.006],
    [0.3750, 0.450, 0.049, 0.493, 0.997],
  ],
  // coilRectHeight is stable enough for a single bezier across all ratios
  coilRectHeight: null,
};

const FIXED_COIL_HEIGHT_BEZIER = [0.478, 0.031, 0.521, 0.969];

// ============================================================
// Interpolation
// ============================================================

function interpolateBezier(table, ratio) {
  if (!table) return FIXED_COIL_HEIGHT_BEZIER;

  // Clamp to table range
  if (ratio <= table[0][0]) return table[0].slice(1);
  if (ratio >= table[table.length - 1][0]) return table[table.length - 1].slice(1);

  // Find bracketing entries
  let lo = 0;
  for (let i = 1; i < table.length; i++) {
    if (table[i][0] >= ratio) { lo = i - 1; break; }
  }
  const hi = lo + 1;

  const t = (ratio - table[lo][0]) / (table[hi][0] - table[lo][0]);

  return [
    table[lo][1] + t * (table[hi][1] - table[lo][1]),  // x1
    table[lo][2] + t * (table[hi][2] - table[lo][2]),  // y1
    table[lo][3] + t * (table[hi][3] - table[lo][3]),  // x2
    table[lo][4] + t * (table[hi][4] - table[lo][4]),  // y2
  ];
}

// ============================================================
// Main API
// ============================================================

/**
 * Compute everything needed for a pure CSS scroll-unroll transition.
 *
 * @param {object} options
 * @param {number} options.spiralLength - Total arc length of the spiral (px)
 * @param {number} options.stopRemaining - Remaining coiled length at full unroll (px)
 * @param {number} [options.strokeWidth=6] - Spiral stroke width (px)
 * @param {number} [options.turnGap=6] - Gap between turns (px)
 * @param {number} [options.svgPadding=20] - SVG padding (px)
 * @param {number} [options.zDepth=600] - Paper depth / scroll width (px)
 * @param {number} [options.duration=1500] - Animation duration (ms)
 *
 * @returns {object} Transition parameters:
 *   .paperStrip   { start, end, bezier: [x1,y1,x2,y2], css: string }
 *   .coilTop      { start, end, bezier: [x1,y1,x2,y2], css: string }
 *   .coilHeight   { start, end, bezier: [x1,y1,x2,y2], css: string }
 *   .container     { height: number }
 *   .duration      number (ms)
 *   .zDepth        number (px)
 */
function computeTransition(options) {
  const {
    spiralLength,
    stopRemaining,
    strokeWidth = 6,
    turnGap = 6,
    svgPadding = 20,
    zDepth = 600,
    duration = 1500,
  } = options;

  const ratio = stopRemaining / spiralLength;

  // Compute start (fully rolled) and end (fully unrolled) values
  const scaffold = computeScaffold({ strokeWidth, turnGap, spiralLength, stopRemaining, svgPadding });

  const startProj = computeProjection(0, scaffold);
  const endUnrolledLength = thetaToArcLength(scaffold.thetaStop, scaffold);
  const endProj = computeProjection(endUnrolledLength, scaffold);

  // Interpolate bezier params from ratio
  const paperBezier = interpolateBezier(BEZIER_TABLE.paperStripHeight, ratio);
  const topBezier = interpolateBezier(BEZIER_TABLE.coilRectTop, ratio);
  const heightBezier = interpolateBezier(BEZIER_TABLE.coilRectHeight, ratio);

  function fmt(b) {
    return `cubic-bezier(${b.map(v => v.toFixed(3)).join(', ')})`;
  }

  return {
    paperStrip: {
      start: startProj.paperStripHeight,
      end: endProj.paperStripHeight,
      bezier: paperBezier,
      css: fmt(paperBezier),
    },
    coilTop: {
      start: startProj.coilRectTop,
      end: endProj.coilRectTop,
      bezier: topBezier,
      css: fmt(topBezier),
    },
    coilHeight: {
      start: startProj.coilRectHeight,
      end: endProj.coilRectHeight,
      bezier: heightBezier,
      css: fmt(heightBezier),
    },
    container: {
      height: startProj.containerHeight,
    },
    anchorY: scaffold.anchorY,
    duration,
    zDepth,
  };
}

export { computeTransition, interpolateBezier, BEZIER_TABLE, FIXED_COIL_HEIGHT_BEZIER };
