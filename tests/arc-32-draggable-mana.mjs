/**
 * Arc 32 verification: Draggable mana symbols on welcome page canvas
 *
 * Tests:
 * 1. Canvas #gas is present and visible
 * 2. Particles initialize (canvas has drawn pixels)
 * 3. Mouse drag fires mana-gas-drag CustomEvent with correct detail fields
 * 4. Release velocity is non-zero after a fast drag
 * 5. Multiple drags fire separate events
 * 6. Stop button still toggles pause
 * 7. Fan button still applies velocity boost
 *
 * Note: The #app overlay sits above the canvas (z-index 1 vs 0), so
 * Playwright's page.mouse events don't reach the canvas. We dispatch
 * MouseEvents directly on the canvas element via page.evaluate().
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

let passes = 0;
let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

/**
 * Find the center of a mana symbol on the canvas.
 * Strategy: find an opaque pixel, then scan a 48x48 area around it to find
 * the densest cluster center. Returns {x, y} or null.
 */
async function findParticleCenter(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('gas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Find first opaque pixel
    let seedX = -1, seedY = -1;
    outer:
    for (let y = 30; y < h - 30; y += 8) {
      for (let x = 30; x < w - 30; x += 8) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] > 100) {
          seedX = x;
          seedY = y;
          break outer;
        }
      }
    }
    if (seedX < 0) return null;

    // Now scan a 60x60 area around the seed to find the centroid of opaque pixels
    const R = 30;
    let sumX = 0, sumY = 0, count = 0;
    for (let dy = -R; dy <= R; dy += 4) {
      for (let dx = -R; dx <= R; dx += 4) {
        const px = seedX + dx;
        const py = seedY + dy;
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        if (pixel[3] > 50) {
          sumX += px;
          sumY += py;
          count++;
        }
      }
    }
    if (count === 0) return { x: seedX, y: seedY };
    return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
  });
}

/**
 * Simulate a drag on the canvas by dispatching MouseEvents directly.
 * The #app div overlays the canvas (z-index 1 vs 0), so Playwright's
 * page.mouse doesn't reach the canvas. We dispatch events ourselves.
 *
 * @param {object} page - Playwright page
 * @param {number} startX - starting x
 * @param {number} startY - starting y
 * @param {number} dx - total horizontal drag distance
 * @param {number} dy - total vertical drag distance
 * @param {number} steps - number of intermediate moves
 */
async function simulateCanvasDrag(page, startX, startY, dx, dy, steps = 6) {
  await page.evaluate(({ startX, startY, dx, dy, steps }) => {
    const canvas = document.getElementById('gas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    function fire(type, clientX, clientY) {
      canvas.dispatchEvent(new MouseEvent(type, {
        clientX, clientY,
        bubbles: true,
        cancelable: true,
      }));
    }

    // mousedown
    fire('mousedown', rect.left + startX, rect.top + startY);

    // mousemove in steps
    for (let i = 1; i <= steps; i++) {
      const frac = i / steps;
      fire('mousemove', rect.left + startX + dx * frac, rect.top + startY + dy * frac);
    }

    // mouseup
    fire('mouseup', rect.left + startX + dx, rect.top + startY + dy);
  }, { startX, startY, dx, dy, steps });
}

/**
 * Same as above but with delays between moves (for velocity calculation).
 */
