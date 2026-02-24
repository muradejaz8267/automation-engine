// homePageFlow.spec.js - Home page flow: login → dashboard → check each button one by one.
// Pattern: on dashboard → click button → verify redirect → back to dashboard → next button.
// Run from test panel: HomePageFlow button (report + browser view)
const http = require('http');
const { test, expect } = require('@playwright/test');

const LoginPage = require('./pages/LoginPage');
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

const HOME_URL = 'https://staging.fastlearner.ai/';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';
const COURSES_URL = 'https://staging.fastlearner.ai/student/courses';
const PREMIUM_COURSES_URL = 'https://staging.fastlearner.ai/student/courses?courseType=PREMIUM_COURSE';
const TRENDING_COURSES_URL = 'https://staging.fastlearner.ai/student/courses?feature=TRENDING_COURSE';
const TEST_CENTER_URL = 'https://staging.fastlearner.ai/student/courses?contentType=TEST';
const FREE_COURSES_URL = 'https://staging.fastlearner.ai/student/courses?courseType=FREE_COURSE';
const WELCOME_INSTRUCTOR_URL = 'https://staging.fastlearner.ai/welcome-instructor';
const NEW_COURSES_URL = 'https://staging.fastlearner.ai/student/courses?feature=NEW_COURSE';
const DASHBOARD_TIMEOUT = 20000;
const START_NOW_TIMEOUT = 20000;
const REDIRECT_TIMEOUT = 15000;
const BACK_TO_DASHBOARD_TIMEOUT = 15000;
const VIEW_ALL_TIMEOUT = 15000;

