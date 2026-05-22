# Deploy guide

## Firebase account and project

| Setting | Value |
|---------|--------|
| Google account | **tikohayrapetyan123@gmail.com** |
| Project name (console) | **autopolot** |
| Project ID (CLI) | **autopolot** |

If deploy says the project does not exist, the ID may differ from the display name. After login, run `firebase projects:list` and copy the exact **Project ID** column, then update `.firebaserc` or run `firebase use <that-id>`.

Console: [Firebase Console](https://console.firebase.google.com/) — sign in as **tikohayrapetyan123@gmail.com**, open project **autopolot**.

Hosting URL after deploy (typical): `https://autopolot.web.app` or `https://autopolot.firebaseapp.com`

---

## 1. Log in with the correct Google account

You must **not** use `monikatigran@gmail.com` for this project. Switch CLI account:

```bash
firebase logout
firebase login
```

In the browser, choose **tikohayrapetyan123@gmail.com**.

Confirm the project is visible:

```bash
firebase projects:list
```

You should see **autopolot** (or note the exact Project ID and use it below).

```bash
cd /Users/thayrapetyan/Documents/Manual-Automation-app
firebase use autopolot
```

If the ID from the list is different (e.g. `autopilot-qa-5eeb9`), run:

```bash
firebase use <exact-project-id-from-list>
```

---

## 2. Environment variables (frontend → backend)

| File | Purpose |
|------|---------|
| `frontend/.env` | Local dev |
| `frontend/.env.production` | Production build |

```bash
cp frontend/.env.example frontend/.env
cp frontend/.env.production.example frontend/.env.production
```

When Railway/Render backend is live, set in `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.up.railway.app
```

No trailing slash. Rebuild and redeploy after changing.

---

## 3. Build and deploy hosting

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

Or one line from repo root (after `firebase use autopolot`):

```bash
cd frontend && npm run build && cd .. && firebase deploy --only hosting
```

---

## 4. Backend on Render (Playwright + Docker)

GitHub account: **Tigran-Products**  
Repository: **https://github.com/Tigran-Products/AutoPilot-QA**

The repo includes `backend/Dockerfile` and `render.yaml`. Render runs Chromium via the official Playwright Docker image.

### Step A — Push code to GitHub as Tigran-Products

Your Mac may still use cached login for **thayrapetyan**. Push must use **Tigran-Products**.

```bash
cd /Users/thayrapetyan/Documents/Manual-Automation-app

# This repo is configured as Tigran-Products (check with: git config user.name)
git config user.name
git config user.email

# Remove old GitHub login from Keychain (press Enter twice after the last line)
git credential-osxkeychain erase
host=github.com
protocol=https

# Push — sign in as Tigran-Products when the browser opens (NOT thayrapetyan)
git add .
git commit -m "chore: add Render Docker deploy for backend"   # skip if already committed
git push -u origin main
```

Remote should already be:

```text
https://github.com/Tigran-Products/AutoPilot-QA.git
```

**Personal Access Token:** GitHub → logged in as **Tigran-Products** → Settings → Developer settings → Fine-grained or classic token with **repo** access → use as password if prompted.

### Step B — Create the web service in Render

1. Open [Render Dashboard](https://dashboard.render.com/) → your **workspace**.
2. Click **New +** → **Web Service**.
3. Connect **GitHub** and authorize Render.
4. Select the repository that contains this project.
5. Configure:

| Setting | Value |
|---------|--------|
| **Name** | `manual-automation-api` (or any name) |
| **Region** | Closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | **Docker** (important — not Node) |
| **Instance type** | Free (or Starter if tests fail with out-of-memory) |

6. **Environment variables** — usually none required (`PORT` is set by Render).
7. Click **Create Web Service**.

First deploy takes **5–15 minutes** (Docker image + npm install).

### Step C — Check the service is live

When deploy status is **Live**, open:

- `https://YOUR-SERVICE-NAME.onrender.com/health`

You should see: `{"ok":true,"service":"manual-automation-api"}`

Copy the base URL (no trailing slash), e.g. `https://manual-automation-api.onrender.com`.

### Step D — Connect Firebase frontend to Render API

Edit `frontend/.env.production`:

```env
VITE_API_URL=https://YOUR-SERVICE-NAME.onrender.com
```

Then rebuild and redeploy frontend:

```bash
cd frontend && npm run build && cd ..
firebase deploy --only hosting
```

### Render notes

- **Free tier** services sleep after ~15 min idle; first request after sleep can take 30–60s (cold start).
- If deploy fails with **out of memory**, upgrade instance to **Starter** (512MB+).

---

## 5. Backend on Railway (alternative to Render)

If you see **Railpack** error `Script start.sh not found` — Railway is building the **repo root** instead of `backend/`. There is no `package.json` at the root, only inside `backend/`.

### Fix in Railway dashboard

1. Open your service → **Settings**
2. Set **Root Directory** to: `backend`
3. Set **Builder** to: **Dockerfile** (not Railpack / Nixpacks auto-detect)
4. **Dockerfile path:** `Dockerfile` (relative to `backend/`)
5. Redeploy

Or use the repo’s root `railway.toml` (already points Docker to `backend/Dockerfile`):

```toml
dockerfilePath = "backend/Dockerfile"
```

### Railway settings summary

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Builder | Dockerfile |
| Health check | `/health` |

### After deploy

Copy Railway URL → `frontend/.env.production`:

```env
VITE_API_URL=https://YOUR-APP.up.railway.app
```

Rebuild frontend and `firebase deploy --only hosting`.

Optional env on Railway:

| Variable | Value |
|----------|--------|
| `ENABLE_TRACING` | `true` (slower; enables trace zip download) |
| `PLAYWRIGHT_TIMEOUT` | `15000` |
| `PLAYWRIGHT_NAV_TIMEOUT` | `45000` |
- **Traces** are stored on disk; they are lost when the container restarts (fine for demos).

---

## Troubleshooting

**`Failed to get Firebase project autopolot`**

- Wrong Google account → `firebase logout` then `firebase login` as **tikohayrapetyan123@gmail.com**
- Wrong project ID → `firebase projects:list` and `firebase use <correct-id>`

**`Already logged in as monikatigran@gmail.com`**

- Run `firebase logout`, then `firebase login` and pick **tikohayrapetyan123@gmail.com**
