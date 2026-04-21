// cancelSubscription.spec.js
// Runs Monthly Standard Subscription flow, then cancels the subscription
const { test, expect } = require('../fixtures/screenshotFixture');

const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const SUBSCRIPTION_URL = 'https://staging.fastlearner.ai/subscription';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function signup(page, context) {
  const timestamp = Date.now();
  const email = `signuptest${timestamp}@yopmail.com`;
  const password = 'TestPass@123';
  const fullName = 'Test User';

  await page.goto(SIGN_IN_URL);
  await page.waitForLoadState('domcontentloaded');
  await delay(1500);

  const signUpBtn = page.getByRole('button', { name: /sign up/i })
    .or(page.getByRole('link', { name: /sign up/i }))
    .or(page.getByText('Sign Up', { exact: true }))
    .first();
  await signUpBtn.waitFor({ state: 'visible', timeout: 15000 });
  await signUpBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await delay(1500);

  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="Name" i], input[type="text"]').first();
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="confirm" i], input[placeholder*="Confirm" i]').or(page.locator('input[type="password"]').nth(1));

  try {
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.fill(fullName);
  } catch {}

  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(password);
  try {
    await confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
    await confirmPasswordInput.fill(password);
  } catch {}

  const termsCheckbox = page.getByRole('checkbox', { name: /terms|condition|agree|accept/i })
    .or(page.getByLabel(/terms|condition|agree|accept/i))
    .or(page.locator('input[type="checkbox"]').first());
  try {
    await termsCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await termsCheckbox.check();
    await delay(500);
  } catch {}

  const signUpButton = page.locator('form button[type="submit"]')
    .or(page.locator('form').locator('button:has-text("Sign Up")'))
    .or(page.getByRole('button', { name: /sign up|create account|register/i }).last())
    .or(page.locator('button[type="submit"]'))
    .first();
  await signUpButton.waitFor({ state: 'visible', timeout: 10000 });
  await signUpButton.scrollIntoViewIfNeeded();
  await delay(500);
  await signUpButton.click({ force: true });

  const otpModal = page.getByRole('dialog')
    .or(page.locator('[role="dialog"]'))
    .or(page.locator('[class*="modal"]').filter({ hasText: /otp|verify|code/i }))
    .or(page.getByText(/otp|verify|enter code|verification code/i))
    .or(page.locator('input[placeholder*="otp" i], input[placeholder*="code" i], input[placeholder*="verify" i]'));
  await otpModal.first().waitFor({ state: 'visible', timeout: 15000 });

  const yopmailUser = email.split('@')[0];
  const yopmailUrl = `https://yopmail.com/en/?login=${yopmailUser}`;
  const yopmailPage = await context.newPage();
  let otp = null;
  try {
    await yopmailPage.goto(yopmailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(5000);
    for (let i = 0; i < 12; i++) {
      try {
        const inboxFrame = yopmailPage.frameLocator('iframe#ifinbox');
        const firstMail = inboxFrame.locator('.lm').first();
        await firstMail.waitFor({ state: 'visible', timeout: 3000 });
        await firstMail.click();
        await delay(3000);
      } catch {
        const refreshBtn = yopmailPage.locator('#refresh, a[title*="refresh" i], a:has-text("Refresh")').first();
        if (await refreshBtn.isVisible().catch(() => false)) await refreshBtn.click();
        await delay(3000);
      }
      const extractOtp = (text) => {
        const codeMatch = text.match(/(?:CODE|OTP|code|otp)\s*[:\s]+\s*(\d{4,10})/i);
        if (codeMatch) return codeMatch[1];
        const parenMatch = text.match(/\(?\s*CODE\s*:\s*(\d{4,10})\s*\)?/i);
        if (parenMatch) return parenMatch[1];
        const digitMatch = text.match(/\b(\d{6})\b/) || text.match(/\b(\d{4,10})\b/);
        return digitMatch ? digitMatch[1] : null;
      };
      try {
        const mailFrame = yopmailPage.frameLocator('iframe#ifmail');
        const bodyText = await mailFrame.locator('body').innerText({ timeout: 2000 }).catch(() => '');
        otp = extractOtp(bodyText);
        if (otp) break;
      } catch {
        const fullText = await yopmailPage.evaluate(() => document.body?.innerText || '');
        otp = extractOtp(fullText);
        if (otp) break;
      }
    }
    await yopmailPage.close();
    await page.bringToFront();

    if (otp) {
      const singleDigitInputs = page.locator('input[type="text"][maxlength="1"], input[type="number"][maxlength="1"]');
      const singleCount = await singleDigitInputs.count();
      const otpInput = page.locator('[role="dialog"]:has-text("OTP"), [role="dialog"]:has-text("verification"), [role="dialog"]:has-text("code")').locator('input').first()
        .or(page.locator('[class*="modal"]:has-text("OTP"), [class*="modal"]:has-text("verification")').locator('input').first())
        .or(page.locator('input[formcontrolname="otp"], input[formcontrolname="code"]'))
        .or(page.getByPlaceholder(/otp|verification code|enter code|enter otp/i))
        .or(page.locator('[role="dialog"] input:not([formcontrolname="name"])').first());

      if (singleCount >= 6) {
        for (let i = 0; i < Math.min(otp.length, singleCount); i++) {
          await singleDigitInputs.nth(i).click();
          await singleDigitInputs.nth(i).pressSequentially(otp[i], { delay: 50 });
        }
      } else {
        await otpInput.first().waitFor({ state: 'visible', timeout: 10000 });
        const input = otpInput.first();
        await input.click();
        await input.fill('');
        await page.evaluate((code) => navigator.clipboard.writeText(code), otp);
        await input.focus();
        await page.keyboard.press('Control+v');
        await delay(300);
        const filledValue = await input.inputValue().catch(() => '');
        if (!filledValue || filledValue.length < otp.length) {
          await input.pressSequentially(otp, { delay: 80 });
        }
      }
      const verifyBtn = page.getByRole('button', { name: /verify|submit|confirm/i }).or(page.locator('button[type="submit"]')).first();
      if (await verifyBtn.isVisible().catch(() => false)) {
        await verifyBtn.click();
      }
    }
  } catch (err) {
    console.log('Signup OTP error:', err.message);
    await yopmailPage.close().catch(() => {});
  }

  const continueBtn = page.getByRole('button', { name: /continue/i }).or(page.locator('button:has-text("Continue")')).first();
  try {
    await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
    await continueBtn.click();
  } catch {}
  await delay(2000);
}

