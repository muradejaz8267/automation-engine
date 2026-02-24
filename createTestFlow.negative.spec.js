// createTestFlow.negative.spec.js - Negative tests for Create Test flow (aligned with CreateTestFlow.spec.js)
// Flow: Login → /instructor/test → Step 1 form → Thumbnail → Continue
// Run: test panel "Create Test Negative Test Cases" (report + browser view)  |  CLI: npm run test:negative:create-test
//
// ========== TEST CASES (7) ==========
// 1. Title empty prevents Continue  2. Type not selected  3. Headline empty  4. Prerequisite empty
// 5. Empty form cannot advance  6. Thumbnail not uploaded  7. Unauthorized - direct access without login
//
const http = require('http');
const { test, expect } = require('@playwright/test');
const LoginPage = require('./pages/LoginPage');
const CreateTestPage = require('./pages/CreateTestPage.copy');

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

const PAUSE_BEFORE_CLOSE_MS = 1500;

test.describe('Create Test - Negative Tests @negative', () => {
  test.setTimeout(60000);
  test.describe.configure({ mode: 'serial', workers: 1 });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(PAUSE_BEFORE_CLOSE_MS);
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login();
    await expect(page).toHaveURL(/staging\.fastlearner\.ai\/student\/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/instructor/test`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('heading', { name: 'Create Test', level: 3 }).waitFor({ state: 'visible', timeout: 15000 });
    await sendScreenshot(page);
  });

  test('@negative 1. Required field - Title empty prevents Continue', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 1/7: Required field - Title empty prevents Continue (fill form, then clear title)\n');
    const createTestPage = new CreateTestPage(page);
    await createTestPage.fillTestForm();
    const titleInput = page.getByPlaceholder('Insert your title').first();
    await titleInput.fill('');
    await titleInput.blur();

    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => true);
    const hasValidation = await page.locator('text=/required|please|fill|title/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(isDisabled || hasValidation).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });

  test('@negative 2. Required field - Type not selected prevents Continue', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 2/7: Type not selected prevents Continue (only title filled, no Type/Category)\n');
    const titleInput = page.getByPlaceholder('Insert your title').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill(`Test ${Date.now()}`);
    const typeTrigger = page.locator('.ant-select-selector').first();
    const typeText = await typeTrigger.textContent();
    const typeNotSelected = !typeText || typeText.trim() === '' || /select|please/i.test(typeText);
    expect(typeNotSelected).toBeTruthy();

    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBeTruthy();
      return;
    }
    const urlBefore = page.url();
    await continueBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
    const urlAfter = page.url();
    const hasValidation = await page.locator('text=/required|please|select|type/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    const didNotAdvance = urlBefore === urlAfter;
    expect(hasValidation || didNotAdvance).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });

  test('@negative 3. Required field - Headline empty shows validation', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 3/7: Headline empty shows validation (fill form, then clear headline)\n');
    const createTestPage = new CreateTestPage(page);
    await createTestPage.fillTestForm();
    const headlineInput = page.getByPlaceholder('About the test').first();
    await headlineInput.fill('');
    await headlineInput.blur();

    const hasValidation = await page.locator('text=/required|headline|about|please/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    expect(hasValidation || isDisabled).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });

  test('@negative 4. Required field - Prerequisite empty shows validation', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 4/7: Prerequisite empty shows validation (fill form, then clear prerequisite)\n');
    const createTestPage = new CreateTestPage(page);
    await createTestPage.fillTestForm();
    const prerequisiteInput = page.getByPlaceholder('Eg. You must have a basic knowledge of programming').first();
    await prerequisiteInput.fill('');
    await prerequisiteInput.blur();

    const hasValidation = await page.locator('text=/required|prerequisite|please/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    expect(hasValidation || isDisabled).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });

  test('@negative 5. Button state - Empty form cannot advance', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 5/7: Empty form cannot advance (no fields filled)\n');
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
    const stillOnTest = urlAfter.includes('/instructor/test');
    expect(stillOnTest || hasValidation).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });

  test('@negative 6. Required - Thumbnail not uploaded prevents Continue', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    console.log('\n[Create Test Negative] Test 6/7: Thumbnail not uploaded - fill all fields, leave thumbnail empty, click Continue, expect error\n');
    const createTestPage = new CreateTestPage(page);
    await createTestPage.fillTestForm();
    // Use unique dummy title to avoid "title already exists" error
    const titleInput = page.getByPlaceholder('Insert your title').first();
    await titleInput.fill(`Thumbnail Neg Dummy ${Date.now()}`);
    await titleInput.blur();
    // Do NOT upload thumbnail - leave it empty
    await page.getByText('Thumbnail *').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const urlBefore = page.url();
    const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    await page.waitForTimeout(2000);

    const urlAfter = page.url();
    const didNotAdvance = urlBefore === urlAfter;
    const hasError = await page.locator('text=/thumbnail|required|upload|please|file|choose|select.*image/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(didNotAdvance).toBeTruthy();
    expect(hasError).toBeTruthy();
    await sendScreenshot(page);
    } finally { if (screenshotInterval) clearInterval(screenshotInterval); }
  });
});

test.describe('Create Test - Unauthorized Access @negative', () => {
  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(PAUSE_BEFORE_CLOSE_MS);
  });

  test('@negative 7. Unauthorized - Direct access to test page without login redirects to auth', async ({ page }) => {
    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
      console.log('\n[Create Test Negative] Test 7/7: Unauthorized - Direct /instructor/test without login\n');
      await page.goto(`${BASE_URL}/instructor/test`, { timeout: 15000 });
      await page.waitForLoadState('domcontentloaded');
      await sendScreenshot(page);

      const currentUrl = page.url();
      const hasAuthRedirect = currentUrl.includes('sign-in') || currentUrl.includes('auth') || currentUrl.includes('login');
      const hasTestForm = await page.getByRole('heading', { name: /Create Test/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasAuthRedirect || !hasTestForm).toBeTruthy();
      await sendScreenshot(page);
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});
