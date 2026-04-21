// LoginPage.js - Page Object Model for Login Page
const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Selectors for login page elements
    this.selectors = {
      emailInput: 'input[type="email"], input[name="email"], input[id*="email"]',
      passwordInput: 'input[type="password"], input[name="password"], input[id*="password"]',
      loginButton: 'button:has-text("Sign In"), button[type="submit"]'
    };
  }

  // Navigate to the login page
  async navigate() {
    // Use domcontentloaded instead of networkidle (staging can keep connections open)
    await this.page.goto('https://staging.fastlearner.ai/auth/sign-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    // Best-effort extra load wait, but don't hang if it never reaches 'load'
    await this.page.waitForLoadState('load').catch(() => {});
    // Ensure email field is visible before proceeding
    const emailInput = this.page.locator(this.selectors.emailInput).first();
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  // Login with hardcoded credentials
  async login() {
    const email = 'tester124@yopmail.com';
    const password = 'test12345';

    // Fill email field
    const emailInput = this.page.locator(this.selectors.emailInput).first();
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await emailInput.fill(email);

    // Fill password field
    const passwordInput = this.page.locator(this.selectors.passwordInput).first();
    await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
    await passwordInput.fill(password);

    // Submit form by pressing Enter (most reliable way to submit forms)
    // This triggers form submission without needing to find the exact button
    await Promise.all([
      this.page.waitForURL('https://staging.fastlearner.ai/student/dashboard', { timeout: 40000 }),
      passwordInput.press('Enter')
    ]);
  }
}

module.exports = LoginPage;

