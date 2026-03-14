/**
 * Generate a CSV and an HTML graph of projection values across the full
 * unroll animation range, for multiple parameter sets.
 *
 * Run: node tests/cylinder-projection-graph.mjs
 * Outputs: tests/cylinder-projection-data.csv
 *          tests/cylinder-projection-graph.html
 */

import { computeScaffold, computeProjection, thetaToArcLength } from '../cylinder-projection.js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PARAM_SETS = [
  { name: 'default', strokeWidth: 6, turnGap: 6, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  { name: 'short', strokeWidth: 6, turnGap: 6, spiralLength: 400, stopRemaining: 30, svgPadding: 20 },
  { name: 'long', strokeWidth: 6, turnGap: 6, spiralLength: 1600, stopRemaining: 120, svgPadding: 20 },
  { name: 'thick', strokeWidth: 12, turnGap: 16, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  { name: 'thin-tight', strokeWidth: 3, turnGap: 3, spiralLength: 800, stopRemaining: 60, svgPadding: 20 },
  { name: 'large-stop', strokeWidth: 6, turnGap: 6, spiralLength: 800, stopRemaining: 200, svgPadding: 20 },
];

const STEPS = 100; // sample points across the animation

// ============================================================
// Generate CSV
// ============================================================

// Ease in-out function (same as prototype)
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

const csvRows = ['paramSet,step,pct,theta,thetaEased,unrolledLength,unrolledLengthEased,paperStripMarginTop,paperStripHeight,coilRectTop,coilRectHeight,coilDiameter'];

const allData = {};

for (const params of PARAM_SETS) {
  const scaffold = computeScaffold(params);
  allData[params.name] = [];

  for (let i = 0; i <= STEPS; i++) {
    const pct = i / STEPS;
    // Linear theta (constant angular velocity)
    const theta = pct * scaffold.thetaStop;
    const unrolledLength = thetaToArcLength(theta, scaffold);
    // Eased theta (ease-in-out on top of angular velocity)
    const thetaEased = easeInOut(pct) * scaffold.thetaStop;
    const unrolledLengthEased = thetaToArcLength(thetaEased, scaffold);
    const proj = computeProjection(unrolledLength, scaffold);
    const projEased = computeProjection(unrolledLengthEased, scaffold);

    allData[params.name].push({
      pct,
      theta,
      thetaEased,
      unrolledLength,
      unrolledLengthEased,
      ...proj,
      // Eased versions with suffix
      coilRectTopEased: projEased.coilRectTop,
      coilRectHeightEased: projEased.coilRectHeight,
      paperStripHeightEased: projEased.paperStripHeight,
      coilDiameterEased: projEased.coilDiameter,
    });

    csvRows.push([
      params.name,
      i,
      pct.toFixed(4),
      theta.toFixed(4),
      thetaEased.toFixed(4),
      unrolledLength.toFixed(2),
      unrolledLengthEased.toFixed(2),
      proj.paperStripMarginTop.toFixed(2),
      proj.paperStripHeight.toFixed(2),
      proj.coilRectTop.toFixed(2),
      proj.coilRectHeight.toFixed(2),
      proj.coilDiameter.toFixed(2),
    ].join(','));
  }
}

const csvPath = join(__dirname, 'cylinder-projection-data.csv');
writeFileSync(csvPath, csvRows.join('\n') + '\n');
console.log(`CSV written to ${csvPath}`);

// ============================================================
// Generate HTML graph
// ============================================================

const colors = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4'];

function buildChartData(paramSets, allData) {
  return paramSets.map((ps, idx) => ({
    name: ps.name,
    color: colors[idx],
    data: allData[ps.name],
  }));
}

const chartData = buildChartData(PARAM_SETS, allData);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cylinder Projection — Values Over Unroll</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 2rem; }
    h1 { margin-bottom: 1rem; color: #f5deb3; }
    h2 { margin: 1.5rem 0 0.5rem; color: #d2b48c; font-size: 1.1rem; }
    .chart-container { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 1200px; }
    canvas { background: #16213e; border: 1px solid #333; border-radius: 4px; width: 100%; height: 300px; }
    .legend { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
    .legend-item { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; }
    .legend-swatch { width: 14px; height: 14px; border-radius: 2px; }
  </style>
</head>
<body>
  <h1>Cylinder Projection Values</h1>
  <p>Each line is a different parameter set. X-axis = animation progress (constant angular velocity). Y-axis = px.</p>

  <div class="legend" id="legend"></div>

  <div class="chart-container">
    <div>
      <h2>Unrolled Length — linear theta</h2>
      <canvas id="chart-unrolledLength"></canvas>
    </div>
    <div>
      <h2>Unrolled Length — eased theta</h2>
      <canvas id="chart-unrolledLengthEased"></canvas>
    </div>
    <div>
      <h2>Coil Position — linear theta</h2>
      <canvas id="chart-coilRectTop"></canvas>
    </div>
    <div>
      <h2>Coil Position — eased theta</h2>
      <canvas id="chart-coilRectTopEased"></canvas>
    </div>
    <div>
      <h2>Coil Height — linear theta</h2>
      <canvas id="chart-coilRectHeight"></canvas>
    </div>
    <div>
      <h2>Coil Height — eased theta</h2>
      <canvas id="chart-coilRectHeightEased"></canvas>
    </div>
    <div>
      <h2>Paper Height — linear theta</h2>
      <canvas id="chart-paperStripHeight"></canvas>
    </div>
    <div>
      <h2>Paper Height — eased theta</h2>
      <canvas id="chart-paperStripHeightEased"></canvas>
    </div>
    <div>
      <h2>Coil Diameter — linear theta</h2>
      <canvas id="chart-coilDiameter"></canvas>
    </div>
    <div>
      <h2>Coil Diameter — eased theta</h2>
      <canvas id="chart-coilDiameterEased"></canvas>
    </div>
  </div>

  <script>
    const chartData = ${JSON.stringify(chartData)};

    // Build legend
    const legendEl = document.getElementById('legend');
    chartData.forEach(series => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = '<div class="legend-swatch" style="background:' + series.color + '"></div>' + series.name;
      legendEl.appendChild(item);
    });

    function drawChart(canvasId, field) {
      const canvas = document.getElementById(canvasId);
      const ctx = canvas.getContext('2d');

      // Set actual pixel dimensions
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;

      // Find value range across all series
      let maxVal = 0;
      for (const series of chartData) {
        for (const d of series.data) {
          if (d[field] > maxVal) maxVal = d[field];
        }
      }
      maxVal = maxVal * 1.1 || 1; // 10% headroom

      const pad = { top: 10, right: 10, bottom: 25, left: 50 };
      const plotW = W - pad.left - pad.right;
      const plotH = H - pad.top - pad.bottom;

      // Axes
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, pad.top);
      ctx.lineTo(pad.left, H - pad.bottom);
      ctx.lineTo(W - pad.right, H - pad.bottom);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#999';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const val = (maxVal * i / 4);
        const y = pad.top + plotH - (plotH * i / 4);
        ctx.fillText(val.toFixed(0), pad.left - 4, y + 4);
      }

      // X-axis labels
      ctx.textAlign = 'center';
      for (let i = 0; i <= 4; i++) {
        const pct = i * 25;
        const x = pad.left + (plotW * i / 4);
        ctx.fillText(pct + '%', x, H - pad.bottom + 15);
      }

      // Plot each series
      for (const series of chartData) {
        ctx.strokeStyle = series.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        series.data.forEach((d, i) => {
          const x = pad.left + (d.pct * plotW);
          const y = pad.top + plotH - (d[field] / maxVal * plotH);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    }

    // Draw on load and resize
    function drawAll() {
      drawChart('chart-unrolledLength', 'unrolledLength');
      drawChart('chart-unrolledLengthEased', 'unrolledLengthEased');
      drawChart('chart-coilRectTop', 'coilRectTop');
      drawChart('chart-coilRectTopEased', 'coilRectTopEased');
      drawChart('chart-coilRectHeight', 'coilRectHeight');
      drawChart('chart-coilRectHeightEased', 'coilRectHeightEased');
      drawChart('chart-paperStripHeight', 'paperStripHeight');
      drawChart('chart-paperStripHeightEased', 'paperStripHeightEased');
      drawChart('chart-coilDiameter', 'coilDiameter');
      drawChart('chart-coilDiameterEased', 'coilDiameterEased');
    }
    drawAll();
    window.addEventListener('resize', drawAll);
  </script>
</body>
</html>`;

const htmlPath = join(__dirname, 'cylinder-projection-graph.html');
writeFileSync(htmlPath, html);
console.log(`Graph written to ${htmlPath}`);
