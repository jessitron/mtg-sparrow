import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load base URL first
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Clear localStorage
  await page.evaluate(() => localStorage.removeItem('sparrow-deck.progression'));

  // Navigate to ?screen=end
  await page.goto(`${BASE_URL}/?screen=end`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Dump the body HTML
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  console.log('Contains guild-columns:', html.includes('guild-columns'));
  console.log('Contains guild-column--allied:', html.includes('guild-column--allied'));

  const appHtml = await page.$eval('#app', el => el.innerHTML).catch(() => 'no #app found');
  console.log('\n#app innerHTML:\n', appHtml.substring(0, 2000));

  await page.screenshot({ path: 'tests/debug-screen-end.png', fullPage: true });
  console.log('\nScreenshot saved: tests/debug-screen-end.png');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
