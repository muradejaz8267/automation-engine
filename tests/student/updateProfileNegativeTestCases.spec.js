// updateProfileNegativeTestCases.spec.js - Negative test cases for Update Profile flow
const { test, expect } = require('../fixtures/screenshotFixture');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';
const UPDATE_PROFILE_URL = 'https://staging.fastlearner.ai/user/update-profile';
const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page) {
  await page.goto(SIGN_IN_URL);
  await page.waitForLoadState('domcontentloaded');
  await delay(1500);
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill('cooper@yopmail.com', { delay: 60 });
  await delay(500);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill('Qwerty@123', { delay: 60 });
  await delay(800);
  await passwordInput.press('Enter');
  await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
  await delay(1500);
}

async function navigateToUpdateProfile(page) {
  const profileSelectors = ['button[aria-haspopup="menu"]', '[data-testid="user-menu"]', 'header button:has(img)', 'header [class*="avatar"]', '[class*="user-menu"]', 'button:has([class*="avatar"])'];
  let dropdownClicked = false;
  for (const sel of profileSelectors) {
    const candidates = page.locator(sel);
    const count = await candidates.count();
    for (let i = 0; i < count; i++) {
      const el = candidates.nth(i);
      if (await el.isVisible().catch(() => false)) {
        const text = (await el.textContent().catch(() => '') || '').toLowerCase();
        if (text.includes('categor')) continue;
        await el.click();
        dropdownClicked = true;
        break;
      }
    }
    if (dropdownClicked) break;
  }
  if (!dropdownClicked) {
    const headerButtons = page.locator('header button');
    const count = await headerButtons.count();
    if (count > 0) await headerButtons.nth(count - 1).click();
  }
  await delay(2000);
  const editProfileLink = page.getByRole('link', { name: /edit profile/i }).or(page.locator('a[href*="update-profile"]')).first();
  const linkVisible = await editProfileLink.isVisible().catch(() => false);
  if (linkVisible) await editProfileLink.click();
  else await page.goto(UPDATE_PROFILE_URL);
  await expect(page).toHaveURL(UPDATE_PROFILE_URL, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  await delay(1500);
  await page.keyboard.press('Escape');
  await delay(500);
}

async function fillAndSubmitProfile(page, overrides) {
  const opts = { firstName: 'TestFirst', lastName: 'TestLast', phone: '5551234567', website: 'https://example.com', linkedin: 'https://linkedin.com/in/test', experience: '5 Year', bio: 'Test bio', ...overrides };
  const allInputs = page.locator('input:not([type="email"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])');
  const allTextareas = page.locator('textarea');
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    if (await input.isVisible().catch(() => false)) {
      const isInHeader = await input.evaluate((el) => !!el.closest('header, nav, [role="banner"]'));
      if (isInHeader) continue;
      const isInAntSelect = await input.evaluate((el) => !!el.closest('.ant-select'));
      if (isInAntSelect) continue;
      const placeholder = (await input.getAttribute('placeholder').catch(() => '') || '').toLowerCase();
      const name = (await input.getAttribute('name').catch(() => '') || '').toLowerCase();
      const type = await input.getAttribute('type').catch(() => 'text');
      if (placeholder.includes('search') || name.includes('search')) continue;
      if (type === 'email' || name.includes('email')) continue;
      let value = 'TestValue';
      if (name.includes('first') || placeholder.includes('first')) value = opts.firstName;
      else if (name.includes('last') || placeholder.includes('last')) value = opts.lastName;
      else if (name.includes('phone') || placeholder.includes('phone') || type === 'tel') value = opts.phone;
      else if (name.includes('website') || placeholder.includes('website')) value = opts.website;
      else if (name.includes('linkedin') || placeholder.includes('linkedin')) value = opts.linkedin;
      else if (name.includes('experience') || placeholder.includes('experience')) value = opts.experience;
      await input.scrollIntoViewIfNeeded();
      await delay(300);
      await input.clear();
      await delay(200);
      await input.fill(value, { delay: 50 });
      await delay(400);
    }
  }
  const textareaCount = await allTextareas.count();
  for (let i = 0; i < textareaCount; i++) {
    const ta = allTextareas.nth(i);
    if (await ta.isVisible().catch(() => false)) {
      const isInHeader = await ta.evaluate((el) => !!el.closest('header, nav, [role="banner"]'));
      if (isInHeader) continue;
      const placeholder = (await ta.getAttribute('placeholder').catch(() => '') || '').toLowerCase();
      if (placeholder.includes('search')) continue;
      await ta.scrollIntoViewIfNeeded();
      await delay(300);
      await ta.clear();
      await delay(200);
      await ta.fill(opts.bio, { delay: 50 });
      await delay(400);
    }
  }
  await delay(1000);
  const updateButton = page.locator('button:has-text("Update"), button:has-text("Save"), button[type="submit"]').first();
  await updateButton.scrollIntoViewIfNeeded();
  await delay(300);
  await updateButton.waitFor({ state: 'visible', timeout: 5000 });
  await updateButton.click();
  await page.waitForLoadState('domcontentloaded');
  await delay(2000);
}

async function runNegativeProfileUpdate(page, overrides, caseName) {
  await login(page);
  await navigateToUpdateProfile(page);
  await fillAndSubmitProfile(page, overrides);
  const hasSuccess = await page.getByText(/updated|success|saved/i).isVisible().catch(() => false);
  console.log('Case:', caseName, '| Expected: no success | Actual:', hasSuccess ? 'FAIL' : 'PASS');
  expect(hasSuccess).toBe(false);
  await delay(500);
}

test.describe('Update Profile - Negative Test Cases', () => {
  test.setTimeout(60000);

  test('NC1: Empty first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: '' }, 'Empty first name');
  });

  test('NC2: Empty last name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { lastName: '' }, 'Empty last name');
  });

  test('NC3: Invalid phone - letters only', async ({ page }) => {
    await runNegativeProfileUpdate(page, { phone: 'abcdefghij' }, 'Phone letters only');
  });

  test('NC4: Invalid phone - too short', async ({ page }) => {
    await runNegativeProfileUpdate(page, { phone: '123' }, 'Phone too short');
  });

  test('NC5: Invalid phone - special characters', async ({ page }) => {
    await runNegativeProfileUpdate(page, { phone: '555-123-4567!' }, 'Phone special chars');
  });

  test('NC6: Invalid website URL', async ({ page }) => {
    await runNegativeProfileUpdate(page, { website: 'invalidurl' }, 'Invalid website URL');
  });

  test('NC7: Invalid LinkedIn URL', async ({ page }) => {
    await runNegativeProfileUpdate(page, { linkedin: 'not-valid' }, 'Invalid LinkedIn URL');
  });

  test('NC8: SQL injection in first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: "Robert'; DROP TABLE users;--" }, 'SQL injection');
  });

  test('NC9: XSS attempt in bio', async ({ page }) => {
    await runNegativeProfileUpdate(page, { bio: '<script>alert("xss")</script>' }, 'XSS in bio');
  });

  test('NC10: Special characters in first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: 'Test@#$%^&*()' }, 'Special chars in name');
  });

  test('NC11: Numbers only in first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: '1234567890' }, 'Numbers only in name');
  });

  test('NC12: Spaces only in first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: '   ' }, 'Spaces only in name');
  });

  test('NC13: Very long first name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: 'A'.repeat(500) }, 'Very long first name');
  });

  test('NC14: Empty first and last name', async ({ page }) => {
    await runNegativeProfileUpdate(page, { firstName: '', lastName: '' }, 'Both names empty');
  });
});
