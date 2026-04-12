#!/bin/bash
# Find replacement cards for missing/double-faced STX cards.
# Lists single-faced STX cards that fit specific color pairs.
# Usage: scripts/find-stx-replacements.sh
python3 - /tmp/scryfall-default-cards.json <<'PYEOF'
import json, sys

bulk_file = sys.argv[1]
with open(bulk_file, 'r', encoding='utf-8') as f:
    cards = json.load(f)

def show_cards_for_colors(target_colors, label):
    print(f"\n=== {label} ({'/'.join(target_colors)}) - single-faced STX cards ===")
    target = set(target_colors)
    seen = set()
    for card in cards:
        if card.get('set') != 'stx':
            continue
        if 'image_uris' not in card:
            continue  # skip double-faced
        colors = set(card.get('colors', []))
        if colors != target:
            continue
        name = card['name']
        if name in seen:
            continue
        seen.add(name)
        url = card['image_uris']['normal']
        print(f"  {name}: {url}")

# Witherbloom replacements (B/G)
show_cards_for_colors(['B', 'G'], "Witherbloom")

# Quandrix replacements (G/U)
show_cards_for_colors(['G', 'U'], "Quandrix")
PYEOF
