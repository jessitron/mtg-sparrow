#!/usr/bin/env bash
set -euo pipefail

echo "Opening http://localhost:3000 in default browser..."
open http://localhost:3000
echo "Browser opened. The Honeycomb SDK should fire the app.startup span."
echo "Wait a few seconds for the span to be sent, then verify in Honeycomb."
