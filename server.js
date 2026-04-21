const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const SCREENSHOT_BASE = `http://127.0.0.1:${PORT}`;

let currentTestProcess = null;
let latestScreenshot = null;
let screenshotListeners = [];

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// POST screenshot from Playwright test (base64)
app.post('/api/screenshot', (req, res) => {
  const { screenshot } = req.body || {};
  if (screenshot && typeof screenshot === 'string') {
    latestScreenshot = screenshot;
    screenshotListeners.forEach((send) => {
      try { send(screenshot); } catch (e) {}
    });
    res.json({ ok: true });
  } else {
    res.status(400).json({ ok: false, message: 'Missing screenshot' });
  }
});

// SSE stream for live browser view (direct connection, bypasses proxy buffering)
app.get('/api/browser-screenshot-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  const send = (data) => res.write(`data: ${JSON.stringify({ screenshot: data })}\n\n`);
  screenshotListeners.push(send);
  // Don't send cached screenshot - each test run should show only its own screenshots
  req.on('close', () => {
    screenshotListeners = screenshotListeners.filter((s) => s !== send);
  });
});

// Stop any running test
app.post('/api/stop-test', (req, res) => {
  if (!currentTestProcess) {
    return res.json({ stopped: false, message: 'No test is currently running.' });
  }
  try {
    currentTestProcess.kill('SIGTERM');
    currentTestProcess = null;
    res.json({ stopped: true, message: 'Test stopped.' });
  } catch (err) {
    res.status(500).json({ stopped: false, message: err.message });
  }
});

// Alias for backward compatibility
app.post('/api/stop-attempt-course', (req, res) => {
  if (!currentTestProcess) {
    return res.json({ stopped: false, message: 'No test is currently running.' });
  }
  try {
    currentTestProcess.kill('SIGTERM');
    currentTestProcess = null;
    res.json({ stopped: true, message: 'Test stopped.' });
  } catch (err) {
    res.status(500).json({ stopped: false, message: err.message });
  }
});

