import { chromium } from 'playwright';
import { createServer } from 'http';
import handler from 'serve-handler';

const PORT = 3847;

const server = createServer((req, res) => handler(req, res, { public: '.' }));
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`http://localhost:${PORT}/slides?subgroup=allied`);
await page.waitForTimeout(500);

// Step 0: placeholder card + hidden scroll
await page.screenshot({ path: 'tests/screenshots/step0-placeholder.png', fullPage: false });
console.log('Step 0: placeholder card screenshot taken');

// Step 1: Space → scroll fades in
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: 'tests/screenshots/step1-scroll-visible.png', fullPage: false });
console.log('Step 1: scroll visible screenshot taken');

// Step 2: Space → modal with LEVEL title + intro-scroll
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: 'tests/screenshots/step2-modal.png', fullPage: false });
console.log('Step 2: modal screenshot taken');

// Step 3: Space → transition to first card
await page.keyboard.press('Space');
await page.waitForTimeout(800);
await page.screenshot({ path: 'tests/screenshots/step3-first-card.png', fullPage: false });
console.log('Step 3: first card screenshot taken');

await browser.close();
server.close();
console.log('Done!');
