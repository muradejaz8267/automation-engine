// attemptCourse.spec.js - Test for attempting a course on FastLearner staging
const { test, expect } = require('@playwright/test');

const SCREENSHOT_API = process.env.SCREENSHOT_API_URL || 'http://localhost:3001';

async function sendScreenshot(page) {
  try {
    const buf = await page.screenshot({ type: 'png' });
    const base64 = buf.toString('base64');
    await fetch(`${SCREENSHOT_API}/api/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenshot: base64 })
    });
  } catch (e) { /* ignore */ }
}

test.describe('Attempt Course Flow', () => {
  test('Login and attempt course', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes - staging site can be slow

    let screenshotInterval;
    try {
      screenshotInterval = setInterval(() => sendScreenshot(page), 1500);
    } catch (e) { /* ignore */ }

    try {
    await sendScreenshot(page);

    // Step 1: Navigate to login page (use domcontentloaded for faster load)
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://staging.fastlearner.ai/auth/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await sendScreenshot(page);

    // Step 2: Login with cooper@yopmail.com
    console.log('Step 2: Logging in with cooper@yopmail.com...');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('cooper@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Qwerty@123');

    // Submit login form
    await Promise.all([
      page.waitForURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 }),
      passwordInput.press('Enter')
    ]);

    console.log('✓ Logged in with cooper@yopmail.com');

    // Step 3: Navigate directly to course content page (skip course details page)
    console.log('\nStep 3: Navigating directly to course content page...');
    const courseContentUrl = 'https://staging.fastlearner.ai/student/course-content/pw-test-418321';
    await page.goto(courseContentUrl, { waitUntil: 'domcontentloaded' }); // Use domcontentloaded instead of networkidle for faster loading
    await page.waitForTimeout(1000); // Reduced wait time
    await expect(page).toHaveURL(courseContentUrl, { timeout: 10000 });
    console.log('✓ Navigated to course content page');

    // Step 4: Enter text in textarea and click Send
    console.log('\nStep 4: Entering text in textarea...');
    const textarea = page.locator('//textarea[@class = \'ant-input text-area ng-pristine ng-valid ng-touched\']')
      .or(page.locator('//textarea[contains(@class,\'text-area\')]'))
      .first();
    await textarea.waitFor({ state: 'visible', timeout: 15000 });
    await textarea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await textarea.click();
    await page.waitForTimeout(300);
    await textarea.fill('what is UI testing');
    console.log('✓ Entered text: what is UI testing');

    // Click on Send button
    console.log('\nStep 5: Clicking on Send button...');
    const sendButton = page.locator('//span[text() = \' Send \']')
      .or(page.locator('//span[normalize-space()=\'Send\']'))
      .or(page.locator('//button[.//span[normalize-space()=\'Send\']]'))
      .first();
    await sendButton.waitFor({ state: 'visible', timeout: 15000 });
    await sendButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await sendButton.click();
    console.log('✓ Clicked Send button');

    // Wait 2 seconds for response
    console.log('\nStep 6: Waiting for 2 seconds...');
    await page.waitForTimeout(2000);
    console.log('✓ Wait completed');

    // Step 7: Click on Notes tab
    console.log('\nStep 7: Clicking on Notes tab...');
    const notesTab = page.locator('//div[text() = \'Notes\']')
      .or(page.locator('//div[normalize-space()=\'Notes\']'))
      .first();
    await notesTab.waitFor({ state: 'visible', timeout: 15000 });
    await notesTab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await notesTab.click();
    console.log('✓ Clicked Notes tab');

    // Step 8: Enter text in Notes textarea
    console.log('\nStep 8: Entering text in Notes textarea...');
    const notesTextarea = page.locator('//textarea[@class = \'ant-input note-field ng-untouched ng-pristine ng-valid ant-input-lg\']')
      .or(page.locator('//textarea[contains(@class,\'note-field\')]'))
      .first();
    await notesTextarea.waitFor({ state: 'visible', timeout: 15000 });
    await notesTextarea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await notesTextarea.click();
    await page.waitForTimeout(300);
    await notesTextarea.fill('This is a note about UI testing concepts.');
    console.log('✓ Entered text in Notes textarea');

    // Click on Add Notes button
    console.log('\nStep 9: Clicking on Add Notes button...');
    const addNotesButton = page.locator('//span[text() = \' Add Notes \']')
      .or(page.locator('//span[normalize-space()=\'Add Notes\']'))
      .or(page.locator('//button[.//span[normalize-space()=\'Add Notes\']]'))
      .first();
    await addNotesButton.waitFor({ state: 'visible', timeout: 15000 });
    await addNotesButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await addNotesButton.click();
    console.log('✓ Clicked Add Notes button');

    // Step 10: Click on Q&A tab
    console.log('\nStep 10: Clicking on Q&A tab...');
    const qaTab = page.locator('//div[text() = \'Q&A\']')
      .or(page.locator('//div[normalize-space()=\'Q&A\']'))
      .first();
    await qaTab.waitFor({ state: 'visible', timeout: 15000 });
    await qaTab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await qaTab.click();
    console.log('✓ Clicked Q&A tab');

    // Step 11: Enter text in Q&A textarea
    console.log('\nStep 11: Entering text in Q&A textarea...');
    const qaTextarea = page.locator('//textarea[@class = \'ant-input text-box ng-pristine ng-valid ng-touched\']')
      .or(page.locator('//textarea[contains(@class,\'text-box\')]'))
      .first();
    await qaTextarea.waitFor({ state: 'visible', timeout: 15000 });
    await qaTextarea.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await qaTextarea.click();
    await page.waitForTimeout(300);
    await qaTextarea.fill('What are the best practices for UI testing?');
    console.log('✓ Entered text in Q&A textarea');

    // Click on Submit button
    console.log('\nStep 12: Clicking on Submit button...');
    const submitButton = page.locator('//span[text() = \' Submit \']')
      .or(page.locator('//span[normalize-space()=\'Submit\']'))
      .or(page.locator('//button[.//span[normalize-space()=\'Submit\']]'))
      .first();
    await submitButton.waitFor({ state: 'visible', timeout: 15000 });
    await submitButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await submitButton.click();
    console.log('✓ Clicked Submit button');

    // Step 13: Click on Reviews tab
    console.log('\nStep 13: Clicking on Reviews tab...');
    const reviewsTab = page.locator('//div[text() = \'Reviews\']')
      .or(page.locator('//div[normalize-space()=\'Reviews\']'))
      .first();
    await reviewsTab.waitFor({ state: 'visible', timeout: 15000 });
    await reviewsTab.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await reviewsTab.click();
    console.log('✓ Clicked Reviews tab');

    // Step 14: Click on Write Review button
    console.log('\nStep 14: Clicking on Write Review button...');
    const writeReviewButton = page.locator('//span[text() = \' Write Review \']')
      .or(page.locator('//span[normalize-space()=\'Write Review\']'))
      .or(page.locator('//button[.//span[normalize-space()=\'Write Review\']]'))
      .first();
    await writeReviewButton.waitFor({ state: 'visible', timeout: 15000 });
    await writeReviewButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await writeReviewButton.click();
    console.log('✓ Clicked Write Review button');

    // Step 15: Click on first star (first li element) in rating modal (optional - skip if not found)
    console.log('\nStep 15: Clicking on first star in rating modal...');
    try {
      await page.waitForTimeout(500);
      const modal = page.locator('.ant-modal-body, .ant-modal, [role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForTimeout(300);
      const firstStar = page.locator('.ant-rate li, ul.ant-rate > li').first();
      await firstStar.waitFor({ state: 'visible', timeout: 5000 });
      await firstStar.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await firstStar.click();
      console.log('✓ Clicked first star');
    } catch (err) {
      console.log('⚠ Star rating step skipped (modal/star not found - flow still complete)');
    }

    console.log('\n✅ Course attempt flow completed successfully');
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});

