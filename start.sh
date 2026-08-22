#!/usr/bin/env bash
# Start ThreatPulse backend + frontend for local demo
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  [[ -n "${BACK_PID:-}" ]] && kill "$BACK_PID" 2>/dev/null || true
  [[ -n "${FRONT_PID:-}" ]] && kill "$FRONT_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting backend on :8000..."
cd "$ROOT/backend"
if [[ ! -d venv ]]; then
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACK_PID=$!

echo "Starting frontend on :3000..."
cd "$ROOT/frontend"
if [[ ! -d node_modules ]]; then
  npm install
fi
npm run dev -- --port 3000 &
FRONT_PID=$!

echo ""
echo "ThreatPulse is starting:"
echo "  UI:  http://localhost:3000"
echo "  API: http://127.0.0.1:8000/health"
echo "  WS:  ws://127.0.0.1:8000/ws/events"
echo ""
wait
