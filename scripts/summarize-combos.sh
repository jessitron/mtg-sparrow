#!/bin/bash
# Summarize the card data in src/data/combos.ts
set -e
npx esbuild scripts/summarize-combos.ts --bundle --outfile=/tmp/summarize-combos.mjs --format=esm --platform=node --log-level=warning
node /tmp/summarize-combos.mjs