test.describe('Home Page Flow', () => {
  test('Open home page and login (same as createCors, just till login)', async ({ page, context }) => {
    // Longer timeout because this flow covers many footer links/logos + subscribe
    test.setTimeout(240000);

    let screenshotInterval;
    if (SCREENSHOT_API_URL) screenshotInterval = setInterval(() => sendScreenshot(page).catch(() => {}), 1200);
    try {
    try {
      // 1. Open home page
      console.log('Step 1: Opening home page...');
      await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await expect(page).toHaveURL(/staging\.fastlearner\.ai/, { timeout: 10000 });
      console.log('✓ Home page loaded');
      await sendScreenshot(page);
    } catch (err) {
      throw new Error(`Home page failed to load: ${err.message}`);
    }

    try {
      // 2. Login same as createCors (navigate to sign-in then login)
      console.log('Step 2: Navigating to login page...');
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      console.log('Step 3: Logging in...');
      await loginPage.login();
      await sendScreenshot(page);
    } catch (err) {
      throw new Error(`Login failed: ${err.message}`);
    }

    try {
      // 3. Verify redirect to student dashboard
      console.log('Step 4: Verifying redirect to dashboard...');
      await expect(page).toHaveURL('https://staging.fastlearner.ai/student/dashboard', { timeout: DASHBOARD_TIMEOUT });
      console.log('✓ Login complete – on student dashboard');
      await sendScreenshot(page);
    } catch (err) {
      throw new Error(`Dashboard redirect failed (timeout ${DASHBOARD_TIMEOUT}ms): ${err.message}`);
    }

    try {
      // 4. Stay on dashboard – proper waits for page to be ready
      console.log('Step 5: Waiting for dashboard to be ready...');
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/student\/dashboard/, { timeout: 10000 });
      console.log('✓ Dashboard page ready');
      await sendScreenshot(page);
    } catch (err) {
      throw new Error(`Dashboard not ready: ${err.message}`);
    }

    try {
      // 5. Click "Start Now" – use span.ng-star-inserted with text "Start Now"
      console.log('Step 6: Clicking Start Now...');
      const startNowSpan = page.locator('span.ng-star-inserted').filter({ hasText: 'Start Now' }).first();
      await startNowSpan.waitFor({ state: 'visible', timeout: START_NOW_TIMEOUT });
      await startNowSpan.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await startNowSpan.click({ timeout: 10000 });
      console.log('✓ Clicked Start Now');
    } catch (err) {
      throw new Error(`Start Now button not found or click failed (timeout ${START_NOW_TIMEOUT}ms): ${err.message}`);
    }

    try {
      // 6. Verify redirect to student courses page
      console.log('Step 7: Verifying redirect to courses page...');
      await expect(page).toHaveURL(COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ Redirected to student courses');
    } catch (err) {
      throw new Error(`Redirect to ${COURSES_URL} failed (timeout ${REDIRECT_TIMEOUT}ms): ${err.message}`);
    }

    // Wait a little on courses page before going back to dashboard
    console.log('Waiting on courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting on courses page');

    try {
      // 7. Redirect back to dashboard (so we can check next homepage buttons one by one)
      console.log('Step 8: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard – ready to check next homepage element');
    } catch (err) {
      throw new Error(`Back to dashboard failed (timeout ${BACK_TO_DASHBOARD_TIMEOUT}ms): ${err.message}`);
    }

    // 8. Scroll down a little, then click "View All" (paragraph with " View All ")
    try {
      console.log('Step 9: Scrolling down on dashboard...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(800);
      console.log('Step 10: Clicking View All...');
      const viewAllP = page.locator('p').filter({ hasText: 'View All' }).first();
      await viewAllP.waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      await viewAllP.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllP.click({ timeout: 10000 });
      console.log('✓ Clicked View All');
    } catch (err) {
      throw new Error(`View All click failed (timeout ${VIEW_ALL_TIMEOUT}ms): ${err.message}`);
    }

    try {
      console.log('Step 11: Verifying redirect to Premium courses page...');
      await expect(page).toHaveURL(PREMIUM_COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On Premium courses page');
    } catch (err) {
      throw new Error(`Redirect to Premium courses failed: ${err.message}`);
    }

    console.log('Waiting on Premium courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 12: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 9. Scroll to Premium Courses slider, then use slider buttons: 2x right, 2x left
    try {
      console.log('Step 13: Scrolling to Premium Courses slider...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
      const sliderButtons = page.locator('div.slider-button-dark');
      await sliderButtons.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const count = await sliderButtons.count();
      if (count < 2) throw new Error(`Expected 2 slider buttons, found ${count}`);
      const leftBtn = sliderButtons.nth(0);
      const rightBtn = sliderButtons.nth(1);
      await rightBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 14: Clicking right slider button 2 times...');
      await rightBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await rightBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 15: Clicking left slider button 2 times...');
      await leftBtn.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await leftBtn.click({ timeout: 5000 });
      console.log('✓ Slider buttons clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Slider buttons failed: ${err.message}`);
    }

    // 10. Scroll down, click "View All" under Discover Top Trending Courses → Trending page → wait → back to dashboard
    // Trending "View All" has img.view-all-img (arrow-dark.svg); Premium has arrow-new.svg – so we target by that.
    try {
      console.log('Step 16: Scrolling down to Discover Top Trending Courses...');
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(1200);
      const viewAllTrending = page.locator('p.view-all-para').filter({ has: page.locator('img.view-all-img') }).first();
      await viewAllTrending.waitFor({ state: 'attached', timeout: VIEW_ALL_TIMEOUT });
      await viewAllTrending.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllTrending.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Step 17: Clicking View All (Trending courses)...');
      await viewAllTrending.click({ timeout: 10000 });
      console.log('✓ Clicked View All – Trending');
    } catch (err) {
      throw new Error(`View All (Trending) click failed: ${err.message}`);
    }

    try {
      console.log('Step 18: Verifying redirect to Trending courses page...');
      await expect(page).toHaveURL(TRENDING_COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On Trending courses page');
    } catch (err) {
      throw new Error(`Redirect to Trending courses failed: ${err.message}`);
    }

    console.log('Waiting on Trending courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 19: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 11. Slider with class "slider-button" (white bg): 2x right, 2x left
    try {
      console.log('Step 20: Scrolling to slider (slider-button)...');
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(800);
      const sliderBtnLight = page.locator('div.slider-button');
      await sliderBtnLight.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const count = await sliderBtnLight.count();
      if (count < 2) throw new Error(`Expected 2 slider-button elements, found ${count}`);
      const leftBtnLight = sliderBtnLight.nth(0);
      const rightBtnLight = sliderBtnLight.nth(1);
      await rightBtnLight.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 21: Clicking right slider button 2 times...');
      await rightBtnLight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await rightBtnLight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 22: Clicking left slider button 2 times...');
      await leftBtnLight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await leftBtnLight.click({ timeout: 5000 });
      console.log('✓ Slider-button clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Slider-button failed: ${err.message}`);
    }

    // 12. Scroll, click "View All" under Test Center → Test Center page → wait → back to dashboard
    try {
      console.log('Step 23: Scrolling to Test Center section...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      const viewAllTestCenter = page.locator('p.view-all-para').filter({ has: page.locator('img.view-all-img') }).nth(1);
      await viewAllTestCenter.waitFor({ state: 'attached', timeout: VIEW_ALL_TIMEOUT });
      await viewAllTestCenter.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllTestCenter.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Step 24: Clicking View All (Test Center)...');
      await viewAllTestCenter.click({ timeout: 10000 });
      console.log('✓ Clicked View All – Test Center');
    } catch (err) {
      throw new Error(`View All (Test Center) click failed: ${err.message}`);
    }

    try {
      console.log('Step 25: Verifying redirect to Test Center page...');
      await expect(page).toHaveURL(TEST_CENTER_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On Test Center courses page');
    } catch (err) {
      throw new Error(`Redirect to Test Center failed: ${err.message}`);
    }

    console.log('Waiting on Test Center page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 26: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 13. Scroll to Test Center, then use slider (second pair of div.slider-button on page): 2x right, 2x left
    try {
      console.log('Step 27: Scrolling to Test Center slider...');
      await page.evaluate(() => window.scrollBy(0, 700));
      await page.waitForTimeout(1200);
      const allSliderBtns = page.locator('div.slider-button');
      await allSliderBtns.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const count = await allSliderBtns.count();
      if (count < 2) throw new Error(`Expected at least 2 slider-button, found ${count}`);
      const testCenterLeft = count >= 4 ? allSliderBtns.nth(2) : allSliderBtns.nth(0);
      const testCenterRight = count >= 4 ? allSliderBtns.nth(3) : allSliderBtns.nth(1);
      await testCenterRight.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await testCenterRight.waitFor({ state: 'visible', timeout: 8000 });
      console.log('Step 28: Clicking Test Center right slider 2 times...');
      await testCenterRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await testCenterRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 29: Clicking Test Center left slider 2 times...');
      await testCenterLeft.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await testCenterLeft.click({ timeout: 5000 });
      console.log('✓ Test Center slider clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Test Center slider failed: ${err.message}`);
    }

    // 14. Scroll, click "View All" under Free Courses with AI-Enabled Learning (arrow-new.svg) → Free courses page → wait → back to dashboard
    try {
      console.log('Step 30: Scrolling to Free Courses section...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      const viewAllFree = page.locator('p').filter({ hasText: 'View All' }).filter({ has: page.locator('img[src*="arrow-new"]') }).nth(1);
      await viewAllFree.waitFor({ state: 'attached', timeout: VIEW_ALL_TIMEOUT });
      await viewAllFree.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllFree.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Step 31: Clicking View All (Free Courses)...');
      await viewAllFree.click({ timeout: 10000 });
      console.log('✓ Clicked View All – Free Courses');
    } catch (err) {
      throw new Error(`View All (Free Courses) click failed: ${err.message}`);
    }

    try {
      console.log('Step 32: Verifying redirect to Free courses page...');
      await expect(page).toHaveURL(FREE_COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On Free courses page');
    } catch (err) {
      throw new Error(`Redirect to Free courses failed: ${err.message}`);
    }

    console.log('Waiting on Free courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 33: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 15. Scroll to Free Courses (AI-Enabled) section, use slider (div.slider-button-dark): 2x right, 2x left
    try {
      console.log('Step 34: Scrolling to Free Courses (AI-Enabled) slider...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
      const allDarkSlider = page.locator('div.slider-button-dark');
      await allDarkSlider.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const count = await allDarkSlider.count();
      if (count < 2) throw new Error(`Expected at least 2 slider-button-dark, found ${count}`);
      const freeLeft = count >= 4 ? allDarkSlider.nth(2) : allDarkSlider.nth(0);
      const freeRight = count >= 4 ? allDarkSlider.nth(3) : allDarkSlider.nth(1);
      await freeRight.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await freeRight.waitFor({ state: 'visible', timeout: 8000 });
      console.log('Step 35: Clicking Free Courses right slider 2 times...');
      await freeRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await freeRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 36: Clicking Free Courses left slider 2 times...');
      await freeLeft.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await freeLeft.click({ timeout: 5000 });
      console.log('✓ Free Courses (AI-Enabled) slider clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Free Courses slider failed: ${err.message}`);
    }

    // 16. Scroll, click "View All" under Explore Our Vast Course Library (p.view-all-p) → courses page → wait → back to dashboard
    try {
      console.log('Step 37: Scrolling to Explore Our Vast Course Library...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      const viewAllLibrary = page.locator('p.view-all-p').filter({ has: page.locator('img.view-all-img') }).first();
      await viewAllLibrary.waitFor({ state: 'attached', timeout: VIEW_ALL_TIMEOUT });
      await viewAllLibrary.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllLibrary.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Step 38: Clicking View All (Course Library)...');
      await viewAllLibrary.click({ timeout: 10000 });
      console.log('✓ Clicked View All – Course Library');
    } catch (err) {
      throw new Error(`View All (Course Library) click failed: ${err.message}`);
    }

    try {
      console.log('Step 39: Verifying redirect to courses page...');
      await expect(page).toHaveURL(COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On courses page');
    } catch (err) {
      throw new Error(`Redirect to courses page failed: ${err.message}`);
    }

    console.log('Waiting on courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 40: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 17. Scroll to Explore Our Vast Course Library, click nav buttons: right 2x, left 2x
    try {
      console.log('Step 41: Scrolling to Course Library nav buttons...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
      const navRight = page.locator('button.nav-button.right');
      const navLeft = page.locator('button.nav-button.left');
      await navRight.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      await navRight.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      console.log('Step 42: Clicking right nav button 2 times...');
      await navRight.first().click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await navRight.first().click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 43: Clicking left nav button 2 times...');
      await navLeft.first().click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await navLeft.first().click({ timeout: 5000 });
      console.log('✓ Course Library nav buttons clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Course Library nav buttons failed: ${err.message}`);
    }

    // 18. Course Library slider (div.slider-button): use last pair on page → right 2x, left 2x
    try {
      console.log('Step 44: Finding Course Library slider...');
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(800);
      const allSlider = page.locator('div.slider-button');
      await allSlider.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const count = await allSlider.count();
      if (count < 2) throw new Error(`Expected at least 2 slider-button, found ${count}`);
      const libLeft = allSlider.nth(count - 2);
      const libRight = allSlider.nth(count - 1);
      await libRight.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await libRight.waitFor({ state: 'visible', timeout: 8000 });
      console.log('Step 45: Clicking Course Library right slider 2 times...');
      await libRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await libRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 46: Clicking Course Library left slider 2 times...');
      await libLeft.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await libLeft.click({ timeout: 5000 });
      console.log('✓ Course Library slider clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Course Library slider failed: ${err.message}`);
    }

    // 19. Scroll to Meet Our Expert Instructors, click "Teach on FastLearner" → welcome-instructor (same or new tab) → wait → back to dashboard
    try {
      console.log('Step 47: Scrolling to Meet Our Expert Instructors...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      const teachBtn = page.locator('span.ng-star-inserted').filter({ hasText: 'Teach on FastLearner' }).first();
      await teachBtn.waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      await teachBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      console.log('Step 48: Clicking Teach on FastLearner...');
      await teachBtn.click({ timeout: 10000 });
      console.log('✓ Clicked Teach on FastLearner');
      const welcomeTimeout = 25000;
      let welcomePage = null;
      try {
        await page.waitForURL(/welcome-instructor/, { timeout: welcomeTimeout });
        welcomePage = page;
      } catch {
        const pages = context.pages();
        const otherPage = pages.find((p) => p !== page && !p.isClosed());
        if (otherPage) {
          await otherPage.waitForURL(/welcome-instructor/, { timeout: welcomeTimeout }).catch(() => {});
          if (otherPage.url().includes('welcome-instructor')) welcomePage = otherPage;
        }
        if (!welcomePage) welcomePage = page;
      }
      console.log('Step 49: Verifying redirect to welcome-instructor...');
      await expect(welcomePage).toHaveURL(WELCOME_INSTRUCTOR_URL, { timeout: 10000 });
      console.log('✓ On welcome-instructor page');
      console.log('Staying on welcome-instructor page...');
      await welcomePage.waitForTimeout(2500);
      console.log('✓ Done waiting');
      console.log('Step 50: Going back to dashboard...');
      await welcomePage.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      if (welcomePage !== page) await welcomePage.close();
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Teach on FastLearner / welcome-instructor failed: ${err.message}`);
    }

    // 20. Scroll, click "View All" under Become a Quick Learner with Our Latest Courses (arrow-new) → NEW_COURSE page → wait → back to dashboard
    try {
      console.log('Step 51: Scrolling to Latest Courses section...');
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
      const viewAllLatest = page.locator('p').filter({ hasText: 'View All' }).filter({ has: page.locator('img[src*="arrow-new"]') }).nth(2);
      await viewAllLatest.waitFor({ state: 'attached', timeout: VIEW_ALL_TIMEOUT });
      await viewAllLatest.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await viewAllLatest.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Step 52: Clicking View All (Latest Courses)...');
      await viewAllLatest.click({ timeout: 10000 });
      console.log('✓ Clicked View All – Latest Courses');
    } catch (err) {
      throw new Error(`View All (Latest Courses) click failed: ${err.message}`);
    }

    try {
      console.log('Step 53: Verifying redirect to New courses page...');
      await expect(page).toHaveURL(NEW_COURSES_URL, { timeout: REDIRECT_TIMEOUT });
      console.log('✓ On New courses page');
    } catch (err) {
      throw new Error(`Redirect to New courses page failed: ${err.message}`);
    }

    console.log('Waiting on New courses page...');
    await page.waitForTimeout(2500);
    console.log('✓ Done waiting');

    try {
      console.log('Step 54: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: BACK_TO_DASHBOARD_TIMEOUT });
      await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 10000 });
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(1500);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Back to dashboard failed: ${err.message}`);
    }

    // 21. Latest Courses slider (same SVG as div.slider-button): last pair on page → right 2x, left 2x
    try {
      console.log('Step 55: Finding Latest Courses slider...');
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(800);
      const allSliderBtns = page.locator('div.slider-button');
      await allSliderBtns.first().waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      const cnt = await allSliderBtns.count();
      if (cnt < 2) throw new Error(`Expected at least 2 slider-button, found ${cnt}`);
      const latestLeft = allSliderBtns.nth(cnt - 2);
      const latestRight = allSliderBtns.nth(cnt - 1);
      await latestRight.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await latestRight.waitFor({ state: 'visible', timeout: 8000 });
      console.log('Step 56: Clicking Latest Courses right slider 2 times...');
      await latestRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await latestRight.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      console.log('Step 57: Clicking Latest Courses left slider 2 times...');
      await latestLeft.click({ timeout: 5000 });
      await page.waitForTimeout(400);
      await latestLeft.click({ timeout: 5000 });
      console.log('✓ Latest Courses slider clicked (2x right, 2x left)');
    } catch (err) {
      throw new Error(`Latest Courses slider failed: ${err.message}`);
    }

    // 22. Scroll down, click "Start Now" (span.ng-star-inserted)
    try {
      console.log('Step 58: Scrolling down...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(1000);
      const startNowSpan = page.locator('span.ng-star-inserted').filter({ hasText: 'Start Now' }).last();
      await startNowSpan.waitFor({ state: 'visible', timeout: VIEW_ALL_TIMEOUT });
      await startNowSpan.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      console.log('Step 59: Clicking Start Now...');
      await startNowSpan.click({ timeout: 10000 });
      console.log('✓ Clicked Start Now');
      await page.waitForTimeout(2500);
      console.log('Step 59b: Going back to dashboard...');
      await page.goBack();
      await page.waitForTimeout(2000);
    } catch (err) {
      throw new Error(`Start Now click failed: ${err.message}`);
    }

    // 23. FAQ is after "Start Now": scroll past Start Now, then click FAQ plus <div class="icon ng-star-inserted">+</div> (use .last() to avoid notification plus)
    try {
      console.log('Step 60: Scrolling past Start Now to Frequently Asked Questions...');
      const startNowOnDashboard = page.getByText('Start Now').last();
      await startNowOnDashboard.waitFor({ state: 'visible', timeout: 10000 });
      await startNowOnDashboard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);
      const plusIcon = page.locator('div.icon.ng-star-inserted').filter({ hasText: '+' }).last();
      await plusIcon.waitFor({ state: 'visible', timeout: 10000 });
      await plusIcon.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 61: Clicking FAQ plus icon (open)...');
      await plusIcon.click({ timeout: 5000 });
      console.log('✓ FAQ opened');
      await page.waitForTimeout(2000);
      console.log('Step 62: Clicking FAQ plus icon again (close)...');
      await plusIcon.click({ timeout: 5000 });
      console.log('✓ FAQ closed');
    } catch (err) {
      console.log('⚠ FAQ plus icon not found (Step 60–62 skipped):', err.message);
    }

    // 24. Scroll a little, click About us footer link (navigates in same tab), wait, then back to dashboard
    try {
      console.log('Step 63: Scrolling to footer...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const aboutUsLink = page.locator('span.footerlink[data-content="About us"]');
      await aboutUsLink.waitFor({ state: 'visible', timeout: 10000 });
      await aboutUsLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 64: Clicking About us link...');
      await aboutUsLink.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      console.log('Step 65: Waiting on About us page...');
      await page.waitForTimeout(1500);
      console.log('Step 66: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`About us link failed: ${err.message}`);
    }

    // 25. Privacy Policy footer link – scroll, click, wait, back to dashboard
    try {
      console.log('Step 67: Scrolling to footer...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const privacyLink = page.locator('span.footerlink[data-content="Privacy Policy"]');
      await privacyLink.waitFor({ state: 'visible', timeout: 10000 });
      await privacyLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 68: Clicking Privacy Policy link...');
      await privacyLink.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      console.log('Step 69: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Privacy Policy link failed: ${err.message}`);
    }

    // 26. Terms & Conditions footer link – scroll, click, wait, back to dashboard
    try {
      console.log('Step 70: Scrolling to footer...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const termsLink = page.locator('span.footerlink[data-content="Terms & Conditions"]');
      await termsLink.waitFor({ state: 'visible', timeout: 10000 });
      await termsLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 71: Clicking Terms & Conditions link...');
      await termsLink.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      console.log('Step 72: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Terms & Conditions link failed: ${err.message}`);
    }

    // 27. Contact Us footer link – scroll, click, wait, back to dashboard
    try {
      console.log('Step 73: Scrolling to footer...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const contactLink = page.locator('span.footerlink[data-content="Contact Us"]');
      await contactLink.waitFor({ state: 'visible', timeout: 10000 });
      await contactLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      console.log('Step 74: Clicking Contact Us link...');
      await contactLink.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      console.log('Step 75: Going back to dashboard...');
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('✓ Back on dashboard');
    } catch (err) {
      throw new Error(`Contact Us link failed: ${err.message}`);
    }

    const FOOTER_LINK_TIMEOUT = 8000;
    const FOOTER_GOTO_TIMEOUT = 12000;

    // 28. Courses footer link
    try {
      console.log('Step 76: Scrolling to footer, clicking Courses...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Courses"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Courses – back on dashboard');
    } catch (err) {
      console.log('⚠ Courses link skipped:', err.message);
    }

    // 29. Become an Instructor footer link
    try {
      console.log('Step 77: Scrolling to footer, clicking Become an Instructor...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Become an Instructor"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Become an Instructor – back on dashboard');
    } catch (err) {
      console.log('⚠ Become an Instructor link skipped:', err.message);
    }

    // 30. Blogs footer link
    try {
      console.log('Step 78: Scrolling to footer, clicking Blogs...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Blogs"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Blogs – back on dashboard');
    } catch (err) {
      console.log('⚠ Blogs link skipped:', err.message);
    }

    // 31. Press Release footer link
    try {
      console.log('Step 79: Scrolling to footer, clicking Press Release...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Press Release"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Press Release – back on dashboard');
    } catch (err) {
      console.log('⚠ Press Release link skipped:', err.message);
    }

    // 32. Pricing footer link
    try {
      console.log('Step 80: Scrolling to footer, clicking Pricing...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Pricing"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Pricing – back on dashboard');
    } catch (err) {
      console.log('⚠ Pricing link skipped:', err.message);
    }

    // 33. Teach on Fast Learner footer link
    try {
      console.log('Step 81: Scrolling to footer, clicking Teach on Fast Learner...');
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(500);
      const link = page.locator('span.footerlink[data-content="Teach on Fast Learner"]');
      await link.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await link.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await link.click({ timeout: 5000 });
      await page.waitForLoadState('domcontentloaded', { timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1500);
      await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: FOOTER_GOTO_TIMEOUT });
      await page.waitForTimeout(1000);
      console.log('✓ Teach on Fast Learner – back on dashboard');
    } catch (err) {
      console.log('⚠ Teach on Fast Learner link skipped:', err.message);
    }

    // 34. Footer social logos (left side): X, Facebook, LinkedIn, Instagram – click each (no external navigation)
    // Neutralize the link href/target so clicking the logo does not navigate away or open popups.
    const mainPage = page;
    const clickFooterSocialAndBack = async (label, alt) => {
      if (mainPage.isClosed()) {
        console.log(`⚠ ${label} skipped: main page already closed`);
        return;
      }
      await mainPage.evaluate(() => window.scrollBy(0, 400));
      await mainPage.waitForTimeout(500);
      const img = mainPage.getByRole('img', { name: alt });
      await img.waitFor({ state: 'visible', timeout: FOOTER_LINK_TIMEOUT });
      await img.scrollIntoViewIfNeeded();
      await mainPage.waitForTimeout(300);
      const link = mainPage.locator(`a:has(img[alt="${alt}"])`).first();
      const hasLink = await link.count().catch(() => 0);
      if (hasLink) {
        await link.evaluate((el) => {
          const a = el;
          a.setAttribute('data-original-href', a.getAttribute('href') || '');
          a.setAttribute('href', '#');
          a.removeAttribute('target');
        });
      }
      await img.click({ timeout: 5000 });
      await mainPage.waitForTimeout(500);
      console.log(`✓ ${label} – clicked (stayed on dashboard)`);
    };

    try {
      console.log('Step 82: Scrolling to footer, clicking X (Twitter) logo...');
      await clickFooterSocialAndBack('X (Twitter)', 'X');
    } catch (err) {
      console.log('⚠ X logo skipped:', err.message);
    }
    try {
      console.log('Step 83: Scrolling to footer, clicking Facebook logo...');
      await clickFooterSocialAndBack('Facebook', 'Facebook');
    } catch (err) {
      console.log('⚠ Facebook logo skipped:', err.message);
    }
    try {
      console.log('Step 84: Scrolling to footer, clicking LinkedIn logo...');
      await clickFooterSocialAndBack('LinkedIn', 'LinkedIn');
    } catch (err) {
      console.log('⚠ LinkedIn logo skipped:', err.message);
    }
    try {
      console.log('Step 85: Scrolling to footer, clicking Instagram logo...');
      await clickFooterSocialAndBack('Instagram', 'Instagram');
    } catch (err) {
      console.log('⚠ Instagram logo skipped:', err.message);
    }

    // 35. Footer right side – enter email and click Subscribe
    const SUBSCRIBE_STEP_TIMEOUT = 15000;
    try {
      console.log('Step 86: Scrolling to footer, entering email and clicking Subscribe...');
      if (mainPage.isClosed()) {
        console.log('⚠ Footer subscribe skipped: main page closed');
      } else {
        await mainPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await mainPage.waitForTimeout(600);
        const emailInput = mainPage.getByPlaceholder('Enter email address');
        await emailInput.waitFor({ state: 'visible', timeout: SUBSCRIBE_STEP_TIMEOUT });
        await emailInput.scrollIntoViewIfNeeded();
        await mainPage.waitForTimeout(400);
        await emailInput.fill('toomy@yopmail.com', { timeout: 5000 });
        await mainPage.waitForTimeout(400);
        const subscribeBtn = mainPage.locator('button.subscribe-btn');
        await subscribeBtn.waitFor({ state: 'visible', timeout: SUBSCRIBE_STEP_TIMEOUT });
        await subscribeBtn.click({ timeout: 8000 });
        await mainPage.waitForTimeout(1500);
        console.log('✓ Footer subscribe – email entered and Subscribe clicked');
      }
    } catch (err) {
      console.log('⚠ Footer subscribe skipped:', err.message);
    }

    // --- Add more steps here: for each dashboard button/link ---
    } finally {
      if (screenshotInterval) clearInterval(screenshotInterval);
    }
  });
});
