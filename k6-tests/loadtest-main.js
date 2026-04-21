/**
 * ============================================================
 *  FastLearner.ai — Comprehensive Load Test
 *  Tool: k6 (https://k6.io)
 *  Target: https://fastlearner.ai/
 *  Strategy: Ramp 0 → 5000 VUs over 15 min, sustain 15 min, ramp down
 *  Author: Senior Performance Test Engineer
 * ============================================================
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ── Custom Metrics ─────────────────────────────────────────────
const loginErrors        = new Counter('login_errors');
const courseLoadErrors   = new Counter('course_load_errors');
const enrollErrors       = new Counter('enrollment_errors');
const dashboardErrors    = new Counter('dashboard_errors');
const errorRate          = new Rate('error_rate');
const loginDuration      = new Trend('login_duration', true);
const homepageDuration   = new Trend('homepage_duration', true);
const courseBrowseDuration = new Trend('course_browse_duration', true);
const dashboardDuration  = new Trend('dashboard_duration', true);
const enrollDuration     = new Trend('enrollment_duration', true);
const activeUsers        = new Gauge('active_users');

// ── Base Configuration ─────────────────────────────────────────
const BASE_URL = 'https://fastlearner.ai';
const API_URL  = 'https://fastlearner.ai/api';

// Threshold: p95 < 3s, error rate < 1%
export const options = {
  // ── Load Stages ───────────────────────────────────────────────
  stages: [
    { duration: '2m',  target: 100  },   // Warm-up: 0 → 100
    { duration: '3m',  target: 500  },   // Ramp-up: 100 → 500
    { duration: '5m',  target: 1000 },   // Ramp-up: 500 → 1000
    { duration: '5m',  target: 2500 },   // Ramp-up: 1000 → 2500
    { duration: '5m',  target: 5000 },   // Ramp-up: 2500 → 5000 (peak)
    { duration: '15m', target: 5000 },   // Sustain: 5000 VUs for 15 min
    { duration: '5m',  target: 2500 },   // Ramp-down: 5000 → 2500
    { duration: '5m',  target: 0    },   // Cool-down: 2500 → 0
  ],

  // ── Thresholds ────────────────────────────────────────────────
  thresholds: {
    // HTTP performance
    http_req_duration:            ['p(95)<3000', 'p(99)<5000'],
    http_req_failed:              ['rate<0.01'],   // < 1% error rate

    // Custom metric thresholds
    login_duration:               ['p(95)<4000'],
    homepage_duration:            ['p(95)<2000'],
    course_browse_duration:       ['p(95)<3000'],
    dashboard_duration:           ['p(95)<3500'],
    enrollment_duration:          ['p(95)<4000'],
    error_rate:                   ['rate<0.01'],
  },

  // ── Output ────────────────────────────────────────────────────
  ext: {
    loadimpact: {
      projectID: 0,
      name: 'FastLearner Load Test — 5000 VUs',
    },
  },
};

// ── Shared Test Data ───────────────────────────────────────────
const users = new SharedArray('users', function () {
  return [
    { email: 'loadtest1@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest2@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest3@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest4@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest5@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest6@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest7@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest8@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest9@yopmail.com',  password: 'TestPass@123' },
    { email: 'loadtest10@yopmail.com', password: 'TestPass@123' },
  ];
});

const courseIds = new SharedArray('courses', function () {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
});

// ── Common Headers ─────────────────────────────────────────────
const commonHeaders = {
  'Accept': 'application/json, text/html, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'User-Agent': 'k6-load-test/1.0 (FastLearner Performance Test)',
};

// ── Setup: verify target is reachable ─────────────────────────
export function setup() {
  const res = http.get(BASE_URL, { headers: commonHeaders, timeout: '30s' });
  if (res.status !== 200) {
    console.warn(`⚠️  Setup check: Homepage returned ${res.status}`);
  }
  console.log(`✅ Setup complete. Target: ${BASE_URL} — Status: ${res.status}`);
  return { targetReachable: res.status === 200 };
}

// ═══════════════════════════════════════════════════════════════
//  SCENARIO FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Scenario 1: Homepage Load
 * Weight: 30% of users — simulates anonymous browsing
 */
