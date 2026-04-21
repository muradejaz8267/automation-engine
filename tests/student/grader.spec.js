// grader.spec.js - Login, navigate to AI Grader, fill form, upload rubric and student copies, click Grade Now
const fs = require('fs');
const { test, expect } = require('../fixtures/screenshotFixture');

const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

const RUBRIC_PATH = 'C:\\Users\\vinncorp\\AppData\\Roaming\\Cursor\\User\\workspaceStorage\\e3e5d434f0f20ae764ef5383925633c4\\pdfs\\e8842413-46de-421b-8f38-9ab3ee9d5d1c\\Answer-Sheet.pdf';
const STUDENT_PATHS = [
  'C:\\Users\\vinncorp\\AppData\\Roaming\\Cursor\\User\\workspaceStorage\\e3e5d434f0f20ae764ef5383925633c4\\pdfs\\dc3be42f-3b65-4196-8fcd-61c172fc0bca\\alex.pdf',
  'C:\\Users\\vinncorp\\AppData\\Roaming\\Cursor\\User\\workspaceStorage\\e3e5d434f0f20ae764ef5383925633c4\\pdfs\\7bd8619a-21d5-49c7-a3e5-b81eecf0d612\\anas.pdf',
  'C:\\Users\\vinncorp\\AppData\\Roaming\\Cursor\\User\\workspaceStorage\\e3e5d434f0f20ae764ef5383925633c4\\pdfs\\f6b51e61-b359-46e2-a149-8ed28b11fb19\\emailius.pdf'
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

test.describe('Grader', () => {
  test('login, click AI Grader, fill form, upload rubric and student copies, click Grade Now', async ({ page }) => {
    test.setTimeout(120000);

    // Login
    await page.goto(SIGN_IN_URL);
    await page.waitForLoadState('domcontentloaded');
    await delay(1500);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('cooper@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill('Qwerty@123');
    await passwordInput.press('Enter');

    await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
    await delay(2000);

    // Click AI Grader from Navbar
    const aiGraderLink = page
      .getByRole('link', { name: /ai grader/i })
      .or(page.getByRole('button', { name: /ai grader/i }))
      .or(page.getByText('AI Grader', { exact: true }))
      .or(page.locator('nav a:has-text("AI Grader")'))
      .first();
    await aiGraderLink.waitFor({ state: 'visible', timeout: 10000 });
    await aiGraderLink.click();

    await page.waitForLoadState('domcontentloaded');
    await delay(3000);

    // 1: Enter Class name
    const classNameInput = page
      .locator('input[placeholder*="class" i], input[name*="class" i]')
      .or(page.getByLabel(/class name/i))
      .first();
    await classNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await classNameInput.fill('Test Class');
    await delay(500);

    // 2: Enter Assessment name
    const assessmentInput = page
      .locator('input[placeholder*="assessment" i], input[name*="assessment" i]')
      .or(page.getByLabel(/assessment name/i))
      .first();
    await assessmentInput.waitFor({ state: 'visible', timeout: 10000 });
    await assessmentInput.fill('Test Assessment');
    await delay(500);

    // 3: Enter evaluation Criteria
    const criteriaInput = page
      .locator('textarea[placeholder*="evaluation" i], textarea[placeholder*="criteria" i], input[placeholder*="evaluation" i]')
      .or(page.getByLabel(/evaluation criteria/i))
      .first();
    await criteriaInput.waitFor({ state: 'visible', timeout: 10000 });
    await criteriaInput.fill('Content accuracy, clarity, and completeness.');
    await delay(500);

    // 4: Upload rubric
    if (!fs.existsSync(RUBRIC_PATH)) {
      throw new Error(`Rubric file not found: ${RUBRIC_PATH}`);
    }
    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.first().waitFor({ state: 'attached', timeout: 20000 });
    await fileInputs.first().scrollIntoViewIfNeeded();
    await delay(1000);
    await fileInputs.first().setInputFiles(RUBRIC_PATH, { timeout: 30000 });
    await delay(8000);

    // 5: Upload student copies
    const existingPaths = STUDENT_PATHS.filter((p) => fs.existsSync(p));
    if (existingPaths.length === 0) {
      throw new Error(`No student PDFs found.`);
    }
    const studentInput = (await fileInputs.count()) > 1 ? fileInputs.nth(1) : fileInputs.first();
    await studentInput.scrollIntoViewIfNeeded();
    await delay(1000);
    await studentInput.setInputFiles(existingPaths, { timeout: 30000 });
    await delay(8000);

    // 6: Click Grade Now button
    const gradeNowBtn = page
      .getByRole('button', { name: /grade now/i })
      .or(page.locator('button:has-text("Grade Now")'))
      .first();
    await gradeNowBtn.waitFor({ state: 'visible', timeout: 10000 });
    await gradeNowBtn.scrollIntoViewIfNeeded();
    await delay(500);
    await gradeNowBtn.click();

    await delay(5000);
  });
});
