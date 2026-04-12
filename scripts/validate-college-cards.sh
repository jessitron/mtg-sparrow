#!/bin/bash
# Validate that all college example cards have correct colors.
# Queries Scryfall for each card and checks colors match the college.
# Usage: scripts/validate-college-cards.sh
set -e

python3 - src/data/combos.ts <<'PYEOF'
import re, sys, json, time, subprocess, urllib.parse

ts_file = sys.argv[1]
with open(ts_file, 'r') as f:
    content = f.read()

# Extract college blocks
college_pattern = re.compile(
    r'id:\s*"(\w+)".*?name:\s*"(\w+)".*?colors:\s*\[([^\]]+)\].*?tier:\s*"college".*?cards:\s*\[(.*?)\]',
    re.DOTALL
)
card_name_pattern = re.compile(r'name:\s*"([^"]+)"')
color_pattern = re.compile(r'"([WUBRG])"')

colleges = []
for m in college_pattern.finditer(content):
    cid, cname, color_str, cards_str = m.groups()
    colors = set(color_pattern.findall(color_str))
    card_names = card_name_pattern.findall(cards_str)
    colleges.append((cid, cname, colors, card_names))

print(f"Found {len(colleges)} colleges, {sum(len(c[3]) for c in colleges)} total cards\n")

def lookup_card(name, retries=3):
    """Look up a card, retrying on 429 with backoff."""
    encoded = urllib.parse.quote(name)
    url = f"https://api.scryfall.com/cards/named?exact={encoded}"
    for attempt in range(retries):
        result = subprocess.run(
            ["curl", "-s", "-w", "\n%{http_code}", url, "-H", "User-Agent: MTGSparrow/1.0"],
            capture_output=True, text=True, timeout=30
        )
        lines = result.stdout.rsplit('\n', 1)
        if len(lines) == 2:
            body, status = lines
        else:
            return None
        if status == "429":
            wait = 2 ** attempt * 5  # 5s, 10s, 20s
            print(f"  (rate limited, waiting {wait}s...)", flush=True)
            time.sleep(wait)
            continue
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return None
    return None

issues = []
for cid, cname, expected_colors, card_names in colleges:
    print(f"=== {cname} (expected: {'/'.join(sorted(expected_colors))}) ===")
    for card_name in card_names:
        data = lookup_card(card_name)
        if not data or data.get('object') == 'error':
            print(f"  NOT FOUND: {card_name}")
            issues.append((cname, card_name, "NOT FOUND"))
            time.sleep(0.15)
            continue

        actual_colors = set(data.get('colors', []))
        card_set = data.get('set', '??')
        is_dfc = 'image_uris' not in data

        # Colors: exact match, subset (mono-color fits), or colorless (lands)
        color_ok = actual_colors == expected_colors
        subset_ok = actual_colors.issubset(expected_colors) and len(actual_colors) > 0
        colorless_ok = len(actual_colors) == 0

        status_parts = []
        if not (color_ok or subset_ok or colorless_ok):
            status_parts.append(f"WRONG COLORS: {'/'.join(sorted(actual_colors)) or 'colorless'}")
            issues.append((cname, card_name, f"has {'/'.join(sorted(actual_colors))}, expected {'/'.join(sorted(expected_colors))}"))
        if is_dfc:
            status_parts.append("DFC")
            issues.append((cname, card_name, "double-faced card"))

        if status_parts:
            print(f"  BAD  {card_name} [{card_set}] — {', '.join(status_parts)}")
        else:
            color_label = '/'.join(sorted(actual_colors)) if actual_colors else 'colorless'
            print(f"  ok   {card_name} [{card_set}] ({color_label})")

        time.sleep(0.5)  # Stay well under 10 req/s
    print()

if issues:
    print(f"\n{'='*60}")
    print(f"SUMMARY: {len(issues)} issues found")
    print(f"{'='*60}")
    for cname, card_name, problem in issues:
        print(f"  {cname}: {card_name} — {problem}")
else:
    print("\nAll cards validated OK!")
PYEOF
