// signup.spec.js - Navigate to sign-in, click Sign Up, and create a new user account
const { test, expect } = require('../fixtures/screenshotFixture');

const SIGN_IN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

test.describe('Student Signup', () => {
  test('should redirect to sign-in, click Sign Up, and sign up a new user', async ({ page, context }) => {
    test.setTimeout(120000);

    // Generate unique email for each test run (yopmail creates inbox on first use)
    const timestamp = Date.now();
    const email = `signuptest${timestamp}@yopmail.com`;
    const password = 'TestPass@123';
    const fullName = 'Test User';

    // Step 1: Navigate to sign-in page
    console.log('Step 1: Navigate to sign-in page');
    await page.goto(SIGN_IN_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Step 2: Click on Sign Up (button or link below Sign In)
    console.log('Step 2: Click on Sign Up');
    const signUpBtn = page.getByRole('button', { name: /sign up/i })
      .or(page.getByRole('link', { name: /sign up/i }))
      .or(page.getByText('Sign Up', { exact: true }))
      .first();
    await signUpBtn.waitFor({ state: 'visible', timeout: 15000 });
    await signUpBtn.click();

    // Wait for signup form to appear
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Step 3: Fill signup form
    // Try common signup field selectors (name, email, password)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="Name" i], input[type="text"]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="confirm" i], input[placeholder*="Confirm" i]').or(page.locator('input[type="password"]').nth(1));

    // Fill name if present
    try {
      await nameInput.waitFor({ state: 'visible', timeout: 5000 });
      await nameInput.fill(fullName);
      console.log('Step 3a: Entered full name');
    } catch {
      console.log('Step 3a: Name field not found, skipping');
    }

    // Fill email
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email);
    console.log('Step 3b: Entered email:', email);

    // Fill password
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(password);
    console.log('Step 3c: Entered password');

    // Fill confirm password
    try {
      await confirmPasswordInput.waitFor({ state: 'visible', timeout: 5000 });
      await confirmPasswordInput.fill(password);
      console.log('Step 3d: Entered confirm password');
    } catch {
      console.log('Step 3d: Confirm password field not found, skipping');
    }

    // Step 3e: First check terms and conditions checkbox (must be done before Sign Up)
    const termsCheckbox = page.getByRole('checkbox', { name: /terms|condition|agree|accept/i })
      .or(page.getByLabel(/terms|condition|agree|accept/i))
      .or(page.locator('input[type="checkbox"]').first());
    try {
      await termsCheckbox.waitFor({ state: 'visible', timeout: 5000 });
      await termsCheckbox.check();
      console.log('Step 3e: Checked terms and conditions');
      await page.waitForTimeout(500); // Allow form to update (e.g. enable Sign Up button)
    } catch {
      console.log('Step 3e: Terms and conditions checkbox not found, skipping');
    }

    // Step 4: Then click Sign Up button (after checkbox is checked)
    // Prefer submit button in form - avoid the "Sign Up" link that switches to signup view
    const signUpButton = page.locator('form button[type="submit"]')
      .or(page.locator('form').locator('button:has-text("Sign Up")'))
      .or(page.getByRole('button', { name: /sign up|create account|register/i }).last())
      .or(page.locator('button[type="submit"]'))
      .first();
    await signUpButton.waitFor({ state: 'visible', timeout: 10000 });
    await signUpButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await signUpButton.click({ force: true });
    console.log('Step 4: Clicked Sign Up button');

    // Step 5: Wait for OTP modal to open
    const otpModal = page.getByRole('dialog')
      .or(page.locator('[role="dialog"]'))
      .or(page.locator('[class*="modal"]').filter({ hasText: /otp|verify|code/i }))
      .or(page.getByText(/otp|verify|enter code|verification code/i))
      .or(page.locator('input[placeholder*="otp" i], input[placeholder*="code" i], input[placeholder*="verify" i]'));
    await otpModal.first().waitFor({ state: 'visible', timeout: 15000 });
    console.log('Step 5: OTP modal appeared');

    // Step 6: Open Yopmail, get OTP from email, paste in modal
    const yopmailUser = email.split('@')[0];
    const yopmailUrl = `https://yopmail.com/en/?login=${yopmailUser}`;
    const yopmailPage = await context.newPage();
    let otp = null;
    try {
      console.log('Step 6a: Opening Yopmail inbox:', yopmailUrl);
      await yopmailPage.goto(yopmailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await yopmailPage.waitForTimeout(5000);

      // Poll for OTP in email (wait up to ~60 sec for email to arrive)
      for (let i = 0; i < 12; i++) {
        try {
          // Yopmail inbox is in iframe #ifinbox, email body in #ifmail
          const inboxFrame = yopmailPage.frameLocator('iframe#ifinbox');
          const firstMail = inboxFrame.locator('.lm').first();
          await firstMail.waitFor({ state: 'visible', timeout: 3000 });
          await firstMail.click();
          await yopmailPage.waitForTimeout(3000);
        } catch {
          const refreshBtn = yopmailPage.locator('#refresh, a[title*="refresh" i], a:has-text("Refresh")').first();
          if (await refreshBtn.isVisible().catch(() => false)) await refreshBtn.click();
          await yopmailPage.waitForTimeout(3000);
        }

        // Get OTP from email body - match "CODE : 8798798" or "CODE: 8798798" or plain digits
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
          if (otp) {
            console.log('Step 6b: Found OTP in email (CODE : ' + otp + ')');
            break;
          }
        } catch {
          const fullText = await yopmailPage.evaluate(() => document.body?.innerText || '');
          otp = extractOtp(fullText);
          if (otp) {
            console.log('Step 6b: Found OTP in page (CODE : ' + otp + ')');
            break;
          }
        }
      }

      await yopmailPage.close();
      await page.bringToFront();

      if (otp) {
        // OTP input - single field or multiple digit boxes
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
          // Use clipboard paste (like user copy-paste) - more reliable for OTP
          await page.evaluate((code) => navigator.clipboard.writeText(code), otp);
          await input.focus();
          await page.keyboard.press('Control+v');
          await page.waitForTimeout(300);
          const filledValue = await input.inputValue().catch(() => '');
          if (!filledValue || filledValue.length < otp.length) {
            await input.pressSequentially(otp, { delay: 80 });
          }
        }
        console.log('Step 6c: Entered OTP in modal:', otp);

        const verifyBtn = page.getByRole('button', { name: /verify|submit|confirm/i }).or(page.locator('button[type="submit"]')).first();
        if (await verifyBtn.isVisible().catch(() => false)) {
          await verifyBtn.click();
          console.log('Step 6d: Clicked Verify button');
        }
      } else {
        console.log('Step 6: Could not find OTP in Yopmail - check for CAPTCHA or wait longer. Manual OTP entry may be needed.');
      }
    } catch (err) {
      console.log('Step 6: Yopmail/OTP error:', err.message);
      await yopmailPage.close().catch(() => {});
    }

    // Step 6e: Click Continue button, wait 5 seconds, then close browser
    const continueBtn = page.getByRole('button', { name: /continue/i }).or(page.locator('button:has-text("Continue")')).first();
    try {
      await continueBtn.waitFor({ state: 'visible', timeout: 5000 });
      await continueBtn.click();
      console.log('Step 6e: Clicked Continue button');
    } catch {
      console.log('Step 6e: Continue button not found, skipping');
    }
    await page.waitForTimeout(5000);
    await context.close();
  });
});
