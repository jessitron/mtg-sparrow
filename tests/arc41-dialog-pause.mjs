/**
 * Arc 41 dialog-pause verification: Slides page pauses on dialog open, resumes on close.
 *
 * Tests:
 * 1. Slides page loads and starts a session (pause button appears)
 * 2. Opening settings menu pauses slideshow (pause-btn says "Resume")
 * 3. Closing settings menu resumes slideshow (pause-btn says "Pause")
 * 4. Opening feedback modal pauses slideshow (pause-btn says "Resume")
 * 5. Typing Space in feedback textarea types a space (does NOT advance slideshow)
 * 6. Closing feedback modal resumes slideshow (pause-btn says "Pause")
 * 7. Submit flow on slides page: modal auto-closes, slideshow resumes after
 * 8. User-initiated pause is preserved when settings menu opens/closes
 *
 * REVEAL_DELAY_MS = 3000. We wait 4.5s to ensure slideshow would have advanced.
 * Server must be running at http://localhost:3847.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3847';
const SLIDES_URL = `${BASE_URL}/slides?subgroup=allied&welcome_dwell_ms=0`;

// Time we wait to let slideshow advance if it were running (REVEAL_DELAY_MS=3000 + buffer)
const DIALOG_WAIT_MS = 4500;

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
 * Complete the new multi-step intro (3 Space presses) and wait for pause-btn.
 * Must be called after domcontentloaded on the slides page.
 */
async function waitForPauseBtn(page) {
  // New intro: 3 Space presses before the card (and pause-btn) appear
  await page.waitForTimeout(300); // let page initialize
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  await page.keyboard.press('Space');
  await page.waitForSelector('#pause-btn', { timeout: 6000 });
}

async function getPauseBtnText(page) {
  return page.$eval('#pause-btn', el => el.textContent.trim());
}

async function openMenu(page) {
  await page.click('#menu-btn');
  await page.waitForTimeout(300);
}

