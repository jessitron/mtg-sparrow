/**
 * Arc 56 verification: Slides Audio on Reveal
 *
 * Verifies that:
 * 1. Audio plays (mp3 request sent) when name is auto-revealed by timer
 * 2. Audio plays when user taps to reveal early
 * 3. Audio does NOT play when sound toggle is off
 * 4. Audio plays for the correct combo (matching combo on screen)
 * 5. No crash when audio file doesn't exist (graceful failure)
 *
 * Strategy: Intercept network requests at the page level to detect /audio/*.mp3
 * requests. We also check that the card-name element loses 'card-name-hidden'
 * class (confirming reveal happened) before verifying audio request was made.
 *
 * The slides page has a 3-second reveal timer (REVEAL_DELAY_MS). To test
 * auto-reveal we wait slightly longer. For early-tap tests we tap immediately.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.37.0';
const SOUND_KEY = 'mtg-sparrow.sound.enabled';
// How long to wait for auto-reveal (REVEAL_DELAY_MS = 3000ms + buffer)
const AUTO_REVEAL_WAIT_MS = 4500;
// How long to wait for network request after reveal (audio fetch is async)
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

/**
 * Navigate to slides page with sound enabled/disabled and collect audio requests.
 * Returns the list of /audio/*.mp3 URLs requested by the page.
 *
 * @param {import('playwright').Browser} browser
 * @param {object} opts
 * @param {boolean} opts.soundEnabled - whether to set sound on or off in localStorage
 * @param {boolean} opts.tapEarly - whether to tap immediately to skip the timer
 * @param {number} opts.waitMs - how long to wait before collecting results
 */
async function runSlidesAndCollectAudio(browser, { soundEnabled, tapEarly, waitMs }) {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all audio mp3 requests
  const audioRequests = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/audio/') && url.endsWith('.mp3')) {
      audioRequests.push(url);
    }
  });

  // Navigate to slides page (allied subgroup by default)
  await page.goto(`${BASE_URL}/slides?subgroup=allied`);
  await page.waitForLoadState('domcontentloaded');

  // Set sound preference BEFORE the page is fully initialized
  // We must set it after load since slides.ts reads from localStorage at reveal time
  await page.evaluate(
    ([key, val]) => localStorage.setItem(key, val),
    [SOUND_KEY, soundEnabled ? 'true' : 'false']
  );

  if (tapEarly) {
    // Dismiss the level intro by clicking, then tap card immediately
    // The level intro appears first; clicking it starts the session
    const introEl = page.locator('.level-intro');
    // Wait for intro to appear
    await introEl.waitFor({ state: 'visible', timeout: 3000 });
    await introEl.click();
    // Wait briefly for session to start (showCard fires)
    await page.waitForTimeout(500);
    // Tap the app to trigger early reveal (handleAdvance)
    const appEl = page.locator('#app');
    await appEl.click();
    // Wait for audio request to be issued
    await page.waitForTimeout(AUDIO_REQUEST_WAIT_MS);
  } else {
    // Dismiss the level intro, then wait for auto-reveal timer
    const introEl = page.locator('.level-intro');
    await introEl.waitFor({ state: 'visible', timeout: 3000 });
    await introEl.click();
    // Wait for auto-reveal timer (3s) + buffer + audio fetch
    await page.waitForTimeout(waitMs);
  }

  await context.close();
  return audioRequests;
}

/**
 * Get the current combo id displayed on the slides page.
 * We inspect the card's name text and find which combo it matches.
 */