function scenarioHomepage() {
  group('Homepage Load', function () {
    const start = Date.now();

    const res = http.get(BASE_URL, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'homepage' },
    });

    homepageDuration.add(Date.now() - start);

    const passed = check(res, {
      'homepage: status 200':            (r) => r.status === 200,
      'homepage: response time < 2s':    (r) => r.timings.duration < 2000,
      'homepage: body not empty':        (r) => r.body && r.body.length > 500,
      'homepage: no server error':       (r) => r.status < 500,
    });

    errorRate.add(!passed);
    if (!passed) courseLoadErrors.add(1);

    sleep(randomIntBetween(1, 3));

    // Also hit pricing page
    const pricingRes = http.get(`${BASE_URL}/pricing`, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'pricing' },
    });

    check(pricingRes, {
      'pricing: status ok': (r) => r.status === 200 || r.status === 304,
      'pricing: response time < 3s': (r) => r.timings.duration < 3000,
    });

    sleep(randomIntBetween(1, 4));
  });
}

/**
 * Scenario 2: User Login
 * Weight: 20% of users
 */
function scenarioLogin() {
  group('User Login', function () {
    const user = randomItem(users);
    const start = Date.now();

    // Step 1: Load login page
    const loginPageRes = http.get(`${BASE_URL}/auth/sign-in`, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'login_page' },
    });

    check(loginPageRes, {
      'login page: status 200': (r) => r.status === 200,
    });

    sleep(randomIntBetween(1, 2));

    // Step 2: Submit credentials
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginRes = http.post(`${API_URL}/auth/sign-in`, loginPayload, {
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/auth/sign-in`,
      },
      timeout: '30s',
      tags: { scenario: 'login_submit' },
    });

    loginDuration.add(Date.now() - start);

    const loginPassed = check(loginRes, {
      'login: status 200 or 201':          (r) => r.status === 200 || r.status === 201,
      'login: has token in response':      (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token || body.accessToken || body.data?.token;
        } catch { return false; }
      },
      'login: response time < 4s':         (r) => r.timings.duration < 4000,
      'login: no server error':            (r) => r.status < 500,
    });

    errorRate.add(!loginPassed);
    if (!loginPassed) loginErrors.add(1);

    // Extract token for authenticated requests
    let token = null;
    try {
      const body = JSON.parse(loginRes.body);
      token = body.token || body.accessToken || body.data?.token;
    } catch {}

    sleep(randomIntBetween(2, 4));
    return token;
  });
}

/**
 * Scenario 3: Course Browsing
 * Weight: 25% of users
 */
function scenarioCourseBrowse() {
  group('Course Browsing', function () {
    const start = Date.now();

    // Hit courses listing
    const coursesRes = http.get(`${BASE_URL}/courses`, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'courses_list' },
    });

    check(coursesRes, {
      'courses list: status ok':           (r) => r.status === 200 || r.status === 304,
      'courses list: response < 3s':       (r) => r.timings.duration < 3000,
    });

    sleep(randomIntBetween(1, 2));

    // API: Fetch course list
    const apiCoursesRes = http.get(`${API_URL}/courses?page=1&limit=20`, {
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      timeout: '30s',
      tags: { scenario: 'api_courses' },
    });

    const coursePassed = check(apiCoursesRes, {
      'api courses: status ok':            (r) => r.status === 200,
      'api courses: has data':             (r) => {
        try { return JSON.parse(r.body).data?.length > 0 || JSON.parse(r.body).courses?.length > 0; }
        catch { return r.body.length > 10; }
      },
      'api courses: response < 3s':        (r) => r.timings.duration < 3000,
    });

    courseBrowseDuration.add(Date.now() - start);
    errorRate.add(!coursePassed);
    if (!coursePassed) courseLoadErrors.add(1);

    // Browse a specific course detail
    const courseId = randomItem(courseIds);
    const courseDetailRes = http.get(`${BASE_URL}/courses/${courseId}`, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'course_detail' },
    });

    check(courseDetailRes, {
      'course detail: status ok':          (r) => r.status === 200 || r.status === 404,
      'course detail: response < 3s':      (r) => r.timings.duration < 3000,
    });

    sleep(randomIntBetween(2, 5));
  });
}

/**
 * Scenario 4: Authenticated Full Flow (Login → Dashboard → Enroll)
 * Weight: 15% of users
 */
function scenarioAuthenticatedFlow() {
  group('Authenticated Flow', function () {
    const user = randomItem(users);

    // Step 1: Login
    const loginPayload = JSON.stringify({ email: user.email, password: user.password });
    const loginRes = http.post(`${API_URL}/auth/sign-in`, loginPayload, {
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      timeout: '30s',
      tags: { scenario: 'auth_login' },
    });

    let authToken = null;
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.token || body.accessToken || body.data?.token;
    } catch {}

    if (!authToken) {
      loginErrors.add(1);
      errorRate.add(1);
      sleep(2);
      return;
    }

    const authHeaders = {
      ...commonHeaders,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    sleep(randomIntBetween(1, 2));

    // Step 2: Load Dashboard
    const dashStart = Date.now();
    const dashRes = http.get(`${BASE_URL}/student/dashboard`, {
      headers: authHeaders,
      timeout: '30s',
      tags: { scenario: 'dashboard' },
    });

    dashboardDuration.add(Date.now() - dashStart);

    const dashPassed = check(dashRes, {
      'dashboard: status ok':              (r) => r.status === 200 || r.status === 302,
      'dashboard: response < 3.5s':        (r) => r.timings.duration < 3500,
      'dashboard: no 401':                 (r) => r.status !== 401,
    });

    errorRate.add(!dashPassed);
    if (!dashPassed) dashboardErrors.add(1);

    sleep(randomIntBetween(2, 4));

    // Step 3: Browse courses as authenticated user
    const authCoursesRes = http.get(`${API_URL}/courses?page=1&limit=10`, {
      headers: authHeaders,
      timeout: '30s',
      tags: { scenario: 'auth_courses' },
    });

    check(authCoursesRes, {
      'auth courses: status ok':           (r) => r.status === 200,
    });

    sleep(randomIntBetween(1, 3));

    // Step 4: Enrollment attempt
    const courseId = randomItem(courseIds);
    const enrollStart = Date.now();
    const enrollRes = http.post(`${API_URL}/enroll`, JSON.stringify({ courseId }), {
      headers: authHeaders,
      timeout: '30s',
      tags: { scenario: 'enrollment' },
    });

    enrollDuration.add(Date.now() - enrollStart);

    const enrollPassed = check(enrollRes, {
      'enroll: no server error':           (r) => r.status < 500,
      'enroll: response < 4s':             (r) => r.timings.duration < 4000,
    });

    errorRate.add(!enrollPassed);
    if (!enrollPassed) enrollErrors.add(1);

    sleep(randomIntBetween(2, 5));
  });
}

/**
 * Scenario 5: Static Asset Load
 * Weight: 10% of users — simulates first-time visitors loading assets
 */
function scenarioStaticAssets() {
  group('Static Assets', function () {
    const pages = [
      `${BASE_URL}/`,
      `${BASE_URL}/pricing`,
      `${BASE_URL}/auth/sign-in`,
      `${BASE_URL}/auth/sign-up`,
    ];

    const page = randomItem(pages);
    const res = http.get(page, {
      headers: commonHeaders,
      timeout: '30s',
      tags: { scenario: 'static' },
    });

    check(res, {
      'static: status ok':                 (r) => r.status === 200 || r.status === 304,
      'static: response < 2s':             (r) => r.timings.duration < 2000,
    });

    sleep(randomIntBetween(1, 3));
  });
}

// ═══════════════════════════════════════════════════════════════
//  MAIN VU FUNCTION — Weighted Scenario Distribution
// ═══════════════════════════════════════════════════════════════
export default function (data) {
  activeUsers.add(1);

  // Weighted distribution of user behaviors
  const rand = Math.random() * 100;

  if (rand < 30) {
    // 30% — Homepage / anonymous browsing
    scenarioHomepage();
  } else if (rand < 50) {
    // 20% — Login only
    scenarioLogin();
  } else if (rand < 75) {
    // 25% — Course browsing (unauthenticated)
    scenarioCourseBrowse();
  } else if (rand < 90) {
    // 15% — Full authenticated flow
    scenarioAuthenticatedFlow();
  } else {
    // 10% — Static asset loading
    scenarioStaticAssets();
  }

  activeUsers.add(-1);

  // Think time between iterations (simulate real users)
  sleep(randomIntBetween(1, 5));
}

// ── Teardown ───────────────────────────────────────────────────
export function teardown(data) {
  console.log('✅ Load test completed.');
  console.log(`Target was reachable: ${data.targetReachable}`);
}
