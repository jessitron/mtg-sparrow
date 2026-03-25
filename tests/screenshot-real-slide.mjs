import { chromium } from 'playwright';
import { createServer } from 'http';
import handler from 'serve-handler';

const PORT = 3848;

const server = createServer((req, res) => handler(req, res, { public: '.' }));
await new Promise(r => server.listen(PORT, r));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Skip through the intro to get to a real slide
await page.goto(`http://localhost:${PORT}/slides?subgroup=allied`);
await page.waitForTimeout(500);

// 3 spaces to get through intro
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForTimeout(400);
await page.keyboard.press('Space');
await page.waitForTimeout(800);

// Now we're on the first real slide — screenshot before name reveals
await page.screenshot({ path: 'tests/screenshots/real-slide-before-reveal.png', fullPage: false });
console.log('Real slide (name hidden) screenshot taken');

// Wait for name to reveal (REVEAL_DELAY_MS = 3000)
await page.waitForTimeout(3200);
await page.screenshot({ path: 'tests/screenshots/real-slide-after-reveal.png', fullPage: false });
console.log('Real slide (name revealed) screenshot taken');

await browser.close();
server.close();
console.log('Done!');
