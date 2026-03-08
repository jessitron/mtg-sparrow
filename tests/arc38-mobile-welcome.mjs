/**
 * Arc 38 verification: Mobile Welcome & Responsiveness
 *
 * Tests at desktop (1024x768) and mobile (375x667) viewports:
 * 1. Desktop unchanged: full content visible (heading, paragraph, detailed list, button)
 * 2. Mobile content: condensed content ("MTG Colors", short 3-item list, "Start" button)
 * 3. No paragraph on mobile: "I swear..." paragraph hidden
 * 4. Button works on mobile: "Start" navigates to slides page
 * 5. Button works on desktop: "Learn guild names" navigates to slides page
 * 6. Tappable button: mobile button has at least 44px height
 * 7. No horizontal scrolling at 375px width
 * 8. Mana gas doesn't block: buttons clickable on mobile
 *
 * Server must be running at http://localhost:3847 before running this script.
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

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // =========================================================================
    // DESKTOP TESTS (1024x768)
    // =========================================================================
    console.log('\n=== Desktop viewport (1024x768) ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
      const page = await ctx.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // 1. Desktop shows full content
      console.log('--- 1. Desktop unchanged: full content visible ---');
      const desktopDiv = page.locator('.welcome-desktop');
      const mobileDiv = page.locator('.welcome-mobile');

      const desktopVisible = await desktopDiv.isVisible();
      assert(desktopVisible, 'Desktop content div is visible at 1024px');

      const mobileVisible = await mobileDiv.isVisible();
      assert(!mobileVisible, 'Mobile content div is hidden at 1024px');

      const heading = await desktopDiv.locator('.welcome-heading').textContent();
      assert(heading.includes('Learn MTG Color Combinations'), `Desktop heading: "${heading}"`);

      const paragraph = page.locator('.welcome-instructions');
      const paraVisible = await paragraph.isVisible();
      assert(paraVisible, 'Paragraph "I swear..." is visible on desktop');
      const paraText = await paragraph.textContent();
      assert(paraText.includes('I swear'), `Paragraph contains expected text`);

      const listItems = await desktopDiv.locator('.welcome-instructions-list li').count();
      assert(listItems >= 3, `Desktop has ${listItems} list items (expected >= 3)`);

      const buttonText = await desktopDiv.locator('.welcome-button').textContent();
      assert(buttonText.trim() === 'Learn guild names', `Desktop button text: "${buttonText.trim()}"`);

      // 5. Desktop button navigates to slides
      console.log('--- 5. Desktop button navigates to slides ---');
      await desktopDiv.locator('.welcome-button').click();
      await page.waitForURL(/\/slides/, { timeout: 5000 });
      const desktopUrl = page.url();
      assert(desktopUrl.includes('/slides'), `Desktop button navigated to: ${desktopUrl}`);

      await ctx.close();
    }

    // =========================================================================
    // MOBILE TESTS (375x667)
    // =========================================================================
    console.log('\n=== Mobile viewport (375x667) ===\n');
    {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
      const page = await ctx.newPage();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);

      // 2. Mobile content visible
      console.log('--- 2. Mobile content: condensed ---');
      const desktopDiv = page.locator('.welcome-desktop');
      const mobileDiv = page.locator('.welcome-mobile');

      const desktopVisible = await desktopDiv.isVisible();
      assert(!desktopVisible, 'Desktop content div is hidden at 375px');

      const mobileVisible = await mobileDiv.isVisible();
      assert(mobileVisible, 'Mobile content div is visible at 375px');

      const heading = await mobileDiv.locator('.welcome-heading').textContent();
      assert(heading.includes('MTG Colors'), `Mobile heading: "${heading}"`);

      const listItems = await mobileDiv.locator('.welcome-instructions-list li').allTextContents();
      assert(listItems.length === 3, `Mobile has ${listItems.length} list items`);
      assert(listItems[0].includes('See a combo'), `Mobile list item 1: "${listItems[0]}"`);

      const buttonText = await mobileDiv.locator('.welcome-button').textContent();
      assert(buttonText.trim() === 'Start', `Mobile button text: "${buttonText.trim()}"`);

      // 3. No paragraph on mobile
      console.log('--- 3. No paragraph on mobile ---');
      const paragraph = page.locator('.welcome-instructions');
      const paraVisible = await paragraph.isVisible();
      assert(!paraVisible, '"I swear..." paragraph is hidden on mobile');

      // 6. Tappable button: at least 44px height
      console.log('--- 6. Tappable button (>= 44px height) ---');
      const buttonBox = await mobileDiv.locator('.welcome-button').boundingBox();
      assert(buttonBox !== null, 'Mobile button has a bounding box');
      if (buttonBox) {
        assert(buttonBox.height >= 44, `Mobile button height: ${buttonBox.height}px (>= 44px required)`);
      }

      // 7. No horizontal scrolling
      console.log('--- 7. No horizontal scrolling at 375px ---');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = 375;
      assert(scrollWidth <= viewportWidth, `Document scrollWidth ${scrollWidth}px <= viewport ${viewportWidth}px`);

      // 8. Mana gas doesn't block clicks
      console.log('--- 8. Mana gas does not block button clicks ---');
      // The canvas is behind the content. We verify by actually clicking.
      const buttonClickable = await mobileDiv.locator('.welcome-button').isEnabled();
      assert(buttonClickable, 'Mobile button is enabled');

      // 4. Mobile button navigates to slides
      console.log('--- 4. Mobile button navigates to slides ---');
      await mobileDiv.locator('.welcome-button').click();
      await page.waitForURL(/\/slides/, { timeout: 5000 });
      const mobileUrl = page.url();
      assert(mobileUrl.includes('/slides'), `Mobile button navigated to: ${mobileUrl}`);

      await ctx.close();
    }

    // =========================================================================
    // Summary
    // =========================================================================
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Arc 38 Mobile Welcome: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
    console.log('='.repeat(50));

  } finally {
    await browser.close();
  }

  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
