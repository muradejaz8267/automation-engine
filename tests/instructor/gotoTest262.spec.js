// gotoTest262.spec.js - Login and navigate directly to an existing test edit page
const { test, expect } = require('@playwright/test');

test.describe('Navigate to existing test (id=262)', () => {
  test('Login then go to /instructor/test?id=262', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://fastlearner.ai/auth/sign-in', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    console.log('✓ Login page loaded');

    // Step 2: Login (same simple flow as createTest.copy.spec.js)
    console.log('Step 2: Logging in...');
    const email = 'fastlearnerai@vinncorp.com';
    const password = 'Quiz!123';

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);

    // Click Sign In (more reliable than Enter)
    const signInButton = page.getByRole('button', { name: /^sign in$/i }).first();
    await signInButton.waitFor({ state: 'visible' });

    await Promise.all([
      // Some accounts land on student dashboard; some may land on instructor dashboard.
      page.waitForURL(/\/(student\/dashboard|instructor\/instructor-dashboard)/, { timeout: 30000 }),
      signInButton.click()
    ]);

    console.log(`✓ Login completed (landed on: ${page.url()})`);

    // Step 3: Go directly to the existing test edit page
    console.log('Step 3: Navigating to test edit page (id=262)...');
    await page.goto('https://fastlearner.ai/instructor/test?id=262', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/instructor\/test\?id=262/, { timeout: 30000 });
    console.log('✓ Test edit page loaded');
  });
});


