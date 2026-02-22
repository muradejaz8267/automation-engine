const { test, expect } = require('@playwright/test');
const ProdLoginPage = require('../../pages/ProdLoginPage');

test.describe('Prod login flow', () => {
  test('should sign in to prod and land on student dashboard', async ({ page }) => {
    test.setTimeout(45000);

    const loginPage = new ProdLoginPage(page);

    // Navigate and login
    await loginPage.navigate();
    await loginPage.login();

    // Verify dashboard
    await expect(page).toHaveURL('https://fastlearner.ai/student/dashboard');
  });
});

