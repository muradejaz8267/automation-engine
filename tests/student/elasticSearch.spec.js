// elasticSearch.spec.js - Login, go to Elasticsearch search, search "programming", verify results are related
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://staging.fastlearner.ai';
const DASHBOARD_URL = `${BASE_URL}/student/dashboard`;
const SEARCH_QUERY = 'programming';
// Keywords that indicate search results are related to "programming"
const RELATED_KEYWORDS = ['programming', 'program', 'code', 'coding', 'software', 'developer', 'course', 'learn', 'python', 'javascript', 'java', 'web', 'development'];

test.describe('Student Elasticsearch Test', () => {
  test('should login, search programming in Elasticsearch, and verify results are related', async ({ page }) => {
    test.setTimeout(60000);

    // Step 1: Login
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible' });
    await emailInput.fill('cooper@yopmail.com');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill('Qwerty@123');

    await passwordInput.press('Enter');

    await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });

    // Step 2: Go to Elasticsearch / Search and search "programming"
    const searchUrl = `${BASE_URL}/student/search`;
    await page.goto(searchUrl);
    await page.waitForLoadState('domcontentloaded');

    // If we were redirected back to dashboard, try clicking Search/Elastic link in nav
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || !currentUrl.includes('search')) {
      const searchLink = page.getByRole('link', { name: /search/i }).or(page.getByRole('button', { name: /search/i })).or(page.locator('a:has-text("Search")')).or(page.locator('a:has-text("Elastic")')).first();
      if (await searchLink.isVisible().catch(() => false)) {
        await searchLink.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }

    // Find search input (placeholder or role or type search)
    const searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.locator('input[type="search"]'))
      .or(page.locator('input[name*="search" i]'))
      .or(page.getByRole('searchbox'))
      .first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(SEARCH_QUERY);
    await searchInput.press('Enter');

    // Wait for results to load
    await new Promise((r) => setTimeout(r, 3000));

    // Step 3: Verify that results are related to what we searched
    const bodyText = await page.locator('body').textContent();
    const resultsArea = page.locator('[class*="result"], [class*="search"], [class*="card"], [class*="course"], [class*="list"]').first();
    let contentToCheck = bodyText || '';
    if (await resultsArea.count() > 0) {
      const resultsText = await resultsArea.textContent().catch(() => '');
      if (resultsText) contentToCheck = resultsText;
    }

    const contentLower = contentToCheck.toLowerCase();
    const hasRelatedContent = RELATED_KEYWORDS.some((kw) => contentLower.includes(kw));

    if (!hasRelatedContent) {
      throw new Error(
        `Elasticsearch Test FAILED: Search results do not appear related to "${SEARCH_QUERY}". ` +
        `Expected to see at least one of: ${RELATED_KEYWORDS.join(', ')}. Check report for details.`
      );
    }

    await page.context().close();
  });
});
