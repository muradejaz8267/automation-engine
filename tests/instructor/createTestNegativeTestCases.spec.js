// createTestNegativeTestCases.spec.js - Negative test cases for Create Test flow
// Add your negative test cases here (e.g. invalid inputs, missing required fields, etc.)
const { test, expect } = require('../fixtures/screenshotFixture');

test.describe('Create Test - Negative Test Cases', () => {
  test.setTimeout(60000);

  test('placeholder - add negative test cases for Create Test', async ({ page }) => {
    // TODO: Add negative test cases
    // Example: Submit form with empty required fields, invalid quiz data, etc.
    await page.goto('https://staging.fastlearner.ai/auth/sign-in');
    await expect(page).toHaveURL(/sign-in/);
    console.log('Placeholder: Add Create Test negative test cases');
  });
});
