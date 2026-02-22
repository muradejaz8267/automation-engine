// login.spec.js - Navigate to sign-in and login with cooper@yopmail.com
const { test, expect } = require('@playwright/test');

test.describe('Student Login', () => {
  test('should redirect to sign-in and login with cooper@yopmail.com', async ({ page }) => {
    test.setTimeout(30000);

    // Navigate to sign-in page
    await page.goto('https://staging.fastlearner.ai/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Login with cooper@yopmail.com
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('cooper@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Qwerty@123');

    await passwordInput.press('Enter');

    // Verify URL after login - test FAILS if URL is not dashboard
    await expect(page).toHaveURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 });
  });
});
