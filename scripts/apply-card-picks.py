#!/usr/bin/env python3
"""Replace college card arrays in combos.ts with picks from combo-content.txt."""
import re

# Read the picked cards, grouped by college comment headers
with open('combo-content.txt') as f:
    content = f.read()

# Parse into college -> cards
college_cards = {}
current_college = None
college_order = {
    'Silverquill': 'silverquill',
    'Prismari': 'prismari',
    'Witherbloom': 'witherbloom',
    'Lorehold': 'lorehold',
    'Quandrix': 'quandrix',
}

for line in content.splitlines():
    line = line.strip()
    # Match comment headers like "// Silverquill (W/B)"
    header = re.match(r'//\s*(\w+)\s*\(', line)
    if header:
        name = header.group(1)
        current_college = college_order.get(name)
        if current_college:
            college_cards[current_college] = []
        continue
    # Match card entries
    if current_college and line.startswith('{ name:'):
        # Normalize: ensure proper indentation
        college_cards[current_college].append('      ' + line)

# Read combos.ts
with open('src/data/combos.ts') as f:
    ts = f.read()

# For each college, replace the cards array contents
for college_id, cards in college_cards.items():
    # Pattern: find cards: [\n...] for this college
    # Match from "cards: [" to the closing "]" for the specific college block
    pattern = re.compile(
        r'(id:\s*"' + college_id + r'".*?cards:\s*\[\n)(.*?)(\n\s*\],)',
        re.DOTALL
    )
    match = pattern.search(ts)
    if not match:
        print(f"WARNING: Could not find {college_id} cards block!")
        continue

    new_cards = '\n'.join(cards)
    ts = ts[:match.start(2)] + new_cards + ts[match.end(2):]
    print(f"{college_id}: replaced with {len(cards)} cards")

with open('src/data/combos.ts', 'w') as f:
    f.write(ts)

print("\nDone! Cards replaced in src/data/combos.ts")
