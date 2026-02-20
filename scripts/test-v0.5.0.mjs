import { chromium } from 'playwright';

const TOTAL_CARDS = 50;

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
    failures++;
  }
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('=== v0.5.0 Verification ===\n');
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');

  // --- 1. Welcome screen appears on load (NOT a card session) ---
  // Wait a moment for JS to run and show the welcome screen
  await page.waitForTimeout(500);

  const welcomeEl = await page.$('.welcome');
  assert(welcomeEl !== null, 'Welcome screen appears on load (.welcome element present)');

  const cardEl = await page.$('.card');
  assert(cardEl === null, 'No card session shown on load (.card element absent)');

  // --- 2. Version footer shows v0.5.0 ---
  const footerText = await page.textContent('#app-version');
  assert(footerText && footerText.includes('v0.5.0'), `Footer shows v0.5.0 (got "${footerText}")`);

  // --- 3. Title "Sparrow Deck" is visible ---
  const heading = await page.$('.welcome-heading');
  assert(heading !== null, '.welcome-heading element present');
  const headingText = await heading.textContent();
  assert(headingText === 'Sparrow Deck', `Title is "Sparrow Deck" (got "${headingText}")`);

  // --- 4. Instructions text mentions guessing a name and "Boros" ---
  const instructions = await page.$('.welcome-instructions');
  assert(instructions !== null, '.welcome-instructions element present');
  const instructionsText = await instructions.innerText();
  assert(
    instructionsText.toLowerCase().includes('boros'),
    `Instructions mention "Boros" (got: "${instructionsText}")`
  );
  assert(
    instructionsText.toLowerCase().includes('guess') || instructionsText.toLowerCase().includes('name'),
    `Instructions mention guessing a name (got: "${instructionsText}")`
  );

  // --- 5. "Say it out loud" subtext is present ---
  const subtext = await page.$('.welcome-subtext');
  assert(subtext !== null, '.welcome-subtext element present');
  const subtextText = await subtext.textContent();
  assert(
    subtextText && subtextText.toLowerCase().includes('say it out loud'),
    `Subtext contains "Say it out loud" (got: "${subtextText}")`
  );

  // --- 6. "Learn guild names" button is visible ---
  const welcomeBtn = await page.$('.welcome-button');
  assert(welcomeBtn !== null, '"Learn guild names" button present (.welcome-button)');
  const btnText = await welcomeBtn.textContent();
  assert(btnText === 'Learn guild names', `Button text is "Learn guild names" (got "${btnText}")`);

  // --- 7. Spacebar does NOT advance cards while on welcome screen ---
  console.log('\nTesting spacebar does nothing on welcome screen...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const stillWelcome = await page.$('.welcome');
  assert(stillWelcome !== null, 'Welcome screen still showing after spacebar (spacebar does not advance on welcome)');

  // --- 8. Clicking the app background does NOT start session ---
  await page.click('#app');
  await page.waitForTimeout(300);
  const welcomeStillAfterClick = await page.$('.welcome');
  assert(welcomeStillAfterClick !== null, 'Welcome screen still showing after clicking app background');

  // --- 9. Clicking "Learn guild names" starts the card session ---
  console.log('\nClicking "Learn guild names" button...');
  await welcomeBtn.click();
  await page.waitForSelector('.card', { timeout: 5000 });

  const cardAfterBtn = await page.$('.card');
  assert(cardAfterBtn !== null, 'Card session starts after clicking "Learn guild names"');

  const welcomeGone = await page.$('.welcome');
  assert(welcomeGone === null, 'Welcome screen disappears after starting session');

  // --- 10. Progress counter starts at Card 1 ---
  const progressText = await page.textContent('.progress-counter');
  assert(
    progressText === `Card 1 / ${TOTAL_CARDS}`,
    `Progress counter shows "Card 1 / ${TOTAL_CARDS}" (got "${progressText}")`
  );

  // --- 11. Pause and Stop buttons visible ---
  const buttons = await page.$$('.control-button');
  const buttonTexts = await Promise.all(buttons.map(b => b.textContent()));
  assert(buttonTexts.includes('Pause'), 'Pause button is visible after session starts');
  assert(buttonTexts.includes('Stop'), 'Stop button is visible after session starts');

  // --- 12. Cards cycle normally (auto-reveal and auto-advance) ---
  console.log('\nWaiting for auto-reveal (up to 3.5s)...');
  // Use waitForFunction to detect when the name is revealed (class removed)
  try {
    await page.waitForFunction(
      () => {
        const name = document.querySelector('.card-name');
        return name && !name.classList.contains('card-name-hidden');
      },
      { timeout: 3500 }
    );
    assert(true, 'Card name auto-reveals after delay');
  } catch {
    assert(false, 'Card name auto-reveals after delay (timed out after 3.5s)');
  }

  console.log('Waiting for auto-advance (1.7s)...');
  await page.waitForTimeout(1700);

  const progress2 = await page.textContent('.progress-counter');
  assert(
    progress2 === `Card 2 / ${TOTAL_CARDS}`,
    `Auto-advance works: progress shows "Card 2 / ${TOTAL_CARDS}" (got "${progress2}")`
  );

  // --- 13. Footer has trace link after session starts ---
  const traceLink = await page.$('#app-version a.trace-link');
  assert(traceLink !== null, 'Footer contains a trace link after session starts');
  if (traceLink) {
    const href = await traceLink.getAttribute('href');
    assert(
      href && href.includes('honeycomb.io') && href.includes('trace_id='),
      `Trace link points to Honeycomb (href: ${href?.substring(0, 80)}...)`
    );
  }

  // --- 14. Stop session and check session end screen ---
  console.log('\nStopping session after Card 2...');
  const allButtons = await page.$$('.control-button');
  const stopBtn = allButtons[1];
  await stopBtn.click();
  await page.waitForSelector('.session-end', { timeout: 3000 });

  const endLabel = await page.textContent('.session-end-label');
  assert(endLabel === 'Session stopped', `Session end shows "Session stopped" (got "${endLabel}")`);

  // --- 15. Self-assessment prompt ---
  const assessmentPrompt = await page.$('.self-assessment-prompt');
  assert(assessmentPrompt !== null, 'Self-assessment prompt appears on session end');
  const promptText = await assessmentPrompt.textContent();
  assert(promptText === 'How did that feel?', `Assessment prompt is "How did that feel?" (got "${promptText}")`);

  // Click "Getting there"
  const assessmentButtons = await page.$$('.self-assessment-button');
  await assessmentButtons[1].click();
  await page.waitForTimeout(500);

  // Assessment gone, combo summary shown
  const assessmentGone = await page.$('.self-assessment');
  assert(assessmentGone === null, 'Self-assessment UI removed after selection');

  const comboSummary = await page.$('.combo-summary');
  assert(comboSummary !== null, 'Combo summary appears after assessment');

  // Take screenshot of session end
  await page.screenshot({ path: 'scripts/v0.5.0-screenshot-end.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/v0.5.0-screenshot-end.png');

  // --- 16. Reload and verify welcome screen appears again ---
  console.log('\nReloading to verify welcome screen on fresh load...');
  await page.reload();
  await page.waitForTimeout(500);

  const welcomeOnReload = await page.$('.welcome');
  assert(welcomeOnReload !== null, 'Welcome screen appears after page reload');

  const cardOnReload = await page.$('.card');
  assert(cardOnReload === null, 'No card session on reload (welcome screen shows first)');

  // --- 17. Wait for Honeycomb spans to flush ---
  console.log('\nWaiting 12s for Honeycomb SDK span flush...');
  await page.waitForTimeout(12000);

  await browser.close();

  console.log(`\n=== ${failures === 0 ? 'ALL TESTS PASSED' : `${failures} TEST(S) FAILED`} ===`);
  if (failures > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
