# Frontend, Backend aur Test Scripts – Alag Repos mein Deploy

## Kahan kya jayega?

| Cheez | Repo | Deployment Type |
|-------|------|-----------------|
| **Frontend** | `fastlearner-test-panel` (alag repo) | Render Static Site |
| **Backend + Test Scripts** | `fastlearner-automation-api` (alag repo) | Render Web Service |

**Important:** Test scripts (`tests/` folder) **backend repo ke saath** rahenge, kyun ke backend hi inko run karta hai (Playwright spawn karta hai).

---

## Part 1: Backend Repo (API + Test Scripts)

### 1.1 Backend repo ke liye files

Backend repo mein ye sab aayega:

```
fastlearner-automation-api/
├── server.js
├── package.json
├── playwright.config.js
├── playwright.socialsignup.config.js
├── tests/                    ← Test scripts yahan
│   ├── instructor/
│   ├── student/
│   └── ...
└── (koi bhi aur file jo tests/ ya server ke liye zaroori ho)
```

### 1.2 Backend package.json (alag)

Backend ke liye naya `package.json` banao – sirf backend + Playwright:

```json
{
  "name": "fastlearner-automation-api",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "npx playwright install chromium --with-deps"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.57.0"
  }
}
```

### 1.3 Backend server.js changes

Backend **frontend serve nahi karega** (wo alag deploy hoga). Sirf API + reports:

- Frontend serve wala code hata do (test-panel/dist wala part)
- CORS mein frontend URL add karo (Render par deploy hone ke baad)

### 1.4 Backend repo banao

```powershell
# Naya folder
mkdir d:\repos\fastlearner-automation-api
cd d:\repos\fastlearner-automation-api

# Git init
git init

# Files copy karo
Copy-Item d:\uh\fastlearner-automation\server.js .
Copy-Item d:\uh\fastlearner-automation\playwright.config.js .
Copy-Item d:\uh\fastlearner-automation\playwright.socialsignup.config.js .
Copy-Item -Recurse d:\uh\fastlearner-automation\tests .
# package.json manually create karo (upar wala)

# Git push
git add .
git commit -m "Backend API + test scripts"
git remote add origin https://github.com/YOUR_USER/fastlearner-automation-api.git
git push -u origin main
```

---

## Part 2: Frontend Repo (Sirf Test Panel)

### 2.1 Frontend repo ke liye files

```
fastlearner-test-panel/
├── src/
├── public/
├── index.html
├── package.json
├── vite.config.js
└── ...
```

### 2.2 Frontend repo banao

```powershell
# Naya folder
mkdir d:\repos\fastlearner-test-panel
cd d:\repos\fastlearner-test-panel

# Sirf test-panel ki files copy karo
Copy-Item -Recurse d:\uh\fastlearner-automation\test-panel\* .

# Git init
git init
git add .
git commit -m "Test panel frontend"
git remote add origin https://github.com/YOUR_USER/fastlearner-test-panel.git
git push -u origin main
```

### 2.3 Frontend – Backend URL

Frontend ko backend ka URL chahiye. Build time par env variables:

- `VITE_API_URL` = Backend API URL (e.g. `https://fastlearner-api.onrender.com`)
- `VITE_SSE_URL` = Same backend URL (SSE bhi wahi se aata hai)

Render par Static Site deploy karte waqt Environment Variables set karo.

---

## Part 3: Render par Deploy

### 3.1 Backend (Web Service)

1. Render.com → New → **Web Service**
2. Repo: `fastlearner-automation-api`
3. **Build Command:** `npm install && npx playwright install chromium --with-deps`
4. **Start Command:** `node server.js`
5. **Environment Variables:**
   - `NODE_ENV=production`
   - (Agar frontend URL pata ho to) `FRONTEND_ORIGIN=https://fastlearner-test-panel.onrender.com`

Backend URL yaad rakho, e.g. `https://fastlearner-api.onrender.com`

### 3.2 Frontend (Static Site)

1. Render.com → New → **Static Site**
2. Repo: `fastlearner-test-panel`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Environment Variables (Build time):**
   - `VITE_API_URL=https://fastlearner-api.onrender.com`
   - `VITE_SSE_URL=https://fastlearner-api.onrender.com`

---

## Part 4: Code Changes (Zaroori)

### 4.1 Backend server.js

- Frontend serve wala block **hata do** (test-panel/dist)
- CORS: Frontend origin allow karo:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*',
  credentials: true
}));
```

### 4.2 Backend – SCREENSHOT_BASE

Render par backend ka public URL use karna hoga (SSE/screenshot ke liye):

```javascript
const SCREENSHOT_BASE = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || `http://127.0.0.1:${PORT}`;
```

Render automatically `RENDER_EXTERNAL_URL` set karta hai.

### 4.3 Frontend App.jsx

Already `VITE_API_URL` aur `VITE_SSE_URL` use ho rahe hain. Sirf Render par env variables set karo.

---

## Summary

| Repo | Contains | Deploy |
|------|----------|--------|
| **fastlearner-automation-api** | server.js, tests/, playwright config | Web Service |
| **fastlearner-test-panel** | test-panel/ (React) | Static Site |

**Test scripts** = Backend repo ke andar, kyun ke backend hi unko run karta hai.