async function getCurrentComboId(page) {
  // The card-name element contains the combo name (even when hidden)
  const nameEl = page.locator('.card-name');
  const count = await nameEl.count();
  if (count === 0) return null;
  return await nameEl.first().textContent();
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Auto-reveal timer fires → audio plays (sound ON)
    // -----------------------------------------------------------------------
    console.log('=== Phase 1: Auto-reveal timer fires — audio plays ===\n');
    {
      const audioRequests = await runSlidesAndCollectAudio(browser, {
        soundEnabled: true,
        tapEarly: false,
        waitMs: AUTO_REVEAL_WAIT_MS,
      });

      assert(audioRequests.length > 0, `Audio request made after auto-reveal (got ${audioRequests.length} request(s))`);
      if (audioRequests.length > 0) {
        const url = audioRequests[0];
        assert(url.includes('/audio/') && url.endsWith('.mp3'), `Audio URL has /audio/*.mp3 format: ${url}`);
      }
    }

    // -----------------------------------------------------------------------
    // PHASE 2: User tap reveals early → audio plays (sound ON)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: User taps early — audio plays ===\n');
    {
      const audioRequests = await runSlidesAndCollectAudio(browser, {
        soundEnabled: true,
        tapEarly: true,
        waitMs: AUDIO_REQUEST_WAIT_MS,
      });

      assert(audioRequests.length > 0, `Audio request made after early tap (got ${audioRequests.length} request(s))`);
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Sound OFF → no audio plays
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Sound off — no audio plays ===\n');
    {
      const audioRequests = await runSlidesAndCollectAudio(browser, {
        soundEnabled: false,
        tapEarly: true,
        waitMs: AUDIO_REQUEST_WAIT_MS,
      });

      assert(
        audioRequests.length === 0,
        `No audio requests when sound is off (got ${audioRequests.length})`
      );
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Correct combo audio plays (URL matches displayed combo)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Correct combo audio URL (matches displayed card) ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      const audioRequests = [];
      page.on('request', (req) => {
        const url = req.url();
        if (url.includes('/audio/') && url.endsWith('.mp3')) {
          audioRequests.push(url);
        }
      });

      // Set sound to ON before navigating
      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate(([key]) => localStorage.setItem(key, 'true'), [SOUND_KEY]);

      // Dismiss intro
      const introEl = page.locator('.level-intro');
      await introEl.waitFor({ state: 'visible', timeout: 3000 });
      await introEl.click();
      await page.waitForTimeout(300);

      // Get the combo name from the card (the name exists in DOM even when hidden)
      const comboName = await getCurrentComboId(page);
      console.log(`  Card shows combo: "${comboName}"`);

      // Tap early to reveal
      const appEl = page.locator('#app');
      await appEl.click();
      await page.waitForTimeout(AUDIO_REQUEST_WAIT_MS);

      // Derive expected combo ID from name (lowercase)
      const expectedId = comboName ? comboName.toLowerCase() : null;
      console.log(`  Expected audio ID: "${expectedId}"`);

      if (audioRequests.length > 0) {
        const audioUrl = audioRequests[0];
        console.log(`  Actual audio URL: "${audioUrl}"`);
        assert(
          expectedId && audioUrl.includes(`/audio/${expectedId}.mp3`),
          `Audio URL matches displayed combo "${expectedId}": ${audioUrl}`
        );
      } else {
        assert(false, 'No audio request made (cannot verify combo match)');
      }

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Graceful failure — missing audio file doesn't crash the page
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Missing audio file — graceful failure (no crash) ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Track JS errors
      const jsErrors = [];
      page.on('pageerror', (err) => jsErrors.push(err.message));

      // Intercept audio requests and return 404 to simulate missing file
      await page.route('**/audio/*.mp3', (route) => {
        route.fulfill({ status: 404, body: 'Not Found' });
      });

      await page.goto(`${BASE_URL}/slides?subgroup=allied`);
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate(([key]) => localStorage.setItem(key, 'true'), [SOUND_KEY]);

      // Dismiss intro
      const introEl = page.locator('.level-intro');
      await introEl.waitFor({ state: 'visible', timeout: 3000 });
      await introEl.click();
      await page.waitForTimeout(300);

      // Tap to reveal (triggers audio with 404 response)
      const appEl = page.locator('#app');
      await appEl.click();
      await page.waitForTimeout(AUDIO_REQUEST_WAIT_MS);

      // The page should still be alive and functional
      const appStillPresent = await page.locator('#app').count();
      assert(appStillPresent === 1, 'Page still functional after audio 404 (app element present)');
      assert(jsErrors.length === 0, `No JS errors after audio 404 (got: ${jsErrors.join('; ')})`);

      // The card name should be revealed (reveal happened despite audio failure)
      const nameVisible = await page.locator('.card-name:not(.card-name-hidden)').count();
      assert(nameVisible > 0, 'Card name was still revealed despite audio 404');

      await context.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Version check
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Version check ===\n');
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('domcontentloaded');

      const menuBtn = page.locator('#menu-btn');
      await menuBtn.click();
      await page.waitForTimeout(300);

      const versionText = await page.locator('#settings-version').textContent();
      assert(
        versionText && versionText.includes(EXPECTED_VERSION),
        `Menu shows version ${EXPECTED_VERSION} (got: "${versionText}")`
      );

      await context.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passes} passed, ${failures} failed`);

  if (failures > 0) {
    console.error('\nSome checks FAILED. Arc 56 is NOT verified.');
    process.exit(1);
  } else {
    console.log('\nAll checks PASSED. Arc 56 verified.');
  }
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
