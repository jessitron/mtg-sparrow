import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Loading page to send 0.2.0 spans...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.card', { timeout: 5000 });

  // Wait for SDK to flush spans
  console.log('Waiting 10s for Honeycomb SDK to flush...');
  await page.waitForTimeout(10000);

  console.log('Done. Spans should be in Honeycomb now.');
  await browser.close();
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
