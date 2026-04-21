# Teen Alag Repos - Split aur Deployment Guide

## Kya kahan jayega?

| Repo | Kya hai | Kahan deploy |
|------|---------|--------------|
| **1. Frontend** | Test Panel UI (React) | Render Static Site |
| **2. Backend** | Express API + Test Scripts | Render Web Service |
| **3. Test Scripts** | Backend ke saath hi | Backend repo mein |

### Test scripts kahan jayengi?

**Test scripts backend ke saath hi rahengi.** Kyunki backend hi inhe run karta hai (spawn se Playwright chalata hai). Tests ko backend se alag repo mein rakhna possible hai (submodule/npm package se), lekin deployment ke liye backend ke paas hona zaroori hai.

---

## Repo 1: Frontend (test-panel)

### Step 1: Naya folder banao

```powershell
cd d:\uh
mkdir fastlearner-test-panel
cd fastlearner-test-panel
```

### Step 2: test-panel ka content copy karo

```powershell
xcopy /E /I d:\uh\fastlearner-automation\test-panel\* .
```

### Step 3: Git init aur GitHub repo

```powershell
git init
git add .
git commit -m "Initial: Test Panel frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fastlearner-test-panel.git
git push -u origin main
```

### Step 4: Environment variables (production ke liye)

Frontend ko backend ka URL batana hoga. `test-panel/.env.production` banao:

```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
VITE_SSE_URL=https://YOUR-BACKEND-URL.onrender.com
```

(Backend deploy hone ke baad actual URL daalna)

### Step 5: Render par deploy (Static Site)

1. Render - New - Static Site
2. Repo: fastlearner-test-panel
3. Build Command: npm run build
4. Publish Directory: dist
5. Environment Variables: VITE_API_URL, VITE_SSE_URL = backend URL
6. Deploy

---

## Repo 2: Backend + Test Scripts

### Step 1: Naya folder banao

```powershell
cd d:\uh
mkdir fastlearner-automation-backend
cd fastlearner-automation-backend
```

### Step 2: Backend + Tests ka content copy karo

Ye files/folders copy karo:

- server.js
- package.json
- tests/ (pura folder)
- scripts/ (pura folder)
- playwright.config.js
- playwright.socialsignup.config.js (agar hai)
- createCourse.negative.spec.js (root pe hai to)
- createTestFlow.spec.js (root pe hai to)
- createTestFlow.negative.spec.js (root pe hai to)
- homePageFlow.spec.js (root pe hai to)

**Copy commands (PowerShell):**

```powershell
copy d:\uh\fastlearner-automation\server.js .
copy d:\uh\fastlearner-automation\package.json .
copy d:\uh\fastlearner-automation\playwright.config.js .
xcopy /E /I d:\uh\fastlearner-automation\tests tests
xcopy /E /I d:\uh\fastlearner-automation\scripts scripts
```

### Step 3: Backend package.json update karo

Backend repo mein frontend build nahi hogi. Sirf backend + Playwright:

```json
"build": "npx playwright install chromium --with-deps",
"start": "node server.js"
```

### Step 4: server.js update - frontend serve hatao

Backend ab frontend serve nahi karega. Ye block REMOVE karo:

```javascript
const frontendDir = path.join(__dirname, 'test-panel', 'dist');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get('*', ...);
}
```

CORS mein frontend URL allow karo:

```javascript
app.use(cors({
  origin: ['https://fastlearner-test-panel.onrender.com', 'http://localhost:5173']
}));
```

### Step 5: Git aur GitHub

```powershell
git init
git add .
git commit -m "Initial: Backend + Test scripts"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fastlearner-automation-backend.git
git push -u origin main
```

### Step 6: Render par deploy (Web Service)

1. Render - New - Web Service
2. Repo: fastlearner-automation-backend
3. Build Command: npm run build
4. Start Command: npm start
5. Deploy

---

## Summary

| # | Repo | Contents | Deploy |
|---|------|----------|--------|
| 1 | fastlearner-test-panel | test-panel (React) | Static Site |
| 2 | fastlearner-automation-backend | server.js, tests, scripts, playwright | Web Service |
| 3 | Test scripts | Backend repo ke andar | - |

---

## Flow

User - Frontend URL (Static) - API/SSE - Backend URL (Web Service) - Playwright tests
