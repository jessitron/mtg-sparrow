/**
 * Regression tests for cylinder projection CSS values.
 *
 * These snapshots capture the current (correct) output of computeProjection()
 * at various unroll percentages and parameter combinations. If the computation
 * is refactored (e.g. pre-computed lookup tables), these tests verify the
 * output stays the same.
 *
 * Run with: node tests/cylinder-projection.test.mjs
 */

import { computeScaffold, computeProjection } from '../cylinder-projection.js';

// ============================================================
// Test infrastructure
// ============================================================

let passed = 0;
let failed = 0;

function round2(v) {
  return Math.round(v * 100) / 100;
}

function snapshotProjection(unrolledLength, scaffold) {
  const p = computeProjection(unrolledLength, scaffold);
  return {
    paperStripMarginTop: round2(p.paperStripMarginTop),
    paperStripHeight: round2(p.paperStripHeight),
    coilRectTop: round2(p.coilRectTop),
    coilRectHeight: round2(p.coilRectHeight),
    coilDiameter: round2(p.coilDiameter),
  };
}

function assertClose(label, actual, expected, tolerance = 0.01) {
  for (const key of Object.keys(expected)) {
    const a = actual[key];
    const e = expected[key];
    if (Math.abs(a - e) > tolerance) {
      console.error(`  FAIL ${label}.${key}: expected ${e}, got ${a}`);
      failed++;
      return;
    }
  }
  passed++;
}

// ============================================================
// Parameter sets
// ============================================================

