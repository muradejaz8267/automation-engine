// loginNegativeTestCase.spec.js - 20 Negative login test cases
const { test, expect } = require('@playwright/test');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';
const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';

async function runNegativeLogin(page, email, password, caseName) {
  await page.goto(SIGN_IN_URL);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill(password);

  await passwordInput.press('Enter');
  await page.waitForTimeout(2000);

  const actualUrl = page.url();
  const expectedResult = 'User should NOT login - stay on sign-in or error page';
  const actualResult = actualUrl === DASHBOARD_URL ? 'User logged in (FAIL - unexpected)' : 'User did NOT login (PASS - expected)';

  console.log(`\n--- Case: ${caseName} ---`);
  console.log('Expected:', expectedResult);
  console.log('Actual:', actualResult);
  console.log('Expected URL: NOT', DASHBOARD_URL);
  console.log('Actual URL:', actualUrl);

  await expect(page).not.toHaveURL(DASHBOARD_URL);
  await page.waitForTimeout(500);
}

test.describe('Student Login - 20 Negative Cases', () => {
  test.setTimeout(35000);

  test('NC1: Wrong email - non-existent user', async ({ page }) => {
    await runNegativeLogin(page, 'wronguser@yopmail.com', 'Qwerty@123', 'Wrong email');
  });

  test('NC2: Wrong password - correct email', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', 'WrongPassword123', 'Wrong password');
  });

  test('NC3: Empty email field', async ({ page }) => {
    await runNegativeLogin(page, '', 'Qwerty@123', 'Empty email');
  });

  test('NC4: Empty password field', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', '', 'Empty password');
  });

  test('NC5: Both email and password empty', async ({ page }) => {
    await runNegativeLogin(page, '', '', 'Both fields empty');
  });

  test('NC6: Invalid email format - no @ symbol', async ({ page }) => {
    await runNegativeLogin(page, 'cooperyopmail.com', 'Qwerty@123', 'Invalid email - no @');
  });

  test('NC7: Invalid email format - no domain', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@', 'Qwerty@123', 'Invalid email - no domain');
  });

  test('NC8: Invalid email format - spaces only', async ({ page }) => {
    await runNegativeLogin(page, '   ', 'Qwerty@123', 'Email - spaces only');
  });

  test('NC9: Password - spaces only', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', '     ', 'Password - spaces only');
  });

  test('NC11: Wrong case in password', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', 'qwerty@123', 'Wrong password case');
  });

  test('NC12: SQL injection attempt in email', async ({ page }) => {
    await runNegativeLogin(page, "admin'--@yopmail.com", 'Qwerty@123', 'SQL injection in email');
  });

  test('NC13: Random invalid email', async ({ page }) => {
    await runNegativeLogin(page, 'random123@invalid.com', 'Qwerty@123', 'Random invalid email');
  });

  test('NC14: Numeric only in email field', async ({ page }) => {
    await runNegativeLogin(page, '1234567890', 'Qwerty@123', 'Numeric only email');
  });

  test('NC15: Special characters in password', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', '!@#$%^&*()', 'Special chars password');
  });

  test('NC16: Too short password', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', '123', 'Too short password');
  });

  test('NC17: Email with leading/trailing spaces', async ({ page }) => {
    // NC17 Test Steps (English):
    // Step 1: Open the sign-in page in the browser
    console.log('NC17 Step 1: Open the sign-in page in the browser');
    await page.goto(SIGN_IN_URL);
    await page.waitForLoadState('domcontentloaded');

    // Step 2: Type the email address with leading and trailing spaces into the email field
    console.log('NC17 Step 2: Type the email address with leading and trailing spaces into the email field');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('  cooper@yopmail.com  ');

    // Step 3: Type the correct password into the password field
    console.log('NC17 Step 3: Type the correct password into the password field');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Qwerty@123');

    // Step 4: Click the Enter key to submit the login form
    console.log('NC17 Step 4: Click the Enter key to submit the login form');
    await passwordInput.press('Enter');

    // Step 5: Wait for the page to process the login attempt
    console.log('NC17 Step 5: Wait for the page to process the login attempt');
    await page.waitForTimeout(2000);

    // Step 6: Check the actual result and compare it with the expected result
    const actualUrl = page.url();
    const expectedResult = 'User should not login and should remain on the sign-in or error page';
    const actualResult = actualUrl === DASHBOARD_URL ? 'User logged in (FAIL - unexpected)' : 'User did not login (PASS - expected)';

    console.log('NC17 Step 6: Check the actual result and compare it with the expected result');
    console.log('  Expected:', expectedResult);
    console.log('  Actual:', actualResult);
    console.log('  Expected URL: Not', DASHBOARD_URL);
    console.log('  Actual URL:', actualUrl);

    await expect(page).not.toHaveURL(DASHBOARD_URL);
    await page.waitForTimeout(500);
  });

  test('NC18: Wrong domain in email', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@gmail.com', 'Qwerty@123', 'Wrong domain');
  });

  test('NC19: Deleted/non-existent account', async ({ page }) => {
    await runNegativeLogin(page, 'deleteduser@yopmail.com', 'SomePass@1', 'Non-existent account');
  });

  test('NC20: Correct email wrong password - typo', async ({ page }) => {
    await runNegativeLogin(page, 'cooper@yopmail.com', 'Qwerty@124', 'Password typo');
  });
});
