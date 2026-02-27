/**
 * Arc 13 Revised verification: Prototype 3 Style
 *
 * Tests:
 * 1. "Done for now" button NOT visible on card 1
 * 2. "Done for now" button appears (fade-in) on card 2+
 * 3. Button is centered (inside .done-zone which uses align-items: center)
 * 4. Button is pill-shaped (border-radius >= 20px)
 * 5. Button has accent purple styling (color, border)
 * 6. Button text: "Done for now"
 * 7. Clicking "Done for now" ends the session (shows session-end screen)
 * 8. .done-zone has gradient background
 * 9. Progress row contains Pause button and card counter
 * 10. Card counter shows "Card X / 20"
 * 11. Pause button toggles pause state
 * 12. No .session-footer element
 * 13. No .footer-left element
 * 14. Session capped at 20 cards
 * 15. Mobile viewport (375px): button visible and centered in lower screen area
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
    // PHASE 1: Counter shows "Card X / 20", progress row on card 1
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Progress row and counter ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      // Counter should show "Card 1 / 20"
      const counterText = await page.textContent('.progress-counter');
      console.log(`  Counter text: "${counterText}"`);
      assert(counterText && counterText.includes('/ 20'), 'Counter shows "/ 20"');
      assert(counterText && !counterText.includes('/ 50'), 'Counter does NOT show "/ 50"');
      assert(counterText && counterText.trim().startsWith('Card 1'), 'Counter starts at Card 1');

      // Progress row is present
      const progressRow = await page.$('.progress-row');
      assert(progressRow !== null, '.progress-row element is present');

      // Pause button is inside the progress row
      const pauseBtn = await page.$('.progress-row .control-button');
      assert(pauseBtn !== null, 'Pause button is in .progress-row');

      const pauseBtnText = await page.textContent('.progress-row .control-button');
      assert(pauseBtnText && pauseBtnText.trim() === 'Pause', 'Pause button text is "Pause"');

      await page.screenshot({ path: 'tests/arc13-card1-counter.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: No old footer elements
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: No old footer elements ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      const sessionFooter = await page.$('.session-footer');
      assert(sessionFooter === null, 'No .session-footer element exists');

      const footerLeft = await page.$('.footer-left');
      assert(footerLeft === null, 'No .footer-left element exists');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: "Done for now" button hidden on card 1, visible on card 2
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Done for now button visibility ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      // .done-zone should exist (appended to body)
      const doneZone = await page.$('.done-zone');
      assert(doneZone !== null, '.done-zone is present in the DOM');

      // On card 1, the button should NOT have .button-visible class
      const buttonHasVisible = await page.evaluate(() => {
        const btn = document.querySelector('.done-button');
        return btn ? btn.classList.contains('button-visible') : null;
      });
      assert(buttonHasVisible === false, 'Done button does NOT have .button-visible on card 1');

      // On card 1, the button should be hidden (opacity 0, pointer-events none)
      const buttonOpacity = await page.locator('.done-button').evaluate(el => {
        return parseFloat(window.getComputedStyle(el).opacity);
      });
      console.log(`  Button opacity on card 1: ${buttonOpacity}`);
      assert(buttonOpacity < 0.1, `Button is visually hidden on card 1 (opacity=${buttonOpacity})`);

      // Advance to card 2
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });

      // On card 2, button should have .button-visible class
      const buttonVisibleOnCard2 = await page.evaluate(() => {
        const btn = document.querySelector('.done-button');
        return btn ? btn.classList.contains('button-visible') : false;
      });
      assert(buttonVisibleOnCard2 === true, 'Done button has .button-visible class on card 2');

      // Button text is "Done for now"
      const doneBtnText = await page.textContent('.done-button');
      assert(doneBtnText && doneBtnText.trim() === 'Done for now', 'Button text is "Done for now"');

      await page.screenshot({ path: 'tests/arc13-card2-done-button.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Button is pill-shaped (border-radius >= 20px) and centered
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Button pill shape and centering ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 800, height: 600 });
      await startAlliedSession(page);

      // Advance to card 2 to make button visible
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });
      // Wait for the animation to begin
      await page.waitForTimeout(100);

      // Pill shape: border-radius should be >= 20px
      const borderRadius = await page.locator('.done-button').evaluate(el => {
        return window.getComputedStyle(el).borderRadius;
      });
      console.log(`  Button border-radius: ${borderRadius}`);
      // Parse border-radius (e.g. "24px") — expect >= 20px
      const radiusPx = parseFloat(borderRadius);
      assert(!isNaN(radiusPx) && radiusPx >= 20,
        `Button is pill-shaped (border-radius=${borderRadius}, should be >= 20px)`);

      // Centering: the .done-zone uses align-items:center and the button should be centered
      const doneZoneBox = await page.locator('.done-zone').boundingBox();
      const doneBtnBox = await page.locator('.done-button').boundingBox();
      if (doneZoneBox && doneBtnBox) {
        const zoneMidX = doneZoneBox.x + doneZoneBox.width / 2;
        const btnMidX = doneBtnBox.x + doneBtnBox.width / 2;
        const offsetX = Math.abs(zoneMidX - btnMidX);
        console.log(`  Done zone mid-X: ${zoneMidX.toFixed(0)}, Button mid-X: ${btnMidX.toFixed(0)}, offset: ${offsetX.toFixed(1)}px`);
        assert(offsetX < 10, `Button is horizontally centered within .done-zone (offset=${offsetX.toFixed(1)}px < 10px)`);
      } else {
        assert(false, 'Could not measure .done-zone and .done-button bounding boxes');
      }

      // .done-zone should be at the bottom of the viewport
      if (doneZoneBox) {
        const viewportHeight = 600;
        const zoneBottom = doneZoneBox.y + doneZoneBox.height;
        assert(Math.abs(zoneBottom - viewportHeight) <= 2,
          `.done-zone is at viewport bottom (bottom=${zoneBottom}, viewport=${viewportHeight})`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Button accent purple styling
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Button accent purple styling ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      // Advance to card 2
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });

      // Check button text color is purple (b channel > r and g)
      const buttonColor = await page.locator('.done-button').evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      console.log(`  Button color: ${buttonColor}`);
      const rgbMatch = buttonColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number);
        assert(b > r && b > g, `Button has purple/blue hue (r=${r}, g=${g}, b=${b})`);
      } else {
        assert(false, `Button color in expected format (got: ${buttonColor})`);
      }

      // Check border color has purple hue
      const borderColor = await page.locator('.done-button').evaluate(el => {
        return window.getComputedStyle(el).borderColor;
      });
      console.log(`  Button border-color: ${borderColor}`);
      // border: 1px solid rgba(102, 102, 170, 0.6) — b=170 > r=102
      const borderRgb = borderColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (borderRgb) {
        const [, r, g, b] = borderRgb.map(Number);
        assert(b >= r, `Button border has blue-purple hue (r=${r}, g=${g}, b=${b})`);
      } else {
        assert(false, `Border color in expected format (got: ${borderColor})`);
      }

      // Background is transparent (not opaque)
      const bgColor = await page.locator('.done-button').evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      console.log(`  Button background: ${bgColor}`);
      // transparent = rgba(0, 0, 0, 0)
      const bgAlphaMatch = bgColor.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
      if (bgAlphaMatch) {
        const alpha = parseFloat(bgAlphaMatch[1]);
        assert(alpha < 0.1, `Button background is transparent (alpha=${alpha})`);
      } else {
        // rgb() with no alpha = opaque; rgba(0,0,0,0) is transparent
        assert(bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent',
          `Button background is transparent (got: ${bgColor})`);
      }

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Pause button is functional (toggles state)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Pause button functionality ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      const pauseBtn = await page.$('.progress-row .control-button');
      assert(pauseBtn !== null, 'Pause button is present in progress-row');

      // Click pause
      await page.click('.progress-row .control-button');
      await page.waitForTimeout(100);

      const pausedText = await page.textContent('.progress-row .control-button');
      assert(pausedText && pausedText.trim() === 'Resume', 'After clicking Pause, button reads "Resume"');

      // Click resume
      await page.click('.progress-row .control-button');
      await page.waitForTimeout(100);

      const resumedText = await page.textContent('.progress-row .control-button');
      assert(resumedText && resumedText.trim() === 'Pause', 'After clicking Resume, button reads "Pause"');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: .done-zone has gradient background
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: .done-zone gradient background ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      const bgImage = await page.locator('.done-zone').evaluate(el => {
        return window.getComputedStyle(el).backgroundImage;
      });
      console.log(`  .done-zone background-image: ${bgImage}`);
      assert(bgImage && bgImage.includes('linear-gradient'),
        '.done-zone has a gradient background (linear-gradient)');

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: Clicking "Done for now" ends the session
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: Clicking "Done for now" ends session ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      // Advance through enough cards to get the self-assessment screen (>= 4 cards)
      for (let targetCard = 2; targetCard <= 4; targetCard++) {
        await page.click('.card');
        await page.waitForFunction((target) => {
          const counter = document.querySelector('.progress-counter');
          return counter && counter.textContent && counter.textContent.includes(`Card ${target}`);
        }, targetCard, { timeout: 8000 });
      }

      // Wait for button to be visible
      await page.waitForFunction(() => {
        const btn = document.querySelector('.done-button');
        return btn && btn.classList.contains('button-visible');
      }, { timeout: 5000 });

      // Click "Done for now"
      await page.click('.done-button');

      // Should show session-end screen
      await page.waitForSelector('.session-end', { timeout: 5000 });
      const sessionEndVisible = await page.isVisible('.session-end');
      assert(sessionEndVisible, 'Session-end screen is shown after clicking "Done for now"');

      // Card view should be gone
      const cardGone = await page.$('.card');
      assert(cardGone === null, 'Card view is gone after clicking "Done for now"');

      // .done-zone should be gone
      const doneZoneGone = await page.$('.done-zone');
      assert(doneZoneGone === null, '.done-zone is removed after clicking "Done for now"');

      await page.screenshot({ path: 'tests/arc13-after-done.png' });
      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 9: Session ends after card 20 (not 50)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 9: Session ends after card 20 ===\n');
    {
      const page = await browser.newPage();
      await startAlliedSession(page);

      let lastCardNumber = 0;

      // Tap through all 20 cards — two taps per card (reveal + skip)
      for (let i = 0; i < 22; i++) {
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

        const cardEl = await page.$('.card');
        if (!cardEl) break;
        await page.click('.card');
        await page.waitForTimeout(100);

        const cardEl2 = await page.$('.card');
        if (cardEl2) {
          await page.click('.card');
          await page.waitForTimeout(150);
        }
      }

      // After all taps, session should be on end screen
      await page.waitForFunction(() => {
        return !!document.querySelector('.session-end') || !!document.querySelector('.guild-columns');
      }, { timeout: 10000 });

      const onSessionEnd = await page.$('.session-end');
      const onGuildColumns = await page.$('.guild-columns');
      assert(onSessionEnd !== null || onGuildColumns !== null,
        'Session end or guild columns screen appears after exhausting cards');
      assert(lastCardNumber <= 20,
        `Last card seen was card ${lastCardNumber} (should be <= 20, NOT 50)`);
      assert(lastCardNumber > 15,
        `Got to near the end — last card was ${lastCardNumber} (should be 18-20)`);
      console.log(`  Last card number before end: ${lastCardNumber}`);

      await page.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 10: Mobile viewport (375px) — button visible and centered
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 10: Mobile viewport (375px) ===\n');
    {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      await startAlliedSession(page);

      // .done-zone should be at bottom even on narrow viewport
      const doneZoneBox = await page.locator('.done-zone').boundingBox();
      assert(doneZoneBox !== null, '.done-zone present on 375px viewport');
      if (doneZoneBox) {
        const viewportHeight = 667;
        const zoneBottom = doneZoneBox.y + doneZoneBox.height;
        assert(Math.abs(zoneBottom - viewportHeight) <= 2,
          `.done-zone at bottom on narrow viewport (bottom=${zoneBottom})`);
      }

      // Advance to card 2 to show the button
      await page.click('.card');
      await page.waitForFunction(() => {
        const counter = document.querySelector('.progress-counter');
        return counter && counter.textContent && counter.textContent.includes('Card 2');
      }, { timeout: 8000 });
      await page.waitForTimeout(100);

      const doneBtnBox = await page.locator('.done-button').boundingBox();
      assert(doneBtnBox !== null, '"Done for now" button visible on narrow viewport');
      if (doneBtnBox) {
        // Button center should be within the lower portion of the screen (thumb zone)
        const viewportHeight = 667;
        const btnMidY = doneBtnBox.y + doneBtnBox.height / 2;
        assert(btnMidY > viewportHeight * 0.7,
          `Button in thumb zone on narrow viewport (midY=${btnMidY.toFixed(0)}, 70% threshold=${(viewportHeight * 0.7).toFixed(0)})`);

        // Button should be adequately sized for touch
        assert(doneBtnBox.height >= 30,
          `Button is adequately tall for touch (${doneBtnBox.height.toFixed(0)}px >= 30px)`);

        // Button should be centered horizontally
        const viewportWidth = 375;
        const btnMidX = doneBtnBox.x + doneBtnBox.width / 2;
        const offsetFromCenter = Math.abs(btnMidX - viewportWidth / 2);
        console.log(`  Button midX=${btnMidX.toFixed(0)}, viewport center=${(viewportWidth/2).toFixed(0)}, offset=${offsetFromCenter.toFixed(1)}px`);
        assert(offsetFromCenter < 15, `Button is horizontally centered on narrow viewport (offset=${offsetFromCenter.toFixed(1)}px < 15px)`);
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
    console.error(`\nArc 13 revised verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 13 revised verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
