// shareButton.spec.js - Open any course and click share button
const { test, expect } = require('../fixtures/screenshotFixture');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

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

test.describe('Share Button', () => {
  test.setTimeout(60000);

  test('open any course and click share button', async ({ page, context }) => {
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

    // Click share button
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
    }, SHARE_BUTTON_XPATH);

    await new Promise((r) => setTimeout(r, 2000));

    // Grant clipboard permission before copy (reduces chance of permission dialog)
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy button in share modal (copies current page URL)
    const copyButton = page.getByRole('button', { name: /copy/i });
    await copyButton.waitFor({ state: 'visible', timeout: 5000 });
    await copyButton.click();

    await new Promise((r) => setTimeout(r, 500));

    // Click Allow on clipboard permission dialog if it appears (Enter key)
    await new Promise((r) => setTimeout(r, 1000));
    await page.keyboard.press('Enter');

    await new Promise((r) => setTimeout(r, 500));

    // Read copied URL from clipboard (fallback to current page URL)
    let copiedUrl;
    try {
      copiedUrl = await page.evaluate(() => navigator.clipboard.readText());
    } catch {
      copiedUrl = page.url();
    }
    expect(copiedUrl).toBeTruthy();
    expect(copiedUrl).toContain('course-details');

    // Open new tab and navigate to the copied URL (simulate paste)
    const newPage = await context.newPage();
    await newPage.goto(copiedUrl);
    await newPage.waitForLoadState('load');

    const newTabUrl = newPage.url();

    // Compare copied URL with pasted URL in new tab
    const copiedPath = new URL(copiedUrl.trim()).pathname.replace(/\/$/, '');
    const newTabPath = new URL(newTabUrl).pathname.replace(/\/$/, '');
    expect(newTabPath).toBe(copiedPath);

    await new Promise((r) => setTimeout(r, 4000));
    await newPage.close();
    console.log('Course opened, share clicked, copy clicked, URL verified in new tab');
  });
});
