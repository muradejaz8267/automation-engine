const { test, expect } = require('@playwright/test');
const path = require('path');
const CreateTestPage = require('../../pages/CreateTestPage.copy');
const { parseUsmleQuestions } = require('../../utils/usmleParser');

test.describe('Create Test Flow (Block 7)', () => {
  test('Login, load test page 269, and upload Block 7 questions', async ({ page }) => {
    test.setTimeout(30 * 60 * 1000);

    const createTestPage = new CreateTestPage(page);
    const loginEmail = 'fastlearnerai@vinncorp.com';
    const loginPassword = 'Quiz!123';

    // Step 1-3: Login
    await page.goto('https://fastlearner.ai/auth/sign-in', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').first().fill(loginEmail);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(loginPassword);
    await Promise.all([
      page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 }),
      passwordInput.press('Enter')
    ]);
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 });

    // Step 4: Navigate to target test
    await page.goto('https://fastlearner.ai/instructor/test?id=269', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/instructor\/test\?id=269/i, { timeout: 15000 });

    // Step 5: Continue to Step 2
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).first();
    await continueBtn.waitFor({ state: 'visible', timeout: 20000 });
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();

    // Step 6: Wait for Step 2 to fully load, then add new section
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
      console.log('⚠ Network idle timeout, continuing with domcontentloaded...');
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    // Scroll to bottom so Add new section button (often at end of list) is in view
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    let addSectionBtn = page.locator('//div[@class="test-add-section-btn display-flex justify-content-center align-items-center cursor-pointer w-100 background-white"]');
    let found = await addSectionBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!found) {
      addSectionBtn = page.locator('div.test-add-section-btn').first();
      found = await addSectionBtn.isVisible({ timeout: 5000 }).catch(() => false);
    }
    if (!found) {
      addSectionBtn = page.getByText('Add new section', { exact: false }).first();
      found = await addSectionBtn.isVisible({ timeout: 5000 }).catch(() => false);
    }
    if (!found) {
      addSectionBtn = page.locator('[class*="test-add-section"]').first();
    }

    try {
      await addSectionBtn.waitFor({ state: 'visible', timeout: 45000 });
      await addSectionBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await addSectionBtn.click({ force: true });
    } catch (err) {
      throw new Error(
        `Add new section button not found after Continue. Ensure test 269 reached Step 2. Original: ${err.message}`
      );
    }

    // Step 7: Wait for section form and populate details
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const sectionNameInput = page.getByPlaceholder('Section name *').last();
    await sectionNameInput.waitFor({ state: 'visible', timeout: 20000 });
    await sectionNameInput.scrollIntoViewIfNeeded();
    await sectionNameInput.fill('Block 7');

    const topicInput = page.getByPlaceholder('Topic name *').last();
    await topicInput.waitFor({ state: 'visible', timeout: 15000 });
    await topicInput.scrollIntoViewIfNeeded();
    await topicInput.fill('Block 7 Mixed Review');

    const typeDropdown = topicInput.locator('xpath=following::*[contains(@class,"ant-select-selector")][1]');
    await typeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await typeDropdown.click();
    await page.waitForTimeout(500);
    await page.locator('.cdk-overlay-pane .ant-select-item-option').getByText(/Basic Quiz/i).first().waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.cdk-overlay-pane .ant-select-item-option').getByText(/Basic Quiz/i).first().click();

    const quizDurationInput = page.locator('text=/Quiz duration/i').last().locator('xpath=following::input[@type="number"][1]');
    await quizDurationInput.fill('15');
    const passingInput = page.locator('text=/Passing criteria/i').last().locator('xpath=following::input[@type="number"][1]');
    await passingInput.fill('20');

    // Step 8: Parse Block 7 questions
    const workspaceRoot = path.resolve(__dirname, '../..');
    const block7Path = path.join(workspaceRoot, 'Block 7.txt');
    const quizQuestions = parseUsmleQuestions(block7Path);
    if (!quizQuestions.length) {
      throw new Error(`No quiz questions parsed from ${block7Path}. Please check the file format.`);
    }

    // Step 9: Add each question
    for (let idx = 0; idx < quizQuestions.length; idx++) {
      const { questionText, options, correctOptionIndex, explanation } = quizQuestions[idx];
      console.log(`Adding Block 7 question ${idx + 1}/${quizQuestions.length}`);

      try {
        if (idx === 0) {
          const firstQuestionInput = page.getByPlaceholder('Let\'s ask a question').last();
          await firstQuestionInput.waitFor({ state: 'visible', timeout: 15000 });
          await firstQuestionInput.fill(questionText);
          await fillOptionsForSection(page, firstQuestionInput, options, correctOptionIndex, explanation);
        } else {
          const addQuestionBtn = page.getByText('Add a question', { exact: false }).last();
          await addQuestionBtn.waitFor({ state: 'visible', timeout: 15000 });
          await addQuestionBtn.scrollIntoViewIfNeeded();
          await addQuestionBtn.click();
          await page.waitForTimeout(300);
          const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
          await questionInput.waitFor({ state: 'visible', timeout: 10000 });
          await questionInput.fill(questionText);
          await fillOptionsForSection(page, questionInput, options, correctOptionIndex, explanation);
        }
      } catch (err) {
        throw new Error(`Failed adding question ${idx + 1}/${quizQuestions.length}: ${err.message}`);
      }
    }

    console.log('✓ All Block 7 questions added');

    // Step 10: Continue to preview (skip Save)
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1000);
    try {
      await createTestPage.clickContinueStep2();
      await createTestPage.verifyStep3Loaded();
    } catch (err) {
      throw new Error(`Continue to Step 3 failed: ${err.message}`);
    }

    // Step 11: Publish and confirm
    try {
      await createTestPage.clickPublish();
      await page.getByText(/course has been published/i).waitFor({ state: 'visible', timeout: 25000 });
    } catch (err) {
      throw new Error(`Publish failed: ${err.message}`);
    }
    console.log('✓ Block 7 publishing confirmed');
  });
});

async function fillOptionsForSection(page, questionInput, options, correctIndex, explanation) {
  const section = questionInput.locator('xpath=ancestor::*[contains(@class,"question")][1]');
  const optionInputs = section.locator('input[placeholder*="Option" i]');

  for (let i = 0; i < options.length; i++) {
    let input;
    if (i < await optionInputs.count()) {
      input = optionInputs.nth(i);
    } else {
      const addOptionBtn = section.getByText('Add an option', { exact: false }).first();
      await addOptionBtn.click();
      input = section.locator('input[placeholder*="Option" i]').last();
    }
    await input.fill(options[i]);
  }

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const answerContainer = section.getByText('Correct answer', { exact: false }).locator('xpath=following::*[1]');
  await answerContainer.getByText(letters[correctIndex], { exact: true }).click();

  if (explanation) {
    const explanationBox = section.locator('textarea[placeholder*="explanation" i]').first();
    if (await explanationBox.count()) {
      await explanationBox.fill(explanation);
    }
  }
}
