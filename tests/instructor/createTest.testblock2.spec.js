const { test, expect } = require('@playwright/test');
const path = require('path');
const CreateTestPage = require('../../pages/CreateTestPage.copy');
const { parseUsmleQuestions } = require('../../utils/usmleParser');

test.describe('Create Test Flow (Block 2 mirror of Section 3)', () => {
  test('Login, load test page 269, and upload Block 2 questions', async ({ page }) => {
    test.setTimeout(30 * 60 * 1000); // 30 minutes

    const createTestPage = new CreateTestPage(page);
    const loginEmail = 'fastlearnerai@vinncorp.com';
    const loginPassword = 'Quiz!123';

    // Step 1-3: Login
    console.log('Step 1: Navigating to login page…');
    await page.goto('https://fastlearner.ai/auth/sign-in', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    console.log('Step 2: Logging in…');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(loginEmail);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(loginPassword);

    await Promise.all([
      page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 }),
      passwordInput.press('Enter')
    ]);
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard', { timeout: 20000 });
    console.log('✓ Logged in and on dashboard');

    // Step 4: Navigate to requested test ID
    console.log('Step 4: Navigating to test edit page (id=269)…');
    await page.goto('https://fastlearner.ai/instructor/test?id=269', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/instructor\/test\?id=269/i, { timeout: 15000 });
    console.log('✓ On test edit page 269');

    // Step 5: Continue past Step 1
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true }).first();
    await continueBtn.waitFor({ state: 'visible', timeout: 20000 });
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    console.log('✓ Step 1 Continue clicked');

    // Step 6: Add new section for Block 2
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const addSection = page.locator('div.test-add-section-btn').first();
    await addSection.waitFor({ state: 'visible', timeout: 30000 });
    await addSection.scrollIntoViewIfNeeded();
    await addSection.click();
    console.log('✓ Added new section');

    // Step 7: Populate section metadata
    const sectionName = page.getByPlaceholder('Section name *').last();
    await sectionName.waitFor({ state: 'visible', timeout: 15000 });
    await sectionName.fill('Block 2');

    const topicName = page.getByPlaceholder('Topic name *').last();
    await topicName.waitFor({ state: 'visible', timeout: 15000 });
    await topicName.fill('Block 2 Emergency Medicine');

    // Type dropdown
    const typeDropdown = topicName.locator('xpath=following::*[contains(@class,"ant-select-selector")][1]');
    await typeDropdown.click();
    await page.locator('.cdk-overlay-pane .ant-select-item-option').getByText(/Basic Quiz/i).first().click();

    // Quiz duration / passing criteria
    const quizDurationLabel = page.locator('text=/Quiz duration/i').last();
    const quizDurationInput = quizDurationLabel.locator('xpath=following::input[@type="number"][1]');
    await quizDurationInput.fill('15');

    const passingLabel = page.locator('text=/Passing criteria/i').last();
    const passingInput = passingLabel.locator('xpath=following::input[@type="number"][1]');
    await passingInput.fill('20');
    console.log('✓ Section metadata set for Block 2');

    // Step 8: Parse questions from Block 2
    const workspaceRoot = path.resolve(__dirname, '../..');
    const block2Path = path.join(workspaceRoot, 'Block 2.txt');
    const quizQuestions = parseUsmleQuestions(block2Path);
    if (!quizQuestions.length) {
      throw new Error(`No quiz questions parsed from ${block2Path}. Verify file format.`);
    }
    console.log(`✓ Parsed ${quizQuestions.length} Block 2 questions`);

    // Step 9: Add questions
    for (let idx = 0; idx < quizQuestions.length; idx++) {
      const { questionText, options, correctOptionIndex, explanation } = quizQuestions[idx];
      console.log(`Adding Block 2 question ${idx + 1}/${quizQuestions.length}`);

      if (idx === 0) {
        // fill initial slot
        const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
        await questionInput.fill(questionText);
        await fillOptionsForSection(page, questionInput, options, correctOptionIndex, explanation);
      } else {
        const addQuestionBtn = page.getByText('Add a question', { exact: false }).last();
        await addQuestionBtn.waitFor({ state: 'visible', timeout: 15000 });
        await addQuestionBtn.click();

        const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
        await questionInput.fill(questionText);
        await fillOptionsForSection(page, questionInput, options, correctOptionIndex, explanation);
      }
    }
    console.log('✓ All Block 2 questions added to section');

    // Step 10: Go straight to Step 3 (skip flaky Save)
    console.log('Advancing directly to preview after adding questions...');
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1000);
    await createTestPage.clickContinueStep2();
    await createTestPage.verifyStep3Loaded();

    // Step 11: Publish and keep window open until confirmation
    await createTestPage.clickPublish();
    await page.getByText(/course has been published/i).waitFor({ state: 'visible', timeout: 25000 });
    console.log('✓ Publish confirmation detected');
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

  const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
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
