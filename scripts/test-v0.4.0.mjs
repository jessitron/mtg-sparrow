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

  console.log('=== v0.4.0 Verification ===\n');
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.card', { timeout: 5000 });

  // --- 1. Version check ---
  const footerText = await page.textContent('#app-version');
  assert(footerText.includes('v0.4.0'), `Footer contains v0.4.0 (got "${footerText}")`);

  // --- 2. Secret trace link in footer ---
  const traceLink = await page.$('#app-version a.trace-link');
  assert(traceLink !== null, 'Footer version is a trace link (a.trace-link element)');
  if (traceLink) {
    const href = await traceLink.getAttribute('href');
    assert(
      href && href.includes('honeycomb.io') && href.includes('trace_id='),
      `Trace link points to Honeycomb (href: ${href?.substring(0, 80)}...)`
    );
  }

  // --- 3. Card entry animation ---
  // The .card element should have the cardEnter animation
  const cardAnimation = await page.$eval('.card', el => {
    const style = window.getComputedStyle(el);
    return style.animationName;
  });
  assert(cardAnimation === 'cardEnter', `Card has entry animation "cardEnter" (got "${cardAnimation}")`);

  // --- 4. Mana pips are img elements with SVG sources ---
  const pips = await page.$$eval('.mana-pip', els =>
    els.map(el => ({ tag: el.tagName, src: el.getAttribute('src') }))
  );
  assert(pips.length >= 2, `Card has ${pips.length} mana pips`);
  assert(
    pips.every(p => p.tag === 'IMG' && p.src && p.src.endsWith('.svg')),
    'All pips are <img> elements with .svg sources'
  );

  // --- 5. Card name starts hidden ---
  const nameHidden = await page.$eval('.card-name', el =>
    el.classList.contains('card-name-hidden')
  );
  assert(nameHidden, 'Card name starts hidden (opacity 0, waiting for auto-reveal)');

  // --- 6. Progress counter ---
  const progressText = await page.textContent('.progress-counter');
  assert(
    progressText === `Card 1 / ${TOTAL_CARDS}`,
    `Progress counter shows "Card 1 / ${TOTAL_CARDS}" (got "${progressText}")`
  );

  // --- 7. Pause and Stop buttons visible ---
  const buttons = await page.$$('.control-button');
  const buttonTexts = await Promise.all(buttons.map(b => b.textContent()));
  assert(buttonTexts.includes('Pause'), 'Pause button is visible');
  assert(buttonTexts.includes('Stop'), 'Stop button is visible');

  // --- 8. Auto-reveal timing (REVEAL_DELAY_MS = 2500) ---
  console.log('\nWaiting 2.7s for auto-reveal...');
  await page.waitForTimeout(2700);

  const nameVisible = await page.$eval('.card-name', el =>
    !el.classList.contains('card-name-hidden')
  );
  assert(nameVisible, 'Card name becomes visible after ~2.5s reveal delay');

  // --- 9. ADVANCE_DELAY_MS = 1500 — wait for auto-advance ---
  console.log('Waiting 1.7s for auto-advance (ADVANCE_DELAY_MS = 1500)...');
  await page.waitForTimeout(1700);

  const progress2 = await page.textContent('.progress-counter');
  assert(
    progress2 === `Card 2 / ${TOTAL_CARDS}`,
    `Auto-advance works after 1.5s: progress shows "Card 2 / ${TOTAL_CARDS}" (got "${progress2}")`
  );

  // --- 10. Early tap reveals name first, then advances after 1.5s ---
  // Card 2 name should be hidden right now
  const card2NameHidden = await page.$eval('.card-name', el =>
    el.classList.contains('card-name-hidden')
  );
  assert(card2NameHidden, 'Card 2 name starts hidden');

  // Tap early — should reveal name, NOT advance immediately
  await page.click('#app');
  await page.waitForTimeout(200);

  // Name should now be revealed
  const card2NameRevealed = await page.$eval('.card-name', el =>
    !el.classList.contains('card-name-hidden')
  );
  assert(card2NameRevealed, 'Early tap reveals card name');

  // Still on card 2 — not yet advanced
  const stillCard2 = await page.textContent('.progress-counter');
  assert(
    stillCard2 === `Card 2 / ${TOTAL_CARDS}`,
    `After early tap, still on Card 2 (name visible, not yet advanced) (got "${stillCard2}")`
  );

  // Wait 1.7s for auto-advance after early tap name reveal
  console.log('Waiting 1.7s for auto-advance after early tap name reveal...');
  await page.waitForTimeout(1700);

  const progress3 = await page.textContent('.progress-counter');
  assert(
    progress3 === `Card 3 / ${TOTAL_CARDS}`,
    `Auto-advance after early tap: progress shows "Card 3 / ${TOTAL_CARDS}" (got "${progress3}")`
  );

  // --- 11. Pause/Resume ---
  console.log('\nTesting Pause/Resume...');
  // Click Pause button
  const pauseBtn = await page.$('.control-button');
  const pauseBtnText = await pauseBtn.textContent();
  assert(pauseBtnText === 'Pause', `First control button is "Pause" (got "${pauseBtnText}")`);
  await pauseBtn.click();
  await page.waitForTimeout(200);

  // Button should now say Resume
  const resumeBtnText = await pauseBtn.textContent();
  assert(resumeBtnText === 'Resume', `After clicking Pause, button says "Resume" (got "${resumeBtnText}")`);

  // Wait longer than reveal + advance time to confirm cards don't advance
  console.log('Waiting 4.5s while paused — cards should NOT advance...');
  await page.waitForTimeout(4500);

  const stillCard3 = await page.textContent('.progress-counter');
  assert(
    stillCard3 === `Card 3 / ${TOTAL_CARDS}`,
    `While paused, still on Card 3 (got "${stillCard3}")`
  );

  // Click Resume
  await pauseBtn.click();
  await page.waitForTimeout(200);

  const pauseAgainText = await pauseBtn.textContent();
  assert(pauseAgainText === 'Pause', `After clicking Resume, button says "Pause" (got "${pauseAgainText}")`);

  // Wait for auto-reveal + auto-advance after resume
  console.log('Waiting 4.5s after resume for card to auto-advance...');
  await page.waitForTimeout(4500);

  const progress4 = await page.textContent('.progress-counter');
  assert(
    progress4 === `Card 4 / ${TOTAL_CARDS}`,
    `After resume, card advanced: progress shows "Card 4 / ${TOTAL_CARDS}" (got "${progress4}")`
  );

  // --- 12. Stop button ends session early ---
  console.log('\nTesting Stop button...');
  const allButtons = await page.$$('.control-button');
  // Stop is the second control button
  const stopBtn = allButtons[1];
  const stopBtnText = await stopBtn.textContent();
  assert(stopBtnText === 'Stop', `Second control button is "Stop" (got "${stopBtnText}")`);
  await stopBtn.click();
  await page.waitForTimeout(500);

  // --- 13. Session end screen ---
  await page.waitForSelector('.session-end', { timeout: 3000 });
  const endLabel = await page.textContent('.session-end-label');
  assert(endLabel === 'Session stopped', `Session end shows "Session stopped" (got "${endLabel}")`);

  const endCount = await page.textContent('.session-end-count');
  assert(endCount === '4 cards', `Session end shows "4 cards" (got "${endCount}")`);

  // --- 14. Self-assessment prompt ---
  const assessmentPrompt = await page.textContent('.self-assessment-prompt');
  assert(
    assessmentPrompt === 'How did that feel?',
    `Self-assessment prompt shows "How did that feel?" (got "${assessmentPrompt}")`
  );

  const assessmentButtons = await page.$$('.self-assessment-button');
  const assessmentLabels = await Promise.all(assessmentButtons.map(b => b.textContent()));
  assert(assessmentLabels.length === 3, `3 assessment options (got ${assessmentLabels.length})`);
  assert(
    assessmentLabels.includes('Still learning') &&
    assessmentLabels.includes('Getting there') &&
    assessmentLabels.includes('Nailing it'),
    `Assessment options are: ${assessmentLabels.join(', ')}`
  );

  // --- 15. Click an assessment option ---
  console.log('\nClicking "Getting there" assessment...');
  const gettingThereBtn = assessmentButtons[1]; // "Getting there" is index 1
  await gettingThereBtn.click();
  await page.waitForTimeout(500);

  // Assessment section should be removed
  const assessmentGone = await page.$('.self-assessment');
  assert(assessmentGone === null, 'Self-assessment UI removed after selection');

  // --- 16. Combo summary ---
  const comboSummary = await page.$('.combo-summary');
  assert(comboSummary !== null, 'Combo summary section appears after assessment');

  const comboHeading = await page.textContent('.combo-summary-heading');
  assert(comboHeading === 'Combos practiced', `Combo summary heading: "${comboHeading}"`);

  const comboItems = await page.$$('.combo-summary-item');
  assert(comboItems.length > 0, `Combo summary has ${comboItems.length} items`);

  // Verify combo items have emoji pips and names
  const firstPips = await page.textContent('.combo-summary-pips');
  const firstName = await page.textContent('.combo-summary-name');
  assert(firstPips && firstPips.length > 0, `Combo pips present (got "${firstPips}")`);
  assert(firstName && firstName.length > 0, `Combo name present (got "${firstName}")`);

  // Take screenshot
  await page.screenshot({ path: 'scripts/v0.4.0-screenshot-end.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/v0.4.0-screenshot-end.png');

  // --- 17. Wait for Honeycomb SDK to flush spans ---
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
