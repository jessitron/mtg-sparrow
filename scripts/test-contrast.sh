#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3847
PID_FILE=".test-serve.pid"

# Start test server if not already running
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Test server already running (PID $(cat "$PID_FILE"))"
else
  npx serve . -l "$PORT" &>/tmp/sparrow-test-serve.log &
  echo $! > "$PID_FILE"
  echo "Test server started on port $PORT (PID $(cat "$PID_FILE"))"
  sleep 2
fi

# Run contrast screenshot-diff test
echo "Running contrast screenshot-diff test..."
npm run test:contrast-diff
EXIT_CODE=$?

# Stop test server
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  kill "$PID" 2>/dev/null && echo "Test server stopped" || true
  rm -f "$PID_FILE"
fi

exit $EXIT_CODE
