#!/bin/bash
# Look up a card on Scryfall and print its normal image URL
# Usage: scripts/lookup-card.sh "Card Name"
set -e
CARD_NAME="$1"
if [ -z "$CARD_NAME" ]; then
  echo "Usage: $0 \"Card Name\"" >&2
  exit 1
fi

ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$CARD_NAME'))")
RESULT=$(curl -s "https://api.scryfall.com/cards/named?exact=$ENCODED" -H "User-Agent: MTGSparrow/1.0")
echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('image_uris',{}).get('normal','NOT_FOUND'))" 2>/dev/null || echo "ERROR: Card not found: $CARD_NAME"
