// ProdLoginPage.js - Page Object Model for production Login Page
const { expect } = require('@playwright/test');

class ProdLoginPage {
  constructor(page) {
    this.page = page;
    
    // Selectors for login page elements
    this.selectors = {
      emailInput: 'input[type="email"], input[name="email"], input[id*="email"]',
      passwordInput: 'input[type="password"], input[name="password"], input[id*="password"]',
      loginButton: 'button:has-text("Sign In"), button[type="submit"]'
    };
  }

  // Navigate to the production login page
  async navigate() {
    await this.page.goto('https://fastlearner.ai/auth/sign-in');
    await this.page.waitForLoadState('networkidle');
  }

  // Login with production credentials
  async login() {
    const email = 'tommy@yopmail.com';
    const password = 'Check!123';

    const emailInput = this.page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill(email);

    const passwordInput = this.page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);

    await Promise.all([
      this.page.waitForURL('https://fastlearner.ai/student/dashboard', { timeout: 15000 }),
      passwordInput.press('Enter')
    ]);
  }
}

module.exports = ProdLoginPage;


