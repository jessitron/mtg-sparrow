/**
 * Arc 57 verification: Combo Page Play Button
 *
 * Verifies that:
 * 1. Play button is visible on combo pages (simic, azorius, grixis)
 * 2. Clicking the button triggers an audio request for the correct combo
 * 3. Button has correct accessibility attributes (aria-label, title)
 * 4. Button is styled consistently (has .combo-play-btn class)
 * 5. No play button appears on non-combo pages (welcome, slides, about)
 *
 * Strategy: Intercept network requests to detect /audio/*.mp3 requests triggered
 * by button click. Check DOM for button presence/absence and attribute correctness.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.37.0';
// Wait for audio network request (async)
const AUDIO_REQUEST_WAIT_MS = 2000;

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  try {
    // --- Phase 1: Button visible and accessible on simic page ---
    console.log('\nPhase 1 — Play button visible and accessible (simic)');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      const btn = page.locator('.combo-play-btn');
      const btnCount = await btn.count();
      assert(btnCount === 1, 'Play button is present on simic page');

      const isVisible = await btn.isVisible();
      assert(isVisible, 'Play button is visible');

      const ariaLabel = await btn.getAttribute('aria-label');
      assert(
        ariaLabel && ariaLabel.toLowerCase().includes('simic'),
        `aria-label includes combo name: "${ariaLabel}"`
      );

      const titleAttr = await btn.getAttribute('title');
      assert(
        titleAttr && titleAttr.toLowerCase().includes('simic'),
        `title includes combo name: "${titleAttr}"`
      );

      await page.close();
    }

    // --- Phase 2: Button visible on azorius page ---
    console.log('\nPhase 2 — Play button visible (azorius)');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      const btn = page.locator('.combo-play-btn');
      const btnCount = await btn.count();
      assert(btnCount === 1, 'Play button is present on azorius page');

      const ariaLabel = await btn.getAttribute('aria-label');
      assert(
        ariaLabel && ariaLabel.toLowerCase().includes('azorius'),
        `aria-label includes "azorius": "${ariaLabel}"`
      );

      await page.close();
    }

    // --- Phase 3: Button visible on grixis page ---
    console.log('\nPhase 3 — Play button visible (grixis)');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/grixis.html`);
      await page.waitForLoadState('networkidle');

      const btn = page.locator('.combo-play-btn');
      const btnCount = await btn.count();
      assert(btnCount === 1, 'Play button is present on grixis page');

      const ariaLabel = await btn.getAttribute('aria-label');
      assert(
        ariaLabel && ariaLabel.toLowerCase().includes('grixis'),
        `aria-label includes "grixis": "${ariaLabel}"`
      );

      await page.close();
    }

    // --- Phase 4: Clicking button triggers correct audio request ---
    console.log('\nPhase 4 — Click triggers audio request for correct combo');
    {
      const page = await browser.newPage();

      const audioRequests = [];
      page.on('request', req => {
        const url = req.url();
        if (url.includes('/audio/') && url.endsWith('.mp3')) {
          audioRequests.push(url);
        }
      });

      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      // Enable sound in localStorage
      await page.evaluate(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'true');
      });

      await page.click('.combo-play-btn');
      await sleep(AUDIO_REQUEST_WAIT_MS);

      assert(audioRequests.length > 0, 'Audio request was made after clicking play button');
      if (audioRequests.length > 0) {
        const requestedUrl = audioRequests[0];
        assert(
          requestedUrl.includes('/audio/simic.mp3'),
          `Audio request is for simic.mp3: ${requestedUrl}`
        );
      }

      await page.close();
    }

    // --- Phase 5: Correct audio for azorius ---
    console.log('\nPhase 5 — Correct audio for azorius combo');
    {
      const page = await browser.newPage();

      const audioRequests = [];
      page.on('request', req => {
        const url = req.url();
        if (url.includes('/audio/') && url.endsWith('.mp3')) {
          audioRequests.push(url);
        }
      });

      await page.goto(`${BASE_URL}/combo/azorius.html`);
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'true');
      });

      await page.click('.combo-play-btn');
      await sleep(AUDIO_REQUEST_WAIT_MS);

      assert(audioRequests.length > 0, 'Audio request made for azorius');
      if (audioRequests.length > 0) {
        assert(
          audioRequests[0].includes('/audio/azorius.mp3'),
          `Audio request is for azorius.mp3: ${audioRequests[0]}`
        );
      }

      await page.close();
    }

    // --- Phase 6: Sound off → no audio request ---
    console.log('\nPhase 6 — Sound disabled → no audio request');
    {
      const page = await browser.newPage();

      const audioRequests = [];
      page.on('request', req => {
        const url = req.url();
        if (url.includes('/audio/') && url.endsWith('.mp3')) {
          audioRequests.push(url);
        }
      });

      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      // Disable sound
      await page.evaluate(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'false');
      });

      await page.click('.combo-play-btn');
      await sleep(AUDIO_REQUEST_WAIT_MS);

      assert(audioRequests.length === 0, 'No audio request when sound is disabled');

      await page.close();
    }

    // --- Phase 7: No play button on non-combo pages ---
    console.log('\nPhase 7 — No play button on non-combo pages');
    {
      const nonComboPages = [
        { path: '/', label: 'welcome (index)' },
        { path: '/slides.html', label: 'slides' },
        { path: '/about.html', label: 'about' },
      ];

      for (const { path, label } of nonComboPages) {
        const page = await browser.newPage();
        try {
          await page.goto(`${BASE_URL}${path}`);
          await page.waitForLoadState('networkidle');

          const btnCount = await page.locator('.combo-play-btn').count();
          assert(btnCount === 0, `No play button on ${label} page`);
        } finally {
          await page.close();
        }
      }
    }

    // --- Phase 8: Button position — placed after .combo-name ---
    console.log('\nPhase 8 — Button is inserted after .combo-name element');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      const isAfterComboName = await page.evaluate(() => {
        const comboName = document.querySelector('.combo-name');
        const playBtn = document.querySelector('.combo-play-btn');
        if (!comboName || !playBtn) return false;
        // nextElementSibling of combo-name should be the play button
        return comboName.nextElementSibling === playBtn;
      });

      assert(isAfterComboName, 'Play button is immediately after .combo-name element');

      await page.close();
    }

    // --- Phase 9: Version marker ---
    console.log('\nPhase 9 — Version marker');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/combo/simic.html`);
      await page.waitForLoadState('networkidle');

      // Open the menu to see the version
      const menuBtn = page.locator('.hamburger-btn, [aria-label="Menu"], button[aria-label*="menu" i]').first();
      const menuBtnCount = await menuBtn.count();
      if (menuBtnCount > 0) {
        await menuBtn.click();
        await sleep(500);
        const bodyText = await page.locator('body').innerText();
        assert(
          bodyText.includes(EXPECTED_VERSION),
          `Page shows version ${EXPECTED_VERSION}`
        );
      } else {
        // Try to find version in page source directly
        const bodyText = await page.locator('body').innerText();
        const hasVersion = bodyText.includes(EXPECTED_VERSION);
        assert(hasVersion, `Version ${EXPECTED_VERSION} visible somewhere on page`);
      }

      await page.close();
    }

  } finally {
    await browser.close();
  }

  console.log(`\n--- Results: ${passes} passed, ${failures} failed ---`);
  if (failures > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
