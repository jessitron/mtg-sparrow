/**
 * Pure computation module for the cylinder/scroll projection.
 *
 * Given spiral parameters and an unrolledLength value, computes the CSS
 * values needed to render the side projection (paper strip + coil rectangle).
 *
 * No DOM access — safe to run in Node for testing.
 */

// ============================================================
// Geometry helpers
// ============================================================

const ANGLE_STEP = 0.05; // radians per sample

function getBBox(pts) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Build an Archimedean spiral of a given arc length.
 * Returns points in outer-to-inner order, outermost on the LEFT (angle π).
 */
function buildCoilForLength(targetLength, spiralA, spiralB) {
  if (targetLength < 1) return [];
  const pts = [];
  let len = 0;
  let theta = 0;
  let r = spiralA + spiralB * theta;
  pts.push({ theta, r });

  while (len < targetLength) {
    theta += ANGLE_STEP;
    r = spiralA + spiralB * theta;
    const prev = pts[pts.length - 1];
    const dx = r * Math.cos(theta) - prev.r * Math.cos(prev.theta);
    const dy = r * Math.sin(theta) - prev.r * Math.sin(prev.theta);
    len += Math.sqrt(dx * dx + dy * dy);
    pts.push({ theta, r });
  }

  const thetaMax = pts[pts.length - 1].theta;
  const rot = Math.PI - thetaMax;

  const result = pts.map(p => ({
    x: p.r * Math.cos(p.theta + rot),
    y: p.r * Math.sin(p.theta + rot)
  }));

  result.reverse();
  return result;
}

// ============================================================
// Layout computation for the full spiral (needed once per param set)
// ============================================================

/**
 * Compute the "scaffold" — values that depend only on the spiral parameters,
 * not on unrolledLength. These are computed once and reused.
 */
function computeScaffold(params) {
  const { strokeWidth, turnGap, spiralLength, stopRemaining, svgPadding } = params;

  const spiralA = strokeWidth;
  const spiralB = (turnGap + strokeWidth) / (2 * Math.PI);

  // Build full spiral
  const fullPoints = buildCoilForLength(spiralLength, spiralA, spiralB);

  // Compute arc length of full spiral (outer to inner)
  fullPoints[0].arcLength = 0;
  for (let i = 1; i < fullPoints.length; i++) {
    const dx = fullPoints[i].x - fullPoints[i - 1].x;
    const dy = fullPoints[i].y - fullPoints[i - 1].y;
    fullPoints[i].arcLength = fullPoints[i - 1].arcLength + Math.sqrt(dx * dx + dy * dy);
  }
  const totalArcLength = fullPoints[fullPoints.length - 1].arcLength;

  const fullBBox = getBBox(fullPoints);
  const anchorPt = fullPoints[0]; // outermost, on the left
  const extentAboveAnchor = anchorPt.y - fullBBox.minY + strokeWidth / 2;
  const extentBelowAnchor = fullBBox.maxY - anchorPt.y + strokeWidth / 2;
  const fullCoilDiameter = (fullBBox.maxY - fullBBox.minY) + strokeWidth;
  const fullCoilWidth = (fullBBox.maxX - fullBBox.minX) + strokeWidth;
  const maxUnrollLength = totalArcLength - stopRemaining;

  const anchorY = svgPadding + extentAboveAnchor;

  const svgHeight = Math.max(
    anchorY + extentBelowAnchor + svgPadding,
    anchorY + maxUnrollLength + fullCoilDiameter + svgPadding
  );

  // Build theta-to-arc-length lookup table for angular animation.
  // Raw spiral goes from theta=0 (inner) to thetaMax (outer).
  // unrollAngle = thetaMax - theta; unrolledArcLength = totalRawArc - arcLength(theta).
  const rawTable = [];
  {
    let len = 0, th = 0, r = spiralA;
    rawTable.push({ theta: th, arcLength: 0 });
    while (len < spiralLength) {
      th += ANGLE_STEP;
      r = spiralA + spiralB * th;
      const prev = rawTable[rawTable.length - 1];
      const prevR = spiralA + spiralB * prev.theta;
      const dx = r * Math.cos(th) - prevR * Math.cos(prev.theta);
      const dy = r * Math.sin(th) - prevR * Math.sin(prev.theta);
      len += Math.sqrt(dx * dx + dy * dy);
      rawTable.push({ theta: th, arcLength: len });
    }
  }
  const thetaMax = rawTable[rawTable.length - 1].theta;
  const rawTotalArc = rawTable[rawTable.length - 1].arcLength;

  // unrollLookup: sorted by increasing unrollAngle
  const unrollLookup = rawTable.map(e => ({
    unrollAngle: thetaMax - e.theta,
    unrolledArcLength: rawTotalArc - e.arcLength,
  })).reverse();

  // Find theta corresponding to STOP_REMAINING
  const maxUnrolledArc = rawTotalArc - stopRemaining;
  let thetaStop = thetaMax;
  for (let i = 0; i < unrollLookup.length; i++) {
    if (unrollLookup[i].unrolledArcLength >= maxUnrolledArc) {
      thetaStop = unrollLookup[i].unrollAngle;
      break;
    }
  }

  return {
    spiralA,
    spiralB,
    totalArcLength,
    maxUnrollLength,
    anchorY,
    svgHeight,
    strokeWidth,
    stopRemaining,
    svgPadding,
    fullCoilDiameter,
    // Angular animation data
    thetaMax,
    thetaStop,
    unrollLookup,
  };
}

