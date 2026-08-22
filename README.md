# ThreatPulse — The 60-Second Breach

Real-time Security Operations Center (SOC) prototype that monitors simulated network/system events, detects suspicious behavior with a hybrid rule + ML engine, correlates alerts into prioritized incidents, and explains why each threat was flagged — targeting detection within **60 seconds**.

Built for hackathon demos. Everything runs locally with simulated data. **No API keys, cloud services, or real network taps required.**

## Purpose

Security teams drown in alerts. ThreatPulse demonstrates how to:

1. Continuously ingest high-volume telemetry
2. Detect known patterns (rules) and novel anomalies (Isolation Forest)
3. Correlate related events into a single meaningful incident
4. Score and prioritize threats transparently (0–100)
5. Explain detections with evidence — without a paid LLM

## Architecture

```
Simulated Network Events
        ↓
Real-time Event Ingestion (FastAPI + WebSockets)
        ↓
Preprocessing
        ↓
Feature Extraction
        ↓
Hybrid Detection Engine
 ├── Rule Engine
 └── ML Anomaly Detector (Isolation Forest)
        ↓
Event Correlation
        ↓
Risk Scoring
        ↓
Alert Prioritization
        ↓
Explainable Threat Analysis
        ↓
SOC Dashboard (Next.js)
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Lucide React, Recharts |
| Backend | Python, FastAPI, WebSockets, Pydantic, NumPy, Pandas, scikit-learn |
| Storage | SQLite |

## How Detection Works

### Rule engine
Stateful sliding-window rules detect:
- **Brute force** — many failed logins from one source
- **Port scan** — rapid multi-port / multi-host contacts
- **Privilege escalation** — sudden privileged activity
- **Data exfiltration** — outbound volume spikes
- **Suspicious DNS** — abnormal DNS query patterns

### ML anomaly detection
An **Isolation Forest** is trained on simulated normal traffic features:
- login failure count, request frequency, ports contacted
- bytes sent/received, connection frequency
- unique destinations, privilege level, event frequency

The model emits an anomaly score (0–100).

### Correlation
Related events (same attacker IP / same simulation) are merged into **one incident**, e.g.:

> 27 failed logins + successful login + privilege escalation + large outbound traffic  
> → **CRITICAL: Possible Account Compromise & Data Exfiltration**

## How Risk Scoring Works

```
Risk Score =
  30% anomaly score
+ 30% rule detection score
+ 20% event frequency
+ 10% asset criticality
+ 10% attack correlation
```

| Score | Severity |
|------:|----------|
| 0–24 | LOW |
| 25–49 | MEDIUM |
| 50–74 | HIGH |
| 75–100 | CRITICAL |

Explanations are generated from rule evidence + scores (no external LLM).

## Project Structure

```
/frontend          Next.js SOC UI
  /src/app         Pages (landing, dashboard, incidents, events, architecture)
  /src/components  Dashboard + UI components
  /src/hooks       WebSocket live data hook
  /src/lib         API helpers
  /src/types       Shared TypeScript types

/backend
  /app
    main.py           FastAPI + WebSocket endpoints
    models.py         Pydantic models
    database.py       SQLite persistence
    simulator.py      Event + attack simulation
    detector.py       Hybrid detection (rules + Isolation Forest)
    rules.py          Rule engine
    risk_scoring.py   Risk score + explanations
    correlation.py    Incident correlation
    websocket.py      Connection manager
```

## Quick Start

```bash
# Terminal 1 — backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Or from the repo root (starts both):

```bash
chmod +x start.sh && ./start.sh
```

Then open [http://localhost:3000](http://localhost:3000) and click **Launch SOC Dashboard**.

## Deploy to Netlify

See **[DEPLOY.md](./DEPLOY.md)** for the full guide:

1. Push the repo to GitHub  
2. Host the FastAPI backend on **Render** (WebSockets need a real server)  
3. Deploy the Next.js frontend on **Netlify** with `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL`

Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

Optional frontend env (defaults work for local demo):

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/events
```

### API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/events` | List events (search/filter/sort/paginate) |
| GET | `/alerts` | List alerts |
| GET | `/incidents` | List incidents |
| GET | `/incidents/{id}` | Incident detail |
| GET | `/metrics` | Dashboard KPIs + chart series |
| POST | `/simulation/start` | Start attack simulation |
| POST | `/simulation/stop` | Stop simulation |
| POST | `/simulation/reset` | Clear DB + reset engines |
| WS | `/ws/events` | Live event stream |

## Run the Attack Simulation

1. Start backend and frontend
2. Open **SOC Dashboard** → `/dashboard`
3. Click **Start Attack Simulation**
4. Watch the live flow:
   - Normal events
   - Suspicious failed logins
   - Anomaly / brute-force detection
   - Risk score increases
   - Events correlated into one incident
   - Critical incident prioritized
   - Explanation + evidence generated
5. Confirm the banner: **Threat detected in X.X seconds — 60-second objective: PASSED**
6. Use **Reset Simulation** to clear state for the next demo

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | Live SOC dashboard |
| `/incidents` | Incident table + filters |
| `/incidents/[id]` | Incident detail |
| `/events` | Searchable event explorer |
| `/architecture` | Visual pipeline |

## Demo Tips for Judges

- Keep the dashboard open while the simulation runs — updates are WebSocket-driven (no page refresh)
- Point out the **Threat Priority Queue** ordering by risk score
- Open the correlated incident to show timeline + evidence
- Mention false-positive reduction via correlation (many events → one incident)

## License

Hackathon prototype — free to use and modify for demo purposes.
