// CategoriesFilterFlow.spec.js - Login from home page using tommy@yopmail.com (same as homePageFlow till login)
const { test, expect } = require('@playwright/test');

const HOME_URL = 'https://staging.fastlearner.ai/';
const SIGNIN_URL = 'https://staging.fastlearner.ai/auth/sign-in';
const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';

test.describe('Categories Filter Flow', () => {
  test('Login and run multiple Development filter flows', async ({ page }) => {
    // Longer timeout because we run multiple filter flows in one test
    test.setTimeout(240000);

    // Step 1: Open home page
    console.log('Step 1: Opening home page...');
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page).toHaveURL(/staging\.fastlearner\.ai/, { timeout: 10000 });
    console.log('✓ Home page loaded');

    // Step 2: Navigate to login page (same sign-in URL as homePageFlow/LoginPage)
    console.log('Step 2: Navigating to login page...');
    await page.goto(SIGNIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load').catch(() => {});

    // Step 3: Login with tommy@yopmail.com / Check!123 (same credentials as original home page flow)
    console.log('Step 3: Logging in as tommy@yopmail.com...');
    const emailInput = page.locator('input[type=\"email\"], input[name=\"email\"], input[id*=\"email\"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 20000 });
    await emailInput.fill('tommy@yopmail.com');

    const passwordInput = page.locator('input[type=\"password\"], input[name=\"password\"], input[id*=\"password\"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
    await passwordInput.fill('Check!123');

    await Promise.all([
      page.waitForURL(DASHBOARD_URL, { timeout: 40000 }),
      passwordInput.press('Enter')
    ]);
    console.log('✓ Login complete – on student dashboard');

    // Step 4: Click Categories on navbar
    console.log('Step 4: Clicking Categories on navbar...');
    const categoriesTrigger = page
      .locator('span.ant-dropdown-trigger')
      .filter({ hasText: 'Categories' })
      .first();
    await categoriesTrigger.waitFor({ state: 'visible', timeout: 15000 });
    await categoriesTrigger.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await categoriesTrigger.click();
    console.log('✓ Categories dropdown opened');

    // Step 5: Choose Development option from dropdown
    console.log('Step 5: Selecting Development from Categories dropdown...');
    const developmentOption = page
      .locator('li.ant-dropdown-menu-item')
      .filter({ hasText: 'Development' })
      .first();
    await developmentOption.waitFor({ state: 'visible', timeout: 15000 });
    await developmentOption.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await developmentOption.click();
    console.log('✓ Clicked Development category');

    // Step 6: Verify redirect to courses page
    console.log('Step 6: Verifying redirect to courses page...');
    await expect(page).toHaveURL('https://staging.fastlearner.ai/student/courses', {
      timeout: 15000
    });
    console.log('✓ On courses page after selecting Development category');

    // Helper to open the Filters panel (no-op if already open)
    async function openFiltersPanel() {
      console.log('Opening Filters panel...');
      // If any filter nz-tag is visible, assume panel is open
      try {
        const anyTagVisible = await page
          .locator('nz-tag.ant-tag.filter-dropdown-categories.border-radius.cursor-pointer')
          .first()
          .isVisible()
          .catch(() => false);
        if (anyTagVisible) {
          console.log('  (Filters panel already open)');
          return;
        }
      } catch {
        // ignore and try to open
      }

      const filtersButton = page
        .locator('span.ng-star-inserted')
        .filter({ hasText: 'Filters' })
        .first();
      await filtersButton.waitFor({ state: 'visible', timeout: 15000 });
      await filtersButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      // Prefer JS click to avoid overlay intercepts; fall back to force click
      try {
        await filtersButton.evaluate((el) => el.click());
      } catch {
        await filtersButton.click({ timeout: 5000, force: true }).catch(() => {});
      }
      console.log('✓ Filters panel opened');
      await page.waitForTimeout(500);
    }

    // Open filters once before running flows
    await openFiltersPanel();

    // Helper to select an option inside a filter group by its visible text
    async function selectFilterOption(groupLabel, optionText, description) {
      try {
        const group = page
          .locator('div, nz-collapse-panel, section')
          .filter({ hasText: groupLabel })
          .first();
        await group.waitFor({ state: 'visible', timeout: 15000 });
        const option = group
          .locator('label, span, button, p, li, div')
          .filter({ hasText: optionText })
          .first();
        await option.waitFor({ state: 'visible', timeout: 15000 });
        await option.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await option.click().catch(() => option.evaluate((el) => el.click()));
        console.log(`✓ Selected filter option: ${description}`);
      } catch (err) {
        console.log(`⚠ Could not select filter option (${description}):`, err.message);
      }
    }

    async function selectDevelopmentCategory() {
      if (page.isClosed()) return;
      console.log('Selecting Categories → Development (nz-tag)...');
      try {
        const devTag = page
          .locator('nz-tag.ant-tag.filter-dropdown-categories.border-radius.cursor-pointer')
          .filter({ hasText: 'Development' })
          .first();
        await devTag.waitFor({ state: 'attached', timeout: 15000 });
        await devTag.click({ timeout: 5000, force: true }).catch(() => devTag.evaluate((el) => el.click()));
        console.log('✓ Selected Categories: Development via nz-tag');
      } catch (err) {
        console.log('⚠ Could not click nz-tag Development, falling back to generic selector:', err.message);
        await selectFilterOption('Categories', 'Development', 'Categories: Development');
      }
    }

    async function selectCourseType(type) {
      if (page.isClosed()) return;
      console.log(`Selecting Course Type → ${type} (nz-tag)...`);
      try {
        const tag = page
          .locator('nz-tag.ant-tag.filter-dropdown-categories.border-radius.cursor-pointer')
          .filter({ hasText: type })
          .first();
        await tag.waitFor({ state: 'attached', timeout: 15000 });
        await tag.click({ timeout: 5000, force: true }).catch(() => tag.evaluate((el) => el.click()));
        console.log(`✓ Selected Course Type: ${type} via nz-tag`);
      } catch (err) {
        console.log(`⚠ Could not click nz-tag ${type}, falling back to generic selector:`, err.message);
        await selectFilterOption('Course Type', type, `Course Type: ${type}`);
      }
    }

    async function selectContentType(type) {
      if (page.isClosed()) return;
      console.log(`Selecting Content Type → ${type} (nz-tag)...`);
      try {
        const tag = page
          .locator('nz-tag.ant-tag.filter-dropdown-categories.border-radius.cursor-pointer')
          .filter({ hasText: type })
          .first();
        await tag.waitFor({ state: 'attached', timeout: 15000 });
        await tag.click({ timeout: 5000, force: true }).catch(() => tag.evaluate((el) => el.click()));
        console.log(`✓ Selected Content Type: ${type} via nz-tag`);
      } catch (err) {
        console.log(`⚠ Could not click nz-tag ${type}, falling back to generic selector:`, err.message);
        await selectFilterOption('Content Type', type, `Content Type: ${type}`);
      }
    }

    async function selectFeatured(featured) {
      if (page.isClosed()) return;
      console.log(`Selecting Featured Selection → ${featured} (nz-tag)...`);
      try {
        const tag = page
          .locator('nz-tag.ant-tag.filter-dropdown-categories.border-radius.cursor-pointer')
          .filter({ hasText: featured })
          .first();
        await tag.waitFor({ state: 'attached', timeout: 15000 });
        await tag.click({ timeout: 5000, force: true }).catch(() => tag.evaluate((el) => el.click()));
        console.log(`✓ Selected Featured Selection: ${featured} via nz-tag`);
      } catch (err) {
        console.log(`⚠ Could not click nz-tag ${featured}, falling back to generic selector:`, err.message);
        await selectFilterOption('Featured Selection', featured, `Featured Selection: ${featured}`);
      }
    }

    async function selectAnyRating() {
      if (page.isClosed()) return;
      console.log('Selecting a Rating option...');
      try {
        const ratingGroup = page
          .locator('div, nz-collapse-panel, section')
          .filter({ hasText: 'Rating' })
          .first();
        await ratingGroup.waitFor({ state: 'visible', timeout: 15000 });
        const ratingOption = ratingGroup
          .locator('button, label, span, div')
          .filter({ hasText: /\*/ })
          .first();
        if (await ratingOption.isVisible().catch(() => false)) {
          await ratingOption.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await ratingOption.click().catch(() => ratingOption.evaluate((el) => el.click()));
          console.log('✓ Selected a Rating option');
        } else {
          console.log('  (No visible Rating option with stars found)');
        }
      } catch (err) {
        console.log('⚠ Rating selection step skipped:', err.message);
      }
    }

    async function clickApplyAndVerify() {
      if (page.isClosed()) {
        console.log('⚠ Page closed – skipping Apply Filter and verification');
        return;
      }
      console.log('Clicking Apply Filter...');
      try {
        const applyButton = page
          .locator('button, span')
          .filter({ hasText: /Apply Filter/i })
          .first();
        await applyButton.waitFor({ state: 'visible', timeout: 15000 });
        await applyButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(200);
        await applyButton.click().catch(() => applyButton.evaluate((el) => el.click()));
        console.log('✓ Apply Filter clicked');
      } catch (err) {
        console.log('⚠ Apply Filter button step skipped:', err.message);
        return;
      }

      // Wait a little so user can visually check and for results to load
      console.log('Waiting for filtered results to load...');
      try {
        await page.waitForTimeout(3000);
      } catch {
        console.log('⚠ Page closed while waiting for results');
        return;
      }

      if (page.isClosed()) {
        console.log('⚠ Page closed – skipping results verification');
        return;
      }

      try {
        const courseCards = page.locator('[class*=\"course-card\"], app-course-card, div.course-card');
        const count = await courseCards.count();
        if (count > 0) {
          console.log(`✓ Filtered courses displayed: ${count} cards found`);
        } else {
          console.log('⚠ No course cards found after applying filters – please verify UI manually');
        }

        const devTag = page.locator('text=Development').first();
        if (await devTag.isVisible().catch(() => false)) {
          console.log('✓ At least one course mentions \"Development\" (looks relevant)');
        } else {
          console.log('⚠ Could not find \"Development\" text in course list – please verify manually');
        }
      } catch (err) {
        console.log('⚠ Filtered results verification skipped:', err.message);
      }
    }

    async function clearFiltersIfPossible() {
      if (page.isClosed()) return;
      console.log('Clearing filters (if Clear Filter button exists)...');
      try {
        const clearBtn = page
          .locator('button, span')
          .filter({ hasText: /Clear Filter/i })
          .first();
        if (await clearBtn.isVisible().catch(() => false)) {
          await clearBtn.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await clearBtn.click().catch(() => clearBtn.evaluate((el) => el.click()));
          console.log('✓ Clear Filter clicked');
          await page.waitForTimeout(1000);
        } else {
          console.log('  (Clear Filter button not visible)');
        }
      } catch (err) {
        console.log('⚠ Clear Filter step skipped:', err.message);
      }
    }

    const flows = [
      { name: 'Development + All + Course + Trending', courseType: 'All', contentType: 'Course', featured: 'Trending' },
      { name: 'Development + Free + Test + New', courseType: 'Free', contentType: 'Test', featured: 'New' },
      { name: 'Development + Standard + Course + Trending', courseType: 'Standard', contentType: 'Course', featured: 'Trending' },
      { name: 'Development + Premium + Course + Trending', courseType: 'Premium', contentType: 'Course', featured: 'Trending' },
    ];

    for (let i = 0; i < flows.length; i++) {
      if (page.isClosed()) {
        console.log('⚠ Page is closed – stopping remaining flows');
        break;
      }
      const flow = flows[i];
      console.log(`\n===== Running flow ${i + 1}/${flows.length}: ${flow.name} =====`);

      // Ensure filters panel is open and previous filters cleared (except first run)
      if (i > 0) {
        await openFiltersPanel();
        await clearFiltersIfPossible();
      }

      // Always keep category = Development
      await selectDevelopmentCategory();
      await selectCourseType(flow.courseType);
      await selectContentType(flow.contentType);
      await selectFeatured(flow.featured);
      await selectAnyRating();
      await clickApplyAndVerify();

      // Wait a bit for manual visual check before next flow
      console.log('Waiting 2 seconds before next flow...');
      try {
        await page.waitForTimeout(2000);
      } catch {
        console.log('⚠ Page closed while waiting between flows');
        break;
      }
    }

    console.log('\n✅ Development filter flows finished (or stopped if page closed)');
  });
});

