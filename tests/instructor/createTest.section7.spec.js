// createTest.navigate.spec.js - Simple test to login and navigate to test edit page
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const CreateTestPage = require('../../pages/CreateTestPage.copy');

// Function to parse questions from the text file
// Section 7 format: Options like "A. text", "B. text", "Correct Answer: C", "Explanation:"
function parseUsmleQuestions(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions = [];
  
  // Split by question markers
  const questionBlocks = content.split(/(?=Question \d+)/);
  
  for (const block of questionBlocks) {
    if (!block.trim() || !block.includes('Question')) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('Question'));
    
    // Find where options start (first line matching "A.", "B.", etc.)
    let firstOptionIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\s*[A-E]\.\s+/)) {
        firstOptionIndex = i;
        break;
      }
    }
    
    if (firstOptionIndex === -1) continue; // No options found
    
    // Extract question text (everything before the first option)
    const questionText = lines.slice(0, firstOptionIndex).join(' ').trim();
    if (!questionText) continue;
    
    // Extract options and other data
    const options = [];
    let correctAnswer = null;
    let explanation = '';
    let inExplanation = false;
    let finishedOptions = false;
    
    for (let j = firstOptionIndex; j < lines.length; j++) {
      const line = lines[j];
      
      // Once we hit explanation, never treat lines as options - collect explanation only
      if (inExplanation) {
        if (line.startsWith('________________') || line.match(/^Question \d+/)) break;
        if (line.trim()) {
          explanation = explanation ? `${explanation} ${line.trim()}` : line.trim();
        }
        continue;
      }

      // Stop options collection immediately if we see an explanation marker
      if (line.toLowerCase().includes('explanation:') || line.toLowerCase().startsWith('explanation')) {
        inExplanation = true;
        finishedOptions = true; // Stop collecting options
        const explanationText = line.replace(/^.*explanation:\s*/i, '').trim();
        if (explanationText) {
          explanation = explanationText;
        }
        continue;
      }

      // Check for correct answer (and stop treating further lines as options)
      // Handle both "Correct Answer:" (capital A) and "correct answer:" (lowercase)
      const correctMatch = line.match(/correct answer:\s*([A-E])/i);
      if (correctMatch) {
        correctAnswer = correctMatch[1].toUpperCase();
        finishedOptions = true; // Stop collecting options after correct answer
        continue;
      }

      // If we've finished options, skip any remaining lines until explanation
      // This prevents any explanation text from being added to options
      if (finishedOptions) {
        // But check if this line starts explanation
        if (line.toLowerCase().includes('explanation')) {
          inExplanation = true;
          const explanationText = line.replace(/^.*explanation:\s*/i, '').trim();
          if (explanationText) {
            explanation = explanationText;
          }
        }
        continue;
      }

      // Only collect options if we haven't finished and line matches option pattern
      // Check for option lines like "A. ..." or "A. ..." (Section 7 format)
      const optionMatch = line.match(/^\s*([A-E])\.\s+(.+)$/);
      if (optionMatch) {
        const optionText = optionMatch[2].trim();
        // Only add if it's a valid option (not empty, not explanation text)
        if (optionText && !optionText.toLowerCase().includes('explanation')) {
          options.push(optionText);
        }
        continue;
      }
    }
    
    // Validate and add question
    if (questionText && options.length > 0 && correctAnswer) {
      // Convert correct answer letter to index (A=0, B=1, etc.)
      const correctOptionIndex = correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
      
      // Validate index is within bounds
      if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
        questions.push({
          questionText,
          options,
          correctOptionIndex,
          explanation: explanation.trim()
        });
      } else {
        console.warn(`⚠ Skipping question: Invalid correct answer index ${correctOptionIndex} for ${options.length} options`);
      }
    }
  }
  
  return questions;
}

