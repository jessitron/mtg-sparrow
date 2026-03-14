/**
 * Explore how fitted bezier params vary with stopRemaining/spiralLength ratio.
 *
 * Fits beziers for many ratio values, then checks if a simple interpolation
 * from the ratio can produce good bezier params.
 *
 * Run: node tests/cylinder-bezier-by-ratio.mjs
 */

import { computeScaffold, computeProjection, thetaToArcLength } from '../cylinder-projection.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const STEPS = 100;

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
    const u2 = u * u, u3 = u2 * u, omu = 1 - u, omu2 = omu * omu;
    const x = 3 * omu2 * u * x1 + 3 * omu * u2 * x2 + u3;
    const dx = 3 * omu2 * x1 + 6 * omu * u * (x2 - x1) + 3 * u2 * (1 - x2);
    if (Math.abs(dx) < 1e-12) break;
    const err = x - t;
    if (Math.abs(err) < 1e-10) break;
    u -= err / dx;
    u = Math.max(0, Math.min(1, u));
  }
  const u2 = u * u, u3 = u2 * u, omu = 1 - u, omu2 = omu * omu;
  return 3 * omu2 * u * y1 + 3 * omu * u2 * y2 + u3;
}

// ============================================================
// Nelder-Mead
// ============================================================

function nelderMead(f, x0, { maxIter = 3000, tol = 1e-12 } = {}) {
  const n = x0.length;
  const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;
  let simplex = [{ x: [...x0], fx: f(x0) }];
  for (let i = 0; i < n; i++) {
    const xi = [...x0];
    xi[i] += (Math.abs(xi[i]) < 0.01 ? 0.1 : xi[i] * 0.2);
    simplex.push({ x: xi, fx: f(xi) });
  }
  for (let iter = 0; iter < maxIter; iter++) {
    simplex.sort((a, b) => a.fx - b.fx);
    if (simplex[n].fx - simplex[0].fx < tol) break;
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) centroid[j] += simplex[i].x[j];
    for (let j = 0; j < n; j++) centroid[j] /= n;
    const worst = simplex[n];
    const xr = centroid.map((c, j) => c + alpha * (c - worst.x[j]));
    const fr = f(xr);
    if (fr < simplex[0].fx) {
      const xe = centroid.map((c, j) => c + gamma * (xr[j] - c));
      const fe = f(xe);
      simplex[n] = fe < fr ? { x: xe, fx: fe } : { x: xr, fx: fr };
    } else if (fr < simplex[n - 1].fx) {
      simplex[n] = { x: xr, fx: fr };
    } else {
      const xc = centroid.map((c, j) => c + rho * (worst.x[j] - c));
      const fc = f(xc);
      if (fc < worst.fx) {
        simplex[n] = { x: xc, fx: fc };
      } else {
        for (let i = 1; i <= n; i++) {
          simplex[i].x = simplex[i].x.map((v, j) => simplex[0].x[j] + sigma * (v - simplex[0].x[j]));
          simplex[i].fx = f(simplex[i].x);
        }
      }
    }
  }
  simplex.sort((a, b) => a.fx - b.fx);
  return simplex[0];
}

// ============================================================
// Fit bezier for one property
// ============================================================

function fitBezier(normalizedPoints) {
  function objective(params) {
    let [x1, y1, x2, y2] = params;
    x1 = Math.max(0, Math.min(1, x1));
    x2 = Math.max(0, Math.min(1, x2));
    let maxErr = 0;
    for (const p of normalizedPoints) {
      const predicted = cubicBezierAt(p.t, x1, y1, x2, y2);
      const err = Math.abs(predicted - p.v);
      if (err > maxErr) maxErr = err;
    }
    return maxErr;
  }

  // Grid search
  const candidates = [];
  for (let x1 = 0; x1 <= 1; x1 += 0.1) {
    for (let y1 = -0.3; y1 <= 1.3; y1 += 0.2) {
      for (let x2 = 0; x2 <= 1; x2 += 0.1) {
        for (let y2 = -0.3; y2 <= 1.3; y2 += 0.2) {
          candidates.push({ params: [x1, y1, x2, y2], score: objective([x1, y1, x2, y2]) });
        }
      }
    }
  }
  candidates.sort((a, b) => a.score - b.score);

  let best = { x: candidates[0].params, fx: candidates[0].score };
  for (const c of candidates.slice(0, 5)) {
    const result = nelderMead(objective, c.params);
    if (result.fx < best.fx) best = result;
  }

  let [x1, y1, x2, y2] = best.x;
  return {
    x1: Math.max(0, Math.min(1, +x1.toFixed(4))),
    y1: +y1.toFixed(4),
    x2: Math.max(0, Math.min(1, +x2.toFixed(4))),
    y2: +y2.toFixed(4),
    maxError: best.fx,
  };
}

// ============================================================
// Sample many ratios
// ============================================================

// Fixed spiral length, varying stopRemaining to isolate ratio effect
const SPIRAL_LENGTH = 800;
const STOP_VALUES = [10, 20, 30, 40, 60, 80, 100, 120, 150, 200, 250, 300];

