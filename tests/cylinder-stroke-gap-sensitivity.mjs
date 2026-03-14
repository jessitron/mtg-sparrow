/**
 * Compare real spiral computation vs module approximation
 * across different strokeWidth/turnGap values.
 *
 * Run: node tests/cylinder-stroke-gap-sensitivity.mjs
 */

import { computeScaffold, computeProjection, thetaToArcLength } from '../cylinder-projection.js';
import { computeTransition } from '../cylinder-transition.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

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

const STEPS = 100;
const PROPERTIES = ['paperStripHeight', 'coilRectTop', 'coilRectHeight'];

// Test grid: various strokeWidth/turnGap combos × a couple spiral configs
const STROKE_GAP_COMBOS = [
  { strokeWidth: 1, turnGap: 1 },
  { strokeWidth: 2, turnGap: 2 },
  { strokeWidth: 3, turnGap: 3 },
  { strokeWidth: 6, turnGap: 6 },   // baseline (table was built with this)
  { strokeWidth: 10, turnGap: 10 },
  { strokeWidth: 12, turnGap: 16 },
  { strokeWidth: 1, turnGap: 6 },
  { strokeWidth: 6, turnGap: 1 },
];

const SPIRAL_CONFIGS = [
  { spiralLength: 800, stopRemaining: 60 },
  { spiralLength: 800, stopRemaining: 200 },
  { spiralLength: 400, stopRemaining: 30 },
];

const lines = [];
lines.push('Stroke/Gap Sensitivity Report');
lines.push('=============================');
lines.push('');
lines.push('Compares real spiral computation (ground truth) vs module approximation');
lines.push('(bezier table built with strokeWidth=6, turnGap=6).');
lines.push('');
lines.push('For each combo, measures:');
lines.push('  - Start/end value differences (the module uses real computation for these)');
lines.push('  - Mid-animation bezier approximation error (the bezier was fit at 6/6)');
lines.push('');

const header = 'SW TG | Spiral  Stop | Property          | End Δ(px) | Bezier MaxErr(px) | Bezier MaxErr(%)';
const sep =    '──────┼──────────────┼───────────────────┼───────────┼───────────────────┼─────────────────';

lines.push(header);
lines.push(sep);

for (const sg of STROKE_GAP_COMBOS) {
  for (const sc of SPIRAL_CONFIGS) {
    const params = { ...sg, ...sc, svgPadding: 20 };

    // Ground truth: real spiral computation
    const scaffold = computeScaffold(params);
    const realSamples = [];
    for (let i = 0; i <= STEPS; i++) {
      const pct = i / STEPS;
      const theta = easeInOut(pct) * scaffold.thetaStop;
      const unrolledLength = thetaToArcLength(theta, scaffold);
      const proj = computeProjection(unrolledLength, scaffold);
      realSamples.push({ pct, ...proj });
    }

    // Module approximation
    const trans = computeTransition(params);

    for (const prop of PROPERTIES) {
      const realValues = realSamples.map(s => s[prop]);
      const realStart = realValues[0];
      const realEnd = realValues[STEPS];

      // Module start/end (these use real computation too)
      let modStart, modEnd, bezier;
      if (prop === 'paperStripHeight') {
        modStart = trans.paperStrip.start;
        modEnd = trans.paperStrip.end;
        bezier = trans.paperStrip.bezier;
      } else if (prop === 'coilRectTop') {
        modStart = trans.coilTop.start;
        modEnd = trans.coilTop.end;
        bezier = trans.coilTop.bezier;
      } else {
        modStart = trans.coilHeight.start;
        modEnd = trans.coilHeight.end;
        bezier = trans.coilHeight.bezier;
      }

      const endDelta = Math.abs(realEnd - modEnd);
      const range = realEnd - realStart;

      // Measure bezier approximation error at each step
      let maxBezierErrPx = 0;
      let maxBezierErrPct = 0;
      if (Math.abs(range) > 0.01) {
        for (let i = 0; i <= STEPS; i++) {
          const pct = i / STEPS;
          const realNorm = (realValues[i] - realStart) / range;
          const bezierNorm = cubicBezierAt(pct, ...bezier);
          // Denormalize using MODULE's start/end (what CSS would actually use)
          const bezierPx = modStart + bezierNorm * (modEnd - modStart);
          const errPx = Math.abs(bezierPx - realValues[i]);
          const errPct = Math.abs(bezierNorm - realNorm) * 100;
          if (errPx > maxBezierErrPx) maxBezierErrPx = errPx;
          if (errPct > maxBezierErrPct) maxBezierErrPct = errPct;
        }
      }

      const swStr = String(sg.strokeWidth).padStart(2);
      const tgStr = String(sg.turnGap).padStart(2);
      const slStr = String(sc.spiralLength).padStart(5);
      const srStr = String(sc.stopRemaining).padStart(4);
      const propStr = prop.padEnd(17);
      const endDStr = endDelta.toFixed(1).padStart(9);
      const bezErrStr = maxBezierErrPx.toFixed(1).padStart(17);
      const bezPctStr = maxBezierErrPct.toFixed(2).padStart(14) + '%';
      const warn = maxBezierErrPx > 10 ? '  !!!' : maxBezierErrPx > 5 ? '  !' : '';

      lines.push(`${swStr} ${tgStr} | ${slStr} ${srStr} | ${propStr} | ${endDStr} | ${bezErrStr} | ${bezPctStr}${warn}`);
    }
  }
}

lines.push('');
lines.push(sep);
lines.push('');
lines.push('SW=strokeWidth, TG=turnGap. Baseline is 6/6 (bezier table was built with these).');
lines.push('"End Δ" should be ~0 since the module computes start/end from real geometry.');
lines.push('"Bezier MaxErr" is the mid-animation error from using beziers fit at SW=6 TG=6.');

const report = lines.join('\n') + '\n';
const reportPath = join(__dirname, 'cylinder-stroke-gap-sensitivity.txt');
writeFileSync(reportPath, report);
console.log(report);
console.log(`Report: ${reportPath}`);
