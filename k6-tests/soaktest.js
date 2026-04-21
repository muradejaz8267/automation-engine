/**
 * ============================================================
 *  FastLearner.ai — Soak Test (Extended Duration)
 *  Strategy: Sustained moderate load for 1 hour
 *  Purpose: Detect memory leaks, connection pool exhaustion,
 *           and gradual performance degradation over time
 * ============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL      = 'https://fastlearner.ai';
const errorRate     = new Rate('soak_error_rate');
const responseTrend = new Trend('soak_response_time', true);
const timeoutCount  = new Counter('soak_timeouts');

export const options = {
  stages: [
    { duration: '5m',  target: 500  },   // Ramp up
    { duration: '50m', target: 500  },   // Sustain 500 users for 50 minutes
    { duration: '5m',  target: 0    },   // Ramp down
  ],
  thresholds: {
    http_req_duration:  ['p(95)<3000'],
    http_req_failed:    ['rate<0.01'],
    soak_error_rate:    ['rate<0.01'],
  },
};

const endpoints = [
  '/',
  '/pricing',
  '/auth/sign-in',
  '/courses',
  '/auth/sign-up',
];

export default function () {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const start = Date.now();

  try {
    const res = http.get(`${BASE_URL}${endpoint}`, { timeout: '30s' });

    responseTrend.add(Date.now() - start);

    const ok = check(res, {
      'soak: status < 500':        (r) => r.status < 500,
      'soak: response < 3s':       (r) => r.timings.duration < 3000,
      'soak: no connection error': (r) => r.status !== 0,
    });

    errorRate.add(!ok);
  } catch (e) {
    timeoutCount.add(1);
    errorRate.add(1);
    console.error(`Timeout/Error on ${endpoint}: ${e.message}`);
  }

  sleep(randomIntBetween(2, 6));
}
