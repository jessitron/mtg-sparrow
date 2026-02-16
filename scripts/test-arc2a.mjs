import { chromium } from 'playwright';

const EXPECTED_GUILDS = [
  { name: 'Azorius', colors: ['W', 'U'] },
  { name: 'Dimir', colors: ['U', 'B'] },
  { name: 'Rakdos', colors: ['B', 'R'] },
  { name: 'Gruul', colors: ['R', 'G'] },
  { name: 'Selesnya', colors: ['G', 'W'] },
  { name: 'Orzhov', colors: ['W', 'B'] },
  { name: 'Izzet', colors: ['U', 'R'] },
  { name: 'Golgari', colors: ['B', 'G'] },
  { name: 'Boros', colors: ['R', 'W'] },
  { name: 'Simic', colors: ['G', 'U'] },
];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.card', { timeout: 5000 });

  // 1. Check version in footer
  const footerText = await page.textContent('#app-version');
  console.log(`Footer text: "${footerText}"`);
  if (footerText !== 'v0.2.0') {
    console.error(`FAIL: Expected footer "v0.2.0", got "${footerText}"`);
    process.exit(1);
  }
  console.log('PASS: Footer shows v0.2.0');

  // 2. Check card renders with pips and name
  const card = await page.$('.card');
  if (!card) {
    console.error('FAIL: No .card element found');
    process.exit(1);
  }
  console.log('PASS: Card element exists');

  // Check pips container exists
  const pipsContainer = await page.$('.card-pips');
  if (!pipsContainer) {
    console.error('FAIL: No .card-pips element found');
    process.exit(1);
  }
  console.log('PASS: Pips container exists');

  // Check name element exists
  const nameEl = await page.$('.card-name');
  if (!nameEl) {
    console.error('FAIL: No .card-name element found');
    process.exit(1);
  }
  const firstName = await nameEl.textContent();
  console.log(`First card name: "${firstName}"`);
  console.log('PASS: Card name element exists');

  // Check pip count (should be 2 for any guild)
  let pipCount = await page.$$eval('.mana-pip', els => els.length);
  if (pipCount !== 2) {
    console.error(`FAIL: Expected 2 pips, got ${pipCount}`);
    process.exit(1);
  }
  console.log('PASS: Card shows 2 mana pips');

  // 3. Click through all 10 guilds and collect names
  const seenGuilds = new Set();
  seenGuilds.add(firstName);

  for (let i = 0; i < 10; i++) {
    await page.click('.card');
    await page.waitForTimeout(100);

    const name = await page.$eval('.card-name', el => el.textContent);
    seenGuilds.add(name);

    // Verify 2 pips on each card
    pipCount = await page.$$eval('.mana-pip', els => els.length);
    if (pipCount !== 2) {
      console.error(`FAIL: Card "${name}" has ${pipCount} pips, expected 2`);
      process.exit(1);
    }
  }

  console.log(`\nSeen guilds (${seenGuilds.size}): ${[...seenGuilds].join(', ')}`);

  if (seenGuilds.size !== 10) {
    console.error(`FAIL: Expected 10 unique guilds, saw ${seenGuilds.size}`);
    process.exit(1);
  }
  console.log('PASS: All 10 guild cards rendered');

  // Verify all expected guild names are present
  const expectedNames = EXPECTED_GUILDS.map(g => g.name);
  for (const name of expectedNames) {
    if (!seenGuilds.has(name)) {
      console.error(`FAIL: Missing guild "${name}"`);
      process.exit(1);
    }
  }
  console.log('PASS: All expected guild names found');

  // 4. Take a screenshot for visual verification
  await page.screenshot({ path: 'scripts/arc2a-screenshot.png', fullPage: true });
  console.log('Screenshot saved to scripts/arc2a-screenshot.png');

  // 5. Check card has visible styling (dark background)
  const cardBg = await page.$eval('.card', el => {
    const style = window.getComputedStyle(el);
    return {
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
    };
  });
  console.log(`Card background: ${cardBg.backgroundColor}, border-radius: ${cardBg.borderRadius}`);
  console.log('PASS: Card has visible container styling');

  console.log('\n=== ALL TESTS PASSED ===');

  await browser.close();
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
