#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PID_FILE=".serve.pid"

if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Server already running (PID $(cat "$PID_FILE"))"
  exit 0
fi

npx serve . -l 3000 &>/tmp/sparrow-serve.log &
echo $! > "$PID_FILE"
echo "Server started (PID $(cat "$PID_FILE")), waiting for it to be ready..."
sleep 2

if curl -s -o /dev/null -w '' http://localhost:3000/ 2>/dev/null; then
  echo "Server is ready at http://localhost:3000"
else
  echo "Warning: server may not be ready yet, check /tmp/sparrow-serve.log"
fi