async function closeMenu(page) {
  await page.click('#settings-close-btn');
  await page.waitForTimeout(300);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  try {
    // -----------------------------------------------------------------------
    // PHASE 1: Slides page loads and pause button appears
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 1: Slides page loads, session starts ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');

      await waitForPauseBtn(page);
      const btnText = await getPauseBtnText(page);
      assert(btnText === 'Pause', `Pause button shows "Pause" on initial load (got "${btnText}")`);

      const card = await page.$('.card');
      assert(card !== null, 'Card element is rendered on slides page');

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 2: Opening settings menu pauses slideshow
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 2: Opening settings menu pauses slideshow ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // Confirm playing initially
      const initialText = await getPauseBtnText(page);
      assert(initialText === 'Pause', `Slideshow starts in play state (pause-btn says "Pause")`);

      // Open settings menu
      await openMenu(page);

      // Wait longer than REVEAL_DELAY_MS (3s) to ensure slideshow would have advanced
      await page.waitForTimeout(DIALOG_WAIT_MS);

      // Should be paused
      const textWhileOpen = await getPauseBtnText(page);
      assert(textWhileOpen === 'Resume', `Slideshow paused while settings menu open (pause-btn says "Resume", got "${textWhileOpen}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 3: Closing settings menu resumes slideshow
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 3: Closing settings menu resumes slideshow ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      await openMenu(page);
      await page.waitForTimeout(500);

      // Close settings menu
      await closeMenu(page);

      const textAfterClose = await getPauseBtnText(page);
      assert(textAfterClose === 'Pause', `Slideshow resumes after settings menu closes (pause-btn says "Pause", got "${textAfterClose}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 4: Opening feedback modal pauses slideshow
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 4: Opening feedback modal pauses slideshow ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // Open menu → click Feedback (closes menu, opens modal)
      await openMenu(page);
      await page.click('#settings-feedback-btn');
      await page.waitForSelector('.feedback-modal', { timeout: 3000 });

      // Wait longer than REVEAL_DELAY_MS to ensure slideshow would have advanced
      await page.waitForTimeout(DIALOG_WAIT_MS);

      const textWhileModalOpen = await getPauseBtnText(page);
      assert(textWhileModalOpen === 'Resume', `Slideshow paused while feedback modal open (pause-btn says "Resume", got "${textWhileModalOpen}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 5: Typing Space in feedback textarea types a space (not advance)
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 5: Space key in textarea types a space, does not advance ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // Open feedback modal
      await openMenu(page);
      await page.click('#settings-feedback-btn');
      await page.waitForSelector('.feedback-textarea', { timeout: 3000 });
      await page.waitForTimeout(200);

      // Focus on textarea and type "hello world" (includes a space)
      const textarea = await page.$('.feedback-textarea');
      await textarea.click();
      await page.keyboard.type('hello world');
      await page.waitForTimeout(200);

      const textareaValue = await page.$eval('.feedback-textarea', el => el.value);
      assert(textareaValue === 'hello world', `Typing "hello world" in textarea produces correct value (got "${textareaValue}")`);
      assert(textareaValue.includes(' '), `Space character was typed into textarea (not intercepted by slideshow)`);

      // Verify slideshow did not advance (still paused by dialog, still on same state)
      const btnText = await getPauseBtnText(page);
      assert(btnText === 'Resume', `Pause button still shows "Resume" after typing (slideshow still paused by dialog, got "${btnText}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 6: Closing feedback modal resumes slideshow
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 6: Closing feedback modal resumes slideshow ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // Open feedback modal
      await openMenu(page);
      await page.click('#settings-feedback-btn');
      await page.waitForSelector('.feedback-close-btn', { timeout: 3000 });
      await page.waitForTimeout(300);

      // Close the modal
      await page.click('.feedback-close-btn');
      await page.waitForTimeout(300);

      const textAfterClose = await getPauseBtnText(page);
      assert(textAfterClose === 'Pause', `Slideshow resumes after feedback modal closes (pause-btn says "Pause", got "${textAfterClose}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 7: Submit flow on slides page — modal auto-closes, slideshow resumes
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 7: Submit flow — modal auto-closes, slideshow resumes ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // Open feedback modal
      await openMenu(page);
      await page.click('#settings-feedback-btn');
      await page.waitForSelector('.feedback-textarea', { timeout: 3000 });
      await page.waitForTimeout(200);

      // Type a message and submit
      const textarea = await page.$('.feedback-textarea');
      await textarea.type('Arc 41 dialog pause test message');
      await page.waitForTimeout(100);

      await page.click('.feedback-submit-btn');
      await page.waitForTimeout(1000);

      // Thanks should be visible
      const thanksHidden = await page.$eval('.feedback-thanks', el => el.hidden);
      assert(thanksHidden === false, '"Thanks for your feedback!" shown after submit');

      // Wait for modal auto-close (~2.5s)
      await page.waitForTimeout(2500);
      const modalGone = await page.$('.feedback-modal');
      assert(modalGone === null, 'Feedback modal auto-closes after submit');

      // After auto-close, slideshow should resume
      await page.waitForTimeout(300);
      const textAfterAutoClose = await getPauseBtnText(page);
      assert(textAfterAutoClose === 'Pause', `Slideshow resumes after feedback modal auto-closes (pause-btn says "Pause", got "${textAfterAutoClose}")`);

      await ctx.close();
    }

    // -----------------------------------------------------------------------
    // PHASE 8: User-initiated pause is preserved when settings menu opens/closes
    // -----------------------------------------------------------------------
    console.log('\n=== Phase 8: User-initiated pause preserved across dialog open/close ===\n');
    {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(SLIDES_URL);
      await page.waitForLoadState('domcontentloaded');
      await waitForPauseBtn(page);

      // User manually pauses
      await page.click('#pause-btn');
      await page.waitForTimeout(200);
      const textAfterManualPause = await getPauseBtnText(page);
      assert(textAfterManualPause === 'Resume', `Manual pause works (pause-btn says "Resume", got "${textAfterManualPause}")`);

      // Open settings menu (dialog-open fires — but user already paused, so pausedByDialog should NOT become true)
      await openMenu(page);
      await page.waitForTimeout(500);

      // Close settings menu (dialog-close fires — since pausedByDialog=false, it should NOT resume)
      await closeMenu(page);

      const textAfterDialogCycle = await getPauseBtnText(page);
      assert(textAfterDialogCycle === 'Resume', `User-initiated pause preserved after settings menu open/close (pause-btn still says "Resume", got "${textAfterDialogCycle}")`);

      await ctx.close();
    }

  } finally {
    await browser.close();
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Arc 41 Dialog Pause: ${passes} PASS, ${failures} FAIL out of ${passes + failures} tests`);
  console.log('='.repeat(60));

  if (failures > 0) {
    console.error(`\nArc 41 dialog-pause verification FAILED (${failures} failure(s))`);
    process.exit(1);
  } else {
    console.log(`\nArc 41 dialog-pause verification PASSED (${passes}/${passes + failures})`);
  }
}

run().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
