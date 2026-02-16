#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PID_FILE=".serve.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No PID file found — server may not be running"
  exit 0
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Server stopped (PID $PID)"
else
  echo "Server process $PID not found — already stopped"
fi

rm -f "$PID_FILE"
