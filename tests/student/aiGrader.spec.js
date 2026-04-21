// aiGrader.spec.js - Login and click AI Grader from navbar
const fs = require('fs');
const { test, expect } = require('../fixtures/screenshotFixture');

const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

const STUDENT_PATH = 'C:\\Users\\vinncorp\\AppData\\Roaming\\Cursor\\User\\workspaceStorage\\e3e5d434f0f20ae764ef5383925633c4\\pdfs\\2906a583-0713-4040-b587-8ed2d9f669dc\\fatima.pdf';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

test.describe('AI Grader', () => {
  test('login and click AI Grader from navbar', async ({ page }) => {
    test.setTimeout(300000);

    // Step 1: Login
    console.log('Step 1: Navigating to sign-in page...');
    await page.goto(SIGN_IN_URL);
    await page.waitForLoadState('domcontentloaded');
    await delay(1500);

    console.log('Step 2: Entering email...');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('aigrader@yopmail.com');

    console.log('Step 3: Entering password...');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill('Qwerty@123');
    await passwordInput.press('Enter');

    console.log('Step 4: Waiting for dashboard...');
    await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
    await delay(2000);

    // Step 5: Click AI Grader from Navbar
    const aiGraderLink = page
      .getByRole('link', { name: /ai grader/i })
      .or(page.getByRole('button', { name: /ai grader/i }))
      .or(page.getByText('AI Grader', { exact: true }))
      .or(page.locator('nav a:has-text("AI Grader")'))
      .first();
    console.log('Step 5: Clicking AI Grader from navbar...');
    await aiGraderLink.waitFor({ state: 'visible', timeout: 10000 });
    await aiGraderLink.click();

    await page.waitForLoadState('domcontentloaded');
    await delay(3000);

    console.log('Step 6: Verifying redirect to AI Grader page...');
    await expect(page).toHaveURL(/ai-grader|grader/i, { timeout: 10000 });

    // Step 7: Enter Class name
    const classNameInput = page
      .locator('input[placeholder*="class" i], input[name*="class" i]')
      .or(page.getByLabel(/class name/i))
      .first();
    await classNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await classNameInput.fill('Test Class');
    await delay(500);

    // Enter Assessment name
    const assessmentInput = page
      .locator('input[placeholder*="assessment" i], input[name*="assessment" i]')
      .or(page.getByLabel(/assessment name/i))
      .first();
    console.log('Step 8: Entering Assessment name...');
    await assessmentInput.waitFor({ state: 'visible', timeout: 10000 });
    await assessmentInput.fill('Test Assessment');
    await delay(500);

    // Step 9: Enter evaluation Criteria
    const criteriaInput = page
      .locator('textarea[placeholder*="evaluation" i], textarea[placeholder*="criteria" i], input[placeholder*="evaluation" i]')
      .or(page.getByLabel(/evaluation criteria/i))
      .first();
    await criteriaInput.waitFor({ state: 'visible', timeout: 10000 });
    await criteriaInput.fill('Content accuracy, clarity, and completeness.');
    await delay(500);

    // Upload single student PDF - use setInputFiles directly (no click on upload button - avoids native file dialog)
    console.log('Step 10: Uploading student PDF...');
    if (!fs.existsSync(STUDENT_PATH)) {
      throw new Error(`Student PDF not found: ${STUDENT_PATH}`);
    }
    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.first().waitFor({ state: 'attached', timeout: 20000 });
    const inputCount = await fileInputs.count();
    const studentInput = inputCount > 1 ? fileInputs.nth(1) : fileInputs.first();
    await delay(1000);
    await studentInput.setInputFiles(STUDENT_PATH, { timeout: 30000 });
    await delay(5000);
    console.log('Step 10: ✓ Student PDF uploaded');

    // Step 11: Click Grade Now button
    const gradeNowBtn = page.locator('xpath=//span[text()=" Grade Now "]')
      .or(page.getByRole('button', { name: /grade now/i }))
      .or(page.locator('button:has-text("Grade Now")'))
      .first();
    console.log('Step 11: Clicking Grade Now button...');
    await gradeNowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await gradeNowBtn.click();
    await delay(5000);
    console.log('Step 11: ✓ Grade Now clicked');

    // Step 12: Click Add Email
    console.log('Step 12: Clicking Add Email...');
    const addEmailLink = page.locator("xpath=//a[text() = ' Add Email ']");
    await addEmailLink.waitFor({ state: 'visible', timeout: 15000 });
    await addEmailLink.click();
    await delay(1000);
    await page.keyboard.press('Tab');
    await delay(500);
    await page.keyboard.type('muradejaz@vinncorp.com');
    await delay(500);
    console.log('Step 12: ✓ Add Email clicked and email entered');

    // Step 13: Wait until Graded is visible, then click
    console.log('Step 13: Waiting for Graded to become visible...');
    const gradedBtn = page.locator("xpath=//span[text() = 'Graded']");
    await gradedBtn.waitFor({ state: 'visible', timeout: 60000 });
    console.log('Step 13: Graded is visible, clicking...');
    await gradedBtn.click();
    await delay(2000);
    console.log('Step 13: ✓ Graded clicked');

    // Step 14: Click Approve, then Tab twice, then Enter
    console.log('Step 14: Clicking Approve...');
    const approveBtn = page.locator("xpath=//span[text() = ' Approve ']");
    await approveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await approveBtn.click();
    await delay(1000);
    await page.keyboard.press('Tab');
    await delay(300);
    await page.keyboard.press('Tab');
    await delay(300);
    await page.keyboard.press('Enter');
    await delay(2000);
    console.log('Step 14: ✓ Approve clicked, tabbed twice and Enter pressed');

    // Step 15: Click edit icon
    console.log('Step 15: Clicking edit icon...');
    const editIcon = page.locator("xpath=//i[@class = 'anticon ml-2 text-blue-500 cursor-pointer anticon-edit']");
    await editIcon.waitFor({ state: 'visible', timeout: 15000 });
    await editIcon.click();
    await delay(2000);
    console.log('Step 15: ✓ Edit icon clicked');

    // Step 16: Click Send button
    console.log('Step 16: Clicking Send button...');
    const sendBtn = page.locator("xpath=//button[text() = ' Send ']");
    await sendBtn.waitFor({ state: 'visible', timeout: 15000 });
    await sendBtn.click();
    await delay(2000);
    console.log('Step 16: ✓ Send button clicked');

    console.log('✓ All steps completed. Browser kept open.');
    // Keep browser open - press Resume in Playwright inspector to close
    await page.pause();
  });
});
