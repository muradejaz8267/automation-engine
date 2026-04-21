# Render par FastLearner Automation Deploy Guide

Is project mein **3 cheezein** hain:

| Component | Location | Kya hai |
|-----------|----------|---------|
| **Frontend** | `test-panel/` | React + Vite (Test Panel UI) |
| **Backend** | `server.js` | Express API (tests run karta hai) |
| **Test Scripts** | `tests/` | Playwright E2E tests |

---

## Architecture (Single Deployment)

**Ek hi Web Service** deploy karenge jo sab kuch handle karega:

```
User → https://your-app.onrender.com
         ├── /              → Frontend (React build)
         ├── /api/*         → Backend APIs (test run, screenshot, etc.)
         └── /reports/*     → Test reports (Playwright HTML)
```

---

## Step-by-Step Deployment

### Step 1: GitHub par code push karo

```bash
cd d:\uh\fastlearner-automation
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Render Account

1. [render.com](https://render.com) par jao
2. **Sign Up** / **Log In** (GitHub se connect kar sakte ho)
3. **Dashboard** → **New** → **Web Service**

### Step 3: Repository Connect karo

1. **Connect a repository** par click karo
2. Apna GitHub repo select karo (`fastlearner-automation`)
3. **Connect** par click karo

### Step 4: Web Service Settings

| Field | Value |
|-------|--------|
| **Name** | `fastlearner-automation` (ya jo naam chaho) |
| **Region** | Singapore (ya nearest) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** (ya **Starter** agar tests zyada chalani hain) |

### Step 5: Environment Variables (Optional)

Agar kuch alag chahiye ho to add karo:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Render auto set karta hai |
| `VITE_API_URL` | *(blank)* | Same origin – leave empty |
| `VITE_SSE_URL` | *(blank)* | Same origin – leave empty |

### Step 6: Deploy

1. **Create Web Service** par click karo
2. Build start hogi (5–10 min lag sakta hai – Playwright install hota hai)
3. Deploy complete hone ke baad URL milega: `https://fastlearner-automation-xxxx.onrender.com`

---

## Project Structure (Reference)

```
fastlearner-automation/
├── server.js              ← Backend (API + frontend serve)
├── package.json           ← build & start scripts
├── tests/                 ← Test scripts (backend ke saath deploy)
│   ├── student/
│   └── instructor/
├── test-panel/            ← Frontend
│   ├── src/
│   │   └── App.jsx
│   ├── dist/              ← Build output (npm run build se)
│   └── package.json
└── playwright-report/     ← Reports (runtime pe generate)
```

---

## Build & Start Commands (package.json)

```json
"build": "npm install --prefix test-panel && npm run build --prefix test-panel && npx playwright install chromium --with-deps",
"start": "node server.js"
```

- **build**: Frontend build + Playwright Chromium install
- **start**: Backend server start (frontend bhi serve karta hai)

---

## Important Notes

### 1. Playwright on Render

- **Free tier**: Playwright chal sakta hai, lekin:
  - Cold start slow (30–60 sec)
  - 512MB RAM – heavy tests fail ho sakte hain
- **Starter ($7/mo)**: Better – 512MB+ RAM, tests stable

### 2. Cold Start

- Free tier pe **15 min** inactivity ke baad instance **sleep** ho jata hai
- Pehla request slow hoga (30–60 sec)
- Baad ke requests normal speed pe

### 3. Test Reports

- Reports `playwright-report/` mein generate hoti hain
- Render pe disk **ephemeral** hai – redeploy pe reports gayab ho jayengi
- Long-term storage ke liye S3 / external storage (future)

### 4. Timeout

- Tests 5–10 min tak chal sakti hain
- Backend mein `req.setTimeout(660000)` already hai
- Agar proxy timeout aaye to Render dashboard se increase karo

---

## Local Testing (Deploy se pehle)

```bash
# 1. Build frontend
npm run build

# 2. Start server
npm start

# 3. Browser mein open karo
# http://localhost:3001
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fail – Playwright install | Build command mein `npx playwright install chromium --with-deps` already hai |
| 502 Bad Gateway | Server start hone mein time – Health check path: `/api/health`, delay badhao |
| Tests fail – browser not found | Playwright dependencies – `--with-deps` use kiya hai |
| CORS error | Backend mein `cors()` already use ho raha hai |
| Blank page | `VITE_API_URL` aur `VITE_SSE_URL` empty hona chahiye (same origin) |
| SSE not working | Production mein `window.location.origin` use hota hai – same origin |

---

## Summary

| Component | Location | Deploy |
|-----------|----------|--------|
| Frontend | `test-panel/` | `npm run build` → `test-panel/dist` → Express static |
| Backend | `server.js` | `npm start` → Node server |
| Test Scripts | `tests/` | Backend ke saath – Playwright spawn karta hai |

**Ek deployment = Frontend + Backend + Tests sab ek saath.**
