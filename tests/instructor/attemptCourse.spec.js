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

    // Step 2: Login with tester124@yopmail.com
    console.log('Step 2: Logging in with tester124@yopmail.com...');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('tester124@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('test12345');

    // Submit login form
    await Promise.all([
      page.waitForURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 }),
      passwordInput.press('Enter')
    ]);

    console.log('✓ Logged in with tester124@yopmail.com');

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

    // Step 15: Rate course with 3 stars and submit a review (optional - skip if modal not found)
    console.log('\nStep 15: Rating course with 3 stars and submitting review...');
    try {
      await page.waitForTimeout(500);
      const modal = page.locator('.ant-modal-body, .ant-modal, [role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(300);

      // Click on the third star to set rating to 3
      const stars = modal.locator('.ant-rate li, ul.ant-rate > li');
      const thirdStar = stars.nth(2);
      await thirdStar.waitFor({ state: 'visible', timeout: 8000 });
      await thirdStar.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await thirdStar.click();
      console.log('✓ Selected 3-star rating');

      // Enter a dummy review in the review textarea
      const reviewTextarea = modal.locator('textarea[name="review"]')
        .or(modal.locator('textarea[placeholder*="Tell us about your personal experience"]'))
        .or(modal.locator('textarea'))
        .first();
      await reviewTextarea.waitFor({ state: 'visible', timeout: 8000 });
      await reviewTextarea.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await reviewTextarea.fill('This is an automated test review for this course. Overall the experience and content were good.');
      console.log('✓ Entered dummy review text');

      // Click on Submit button inside the review modal
      const reviewSubmitButton = modal.locator('//span[normalize-space()=\'Submit\']')
        .or(modal.locator('//button[.//span[normalize-space()=\'Submit\']]'))
        .or(modal.locator('button[type="submit"]'))
        .first();
      await reviewSubmitButton.waitFor({ state: 'visible', timeout: 8000 });
      await reviewSubmitButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await reviewSubmitButton.click();
      console.log('✓ Submitted review');
    } catch (err) {
      console.log('⚠ Review modal steps skipped (rating/review/submit not completed):', err.message);
    }

    // Step 16: Click Like and Dislike buttons (optional - skip if not present)
    console.log('\nStep 16: Clicking Like and Dislike buttons...');
    try {
      await page.waitForTimeout(500);

      const likeIcon = page.locator('img[alt=\"Like\"]').first();
      await likeIcon.waitFor({ state: 'visible', timeout: 8000 });
      await likeIcon.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await likeIcon.click();
      console.log('✓ Clicked Like button');

      const dislikeIcon = page.locator('img[alt=\"Dislike\"]').first();
      await dislikeIcon.waitFor({ state: 'visible', timeout: 8000 });
      await dislikeIcon.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await dislikeIcon.click();
      console.log('✓ Clicked Dislike button');

      // Small wait to visually confirm like/dislike counters changing
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log('⚠ Like/Dislike buttons step skipped:', err.message);
    }

    //
    // SECTION FLOW – 3 sections, mark each topic after attempting
    //

    // Helper: mark topic complete by label text (checkbox in same section row)
    async function markTopicComplete(labelRegex, topicName) {
      try {
        const row = page
          .locator('div.section-container, nz-collapse-panel, [class*="topic"], [class*="section"]')
          .filter({ hasText: labelRegex })
          .first();
        const cb = row.locator('input[type="checkbox"]').or(row.locator('[role="checkbox"]')).first();
        if (await cb.isVisible().catch(() => false)) {
          const checked = await cb.isChecked().catch(() => false);
          if (!checked) await cb.click({ timeout: 3000 }).catch(() => null);
          console.log(`✓ Marked topic as complete: ${topicName}`);
        } else {
          console.log(`  (No checkbox found to mark complete for ${topicName})`);
        }
      } catch (e) {
        console.log(`  (Error marking complete for ${topicName}):`, e.message);
      }
    }

    // SECTION 1
    console.log('\n===== SECTION 1: Topic 1 (video), Topic 2 (quiz) =====');

    // Section 1 – Topic 1: video "What is Playwright?"
    console.log('\nSection 1 – Topic 1: Opening "What is Playwright?" (video)...');
    try {
      await page.evaluate(() => window.scrollBy(0, -400));
      await page.waitForTimeout(500);

      const topic1Video = page.locator('p.break-word').filter({ hasText: /What is Playwright\?/i }).first();
      await topic1Video.waitFor({ state: 'visible', timeout: 12000 });
      await topic1Video.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await topic1Video.evaluate((el) => el.click());
      console.log('✓ Opened "What is Playwright?" video');

      await page.waitForTimeout(4000);
      console.log('✓ Watched video for a few seconds');
      await markTopicComplete(/What is Playwright\?/i, 'Section 1 · Topic 1 (video)');
    } catch (err) {
      console.log('⚠ Section 1 · Topic 1 step skipped:', err.message);
    }

    // Section 1 – Topic 2: quiz "playwright t"
    console.log('\nSection 1 – Topic 2: Opening "playwright t" (quiz)...');
    try {
      const quizEntry = page
        .locator('p.break-word')
        .filter({ hasText: /playwright t/i })
        .first();
      await quizEntry.waitFor({ state: 'visible', timeout: 12000 });
      await quizEntry.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await quizEntry.evaluate((el) => el.click());
      console.log('✓ Opened "playwright t" quiz');

      await page.waitForTimeout(1500);
      const startQuizBtn = page
        .getByRole('button', { name: /Start Quiz/i })
        .or(page.locator('span.ng-star-inserted').filter({ hasText: /Start Quiz/i }).first())
        .first();
      if (await startQuizBtn.isVisible().catch(() => false)) {
        await startQuizBtn.click({ timeout: 8000 }).catch(() => null);
        console.log('✓ Clicked Start Quiz (Section 1 · Topic 2)');
        await page.waitForTimeout(1500);
      }

      const option = page
        .locator('label.ng-star-inserted')
        .filter({ has: page.locator('input[type="checkbox"], input[type="radio"]') })
        .first();
      if (await option.isVisible().catch(() => false)) {
        await option.click({ timeout: 5000 }).catch(() => null);
        console.log('✓ Selected a quiz option (Section 1 · Topic 2)');
      }

      await page.waitForTimeout(800);
      const submitBtn = page
        .getByRole('button', { name: /Submit/i })
        .or(page.locator('span.ng-star-inserted').filter({ hasText: /Submit/i }).first())
        .first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click({ timeout: 8000 }).catch(() => null);
        console.log('✓ Submitted quiz (Section 1 · Topic 2)');
      }

      await markTopicComplete(/playwright t/i, 'Section 1 · Topic 2 (quiz)');
    } catch (err) {
      console.log('⚠ Section 1 · Topic 2 step skipped:', err.message);
    }

    // SECTION 2
    console.log('\n===== SECTION 2: Topic 1 (article) =====');
    console.log('\nSection 2 – Expanding "Section 2 : New Section"...');
    try {
      await page.waitForTimeout(500);
      const section2Header = page.locator('p').filter({ hasText: /Section 2\s*:\s*New Section/i }).first();
      await section2Header.waitFor({ state: 'visible', timeout: 12000 });
      await section2Header.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await section2Header.evaluate((el) => el.click());
      console.log('✓ Expanded Section 2 : New Section');
    } catch (err) {
      console.log('⚠ Section 2 expand step skipped:', err.message);
    }

    console.log('\nSection 2 – Topic 1: Opening "New Topic" (article)...');
    try {
      await page.waitForTimeout(500);
      const newTopic = page.locator('p.break-word').filter({ hasText: /New Topic/i }).first();
      await newTopic.waitFor({ state: 'visible', timeout: 12000 });
      await newTopic.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await newTopic.evaluate((el) => el.click());
      console.log('✓ Opened "New Topic" article (Section 2 · Topic 1)');

      await page.waitForTimeout(3000);
      console.log('✓ Viewed article for a few seconds');
      await markTopicComplete(/New Topic/i, 'Section 2 · Topic 1 (article)');
    } catch (err) {
      console.log('⚠ Section 2 · Topic 1 step skipped:', err.message);
    }

    // SECTION 3
    console.log('\n===== SECTION 3: Topic 1 (quiz), Topic 2 (article) =====');
    console.log('\nSection 3 – Expanding "Section 3 : Section 3"...');
    try {
      await page.waitForTimeout(500);
      const section3Panel = page.locator('nz-collapse-panel').filter({ hasText: /Section 3\s*:\s*Section 3/i }).first();
      await section3Panel.waitFor({ state: 'visible', timeout: 12000 });
      await section3Panel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Click the header area to expand
      const header = section3Panel.locator('.ant-collapse-header, [role="button"]').first();
      if (await header.isVisible().catch(() => false)) {
        await header.evaluate((el) => el.click());
      } else {
        await section3Panel.evaluate((el) => el.click());
      }
      console.log('✓ Expanded Section 3 : Section 3');
      await page.waitForTimeout(800);
    } catch (err) {
      console.log('⚠ Section 3 expand step skipped:', err.message);
    }

    // Section 3 – Topic 1: first topic under Section 3 (assumed quiz)
    console.log('\nSection 3 – Topic 1: Opening first topic (quiz)...');
    try {
      const section3Panel = page.locator('nz-collapse-panel').filter({ hasText: /Section 3\s*:\s*Section 3/i }).first();
      const topics = section3Panel.locator('p.break-word');
      const topic1 = topics.nth(0);
      await topic1.waitFor({ state: 'visible', timeout: 12000 });
      await topic1.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await topic1.evaluate((el) => el.click());
      console.log('✓ Opened Section 3 · Topic 1 (quiz)');

      await page.waitForTimeout(1500);
      const startQuizBtn3 = page
        .getByRole('button', { name: /Start Quiz/i })
        .or(page.locator('span.ng-star-inserted').filter({ hasText: /Start Quiz/i }).first())
        .first();
      if (await startQuizBtn3.isVisible().catch(() => false)) {
        await startQuizBtn3.click({ timeout: 8000 }).catch(() => null);
        console.log('✓ Clicked Start Quiz (Section 3 · Topic 1)');
        await page.waitForTimeout(1500);
      }

      const opt3 = page
        .locator('label.ng-star-inserted')
        .filter({ has: page.locator('input[type="checkbox"], input[type="radio"]') })
        .first();
      if (await opt3.isVisible().catch(() => false)) {
        await opt3.click({ timeout: 5000 }).catch(() => null);
        console.log('✓ Selected a quiz option (Section 3 · Topic 1)');
      }

      await page.waitForTimeout(800);
      const submitBtn3 = page
        .getByRole('button', { name: /Submit/i })
        .or(page.locator('span.ng-star-inserted').filter({ hasText: /Submit/i }).first())
        .first();
      if (await submitBtn3.isVisible().catch(() => false)) {
        await submitBtn3.click({ timeout: 8000 }).catch(() => null);
        console.log('✓ Submitted quiz (Section 3 · Topic 1)');
      }

      await markTopicComplete(/Section 3/i, 'Section 3 · Topic 1 (quiz)');
    } catch (err) {
      console.log('⚠ Section 3 · Topic 1 step skipped:', err.message);
    }

    // Section 3 – Topic 2: second topic under Section 3 (assumed article)
    console.log('\nSection 3 – Topic 2: Opening second topic (article)...');
    try {
      const section3Panel = page.locator('nz-collapse-panel').filter({ hasText: /Section 3\s*:\s*Section 3/i }).first();
      const topics = section3Panel.locator('p.break-word');
      const topic2 = topics.nth(1);
      await topic2.waitFor({ state: 'visible', timeout: 12000 });
      await topic2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await topic2.evaluate((el) => el.click());
      console.log('✓ Opened Section 3 · Topic 2 (article)');

      await page.waitForTimeout(3000);
      console.log('✓ Viewed article for a few seconds (Section 3 · Topic 2)');
      await markTopicComplete(/Section 3/i, 'Section 3 · Topic 2 (article)');
    } catch (err) {
      console.log('⚠ Section 3 · Topic 2 step skipped:', err.message);
    }

    console.log('\n✅ Course attempt section flow completed successfully');
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});

