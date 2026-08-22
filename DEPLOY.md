# Deploy Guide — ThreatPulse on Netlify (+ backend)

ThreatPulse has **two parts**:

| Part | What | Where to host |
|------|------|----------------|
| Frontend | Next.js UI | **Netlify** ✅ |
| Backend | FastAPI + WebSockets | **Render / Railway / Fly.io** (not Netlify) |

Netlify does **not** run long-lived Python WebSocket servers. Host the API elsewhere, then point the Netlify site at it.

---

## Step 1 — Put the project on GitHub

1. Create a new GitHub repo (e.g. `threatpulse`).
2. From the project folder:

```bash
cd "/Users/japneetsingh/Desktop/test hackathon"
git init
git add .
git commit -m "Initial ThreatPulse SOC app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/threatpulse.git
git push -u origin main
```

> If macOS blocks `git` with an Xcode license error, run:  
> `sudo xcodebuild -license`  
> accept the license, then retry.

---

## Step 2 — Deploy the backend (Render — free tier)

1. Go to [https://render.com](https://render.com) → sign up with GitHub.
2. **New → Blueprint** (or **Web Service**) → connect your `threatpulse` repo.
3. If using the included `render.yaml`, Render will detect it.
4. Or create a **Web Service** manually:
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Deploy and copy your URL, e.g.  
   `https://threatpulse-api.onrender.com`
6. Test: open `https://YOUR-BACKEND.onrender.com/health`  
   You should see `{"status":"ok",...}`.

**CORS** is already open (`allow_origins=["*"]`) in the API.

> Free Render services sleep after idle time — first request after sleep can take ~30–60s.

---

## Step 3 — Deploy the frontend on Netlify

### Option A — Netlify UI (recommended)

1. Go to [https://app.netlify.com](https://app.netlify.com) → sign up / log in.
2. **Add new site → Import an existing project** → choose **GitHub** → pick `threatpulse`.
3. Netlify should read `netlify.toml`. Confirm:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** leave as plugin default (or `.next`)
4. Before deploying, open **Site configuration → Environment variables** and add:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://YOUR-BACKEND.onrender.com/ws/events` |

5. Click **Deploy site**.
6. When green, open your Netlify URL (e.g. `https://random-name.netlify.app`).

### Option B — Netlify CLI

```bash
cd "/Users/japneetsingh/Desktop/test hackathon"
npm install -g netlify-cli
netlify login
netlify init
# link to new site, use netlify.toml settings
netlify env:set NEXT_PUBLIC_API_URL "https://YOUR-BACKEND.onrender.com"
netlify env:set NEXT_PUBLIC_WS_URL "wss://YOUR-BACKEND.onrender.com/ws/events"
netlify deploy --prod
```

---

## Step 4 — Verify the live demo

1. Open the Netlify URL → landing page loads.
2. **Launch SOC Dashboard** — LIVE indicator should connect (may take a moment if Render is waking up).
3. Click **Start Attack Simulation** — events stream, threat appears, 60s objective passes.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard stuck on RECONNECTING | Check `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`) and matches your Render URL |
| API calls fail | Confirm `NEXT_PUBLIC_API_URL` has **no** trailing slash; hit `/health` in browser |
| Build fails on Netlify | Ensure base dir is `frontend` and Node 20; check build logs |
| Simulation works locally only | Redeploy Netlify **after** setting env vars (they are baked into the Next.js client build) |
| Render cold start | Wait 30–60s, refresh dashboard once |

---

## Custom domain (optional)

Netlify → **Domain management** → **Add custom domain** → follow DNS instructions.

---

## Files added for deploy

- `netlify.toml` — Netlify Next.js build config
- `render.yaml` — Render backend blueprint
- `frontend/.env.example` — env var template
