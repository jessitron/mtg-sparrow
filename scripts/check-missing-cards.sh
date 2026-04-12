#!/bin/bash
# Check specific cards that came back NOT FOUND during validation (might have been rate-limited).
# Usage: scripts/check-missing-cards.sh
set -e

cards=("Creative Outburst" "Expressive Iteration" "Rushed Rebirth" "Culling Ritual" "Fractal Summoning" "Ecological Appreciation")

for card in "${cards[@]}"; do
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$card'))")
  http_code=$(curl -s -w "%{http_code}" -o /tmp/scryfall-check.json "https://api.scryfall.com/cards/named?exact=$encoded" -H "User-Agent: MTGSparrow/1.0")
  if [ "$http_code" = "200" ]; then
    info=$(python3 -c "import json; d=json.load(open('/tmp/scryfall-check.json')); print(f\"{d.get('set','??')} {'/'.join(sorted(d.get('colors',[]))) or 'colorless'}\")")
    echo "FOUND: $card [$info]"
  elif [ "$http_code" = "429" ]; then
    echo "RATE LIMITED: $card"
  else
    echo "MISSING ($http_code): $card"
  fi
  sleep 1
done
