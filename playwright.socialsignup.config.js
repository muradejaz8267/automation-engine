// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/** Social signup - sirf Chrome/Chromium par chalega */
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/student/socialSignup.spec.js',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
});