// Run attemptCourse.spec.js
app.post('/api/run-attempt-course', async (req, res) => {
  req.setTimeout(660000); // 11 min - test can take 5-6 min
  res.setTimeout(660000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const runnerPath = path.join(__dirname, 'scripts', 'run-attempt-with-screenshots.js');
  const playwright = spawn('node', [runnerPath], {
    cwd: __dirname,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE }
  });

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  const attemptUrls = {
    signIn: 'https://staging.fastlearner.ai/auth/sign-in',
    dashboard: 'https://staging.fastlearner.ai/student/dashboard',
    courseContent: 'https://staging.fastlearner.ai/student/course-content/pw-test-418321'
  };
  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) {
      res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
      if (trimmed.includes('Step 1: Navigating to login')) res.write(JSON.stringify({ type: 'navigate', url: attemptUrls.signIn }) + '\n');
      else if (trimmed.includes('Logged in with cooper')) res.write(JSON.stringify({ type: 'navigate', url: attemptUrls.dashboard }) + '\n');
      else if (trimmed.includes('Step 3: Navigating directly to course') || trimmed.includes('Navigated to course content page')) res.write(JSON.stringify({ type: 'navigate', url: attemptUrls.courseContent }) + '\n');
    }
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Attempt Course test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run createCors.spec.js
app.post('/api/run-create-course', async (req, res) => {
  req.setTimeout(660000);
  res.setTimeout(660000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'instructor', 'createCors.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/instructor/createCors.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'create-course');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  // Use absolute path so HTML reporter writes to the right folder (cross-platform)
  const reportDirAbs = path.resolve(reportDir);
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDirAbs }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Create Course test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run createCourse.negative.spec.js (root-level file)
app.post('/api/run-create-course-negative', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'createCourse.negative.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = './createCourse.negative.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'create-course-negative');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportDirAbs = path.resolve(reportDir);
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDirAbs }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Create Course Negative test completed successfully!' : 'Test failed. Check report or server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message || 'Test process error', exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run createTestFlow.spec.js (root-level file)
app.post('/api/run-create-test', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'createTestFlow.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = './createTestFlow.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'create-test');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportDirAbs = path.resolve(reportDir);
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDirAbs }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Create Test completed successfully!' : 'Test failed. Check report or server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message || 'Test process error', exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run createTestFlow.negative.spec.js (root-level file)
app.post('/api/run-create-test-negative', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'createTestFlow.negative.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = './createTestFlow.negative.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'create-test-negative');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportDirAbs = path.resolve(reportDir);
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDirAbs }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Create Test Negative test completed successfully!' : 'Test failed. Check report or server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message || 'Test process error', exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run homePageFlow.spec.js (root-level file)
app.post('/api/run-home-page-flow', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'homePageFlow.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = './homePageFlow.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'home-page-flow');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportDirAbs = path.resolve(reportDir);
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OPEN: 'never', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDirAbs }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Home Page Flow completed successfully!' : 'Test failed. Check report or server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message || 'Test process error', exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run addToFavoriteCourse.spec.js
app.post('/api/run-add-to-favorite', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'addToFavoriteCourse.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/addToFavoriteCourse.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'add-to-favorite');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Add to Favorite test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run Mycoursenavbar.spec.js
app.post('/api/run-mycoursenavbar', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'Mycoursenavbar.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/Mycoursenavbar.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'mycoursenavbar');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Mycoursenavbar test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run shareButton.spec.js
app.post('/api/run-share-course', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'shareButton.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/shareButton.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'share-course');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Share Course test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run login.spec.js
app.post('/api/run-login', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'login.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/login.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-login');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Login test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run loginNegativeTestCase.spec.js
app.post('/api/run-login-negative', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'loginNegativeTestCase.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/loginNegativeTestCase.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-login-negative');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Negative login test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run signup.spec.js
app.post('/api/run-signup', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'signup.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/signup.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-signup');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Signup test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run signupNegativeTestCases.spec.js
app.post('/api/run-signup-negative', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'signupNegativeTestCases.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/signupNegativeTestCases.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-signup-negative');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Signup negative test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run askAITest.spec.js
app.post('/api/run-ask-ai', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'askAITest.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/askAITest.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-ask-ai');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Ask AI test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run aiGrader.spec.js
app.post('/api/run-ai-grader', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'aiGrader.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/aiGrader.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'ai-grader');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'AI Grader test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run askAIPromptTestCases.spec.js (5 positive + 5 negative prompt cases)
app.post('/api/run-ask-ai-prompt-cases', async (req, res) => {
  req.setTimeout(600000);
  res.setTimeout(600000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'askAIPromptTestCases.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/askAIPromptTestCases.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'auth-ask-ai-prompt-cases');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Ask AI prompt test cases completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run elasticSearchTest.spec.js (5 positive search cases + Enter detail page)
app.post('/api/run-elasticsearch', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'elasticSearchTest.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/elasticSearchTest.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'elasticsearch');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Elasticsearch search test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run socialSignup.spec.js (with screenshot streaming)
app.post('/api/run-social-signup', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const runnerPath = path.join(__dirname, 'scripts', 'run-social-signup-with-screenshots.js');
  if (!fs.existsSync(runnerPath)) {
    return res.status(500).json({ status: 'failed', message: `Runner not found: ${runnerPath}` });
  }
  sendStreamStart(res, '▶ Starting Social Signup test...');

  let playwright;
  try {
    playwright = spawn(process.execPath, [runnerPath], {
      cwd: __dirname,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }
  currentTestProcess = playwright;

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Social signup test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run premiumCoursePurchase.spec.js
app.post('/api/run-premium-course-purchase', async (req, res) => {
  req.setTimeout(120000);
  res.setTimeout(120000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'premiumCoursePurchase.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/premiumCoursePurchase.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'premium-course-purchase');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Premium course purchase test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run annualStandardSubscription.spec.js
app.post('/api/run-annual-standard-subscription', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'annualStandardSubscription.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/annualStandardSubscription.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'annual-standard-subscription');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Annual Standard Subscription test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run annualEnterprise.spec.js
app.post('/api/run-annual-enterprise', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'annualEnterprise.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/annualEnterprise.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'annual-enterprise');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Annual Enterprise test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run annualPremium.spec.js
app.post('/api/run-annual-premium', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'annualPremium.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/annualPremium.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'annual-premium');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Annual Premium test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run monthlyStandard.spec.js
app.post('/api/run-monthly-standard', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'monthlyStandard.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/monthlyStandard.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'monthly-standard');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Monthly Standard test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run cancelSubscription.spec.js
app.post('/api/run-cancel-subscription', async (req, res) => {
  req.setTimeout(300000);
  res.setTimeout(300000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'cancelSubscription.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/cancelSubscription.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'cancel-subscription');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Cancel Subscription test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run monthlyPremium.spec.js
app.post('/api/run-monthly-premium', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'monthlyPremium.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/monthlyPremium.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'monthly-premium');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Monthly Premium test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Run monthlyEnterprise.spec.js
app.post('/api/run-monthly-enterprise', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const specPath = path.join(__dirname, 'tests', 'student', 'monthlyEnterprise.spec.js');
  if (!fs.existsSync(specPath)) {
    return res.status(500).json({ status: 'failed', message: `Test not found: ${specPath}` });
  }

  const specArg = 'tests/student/monthlyEnterprise.spec.js';
  const reportDir = path.join(__dirname, 'playwright-report', 'monthly-enterprise');
  if (!fs.existsSync(path.dirname(reportDir))) fs.mkdirSync(path.dirname(reportDir), { recursive: true });
  let playwright;
  try {
    playwright = spawn('npx', ['playwright', 'test', specArg, '--project=chromium', '--headed', '--reporter=html'], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: SCREENSHOT_BASE, PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
    });
  } catch (err) {
    return res.status(500).json({ status: 'failed', message: `Failed to start test: ${err.message}` });
  }

  currentTestProcess = playwright;

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  let buffer = '';
  const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  const sendLine = (line) => {
    const trimmed = stripAnsi(line.trim()).replace(/[\x00-\x1f\x7f]/g, '');
    if (trimmed.length > 1) res.write(JSON.stringify({ type: 'output', line: trimmed }) + '\n');
  };
  const onData = (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    lines.forEach(sendLine);
  };

  playwright.stdout.on('data', (d) => { onData(d); console.log(d.toString()); });
  playwright.stderr.on('data', (d) => { onData(d); console.error(d.toString()); });

  playwright.on('close', (code) => {
    currentTestProcess = null;
    if (buffer.trim()) sendLine(buffer);
    if (!res.writableEnded) {
      const success = code === 0;
      res.write(JSON.stringify({ type: 'complete', status: success ? 'passed' : 'failed', message: success ? 'Monthly Enterprise test completed successfully!' : 'Test failed. Check server logs for details.', exitCode: code }) + '\n');
      res.end();
    }
  });

  playwright.on('error', (err) => {
    currentTestProcess = null;
    if (!res.writableEnded) {
      res.write(JSON.stringify({ type: 'complete', status: 'failed', message: err.message, exitCode: 1 }) + '\n');
      res.end();
    }
  });
});

// Serve Playwright HTML reports
const reportBase = path.join(__dirname, 'playwright-report');
// create-course: serve report or placeholder if not generated yet
const createCourseReportDir = path.join(reportBase, 'create-course');
app.get('/reports/create-course', (req, res, next) => {
  const indexPath = path.join(createCourseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Course Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:600px;">
        <h1>Create Course report</h1>
        <p>No report yet. Run the <strong>Create Course</strong> test from the test panel, then refresh this page.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/create-course/', (req, res, next) => {
  const indexPath = path.join(createCourseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Course Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:600px;">
        <h1>Create Course report</h1>
        <p>No report yet. Run the <strong>Create Course</strong> test from the test panel, then refresh this page.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/create-course', express.static(createCourseReportDir));
app.use('/reports/auth-login', express.static(path.join(reportBase, 'auth-login')));
app.use('/reports/auth-login-negative', express.static(path.join(reportBase, 'auth-login-negative')));
app.use('/reports/auth-signup', express.static(path.join(reportBase, 'auth-signup')));
app.use('/reports/auth-signup-negative', express.static(path.join(reportBase, 'auth-signup-negative')));
app.use('/reports/auth-ask-ai', express.static(path.join(reportBase, 'auth-ask-ai')));
app.use('/reports/auth-ask-ai-prompt-cases', express.static(path.join(reportBase, 'auth-ask-ai-prompt-cases')));
app.use('/reports/elasticsearch', express.static(path.join(reportBase, 'elasticsearch')));
app.use('/reports/ai-grader', express.static(path.join(reportBase, 'ai-grader')));
const createCourseNegativeReportDir = path.join(reportBase, 'create-course-negative');
app.get('/reports/create-course-negative', (req, res) => {
  const indexPath = path.join(createCourseNegativeReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Course Negative Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Course Negative report</h1>
        <p>No report yet. Run <strong>Create Course Negative Test Cases</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/create-course-negative/', (req, res) => {
  const indexPath = path.join(createCourseNegativeReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Course Negative Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Course Negative report</h1>
        <p>No report yet. Run <strong>Create Course Negative Test Cases</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/create-course-negative', express.static(createCourseNegativeReportDir));
const createTestReportDir = path.join(reportBase, 'create-test');
app.get('/reports/create-test', (req, res) => {
  const indexPath = path.join(createTestReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Test Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Test report</h1>
        <p>No report yet. Run <strong>Create Test</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/create-test/', (req, res) => {
  const indexPath = path.join(createTestReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Test Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Test report</h1>
        <p>No report yet. Run <strong>Create Test</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/create-test', express.static(createTestReportDir));
const createTestNegativeReportDir = path.join(reportBase, 'create-test-negative');
app.get('/reports/create-test-negative', (req, res) => {
  const indexPath = path.join(createTestNegativeReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Test Negative Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Test Negative report</h1>
        <p>No report yet. Run <strong>Create Test Negative Test Cases</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/create-test-negative/', (req, res) => {
  const indexPath = path.join(createTestNegativeReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Create Test Negative Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Create Test Negative report</h1>
        <p>No report yet. Run <strong>Create Test Negative Test Cases</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/create-test-negative', express.static(createTestNegativeReportDir));
const homePageFlowReportDir = path.join(reportBase, 'home-page-flow');
app.get('/reports/home-page-flow', (req, res) => {
  const indexPath = path.join(homePageFlowReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Home Page Flow Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Home Page Flow report</h1>
        <p>No report yet. Run <strong>HomePageFlow</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/home-page-flow/', (req, res) => {
  const indexPath = path.join(homePageFlowReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Home Page Flow Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Home Page Flow report</h1>
        <p>No report yet. Run <strong>HomePageFlow</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/home-page-flow', express.static(homePageFlowReportDir));
const premiumCoursePurchaseReportDir = path.join(reportBase, 'premium-course-purchase');
app.get('/reports/premium-course-purchase', (req, res) => {
  const indexPath = path.join(premiumCoursePurchaseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Premium Course Purchase Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Premium Course Purchase report</h1>
        <p>No report yet. Run <strong>Premium Course Purchase</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/premium-course-purchase/', (req, res) => {
  const indexPath = path.join(premiumCoursePurchaseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Premium Course Purchase Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Premium Course Purchase report</h1>
        <p>No report yet. Run <strong>Premium Course Purchase</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/premium-course-purchase', express.static(premiumCoursePurchaseReportDir));
const annualStandardSubscriptionReportDir = path.join(reportBase, 'annual-standard-subscription');
app.get('/reports/annual-standard-subscription', (req, res) => {
  const indexPath = path.join(annualStandardSubscriptionReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Standard Subscription Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Standard Subscription report</h1>
        <p>No report yet. Run <strong>Annual Standard Subscription</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/annual-standard-subscription/', (req, res) => {
  const indexPath = path.join(annualStandardSubscriptionReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Standard Subscription Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Standard Subscription report</h1>
        <p>No report yet. Run <strong>Annual Standard Subscription</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/annual-standard-subscription', express.static(annualStandardSubscriptionReportDir));
const annualEnterpriseReportDir = path.join(reportBase, 'annual-enterprise');
app.get('/reports/annual-enterprise', (req, res) => {
  const indexPath = path.join(annualEnterpriseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Enterprise Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Enterprise report</h1>
        <p>No report yet. Run <strong>Annual Enterprise</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/annual-enterprise/', (req, res) => {
  const indexPath = path.join(annualEnterpriseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Enterprise Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Enterprise report</h1>
        <p>No report yet. Run <strong>Annual Enterprise</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/annual-enterprise', express.static(annualEnterpriseReportDir));
const annualPremiumReportDir = path.join(reportBase, 'annual-premium');
app.get('/reports/annual-premium', (req, res) => {
  const indexPath = path.join(annualPremiumReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Premium Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Premium report</h1>
        <p>No report yet. Run <strong>Annual Premium</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/annual-premium/', (req, res) => {
  const indexPath = path.join(annualPremiumReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Annual Premium Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Annual Premium report</h1>
        <p>No report yet. Run <strong>Annual Premium</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/annual-premium', express.static(annualPremiumReportDir));
const monthlyStandardReportDir = path.join(reportBase, 'monthly-standard');
app.get('/reports/monthly-standard', (req, res) => {
  const indexPath = path.join(monthlyStandardReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Standard Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Monthly Standard report</h1>
        <p>No report yet. Run <strong>Monthly Standard</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/monthly-standard/', (req, res) => {
  const indexPath = path.join(monthlyStandardReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Standard Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Monthly Standard report</h1>
        <p>No report yet. Run <strong>Monthly Standard</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/monthly-standard', express.static(monthlyStandardReportDir));
const monthlyPremiumReportDir = path.join(reportBase, 'monthly-premium');
app.get('/reports/monthly-premium', (req, res) => {
  const indexPath = path.join(monthlyPremiumReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Premium Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Monthly Premium report</h1>
        <p>No report yet. Run <strong>Monthly Premium</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/monthly-premium/', (req, res) => {
  const indexPath = path.join(monthlyPremiumReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Premium Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;">
        <h1>Monthly Premium report</h1>
        <p>No report yet. Run <strong>Monthly Premium</strong> from the test panel, then refresh.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/monthly-premium', express.static(monthlyPremiumReportDir));
const monthlyEnterpriseReportDir = path.join(reportBase, 'monthly-enterprise');
app.get('/reports/monthly-enterprise', (req, res) => {
  const indexPath = path.join(monthlyEnterpriseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Enterprise Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:600px;">
        <h1>Monthly Enterprise report</h1>
        <p>No report yet. Run the <strong>Monthly Enterprise</strong> test from the test panel, then refresh this page.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.get('/reports/monthly-enterprise/', (req, res) => {
  const indexPath = path.join(monthlyEnterpriseReportDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.type('html').status(200).send(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Monthly Enterprise Report</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:600px;">
        <h1>Monthly Enterprise report</h1>
        <p>No report yet. Run the <strong>Monthly Enterprise</strong> test from the test panel, then refresh this page.</p>
        <p><a href="/">Back to test panel</a></p>
      </body></html>
    `);
  }
});
app.use('/reports/monthly-enterprise', express.static(monthlyEnterpriseReportDir));
app.use('/reports/add-to-favorite', express.static(path.join(reportBase, 'add-to-favorite')));
app.use('/reports/share-course', express.static(path.join(reportBase, 'share-course')));
app.use('/reports/mycoursenavbar', express.static(path.join(reportBase, 'mycoursenavbar')));

// Health check (must be before catch-all)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend (production build from test-panel/dist)
const frontendDir = path.join(__dirname, 'test-panel', 'dist');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/reports')) return next();
    res.sendFile(path.join(frontendDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Test panel API server running at http://localhost:${PORT}`);
});