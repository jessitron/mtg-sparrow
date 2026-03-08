#!/usr/bin/env bash
# Send a deploy marker to Honeycomb
# Requires HONEYCOMB_API_KEY environment variable
set -euo pipefail

if [ -z "${HONEYCOMB_API_KEY:-}" ]; then
  echo "Error: HONEYCOMB_API_KEY not set" >&2
  exit 1
fi

SHA=$(git rev-parse HEAD)
SHORT_SHA=$(git rev-parse --short HEAD)
REPO_URL=$(git remote get-url origin | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|')
VERSION=$(node -p "require('./package.json').version")

curl -s -X POST https://api.honeycomb.io/1/markers/__all__ \
  -H "X-Honeycomb-Team: $HONEYCOMB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"deploy v$VERSION $SHORT_SHA\",
    \"type\": \"deploy\",
    \"url\": \"$REPO_URL/commit/$SHA\"
  }"

echo "Deploy marker sent for v$VERSION $SHORT_SHA"
