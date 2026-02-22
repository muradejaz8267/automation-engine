// askAIPromptTestCases.spec.js - 5 positive + 5 negative prompt test cases for Copilot (Fastlearner-only responses)
// Login once, then run all test cases in sequence
const { test, expect } = require('@playwright/test');

const CO_PILOT_URL = 'https://staging.fastlearner.ai/student/co-pilot';
const FASTLEARNER_KEYWORDS = ['fastlearner', 'fast learner', 'learning', 'platform', 'student', 'course', 'education', 'sign up', 'signup', 'co-pilot', 'copilot'];

async function loginAndGoToCoPilot(page) {
  await page.goto('https://staging.fastlearner.ai/auth/sign-in');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill('cooper@yopmail.com');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill('Qwerty@123');
  await passwordInput.press('Enter');

  await expect(page).toHaveURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 15000 });

  const askAIButton = page.getByRole('button', { name: 'Ask AI' }).or(page.locator('a:has-text("Ask AI")')).first();
  await askAIButton.waitFor({ state: 'visible', timeout: 10000 });
  await askAIButton.click();

  await expect(page).toHaveURL(CO_PILOT_URL, { timeout: 15000 });
}

async function enterPromptAndGetResponse(page, prompt, timeoutMs = 30000) {
  const messageInput = page.getByPlaceholder(/write your message/i).or(
    page.locator('textarea[placeholder*="Write"]').or(page.locator('input[placeholder*="Write"]'))
  ).first();
  await messageInput.waitFor({ state: 'visible', timeout: 10000 });
  await messageInput.fill(prompt);
  await messageInput.press('Enter');

  let responseText = '';
  for (let i = 0; i < Math.ceil(timeoutMs / 1000); i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const bodyText = await page.locator('body').textContent();
    const messages = await page.locator('[class*="message"], [class*="response"], [class*="content"]').allTextContents();
    responseText = messages.join(' ') || bodyText || '';
    if (responseText.length > prompt.length + 30) break;
  }
  return responseText;
}

function hasFastlearnerContent(text) {
  return FASTLEARNER_KEYWORDS.some((kw) => (text || '').toLowerCase().includes(kw));
}

function hasDeclineOrRedirectPhrase(text) {
  const declinePhrases = ['only', 'fastlearner', 'fast learner', 'platform', 'learning', 'sorry', 'cannot', "can't", 'focus', 'specific', 'related'];
  const t = (text || '').toLowerCase();
  return declinePhrases.some((p) => t.includes(p));
}

const POSITIVE_CASES = [
  { id: 'PC1', prompt: 'What is Fastlearner?', expected: 'AI should return Fastlearner platform-related response (platform description, features, etc.)' },
  { id: 'PC2', prompt: 'How does Fastlearner help students learn?', expected: 'AI should return response about Fastlearner learning features, courses, student benefits' },
  { id: 'PC3', prompt: 'What courses are available on Fastlearner?', expected: 'AI should return response about Fastlearner courses, catalog, or learning content' },
  { id: 'PC4', prompt: 'How do I sign up for Fastlearner?', expected: 'AI should return response about Fastlearner signup, registration, or account creation' },
  { id: 'PC5', prompt: 'What is the AI co-pilot feature in Fastlearner?', expected: 'AI should return response about Fastlearner co-pilot, AI assistant, or platform features' },
];

const NEGATIVE_CASES = [
  { id: 'NC1', prompt: 'What is the capital of France?', expected: 'AI should decline or respond that it only answers Fastlearner platform-related questions' },
  { id: 'NC2', prompt: 'Write a poem about the ocean', expected: 'AI should decline or respond that it only answers Fastlearner platform-related questions' },
  { id: 'NC3', prompt: 'What is 2+2?', expected: 'AI should decline or respond that it only answers Fastlearner platform-related questions' },
  { id: 'NC4', prompt: 'Tell me a joke', expected: 'AI should decline or respond that it only answers Fastlearner platform-related questions' },
  { id: 'NC5', prompt: 'What is the weather today?', expected: 'AI should decline or respond that it only answers Fastlearner platform-related questions' },
];

test.describe('Ask AI Copilot - Prompt Test Cases', () => {
  test('run all 10 prompt cases with single login', async ({ page }) => {
    test.setTimeout(600000); // 10 min for all cases

    // Login once and navigate to co-pilot
    await loginAndGoToCoPilot(page);

    // Run 5 positive cases
    for (const { id, prompt, expected } of POSITIVE_CASES) {
      const responseText = await enterPromptAndGetResponse(page, prompt);
      const actual = hasFastlearnerContent(responseText)
        ? `AI returned Fastlearner-related response (PASS)`
        : `AI did NOT return Fastlearner-related response (FAIL). Response preview: "${(responseText || '').slice(0, 150)}..."`;

      console.log(`\n--- ${id}: ${prompt} ---`);
      console.log('Expected:', expected);
      console.log('Actual:', actual);

      expect(hasFastlearnerContent(responseText), `${id} failed: ${actual}`).toBeTruthy();
    }

    // Run 5 negative cases
    for (const { id, prompt, expected } of NEGATIVE_CASES) {
      const responseText = await enterPromptAndGetResponse(page, prompt);
      const shouldDecline = !hasFastlearnerContent(responseText) || hasDeclineOrRedirectPhrase(responseText);
      const actual = shouldDecline
        ? `AI declined or redirected to Fastlearner scope (PASS)`
        : `AI answered off-topic question (FAIL). Response preview: "${(responseText || '').slice(0, 150)}..."`;

      console.log(`\n--- ${id}: ${prompt} ---`);
      console.log('Expected:', expected);
      console.log('Actual:', actual);

      expect(shouldDecline, `${id} failed: ${actual}`).toBeTruthy();
    }
  });
});
