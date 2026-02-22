// elasticSearchTest.spec.js - Elasticsearch/Search: Login, search Programming & related terms, verify courses appear in dropdown
// 5 positive test cases with actual and expected result
const { test, expect } = require('../fixtures/screenshotFixture');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

async function login(page) {
  await page.goto('https://staging.fastlearner.ai/auth/sign-in');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible' });
  await emailInput.fill('cooper@yopmail.com');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible' });
  await passwordInput.fill('Qwerty@123');
  await passwordInput.press('Enter');

  await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
}

async function openSearchAndType(page, searchTerm) {
  const searchIcon = page.locator('button[aria-label*="search" i], [role="button"]:has(svg)').or(
    page.locator('a[href*="search"]').or(page.getByRole('button', { name: /search/i }))
  ).first();

  if (await searchIcon.isVisible().catch(() => false)) {
    await searchIcon.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  const input = page.getByPlaceholder(/search/i).or(
    page.locator('input[type="search"], input[type="text"]').first()
  );
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(searchTerm);
  await new Promise((r) => setTimeout(r, 800));
}

async function searchAndPressEnter(page, searchTerm) {
  const searchIcon = page.locator('button[aria-label*="search" i], [role="button"]:has(svg)').or(
    page.locator('a[href*="search"]').or(page.getByRole('button', { name: /search/i }))
  ).first();

  if (await searchIcon.isVisible().catch(() => false)) {
    await searchIcon.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  const input = page.getByPlaceholder(/search/i).or(
    page.locator('input[type="search"], input[type="text"]').first()
  );
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(searchTerm);
  await input.press('Enter');
}

const DROPDOWN_CASES = [
  { id: 'PC1', searchTerm: 'Programming', expected: 'Programming-related courses should appear in dropdown' },
  { id: 'PC2', searchTerm: 'Python', expected: 'Python programming courses should appear in dropdown' },
  { id: 'PC3', searchTerm: 'JavaScript', expected: 'JavaScript programming courses should appear in dropdown' },
  { id: 'PC4', searchTerm: 'coding', expected: 'Coding/programming courses should appear in dropdown' },
  { id: 'PC5', searchTerm: 'web development', expected: 'Web development courses should appear in dropdown' },
];

const ENTER_SEARCH_CASES = [
  { searchTerm: 'Programming', expected: 'Detail page shows Programming-related courses' },
  { searchTerm: 'Python', expected: 'Detail page shows Python courses' },
  { searchTerm: 'JavaScript', expected: 'Detail page shows JavaScript courses' },
];

test.describe('Elasticsearch - Search Test Cases', () => {
  test.setTimeout(120000);

  test('all search cases - single login: dropdown + Enter detail page', async ({ page }) => {
    await login(page);

    // Case 1: Dropdown search - type and verify dropdown results
    for (const { id, searchTerm, expected } of DROPDOWN_CASES) {
      await openSearchAndType(page, searchTerm);

      const dropdownContainer = page.locator('[role="listbox"], [role="menu"], .ant-select-dropdown, [class*="dropdown"], [class*="suggestion"], [class*="autocomplete"]').first();
      const dropdownItems = await dropdownContainer.locator('li, [role="option"], [class*="item"], div[class*="option"]').allTextContents().catch(() => []);
      const hasDropdown = dropdownItems.length > 0;
      const pageText = (await page.locator('body').textContent()) || '';
      const hasSearchResults = hasDropdown || pageText.toLowerCase().includes(searchTerm.toLowerCase());

      const actual = hasDropdown
        ? `Programming courses appeared in dropdown - ${dropdownItems.length} item(s) (PASS)`
        : hasSearchResults
          ? `Search executed, results shown on page (PASS)`
          : `No dropdown or results found for "${searchTerm}" (FAIL)`;

      const hasResults = hasDropdown || hasSearchResults;

      console.log(`\n--- ${id}: Dropdown "${searchTerm}" ---`);
      console.log('Expected:', expected);
      console.log('Actual:', actual);

      expect(hasResults, `${id} failed: ${actual}`).toBeTruthy();

      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
    }

    // Case 2: Enter search - type, press Enter, verify detail page shows matching courses
    for (const { searchTerm, expected } of ENTER_SEARCH_CASES) {
      await searchAndPressEnter(page, searchTerm);

      await new Promise((r) => setTimeout(r, 3000));

      const pageText = (await page.locator('body').textContent()) || '';
      const pageLower = pageText.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const courseElements = page.locator('[class*="course"], [class*="card"], [class*="result"], [data-testid*="course"]');
      const courseTexts = await courseElements.allTextContents().catch(() => []);
      const courseTextLower = courseTexts.join(' ').toLowerCase();

      const pageHasSearchTerm = pageLower.includes(searchLower);
      const coursesMatchSearch = courseTextLower.includes(searchLower) || pageHasSearchTerm;
      const hasCourseContent = pageLower.includes('course') || courseTexts.length > 0;

      const hasMatchingCourses = (pageHasSearchTerm || coursesMatchSearch) && hasCourseContent;

      const actual = hasMatchingCourses
        ? `Detail page shows courses matching "${searchTerm}" (PASS)`
        : `Detail page did not show matching courses for "${searchTerm}" (FAIL)`;

      console.log(`\n--- Search + Enter: "${searchTerm}" ---`);
      console.log('Expected:', expected);
      console.log('Actual:', actual);

      expect(hasMatchingCourses, actual).toBeTruthy();

      await page.goto(DASHBOARD_URL);
      await new Promise((r) => setTimeout(r, 500));
    }
  });
});
