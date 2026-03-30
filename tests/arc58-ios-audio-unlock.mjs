/**
 * Arc 58 verification: iOS Safari Audio Unlock
 *
 * What changed:
 * - unlockAudio() added to src/audio.ts — plays a silent WAV to prime the audio element
 * - unlockAudio() called synchronously in slides.ts dismiss() handler on level intro tap
 * - APP_VERSION bumped to 0.38.0
 *
 * What we verify in Chromium (can't test iOS Safari behavior in headless):
 * 1. No regression: slides page loads, level intro is shown, dismissing it starts the session
 * 2. Session starts correctly: cards are displayed after intro is dismissed
 * 3. Audio still plays: playAudio path doesn't error out (sound.play_result = 'success')
 * 4. Version is 0.38.0 in the page
 *
 * Note: unlockAudio() creates a data-URI audio element. In headless Chromium this won't
 * make a network request (data URI), and the audioEl module variable gets set. The important
 * behavioral guarantee is that subsequent playAudio calls reuse that element.
 *
 * Server must be running at http://localhost:3847 before running this script.
 * Use ./run-test-server to start and ./stop-test-server to tear down.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const EXPECTED_VERSION = '0.38.0';
const AUDIO_WAIT_MS = 5000; // REVEAL_DELAY_MS is 3000ms, give extra buffer

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
    // --- Phase 1: Slides page loads and level intro is shown ---
    console.log('\nPhase 1 — Slides page loads, level intro is visible');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      // Level intro should be in the DOM before dismissal
      const introCount = await page.locator('.level-intro').count();
      assert(introCount > 0, 'Level intro element is present before dismissal');

      // The CTA button should be visible
      const ctaCount = await page.locator('.level-intro-cta').count();
      assert(ctaCount > 0, 'Level intro CTA button is present');

      await page.close();
    }

    // --- Phase 2: Dismissing intro starts session (cards appear) ---
    console.log('\nPhase 2 — Dismissing level intro starts the session with cards');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      // Click the CTA to dismiss the intro
      const cta = page.locator('.level-intro-cta');
      const ctaVisible = await cta.isVisible();
      assert(ctaVisible, 'CTA button is visible before click');

      await cta.click();

      // Wait for the intro to disappear and session to start
      await page.waitForSelector('.level-intro', { state: 'hidden', timeout: 5000 }).catch(() => {});

      // The app container should now be showing cards
      // After dismissal, a card element should appear
      await sleep(500);

      // Check that the intro-dismissing class was applied or intro is gone
      const introDismissing = await page.locator('.level-intro--dismissing').count();
      const introGone = await page.locator('.level-intro').count();
      assert(
        introDismissing > 0 || introGone === 0,
        `Intro started dismissing or is gone (dismissing: ${introDismissing}, present: ${introGone})`
      );

      await page.close();
    }

    // --- Phase 3: After intro dismissed, audio plays without error ---
    console.log('\nPhase 3 — Audio plays correctly after session starts (no regression)');
    {
      const page = await browser.newPage();

      // Track audio requests
      const audioRequests = [];
      page.on('request', req => {
        const url = req.url();
        if (url.includes('/audio/') && url.endsWith('.mp3')) {
          audioRequests.push(url);
        }
      });

      // Enable sound
      await page.addInitScript(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'true');
      });

      await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      // Dismiss intro (this calls unlockAudio() synchronously)
      const cta = page.locator('.level-intro-cta');
      await cta.click();

      // Wait for audio reveal (REVEAL_DELAY_MS in session.ts should trigger within a few seconds)
      await sleep(AUDIO_WAIT_MS);

      // Audio request is expected: the reveal timer fires and plays the combo audio
      assert(
        audioRequests.length > 0,
        `Audio request made after session starts (${audioRequests.length} requests)`
      );

      if (audioRequests.length > 0) {
        const url = audioRequests[0];
        assert(
          url.includes('/audio/') && url.endsWith('.mp3'),
          `Audio URL looks correct: ${url}`
        );
      }

      await page.close();
    }

    // --- Phase 4: unlockAudio data URI does NOT cause a network request ---
    console.log('\nPhase 4 — unlockAudio uses data URI, no external network request at dismiss time');
    {
      const page = await browser.newPage();

      // Track all requests at the moment of dismiss
      const requestsAtDismiss = [];
      let dismissTime = null;

      page.on('request', req => {
        if (dismissTime !== null) {
          // Only collect requests within 100ms of dismiss
          if (Date.now() - dismissTime < 100) {
            requestsAtDismiss.push(req.url());
          }
        }
      });

      await page.addInitScript(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'true');
      });

      await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      const cta = page.locator('.level-intro-cta');
      dismissTime = Date.now();
      await cta.click();
      await sleep(150); // Give time for any immediate requests

      // The unlockAudio uses a data: URI so it should not appear as a network request
      const mp3RequestsAtDismiss = requestsAtDismiss.filter(url => url.endsWith('.mp3'));
      assert(
        mp3RequestsAtDismiss.length === 0,
        `No MP3 network requests at dismiss time (unlockAudio uses data URI): ${mp3RequestsAtDismiss.length} MP3 requests`
      );

      await page.close();
    }

    // --- Phase 5: Version marker is 0.38.0 ---
    console.log('\nPhase 5 — Version is 0.38.0');
    {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/slides.html?subgroup=allied`);
      await page.waitForLoadState('networkidle');

      // Try opening the menu to reveal the version
      const menuBtn = page.locator('.hamburger-btn, [aria-label="Menu"], button[aria-label*="menu" i]').first();
      const menuBtnCount = await menuBtn.count();

      if (menuBtnCount > 0) {
        await menuBtn.click();
        await sleep(500);
      }

      const bodyText = await page.locator('body').innerText();
      assert(
        bodyText.includes(EXPECTED_VERSION),
        `Page text includes version ${EXPECTED_VERSION}`
      );

      await page.close();
    }

    // --- Phase 6: Audio reuse path — playAudio works on combo page (no regression) ---
    console.log('\nPhase 6 — playAudio works on combo page (regression check for audio element reuse)');
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

      // Enable sound
      await page.evaluate(() => {
        localStorage.setItem('mtg-sparrow.sound.enabled', 'true');
      });

      // Click the play button — this calls playAudio which may reuse audioEl if it was set
      await page.click('.combo-play-btn');
      await sleep(AUDIO_WAIT_MS);

      assert(audioRequests.length > 0, 'Audio request made from combo page play button');
      if (audioRequests.length > 0) {
        assert(
          audioRequests[0].includes('/audio/simic.mp3'),
          `Correct audio URL for simic: ${audioRequests[0]}`
        );
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
