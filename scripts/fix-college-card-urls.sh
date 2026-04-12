#!/bin/bash
# Fix college card URLs in src/data/combos.ts using Scryfall bulk data.
# Downloads the Scryfall "default_cards" bulk data once, then looks up each card locally.
# This avoids all rate-limit issues.
# Usage: scripts/fix-college-card-urls.sh [--skip-download]
#   --skip-download : re-use /tmp/scryfall-default-cards.json if it already exists

set -e
BULK_FILE="/tmp/scryfall-default-cards.json"

if [ "$1" = "--skip-download" ] && [ -f "$BULK_FILE" ]; then
  echo "# Using cached bulk data at $BULK_FILE" >&2
else
  echo "# Fetching Scryfall bulk data index..." >&2
  BULK_URI=$(curl -s "https://api.scryfall.com/bulk-data" -H "User-Agent: MTGSparrow/1.0" \
    | python3 -c "
import sys, json
d = json.load(sys.stdin)
for item in d.get('data', []):
    if item['type'] == 'default_cards':
        print(item['download_uri'])
        break
")
  echo "# Bulk URI: $BULK_URI" >&2
  echo "# Downloading (~100MB, please wait)..." >&2
  curl -s -L "$BULK_URI" -H "User-Agent: MTGSparrow/1.0" -o "$BULK_FILE"
  echo "# Download complete." >&2
fi

# Python script to look up image URLs from bulk data
lookup_from_bulk() {
  local card_name="$1"
  local prefer_set="${2:-stx}"
  python3 - "$card_name" "$prefer_set" "$BULK_FILE" <<'PYEOF'
import sys, json

card_name = sys.argv[1]
prefer_set = sys.argv[2]
bulk_file = sys.argv[3]

name_lower = card_name.lower()

stx_match = None
any_match = None

with open(bulk_file, 'r', encoding='utf-8') as f:
    cards = json.load(f)

for card in cards:
    if card.get('name', '').lower() != name_lower:
        continue
    # Check if double-faced (no top-level image_uris)
    if 'image_uris' not in card:
        if 'card_faces' in card and card['card_faces'] and 'image_uris' in card['card_faces'][0]:
            result = 'DOUBLE_FACED'
        else:
            result = 'NOT_FOUND'
        # Still track best match
        if any_match is None:
            any_match = result
        if card.get('set', '') == prefer_set and stx_match is None:
            stx_match = result
        continue
    url = card['image_uris']['normal']
    if card.get('set', '') == prefer_set:
        stx_match = url
    if any_match is None or any_match in ('NOT_FOUND', 'DOUBLE_FACED'):
        any_match = url

if stx_match and stx_match not in ('NOT_FOUND', 'DOUBLE_FACED'):
    print(stx_match)
elif any_match and any_match not in ('NOT_FOUND', 'DOUBLE_FACED'):
    print(any_match)
elif stx_match == 'DOUBLE_FACED' or any_match == 'DOUBLE_FACED':
    print('DOUBLE_FACED')
else:
    print('NOT_FOUND')
PYEOF
}

process_card() {
  local college="$1"
  local card_name="$2"
  local flavor="$3"

  local image_url
  image_url=$(lookup_from_bulk "$card_name" "stx")

  if [ "$image_url" = "NOT_FOUND" ]; then
    echo "ERROR|$college|$card_name|NOT_FOUND" >&2
    echo "      // SKIP: $card_name not found"
  elif [ "$image_url" = "DOUBLE_FACED" ]; then
    echo "DOUBLE_FACED|$college|$card_name" >&2
    echo "      // SKIP_DOUBLE_FACED: $card_name"
  else
    if [ -n "$flavor" ]; then
      echo "      { name: \"$card_name\", flavor: \"$flavor\", imageUrl: \"$image_url\" },"
    else
      echo "      { name: \"$card_name\", imageUrl: \"$image_url\" },"
    fi
  fi
}

echo "=== SILVERQUILL (W/B) ==="
process_card "silverquill" "Shadrix Silverquill"
process_card "silverquill" "Silverquill Command"
process_card "silverquill" "Silverquill Silencer"
process_card "silverquill" "Killian, Ink Duelist"
process_card "silverquill" "Silverquill Pledgemage"
process_card "silverquill" "Silverquill Apprentice"
process_card "silverquill" "Inkshield"
process_card "silverquill" "Poet's Quill"
process_card "silverquill" "Humiliate"
process_card "silverquill" "Inkling Summoning"
process_card "silverquill" "Professor Onyx"
process_card "silverquill" "Vanishing Verse"
process_card "silverquill" "Witherbloom Apprentice" "A Witherbloom student in a Silverquill card? Only in Strixhaven."
process_card "silverquill" "Expressive Iteration"
process_card "silverquill" "Silverquill Campus"
process_card "silverquill" "Plumb the Forbidden"
process_card "silverquill" "Show of Confidence"

echo ""
echo "=== PRISMARI (U/R) ==="
process_card "prismari" "Galazeth Prismari"
process_card "prismari" "Prismari Command"
process_card "prismari" "Rootha, Mercurial Artist"
process_card "prismari" "Elemental Masterpiece"
process_card "prismari" "Prismari Pledgemage"
process_card "prismari" "Prismari Apprentice"
process_card "prismari" "Creative Outburst"
process_card "prismari" "Expressive Iteration"
process_card "prismari" "Dramatic Finale"
process_card "prismari" "Prismari Campus"
process_card "prismari" "Heated Debate"
process_card "prismari" "Mizzix's Mastery"
process_card "prismari" "Solve the Equation"
process_card "prismari" "Mentor's Guidance"
process_card "prismari" "Serpentine Curve"
process_card "prismari" "Teach by Example"
process_card "prismari" "Quandrix Apprentice" "A Quandrix student visiting Prismari? Campus life at its finest."

echo ""
echo "=== WITHERBLOOM (B/G) ==="
process_card "witherbloom" "Beledros Witherbloom"
process_card "witherbloom" "Witherbloom Command"
process_card "witherbloom" "Dina, Soul Steeper"
process_card "witherbloom" "Witherbloom Pledgemage"
process_card "witherbloom" "Witherbloom Apprentice"
process_card "witherbloom" "Mortality Spear"
process_card "witherbloom" "Tend the Pests"
process_card "witherbloom" "Witherbloom Campus"
process_card "witherbloom" "Pest Summoning"
process_card "witherbloom" "Sedgemoor Witch"
process_card "witherbloom" "Basic Conjuration"
process_card "witherbloom" "Approached from Below"
process_card "witherbloom" "Culling Ritual"
process_card "witherbloom" "Springmane Cervin"
process_card "witherbloom" "Biomathematician"
process_card "witherbloom" "Hunt for Specimens"
process_card "witherbloom" "Necrotic Fumes"

echo ""
echo "=== LOREHOLD (R/W) ==="
process_card "lorehold" "Velomachus Lorehold"
process_card "lorehold" "Lorehold Command"
process_card "lorehold" "Quintorius, Field Historian"
process_card "lorehold" "Lorehold Pledgemage"
process_card "lorehold" "Lorehold Apprentice"
process_card "lorehold" "Reconstruct History"
process_card "lorehold" "Reckless Amplimancer"
process_card "lorehold" "Lorehold Campus"
process_card "lorehold" "Excavation Explosion"
process_card "lorehold" "Study Break"
process_card "lorehold" "Owlin Shieldmage"
process_card "lorehold" "Ingenious Mastery"
process_card "lorehold" "Accumulated Knowledge"
process_card "lorehold" "Returned Pastcaller"
process_card "lorehold" "Fractal Summoning"
process_card "lorehold" "Fuming Effigy"
process_card "lorehold" "Thunderous Orator"

echo ""
echo "=== QUANDRIX (G/U) ==="
process_card "quandrix" "Tanazir Quandrix"
process_card "quandrix" "Quandrix Command"
process_card "quandrix" "Zimone, Quandrix Prodigy"
process_card "quandrix" "Quandrix Pledgemage"
process_card "quandrix" "Quandrix Apprentice"
process_card "quandrix" "Quandrix Cultivator"
process_card "quandrix" "Eureka Moment"
process_card "quandrix" "Quandrix Campus"
process_card "quandrix" "Fractal Summoning"
process_card "quandrix" "Ecological Appreciation"
process_card "quandrix" "Multiple Choice"
process_card "quandrix" "Sequence Engine"
process_card "quandrix" "Square Up"
process_card "quandrix" "Leyline Invocation"
process_card "quandrix" "Paradox Zone"
process_card "quandrix" "Solve the Equation"
process_card "quandrix" "Wandering Archaic"

echo ""
echo "=== DONE ==="