// ============================================================
// Per-frame projection computation
// ============================================================

/**
 * Compute the CSS projection values for a given unrolledLength.
 *
 * @param {number} unrolledLength - how much arc has been straightened (px)
 * @param {object} scaffold - output of computeScaffold()
 * @returns {object} CSS values for the side projection
 */
function computeProjection(unrolledLength, scaffold) {
  const {
    spiralA, spiralB, totalArcLength, maxUnrollLength,
    anchorY, svgHeight, strokeWidth, stopRemaining, svgPadding,
  } = scaffold;

  unrolledLength = Math.max(0, Math.min(unrolledLength, maxUnrollLength));

  const remainingLength = totalArcLength - unrolledLength;

  // Generate remaining coil
  const remainingPoints = buildCoilForLength(remainingLength, spiralA, spiralB);

  if (remainingPoints.length < 2) {
    return {
      paperStripMarginTop: anchorY,
      paperStripHeight: unrolledLength,
      coilRectTop: anchorY + unrolledLength,
      coilRectHeight: 0,
      coilDiameter: 0,
      containerHeight: svgHeight,
    };
  }

  const coilBBox = getBBox(remainingPoints);

  // Same computation as render() in the prototype
  const aY = anchorY;
  const lineEndY = aY + unrolledLength;

  const splitPt = remainingPoints[0];
  const txY = lineEndY - splitPt.y;

  const coilTopYSvg = coilBBox.minY + txY;
  const coilDiameter = Math.max(
    coilBBox.maxX - coilBBox.minX,
    coilBBox.maxY - coilBBox.minY
  ) + strokeWidth;

  return {
    paperStripMarginTop: aY,
    paperStripHeight: Math.max(0, unrolledLength),
    coilRectTop: coilTopYSvg,
    coilRectHeight: coilDiameter > strokeWidth * 2 ? coilDiameter : 0,
    coilDiameter,
    containerHeight: svgHeight,
  };
}

// ============================================================
// Angular animation helper
// ============================================================

/**
 * Convert an unroll angle (radians) to the corresponding unrolled arc length (px).
 * Uses the lookup table from scaffold for binary-search interpolation.
 *
 * @param {number} unrollAngle - radians of unrolling (0 = fully coiled)
 * @param {object} scaffold - output of computeScaffold()
 * @returns {number} unrolled arc length in px
 */
function thetaToArcLength(unrollAngle, scaffold) {
  const { unrollLookup, thetaMax } = scaffold;
  const rawTotalArc = unrollLookup[unrollLookup.length - 1].unrolledArcLength;

  if (unrollAngle <= 0) return 0;
  if (unrollAngle >= thetaMax) return rawTotalArc;

  // Binary search
  let lo = 0, hi = unrollLookup.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (unrollLookup[mid].unrollAngle <= unrollAngle) lo = mid;
    else hi = mid;
  }

  const a0 = unrollLookup[lo];
  const a1 = unrollLookup[hi];
  const frac = (unrollAngle - a0.unrollAngle) / (a1.unrollAngle - a0.unrollAngle);
  return a0.unrolledArcLength + frac * (a1.unrolledArcLength - a0.unrolledArcLength);
}

// ============================================================
// Exports
// ============================================================

export { computeScaffold, computeProjection, buildCoilForLength, getBBox, thetaToArcLength };
