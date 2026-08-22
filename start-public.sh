#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"
if [[ ! -d venv ]]; then python3 -m venv venv && ./venv/bin/pip install -r requirements.txt; fi
./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
API_PID=$!
sleep 2
"$ROOT/.tools/cloudflared" tunnel --url http://127.0.0.1:8000
kill $API_PID 2>/dev/null || true