async function simulateCanvasDragWithDelay(page, startX, startY, dx, dy, steps = 6, stepDelayMs = 20) {
  // mousedown
  await page.evaluate(({ startX, startY }) => {
    const canvas = document.getElementById('gas');
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent('mousedown', {
      clientX: rect.left + startX,
      clientY: rect.top + startY,
      bubbles: true,
      cancelable: true,
    }));
  }, { startX, startY });

  // mousemove in steps with delays
  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    await page.evaluate(({ startX, startY, dx, dy, frac }) => {
      const canvas = document.getElementById('gas');
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: rect.left + startX + dx * frac,
        clientY: rect.top + startY + dy * frac,
        bubbles: true,
        cancelable: true,
      }));
    }, { startX, startY, dx, dy, frac });
    await page.waitForTimeout(stepDelayMs);
  }

  // mouseup
  await page.evaluate(({ startX, startY, dx, dy }) => {
    const canvas = document.getElementById('gas');
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new MouseEvent('mouseup', {
      clientX: rect.left + startX + dx,
      clientY: rect.top + startY + dy,
      bubbles: true,
      cancelable: true,
    }));
  }, { startX, startY, dx, dy });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Canvas is present and visible
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Canvas #gas is present ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      const canvasEl = await page.$('canvas#gas');
      assert(canvasEl !== null, 'canvas#gas element is present');

      const canvasVisible = await page.isVisible('canvas#gas');
      assert(canvasVisible, 'canvas#gas is visible');

      const box = await canvasEl.boundingBox();
      assert(box && box.width > 100 && box.height > 100, `Canvas has meaningful size (${box?.width}x${box?.height})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Particles initialize after SVG images load
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Particles initialize ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const hasPixels = await page.evaluate(() => {
        const canvas = document.getElementById('gas');
        if (!canvas) return false;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let nonZero = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
          if (imageData.data[i + 3] > 0) {
            nonZero++;
            if (nonZero > 100) return true;
          }
        }
        return nonZero > 10;
      });
      assert(hasPixels, 'Canvas has drawn pixels (particles are rendering)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Mouse drag fires mana-gas-drag CustomEvent
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Mouse drag fires mana-gas-drag CustomEvent ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Pause animation so particles hold still while we find them
      await page.click('#gas-stop-btn');
      await page.waitForTimeout(200);

      // Set up CustomEvent listener
      await page.evaluate(() => {
        window.__dragEvents = [];
        window.addEventListener('mana-gas-drag', (e) => {
          window.__dragEvents.push(e.detail);
        });
      });

      // Find a particle by scanning canvas pixels
      const pos = await findParticleCenter(page);
      assert(pos !== null, `Found particle center on canvas at (${pos?.x}, ${pos?.y})`);

      if (pos) {
        // Drag while paused — particles stay put, but drag events still fire.
        // The canvas event listeners work regardless of pause state.
        await simulateCanvasDragWithDelay(page, pos.x, pos.y, 100, 40, 6, 20);
        await page.waitForTimeout(100);
      }

      const dragEvents = await page.evaluate(() => window.__dragEvents || []);
      assert(dragEvents.length > 0, `mana-gas-drag event fired (got ${dragEvents.length} event(s))`);

      if (dragEvents.length > 0) {
        const evt = dragEvents[0];
        assert(typeof evt.color === 'string' && ['W', 'U', 'B', 'R', 'G'].includes(evt.color),
          `Event has valid color field (got: "${evt.color}")`);
        assert(typeof evt.duration_ms === 'number' && evt.duration_ms > 0,
          `Event has positive duration_ms (got: ${evt.duration_ms})`);
        assert(typeof evt.release_vx === 'number',
          `Event has numeric release_vx (got: ${evt.release_vx})`);
        assert(typeof evt.release_vy === 'number',
          `Event has numeric release_vy (got: ${evt.release_vy})`);
        console.log(`  INFO: Drag detail — color=${evt.color}, duration_ms=${evt.duration_ms}, vx=${evt.release_vx}, vy=${evt.release_vy}`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Release momentum — velocity is non-zero after deliberate drag
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Release velocity is non-zero for a real drag ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Pause to find particles
      await page.click('#gas-stop-btn');
      await page.waitForTimeout(200);

      await page.evaluate(() => {
        window.__dragEvents = [];
        window.addEventListener('mana-gas-drag', (e) => {
          window.__dragEvents.push(e.detail);
        });
      });

      const pos = await findParticleCenter(page);

      if (pos) {
        // Drag while still paused — particles hold still but drag events fire.
        // The velocity is computed from drag history regardless of pause state.
        await simulateCanvasDragWithDelay(page, pos.x, pos.y, 150, 60, 6, 16);
        await page.waitForTimeout(100);
      }

      const events = await page.evaluate(() => window.__dragEvents || []);
      let gotNonZero = false;
      if (events.length > 0) {
        const evt = events[events.length - 1];
        gotNonZero = (evt.release_vx !== 0 || evt.release_vy !== 0);
        if (gotNonZero) {
          console.log(`  INFO: Non-zero velocity — vx=${evt.release_vx}, vy=${evt.release_vy}`);
        }
      }
      assert(gotNonZero, 'Release velocity is non-zero after a fast drag');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Multiple drags fire separate events
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Multiple drags fire separate events ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Pause to keep particles still
      await page.click('#gas-stop-btn');
      await page.waitForTimeout(200);

      await page.evaluate(() => {
        window.__dragEvents = [];
        window.addEventListener('mana-gas-drag', (e) => {
          window.__dragEvents.push(e.detail);
        });
      });

      // Find particle centers using centroid approach
      const positions = await page.evaluate(() => {
        const canvas = document.getElementById('gas');
        if (!canvas) return [];
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const seeds = [];
        const minDist = 60;

        // Find seed pixels for distinct clusters
        for (let y = 30; y < h - 30; y += 8) {
          for (let x = 30; x < w - 30; x += 8) {
            if (seeds.length >= 5) break;
            const pixel = ctx.getImageData(x, y, 1, 1).data;
            if (pixel[3] > 100) {
              const tooClose = seeds.some(s => {
                const dx2 = s.x - x;
                const dy2 = s.y - y;
                return Math.sqrt(dx2 * dx2 + dy2 * dy2) < minDist;
              });
              if (!tooClose) seeds.push({ x, y });
            }
          }
        }

        // Compute centroid for each seed
        const R = 30;
        return seeds.map(seed => {
          let sumX = 0, sumY = 0, count = 0;
          for (let dy = -R; dy <= R; dy += 4) {
            for (let dx = -R; dx <= R; dx += 4) {
              const px = seed.x + dx;
              const py = seed.y + dy;
              if (px < 0 || px >= w || py < 0 || py >= h) continue;
              const pixel = ctx.getImageData(px, py, 1, 1).data;
              if (pixel[3] > 50) {
                sumX += px;
                sumY += py;
                count++;
              }
            }
          }
          if (count === 0) return seed;
          return { x: Math.round(sumX / count), y: Math.round(sumY / count) };
        });
      });

      console.log(`  INFO: Found ${positions.length} distinct particle centers`);

      // Drag each particle while paused (events still fire)
      // Use small drag distance so position doesn't matter as much
      for (let i = 0; i < Math.min(positions.length, 3); i++) {
        const pos = positions[i];
        const dx = (i % 2 === 0) ? 40 : -40;
        await simulateCanvasDragWithDelay(page, pos.x, pos.y, dx, 15, 4, 20);
        await page.waitForTimeout(150);

        const count = await page.evaluate(() => (window.__dragEvents || []).length);
        if (count >= 2) break; // Got enough
      }

      const hitCount = await page.evaluate(() => (window.__dragEvents || []).length);
      assert(hitCount >= 2, `Multiple drag events fired (got ${hitCount})`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Stop button still toggles pause
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Stop button toggles pause ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const stopBtnVisible = await page.isVisible('#gas-stop-btn');
      assert(stopBtnVisible, 'Stop button (#gas-stop-btn) is visible');

      await page.click('#gas-stop-btn');
      await page.waitForTimeout(100);

      const hasStopped = await page.evaluate(() => {
        const btn = document.getElementById('gas-stop-btn');
        return btn && btn.classList.contains('stopped');
      });
      assert(hasStopped, 'Stop button has "stopped" class after first click (paused)');

      const hasPlayIcon = await page.evaluate(() => {
        const btn = document.getElementById('gas-stop-btn');
        const svg = btn?.querySelector('svg');
        return svg?.innerHTML.includes('polygon');
      });
      assert(hasPlayIcon, 'Stop button shows play icon (polygon) when paused');

      await page.click('#gas-stop-btn');
      await page.waitForTimeout(100);

      const notStopped = await page.evaluate(() => {
        const btn = document.getElementById('gas-stop-btn');
        return btn && !btn.classList.contains('stopped');
      });
      assert(notStopped, 'Stop button no longer has "stopped" class after second click (resumed)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Fan button still works
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Fan button boosts particles ===\n');
    {
      const page = await browser.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const fanBtnVisible = await page.isVisible('#gas-fan-btn');
      assert(fanBtnVisible, 'Fan button (#gas-fan-btn) is visible');

      await page.click('#gas-fan-btn');
      await page.waitForTimeout(100);

      const hasSpinning = await page.evaluate(() => {
        const btn = document.getElementById('gas-fan-btn');
        const svg = btn?.querySelector('svg');
        return svg?.classList.contains('spinning');
      });
      assert(hasSpinning, 'Fan button SVG gets "spinning" class after click');

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('\n=== Summary ===');
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);
  console.log(`  Total:  ${passes + failures}`);

  if (failures > 0) {
    console.error(`\nArc 32 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 32 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
