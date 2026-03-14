/**
 * Fit CSS cubic-bezier() curves to the cylinder projection animation.
 *
 * For each (spiralLength, stopRemaining) parameter set, computes 101-point
 * curves for paperStripHeight, coilRectTop, and coilRectHeight, then fits
 * a cubic-bezier(x1, y1, x2, y2) approximation using Nelder-Mead optimization.
 *
 * Run: node tests/cylinder-bezier-fit.mjs
 * Outputs: tests/cylinder-bezier-fit-report.txt
 *          tests/cylinder-bezier-fit.html
 */

import { computeScaffold, computeProjection, thetaToArcLength } from '../cylinder-projection.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// Parameter sets to test
// ============================================================

const PARAM_SETS = [
  { name: '800/60',  strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 60,  svgPadding: 20 },
  { name: '800/20',  strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 20,  svgPadding: 20 },
  { name: '400/30',  strokeWidth: 6, turnGap: 6, spiralLength: 400,  stopRemaining: 30,  svgPadding: 20 },
  { name: '1600/120', strokeWidth: 6, turnGap: 6, spiralLength: 1600, stopRemaining: 120, svgPadding: 20 },
  { name: '800/200', strokeWidth: 6, turnGap: 6, spiralLength: 800,  stopRemaining: 200, svgPadding: 20 },
];

const STEPS = 100;
const PROPERTIES = ['paperStripHeight', 'coilRectTop', 'coilRectHeight'];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ============================================================
// Cubic bezier evaluation
// ============================================================

/**
 * Evaluate a CSS cubic-bezier(x1, y1, x2, y2) at input t_input.
 * CSS cubic-bezier maps time-progress [0,1] to value-progress [0,1].
 * The bezier curve is parameterized by u ∈ [0,1]:
 *   x(u) = 3(1-u)²u·x1 + 3(1-u)u²·x2 + u³
 *   y(u) = 3(1-u)²u·y1 + 3(1-u)u²·y2 + u³
 * Given t_input (an x value), we find u such that x(u) = t_input,
 * then return y(u).
 */
function cubicBezierAt(t, x1, y1, x2, y2) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  // Find u where x(u) = t using Newton's method
  let u = t; // initial guess
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
// Nelder-Mead simplex optimizer (no dependencies)
// ============================================================

