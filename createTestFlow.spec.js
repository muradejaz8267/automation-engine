// createTestFlow.spec.js - Create Test flow for FastLearner STAGING (staging.fastlearner.ai)
// Credentials: tommy@yopmail.com / Check!123 | 5 quiz questions | Error handling
// Run from test panel: Create Test button (report + browser view)
const http = require('http');
const { test, expect } = require('@playwright/test');

const LoginPage = require('./pages/LoginPage');
const CreateTestPage = require('./pages/CreateTestPage.copy');

const BASE_URL = 'https://staging.fastlearner.ai';
const LOGIN_EMAIL = 'tommy@yopmail.com';
const LOGIN_PASSWORD = 'Check!123';
const SCREENSHOT_API_URL = process.env.SCREENSHOT_API_URL || '';

function postScreenshot(base64) {
  if (!SCREENSHOT_API_URL) return Promise.resolve();
  return new Promise((resolve) => {
    const body = JSON.stringify({ screenshot: base64 });
    const url = new URL(SCREENSHOT_API_URL + '/api/screenshot');
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve()); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function sendScreenshot(page) {
  if (!SCREENSHOT_API_URL) return;
  try {
    const buf = await page.screenshot({ type: 'jpeg', quality: 70 });
    await postScreenshot(buf.toString('base64'));
  } catch (e) {}
}

test.describe('Create Test Flow (Staging)', () => {
  test('Complete flow: Login and create a test with 5 questions', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);

    try {
      const loginPage = new LoginPage(page);
      const createTestPage = new CreateTestPage(page);

      // Step 1: Navigate to login page (staging)
      console.log('Step 1: Navigating to login page (staging)...');
      await page.goto(`${BASE_URL}/auth/sign-in`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => page.waitForLoadState('domcontentloaded'));
      console.log('✓ Login page loaded');
      await sendScreenshot(page);

      // Step 2: Login
      console.log('Step 2: Logging in...');
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(LOGIN_EMAIL);

      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
      await passwordInput.fill(LOGIN_PASSWORD);

      await Promise.all([
        page.waitForURL(/staging\.fastlearner\.ai\/student\/dashboard/, { timeout: 20000 }),
        passwordInput.press('Enter'),
      ]);
      console.log('✓ Login completed');
      await sendScreenshot(page);

      // Step 3: Verify redirect
      await expect(page).toHaveURL(/staging\.fastlearner\.ai\/student\/dashboard/, { timeout: 15000 });
      console.log('✓ Redirected to dashboard');

      // Step 4: Navigate to Create Test page (staging)
      console.log('Step 4: Navigating to Create Test page...');
      await page.goto(`${BASE_URL}/instructor/test`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');
      const createTestHeading = page.getByRole('heading', { name: 'Create Test', level: 3 });
      await createTestHeading.waitFor({ state: 'visible', timeout: 15000 });
      console.log('✓ On Create Test page');
      await sendScreenshot(page);

      // Step 5: Fill test form
      console.log('Step 5: Filling test form (Step 1)...');
      await createTestPage.fillTestForm();
      console.log('✓ Test form filled');
      await sendScreenshot(page);

      // Step 6: Upload thumbnail
      console.log('Step 6: Uploading thumbnail...');
      await createTestPage.uploadThumbnail();
      console.log('✓ Thumbnail uploaded');

      // Step 7: Handle thumbnail modal
      console.log('Step 7: Handling thumbnail modal...');
      await createTestPage.handleThumbnailModal();
      console.log('✓ Thumbnail modal handled');

      // Step 8: Continue to Step 2
      console.log('Step 8: Clicking Continue...');
      await createTestPage.clickContinue();
      console.log('✓ Continued to Step 2');
      await sendScreenshot(page);

      // Step 9: Verify Step 2
      console.log('Step 9: Verifying Step 2...');
      await createTestPage.verifyStep2Loaded();
      console.log('✓ Step 2 verified');

      // Step 10: Fill Add Sections form
      console.log('Step 10: Filling Add Sections form...');
      await createTestPage.fillAddSectionsForm();
      console.log('✓ Add Sections form filled');
      await sendScreenshot(page);

      // Step 11: Add 5 quiz questions
      const quizQuestions = [
        {
          questionText: 'A 14-year-old boy is brought to the emergency department by his parents because of a 1-month history of intermittent right knee pain. Which of the following factors most increased his risk?',
          options: ['BMI', 'Family history', 'Medication use', 'Previous fractures', 'Recent physical activity'],
          correctOptionIndex: 0,
        },
        {
          questionText: 'A 50-year-old man with obstructive sleep apnea presents with daytime somnolence. Which additional finding would be most likely?',
          options: ['Decreased serum bicarbonate', 'Increased hemoglobin', 'Increased lung capacity', 'Left ventricular hypertrophy'],
          correctOptionIndex: 1,
        },
        {
          questionText: 'A 32-year-old man presents with hematuria and shortness of breath. Kidney biopsy shows crescentic glomerulonephritis. He most likely has antibodies against which antigen?',
          options: ['Collagen', 'Double-stranded DNA', 'Nucleolar protein', 'Phospholipid', 'Neutrophil cytoplasm proteins'],
          correctOptionIndex: 0,
        },
        {
          questionText: 'A 5-year-old girl has recurrent UTIs. Renal US shows one large U-shaped kidney. What is the most likely embryologic origin?',
          options: ['Failure of kidney rotation', 'Failure of kidney ascent', 'Failure of ureteric bud', 'Fusion of inferior poles during ascent'],
          correctOptionIndex: 3,
        },
        {
          questionText: 'A 78-year-old man on warfarin and rifampin has subtherapeutic INR. What is the most likely cause?',
          options: ['Decreased protein binding', 'Eradication of gut flora', 'Increased alcohol intake', 'Increased vegetable consumption', 'Induction of cytochrome enzymes'],
          correctOptionIndex: 4,
        },
      ];

      console.log('Step 11: Adding 5 quiz questions...');
      await createTestPage.addMultipleQuestions(quizQuestions);
      console.log('✓ All 5 quiz questions added');
      await sendScreenshot(page);

      // Step 12: Generate AI Report
      console.log('Step 12: Configuring AI-Based Assessment Report...');
      await createTestPage.generateAIReport();
      console.log('✓ AI Report configured');

      // Step 13: Save
      console.log('Step 13: Saving...');
      await createTestPage.clickSaveButton();
      console.log('✓ Saved');

      // Step 14: Continue to Step 3
      console.log('Step 14: Clicking Continue to Step 3...');
      await createTestPage.clickContinueStep2();
      console.log('✓ Continued to Step 3');
      await sendScreenshot(page);

      // Step 15: Verify Step 3
      console.log('Step 15: Verifying Step 3...');
      await createTestPage.verifyStep3Loaded();
      console.log('✓ Step 3 verified');

      // Step 16: Publish
      console.log('Step 16: Publishing...');
      await createTestPage.clickPublish();
      console.log('✓ Test published');
      await sendScreenshot(page);

      console.log('\n✅ Create Test flow completed successfully!');
    } catch (error) {
      console.error(`\n❌ Test failed: ${error.message}`);
      await sendScreenshot(page).catch(() => {});
      throw error;
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});