test.describe('Navigate to Test Edit Page', () => {
  test('Login and navigate to test edit page', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes for adding many questions
    
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('https://fastlearner.ai/auth/sign-in');
    await page.waitForLoadState('networkidle');
    console.log('✓ Login page loaded');

    // Step 2: Login
    console.log('Step 2: Logging in...');
    const email = 'fastlearnerai@vinncorp.com';
    const password = 'Quiz!123';
    
    // Fill email field
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(email);
    
    // Fill password field
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);
    
    // Submit form
    await Promise.all([
      page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 15000 }),
      passwordInput.press('Enter')
    ]);
    console.log('✓ Login completed');

    // Step 3: Wait for redirect to student dashboard
    console.log('Step 3: Waiting for redirect to dashboard...');
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard', { timeout: 15000 });
    console.log('✓ Redirected to student dashboard');

    // Step 4: Navigate to test edit page
    console.log('Step 4: Navigating to test edit page (id=262)...');
    await page.goto('https://fastlearner.ai/instructor/test?id=262');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for page to stabilize
    console.log('✓ Navigated to test edit page');
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(/.*instructor\/test\?id=262.*/, { timeout: 10000 });
    console.log('✓ Verified on test edit page');

    // Step 5: Scroll down and click Continue button
    console.log('Step 5: Scrolling down and clicking Continue button...');
    
    // Locate the Continue button
    const continueButton = page.getByRole('button', { name: 'Continue', exact: true }).first();
    
    // Wait for button to be visible
    await continueButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Scroll the button into view
    await continueButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Small delay after scrolling
    
    // Click the Continue button
    await continueButton.click();
    console.log('✓ Continue button clicked');

    // Step 6: Wait for page to stabilize and click Add new section button
    console.log('Step 6: Waiting for page to stabilize after Continue...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('⚠ Network idle timeout, continuing with domcontentloaded...');
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for page to stabilize
    
    // Locate the Add new section button using multiple strategies for robustness
    console.log('Step 6: Locating and clicking Add new section button...');
    
    // Try primary XPath locator (exact class match)
    let addNewSectionButton = page.locator('//div[@class="test-add-section-btn display-flex justify-content-center align-items-center cursor-pointer w-100 background-white"]');
    
    // If primary locator fails, try with partial class match (more flexible)
    const isVisible = await addNewSectionButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      console.log('⚠ Primary locator not found, trying alternative locator...');
      // Try with partial class match - just the key class
      addNewSectionButton = page.locator('div.test-add-section-btn').first();
    }
    
    // Wait for button to be visible with increased timeout
    await addNewSectionButton.waitFor({ state: 'visible', timeout: 20000 });
    
    // Scroll the button into view if needed
    await addNewSectionButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Small delay after scrolling
    
    // Click the Add new section button
    await addNewSectionButton.click();
    console.log('✓ Add new section button clicked');

    // Step 7: Wait for section 2 form to appear and fill section details
    console.log('Step 7: Waiting for section 2 form to load...');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Initialize CreateTestPage for helper methods
    const createTestPage = new CreateTestPage(page);
    
    // Fill Section 7 details - use .last() to get the most recent section (Section 7)
    console.log('Step 7: Filling Section 7 details...');
    
    // Section Name: "Section 7"
    console.log('Filling Section Name field for Section 7...');
    const sectionNameInputs = page.getByPlaceholder('Section name *').or(page.locator('input[placeholder*="Section name"]'));
    const section2NameInput = sectionNameInputs.last(); // Get the last one (Section 7)
    await section2NameInput.waitFor({ state: 'visible', timeout: 15000 });
    await section2NameInput.scrollIntoViewIfNeeded();
    await section2NameInput.clear();
    await section2NameInput.fill('Section 7');
    await expect(section2NameInput).toHaveValue('Section 7');
    console.log('✓ Section Name filled: Section 7');
    
    // Topic Name: for Section 7
    console.log('Filling Topic Name field for Section 7...');
    const topicNameInputs = page.getByPlaceholder('Topic name *').or(page.locator('input[placeholder*="Topic name"]'));
    const section2TopicInput = topicNameInputs.last(); // Get the last one (Section 7)
    await section2TopicInput.waitFor({ state: 'visible', timeout: 10000 });
    await section2TopicInput.scrollIntoViewIfNeeded();
    await section2TopicInput.clear();
    await section2TopicInput.fill('Section 7 Immunology');
    await expect(section2TopicInput).toHaveValue('Section 7 Immunology');
    console.log('✓ Topic Name filled: Section 7 Immunology');
    
    // Type dropdown: Choose "Basic Quiz" (for Section 7)
    console.log('Selecting Type dropdown for Section 7: Basic Quiz...');
    await page.waitForTimeout(500);
    
    // Find the Type dropdown for Section 7 - it appears right after the Topic name input
    // Use following-sibling or following to find the dropdown near the topic input
    const section2TypeDropdown = section2TopicInput.locator('xpath=following::*[contains(@class, "ant-select-selector")][1]')
      .or(section2TopicInput.locator('xpath=following-sibling::*[contains(@class, "ant-select")]//*[contains(@class, "ant-select-selector")]').first());
    
    // If that doesn't work, find all dropdowns and use the one that's in the same section as topic input
    const dropdownVisible = await section2TypeDropdown.isVisible({ timeout: 3000 }).catch(() => false);
    let finalDropdown = section2TypeDropdown;
    
    if (!dropdownVisible) {
      // Find the topic container and look for dropdown within it
      const topicParent = section2TopicInput.locator('xpath=ancestor::*[position()<=8]').last();
      const dropdownInTopic = topicParent.locator('.ant-select-selector').first();
      const topicDropdownVisible = await dropdownInTopic.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (topicDropdownVisible) {
        finalDropdown = dropdownInTopic;
      } else {
        // Last resort: count all dropdowns and use the one that should be for Section 7
        // Section 1 has its dropdown, Section 7 should have the next one
        const allDropdowns = page.locator('.ant-select-selector');
        const count = await allDropdowns.count();
        // Section 7 dropdown is likely the 2nd or later dropdown (after Section 1's)
        finalDropdown = allDropdowns.nth(1); // Try 2nd dropdown (index 1)
      }
    }
    
    await finalDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await finalDropdown.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await finalDropdown.click();
    await page.waitForTimeout(500);
    
    // Select "Basic Quiz"
    const basicQuizOption = page.locator('.cdk-overlay-pane, .ant-select-dropdown')
      .getByText('Basic Quiz', { exact: false }).first();
    await basicQuizOption.waitFor({ state: 'visible', timeout: 5000 });
    await basicQuizOption.click();
    console.log('✓ Type dropdown selected: Basic Quiz');
    await page.waitForSelector('.cdk-overlay-pane', { state: 'hidden', timeout: 3000 }).catch(() => {});
    
    // Quiz Duration: 15
    console.log('Setting Quiz Duration for Section 7 to 15...');
    await page.waitForTimeout(500);
    const quizDurationLabels = page.locator('text=/Quiz duration/i');
    const section2QuizDurationLabel = quizDurationLabels.last(); // Get the last one (Section 7)
    await section2QuizDurationLabel.waitFor({ state: 'visible', timeout: 10000 });
    await section2QuizDurationLabel.scrollIntoViewIfNeeded();
    
    const section2QuizDurationInput = section2QuizDurationLabel.locator('xpath=following::input[@type="number"][1]').or(
      section2QuizDurationLabel.locator('xpath=following::*[@role="spinbutton"][1]').locator('input').first()
    );
    
    await section2QuizDurationInput.waitFor({ state: 'visible', timeout: 10000 });
    await section2QuizDurationInput.scrollIntoViewIfNeeded();
    await section2QuizDurationInput.clear();
    await section2QuizDurationInput.fill('15');
    await page.waitForTimeout(500);
    console.log(`✓ Quiz Duration set to: 15`);
    
    // Passing Criteria: 20 (optional)
    console.log('Setting Passing Criteria for Section 7 to 20...');
    const passingCriteriaLabels = page.locator('text=/Passing criteria/i');
    const section2PassingCriteriaVisible = await passingCriteriaLabels.last().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (section2PassingCriteriaVisible) {
      const section2PassingCriteriaLabel = passingCriteriaLabels.last();
      await section2PassingCriteriaLabel.scrollIntoViewIfNeeded();
      
      const section2PassingCriteriaInput = section2PassingCriteriaLabel.locator('xpath=following::input[@type="number"][1]').or(
        section2PassingCriteriaLabel.locator('xpath=following::*[@role="spinbutton"][1]').locator('input').first()
      );
      
      await section2PassingCriteriaInput.waitFor({ state: 'visible', timeout: 10000 });
      await section2PassingCriteriaInput.scrollIntoViewIfNeeded();
      await section2PassingCriteriaInput.clear();
      await section2PassingCriteriaInput.fill('20');
      await page.waitForTimeout(500);
      console.log(`✓ Passing Criteria set to: 20`);
    } else {
      console.log('⚠ Passing Criteria field not found - skipping');
    }
    
    console.log('✓ Section 7 details filled successfully');
    
    // Step 8: Parse and add questions from Section 7 file
    console.log('\nStep 8: Parsing questions from Section 7 file...');
    // Get the workspace root (go up from tests/instructor to fastlearner-automation)
    const workspaceRoot = path.resolve(__dirname, '../..');
    const questionsFilePath = path.join(workspaceRoot, 'Section 7.txt');
    const quizQuestions = parseUsmleQuestions(questionsFilePath);
    console.log(`✓ Parsed ${quizQuestions.length} questions from file`);
    
    // Step 9: Add questions with explanations
    console.log(`\nStep 9: Adding ${quizQuestions.length} questions to new Section (Section 7)...`);
    
    // For a newly added section at the bottom, the new Question 1 and subsequent questions
    // will appear as the last \"Let's ask a question\" blocks on the page.
    
    for (let i = 0; i < quizQuestions.length; i++) {
      const question = quizQuestions[i];
      console.log(`\n--- Adding Question ${i + 1} of ${quizQuestions.length} ---`);
      
      try {
        if (i === 0) {
          // First question: use the last Q1 slot currently visible (new Section 7 at bottom)
          console.log('Adding Question 1 to Q1 tab in new Section (Section 7)...');
          
          const q1Input = page.getByPlaceholder('Let\'s ask a question').last();
          await q1Input.waitFor({ state: 'visible', timeout: 15000 });
          await q1Input.scrollIntoViewIfNeeded();
          await q1Input.fill(question.questionText);
          console.log('✓ Filled Q1 question text');
          await page.waitForTimeout(500);
          
          // Find Q1 section for scoping options
          const q1Section = q1Input.locator('xpath=ancestor::*[contains(@class, "question") or contains(., "Question 1")][1]')
            .or(q1Input.locator('xpath=ancestor::*[position()<=10]').last());
          
          // Add options to Q1 (only option texts, no explanations)
          // Filter out any explanation text that might have accidentally been included
          const validOptions = question.options.filter(opt => 
            opt && 
            opt.trim() && 
            !opt.toLowerCase().includes('explanation') &&
            !opt.toLowerCase().startsWith('explanation:')
          );
          
          const q1OptionInputs = q1Section.locator('input[placeholder*="Option" i]');
          
          for (let optIdx = 0; optIdx < validOptions.length; optIdx++) {
            const optionText = validOptions[optIdx];
            console.log(`Adding option ${optIdx + 1}: "${optionText}"`);
            
            let optionInput;
            const currentCount = await q1OptionInputs.count().catch(() => 0);
            
            if (optIdx < currentCount) {
              optionInput = q1OptionInputs.nth(optIdx);
            } else {
              const addOptionBtn = q1Section.getByText('Add an option', { exact: false })
                .or(q1Section.locator('button:has-text("Add an option")'))
                .first();
              await addOptionBtn.waitFor({ state: 'visible', timeout: 10000 });
              await addOptionBtn.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await addOptionBtn.click();
              await page.waitForTimeout(500);
              
              const updatedOptions = q1Section.locator('input[placeholder*="Option" i]');
              const newCount = await updatedOptions.count().catch(() => 0);
              optionInput = updatedOptions.nth(newCount - 1);
            }
            
            await optionInput.waitFor({ state: 'visible', timeout: 10000 });
            await optionInput.scrollIntoViewIfNeeded();
            await optionInput.clear();
            await optionInput.fill(optionText);
            await page.waitForTimeout(300);
          }
          
          // Wait for answer buttons to appear
          await page.waitForTimeout(1000);
          
          // Select correct answer
          const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const answerLetter = answerLetters[question.correctOptionIndex];
          
          const correctAnswerLabel = q1Section.getByText('Correct answer', { exact: false }).first();
          await correctAnswerLabel.waitFor({ state: 'visible', timeout: 10000 });
          const answerContainer = correctAnswerLabel.locator('xpath=following::*[1]');
          await answerContainer.waitFor({ state: 'visible', timeout: 10000 });
          
          const answerSelector = answerContainer.getByText(answerLetter, { exact: true }).first();
          await answerSelector.waitFor({ state: 'visible', timeout: 15000 });
          await answerSelector.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await answerSelector.click();
          console.log(`✓ Selected correct answer: ${answerLetter}`);
          await page.waitForTimeout(500);
          
          // Add explanation text only in the explanation field (not as options)
          if (question.explanation) {
            console.log('Adding explanation to Q1...');
            const q1ExplanationTextarea = q1Section.locator('textarea[placeholder*="Write explanation here" i]')
              .or(q1Section.locator('textarea[placeholder*="explanation" i]'))
              .first();
            
            const explanationVisible = await q1ExplanationTextarea.isVisible({ timeout: 5000 }).catch(() => false);
            if (explanationVisible) {
              await q1ExplanationTextarea.waitFor({ state: 'visible', timeout: 10000 });
              await q1ExplanationTextarea.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await q1ExplanationTextarea.click();
              await page.waitForTimeout(300);
              await q1ExplanationTextarea.clear();
              await q1ExplanationTextarea.fill(question.explanation);
              console.log('✓ Explanation added to Q1');
            } else {
              console.log('⚠ Explanation field not found for Q1');
            }
          }
        } else {
          // Subsequent questions: always target the last \"Add a question\" button (Section 7 at bottom)
          const addQuestionBtn = page.getByText('Add a question', { exact: false })
            .or(page.locator('button:has-text(\"Add a question\")'))
            .last();
          
          await addQuestionBtn.waitFor({ state: 'visible', timeout: 10000 });
          await addQuestionBtn.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await addQuestionBtn.click();
          console.log(`✓ Clicked "Add a question" button for Question ${i + 1}`);
          await page.waitForTimeout(1000);
          
          // New question input at the bottom (new question in Section 7)
          const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
          await questionInput.waitFor({ state: 'visible', timeout: 10000 });
          await questionInput.scrollIntoViewIfNeeded();
          await questionInput.fill(question.questionText);
          console.log(`✓ Filled question text for Question ${i + 1}`);
          await page.waitForTimeout(500);
          
          const questionSection = questionInput.locator('xpath=ancestor::*[contains(@class, "question") or contains(., "Question")][1]')
            .or(questionInput.locator('xpath=ancestor::*[position()<=10]').last());
          
          // Add options (text only) - filter out any explanation text
          const validOptions = question.options.filter(opt => 
            opt && 
            opt.trim() && 
            !opt.toLowerCase().includes('explanation') &&
            !opt.toLowerCase().startsWith('explanation:')
          );
          
          const optionInputsInSection = questionSection.locator('input[placeholder*="Option" i]');
          
          for (let optIdx = 0; optIdx < validOptions.length; optIdx++) {
            const optionText = validOptions[optIdx];
            console.log(`Adding option ${optIdx + 1}: "${optionText}"`);
            
            let optionInput;
            const currentCount = await optionInputsInSection.count().catch(() => 0);
            
            if (optIdx < currentCount) {
              optionInput = optionInputsInSection.nth(optIdx);
            } else {
              const addOptionBtn = questionSection.getByText('Add an option', { exact: false })
                .or(questionSection.locator('button:has-text("Add an option")'))
                .first();
              await addOptionBtn.waitFor({ state: 'visible', timeout: 10000 });
              await addOptionBtn.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await addOptionBtn.click();
              await page.waitForTimeout(500);
              
              const updatedOptions = questionSection.locator('input[placeholder*="Option" i]');
              const newCount = await updatedOptions.count().catch(() => 0);
              optionInput = updatedOptions.nth(newCount - 1);
            }
            
            await optionInput.waitFor({ state: 'visible', timeout: 10000 });
            await optionInput.scrollIntoViewIfNeeded();
            await optionInput.clear();
            await optionInput.fill(optionText);
            await page.waitForTimeout(300);
          }
          
          // Wait for answer buttons
          await page.waitForTimeout(1000);
          
          const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const answerLetter = answerLetters[question.correctOptionIndex];
          
          const correctAnswerLabel = questionSection.getByText('Correct answer', { exact: false }).first();
          await correctAnswerLabel.waitFor({ state: 'visible', timeout: 10000 });
          const answerContainer = correctAnswerLabel.locator('xpath=following::*[1]');
          await answerContainer.waitFor({ state: 'visible', timeout: 10000 });
          
          const answerSelector = answerContainer.getByText(answerLetter, { exact: true }).first();
          await answerSelector.waitFor({ state: 'visible', timeout: 15000 });
          await answerSelector.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await answerSelector.click();
          console.log(`✓ Selected correct answer: ${answerLetter}`);
          await page.waitForTimeout(500);
          
          // Add explanation in explanation textarea only
          if (question.explanation) {
            console.log('Adding explanation...');
            const explanationTextarea = questionSection.locator('textarea[placeholder*="Write explanation here" i]')
              .or(questionSection.locator('textarea[placeholder*="explanation" i]'))
              .first();
            
            const explanationVisible = await explanationTextarea.isVisible({ timeout: 5000 }).catch(() => false);
            if (explanationVisible) {
              await explanationTextarea.waitFor({ state: 'visible', timeout: 10000 });
              await explanationTextarea.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await explanationTextarea.click();
              await page.waitForTimeout(300);
              await explanationTextarea.clear();
              await explanationTextarea.fill(question.explanation);
              console.log('✓ Explanation added');
            } else {
              console.log('⚠ Explanation field not found');
            }
          }
        }
        
        console.log(`✅ Question ${i + 1} added successfully`);
        
        await page.waitForTimeout(500);
      } catch (error) {
        console.error(`❌ Error adding question ${i + 1}:`, error.message);
        await page.waitForTimeout(1000);
      }
    }
    
    console.log(`\n✓ All ${quizQuestions.length} questions added to Section 7`);

    // Step 10: Scroll to bottom and click Continue (no Save)
    console.log('\nStep 10: Scrolling to bottom and clicking Continue...');
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1000);

    const continueButtonStep2 = page.getByRole('button', { name: 'Continue', exact: true })
      .or(page.locator('button:has-text("Continue")'))
      .last();

    await continueButtonStep2.waitFor({ state: 'visible', timeout: 15000 });
    await continueButtonStep2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await continueButtonStep2.click();
    console.log('✓ Continue button clicked at bottom of Step 2');

    // Optional: wait for Step 3 to load
    await createTestPage.verifyStep3Loaded().catch(() => {
      console.log('⚠ Step 3 verification skipped/failed, continuing to Publish click anyway');
    });

    // Step 11: Scroll to bottom again and click Publish
    console.log('\nStep 11: Scrolling to bottom of Step 3 and clicking Publish...');
    await page.mouse.wheel(0, 20000);
    await page.waitForTimeout(1000);

    const publishButton = page.getByRole('button', { name: /publish/i })
      .or(page.locator('button:has-text("Publish")'))
      .first();

    await publishButton.waitFor({ state: 'visible', timeout: 20000 });
    await publishButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await publishButton.click();
    console.log('✓ Publish button clicked');

    // Wait up to ~20 seconds for the course to finish publishing / confirmation text to appear
    console.log('Waiting up to 20 seconds for course to be published...');
    await Promise.race([
      page.waitForTimeout(20000),
      page.getByText(/course has been publish/i).waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
    ]);
    console.log('✓ Publish wait completed');
  });
});

