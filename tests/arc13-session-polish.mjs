/**
 * Arc 13 verification: Session Polish
 *
 * Tests:
 * 1. Session capped at 20 cards (counter shows "Card X / 20")
 * 2. "Done for now" button not visible on card 1
 * 3. "Done for now" button appears on card 2 (with fade-in animation)
 * 4. Button is in a fixed footer bar at the bottom
 * 5. Button is styled with accent purple (not old gray)
 * 6. Clicking "Done for now" ends the session and shows session-end screen
 * 7. Old "Stop" and "Pause" buttons are gone
 * 8. Narrow viewport (375px): footer visible and button thumb-reachable
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';

let failures = 0;
let passes = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passes++;
  } else {
    console.error(`  FAIL: ${message}`);
    failures++;
  }
}

async function startAlliedSession(page) {
  // Navigate to home and start an allied guild session
  await page.goto(`${BASE_URL}/`);
  await page.waitForLoadState('domcontentloaded');
  // Clear any existing progression so we start fresh
  await page.evaluate(() => {
    localStorage.removeItem('sparrow-deck.progression');
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  // Click anywhere on the welcome screen to start
  await page.waitForSelector('#app', { timeout: 8000 });
  await page.click('#app');
  // Wait for session to start (card or guild selection screen)
  await page.waitForTimeout(500);
}

async function startSessionDirectly(page) {
  // Use the end screen to start an allied session
  await page.goto(`${BASE_URL}/?screen=end`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
  await page.click('.guild-column--allied .guild-column-button');
  await page.waitForSelector('.card', { timeout: 8000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Counter shows "/ 20" and not "/ 50"
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Session cap is 20 cards ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.progress-counter', { timeout: 8000 });

      const counterText = await page.textContent('.progress-counter');
      console.log(`  Counter text: "${counterText}"`);
      assert(counterText && counterText.includes('/ 20'), 'Counter shows "/ 20"');
      assert(counterText && !counterText.includes('/ 50'), 'Counter does NOT show "/ 50"');
      assert(counterText && counterText.trim().startsWith('Card 1'), 'Counter starts at Card 1');

      await page.screenshot({ path: 'tests/arc13-card1-counter.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: "Done for now" absent on card 1, present on card 2
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Done for now button visibility ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      // Card 1: "Done for now" should NOT be visible
      const doneOnCard1 = await page.$('.done-button');
      assert(doneOnCard1 === null, '"Done for now" button is absent on card 1');

      // Old Stop/Pause buttons should not exist
      const stopBtn = await page.$('button[id="stop-btn"], button.stop-button, button.stop-session');
      const pauseBtn = await page.$('button[id="pause-btn"], button.pause-button, button.pause-session');
      assert(stopBtn === null, 'Old "Stop" button is gone');
      assert(pauseBtn === null, 'Old "Pause" button is gone');

      // Advance to card 2 by tapping the card (early advance)
      await page.click('.card');
      // Wait for the card to advance to card 2
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });

      // Card 2: "Done for now" should appear
      await page.waitForSelector('.done-button', { timeout: 5000 });
      const doneOnCard2 = await page.$('.done-button');
      assert(doneOnCard2 !== null, '"Done for now" button is present on card 2');

      const doneBtnText = await page.textContent('.done-button');
      assert(doneBtnText && doneBtnText.trim() === 'Done for now', 'Button text is "Done for now"');

      await page.screenshot({ path: 'tests/arc13-card2-done-button.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Footer is fixed at the bottom of the screen
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Footer position ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 800, height: 600 });
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.session-footer', { timeout: 8000 });

      const footerBox = await page.locator('.session-footer').boundingBox();
      assert(footerBox !== null, 'Footer element is present and visible');
      if (footerBox) {
        const viewportHeight = 600;
        const footerBottom = footerBox.y + footerBox.height;
        // Footer should be at the very bottom of the viewport (within 2px tolerance)
        assert(Math.abs(footerBottom - viewportHeight) <= 2,
          `Footer bottom is at viewport bottom (footerBottom=${footerBottom}, viewport=${viewportHeight})`);
      }

      // Verify footer has position:fixed via CSS
      const footerPosition = await page.locator('.session-footer').evaluate(el => {
        return window.getComputedStyle(el).position;
      });
      assert(footerPosition === 'fixed', `Footer has position:fixed (got "${footerPosition}")`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Button styled with accent purple
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Button accent purple styling ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      // Advance to card 2 to see done button
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });
      await page.waitForSelector('.done-button', { timeout: 5000 });

      // Check button color is in purple range (not plain gray)
      const buttonColor = await page.locator('.done-button').evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      console.log(`  Button color: ${buttonColor}`);
      // Purple accent: c0b0f0 = rgb(192, 176, 240) — blue channel highest
      // We verify it is NOT a plain gray (where r≈g≈b)
      const rgbMatch = buttonColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        assert(b > r && b > g, `Button color has blue-purple hue (r=${r}, g=${g}, b=${b})`);
      } else {
        assert(false, `Button color is in expected format (got: ${buttonColor})`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Clicking "Done for now" ends the session
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Clicking "Done for now" ends session ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      // Advance through cards until card 4 (so we get self-assessment on stop)
      // SELF_ASSESSMENT_MIN_CARDS = 3, so stopping after 4 cards shows the full session-end screen
      for (let targetCard = 2; targetCard <= 4; targetCard++) {
        await page.click('.card');
        await page.waitForFunction((target) => {
          const counter = document.querySelector('.progress-counter');
          return counter && counter.textContent && counter.textContent.includes(`Card ${target}`);
        }, targetCard, { timeout: 8000 });
      }
      await page.waitForSelector('.done-button', { timeout: 5000 });

      // Click "Done for now"
      await page.click('.done-button');

      // Should show session-end screen with self-assessment (stopped after ≥4 cards)
      await page.waitForSelector('.session-end', { timeout: 5000 });
      const sessionEndVisible = await page.isVisible('.session-end');
      assert(sessionEndVisible, 'Session-end screen is shown after clicking "Done for now"');

      // The card view should be gone
      const cardGone = await page.$('.card');
      assert(cardGone === null, 'Card view is gone after clicking "Done for now"');

      // The footer should be gone
      const footerGone = await page.$('.session-footer');
      assert(footerGone === null, 'Session footer is gone after clicking "Done for now"');

      await page.screenshot({ path: 'tests/arc13-after-done.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Session ends after card 20 (not card 50)
    // Verify by rapidly tapping through all 20 cards: two taps per card
    // (first tap reveals name early, second tap skips advance delay).
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Session ends after card 20 ===\n');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.card', { timeout: 8000 });

      let lastCardNumber = 0;

      // Tap through all 20 cards — two taps per card (reveal + skip)
      for (let i = 0; i < 22; i++) {
        // Check if session ended
        const onEnd = await page.$('.session-end');
        if (onEnd) break;
        const onEndColumns = await page.$('.guild-columns');
        if (onEndColumns) break;

        // Record current card number
        const counterEl = await page.$('.progress-counter');
        if (counterEl) {
          const text = await counterEl.textContent();
          const match = text && text.match(/Card (\d+)/);
          if (match) lastCardNumber = parseInt(match[1], 10);
        }

        // First tap: reveal name (or skip directly if name already revealed)
        const cardEl = await page.$('.card');
        if (!cardEl) break;
        await page.click('.card');
        await page.waitForTimeout(100);

        // Second tap: skip advance delay (advances to next card)
        const cardEl2 = await page.$('.card');
        if (cardEl2) {
          await page.click('.card');
          await page.waitForTimeout(150);
        }
      }

      // After all taps, session should be on end screen
      // Session completed = all 20 cards done → shows self-assessment (.session-end)
      // Wait for either session-end (20 cards = complete) or guild-columns (edge case)
      await page.waitForFunction(() => {
        return !!document.querySelector('.session-end') || !!document.querySelector('.guild-columns');
      }, { timeout: 10000 });

      const onSessionEnd = await page.$('.session-end');
      const onGuildColumns = await page.$('.guild-columns');
      assert(onSessionEnd !== null || onGuildColumns !== null,
        'Session end or guild columns screen appears after exhausting cards');
      assert(lastCardNumber <= 20,
        `Last card seen was card ${lastCardNumber} (should be ≤ 20, NOT 50)`);
      assert(lastCardNumber > 15,
        `Got to near the end — last card was ${lastCardNumber} (should be 18-20)`);
      console.log(`  Last card number before end: ${lastCardNumber}`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Narrow viewport (375px) — footer visible, button thumb-reachable
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Narrow viewport (375px) ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/?screen=end`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.guild-column--allied .guild-column-button', { timeout: 8000 });
      await page.click('.guild-column--allied .guild-column-button');
      await page.waitForSelector('.session-footer', { timeout: 8000 });

      // Check footer is visible at bottom
      const footerBox = await page.locator('.session-footer').boundingBox();
      assert(footerBox !== null, 'Footer visible on 375px viewport');
      if (footerBox) {
        const viewportHeight = 667;
        const footerBottom = footerBox.y + footerBox.height;
        assert(Math.abs(footerBottom - viewportHeight) <= 2,
          `Footer at bottom on narrow viewport (footerBottom=${footerBottom})`);
        // Footer should be at least 44px tall for thumb reachability
        assert(footerBox.height >= 44,
          `Footer height is thumb-reachable (${footerBox.height}px >= 44px)`);
      }

      // Advance to card 2 to check done button on narrow viewport
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });
      await page.waitForSelector('.done-button', { timeout: 5000 });

      const doneBtnBox = await page.locator('.done-button').boundingBox();
      assert(doneBtnBox !== null, '"Done for now" button visible on narrow viewport');
      if (doneBtnBox) {
        // Button should be within the lower portion of the screen (last 25% — thumb zone)
        const viewportHeight = 667;
        const btnMidY = doneBtnBox.y + doneBtnBox.height / 2;
        assert(btnMidY > viewportHeight * 0.7,
          `Button in thumb zone on narrow viewport (midY=${btnMidY.toFixed(0)}, 70% threshold=${(viewportHeight * 0.7).toFixed(0)})`);
        // Button should be adequately sized for touch (min 30px tall)
        assert(doneBtnBox.height >= 30,
          `Button is adequately tall for touch (${doneBtnBox.height.toFixed(0)}px >= 30px)`);
      }

      await page.screenshot({ path: 'tests/arc13-narrow-viewport.png' });
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
    console.error(`\nArc 13 verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 13 verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
