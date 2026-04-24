#!/bin/bash
# Download Strixhaven college crest SVGs from MTG Salvation Fandom wiki
# Source: static.wikia.nocookie.net/mtgsalvation_gamepedia
# These are SVG watermarks matching the format used in card printing
# Usage: scripts/download-college-crests.sh

set -euo pipefail

DEST_DIR="/Users/jessitron/code/jessitron/mtg-sparrow/images/watermarks/strixhaven"

echo "=== Downloading Strixhaven college crest SVGs ==="
echo ""
echo "Destination: $DEST_DIR"
echo ""

mkdir -p "$DEST_DIR"

download_svg() {
  local name="$1"
  local url="$2"
  local dest="$DEST_DIR/${name}.svg"

  echo -n "  Downloading ${name}.svg ... "
  http_code=$(curl -s -L -w "%{http_code}" -o "$dest" "$url" \
    -H "User-Agent: MTGSparrow/1.0")
  if [ "$http_code" = "200" ]; then
    size=$(wc -c < "$dest")
    # Verify it's really SVG (not HTML error page)
    if head -1 "$dest" | grep -qi "svg\|xml"; then
      echo "OK — ${size} bytes (SVG confirmed)"
    else
      first_line=$(head -1 "$dest")
      echo "WARNING — ${size} bytes but first line: ${first_line:0:60}"
    fi
  else
    echo "FAILED (HTTP $http_code)"
    rm -f "$dest"
  fi
}

# SVG watermarks — from MTG Salvation wiki, uploaded April 2026
# All verified to return real SVG content

download_svg "silverquill" \
  "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/0/05/Silverquill_watermark.svg/revision/latest?cb=20260414011843"

download_svg "prismari" \
  "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/c/c9/Prismari_watermark.svg/revision/latest?cb=20260414011930"

download_svg "witherbloom" \
  "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/f/fa/Witherbloom_watermark.svg/revision/latest?cb=20260414011945"

download_svg "lorehold" \
  "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/4/42/Lorehold_watermark.svg/revision/latest?cb=20260414012020"

download_svg "quandrix" \
  "https://static.wikia.nocookie.net/mtgsalvation_gamepedia/images/d/d5/Quandrix_watermark.svg/revision/latest?cb=20260414012045"

echo ""
echo "=== Summary ==="
echo ""
ls -la "$DEST_DIR/"
echo ""
echo "File types:"
for f in "$DEST_DIR"/*.svg; do
  echo "  $(basename "$f"): $(file "$f" | cut -d: -f2)"
done
