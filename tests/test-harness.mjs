import { chromium } from 'playwright';

const PORT = 3007;

const { execSync, spawn } = await import('child_process');
execSync('npm run build:harness', { stdio: 'inherit' });

const server = spawn('npx', ['serve', '.', '-l', String(PORT)], {
  stdio: 'pipe',
  detached: true,
});
server.stderr.on('data', d => process.stderr.write(d));
await new Promise(r => setTimeout(r, 2000));

try {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  page.on('requestfailed', req => {
    console.log(`  NETWORK FAIL: ${req.url()} — ${req.failure().errorText}`);
  });

  console.log(`\n--- Loading http://localhost:${PORT}/sequence-harness.html ---`);
  const response = await page.goto(`http://localhost:${PORT}/sequence-harness.html`);
  console.log(`  HTTP ${response.status()}`);

  await page.waitForSelector('#generate-btn', { timeout: 5000 });
  console.log('PASS: Page loaded, Generate button found');

  // Default: 5 combos, 10 cards each, length 25
  await page.click('#generate-btn');
  await page.waitForTimeout(500);

  const rows = await page.locator('.sequence-row').all();
  console.log(`PASS: ${rows.length} rows rendered`);

  if (rows.length === 0) {
    const html = await page.locator('#output').innerHTML();
    console.log('FAIL: No rows. Output HTML:', html.substring(0, 500));
  } else {
    console.log('\n--- First 10 rows ---');
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const text = await rows[i].textContent();
      console.log(`  ${text.trim()}`);
    }
    if (rows.length > 10) {
      console.log('  ...');
      const last = await rows[rows.length - 1].textContent();
      console.log(`  ${last.trim()}`);
    }

    if (rows.length === 25) {
      console.log('PASS: Default length 25 produced 25 rows');
    } else {
      console.log(`WARN: Expected 25 rows, got ${rows.length}`);
    }
  }

  // Test changing length
  await page.fill('#length-input', '10');
  await page.click('#generate-btn');
  await page.waitForTimeout(500);
  const shortRows = await page.locator('.sequence-row').all();
  console.log(`\n--- Length 10: ${shortRows.length} rows ---`);
  if (shortRows.length === 10) {
    console.log('PASS: Custom length works');
  } else {
    console.log(`WARN: Expected 10 rows, got ${shortRows.length}`);
  }

  // Test 3 combos
  await page.fill('#combo-count-input', '3');
  await page.fill('#length-input', '9');
  await page.click('#generate-btn');
  await page.waitForTimeout(500);
  const threeRows = await page.locator('.sequence-row').all();
  console.log(`\n--- 3 combos, length 9 ---`);
  for (const row of threeRows) {
    const text = await row.textContent();
    console.log(`  ${text.trim()}`);
  }

  if (errors.length > 0) {
    console.log('\n--- Console errors ---');
    errors.forEach(e => console.log('  ERROR:', e));
  } else {
    console.log('\nPASS: No console errors');
  }

  await browser.close();
} finally {
  process.kill(-server.pid);
}