test.describe('Cancel Subscription', () => {
  test.setTimeout(300000);

  test('signup, subscribe to Monthly Standard, then cancel subscription', async ({ page, context }) => {
    // Step 1: Signup
    console.log('Step 1: Signup...');
    await signup(page, context);
    await page.waitForLoadState('domcontentloaded');
    await delay(2000);
    console.log('✓ Step 1: Signup completed');

    // Step 2: Navigate to pricing page and select Monthly Standard plan
    console.log('Step 2: Navigating to pricing page...');
    const pricingLink = page.getByRole('listitem').filter({ hasText: 'Pricing' }).first();
    await pricingLink.waitFor({ state: 'visible', timeout: 10000 });
    await pricingLink.click();
    await page.waitForLoadState('domcontentloaded');
    await delay(3000);

    console.log('Step 2a: Clicking Monthly...');
    const monthlyOption = page.locator("xpath=//div[text() = ' Monthly ']");
    await monthlyOption.waitFor({ state: 'visible', timeout: 10000 });
    await monthlyOption.click();
    await delay(2000);
    console.log('✓ Step 2a: Clicked Monthly');

    const getStartedBtn = page.locator("xpath=//h3[contains(.,'Standard Student Plan')]/ancestor::div[contains(@class,'content-header')]//span[normalize-space()='Get Started']");
    await getStartedBtn.waitFor({ state: 'visible', timeout: 20000 });
    await delay(3000);
    await getStartedBtn.scrollIntoViewIfNeeded();
    await delay(500);
    await getStartedBtn.click();
    console.log('✓ Step 2: Clicked Get Started for Standard Student Plan');

    // Step 3: Wait for payment page
    console.log('Step 3: Waiting for payment page to load...');
    await expect(page).toHaveURL(/payment-method|payment/, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await delay(3000);
    console.log('✓ Step 3: Payment page loaded');

    // Step 4: Fill payment form
    console.log('Step 4: Filling payment form...');
    const firstNameInput = page.locator("xpath=//p[contains(.,'First Name') or contains(.,'Name on card')]/following-sibling::input[1]");
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.fill('Test', { delay: 80 });
    await delay(500);

    const lastNameInput = page.locator("xpath=//p[contains(.,'Last Name') or contains(.,'Name on card')]/following-sibling::input[1]");
    await lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await lastNameInput.fill('Card', { delay: 80 });
    await delay(500);

    const cardNumberInput = page.locator("xpath=//input[@placeholder = '1111  2222  3333  4444']");
    await cardNumberInput.waitFor({ state: 'visible', timeout: 10000 });
    await cardNumberInput.fill('4242424242424242', { delay: 80 });
    await delay(500);

    const expiryInput = page.locator("xpath=//p[contains(.,'Expiry')]/following-sibling::input[1]");
    await expiryInput.waitFor({ state: 'visible', timeout: 10000 });
    await expiryInput.fill('12/34', { delay: 80 });
    await delay(500);

    const cvcInput = page.locator("xpath=//p[contains(.,'CVC') or contains(.,'CVV')]/following-sibling::input[1]");
    await cvcInput.waitFor({ state: 'visible', timeout: 10000 });
    await cvcInput.fill('123', { delay: 80 });
    await delay(500);

    const zipInput = page.locator("xpath=//p[contains(.,'Zip Code')]/following-sibling::input[1]");
    await zipInput.waitFor({ state: 'visible', timeout: 10000 });
    await zipInput.fill('12345', { delay: 80 });
    await delay(500);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await delay(500);

    const cityInput = page.locator("xpath=//p[contains(.,'City')]/following-sibling::input[1]");
    await cityInput.waitFor({ state: 'visible', timeout: 10000 });
    await cityInput.fill('Test City', { delay: 80 });
    await delay(500);

    const addressInput = page.locator("xpath=//p[contains(.,'Address')]/following-sibling::input[1]");
    await addressInput.waitFor({ state: 'visible', timeout: 10000 });
    await addressInput.fill('123 Test Street', { delay: 80 });
    await delay(500);

    const payNowButton = page.locator("xpath=//span[text() = ' Pay Now ']");
    await payNowButton.waitFor({ state: 'visible', timeout: 10000 });
    await payNowButton.click();
    console.log('✓ Step 4: Payment submitted');
    await delay(5000);
    console.log('✓ All Monthly Standard steps completed');

    // Step 5: Wait 7 seconds before navigating
    console.log('Step 5: Waiting 7 seconds...');
    await delay(7000);
    console.log('✓ Step 5: Wait complete');

    // Step 6: Navigate to subscription page
    console.log('Step 6: Navigating to subscription page...');
    await page.goto(SUBSCRIPTION_URL);
    await page.waitForLoadState('domcontentloaded');
    await delay(3000);
    console.log('✓ Step 6: Subscription page loaded');

    // Step 7: Click Cancel Subscription
    console.log('Step 7: Clicking Cancel Subscription...');
    const cancelBtn = page.locator("xpath=//span[text() = ' Cancel Subscription ']");
    await cancelBtn.waitFor({ state: 'visible', timeout: 15000 });
    await cancelBtn.scrollIntoViewIfNeeded();
    await cancelBtn.click();
    console.log('✓ Step 7: Clicked Cancel Subscription');
    await delay(3000);

    // Step 8: Click Cancel Subscription confirmation button
    console.log('Step 8: Clicking Cancel Subscription confirmation...');
    const cancelConfirmBtn = page.locator("xpath=//span[text() = 'Cancel Subscription']");
    await cancelConfirmBtn.waitFor({ state: 'visible', timeout: 15000 });
    await cancelConfirmBtn.scrollIntoViewIfNeeded();
    await cancelConfirmBtn.click();
    console.log('✓ Step 8: Clicked Cancel Subscription confirmation');
    await delay(3000);

    console.log('✓ All steps completed successfully - Subscription cancelled');
  });
});
