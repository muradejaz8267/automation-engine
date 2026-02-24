// createCourse.negative.spec.js - Negative test coverage for Create Course feature
// Run: npm run test:negative  |  test panel: Create Course Negative Test Cases
//
// TEST CASES COVERED:
// 1. Required field - Title empty prevents Continue (button disabled or validation on submit)
// 2. Required field - Empty Title blocks Continue (click does not advance)
// 3. Invalid input - Invalid URL format shows validation
// 4. Boundary - Title exceeds max length (truncation or validation)
// 5. Button state - Empty form cannot advance to next step
// 6. Unauthorized - Direct access without login redirects to auth
//
const http = require('http');
const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const CreateCors = require('./pages/CreateCors');

const BASE_URL = 'https://staging.fastlearner.ai';
const SCREENSHOT_API_URL = process.env.SCREENSHOT_API_URL || '';

function postScreenshot(base64) {
  if (!SCREENSHOT_API_URL) return Promise.resolve();
  return new Promise((resolve) => {
    const body = JSON.stringify({ screenshot: base64 });
    const url = new URL(SCREENSHOT_API_URL + '/api/screenshot');
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { res.on('data', () => {}); res.on('end', () => resolve()); });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function sendScreenshot(page) {
  if (!SCREENSHOT_API_URL) return;
  try {
    const buf = await page.screenshot({ type: 'jpeg', quality: 70 });
    await postScreenshot(buf.toString('base64'));
  } catch (e) {}
}

// Helper: select dropdown option with overlay stability wait
async function selectDropdownOption(page, optionText) {
  const option = page.getByRole('option', { name: new RegExp(`^${optionText}$`, 'i') })
    .or(page.locator('.cdk-overlay-pane').getByText(optionText, { exact: true }))
    .first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  await option.click({ force: true, timeout: 10000 });
}

test.describe('Create Course - Negative Tests @negative', () => {
  test.setTimeout(60000);
  test.describe.configure({ mode: 'serial', workers: 1 });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login();
    await expect(page).toHaveURL(/staging\.fastlearner\.ai\/student\/dashboard/, { timeout: 15000 });
    await sendScreenshot(page);
  });

  test('@negative 1. Required field - Title empty prevents Continue', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    const createCourse = new CreateCors(page);
    await createCourse.navigateToCourseCreation();
    await expect(page).toHaveURL(/\/instructor\/course/);

    const typeDropdown = page.locator('.ant-select-selector').first();
    await typeDropdown.click();
    await page.waitForTimeout(600);
    await selectDropdownOption(page, 'Standard');

    const categoryDropdown = page.locator('.ant-select-selector').nth(2);
    await categoryDropdown.click();
    await page.waitForTimeout(600);
    await selectDropdownOption(page, 'Development');

    const titleInput = page.getByPlaceholder('Insert your title').or(page.locator('input[placeholder*="title" i]')).first();
    await titleInput.fill('');
    await titleInput.blur();

    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => true);
    const hasValidation = await page.locator('text=/required|please|fill|title/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(isDisabled || hasValidation).toBeTruthy();
    await sendScreenshot(page);
    } finally {
    if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });

  test('@negative 2. Required field - Empty Title blocks Continue', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    const createCourse = new CreateCors(page);
    await createCourse.navigateToCourseCreation();
    await expect(page).toHaveURL(/\/instructor\/course/);

    const typeDropdown = page.locator('.ant-select-selector').first();
    await typeDropdown.click();
    await page.waitForTimeout(600);
    await selectDropdownOption(page, 'Standard');

    const categoryDropdown = page.locator('.ant-select-selector').nth(2);
    await categoryDropdown.click();
    await page.waitForTimeout(600);
    await selectDropdownOption(page, 'Development');

    const titleInput = page.getByPlaceholder('Insert your title').or(page.locator('input[placeholder*="title" i]')).first();
    await titleInput.fill('');
    await titleInput.blur();

    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBeTruthy();
      return;
    }
    const urlBefore = page.url();
    await continueBtn.click();
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    const hasValidation = await page.locator('text=/required|please|fill|title/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    const didNotNavigate = urlBefore === urlAfter;
    expect(hasValidation || didNotNavigate).toBeTruthy();
    await sendScreenshot(page);
    } finally {
    if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });

  test('@negative 3. Invalid input - Invalid URL format shows validation', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    const createCourse = new CreateCors(page);
    await createCourse.navigateToCourseCreation();
    await expect(page).toHaveURL(/\/instructor\/course/);

    const urlInput = page.locator('input[placeholder*="URL" i], input[placeholder*="link" i]').first();
    await urlInput.waitFor({ state: 'visible', timeout: 10000 });
    await urlInput.fill('not-a-valid-url');
    await urlInput.blur();

    const hasError = await page.locator('text=/invalid|valid|url|format|link|please enter/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasError).toBeTruthy();
    await sendScreenshot(page);
    } finally {
    if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });

  test('@negative 4. Boundary - Title exceeds max length', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    const createCourse = new CreateCors(page);
    await createCourse.navigateToCourseCreation();
    await expect(page).toHaveURL(/\/instructor\/course/);

    const titleInput = page.getByPlaceholder('Insert your title').or(page.locator('input[placeholder*="title" i]')).first();
    const longTitle = 'A'.repeat(301);
    await titleInput.fill(longTitle);
    await titleInput.blur();

    const value = await titleInput.inputValue();
    const hasValidation = await page.locator('text=/max|maximum|length|character/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(value.length <= 300 || hasValidation).toBeTruthy();
    await sendScreenshot(page);
    } finally {
    if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });

  test('@negative 5. Button state - Empty form cannot advance to next step', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    const createCourse = new CreateCors(page);
    await createCourse.navigateToCourseCreation();
    await expect(page).toHaveURL(/\/instructor\/course/);

    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });

    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBeTruthy();
      return;
    }
    const urlBefore = page.url();
    await continueBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    const hasValidation = await page.locator('text=/required|please|fill|select/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    const stillOnCourse = urlAfter.includes('/instructor/course') && !urlAfter.includes('/content-type');
    expect(stillOnCourse || hasValidation).toBeTruthy();
    await sendScreenshot(page);
    } finally {
    if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});

test.describe('Create Course - Unauthorized Access @negative', () => {
  test('@negative 6. Unauthorized - Direct access to course page without login redirects to auth', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
      await page.goto(`${BASE_URL}/instructor/course`, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded');
      await sendScreenshot(page);

      const currentUrl = page.url();
      const hasAuthRedirect = currentUrl.includes('sign-in') || currentUrl.includes('auth') || currentUrl.includes('login');
      const hasCourseForm = await page.getByRole('heading', { name: /Create|Course/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasAuthRedirect || !hasCourseForm).toBeTruthy();
      await sendScreenshot(page);
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});
