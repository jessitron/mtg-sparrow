#!/bin/bash
# Generate static HTML pages for each color combo → dist/combo/<id>.html
set -e
npx esbuild scripts/build-combos.ts --bundle --outfile=/tmp/build-combos.mjs --format=esm --platform=node --log-level=warning
node /tmp/build-combos.mjs
