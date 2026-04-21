# FastLearner Load Test Suite — Execution Guide

## Prerequisites
- Install k6: https://k6.io/docs/get-started/installation/
  - Windows:  choco install k6
  - Mac:      brew install k6
  - Linux:    sudo snap install k6

## Files
- loadtest-main.js   → Full 5000 VU load test (ramp + sustain + ramp-down)
- stresstest-spike.js → Spike test: 0 → 10000 VUs (find breaking point)
- soaktest.js         → 1-hour soak test at 500 VUs (memory leak detection)
- generate-load-report.js → HTML report generator (run after test)

## Run Commands

### Main Load Test (5000 VUs)
k6 run loadtest-main.js

### With JSON output for report generation
k6 run --out json=results.json loadtest-main.js

### Stress / Spike Test
k6 run stresstest-spike.js

### Soak Test (1 hour)
k6 run soaktest.js

### Generate HTML Report
k6 run --summary-export=summary.json loadtest-main.js
node generate-load-report.js summary.json

### Cloud execution (k6 Cloud — scalable to 5000+ VUs)
k6 cloud loadtest-main.js