function nelderMead(f, x0, { maxIter = 2000, tol = 1e-10 } = {}) {
  const n = x0.length;
  const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;

  // Build initial simplex
  let simplex = [{ x: [...x0], fx: f(x0) }];
  for (let i = 0; i < n; i++) {
    const xi = [...x0];
    xi[i] += (Math.abs(xi[i]) < 0.01 ? 0.1 : xi[i] * 0.2);
    simplex.push({ x: xi, fx: f(xi) });
  }

  for (let iter = 0; iter < maxIter; iter++) {
    simplex.sort((a, b) => a.fx - b.fx);

    // Check convergence
    const range = simplex[n].fx - simplex[0].fx;
    if (range < tol) break;

    // Centroid of all but worst
    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) centroid[j] += simplex[i].x[j];
      // intentionally summing n points
    }
    // Fix: sum over simplex points, divide by n
    for (let j = 0; j < n; j++) centroid[j] /= n;

    const worst = simplex[n];

    // Reflect
    const xr = centroid.map((c, j) => c + alpha * (c - worst.x[j]));
    const fr = f(xr);

    if (fr < simplex[0].fx) {
      // Expand
      const xe = centroid.map((c, j) => c + gamma * (xr[j] - c));
      const fe = f(xe);
      simplex[n] = fe < fr ? { x: xe, fx: fe } : { x: xr, fx: fr };
    } else if (fr < simplex[n - 1].fx) {
      simplex[n] = { x: xr, fx: fr };
    } else {
      // Contract
      const xc = centroid.map((c, j) => c + rho * (worst.x[j] - c));
      const fc = f(xc);
      if (fc < worst.fx) {
        simplex[n] = { x: xc, fx: fc };
      } else {
        // Shrink
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
// Fitting logic
// ============================================================

/**
 * Fit cubic-bezier to a normalized curve.
 * @param {Array<{t: number, v: number}>} points - normalized (t,v) in [0,1]×[0,1]
 * @returns {{x1, y1, x2, y2, maxError, rmsError}}
 */
function fitCubicBezier(points) {
  // Objective: minimize max absolute error
  function objective(params) {
    let [x1, y1, x2, y2] = params;
    // Clamp x1, x2 to [0,1] (CSS requirement)
    x1 = Math.max(0, Math.min(1, x1));
    x2 = Math.max(0, Math.min(1, x2));

    let maxErr = 0;
    for (const p of points) {
      const predicted = cubicBezierAt(p.t, x1, y1, x2, y2);
      const err = Math.abs(predicted - p.v);
      if (err > maxErr) maxErr = err;
    }
    return maxErr;
  }

  // Grid search for initial guess
  let bestParams = [0.25, 0.1, 0.25, 1.0];
  let bestScore = Infinity;

  for (let x1 = 0; x1 <= 1; x1 += 0.2) {
    for (let y1 = -0.5; y1 <= 1.5; y1 += 0.25) {
      for (let x2 = 0; x2 <= 1; x2 += 0.2) {
        for (let y2 = -0.5; y2 <= 1.5; y2 += 0.25) {
          const score = objective([x1, y1, x2, y2]);
          if (score < bestScore) {
            bestScore = score;
            bestParams = [x1, y1, x2, y2];
          }
        }
      }
    }
  }

  // Refine with Nelder-Mead
  const result = nelderMead(objective, bestParams, { maxIter: 5000, tol: 1e-14 });
  let [x1, y1, x2, y2] = result.x;
  x1 = Math.max(0, Math.min(1, x1));
  x2 = Math.max(0, Math.min(1, x2));

  // Compute errors
  let maxError = 0, sumSqErr = 0;
  for (const p of points) {
    const predicted = cubicBezierAt(p.t, x1, y1, x2, y2);
    const err = Math.abs(predicted - p.v);
    if (err > maxError) maxError = err;
    sumSqErr += err * err;
  }

  return {
    x1: +x1.toFixed(6),
    y1: +y1.toFixed(6),
    x2: +x2.toFixed(6),
    y2: +y2.toFixed(6),
    maxError,
    rmsError: Math.sqrt(sumSqErr / points.length),
  };
}

// ============================================================
// Main: compute curves and fit beziers
// ============================================================

const results = [];

for (const params of PARAM_SETS) {
  const scaffold = computeScaffold(params);

  for (const easing of ['linear', 'eased']) {
    // Sample the 101 points
    const samples = [];
    for (let i = 0; i <= STEPS; i++) {
      const pct = i / STEPS;
      let theta;
      if (easing === 'linear') {
        theta = pct * scaffold.thetaStop;
      } else {
        theta = easeInOut(pct) * scaffold.thetaStop;
      }
      const unrolledLength = thetaToArcLength(theta, scaffold);
      const proj = computeProjection(unrolledLength, scaffold);
      samples.push({ pct, ...proj });
    }

    for (const prop of PROPERTIES) {
      const rawValues = samples.map(s => s[prop]);
      const startVal = rawValues[0];
      const endVal = rawValues[rawValues.length - 1];
      const range = endVal - startVal;

      if (Math.abs(range) < 0.01) {
        // No meaningful change — skip
        results.push({
          paramSet: params.name,
          easing,
          property: prop,
          startVal,
          endVal,
          range,
          fit: null,
          note: 'No meaningful range (< 0.01px)',
        });
        continue;
      }

      // Normalize to [0,1] × [0,1]
      const normalized = samples.map((s, i) => ({
        t: s.pct,
        v: (rawValues[i] - startVal) / range,
      }));

      const fit = fitCubicBezier(normalized);
      const maxErrorPx = fit.maxError * Math.abs(range);

      results.push({
        paramSet: params.name,
        easing,
        property: prop,
        startVal,
        endVal,
        range,
        fit,
        maxErrorPx,
        normalized,
        rawValues,
      });
    }
  }
}

// ============================================================
// Text report
// ============================================================

const reportLines = [];
reportLines.push('Cubic Bezier Fit Report — Cylinder Projection');
reportLines.push('='.repeat(60));
reportLines.push('');

for (const r of results) {
  reportLines.push(`[${r.paramSet}] ${r.property} (${r.easing})`);
  if (!r.fit) {
    reportLines.push(`  SKIPPED: ${r.note}`);
    reportLines.push('');
    continue;
  }
  const f = r.fit;
  reportLines.push(`  Range: ${r.startVal.toFixed(1)} → ${r.endVal.toFixed(1)} (${Math.abs(r.range).toFixed(1)}px)`);
  reportLines.push(`  cubic-bezier(${f.x1.toFixed(4)}, ${f.y1.toFixed(4)}, ${f.x2.toFixed(4)}, ${f.y2.toFixed(4)})`);
  reportLines.push(`  Max error: ${(f.maxError * 100).toFixed(3)}% normalized = ${r.maxErrorPx.toFixed(2)}px`);
  reportLines.push(`  RMS error: ${(f.rmsError * 100).toFixed(3)}% normalized`);
  if (r.maxErrorPx > 5) {
    reportLines.push(`  ⚠️  WARNING: Max pixel error exceeds 5px!`);
  }
  reportLines.push('');
}

// Stability summary
reportLines.push('');
reportLines.push('Stability Summary — Are bezier params stable across param sets?');
reportLines.push('-'.repeat(60));
for (const easing of ['linear', 'eased']) {
  for (const prop of PROPERTIES) {
    const group = results.filter(r => r.easing === easing && r.property === prop && r.fit);
    if (group.length === 0) continue;

    const x1s = group.map(r => r.fit.x1);
    const y1s = group.map(r => r.fit.y1);
    const x2s = group.map(r => r.fit.x2);
    const y2s = group.map(r => r.fit.y2);

    const spread = (arr) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return (max - min).toFixed(4);
    };

    reportLines.push(`${prop} (${easing}):`);
    reportLines.push(`  x1: ${Math.min(...x1s).toFixed(4)}–${Math.max(...x1s).toFixed(4)} (spread ${spread(x1s)})`);
    reportLines.push(`  y1: ${Math.min(...y1s).toFixed(4)}–${Math.max(...y1s).toFixed(4)} (spread ${spread(y1s)})`);
    reportLines.push(`  x2: ${Math.min(...x2s).toFixed(4)}–${Math.max(...x2s).toFixed(4)} (spread ${spread(x2s)})`);
    reportLines.push(`  y2: ${Math.min(...y2s).toFixed(4)}–${Math.max(...y2s).toFixed(4)} (spread ${spread(y2s)})`);
    reportLines.push('');
  }
}

const reportPath = join(__dirname, 'cylinder-bezier-fit-report.txt');
writeFileSync(reportPath, reportLines.join('\n') + '\n');
console.log(`Report written to ${reportPath}`);

// ============================================================
// HTML visualization
// ============================================================

// Prepare chart data for the HTML
const chartEntries = results.filter(r => r.fit).map(r => ({
  paramSet: r.paramSet,
  easing: r.easing,
  property: r.property,
  startVal: r.startVal,
  endVal: r.endVal,
  range: r.range,
  fit: r.fit,
  maxErrorPx: r.maxErrorPx,
  // Sample the bezier at 101 points for overlay
  bezierPoints: Array.from({ length: 101 }, (_, i) => {
    const t = i / 100;
    return cubicBezierAt(t, r.fit.x1, r.fit.y1, r.fit.x2, r.fit.y2);
  }),
  actualPoints: r.normalized.map(p => p.v),
}));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cubic Bezier Fit — Cylinder Projection</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; color: #f5deb3; }
    h2 { margin: 2rem 0 0.5rem; color: #d2b48c; font-size: 1.2rem; }
    h3 { margin: 1rem 0 0.3rem; color: #b0a080; font-size: 1rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
    .card { background: #16213e; border: 1px solid #333; border-radius: 6px; padding: 1rem; }
    .card h4 { color: #ccc; font-size: 0.9rem; margin-bottom: 0.3rem; }
    .card .bezier-code { font-family: monospace; color: #7fdbca; font-size: 0.85rem; }
    .card .error { font-size: 0.8rem; color: #888; margin: 0.3rem 0; }
    .card .error.warn { color: #ff6b6b; font-weight: bold; }
    canvas { width: 100%; height: 250px; background: #0d1526; border-radius: 4px; margin-top: 0.5rem; }
    .legend-row { display: flex; gap: 1.5rem; margin: 0.5rem 0; font-size: 0.8rem; }
    .legend-row span::before { content: ''; display: inline-block; width: 20px; height: 3px; margin-right: 4px; vertical-align: middle; }
    .actual::before { background: #4fc3f7; }
    .bezier-line::before { background: #ff8a65; }
  </style>
</head>
<body>
  <h1>Cubic Bezier Fit Results</h1>
  <p class="subtitle">Actual spiral projection (blue) vs. cubic-bezier approximation (orange). Normalized 0–1 space.</p>
  <div class="legend-row">
    <span class="actual">Actual curve</span>
    <span class="bezier-line">Bezier fit</span>
  </div>

  <div id="charts"></div>

  <script>
    const entries = ${JSON.stringify(chartEntries)};

    const container = document.getElementById('charts');

    // Group by easing
    for (const easing of ['linear', 'eased']) {
      const h2 = document.createElement('h2');
      h2.textContent = easing === 'linear' ? 'Linear Theta (constant angular velocity)' : 'Eased Theta (ease-in-out)';
      container.appendChild(h2);

      const grid = document.createElement('div');
      grid.className = 'grid';
      container.appendChild(grid);

      const group = entries.filter(e => e.easing === easing);
      for (const entry of group) {
        const card = document.createElement('div');
        card.className = 'card';

        const warnClass = entry.maxErrorPx > 5 ? ' warn' : '';

        card.innerHTML =
          '<h4>' + entry.paramSet + ' — ' + entry.property + '</h4>' +
          '<div class="bezier-code">cubic-bezier(' +
            entry.fit.x1.toFixed(4) + ', ' + entry.fit.y1.toFixed(4) + ', ' +
            entry.fit.x2.toFixed(4) + ', ' + entry.fit.y2.toFixed(4) + ')</div>' +
          '<div class="error' + warnClass + '">Max error: ' +
            (entry.fit.maxError * 100).toFixed(2) + '% = ' +
            entry.maxErrorPx.toFixed(1) + 'px' +
            (entry.maxErrorPx > 5 ? ' ⚠ EXCEEDS 5px' : '') +
            ' | Range: ' + entry.startVal.toFixed(0) + '→' + entry.endVal.toFixed(0) +
            ' (' + Math.abs(entry.range).toFixed(0) + 'px)</div>';

        const canvas = document.createElement('canvas');
        card.appendChild(canvas);
        grid.appendChild(card);

        // Draw after layout
        requestAnimationFrame(() => drawChart(canvas, entry));
      }
    }

    function drawChart(canvas, entry) {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      const pad = { top: 15, right: 15, bottom: 25, left: 40 };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      // Axes
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top);
      ctx.lineTo(pad.left, H - pad.bottom);
      ctx.lineTo(W - pad.right, H - pad.bottom);
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = '#1a2540';
      for (let i = 1; i <= 4; i++) {
        const y = pad.top + plotH * (1 - i / 4);
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
      }

      // Axis labels
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        ctx.fillText((i * 25) + '%', pad.left - 4, pad.top + plotH * (1 - i / 4) + 3);
      }
      ctx.textAlign = 'center';
      for (let i = 0; i <= 4; i++) {
        ctx.fillText((i * 25) + '%', pad.left + plotW * i / 4, H - pad.bottom + 14);
      }

      // Actual curve (blue)
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < entry.actualPoints.length; i++) {
        const x = pad.left + (i / 100) * plotW;
        const y = pad.top + plotH * (1 - entry.actualPoints[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bezier curve (orange)
      ctx.strokeStyle = '#ff8a65';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      for (let i = 0; i < entry.bezierPoints.length; i++) {
        const x = pad.left + (i / 100) * plotW;
        const y = pad.top + plotH * (1 - entry.bezierPoints[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Diagonal reference (linear)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top + plotH);
      ctx.lineTo(pad.left + plotW, pad.top);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  </script>
</body>
</html>`;

const htmlPath = join(__dirname, 'cylinder-bezier-fit.html');
writeFileSync(htmlPath, html);
console.log(`HTML written to ${htmlPath}`);

// Console summary
console.log('\nSummary:');
for (const r of results) {
  if (!r.fit) continue;
  const warn = r.maxErrorPx > 5 ? ' ⚠️  >5px!' : '';
  console.log(
    `  [${r.paramSet}] ${r.property} (${r.easing}): ` +
    `cubic-bezier(${r.fit.x1.toFixed(3)}, ${r.fit.y1.toFixed(3)}, ${r.fit.x2.toFixed(3)}, ${r.fit.y2.toFixed(3)}) ` +
    `err=${r.maxErrorPx.toFixed(1)}px${warn}`
  );
}
