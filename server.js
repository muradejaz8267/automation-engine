const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

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
    env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001' }
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

// Run createCorsV3.spec.js (with screenshot streaming)
app.post('/api/run-create-course', async (req, res) => {
  req.setTimeout(660000);
  res.setTimeout(660000);

  if (currentTestProcess) {
    return res.status(409).json({ status: 'failed', message: 'A test is already running.', output: '' });
  }

  latestScreenshot = null;

  const runnerPath = path.join(__dirname, 'scripts', 'run-create-course-with-screenshots.js');
  if (!fs.existsSync(runnerPath)) {
    return res.status(500).json({ status: 'failed', message: `Runner not found: ${runnerPath}` });
  }

  let playwright;
  try {
    playwright = spawn('node', [runnerPath], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001', PLAYWRIGHT_HTML_OUTPUT_DIR: reportDir, PLAYWRIGHT_HTML_OPEN: 'never' }
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

  let playwright;
  try {
    playwright = spawn('node', [runnerPath], {
      cwd: __dirname,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, SCREENSHOT_API_URL: 'http://127.0.0.1:3001' }
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

// Serve Playwright HTML reports
const reportBase = path.join(__dirname, 'playwright-report');
app.use('/reports/auth-login', express.static(path.join(reportBase, 'auth-login')));
app.use('/reports/auth-login-negative', express.static(path.join(reportBase, 'auth-login-negative')));
app.use('/reports/auth-signup', express.static(path.join(reportBase, 'auth-signup')));
app.use('/reports/auth-signup-negative', express.static(path.join(reportBase, 'auth-signup-negative')));
app.use('/reports/auth-ask-ai', express.static(path.join(reportBase, 'auth-ask-ai')));
app.use('/reports/auth-ask-ai-prompt-cases', express.static(path.join(reportBase, 'auth-ask-ai-prompt-cases')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Test panel API server running at http://localhost:${PORT}`);
});
