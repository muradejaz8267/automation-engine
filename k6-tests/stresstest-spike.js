/**
 * ============================================================
 *  FastLearner.ai — Stress & Spike Test
 *  Strategy: Push beyond 5000 VUs to find breaking point
 *  Spike: Instant injection of 8000 VUs
 * ============================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL       = 'https://fastlearner.ai';
const errorRate      = new Rate('stress_error_rate');
const responseTrend  = new Trend('stress_response_time', true);

export const options = {
  stages: [
    // Phase 1: Normal baseline
    { duration: '2m',  target: 100  },
    // Phase 2: Push to 5000 (beyond normal)
    { duration: '5m',  target: 5000 },
    // Phase 3: SPIKE — instant 8000
    { duration: '1m',  target: 8000 },
    // Phase 4: Sustain spike
    { duration: '5m',  target: 8000 },
    // Phase 5: Extreme stress
    { duration: '2m',  target: 10000 },
    // Phase 6: Sustain extreme
    { duration: '5m',  target: 10000 },
    // Phase 7: Recovery
    { duration: '5m',  target: 0 },
  ],
  thresholds: {
    http_req_failed:    ['rate<0.30'],   // Allow up to 30% for stress (expect failures)
    http_req_duration:  ['p(99)<10000'], // p99 < 10s under extreme stress
    stress_error_rate:  ['rate<0.30'],
  },
};

export default function () {
  const start = Date.now();
  const res = http.get(BASE_URL, {
    timeout: '30s',
    tags: { test_type: 'stress' },
  });

  responseTrend.add(Date.now() - start);

  const passed = check(res, {
    'stress: got response':    (r) => r.status !== 0,
    'stress: no 503':          (r) => r.status !== 503,
    'stress: response < 10s':  (r) => r.timings.duration < 10000,
  });

  errorRate.add(!passed);

  sleep(randomIntBetween(1, 3));
}
