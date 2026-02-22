/**
 * Custom runner for Create Course - sends screenshots to test panel
 */
const http = require('http');
const { chromium } = require('playwright');
const LoginPage = require('../pages/LoginPage');
const CreateCors = require('../pages/CreateCors');

const SCREENSHOT_API = process.env.SCREENSHOT_API_URL || 'http://127.0.0.1:3001';

function postScreenshot(base64) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ screenshot: base64 });
    const url = new URL(SCREENSHOT_API + '/api/screenshot');
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

async function sendScreenshot(page) {
  try {
    if (page && !page.isClosed()) {
      const buf = await page.screenshot({ type: 'jpeg', quality: 70 });
      await postScreenshot(buf.toString('base64'));
    }
  } catch (e) {}
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  let interval = setInterval(() => sendScreenshot(page), 1200);

  const loginPage = new LoginPage(page);
  const createCourse = new CreateCors(page);

  try {
    await sendScreenshot(page);

    console.log('Step 1: Navigating to login page...');
    await loginPage.navigate();
    await sendScreenshot(page);

    console.log('Step 2: Logging in...');
    await loginPage.login();
    await sendScreenshot(page);

    console.log('Step 3: Waiting for redirect to dashboard...');
    await page.waitForURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 });
    await sendScreenshot(page);

    console.log('Step 4: Starting navigation to instructor course creation page...');
    await createCourse.navigateToCourseCreation();
    await sendScreenshot(page);

    console.log('Step 5: Filling course details...');
    await createCourse.fillCourseDetails();
    await sendScreenshot(page);

    console.log('Step 6: Clicking Continue to go to Sections page...');
    await createCourse.clickContinueToSections();
    await sendScreenshot(page);

    console.log('Step 7: Adding sections, topics, and video content...');
    await createCourse.addSectionsAndTopics();
    await sendScreenshot(page);

    console.log('Step 8: Saving course and verifying creation...');
    await createCourse.saveCourseAndVerify();
    await sendScreenshot(page);

    console.log('\n✅ Course created flow completed successfully');
  } catch (err) {
    console.error('Test failed:', err.message);
    process.exit(1);
  } finally {
    clearInterval(interval);
    await browser.close();
  }
  process.exit(0);
}

run();