const paramSets = [
  {
    name: 'default (SW=6, TG=6, L=800, SR=60)',
    params: { strokeWidth: 6, turnGap: 6, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  },
  {
    name: 'short spiral (SW=6, TG=6, L=400, SR=30)',
    params: { strokeWidth: 6, turnGap: 6, spiralLength: 400, stopRemaining: 30, svgPadding: 20 },
  },
  {
    name: 'long spiral (SW=6, TG=6, L=1600, SR=120)',
    params: { strokeWidth: 6, turnGap: 6, spiralLength: 1600, stopRemaining: 120, svgPadding: 20 },
  },
  {
    name: 'thick stroke (SW=12, TG=16, L=800, SR=60)',
    params: { strokeWidth: 12, turnGap: 16, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  },
  {
    name: 'thin tight (SW=3, TG=3, L=800, SR=60)',
    params: { strokeWidth: 3, turnGap: 3, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  },
  {
    name: 'large stop (SW=6, TG=6, L=800, SR=200)',
    params: { strokeWidth: 6, turnGap: 6, spiralLength: 800, stopRemaining: 200, svgPadding: 20 },
  },
];

const unrollPcts = [0, 0.25, 0.5, 0.75, 1.0];

// ============================================================
// Generate or verify snapshots
// ============================================================

// To regenerate: run with --generate flag
const isGenerate = process.argv.includes('--generate');

if (isGenerate) {
  // Output snapshot data as a JS object
  console.log('// Auto-generated snapshot data');
  console.log('const SNAPSHOTS = {');
  for (const { name, params } of paramSets) {
    const scaffold = computeScaffold(params);
    console.log(`  ${JSON.stringify(name)}: {`);
    console.log(`    totalArcLength: ${round2(scaffold.totalArcLength)},`);
    console.log(`    maxUnrollLength: ${round2(scaffold.maxUnrollLength)},`);
    console.log(`    anchorY: ${round2(scaffold.anchorY)},`);
    console.log(`    values: {`);
    for (const pct of unrollPcts) {
      const ul = scaffold.maxUnrollLength * pct;
      const snap = snapshotProjection(ul, scaffold);
      console.log(`      ${pct}: ${JSON.stringify(snap)},`);
    }
    console.log('    },');
    console.log('  },');
  }
  console.log('};');
  process.exit(0);
}

// ============================================================
// Snapshot data (current correct values)
// ============================================================

const SNAPSHOTS = {
  "default (SW=6, TG=6, L=800, SR=60)": {
    totalArcLength: 800.78,
    maxUnrollLength: 740.78,
    anchorY: 69.59,
    values: {
      0: {"paperStripMarginTop":69.59,"paperStripHeight":0,"coilRectTop":23,"coilRectHeight":111.16,"coilDiameter":111.16},
      0.25: {"paperStripMarginTop":69.59,"paperStripHeight":185.2,"coilRectTop":214.87,"coilRectHeight":97.79,"coilDiameter":97.79},
      0.5: {"paperStripMarginTop":69.59,"paperStripHeight":370.39,"coilRectTop":407.97,"coilRectHeight":81.95,"coilDiameter":81.95},
      0.75: {"paperStripMarginTop":69.59,"paperStripHeight":555.59,"coilRectTop":602.98,"coilRectHeight":62.3,"coilDiameter":62.3},
      1: {"paperStripMarginTop":69.59,"paperStripHeight":740.78,"coilRectTop":802.92,"coilRectHeight":32.61,"coilDiameter":32.61},
    },
  },
  "short spiral (SW=6, TG=6, L=400, SR=30)": {
    totalArcLength: 401.17,
    maxUnrollLength: 371.17,
    anchorY: 53.58,
    values: {
      0: {"paperStripMarginTop":53.58,"paperStripHeight":0,"coilRectTop":22.9,"coilRectHeight":79.28,"coilDiameter":79.28},
      0.25: {"paperStripMarginTop":53.58,"paperStripHeight":92.79,"coilRectTop":120.46,"coilRectHeight":69.73,"coilDiameter":69.73},
      0.5: {"paperStripMarginTop":53.58,"paperStripHeight":185.58,"coilRectTop":218.78,"coilRectHeight":58.68,"coilDiameter":58.68},
      0.75: {"paperStripMarginTop":53.58,"paperStripHeight":278.38,"coilRectTop":318.4,"coilRectHeight":44.95,"coilDiameter":44.95},
      1: {"paperStripMarginTop":53.58,"paperStripHeight":371.17,"coilRectTop":424.1,"coilRectHeight":24.69,"coilDiameter":24.69},
    },
  },
  "long spiral (SW=6, TG=6, L=1600, SR=120)": {
    totalArcLength: 1601.34,
    maxUnrollLength: 1481.34,
    anchorY: 92.4,
    values: {
      0: {"paperStripMarginTop":92.4,"paperStripHeight":0,"coilRectTop":22.9,"coilRectHeight":156.98,"coilDiameter":156.98},
      0.25: {"paperStripMarginTop":92.4,"paperStripHeight":370.34,"coilRectTop":402.88,"coilRectHeight":137.69,"coilDiameter":137.69},
      0.5: {"paperStripMarginTop":92.4,"paperStripHeight":740.67,"coilRectTop":784.39,"coilRectHeight":115.36,"coilDiameter":115.36},
      0.75: {"paperStripMarginTop":92.4,"paperStripHeight":1111.01,"coilRectTop":1168.73,"coilRectHeight":87.3,"coilDiameter":87.3},
      1: {"paperStripMarginTop":92.4,"paperStripHeight":1481.34,"coilRectTop":1560.48,"coilRectHeight":44.38,"coilDiameter":44.38},
    },
  },
  "thick stroke (SW=12, TG=16, L=800, SR=60)": {
    totalArcLength: 800.33,
    maxUnrollLength: 740.33,
    anchorY: 90.24,
    values: {
      0: {"paperStripMarginTop":90.24,"paperStripHeight":0,"coilRectTop":26,"coilRectHeight":168.29,"coilDiameter":168.29},
      0.25: {"paperStripMarginTop":90.24,"paperStripHeight":185.08,"coilRectTop":221.31,"coilRectHeight":147.82,"coilDiameter":147.82},
      0.5: {"paperStripMarginTop":90.24,"paperStripHeight":370.17,"coilRectTop":418.14,"coilRectHeight":124.25,"coilDiameter":124.25},
      0.75: {"paperStripMarginTop":90.24,"paperStripHeight":555.25,"coilRectTop":618.03,"coilRectHeight":94.48,"coilDiameter":94.48},
      1: {"paperStripMarginTop":90.24,"paperStripHeight":740.33,"coilRectTop":830.57,"coilRectHeight":50.38,"coilDiameter":50.38},
    },
  },
  "thin tight (SW=3, TG=3, L=800, SR=60)": {
    totalArcLength: 800.67,
    maxUnrollLength: 740.67,
    anchorY: 56.2,
    values: {
      0: {"paperStripMarginTop":56.2,"paperStripHeight":0,"coilRectTop":21.45,"coilRectHeight":78.49,"coilDiameter":78.49},
      0.25: {"paperStripMarginTop":56.2,"paperStripHeight":185.17,"coilRectTop":211.44,"coilRectHeight":68.85,"coilDiameter":68.85},
      0.5: {"paperStripMarginTop":56.2,"paperStripHeight":370.34,"coilRectTop":402.19,"coilRectHeight":57.68,"coilDiameter":57.68},
      0.75: {"paperStripMarginTop":56.2,"paperStripHeight":555.5,"coilRectTop":594.37,"coilRectHeight":43.65,"coilDiameter":43.65},
      1: {"paperStripMarginTop":56.2,"paperStripHeight":740.67,"coilRectTop":790.24,"coilRectHeight":22.19,"coilDiameter":22.19},
    },
  },
  "large stop (SW=6, TG=6, L=800, SR=200)": {
    totalArcLength: 800.78,
    maxUnrollLength: 600.78,
    anchorY: 69.59,
    values: {
      0: {"paperStripMarginTop":69.59,"paperStripHeight":0,"coilRectTop":23,"coilRectHeight":111.16,"coilDiameter":111.16},
      0.25: {"paperStripMarginTop":69.59,"paperStripHeight":150.2,"coilRectTop":178.53,"coilRectHeight":100.47,"coilDiameter":100.47},
      0.5: {"paperStripMarginTop":69.59,"paperStripHeight":300.39,"coilRectTop":334.83,"coilRectHeight":88.25,"coilDiameter":88.25},
      0.75: {"paperStripMarginTop":69.59,"paperStripHeight":450.59,"coilRectTop":492.08,"coilRectHeight":74.12,"coilDiameter":74.12},
      1: {"paperStripMarginTop":69.59,"paperStripHeight":600.78,"coilRectTop":651.03,"coilRectHeight":56.58,"coilDiameter":56.58},
    },
  },
};

// ============================================================
// Run tests
// ============================================================

console.log('Cylinder projection regression tests\n');

for (const { name, params } of paramSets) {
  console.log(`--- ${name} ---`);
  const scaffold = computeScaffold(params);
  const expected = SNAPSHOTS[name];

  if (!expected) {
    console.error(`  No snapshot for "${name}" — run with --generate`);
    failed++;
    continue;
  }

  // Verify scaffold values
  if (Math.abs(round2(scaffold.totalArcLength) - expected.totalArcLength) > 0.01) {
    console.error(`  FAIL totalArcLength: expected ${expected.totalArcLength}, got ${round2(scaffold.totalArcLength)}`);
    failed++;
  } else {
    passed++;
  }

  if (Math.abs(round2(scaffold.anchorY) - expected.anchorY) > 0.01) {
    console.error(`  FAIL anchorY: expected ${expected.anchorY}, got ${round2(scaffold.anchorY)}`);
    failed++;
  } else {
    passed++;
  }

  // Verify projection at each unroll percentage
  for (const pct of unrollPcts) {
    const ul = scaffold.maxUnrollLength * pct;
    const actual = snapshotProjection(ul, scaffold);
    const exp = expected.values[pct];

    if (!exp) {
      console.error(`  No snapshot for ${pct * 100}%`);
      failed++;
      continue;
    }

    assertClose(`${name} @ ${pct * 100}%`, actual, exp);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
