import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Enable console logging
page.on('console', msg => console.log('BROWSER:', msg.text()));

console.log('Navigating to http://localhost:3847/?debug=on ...');
await page.goto('http://localhost:3847/?debug=on');

// Wait for the page to fully load
await page.waitForLoadState('networkidle');
console.log('Page loaded. Waiting for spans to flush (10 seconds)...');

// Wait for spans to flush
await page.waitForTimeout(10000);

console.log('Done waiting. Closing browser.');
await browser.close();
console.log('Browser closed.');
