/**
 * Fixture that sends screenshots to test panel when SCREENSHOT_API_URL is set.
 * Use this for specs that run from the test panel to show live browser view.
 */
const { test: base, expect } = require('@playwright/test');
const http = require('http');

const SCREENSHOT_API = process.env.SCREENSHOT_API_URL || '';

function postScreenshot(base64) {
  if (!SCREENSHOT_API) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const body = JSON.stringify({ screenshot: base64 });
      const url = new URL(SCREENSHOT_API + '/api/screenshot');
      const req = http.request({
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      }, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve());
      });
      req.on('error', () => resolve());
      req.write(body);
      req.end();
    } catch {
      resolve();
    }
  });
}

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    let interval;
    if (SCREENSHOT_API) {
      interval = setInterval(async () => {
        try {
          const buf = await page.screenshot({ type: 'jpeg', quality: 70 }).catch(() => null);
          if (buf) await postScreenshot(buf.toString('base64'));
        } catch {}
      }, 1200);
    }
    await use(page);
    if (interval) clearInterval(interval);
  }
});

// Wait 5 seconds before closing browser after test completes
test.afterEach(async () => {
  await new Promise((r) => setTimeout(r, 5000));
});

module.exports = { test, expect };
