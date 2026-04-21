// updateProfile.spec.js - Login, open profile dropdown, edit profile, update all fields except email
const { test, expect } = require('../fixtures/screenshotFixture');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';
const UPDATE_PROFILE_URL = 'https://staging.fastlearner.ai/user/update-profile';

// On The Web - social link fields with exact URLs
const SOCIAL_LINKS = {
  website: 'https://fastlearner.ai',
  web: 'https://fastlearner.ai',
  site: 'https://fastlearner.ai',
  x: 'https://x.com/fastlearner_ai?s=11&t=Vt_WkfQUCv78CQwfkOBmGw',
  twitter: 'https://x.com/fastlearner_ai?s=11&t=Vt_WkfQUCv78CQwfkOBmGw',
  facebook: 'https://www.facebook.com/FastlearnerAI',
  linkedin: 'https://www.linkedin.com/company/fastlearner/',
  youtube: 'https://www.youtube.com/watch?v=2crhrbqCLzU',
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function getValueForField(type, name, placeholder) {
  const n = (name || '').toLowerCase();
  const p = (placeholder || '').toLowerCase();
  const combined = `${n} ${p}`;
  if (n.includes('phone') || p.includes('phone') || type === 'tel') return '5551234567';
  if (n.includes('first') || p.includes('first')) return 'TestFirst';
  if (n.includes('last') || p.includes('last')) return 'TestLast';
  if (combined.includes('experience')) return '5 Year';
  for (const [key, url] of Object.entries(SOCIAL_LINKS)) {
    if (combined.includes(key)) return url;
  }
  return 'TestUpdated';
}

async function login(page) {
  await page.goto('https://staging.fastlearner.ai/auth/sign-in');
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

test.describe('Update Profile', () => {
  test.setTimeout(60000);

  test('login, open profile dropdown, edit profile, update all fields except email', async ({ page }) => {
    // 1. Login
    await login(page);
    await page.waitForLoadState('domcontentloaded');
    await delay(2500);

    // 2. Click on profile dropdown in navbar (avatar, user menu, or profile button)
    // Exclude Categories dropdown - only click profile/user menu
    const profileSelectors = [
      'button[aria-haspopup="menu"]',
      '[data-testid="user-menu"]',
      'header button:has(img)',
      'header [class*="avatar"]',
      'header [class*="profile"]',
      '[class*="user-menu"]',
      'button:has([class*="avatar"])',
    ];
    let dropdownClicked = false;
    for (const sel of profileSelectors) {
      const candidates = page.locator(sel);
      const count = await candidates.count();
      for (let i = 0; i < count; i++) {
        const el = candidates.nth(i);
        if (await el.isVisible().catch(() => false)) {
          const text = (await el.textContent().catch(() => '') || '').toLowerCase();
          if (text.includes('categor')) continue; // Skip Categories dropdown
          await el.click();
          dropdownClicked = true;
          break;
        }
      }
      if (dropdownClicked) break;
    }
    if (!dropdownClicked) {
      // Fallback: try last button in header (often profile)
      const headerButtons = page.locator('header button');
      const count = await headerButtons.count();
      if (count > 0) await headerButtons.nth(count - 1).click();
    }
    await delay(2000);

    // 3. Click on edit profile link inside the dropdown, or navigate directly
    const editProfileLink = page.getByRole('link', { name: /edit profile/i }).or(
      page.locator('a[href*="update-profile"]')
    ).first();
    const linkVisible = await editProfileLink.isVisible().catch(() => false);
    if (linkVisible) {
      await editProfileLink.click();
    } else {
      await page.goto(UPDATE_PROFILE_URL);
    }

    // 4. Verify redirect to update profile page
    await expect(page).toHaveURL(UPDATE_PROFILE_URL, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await delay(2000);

    // Close any open dropdown (e.g. category) - press Escape
    await page.keyboard.press('Escape');
    await delay(500);

    // 5. Update all fields except email, search box - fill form inputs only (exclude header search)
    const allInputs = page.locator('input:not([type="email"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])');
    const allTextareas = page.locator('textarea');

    const inputCount = await allInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      if (await input.isVisible().catch(() => false)) {
        const isInHeader = await input.evaluate((el) => !!el.closest('header, nav, [role="banner"]'));
        if (isInHeader) continue; // Skip search box in header/navbar - do NOT fill
        const isInAntSelect = await input.evaluate((el) => !!el.closest('.ant-select'));
        if (isInAntSelect) continue; // Skip category/dropdown - don't open
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        const role = await input.getAttribute('role').catch(() => '');
        const ariaLabel = await input.getAttribute('aria-label').catch(() => '');
        const combined = `${placeholder} ${role} ${ariaLabel}`.toLowerCase();
        if (combined.includes('search')) continue; // Skip search box - do NOT fill
        const type = await input.getAttribute('type').catch(() => 'text');
        const name = await input.getAttribute('name').catch(() => '');
        if (type === 'email' || (name || '').toLowerCase().includes('email')) continue;
        await input.scrollIntoViewIfNeeded();
        await delay(500);
        await input.clear();
        await delay(300);
        const value = getValueForField(type, name, placeholder);
        await input.fill(value, { delay: 80 });
        await delay(800);
      }
    }

    const textareaCount = await allTextareas.count();
    for (let i = 0; i < textareaCount; i++) {
      const ta = allTextareas.nth(i);
      if (await ta.isVisible().catch(() => false)) {
        const isInHeader = await ta.evaluate((el) => !!el.closest('header, nav, [role="banner"]'));
        if (isInHeader) continue; // Skip search in header
        const placeholder = (await ta.getAttribute('placeholder').catch(() => '') || '').toLowerCase();
        if (placeholder.includes('search')) continue; // Skip search textarea
        await ta.scrollIntoViewIfNeeded();
        await delay(500);
        await ta.clear();
        await delay(300);
        await ta.fill('Test bio updated', { delay: 50 });
        await delay(800);
      }
    }

    // 6. Click on update button
    await delay(1500);
    const updateButton = page.locator(
      'button:has-text("Update"), button:has-text("Save"), button[type="submit"]'
    ).first();
    await updateButton.scrollIntoViewIfNeeded();
    await delay(500);
    await updateButton.waitFor({ state: 'visible', timeout: 5000 });
    await updateButton.click();

    await page.waitForLoadState('domcontentloaded');
    await delay(2000);
    console.log('Update profile flow completed');
  });
});
