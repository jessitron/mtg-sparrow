#!/bin/bash
# Find SOS/SOC cards that could be used as college examples.
# For each college color pair, queries Scryfall for single-faced cards.
# Groups results: multicolored (exact pair) first, then mono-colored.
# Usage: scripts/find-sos-candidates.sh [college-id]
#   e.g. scripts/find-sos-candidates.sh lorehold
#   omit college-id to list all colleges
set -e

COLLEGES=(
  "silverquill WB Silverquill"
  "prismari UR Prismari"
  "witherbloom BG Witherbloom"
  "lorehold RW Lorehold"
  "quandrix GU Quandrix"
)

FILTER="${1:-}"

fetch_cards() {
  local query="$1"
  local encoded
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
  local url="https://api.scryfall.com/cards/search?q=${encoded}&order=name&unique=cards"
  local all_cards="[]"

  while [ -n "$url" ]; do
    local result
    result=$(curl -s "$url" -H "User-Agent: MTGSparrow/1.0")

    local obj_type
    obj_type=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('object',''))" 2>/dev/null)
    if [ "$obj_type" = "error" ]; then
      break
    fi

    all_cards=$(python3 -c "
import sys, json
existing = json.loads(sys.argv[1])
result = json.loads(sys.stdin.read())
existing.extend(result.get('data', []))
print(json.dumps(existing))
" "$all_cards" <<< "$result")

    url=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('next_page',''))" 2>/dev/null)
    if [ -z "$url" ]; then break; fi
    sleep 0.2
  done

  echo "$all_cards"
}

print_cards() {
  local cards_json="$1" label="$2"
  python3 -c "
import sys, json
cards = json.loads(sys.argv[1])
label = sys.argv[2]
if not cards:
    print(f'  ({label}: none)')
    sys.exit(0)
print(f'  --- {label}: {len(cards)} cards ---')
for card in cards:
    name = card['name']
    colors = '/'.join(sorted(card.get('colors', []))) or 'colorless'
    setcode = card.get('set', '??')
    rarity = card.get('rarity', '?')[0].upper()
    type_line = card.get('type_line', '')
    img = card.get('image_uris', {}).get('normal', 'NO_IMAGE')
    print(f'  [{setcode}] {rarity} {name} ({colors})')
    print(f'    {img}')
" "$cards_json" "$label"
}

search_college() {
  local id="$1" colors="$2" label="$3"
  local c1="${colors:0:1}" c2="${colors:1:1}"

  echo "=== ${label} (${c1}/${c2}) ==="
  echo ""

  # Multicolored: exactly this pair
  local multi_query="(set:sos OR set:soc) is:single-faced c=${c1}${c2} -t:token -t:basic"
  local multi_cards
  multi_cards=$(fetch_cards "$multi_query")
  print_cards "$multi_cards" "Multicolored ${c1}/${c2}"
  echo ""

  sleep 0.5

  # Mono c1
  local mono1_query="(set:sos OR set:soc) is:single-faced c=${c1} -t:token -t:basic"
  local mono1_cards
  mono1_cards=$(fetch_cards "$mono1_query")
  print_cards "$mono1_cards" "Mono-${c1}"
  echo ""

  sleep 0.5

  # Mono c2
  local mono2_query="(set:sos OR set:soc) is:single-faced c=${c2} -t:token -t:basic"
  local mono2_cards
  mono2_cards=$(fetch_cards "$mono2_query")
  print_cards "$mono2_cards" "Mono-${c2}"
  echo ""
}

for entry in "${COLLEGES[@]}"; do
  read -r id colors label <<< "$entry"
  if [ -n "$FILTER" ] && [ "$FILTER" != "$id" ]; then
    continue
  fi
  search_college "$id" "$colors" "$label"
  sleep 0.5
done
