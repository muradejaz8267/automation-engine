// askAITest.spec.js - Login, click Ask AI, verify redirect to co-pilot, enter prompt and verify AI response
const { test, expect } = require('@playwright/test');

const CO_PILOT_URL = 'https://staging.fastlearner.ai/student/co-pilot';
const PROMPT = 'What is Fastlearner and how does it help students learn?';

test.describe('Ask AI Test', () => {
  test('should login, navigate to co-pilot via Ask AI, and verify AI responds to Fastlearner prompt', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Login
    await page.goto('https://staging.fastlearner.ai/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('cooper@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Qwerty@123');

    await passwordInput.press('Enter');

    // Wait for dashboard after login
    await expect(page).toHaveURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 });

    // Step 2: Click on Ask AI button in navbar
    const askAIButton = page.getByRole('button', { name: 'Ask AI' }).or(page.locator('a:has-text("Ask AI")')).first();
    await askAIButton.waitFor({ state: 'visible', timeout: 10000 });
    await askAIButton.click();

    // Step 3: Assert redirect to co-pilot URL - FAIL if not redirected
    await expect(page).toHaveURL(CO_PILOT_URL, { timeout: 15000 });

    // Step 4: Enter prompt in "Write your Message" text box
    const messageInput = page.getByPlaceholder(/write your message/i).or(
      page.locator('textarea[placeholder*="Write"]').or(page.locator('input[placeholder*="Write"]'))
    ).first();
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
    await messageInput.fill(PROMPT);
    await messageInput.press('Enter');

    // Step 5: Verify AI responds - wait for response containing Fastlearner-related content
    const relevantKeywords = ['fastlearner', 'fast learner', 'learning', 'platform', 'student', 'course', 'education'];
    let responseText = '';
    let foundResponse = false;

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const bodyText = await page.locator('body').textContent();
      const messages = await page.locator('[class*="message"], [class*="response"], [class*="content"]').allTextContents();
      responseText = messages.join(' ') || bodyText || '';

      const hasRelevantContent = relevantKeywords.some((kw) => responseText.toLowerCase().includes(kw));
      const hasNewContent = responseText.length > PROMPT.length + 50;

      if (hasRelevantContent && hasNewContent) {
        foundResponse = true;
        break;
      }
    }

    if (!foundResponse) {
      throw new Error(
        `Ask AI Test FAILED: AI did not respond with Fastlearner-related content within 30 seconds. ` +
        `Prompt: "${PROMPT}". Check report for details.`
      );
    }

    await new Promise((r) => setTimeout(r, 5000));
    await page.context().close();
  });
});
