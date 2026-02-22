const { test, expect } = require('@playwright/test');
const path = require('path');
const CreateTestPage = require('../../pages/CreateTestPage.copy');
const { parseUsmleQuestions } = require('../../utils/usmleParser');

test.describe('Create Test Flow (Block 3)', () => {
  test('Login, load test page 269, and upload Block 3 questions', async ({ page }) => {
    test.setTimeout(30 * 60 * 1000);

    const createTestPage = new CreateTestPage(page);
    const email = 'fastlearnerai@vinncorp.com';
    const password = 'Quiz!123';

    // Login
    await page.goto('https://fastlearner.ai/auth/sign-in', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(email);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(password);
    await Promise.all([
      page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 }),
      passwordInput.press('Enter')
    ]);
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 });

    // Navigate to test page
    await page.goto('https://fastlearner.ai/instructor/test?id=269', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/instructor\/test\?id=269/i, { timeout: 15000 });

    // Go to Step 2
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).first();
    await continueBtn.waitFor({ state: 'visible', timeout: 20000 });
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();

    // Add section
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const addSection = page.locator('div.test-add-section-btn').first();
    await addSection.waitFor({ state: 'visible', timeout: 30000 });
    await addSection.scrollIntoViewIfNeeded();
    await addSection.click();

    // Fill section metadata
    const sectionName = page.getByPlaceholder('Section name *').last();
    await sectionName.waitFor({ state: 'visible', timeout: 15000 });
    await sectionName.fill('Block 3');
    const topicName = page.getByPlaceholder('Topic name *').last();
    await topicName.waitFor({ state: 'visible', timeout: 15000 });
    await topicName.fill('Block 3 Cardiology');
    const typeDropdown = topicName.locator('xpath=following::*[contains(@class,"ant-select-selector")][1]');
    await typeDropdown.click();
    await page.locator('.cdk-overlay-pane .ant-select-item-option').getByText(/Basic Quiz/i).first().click();
    const quizDurationInput = page.locator('text=/Quiz duration/i').last().locator('xpath=following::input[@type="number"][1]');
    await quizDurationInput.fill('15');
    const passingInput = page.locator('text=/Passing criteria/i').last().locator('xpath=following::input[@type="number"][1]');
    await passingInput.fill('20');

    // Parse Block 3 questions
    const workspaceRoot = path.resolve(__dirname, '../..');
    const block3Path = path.join(workspaceRoot, 'Block 3.txt');
    const quizQuestions = parseUsmleQuestions(block3Path);
    if (!quizQuestions.length) {
      throw new Error(`No quiz questions parsed from ${block3Path}. Verify file format.`);
    }

    // Add questions
    for (let idx = 0; idx < quizQuestions.length; idx++) {
      const { questionText, options, correctOptionIndex, explanation } = quizQuestions[idx];
      console.log(`Adding Block 3 question ${idx + 1}/${quizQuestions.length}`);

      if (idx === 0) {
        const firstQuestionInput = page.getByPlaceholder('Let\'s ask a question').last();
        await firstQuestionInput.fill(questionText);
        await fillOptionsForSection(page, firstQuestionInput, options, correctOptionIndex, explanation);
      } else {
        const addQuestionBtn = page.getByText('Add a question', { exact: false }).last();
        await addQuestionBtn.waitFor({ state: 'visible', timeout: 15000 });
        await addQuestionBtn.click();
        const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
        await questionInput.fill(questionText);
        await fillOptionsForSection(page, questionInput, options, correctOptionIndex, explanation);
      }
    }

    // Continue to Step 3 & Publish
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1000);
    await createTestPage.clickContinueStep2();
    await createTestPage.verifyStep3Loaded();
    await createTestPage.clickPublish();
    await page.getByText(/course has been published/i).waitFor({ state: 'visible', timeout: 25000 });
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

  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const letter = answerLetters[correctIndex];
  const answerContainer = section.getByText('Correct answer', { exact: false }).locator('xpath=following::*[1]');
  await answerContainer.getByText(letter, { exact: true }).click();

  if (explanation) {
    const explanationBox = section.locator('textarea[placeholder*="explanation" i]').first();
    if (await explanationBox.count()) {
      await explanationBox.fill(explanation);
    }
  }
}