// Also vary spiral length at a few stop values to check independence
const EXTRA_COMBOS = [
  { spiralLength: 400, stopRemaining: 30 },
  { spiralLength: 400, stopRemaining: 100 },
  { spiralLength: 1200, stopRemaining: 60 },
  { spiralLength: 1200, stopRemaining: 200 },
  { spiralLength: 1600, stopRemaining: 120 },
];

const allCombos = [
  ...STOP_VALUES.map(sr => ({ spiralLength: SPIRAL_LENGTH, stopRemaining: sr })),
  ...EXTRA_COMBOS,
];

const PROPERTIES = ['paperStripHeight', 'coilRectTop'];
// coilRectHeight already works great with fixed bezier, skip it

const fitResults = [];

for (const { spiralLength, stopRemaining } of allCombos) {
  const ratio = stopRemaining / spiralLength;
  const params = { strokeWidth: 6, turnGap: 6, spiralLength, stopRemaining, svgPadding: 20 };
  const scaffold = computeScaffold(params);

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

    const normalized = samples.map((s, i) => ({
      t: s.pct,
      v: (rawValues[i] - startVal) / range,
    }));

    const fit = fitBezier(normalized);

    fitResults.push({
      spiralLength,
      stopRemaining,
      ratio,
      property: prop,
      range,
      ...fit,
    });
  }
}

// ============================================================
// Report: bezier params vs ratio
// ============================================================

const lines = [];
lines.push('Bezier Parameters vs stopRemaining/spiralLength Ratio');
lines.push('=====================================================');
lines.push('');

for (const prop of PROPERTIES) {
  const group = fitResults.filter(r => r.property === prop).sort((a, b) => a.ratio - b.ratio);

  lines.push(`${prop}:`);
  lines.push('  ratio  | spiral | stop |    x1    y1    x2    y2   | maxErr(norm) | maxErr(px)');
  lines.push('  ───────┼────────┼──────┼──────────────────────────┼──────────────┼──────────');

  for (const r of group) {
    const ratioStr = r.ratio.toFixed(4).padStart(6);
    const slStr = String(r.spiralLength).padStart(6);
    const srStr = String(r.stopRemaining).padStart(4);
    const b = `${r.x1.toFixed(3)} ${r.y1.toFixed(3)} ${r.x2.toFixed(3)} ${r.y2.toFixed(3)}`;
    const errNorm = (r.maxError * 100).toFixed(2).padStart(11) + '%';
    const errPx = (r.maxError * Math.abs(r.range)).toFixed(1).padStart(9);
    lines.push(`  ${ratioStr} | ${slStr} | ${srStr} | ${b} | ${errNorm} | ${errPx}`);
  }
  lines.push('');
}

// ============================================================
// Check: do same-ratio different-lengths produce same beziers?
// ============================================================

lines.push('');
lines.push('Same-ratio check (do bezier params depend only on ratio?)');
lines.push('─────────────────────────────────────────────────────────');
// Compare 800/60 (ratio=0.075) with nearby combos
// Compare 400/30 (ratio=0.075) — same ratio different length
for (const prop of PROPERTIES) {
  const group = fitResults.filter(r => r.property === prop);
  // Find pairs with similar ratios but different spiral lengths
  const byRatio = {};
  for (const r of group) {
    const key = r.ratio.toFixed(3);
    if (!byRatio[key]) byRatio[key] = [];
    byRatio[key].push(r);
  }

  for (const [ratioKey, entries] of Object.entries(byRatio)) {
    if (entries.length < 2) continue;
    lines.push(`  ${prop} at ratio ~${ratioKey}:`);
    for (const r of entries) {
      lines.push(`    ${r.spiralLength}/${r.stopRemaining}: cubic-bezier(${r.x1}, ${r.y1}, ${r.x2}, ${r.y2})`);
    }
    const x1spread = Math.max(...entries.map(e => e.x1)) - Math.min(...entries.map(e => e.x1));
    const y1spread = Math.max(...entries.map(e => e.y1)) - Math.min(...entries.map(e => e.y1));
    const x2spread = Math.max(...entries.map(e => e.x2)) - Math.min(...entries.map(e => e.x2));
    const y2spread = Math.max(...entries.map(e => e.y2)) - Math.min(...entries.map(e => e.y2));
    lines.push(`    Spread: x1=${x1spread.toFixed(4)} y1=${y1spread.toFixed(4)} x2=${x2spread.toFixed(4)} y2=${y2spread.toFixed(4)}`);
    lines.push('');
  }
}

// ============================================================
// CSV for graphing
// ============================================================

const csvRows = ['property,spiralLength,stopRemaining,ratio,x1,y1,x2,y2,maxErrorNorm,maxErrorPx'];
for (const r of fitResults) {
  csvRows.push([
    r.property, r.spiralLength, r.stopRemaining, r.ratio.toFixed(4),
    r.x1, r.y1, r.x2, r.y2,
    r.maxError.toFixed(6), (r.maxError * Math.abs(r.range)).toFixed(2),
  ].join(','));
}

const report = lines.join('\n') + '\n';
const reportPath = join(__dirname, 'cylinder-bezier-by-ratio.txt');
writeFileSync(reportPath, report);

const csvPath = join(__dirname, 'cylinder-bezier-by-ratio.csv');
writeFileSync(csvPath, csvRows.join('\n') + '\n');

console.log(report);
console.log(`Report: ${reportPath}`);
console.log(`CSV: ${csvPath}`);
