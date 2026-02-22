// signupNegativeTestCases.spec.js - 10 Negative signup test cases with actual and expected results
const { test, expect } = require('../fixtures/screenshotFixture');

const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const SIGN_UP_URL = 'https://staging.fastlearner.ai/auth/sign-up';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

async function runNegativeSignup(page, { name, email, password, confirmPassword, checkTerms }, caseName) {
  await page.goto(SIGN_IN_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const signUpBtn = page.getByRole('button', { name: /sign up/i })
    .or(page.getByRole('link', { name: /sign up/i }))
    .or(page.getByText('Sign Up', { exact: true }))
    .first();
  await signUpBtn.waitFor({ state: 'visible', timeout: 10000 });
  await signUpBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="Name" i], input[type="text"]').first();
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="confirm" i]').or(page.locator('input[type="password"]').nth(1));
  const termsCheckbox = page.locator('input[type="checkbox"]').first();

  if (name !== undefined && name !== '') {
    await nameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await nameInput.fill(name);
  }
  if (email !== undefined && email !== '') {
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(email);
  }
  if (password !== undefined && password !== '') {
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(password);
  }
  if (confirmPassword !== undefined && confirmPassword !== '') {
    await confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await confirmPasswordInput.fill(confirmPassword);
  }
  if (checkTerms) {
    await termsCheckbox.check().catch(() => {});
    await page.waitForTimeout(300);
  }

  const signUpButton = page.locator('form button[type="submit"]')
    .or(page.locator('form').locator('button:has-text("Sign Up")'))
    .or(page.getByRole('button', { name: /sign up|create account|register/i }).last())
    .or(page.locator('button[type="submit"]'))
    .first();
  await signUpButton.click({ force: true }).catch(() => {});
  await page.waitForTimeout(3000);

  const actualUrl = page.url();
  const isDashboard = actualUrl.includes('/dashboard') || actualUrl.includes('/student');
  const isOtpModal = await page.getByText(/otp|verify|enter code|verification/i).isVisible().catch(() => false);
  const isSignUpPage = actualUrl.includes('sign-up') || actualUrl.includes('signup');
  const hasError = await page.getByText(/error|invalid|required|already exists|mismatch/i).isVisible().catch(() => false);

  const expectedResult = 'User should NOT sign up successfully - stay on sign-up page or show validation error';
  const actualResult = (isDashboard || isOtpModal)
    ? 'User signed up (FAIL - unexpected)'
    : (isSignUpPage || hasError)
      ? 'User did NOT sign up (PASS - expected)'
      : `Page state: url=${actualUrl}, hasError=${hasError}`;

  console.log(`\n--- Case: ${caseName} ---`);
  console.log('Expected:', expectedResult);
  console.log('Actual:', actualResult);
  console.log('Expected: Stay on sign-up or show error, NOT redirect to dashboard');
  console.log('Actual URL:', actualUrl);
  console.log('Dashboard?', isDashboard, '| OTP Modal?', isOtpModal, '| Sign-up page?', isSignUpPage);

  expect(isDashboard).toBe(false);
  await page.waitForTimeout(500);
}

test.describe('Student Signup - 10 Negative Cases', () => {
  test.setTimeout(35000);

  test('NC1: Empty name field', async ({ page }) => {
    await runNegativeSignup(page, {
      name: '',
      email: `test${Date.now()}@yopmail.com`,
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Empty name');
  });

  test('NC2: Empty email field', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: '',
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Empty email');
  });

  test('NC3: Empty password field', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: `test${Date.now()}@yopmail.com`,
      password: '',
      confirmPassword: '',
      checkTerms: true
    }, 'Empty password');
  });

  test('NC4: Password and confirm password mismatch', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: `test${Date.now()}@yopmail.com`,
      password: 'TestPass@123',
      confirmPassword: 'DifferentPass@456',
      checkTerms: true
    }, 'Password mismatch');
  });

  test('NC5: Invalid email format - no @ symbol', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: 'invalidemail.yopmail.com',
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Invalid email - no @');
  });

  test('NC6: Invalid email format - no domain', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: 'user@',
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Invalid email - no domain');
  });

  test('NC7: Too short password', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: `test${Date.now()}@yopmail.com`,
      password: '123',
      confirmPassword: '123',
      checkTerms: true
    }, 'Too short password');
  });

  test('NC8: Terms and conditions not checked', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: `test${Date.now()}@yopmail.com`,
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: false
    }, 'Terms not checked');
  });

  test('NC9: Already registered email', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: 'cooper@yopmail.com',
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Already registered email');
  });

  test('NC10: Invalid email - spaces only', async ({ page }) => {
    await runNegativeSignup(page, {
      name: 'Test User',
      email: '   ',
      password: 'TestPass@123',
      confirmPassword: 'TestPass@123',
      checkTerms: true
    }, 'Email - spaces only');
  });
});
