/**
 * Test fixed (constant) bezier params against all parameter combos.
 *
 * Picks one bezier per property and measures the error when applied
 * to every (paperHeight, paperRemaining) combination.
 *
 * Run: node tests/cylinder-fixed-bezier-report.mjs
 */

import { computeScaffold, computeProjection, thetaToArcLength } from '../cylinder-projection.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Fixed bezier candidates — averages from the stability summary
// ============================================================

// Using midpoints of the ranges from the fitted results (eased only)
const FIXED_BEZIERS = {
  paperStripHeight: [0.433, 0.071, 0.434, 1.038],
  coilRectTop:      [0.433, 0.070, 0.438, 1.035],
  coilRectHeight:   [0.478, 0.031, 0.521, 0.969],
};

// ============================================================
// Parameter combos to test
// ============================================================

const PARAM_SETS = [
  { name: '400/30',   strokeWidth: 6, turnGap: 6, spiralLength: 400,  stopRemaining: 30,  svgPadding: 20 },
  { name: '600/40',   strokeWidth: 6, turnGap: 6, spiralLength: 600,  stopRemaining: 40,  svgPadding: 20 },
  { name: '800/20',   strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 20,  svgPadding: 20 },
  { name: '800/60',   strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 60,  svgPadding: 20 },
  { name: '800/200',  strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 200, svgPadding: 20 },
  { name: '1000/80',  strokeWidth: 6, turnGap: 6, spiralLength: 1000, stopRemaining: 80,  svgPadding: 20 },
  { name: '1200/100', strokeWidth: 6, turnGap: 6, spiralLength: 1200, stopRemaining: 100, svgPadding: 20 },
  { name: '1600/120', strokeWidth: 6, turnGap: 6, spiralLength: 1600, stopRemaining: 120, svgPadding: 20 },
];

const STEPS = 100;
const PROPERTIES = ['paperStripHeight', 'coilRectTop', 'coilRectHeight'];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ============================================================
// Cubic bezier evaluation
// ============================================================

function cubicBezierAt(t, x1, y1, x2, y2) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let u = t;
  for (let i = 0; i < 20; i++) {
    const u2 = u * u;
    const u3 = u2 * u;
    const omu = 1 - u;
    const omu2 = omu * omu;

    const x = 3 * omu2 * u * x1 + 3 * omu * u2 * x2 + u3;
    const dx = 3 * omu2 * x1 + 6 * omu * u * (x2 - x1) + 3 * u2 * (1 - x2);

    if (Math.abs(dx) < 1e-12) break;
    const err = x - t;
    if (Math.abs(err) < 1e-10) break;
    u -= err / dx;
    u = Math.max(0, Math.min(1, u));
  }

  const u2 = u * u;
  const u3 = u2 * u;
  const omu = 1 - u;
  const omu2 = omu * omu;
  return 3 * omu2 * u * y1 + 3 * omu * u2 * y2 + u3;
}

// ============================================================
// Measure error of fixed bezier against actual curve
// ============================================================

const results = [];

for (const params of PARAM_SETS) {
  const scaffold = computeScaffold(params);

  // Sample the actual eased curve
  const samples = [];
  for (let i = 0; i <= STEPS; i++) {
    const pct = i / STEPS;
    const theta = easeInOut(pct) * scaffold.thetaStop;
    const unrolledLength = thetaToArcLength(theta, scaffold);
    const proj = computeProjection(unrolledLength, scaffold);
    samples.push({ pct, ...proj });
  }

  for (const prop of PROPERTIES) {
    const rawValues = samples.map(s => s[prop]);
    const startVal = rawValues[0];
    const endVal = rawValues[rawValues.length - 1];
    const range = endVal - startVal;

    if (Math.abs(range) < 0.01) continue;

    const [x1, y1, x2, y2] = FIXED_BEZIERS[prop];

    let maxErrNorm = 0;
    let maxErrPx = 0;
    let sumSqErr = 0;

    for (let i = 0; i <= STEPS; i++) {
      const pct = i / STEPS;
      const actualNorm = (rawValues[i] - startVal) / range;
      const bezierNorm = cubicBezierAt(pct, x1, y1, x2, y2);
      const errNorm = Math.abs(bezierNorm - actualNorm);
      const errPx = errNorm * Math.abs(range);

      if (errNorm > maxErrNorm) maxErrNorm = errNorm;
      if (errPx > maxErrPx) maxErrPx = errPx;
      sumSqErr += errNorm * errNorm;
    }

    results.push({
      paramSet: params.name,
      property: prop,
      startVal,
      endVal,
      range,
      maxErrNorm,
      maxErrPx,
      rmsErrNorm: Math.sqrt(sumSqErr / (STEPS + 1)),
      bezier: [x1, y1, x2, y2],
    });
  }
}

