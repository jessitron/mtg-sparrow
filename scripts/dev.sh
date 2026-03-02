#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
trap 'kill $(jobs -p) 2>/dev/null' EXIT
esbuild src/main.ts --bundle --outfile=dist/bundle.js --sourcemap --format=esm --watch &
esbuild src/slides.ts --bundle --outfile=dist/slides.js --sourcemap --format=esm --watch &
wait
