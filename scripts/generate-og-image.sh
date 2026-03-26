#!/usr/bin/env bash
# Generates images/og-image.png by screenshotting the approved designer mockup.
# Uses Playwright (already in devDependencies) to render the HTML and capture
# the #og-full element at exactly 1200x630.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Generating og-image.png from designer mockup..."
node scripts/screenshot-og-image.mjs
echo "Done."
