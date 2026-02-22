# FastLearner Test Panel

React frontend to run automation tests from a control panel.

## Setup

1. **Install dependencies** (from project root):
   ```bash
   cd ..
   npm install
   cd test-panel
   npm install
   ```

2. **Start the backend API** (from project root):
   ```bash
   npm run server
   ```
   Runs on http://localhost:3001

3. **Start the React frontend** (from test-panel folder):
   ```bash
   npm run dev
   ```
   Runs on http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Click **Run Attempt Course** to execute `attemptCourse.spec.js`
3. Wait for the test to complete (about 1–2 minutes)
4. View pass/fail status and output

## Requirements

- Backend server must be running before using the panel
- Node.js and npm installed
- Playwright browsers installed (`npx playwright install`)