// ============================================================
// Report
// ============================================================

const lines = [];
lines.push('Fixed Bezier Error Report');
lines.push('========================');
lines.push('');
lines.push('Using constant bezier params across all (paperHeight, paperRemaining) combos.');
lines.push('');
lines.push('Fixed beziers (eased):');
for (const [prop, b] of Object.entries(FIXED_BEZIERS)) {
  lines.push(`  ${prop}: cubic-bezier(${b.join(', ')})`);
}
lines.push('');
lines.push('─'.repeat(80));
lines.push('');

// Table header
const header = 'Param Set    | Property          | Range (px) | Max Err (px) | Max Err (%) | RMS (%)';
const sep =    '─────────────┼───────────────────┼────────────┼──────────────┼─────────────┼────────';
lines.push(header);
lines.push(sep);

for (const r of results) {
  const paramCol = r.paramSet.padEnd(12);
  const propCol = r.property.padEnd(17);
  const rangeCol = Math.abs(r.range).toFixed(0).padStart(10);
  const maxPxCol = r.maxErrPx.toFixed(1).padStart(12);
  const maxPctCol = (r.maxErrNorm * 100).toFixed(2).padStart(11) + '%';
  const rmsPctCol = (r.rmsErrNorm * 100).toFixed(2).padStart(5) + '%';
  const warn = r.maxErrPx > 5 ? '  !!!' : '';
  lines.push(`${paramCol} | ${propCol} | ${rangeCol} | ${maxPxCol} | ${maxPctCol} | ${rmsPctCol}${warn}`);
}

lines.push('');
lines.push('─'.repeat(80));
lines.push('');

// Summary by property
for (const prop of PROPERTIES) {
  const group = results.filter(r => r.property === prop);
  const maxPx = Math.max(...group.map(r => r.maxErrPx));
  const avgPx = group.reduce((s, r) => s + r.maxErrPx, 0) / group.length;
  const worstConfig = group.find(r => r.maxErrPx === maxPx);
  lines.push(`${prop}:`);
  lines.push(`  Worst-case: ${maxPx.toFixed(1)}px (${worstConfig.paramSet})`);
  lines.push(`  Average max error: ${avgPx.toFixed(1)}px`);
  lines.push('');
}

lines.push('Verdict: Can we use fixed beziers?');
const allMaxPx = Math.max(...results.map(r => r.maxErrPx));
if (allMaxPx <= 3) {
  lines.push(`  YES — worst case ${allMaxPx.toFixed(1)}px across all combos. Excellent.`);
} else if (allMaxPx <= 5) {
  lines.push(`  YES — worst case ${allMaxPx.toFixed(1)}px. Acceptable for most uses.`);
} else if (allMaxPx <= 10) {
  lines.push(`  MAYBE — worst case ${allMaxPx.toFixed(1)}px. Fine for moderate sizes, consider per-config for large spirals.`);
} else {
  lines.push(`  NO — worst case ${allMaxPx.toFixed(1)}px. Need per-config beziers or different approach.`);
}

const report = lines.join('\n') + '\n';
const reportPath = join(__dirname, 'cylinder-fixed-bezier-report.txt');
writeFileSync(reportPath, report);
console.log(report);
console.log(`Report written to ${reportPath}`);
