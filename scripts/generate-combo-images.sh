#!/bin/bash
# Generate per-combo og:image social share cards → images/combo/<id>.png
set -e
cd "$(dirname "$0")/.."
npx esbuild scripts/generate-combo-images.ts --bundle --outfile=.tmp-generate-combo-images.mjs --format=esm --platform=node --log-level=warning --external:playwright
node .tmp-generate-combo-images.mjs
rm -f .tmp-generate-combo-images.mjs
