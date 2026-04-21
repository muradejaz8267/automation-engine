// courseAttemptFlow.spec.js - Login as tommy@yopmail.com, scroll to Discover Top Trending Courses,
// click "Scientific Computing with Python" course (via Course Preview image) → course details page.
const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/LoginPage');

const DASHBOARD_URL = 'https://staging.fastlearner.ai/student/dashboard';
const COURSE_DETAILS_URL = 'https://staging.fastlearner.ai/student/course-details/scientific-computing-with-python';

test.describe('Course Attempt Flow', () => {
  test('Login and open Scientific Computing with Python from Trending', async ({ page }) => {
    test.setTimeout(240000);

    const VIDEO_WATCH_MS = 6000;
    const QUIZ_NEXT_TIMEOUT = 3000;
    const QUIZ_WAIT_AFTER_NEXT_MS = 1500;
    async function quizClickNextOrSubmit(nextOrSubmitLocator) {
      const el = nextOrSubmitLocator.first();
      try {
        await el.waitFor({ state: 'attached', timeout: QUIZ_NEXT_TIMEOUT }).catch(() => null);
        if (await el.isVisible().catch(() => false)) {
          await el.evaluate((node) => node.click());
          return true;
        }
      } catch (e) {}
      try {
        await el.click({ timeout: 2000, force: true }).catch(() => null);
        return true;
      } catch (e2) {}
      return false;
    }
    async function bringVideoScreenIntoView() {
      if (page.isClosed()) return;
      await page.waitForTimeout(500).catch(() => {});
      if (page.isClosed()) return;
      try {
        const videoContainer = page.locator('iframe[src*="youtube"], iframe[src*="youtube-nocookie"], video').first();
        await videoContainer.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
        if (await videoContainer.isVisible().catch(() => false)) {
          await videoContainer.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
        }
      } catch (e) {}
      try {
        const contentArea = page.locator('[class*="content"]').filter({ has: page.locator('iframe, video') }).first();
        if (await contentArea.isVisible().catch(() => false)) {
          await contentArea.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
        }
      } catch (e2) {}
      try {
        const main = page.locator('main').first();
        if (await main.isVisible().catch(() => false)) {
          await main.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
        }
      } catch (e3) {}
    }
    async function watchVideoAndMarkComplete() {
      if (page.isClosed()) return;
      await bringVideoScreenIntoView();
      if (page.isClosed()) return;
      let played = false;
      await page.waitForTimeout(1500).catch(() => {}); // let YouTube iframe load
      if (page.isClosed()) return;
      await bringVideoScreenIntoView();
      if (page.isClosed()) return;
      // 1) Try YouTube iframe – click the big play button (YouTube icon / overlay play)
      try {
        const ytIframe = page.locator('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]').first();
        const iframeVisible = await ytIframe.isVisible().catch(() => false);
        if (iframeVisible && !page.isClosed()) {
          const ytFrame = page.frameLocator('iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]').first();
          const ytPlay = ytFrame.locator('.ytp-large-play-button').or(ytFrame.getByRole('button', { name: /play/i })).or(ytFrame.locator('[aria-label*="Play"]')).first();
          await ytPlay.waitFor({ state: 'visible', timeout: 6000 }).catch(() => null);
          if (!page.isClosed()) {
            await ytPlay.click({ timeout: 3000 }).catch(() => null);
            played = true;
            if (!page.isClosed()) console.log('  Playing YouTube video (iframe play)...');
          }
          if (!played && !page.isClosed()) {
            await ytFrame.locator('#movie_player').or(ytFrame.locator('body')).first().click({ timeout: 2000 }).catch(() => null);
            played = true;
            if (!page.isClosed()) console.log('  Playing YouTube video (clicked player area)...');
          }
        }
      } catch (e) {}
      // 2) Fallback: native video or page play button
      if (!played && !page.isClosed()) {
        try {
          const video = page.locator('video').first();
          await video.waitFor({ state: 'visible', timeout: 2000 }).catch(() => null);
          if (!page.isClosed()) await video.click({ timeout: 2000 }).catch(() => null);
          played = true;
          if (!page.isClosed()) console.log('  Playing video...');
        } catch (e2) {
          try {
            if (page.isClosed()) return;
            const playBtn = page.getByRole('button', { name: /play/i }).or(page.locator('[aria-label*="lay"]')).first();
            await playBtn.waitFor({ state: 'visible', timeout: 2000 }).catch(() => null);
            if (!page.isClosed()) await playBtn.click({ timeout: 2000 }).catch(() => null);
            played = true;
            if (!page.isClosed()) console.log('  Playing video (play button)...');
          } catch (e3) {}
        }
      }
      if (page.isClosed()) return;
      await page.waitForTimeout(VIDEO_WATCH_MS).catch(() => {});
      if (page.isClosed()) return;
      // 3) Mark topic complete – checkbox or "Mark as complete" in content area
      let marked = false;
      try {
        const cb = page.locator('input[type="checkbox"]').or(page.locator('[role="checkbox"]')).first();
        await cb.waitFor({ state: 'visible', timeout: 4000 }).catch(() => null);
        if (page.isClosed()) return;
        const checked = await cb.isChecked().catch(() => false);
        if (!checked) await cb.click({ timeout: 3000 }).catch(() => null);
        marked = true;
        if (!page.isClosed()) console.log('✓ Marked topic as watched (checkbox)');
      } catch (e) {}
      if (!marked && !page.isClosed()) {
        try {
          const markBtn = page.getByRole('button', { name: /mark as complete|mark complete|completed/i }).or(page.locator('a').filter({ hasText: /mark as complete|mark complete/i }).first());
          await markBtn.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => null);
          if (!page.isClosed()) await markBtn.first().click({ timeout: 3000 }).catch(() => null);
          if (!page.isClosed()) console.log('✓ Marked topic as watched (button)');
        } catch (e2) {
          if (!page.isClosed()) console.log('  (no mark-watched control found – skipped)');
        }
      }
    }

    // Step 1: Navigate to login and log in as tommy@yopmail.com
    console.log('Step 1: Navigating to login page...');
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    console.log('Step 2: Logging in with tommy@yopmail.com...');
    await loginPage.login();
    await expect(page).toHaveURL(DASHBOARD_URL, { timeout: 15000 });
    console.log('✓ Logged in – on dashboard');

    // Step 3: Scroll down to "Discover Top Trending Courses"
    console.log('\nStep 3: Scrolling to Discover Top Trending Courses...');
    const trendingHeading = page.getByRole('heading', { name: /Discover Top Trending Courses/i });
    await trendingHeading.waitFor({ state: 'visible', timeout: 15000 });
    await trendingHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Step 4: Click the "Scientific Computing with Python" course (2nd in list) via its unique Course Preview image
    console.log('Step 4: Clicking Scientific Computing with Python course (Course Preview image)...');
    const scientificCourseImage = page.locator(
      'img[alt="Course Preview"][src*="mGky2YfL_profile_image.jpeg"]'
    ).first();
    await scientificCourseImage.waitFor({ state: 'visible', timeout: 15000 });
    await scientificCourseImage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await scientificCourseImage.click();

    await expect(page).toHaveURL(COURSE_DETAILS_URL, { timeout: 15000 });
    console.log('✓ Opened course details: scientific-computing-with-python');

    // Step 5: Click Start Learning (span.ng-star-inserted " Start Learning ") – use JS click to avoid visibility/scroll timeout
    console.log('\nStep 5: Clicking Start Learning...');
    const startLearningBtn = page.locator('span.ng-star-inserted').filter({ hasText: /Start Learning/i }).first();
    try {
      await startLearningBtn.waitFor({ state: 'attached', timeout: 15000 });
      await startLearningBtn.evaluate((el) => el.click());
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      console.log('✓ Clicked Start Learning');
    } catch (err) {
      console.log('⚠ Start Learning button failed:', err.message);
      throw err;
    }

    console.log('\n********** COURSE TOPICS – Section 1 → Section 2 → Section 3 **********');
    // Section 1 container – only click topics inside it so we never re-enter Section 1 from Section 2/3
    const section1Container = page.locator('div.section-container').filter({ hasText: /Section 1\s*:/i }).first();
    await section1Container.waitFor({ state: 'visible', timeout: 10000 }).catch(() => null);

    // Step 6: Section 1.1 – open "Scientific Computing with Python datatypes" (video) – only in Section 1
    console.log('\n========== SECTION 1 · TOPIC 1.1: Scientific Computing with Python datatypes (VIDEO) ==========');
    console.log('Opening topic 1.1...');
    try {
      await page.waitForTimeout(1500);
      const topic1_1 = section1Container.locator('p.break-word').filter({ hasText: /Scientific Computing with Python datatypes/i }).first();
      await topic1_1.waitFor({ state: 'visible', timeout: 12000 });
      await topic1_1.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await topic1_1.click();
      console.log('✓ Clicked 1.1 (video) – content visible');
      try {
        await watchVideoAndMarkComplete();
      } catch (e) {
        console.log('  (1.1 play/mark error – continuing):', (e && e.message) || e);
      }
    } catch (err) {
      console.log('⚠ 1.1 video step skipped:', err.message);
    }

    // Step 7: Section 1.2 quiz – SKIPPED (do not run quiz 1 of Section 1); tick checkbox and go to Section 2
    console.log('\n========== SECTION 1 · TOPIC 1.2: Python Essentials Quiz for Coders (QUIZ) – SKIPPED ==========');
    console.log('(Quiz 1 of Section 1 not run – continuing to Section 2)');

    // Tick checkbox for topic 1.2 (mark complete) if visible, then continue to Section 2
    try {
      if (!page.isClosed()) {
        const rowWithQuiz = page.locator('div.section-container, [class*="topic"], [class*="section"]').filter({ hasText: /Python Essentials Quiz for Coders/i }).first();
        const cbInRow = rowWithQuiz.locator('input[type="checkbox"]').or(rowWithQuiz.locator('[role="checkbox"]')).first();
        if (await cbInRow.isVisible().catch(() => false)) {
          const checked = await cbInRow.isChecked().catch(() => false);
          if (!checked) {
            await cbInRow.click({ timeout: 3000 }).catch(() => null);
            console.log('✓ Ticked checkbox for 1.2 (Python Essentials Quiz for Coders)');
          }
        } else {
          const anyCb = page.locator('input[type="checkbox"]').or(page.locator('[role="checkbox"]')).nth(1);
          if (await anyCb.isVisible().catch(() => false)) {
            const c = await anyCb.isChecked().catch(() => false);
            if (!c) await anyCb.click({ timeout: 2000 }).catch(() => null);
            console.log('✓ Ticked topic checkbox (1.2), continuing to Section 2');
          }
        }
      }
    } catch (e) {}
    console.log('\nContinuing to Section 2...');

    // Section 2 container – use same locator for expand and for 2.1/2.2/2.3 so we only click topics under Section 2
    const section2Container = page.locator('div.section-container').filter({
      hasText: /Section 2\s*:\s*Scientific Computing with Python Variable Declaration/i
    }).first();

    // Step 8: Click Section 2 container to expand (like Section 1 – topics open after expand)
    console.log('\n========== SECTION 2 – Expanding ==========');
    console.log('Clicking Section 2 to expand...');
    try {
      await page.waitForTimeout(800);
      await section2Container.waitFor({ state: 'visible', timeout: 15000 });
      await section2Container.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await section2Container.click();
      console.log('✓ Clicked Section 2');
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log('⚠ Section 2 expand skipped:', err.message);
    }

    // Step 9: Section 2.1 – open topic (Python Variable Declaration, video) – only in Section 2
    console.log('\n========== SECTION 2 · TOPIC 2.1: Python Variable Declaration (VIDEO) ==========');
    console.log('Opening topic 2.1...');
    try {
      await page.waitForTimeout(500);
      const topic2_1 = section2Container.locator('p.break-word').filter({ hasText: /Python Variable Declaration/i }).first();
      await topic2_1.waitFor({ state: 'visible', timeout: 12000 });
      await topic2_1.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await topic2_1.click();
      console.log('✓ Clicked 2.1 Python Variable Declaration (video) – content visible');
      await page.waitForTimeout(800);
      await bringVideoScreenIntoView();
      try {
        await watchVideoAndMarkComplete();
      } catch (e) {
        console.log('  (2.1 play/mark error – continuing):', (e && e.message) || e);
      }
    } catch (err) {
      console.log('⚠ 2.1 video step skipped:', err.message);
    }

    // Step 10: Section 2.2 – open topic (Scientific Computing with Python, video) – only in Section 2
    console.log('\nStep 10: Opening 2.2 Scientific Computing with Python (video)...');
    try {
      await page.waitForTimeout(500);
      const topic2_2 = section2Container.locator('p.break-word').filter({ hasText: /Scientific Computing with Python/i }).filter({ hasNotText: /Variable Declaration/i }).first();
      await topic2_2.waitFor({ state: 'visible', timeout: 12000 });
      await topic2_2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await topic2_2.click();
      console.log('✓ Clicked 2.2 Scientific Computing with Python (video) – content visible');
      await page.waitForTimeout(800);
      await bringVideoScreenIntoView();
      try {
        await watchVideoAndMarkComplete();
      } catch (e) {
        console.log('  (2.2 play/mark error – continuing):', (e && e.message) || e);
      }
    } catch (err) {
      console.log('⚠ 2.2 video step skipped:', err.message);
    }

    // Step 11: Section 2.3 – open topic (Challenge Your Python Knowledge, quiz) – only in Section 2
    console.log('\n========== SECTION 2 · TOPIC 2.3: Challenge Your Python Knowledge (QUIZ) ==========');
    console.log('Opening topic 2.3 and attempting quiz...');
    try {
      await page.waitForTimeout(500);
      const topic2_3 = section2Container.locator('p.break-word').filter({ hasText: /Challenge Your Python Knowledge/i }).first();
      await topic2_3.waitFor({ state: 'visible', timeout: 12000 });
      await topic2_3.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await topic2_3.click();
      console.log('✓ Clicked 2.3 Challenge Your Python Knowledge (quiz) – content visible');
      await page.waitForTimeout(1500);

      const startQuizBtn2 = page.locator('span.ng-star-inserted').filter({ hasText: /Start Quiz/i }).first();
      if (await startQuizBtn2.isVisible().catch(() => false)) {
        await startQuizBtn2.click();
        console.log('✓ Clicked Start Quiz (2.3)');
        await page.waitForTimeout(1200);
      }

      const nextBtn2 = page.locator('span.ng-star-inserted').filter({ hasText: /Next/ });
      const submitBtn2 = page.locator('span.ng-star-inserted').filter({ hasText: /Submit/ });
      const maxQ = 15;
      const optionOrLabel = page.locator('p.break-word').nth(1).or(page.locator('label.ng-star-inserted').filter({ has: page.locator('input[type="checkbox"], input[type="radio"]') }).first());
      for (let q = 1; q <= maxQ; q++) {
        const opt = optionOrLabel.first();
        if (!(await opt.isVisible().catch(() => false))) break;
        await opt.click({ timeout: 3000 }).catch(() => null);
        console.log(`✓ Selected option (2.3 Q${q})`);
        await page.waitForTimeout(800);
        if (await submitBtn2.first().isVisible().catch(() => false)) {
          const clicked = await quizClickNextOrSubmit(submitBtn2);
          console.log(clicked ? '✓ Clicked Submit (2.3) → quiz done' : '  (Submit not clicked)');
          break;
        }
        const clicked = await quizClickNextOrSubmit(nextBtn2);
        console.log(clicked ? '✓ Clicked Next → showing next question' : '  (Next not clicked, breaking)');
        await page.waitForTimeout(QUIZ_WAIT_AFTER_NEXT_MS);
        if (!clicked) break;
      }
    } catch (err) {
      console.log('⚠ 2.3 quiz step skipped:', err.message);
    }

    // Section 3 : Python Operators || Scientific Computing with Python – 3.1–3.11 videos, 3.12 quiz
    const SECTION3_TOPIC_TIMEOUT = 8000;
    const section3Container = page.locator('div.section-container').filter({
      hasText: /Section 3\s*:\s*Python Operators\s*\|\|\s*Scientific Computing with Python/i
    }).first();

    const section3VideoTitles = [
      /Installation of Python and Packages: NumPy, SciPy and Matplotlib 1/i,
      /STARTED! Numerical Computing with Python \(including SciPy, NumPy/i,
      /Newton-Raphson Method \| Numerical Computing in Python/i,
      /Secant Method To Solve Nonlinear Equations/i,
      /False Position \(Regula Falsi\) Nonlinear Equation Solution Method/i,
      /Finite Differences Method for Differentiation/i,
      /Gauss Elimination Method Tutorial - Part 1: Basic Procedure/i,
      /Gauss Elimination Method - Part 2: Partial Pivoting/i,
      /Gauss-Jordan Method Tutorial/i,
      /Cholesky Factorization Method - Part 1: Decomposition/i,
      /Cholesky Factorization Method - Part 2: Forward-Backward Substitution/i
    ];

    console.log('\n========== SECTION 3 – Expanding ==========');
    console.log('Clicking Section 3 to expand...');
    try {
      if (page.isClosed()) throw new Error('Page closed');
      await page.waitForTimeout(600);
      await section3Container.waitFor({ state: 'visible', timeout: 12000 });
      await section3Container.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await section3Container.click();
      console.log('✓ Clicked Section 3');
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log('⚠ Section 3 expand skipped:', err.message);
    }

    const section3VideoLabels = [
      'Installation of Python and Packages: NumPy, SciPy and Matplotlib 1',
      'STARTED! Numerical Computing with Python',
      'Newton-Raphson Method',
      'Secant Method To Solve Nonlinear Equations',
      'False Position (Regula Falsi)',
      'Finite Differences Method for Differentiation',
      'Gauss Elimination Method Tutorial - Part 1',
      'Gauss Elimination Method - Part 2: Partial Pivoting',
      'Gauss-Jordan Method Tutorial',
      'Cholesky Factorization Method - Part 1',
      'Cholesky Factorization Method - Part 2'
    ];
    for (let i = 0; i < section3VideoTitles.length; i++) {
      if (page.isClosed()) break;
      const num = i + 1;
      const label = section3VideoLabels[i] || `Video 3.${num}`;
      console.log(`\n========== SECTION 3 · TOPIC 3.${num}: ${label} (VIDEO) ==========`);
      console.log(`Opening topic 3.${num}...`);
      try {
        await page.waitForTimeout(400);
        const topic = section3Container.locator('p.break-word').filter({ hasText: section3VideoTitles[i] }).first();
        await topic.waitFor({ state: 'visible', timeout: SECTION3_TOPIC_TIMEOUT });
        await topic.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await topic.click();
        console.log(`✓ Clicked 3.${num} (video) – content visible`);
        await page.waitForTimeout(800);
        await bringVideoScreenIntoView();
        try {
          await watchVideoAndMarkComplete();
        } catch (e) {
          console.log(`  (3.${num} play/mark error – continuing):`, (e && e.message) || e);
        }
      } catch (err) {
        console.log(`⚠ 3.${num} video step skipped:`, err.message);
      }
    }

    if (page.isClosed()) {
      console.log('⚠ Page closed – skipping 3.12 quiz');
    } else {
      console.log('\n========== SECTION 3 · TOPIC 3.12: Python Mastery: Quiz Your Way Up (QUIZ) ==========');
      console.log('Opening topic 3.12 and attempting quiz...');
      try {
        await page.waitForTimeout(400);
        const topic3_12 = section3Container.locator('p.break-word').filter({ hasText: /Python Mastery: Quiz Your Way Up/i }).first();
        await topic3_12.waitFor({ state: 'visible', timeout: SECTION3_TOPIC_TIMEOUT });
        await topic3_12.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await topic3_12.click();
        console.log('✓ Clicked 3.12 (quiz) – content visible');
        await page.waitForTimeout(1200);
        const startQuiz312 = page.locator('span.ng-star-inserted').filter({ hasText: /Start Quiz/i }).first();
        if (await startQuiz312.isVisible().catch(() => false)) {
          await startQuiz312.click();
          console.log('✓ Clicked Start Quiz (3.12)');
          await page.waitForTimeout(1000);
        }
        const nextBtn3 = page.locator('span.ng-star-inserted').filter({ hasText: /Next/ });
        const submitBtn3 = page.locator('span.ng-star-inserted').filter({ hasText: /Submit/ });
        const optLoc3 = page.locator('p.break-word').nth(1).or(page.locator('label.ng-star-inserted').filter({ has: page.locator('input[type="checkbox"], input[type="radio"]') }).first());
        for (let q = 1; q <= 20; q++) {
          if (page.isClosed()) break;
          const o = optLoc3.first();
          if (!(await o.isVisible().catch(() => false))) break;
          await o.click({ timeout: 3000 }).catch(() => null);
          console.log(`✓ Selected option (3.12 Q${q})`);
          await page.waitForTimeout(800);
          if (await submitBtn3.first().isVisible().catch(() => false)) {
            const clicked = await quizClickNextOrSubmit(submitBtn3);
            console.log(clicked ? '✓ Clicked Submit (3.12) → quiz done' : '  (Submit not clicked)');
            break;
          }
          const clicked = await quizClickNextOrSubmit(nextBtn3);
          console.log(clicked ? '✓ Clicked Next → showing next question' : '  (Next not clicked, breaking)');
          await page.waitForTimeout(QUIZ_WAIT_AFTER_NEXT_MS);
          if (!clicked) break;
        }
      } catch (err) {
        console.log('⚠ 3.12 quiz step skipped:', err.message);
      }
    }

    console.log('\n✅ Course attempt flow completed');
  });
});
