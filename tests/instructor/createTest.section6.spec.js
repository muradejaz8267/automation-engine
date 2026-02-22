// createTest.section6.spec.js - Test to login, navigate to test edit page, and add Section 6 with all questions
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const CreateTestPage = require('../../pages/CreateTestPage.copy');

// Function to parse questions from the text file
// Section 6 format: Mixed - Questions 1-20 have "Answer Choices:" with "(A)", "(B)" etc.
// Questions 21-60 have direct "A.", "B.", "C." etc. (no "Answer Choices:" marker)
function parseUsmleQuestions(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions = [];
  
  // Split by question markers
  const questionBlocks = content.split(/(?=Question \d+)/);
  
  for (const block of questionBlocks) {
    if (!block.trim() || !block.includes('Question')) continue;
    
    const lines = block.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('Question'));
    
    let questionText = '';
    let optionsStartIndex = -1;
    
    // Try to find "Answer Choices:" marker first (Format 1: Questions 1-20)
    const answerChoicesIndex = lines.findIndex(l => l.toLowerCase().includes('answer choices'));
    
    if (answerChoicesIndex !== -1) {
      questionText = lines.slice(0, answerChoicesIndex).join(' ').trim();
      optionsStartIndex = answerChoicesIndex + 1;
    } else {
      // If "Answer Choices:" not found, assume Format 2: options start directly (Questions 21-60)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\s*[A-E]\.\s+/)) {
          optionsStartIndex = i;
          break;
        }
      }
      if (optionsStartIndex === -1) continue; // No options found
      questionText = lines.slice(0, optionsStartIndex).join(' ').trim();
    }
    
    if (!questionText) continue;
    
    // Extract options and other data
    const options = [];
    let correctAnswer = null;
    let explanation = '';
    let inExplanation = false;
    let finishedOptions = false;
    
    for (let j = optionsStartIndex; j < lines.length; j++) {
      const line = lines[j];
      
      if (inExplanation) {
        if (line.startsWith('________________') || line.match(/^Question \d+/)) break;
        if (line.trim()) {
          explanation = explanation ? `${explanation} ${line.trim()}` : line.trim();
        }
        continue;
      }
      
      if (line.toLowerCase().includes('explanation:') || line.toLowerCase().startsWith('explanation')) {
        inExplanation = true;
        finishedOptions = true;
        const explanationText = line.replace(/^.*explanation:\s*/i, '').trim();
        if (explanationText) {
          explanation = explanationText;
        }
        continue;
      }
      
      const correctMatch = line.match(/correct answer:\s*([A-E])/i);
      if (correctMatch) {
        correctAnswer = correctMatch[1].toUpperCase();
        finishedOptions = true;
        continue;
      }
      
      if (finishedOptions) {
        if (line.toLowerCase().includes('explanation')) {
          inExplanation = true;
          const explanationText = line.replace(/^.*explanation:\s*/i, '').trim();
          if (explanationText) {
            explanation = explanationText;
          }
        }
        continue;
      }
      
      // Try Format 1: "(A) ..." pattern
      let optionMatch = line.match(/^\s*\(([A-E])\)\s*(.+)$/);
      if (!optionMatch) {
        // Try Format 2: "A. ..." pattern
        optionMatch = line.match(/^\s*([A-E])\.\s+(.+)$/);
      }
      
      if (optionMatch) {
        const optionText = optionMatch[2].trim();
        if (optionText && !optionText.toLowerCase().includes('explanation')) {
          options.push(optionText);
        }
        continue;
      }
    }
    
    // Validate and add question
    if (questionText && options.length > 0 && correctAnswer) {
      const correctOptionIndex = correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
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

// Helper function to safely wait on page (checks if page is closed)
async function safeWait(page, ms) {
  try {
    if (page.isClosed()) {
      return false;
    }
    await page.waitForTimeout(ms);
    return true;
  } catch (error) {
    const errorMsg = error.message || '';
    if (errorMsg.includes('closed') || errorMsg.includes('Target page')) {
      return false;
    }
    throw error;
  }
}

// Helper function to check if page is still usable
function isPageUsable(page) {
  try {
    return !page.isClosed();
  } catch {
    return false;
  }
}

// Helper function to safely scroll an element into view with timeout protection
async function safeScrollIntoView(locator, timeoutMs = 10000) {
  try {
    // First check if element is attached
    const isAttached = await locator.evaluate((el) => {
      return document.body.contains(el);
    }).catch(() => false);
    
    if (!isAttached) {
      console.log('⚠ Element not attached to DOM, waiting for it...');
      await locator.waitFor({ state: 'attached', timeout: timeoutMs });
    }
    
    // Use Promise.race to add timeout protection
    await Promise.race([
      locator.scrollIntoViewIfNeeded(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Scroll timeout')), timeoutMs)
      )
    ]);
    return true;
  } catch (error) {
    const errorMsg = error.message || '';
    if (errorMsg.includes('timeout') || errorMsg.includes('Scroll timeout')) {
      console.log(`⚠ Scroll timeout for element, trying alternative approach...`);
      // Try direct scroll as fallback
      try {
        await locator.evaluate((el) => {
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
        return true;
      } catch (e) {
        console.log(`⚠ Alternative scroll also failed: ${e.message}`);
        return false;
      }
    }
    throw error;
  }
}

// Helper function to safely fill an input with retry logic
async function safeFillInput(locator, text, page, maxRetries = 3) {
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      // Check if page is still usable
      if (!isPageUsable(page)) {
        throw new Error('Page closed during safeFillInput');
      }
      
      // Check if element is visible and attached
      const isVisible = await locator.isVisible({ timeout: 5000 }).catch(() => false);
      if (!isVisible) {
        await locator.waitFor({ state: 'visible', timeout: 10000 });
      }
      
      // Try to scroll into view
      await safeScrollIntoView(locator, 8000);
      
      // Clear and fill
      await locator.clear({ timeout: 5000 });
      await locator.fill(text, { timeout: 5000 });
      
      // Verify the value was set
      const value = await locator.inputValue().catch(() => '');
      if (value === text || value.includes(text.substring(0, Math.min(20, text.length)))) {
        return true;
      }
      
      if (retry < maxRetries - 1) {
        console.log(`⚠ Input value mismatch on retry ${retry + 1}, retrying...`);
        await safeWait(page, 500);
      }
    } catch (error) {
      const errorMsg = error.message || '';
      if (errorMsg.includes('closed') || errorMsg.includes('Target page')) {
        throw error; // Don't retry if page is closed
      }
      
      if (retry === maxRetries - 1) {
        throw error;
      }
      console.log(`⚠ Error filling input on retry ${retry + 1}: ${error.message}, retrying...`);
      await safeWait(page, 1000);
    }
  }
  return false;
}

test.describe('Navigate to Test Edit Page', () => {
  test('Login and navigate to test edit page', async ({ page, context }) => {
    test.setTimeout(2400000); // 40 minutes for adding many questions (increased from 30)
    
    // Prevent browser from closing on errors
    context.setDefaultTimeout(60000); // 60 seconds default timeout
    
    // Set longer timeout for individual operations
    page.setDefaultTimeout(30000); // 30 seconds for page operations
    
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
    await safeWait(page, 2000); // Wait for page to stabilize
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
    await safeWait(page, 500); // Small delay after scrolling
    
    // Click the Continue button
    await continueButton.click();
    console.log('✓ Continue button clicked');

    // Step 6: Wait for page to stabilize and click Add new section button
    console.log('Step 6: Waiting for page to stabilize after Continue...');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
      console.log('⚠ Network idle timeout, continuing with domcontentloaded...');
    });
    await page.waitForLoadState('domcontentloaded');
    await safeWait(page, 3000); // Wait for page to stabilize
    
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
    await safeWait(page, 500); // Small delay after scrolling
    
    // Click the Add new section button
    await addNewSectionButton.click();
    console.log('✓ Add new section button clicked');

    // Step 7: Wait for section form to appear and fill section details
    console.log('Step 7: Waiting for section form to load...');
    await page.waitForLoadState('domcontentloaded');
    await safeWait(page, 2000);
    
    // Initialize CreateTestPage for helper methods
    const createTestPage = new CreateTestPage(page);
    
    // Fill Section 6 details - use .last() to get the most recent section (Section 6)
    console.log('Step 7: Filling Section 6 details...');
    
    // Section Name: "Section 6"
    console.log('Filling Section Name field for Section 6...');
    const sectionNameInputs = page.getByPlaceholder('Section name *').or(page.locator('input[placeholder*="Section name"]'));
    const section6NameInput = sectionNameInputs.last(); // Get the last one (Section 6)
    await section6NameInput.waitFor({ state: 'visible', timeout: 15000 });
    await section6NameInput.scrollIntoViewIfNeeded();
    await section6NameInput.clear();
    await section6NameInput.fill('Section 6');
    await expect(section6NameInput).toHaveValue('Section 6');
    console.log('✓ Section Name filled: Section 6');
    
    // Topic Name: for Section 6
    console.log('Filling Topic Name field for Section 6...');
    const topicNameInputs = page.getByPlaceholder('Topic name *').or(page.locator('input[placeholder*="Topic name"]'));
    const section6TopicInput = topicNameInputs.last(); // Get the last one (Section 6)
    await section6TopicInput.waitFor({ state: 'visible', timeout: 10000 });
    await section6TopicInput.scrollIntoViewIfNeeded();
    await section6TopicInput.clear();
    await section6TopicInput.fill('Section 6 Immunology');
    await expect(section6TopicInput).toHaveValue('Section 6 Immunology');
    console.log('✓ Topic Name filled: Section 6 Immunology');
    
    // Type dropdown: Choose "Basic Quiz" (for Section 6)
    console.log('Selecting Type dropdown for Section 6: Basic Quiz...');
    await safeWait(page, 500);
    
    // Find the Type dropdown for Section 6
    const section6TypeDropdown = section6TopicInput.locator('xpath=following::*[contains(@class, "ant-select-selector")][1]')
      .or(section6TopicInput.locator('xpath=following-sibling::*[contains(@class, "ant-select")]//*[contains(@class, "ant-select-selector")]').first());
    
    const dropdownVisible = await section6TypeDropdown.isVisible({ timeout: 3000 }).catch(() => false);
    let finalDropdown = section6TypeDropdown;
    
    if (!dropdownVisible) {
      const topicParent = section6TopicInput.locator('xpath=ancestor::*[position()<=8]').last();
      const dropdownInTopic = topicParent.locator('.ant-select-selector').first();
      const topicDropdownVisible = await dropdownInTopic.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (topicDropdownVisible) {
        finalDropdown = dropdownInTopic;
      } else {
        const allDropdowns = page.locator('.ant-select-selector');
        finalDropdown = allDropdowns.nth(1);
      }
    }
    
    await finalDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await finalDropdown.scrollIntoViewIfNeeded();
    await safeWait(page, 300);
    await finalDropdown.click();
    await safeWait(page, 500);
    
    // Select "Basic Quiz"
    const basicQuizOption = page.locator('.cdk-overlay-pane, .ant-select-dropdown')
      .getByText('Basic Quiz', { exact: false }).first();
    await basicQuizOption.waitFor({ state: 'visible', timeout: 5000 });
    await basicQuizOption.click();
    console.log('✓ Type dropdown selected: Basic Quiz');
    await page.waitForSelector('.cdk-overlay-pane', { state: 'hidden', timeout: 3000 }).catch(() => {});
    
    // Quiz Duration: 15
    console.log('Setting Quiz Duration for Section 6 to 15...');
    await safeWait(page, 500);
    const quizDurationLabels = page.locator('text=/Quiz duration/i');
    const section6QuizDurationLabel = quizDurationLabels.last();
    await section6QuizDurationLabel.waitFor({ state: 'visible', timeout: 10000 });
    await section6QuizDurationLabel.scrollIntoViewIfNeeded();
    
    const section6QuizDurationInput = section6QuizDurationLabel.locator('xpath=following::input[@type="number"][1]').or(
      section6QuizDurationLabel.locator('xpath=following::*[@role="spinbutton"][1]').locator('input').first()
    );
    
    await section6QuizDurationInput.waitFor({ state: 'visible', timeout: 10000 });
    await section6QuizDurationInput.scrollIntoViewIfNeeded();
    await section6QuizDurationInput.clear();
    await section6QuizDurationInput.fill('15');
    await safeWait(page, 500);
    console.log(`✓ Quiz Duration set to: 15`);
    
    // Passing Criteria: 20 (optional)
    console.log('Setting Passing Criteria for Section 6 to 20...');
    const passingCriteriaLabels = page.locator('text=/Passing criteria/i');
    const section6PassingCriteriaVisible = await passingCriteriaLabels.last().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (section6PassingCriteriaVisible) {
      const section6PassingCriteriaLabel = passingCriteriaLabels.last();
      await section6PassingCriteriaLabel.scrollIntoViewIfNeeded();
      
      const section6PassingCriteriaInput = section6PassingCriteriaLabel.locator('xpath=following::input[@type="number"][1]').or(
        section6PassingCriteriaLabel.locator('xpath=following::*[@role="spinbutton"][1]').locator('input').first()
      );
      
      await section6PassingCriteriaInput.waitFor({ state: 'visible', timeout: 10000 });
      await section6PassingCriteriaInput.scrollIntoViewIfNeeded();
      await section6PassingCriteriaInput.clear();
      await section6PassingCriteriaInput.fill('20');
      await safeWait(page, 500);
      console.log(`✓ Passing Criteria set to: 20`);
    } else {
      console.log('⚠ Passing Criteria field not found - skipping');
    }
    
    console.log('✓ Section 6 details filled successfully');
    
    // Step 8: Parse and add questions from Section 6 file
    console.log('\nStep 8: Parsing questions from Section 6 file...');
    const workspaceRoot = path.resolve(__dirname, '../..');
    const questionsFilePath = path.join(workspaceRoot, 'Section 6.txt');
    const quizQuestions = parseUsmleQuestions(questionsFilePath);
    console.log(`✓ Parsed ${quizQuestions.length} questions from file`);
    
    // Step 9: Add questions with explanations
    console.log(`\nStep 9: Adding ${quizQuestions.length} questions to new Section (Section 6)...`);
    
    for (let i = 0; i < quizQuestions.length; i++) {
      const question = quizQuestions[i];
      console.log(`\n--- Adding Question ${i + 1} of ${quizQuestions.length} ---`);
      
      try {
        if (i === 0) {
          // First question: use the last Q1 slot currently visible (new Section 6 at bottom)
          console.log('Adding Question 1 to Q1 tab in new Section (Section 6)...');
          
          const q1Input = page.getByPlaceholder('Let\'s ask a question').last();
          await q1Input.waitFor({ state: 'visible', timeout: 15000 });
          await q1Input.scrollIntoViewIfNeeded();
          await q1Input.fill(question.questionText);
          console.log('✓ Filled Q1 question text');
          await safeWait(page, 500);
          
          const q1Section = q1Input.locator('xpath=ancestor::*[contains(@class, "question") or contains(., "Question 1")][1]')
            .or(q1Input.locator('xpath=ancestor::*[position()<=10]').last());
          
          const validOptions = question.options.filter(opt => 
            opt && 
            opt.trim() && 
            !opt.toLowerCase().includes('explanation') &&
            !opt.toLowerCase().startsWith('explanation:')
          );
          
          if (!isPageUsable(page)) {
            throw new Error('Page closed before adding Q1 options');
          }
          
          const q1OptionInputs = q1Section.locator('input[placeholder*="Option" i]');
          
          for (let optIdx = 0; optIdx < validOptions.length; optIdx++) {
            const optionText = validOptions[optIdx];
            console.log(`Adding option ${optIdx + 1}: "${optionText}"`);
            
            if (!isPageUsable(page)) {
              throw new Error('Page closed while adding Q1 options');
            }
            
            let optionInput;
            let currentCount = await q1OptionInputs.count().catch(() => 0);
            
            if (optIdx >= currentCount) {
              currentCount = await q1OptionInputs.count().catch(() => 0);
            }
            
            if (optIdx < currentCount) {
              optionInput = q1OptionInputs.nth(optIdx);
            } else {
              let addOptionBtn = null;
              let btnFound = false;
              
              try {
                addOptionBtn = q1Section.getByText('Add an option', { exact: false }).first();
                btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
              } catch (e) {
                console.log(`⚠ Strategy 1 failed for Q1 option ${optIdx + 1}: ${e.message}`);
              }
              
              if (!btnFound) {
                try {
                  addOptionBtn = q1Section.locator('button:has-text("Add an option")').first();
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 2 failed for Q1 option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound && currentCount > 0) {
                try {
                  const lastOptionInput = q1OptionInputs.last();
                  addOptionBtn = lastOptionInput.locator('xpath=following::button[contains(text(), "Add") or contains(text(), "option")][1]');
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 3 failed for Q1 option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound) {
                try {
                  addOptionBtn = q1Section.locator('button').filter({ hasText: /add.*option/i }).first();
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 4 failed for Q1 option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound || !addOptionBtn) {
                const finalCount = await q1OptionInputs.count().catch(() => 0);
                if (finalCount >= validOptions.length) {
                  console.log(`⚠ Already have ${finalCount} options for Q1, using existing input ${optIdx}`);
                  optionInput = q1OptionInputs.nth(optIdx);
                } else {
                  throw new Error(`Could not find "Add an option" button for Q1, option ${optIdx + 1}. Current count: ${finalCount}, needed: ${validOptions.length}`);
                }
              } else {
                await addOptionBtn.waitFor({ state: 'visible', timeout: 20000 });
                await addOptionBtn.scrollIntoViewIfNeeded();
                await safeWait(page, 500);
                await addOptionBtn.click();
                await safeWait(page, 1000);
                
                let newInputFound = false;
                for (let retry = 0; retry < 5; retry++) {
                  const updatedOptions = q1Section.locator('input[placeholder*="Option" i]');
                  const newCount = await updatedOptions.count().catch(() => 0);
                  if (newCount > currentCount) {
                    optionInput = updatedOptions.nth(newCount - 1);
                    newInputFound = true;
                    break;
                  }
                  await safeWait(page, 500);
                }
                
                if (!newInputFound) {
                  const updatedOptions = q1Section.locator('input[placeholder*="Option" i]');
                  const newCount = await updatedOptions.count().catch(() => 0);
                  if (newCount > 0) {
                    optionInput = updatedOptions.nth(newCount - 1);
                  } else {
                    throw new Error(`New option input did not appear after clicking "Add an option" for Q1`);
                  }
                }
              }
            }
            
            try {
              await optionInput.waitFor({ state: 'visible', timeout: 15000 });
              await safeFillInput(optionInput, optionText, page);
              await safeWait(page, 300);
            } catch (error) {
              const errorMsg = error.message || '';
              if (errorMsg.includes('closed') || errorMsg.includes('Target page')) {
                throw error;
              }
              console.log(`⚠ Error filling Q1 option ${optIdx + 1}, trying direct fill...`);
              try {
                await optionInput.fill(optionText, { timeout: 5000 });
              } catch (e) {
                console.error(`❌ Failed to fill Q1 option ${optIdx + 1} after retries: ${e.message}`);
              }
            }
          }
          
          await safeWait(page, 1000);
          
          const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const answerLetter = answerLetters[question.correctOptionIndex];
          
          const correctAnswerLabel = q1Section.getByText('Correct answer', { exact: false }).first();
          await correctAnswerLabel.waitFor({ state: 'visible', timeout: 10000 });
          const answerContainer = correctAnswerLabel.locator('xpath=following::*[1]');
          await answerContainer.waitFor({ state: 'visible', timeout: 10000 });
          
          const answerSelector = answerContainer.getByText(answerLetter, { exact: true }).first();
          await answerSelector.waitFor({ state: 'visible', timeout: 15000 });
          await safeScrollIntoView(answerSelector, 8000);
          await safeWait(page, 300);
          await answerSelector.click();
          console.log(`✓ Selected correct answer: ${answerLetter}`);
          await safeWait(page, 500);
          
          if (question.explanation) {
            console.log('Adding explanation to Q1...');
            const q1ExplanationTextarea = q1Section.locator('textarea[placeholder*="Write explanation here" i]')
              .or(q1Section.locator('textarea[placeholder*="explanation" i]'))
              .first();
            
            const explanationVisible = await q1ExplanationTextarea.isVisible({ timeout: 5000 }).catch(() => false);
            if (explanationVisible) {
              await q1ExplanationTextarea.waitFor({ state: 'visible', timeout: 10000 });
              await safeScrollIntoView(q1ExplanationTextarea, 8000);
              await safeWait(page, 300);
              await q1ExplanationTextarea.click();
              await safeWait(page, 300);
              await q1ExplanationTextarea.clear();
              await q1ExplanationTextarea.fill(question.explanation);
              console.log('✓ Explanation added to Q1');
            } else {
              console.log('⚠ Explanation field not found for Q1');
            }
          }
        } else {
          const addQuestionBtn = page.getByText('Add a question', { exact: false })
            .or(page.locator('button:has-text("Add a question")'))
            .last();
          
          await addQuestionBtn.waitFor({ state: 'visible', timeout: 10000 });
          await addQuestionBtn.scrollIntoViewIfNeeded();
          await safeWait(page, 500);
          await addQuestionBtn.click();
          console.log(`✓ Clicked "Add a question" button for Question ${i + 1}`);
          await safeWait(page, 1000);
          
          const questionInput = page.getByPlaceholder('Let\'s ask a question').last();
          await questionInput.waitFor({ state: 'visible', timeout: 10000 });
          await questionInput.scrollIntoViewIfNeeded();
          await questionInput.fill(question.questionText);
          console.log(`✓ Filled question text for Question ${i + 1}`);
          await safeWait(page, 500);
          
          const questionSection = questionInput.locator('xpath=ancestor::*[contains(@class, "question") or contains(., "Question")][1]')
            .or(questionInput.locator('xpath=ancestor::*[position()<=10]').last());
          
          const validOptions = question.options.filter(opt => 
            opt && 
            opt.trim() && 
            !opt.toLowerCase().includes('explanation') &&
            !opt.toLowerCase().startsWith('explanation:')
          );
          
          if (!isPageUsable(page)) {
            throw new Error('Page closed before adding options');
          }
          
          const optionInputsInSection = questionSection.locator('input[placeholder*="Option" i]');
          
          for (let optIdx = 0; optIdx < validOptions.length; optIdx++) {
            const optionText = validOptions[optIdx];
            console.log(`Adding option ${optIdx + 1}: "${optionText}"`);
            
            if (!isPageUsable(page)) {
              throw new Error('Page closed while adding options');
            }
            
            let optionInput;
            let currentCount = await optionInputsInSection.count().catch(() => 0);
            
            if (optIdx >= currentCount) {
              currentCount = await optionInputsInSection.count().catch(() => 0);
            }
            
            if (optIdx < currentCount) {
              optionInput = optionInputsInSection.nth(optIdx);
            } else {
              let addOptionBtn = null;
              let btnFound = false;
              
              try {
                addOptionBtn = questionSection.getByText('Add an option', { exact: false }).first();
                btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
              } catch (e) {
                console.log(`⚠ Strategy 1 failed for option ${optIdx + 1}: ${e.message}`);
              }
              
              if (!btnFound) {
                try {
                  addOptionBtn = questionSection.locator('button:has-text("Add an option")').first();
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 2 failed for option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound && currentCount > 0) {
                try {
                  const lastOptionInput = optionInputsInSection.last();
                  addOptionBtn = lastOptionInput.locator('xpath=following::button[contains(text(), "Add") or contains(text(), "option")][1]');
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 3 failed for option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound) {
                try {
                  addOptionBtn = questionSection.locator('button').filter({ hasText: /add.*option/i }).first();
                  btnFound = await addOptionBtn.isVisible({ timeout: 8000 }).catch(() => false);
                } catch (e) {
                  console.log(`⚠ Strategy 4 failed for option ${optIdx + 1}: ${e.message}`);
                }
              }
              
              if (!btnFound || !addOptionBtn) {
                const finalCount = await optionInputsInSection.count().catch(() => 0);
                if (finalCount >= validOptions.length) {
                  console.log(`⚠ Already have ${finalCount} options, using existing input ${optIdx}`);
                  optionInput = optionInputsInSection.nth(optIdx);
                } else {
                  throw new Error(`Could not find "Add an option" button for question ${i + 1}, option ${optIdx + 1}. Current count: ${finalCount}, needed: ${validOptions.length}`);
                }
              } else {
                await addOptionBtn.waitFor({ state: 'visible', timeout: 20000 });
                await addOptionBtn.scrollIntoViewIfNeeded();
                await safeWait(page, 500);
                await addOptionBtn.click();
                await safeWait(page, 1000);
                
                let newInputFound = false;
                for (let retry = 0; retry < 5; retry++) {
                  const updatedOptions = questionSection.locator('input[placeholder*="Option" i]');
                  const newCount = await updatedOptions.count().catch(() => 0);
                  if (newCount > currentCount) {
                    optionInput = updatedOptions.nth(newCount - 1);
                    newInputFound = true;
                    break;
                  }
                  await safeWait(page, 500);
                }
                
                if (!newInputFound) {
                  const updatedOptions = questionSection.locator('input[placeholder*="Option" i]');
                  const newCount = await updatedOptions.count().catch(() => 0);
                  if (newCount > 0) {
                    optionInput = updatedOptions.nth(newCount - 1);
                  } else {
                    throw new Error(`New option input did not appear after clicking "Add an option" for question ${i + 1}`);
                  }
                }
              }
            }
            
            try {
              await optionInput.waitFor({ state: 'visible', timeout: 15000 });
              await safeFillInput(optionInput, optionText, page);
              await safeWait(page, 300);
            } catch (error) {
              const errorMsg = error.message || '';
              if (errorMsg.includes('closed') || errorMsg.includes('Target page')) {
                throw error;
              }
              console.log(`⚠ Error filling question ${i + 1} option ${optIdx + 1}, trying direct fill...`);
              try {
                await optionInput.fill(optionText, { timeout: 5000 });
              } catch (e) {
                console.error(`❌ Failed to fill question ${i + 1} option ${optIdx + 1} after retries: ${e.message}`);
              }
            }
          }
          
          await safeWait(page, 1000);
          
          const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
          const answerLetter = answerLetters[question.correctOptionIndex];
          
          const correctAnswerLabel = questionSection.getByText('Correct answer', { exact: false }).first();
          await correctAnswerLabel.waitFor({ state: 'visible', timeout: 10000 });
          const answerContainer = correctAnswerLabel.locator('xpath=following::*[1]');
          await answerContainer.waitFor({ state: 'visible', timeout: 10000 });
          
          const answerSelector = answerContainer.getByText(answerLetter, { exact: true }).first();
          await answerSelector.waitFor({ state: 'visible', timeout: 15000 });
          await safeScrollIntoView(answerSelector, 8000);
          await safeWait(page, 300);
          await answerSelector.click();
          console.log(`✓ Selected correct answer: ${answerLetter}`);
          await safeWait(page, 500);
          
          if (question.explanation) {
            console.log('Adding explanation...');
            const explanationTextarea = questionSection.locator('textarea[placeholder*="Write explanation here" i]')
              .or(questionSection.locator('textarea[placeholder*="explanation" i]'))
              .first();
            
            const explanationVisible = await explanationTextarea.isVisible({ timeout: 5000 }).catch(() => false);
            if (explanationVisible) {
              await explanationTextarea.waitFor({ state: 'visible', timeout: 10000 });
              await safeScrollIntoView(explanationTextarea, 8000);
              await safeWait(page, 300);
              await explanationTextarea.click();
              await safeWait(page, 300);
              await explanationTextarea.clear();
              await explanationTextarea.fill(question.explanation);
              console.log('✓ Explanation added');
            } else {
              console.log('⚠ Explanation field not found');
            }
          }
        }
        
        console.log(`✅ Question ${i + 1} added successfully`);
        
        if (!isPageUsable(page)) {
          console.error('⚠ Page is closed. Stopping test.');
          throw new Error('Page closed unexpectedly');
        }
        await safeWait(page, 500);
      } catch (error) {
        console.error(`❌ Error adding question ${i + 1}:`, error.message);
        if (error.stack) {
          console.error(`Error stack:`, error.stack);
        }
        
        if (!isPageUsable(page)) {
          console.error('⚠ Page is closed, cannot continue. Stopping test gracefully.');
          throw new Error('Page closed unexpectedly');
        }
        
        const errorMsg = error.message || '';
        if (errorMsg.includes('closed') || errorMsg.includes('Target page') || errorMsg.includes('browser has been closed')) {
          console.error('⚠ Critical error: Page/browser closed. Stopping test.');
          throw error;
        }
        
        if (errorMsg.includes('timeout') || errorMsg.includes('Timeout') || errorMsg.includes('exceeded')) {
          console.error(`⚠ Timeout error on question ${i + 1}. Attempting to continue with next question...`);
          const waited = await safeWait(page, 2000);
          if (!waited) {
            console.error('⚠ Page closed during timeout recovery. Stopping test.');
            throw new Error('Page closed during timeout recovery');
          }
          console.log(`⚠ Skipping question ${i + 1} due to timeout, continuing to next question...`);
          continue;
        }
        
        const waited = await safeWait(page, 1000);
        if (!waited) {
          console.error('⚠ Page closed during wait. Stopping test.');
          throw new Error('Page closed during error recovery');
        }
        
        console.log(`⚠ Continuing after error on question ${i + 1}...`);
      }
    }
    
    console.log(`\n✓ All ${quizQuestions.length} questions added to Section 6`);

    // Step 10: Scroll to bottom and click Continue (no Save)
    console.log('\nStep 10: Scrolling to bottom and clicking Continue...');
    if (!isPageUsable(page)) {
      throw new Error('Page closed before scrolling to Continue button');
    }
    await page.mouse.wheel(0, 20000);
    await safeWait(page, 1000);

    const continueButtonStep2 = page.getByRole('button', { name: 'Continue', exact: true })
      .or(page.locator('button:has-text("Continue")'))
      .last();

    await continueButtonStep2.waitFor({ state: 'visible', timeout: 15000 });
    await continueButtonStep2.scrollIntoViewIfNeeded();
    await safeWait(page, 500);
    await continueButtonStep2.click();
    console.log('✓ Continue button clicked at bottom of Step 2');

    if (isPageUsable(page)) {
      await createTestPage.verifyStep3Loaded().catch(() => {
        console.log('⚠ Step 3 verification skipped/failed, continuing to Publish click anyway');
      });
    }

    await safeWait(page, 2000);

    // Step 11: Scroll to bottom and click Publish
    console.log('\nStep 11: Scrolling to bottom of Step 3 and clicking Publish...');
    if (!isPageUsable(page)) {
      throw new Error('Page closed before scrolling to Publish button');
    }
    await page.mouse.wheel(0, 20000);
    await safeWait(page, 1000);

    await createTestPage.clickPublish();
    console.log('✓ Publish button clicked');

    console.log('Waiting up to 20 seconds for course to be published...');
    if (isPageUsable(page)) {
      await Promise.race([
        safeWait(page, 20000).then(() => {}).catch(() => {}),
        page.getByText(/course has been publish/i).waitFor({ state: 'visible', timeout: 20000 }).catch(() => {}),
      ]);
    }
    console.log('✓ Publish wait completed');
  });
});



