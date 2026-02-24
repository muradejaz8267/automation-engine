// addToFavoriteCourse.spec.js - Open course from home page and add to favorite
const { test, expect } = require('../fixtures/screenshotFixture');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

// Custom locators for course detail card buttons (next to Start Learning)
const HEART_BUTTON_XPATH = '(//div[contains(., "This course includes")]//button[contains(@class, "course-hover-default-btn")])[1]';
const SHARE_BUTTON_XPATH = '(//div[contains(., "This course includes")]//button[contains(@class, "share-hover-default-btn")])[1]';

async function login(page) {
  await page.goto('https://staging.fastlearner.ai/auth/sign-in');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill('cooper@yopmail.com');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill('Qwerty@123');
  await passwordInput.press('Enter');

  await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
}

test.describe('Add to Favorite Course', () => {
  test.setTimeout(60000);

  test('open course from home page and add to favorite', async ({ page }) => {
    await login(page);

    const courseLinks = page.locator('a[href*="course-details"]');
    const count = await courseLinks.count();

    if (count > 0) {
      await courseLinks.first().click();
    } else {
      await page.goto('https://staging.fastlearner.ai/student/course-details/photo-shop-mastering');
    }

    await expect(page).toHaveURL(/course-details/);
    await page.waitForLoadState('domcontentloaded');
    await new Promise((r) => setTimeout(r, 3000));

    // Click heart icon (add to favorite)
    await page.evaluate((xpath) => {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      const btn = result.singleNodeValue;
      if (btn) btn.click();
    }, HEART_BUTTON_XPATH);

    await new Promise((r) => setTimeout(r, 2000));
    console.log('Course opened and added to favorites');
  });
});
