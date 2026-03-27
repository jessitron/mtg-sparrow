#!/bin/bash
# Batch look up cards on Scryfall and output TypeScript card entries
# Input: one card name per line on stdin
# Output: TypeScript CardReference objects
set -e

while IFS= read -r card_name; do
  [ -z "$card_name" ] && continue
  ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$card_name'''))")
  RESULT=$(curl -s "https://api.scryfall.com/cards/named?exact=$ENCODED" -H "User-Agent: MTGSparrow/1.0")
  URL=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('image_uris',{}).get('normal','NOT_FOUND'))" 2>/dev/null)
  if [ "$URL" = "NOT_FOUND" ] || [ -z "$URL" ]; then
    echo "// ERROR: Card not found: $card_name" >&2
  else
    echo "      { name: \"$card_name\", imageUrl: \"$URL\" },"
  fi
  # Scryfall asks for 50-100ms between requests
  sleep 0.1
done
