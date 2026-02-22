const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CreateTestPage = require('../../pages/CreateTestPage.copy');

const BLOCK1_FILE_PATH = path.resolve(__dirname, '../../Block1.txt');
const block1Questions = loadBlock1Questions(BLOCK1_FILE_PATH);

console.log(`Loaded ${block1Questions.length} Block 1 quiz questions from ${BLOCK1_FILE_PATH}`);

test.describe('Create Test Flow (Block 1 Question Bank)', () => {
  test('Complete flow: Login and create a test with Block 1 questions', async ({ page }) => {
    test.setTimeout(1800000);

    const createTestPage = new CreateTestPage(page);

    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://fastlearner.ai/auth/sign-in');
    await page.waitForLoadState('networkidle');
    console.log('✓ Login page loaded');

    // Step 2: Login
    console.log('Step 2: Logging in...');
    const email = 'fastlearnerai@vinncorp.com';
    const password = 'Quiz!123';
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(email);
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);
    await Promise.all([
      page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 15000 }),
      passwordInput.press('Enter')
    ]);
    console.log('✓ Login completed');

    // Step 3: Wait for redirect to dashboard
    console.log('Step 3: Waiting for redirect to dashboard...');
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard', { timeout: 15000 });
    console.log('✓ Redirected to student dashboard');

    // Step 4: Navigate to Create Test page
    console.log('Step 4: Navigating to Create Test page...');
    await createTestPage.navigateToCreateTest();
    console.log('✓ Navigated to Create Test page');

    // Step 5: Fill Step 1 form
    console.log('Step 5: Filling test form (Step 1)...');
    await createTestPage.fillTestForm();
    console.log('✓ Test form filled successfully');

    // Step 6: Upload thumbnail
    console.log('Step 6: Uploading thumbnail...');
    await createTestPage.uploadThumbnail();
    console.log('✓ Thumbnail uploaded successfully');

    // Step 7: Handle thumbnail upload modal
    console.log('Step 7: Handling thumbnail upload modal...');
    await createTestPage.handleThumbnailModal();
    console.log('✓ Thumbnail modal handled');

    // Step 8: Continue to Step 2
    console.log('Step 8: Clicking Continue button to advance to Step 2...');
    await createTestPage.clickContinue();
    console.log('✓ Continue button clicked');

    // Step 9: Verify Step 2
    console.log('Step 9: Verifying Step 2 (Add Sections) is loaded...');
    await createTestPage.verifyStep2Loaded();
    console.log('✓ Step 2 verified');

    // Step 10: Fill Add Sections form
    console.log('Step 10: Filling Add Sections form (Step 2)...');
    await createTestPage.fillAddSectionsForm();
    console.log('✓ Add Sections form filled successfully');

    // Step 11: Add quiz questions from Block 1
    console.log('\nStep 11: Adding Block 1 quiz questions...');
    await createTestPage.addMultipleQuestions(block1Questions);
    console.log('✓ All Block 1 quiz questions added successfully');

    // Step 12: Configure AI report & preview
    console.log('Step 12: Configuring AI-Based Assessment Report and previewing...');
    await createTestPage.generateAIReport();
    console.log('✓ AI-Based Assessment Report configured and preview completed');

    // Step 13: Save questions
    console.log('Step 13: Clicking Save button to save questions and sections...');
    await createTestPage.clickSaveButton();
    console.log('✓ Questions and sections saved');

    // Step 14: Continue to Step 3
    console.log('Step 14: Clicking Continue button to advance to Step 3...');
    await createTestPage.clickContinueStep2();
    console.log('✓ Continue button clicked on Step 2');

    // Step 15: Verify Step 3
    console.log('Step 15: Verifying Step 3 (Preview) is loaded...');
    await createTestPage.verifyStep3Loaded();
    console.log('✓ Step 3 verified');

    // Step 16: Publish
    console.log('Step 16: Clicking Publish button to publish the test...');
    await createTestPage.clickPublish();
    console.log('✓ Test published successfully');

    console.log('\n✅ All steps completed successfully with Block 1 question set!');
  });
});

function loadBlock1Questions(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Block1.txt not found at ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const questionRegex = /Question\s+(\d+)\s*([\s\S]*?)(?=(?:\n\s*Question\s+\d+)|$)/gi;
  const questions = [];
  let match;

  while ((match = questionRegex.exec(fileContents)) !== null) {
    const block = match[2].trim();
    if (!block) {
      continue;
    }

    const answerChoicesIndex = block.search(/Answer Choices:/i);
    if (answerChoicesIndex === -1) {
      continue;
    }

    const questionText = cleanText(block.slice(0, answerChoicesIndex));
    if (!questionText) {
      continue;
    }

    const choicesAndRest = block.slice(answerChoicesIndex).replace(/Answer Choices:\s*/i, '');
    const correctRegex = /Correct Answer:\s*([A-Z])/i;
    const correctMatch = correctRegex.exec(choicesAndRest);
    if (!correctMatch || typeof correctMatch.index !== 'number') {
      continue;
    }

    const optionsSection = choicesAndRest.slice(0, correctMatch.index);
    const optionRegex = /\(([A-Z])\)\s*([\s\S]*?)(?=(?:\s*\([A-Z]\)\s)|Correct Answer:|$)/g;
    const options = [];
    const letters = [];
    let optionMatch;

    while ((optionMatch = optionRegex.exec(optionsSection)) !== null) {
      const letter = optionMatch[1].toUpperCase();
      const optionText = cleanText(optionMatch[2]);
      if (!optionText) {
        continue;
      }
      letters.push(letter);
      options.push(optionText);
    }

    if (options.length < 2) {
      continue;
    }

    const correctLetter = correctMatch[1].toUpperCase();
    const correctOptionIndex = letters.indexOf(correctLetter);
    if (correctOptionIndex === -1) {
      continue;
    }

    questions.push({
      questionText,
      options,
      correctOptionIndex
    });
  }

  if (!questions.length) {
    throw new Error('Unable to parse quiz questions from Block1.txt');
  }

  return questions;
}

function cleanText(value) {
  return value
    .replace(/\r/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
