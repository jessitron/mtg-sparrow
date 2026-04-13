#!/bin/bash
# Generate an HTML card picker for SOS/SOC college cards.
# Fetches candidates from Scryfall and builds a visual selection page.
# Usage: scripts/generate-card-picker.sh
# Output: /tmp/card-picker.html (open in browser)
set -e

COLLEGES=(
  "silverquill WB Silverquill"
  "prismari UR Prismari"
  "witherbloom BG Witherbloom"
  "lorehold RW Lorehold"
  "quandrix GU Quandrix"
)

fetch_cards_json() {
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
    if [ "$obj_type" = "error" ]; then break; fi

    all_cards=$(python3 -c "
import sys, json
existing = json.loads(sys.argv[1])
result = json.loads(sys.stdin.read())
for card in result.get('data', []):
    if 'image_uris' not in card:
        continue
    existing.append({
        'name': card['name'],
        'colors': card.get('colors', []),
        'set': card.get('set', ''),
        'rarity': card.get('rarity', ''),
        'type_line': card.get('type_line', ''),
        'imageUrl': card['image_uris']['normal'],
    })
print(json.dumps(existing))
" "$all_cards" <<< "$result")

    url=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('next_page',''))" 2>/dev/null)
    if [ -z "$url" ]; then break; fi
    sleep 0.2
  done

  echo "$all_cards"
}

# Also get current cards from combos.ts
echo "Reading current cards from combos.ts..." >&2
CURRENT_CARDS=$(python3 -c "
import re, json
with open('src/data/combos.ts') as f:
    content = f.read()
pattern = re.compile(r'id:\s*\"(\w+)\".*?tier:\s*\"college\".*?cards:\s*\[(.*?)\]', re.DOTALL)
name_pat = re.compile(r'name:\s*\"([^\"]+)\"')
result = {}
for m in pattern.finditer(content):
    cid, cards_str = m.group(1), m.group(2)
    result[cid] = name_pat.findall(cards_str)
print(json.dumps(result))
")

echo "Fetching candidates from Scryfall..." >&2

ALL_DATA="{}"
for entry in "${COLLEGES[@]}"; do
  read -r id colors label <<< "$entry"
  c1="${colors:0:1}" c2="${colors:1:1}"
  echo "  ${label}..." >&2

  multi=$(fetch_cards_json "(set:sos OR set:soc) is:single-faced c=${c1}${c2} -t:token -t:basic")
  sleep 0.3
  mono1=$(fetch_cards_json "(set:sos OR set:soc) is:single-faced c=${c1} -t:token -t:basic")
  sleep 0.3
  mono2=$(fetch_cards_json "(set:sos OR set:soc) is:single-faced c=${c2} -t:token -t:basic")
  sleep 0.3

  ALL_DATA=$(python3 -c "
import sys, json
data = json.loads(sys.argv[1])
data[sys.argv[2]] = {
    'label': sys.argv[3],
    'colors': [sys.argv[4], sys.argv[5]],
    'multi': json.loads(sys.argv[6]),
    'mono1': json.loads(sys.argv[7]),
    'mono2': json.loads(sys.argv[8]),
}
print(json.dumps(data))
" "$ALL_DATA" "$id" "$label" "$c1" "$c2" "$multi" "$mono1" "$mono2")
done

echo "Generating HTML..." >&2

python3 - "$ALL_DATA" "$CURRENT_CARDS" > /tmp/card-picker.html <<'PYEOF'
import sys, json

all_data = json.loads(sys.argv[1])
current_cards = json.loads(sys.argv[2])

print("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MTG Sparrow — College Card Picker</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }
  h1 { margin-bottom: 10px; }
  .controls { position: sticky; top: 0; background: #1a1a2e; padding: 10px 0 15px; z-index: 100; border-bottom: 2px solid #444; }
  .tab-bar { display: flex; gap: 5px; margin-bottom: 10px; }
  .tab-bar button { padding: 8px 16px; border: 1px solid #555; background: #2a2a3e; color: #ccc;
    border-radius: 4px; cursor: pointer; font-size: 14px; }
  .tab-bar button.active { background: #4a4a6e; color: #fff; border-color: #888; }
  .output-bar { display: flex; gap: 10px; align-items: center; }
  .output-bar button { padding: 6px 14px; border: 1px solid #555; background: #2a5a2a;
    color: #fff; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .output-bar button:hover { background: #3a7a3a; }
  .output-bar .count { font-size: 13px; color: #aaa; }
  .college-section { display: none; }
  .college-section.active { display: block; }
  h2 { margin: 15px 0 5px; color: #cda434; }
  h3 { margin: 10px 0 5px; color: #8a8; font-size: 14px; }
  .card-grid { display: flex; flex-wrap: wrap; gap: 10px; padding: 5px 0; }
  .card-slot { position: relative; width: 200px; cursor: pointer; border-radius: 10px;
    transition: transform 0.1s, box-shadow 0.1s; }
  .card-slot:hover { transform: scale(1.03); }
  .card-slot.selected { box-shadow: 0 0 0 3px #4CAF50, 0 0 12px #4CAF5088; }
  .card-slot.current { box-shadow: 0 0 0 3px #2196F3, 0 0 12px #2196F388; }
  .card-slot.selected.current { box-shadow: 0 0 0 3px #4CAF50, 0 0 0 6px #2196F3, 0 0 12px #4CAF5088; }
  .card-slot img { width: 100%; border-radius: 10px; display: block; }
  .card-slot .badge { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px;
    border-radius: 50%; background: #333; border: 2px solid #888; display: flex;
    align-items: center; justify-content: center; font-size: 14px; }
  .card-slot.selected .badge { background: #4CAF50; border-color: #4CAF50; }
  .card-slot .current-badge { position: absolute; top: 5px; left: 5px; padding: 2px 6px;
    border-radius: 4px; background: #2196F3; color: #fff; font-size: 10px; font-weight: bold; }
  .card-slot .card-label { text-align: center; font-size: 11px; padding: 3px 0; color: #bbb; }
  #output-area { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: #000c; z-index: 200; padding: 40px; }
  #output-area .inner { background: #1a1a2e; border: 1px solid #555; border-radius: 8px;
    padding: 20px; max-width: 900px; margin: 0 auto; max-height: 90vh; overflow-y: auto; }
  #output-area textarea { width: 100%; height: 60vh; background: #111; color: #0f0;
    font-family: monospace; font-size: 13px; border: 1px solid #444; border-radius: 4px; padding: 10px; }
  #output-area button { margin-top: 10px; padding: 8px 16px; background: #555; color: #fff;
    border: none; border-radius: 4px; cursor: pointer; }
</style>
</head>
<body>
<h1>College Card Picker</h1>
<p style="color:#888;margin-bottom:10px;">Click cards to select. Blue border = currently in code. Green border = selected for new list.</p>
<div class="controls">
  <div class="tab-bar" id="tabs"></div>
  <div class="output-bar">
    <button onclick="generateOutput()">Generate Code</button>
    <button onclick="selectAllCurrent()">Select All Current</button>
    <span class="count" id="selection-count"></span>
  </div>
</div>
<div id="colleges"></div>
<div id="output-area" onclick="if(event.target===this)this.style.display='none'">
  <div class="inner">
    <h2>Generated Card Entries</h2>
    <p style="color:#888;margin-bottom:10px;">Paste into the cards array for each college in src/data/combos.ts</p>
    <textarea id="output-text" readonly></textarea>
    <button onclick="document.getElementById('output-area').style.display='none'">Close</button>
    <button onclick="copyOutput()">Copy to Clipboard</button>
  </div>
</div>
<script>
""")

# Emit data
print(f"const collegeData = {json.dumps(all_data)};")
print(f"const currentCards = {json.dumps(current_cards)};")

print("""
const selected = {}; // { collegeId: Set<cardName> }
const colleges = Object.keys(collegeData);
let activeCollege = colleges[0];

function init() {
  const tabs = document.getElementById('tabs');
  const container = document.getElementById('colleges');

  colleges.forEach(id => {
    selected[id] = new Set();
    const info = collegeData[id];
    const current = new Set(currentCards[id] || []);

    // Tab
    const tab = document.createElement('button');
    tab.textContent = info.label;
    tab.dataset.id = id;
    tab.onclick = () => switchTab(id);
    tabs.appendChild(tab);

    // Section
    const section = document.createElement('div');
    section.className = 'college-section';
    section.id = 'section-' + id;

    function addGroup(title, cards) {
      if (!cards.length) return;
      const h = document.createElement('h3');
      h.textContent = title + ' (' + cards.length + ')';
      section.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      cards.forEach(card => {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        if (current.has(card.name)) slot.classList.add('current');
        slot.onclick = () => toggleCard(id, card.name, slot);

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = card.imageUrl;
        img.alt = card.name;
        slot.appendChild(img);

        const badge = document.createElement('div');
        badge.className = 'badge';
        slot.appendChild(badge);

        if (current.has(card.name)) {
          const cb = document.createElement('div');
          cb.className = 'current-badge';
          cb.textContent = 'CURRENT';
          slot.appendChild(cb);
        }

        const label = document.createElement('div');
        label.className = 'card-label';
        label.textContent = card.name + ' [' + card.set + ']';
        slot.appendChild(label);

        grid.appendChild(slot);
      });
      section.appendChild(grid);
    }

    addGroup('Multicolored ' + info.colors.join('/'), info.multi);
    addGroup('Mono ' + info.colors[0], info.mono1);
    addGroup('Mono ' + info.colors[1], info.mono2);

    container.appendChild(section);
  });

  switchTab(activeCollege);
  updateCount();
}

function switchTab(id) {
  activeCollege = id;
  document.querySelectorAll('.tab-bar button').forEach(b => b.classList.toggle('active', b.dataset.id === id));
  document.querySelectorAll('.college-section').forEach(s => s.classList.toggle('active', s.id === 'section-' + id));
}

function toggleCard(collegeId, name, slot) {
  if (selected[collegeId].has(name)) {
    selected[collegeId].delete(name);
    slot.classList.remove('selected');
  } else {
    selected[collegeId].add(name);
    slot.classList.add('selected');
  }
  slot.querySelector('.badge').textContent = selected[collegeId].has(name) ? '✓' : '';
  updateCount();
}

function selectAllCurrent() {
  colleges.forEach(id => {
    const current = currentCards[id] || [];
    const section = document.getElementById('section-' + id);
    section.querySelectorAll('.card-slot').forEach(slot => {
      const name = slot.querySelector('.card-label').textContent.replace(/ \\[.*/, '');
      if (current.includes(name) && !selected[id].has(name)) {
        selected[id].add(name);
        slot.classList.add('selected');
        slot.querySelector('.badge').textContent = '✓';
      }
    });
  });
  updateCount();
}

function updateCount() {
  const total = colleges.reduce((sum, id) => sum + selected[id].size, 0);
  const perCollege = colleges.map(id => collegeData[id].label + ': ' + selected[id].size).join(', ');
  document.getElementById('selection-count').textContent = total + ' selected (' + perCollege + ')';
}

function getAllCards(collegeId) {
  const info = collegeData[collegeId];
  return [...info.multi, ...info.mono1, ...info.mono2];
}

function generateOutput() {
  let output = '';
  colleges.forEach(id => {
    if (selected[id].size === 0) return;
    const info = collegeData[id];
    const allCards = getAllCards(id);
    const cardMap = {};
    allCards.forEach(c => { cardMap[c.name] = c; });

    output += '    // ' + info.label + ' (' + info.colors.join('/') + ')\\n';
    selected[id].forEach(name => {
      const card = cardMap[name];
      if (card) {
        output += '      { name: "' + card.name.replace(/"/g, '\\\\"') + '", imageUrl: "' + card.imageUrl + '" },\\n';
      }
    });
    output += '\\n';
  });
  document.getElementById('output-text').value = output;
  document.getElementById('output-area').style.display = 'block';
}

function copyOutput() {
  const ta = document.getElementById('output-text');
  ta.select();
  navigator.clipboard.writeText(ta.value);
}

init();
</script>
</body>
</html>""")
PYEOF

echo "Card picker written to /tmp/card-picker.html" >&2
echo "Open it with: open /tmp/card-picker.html" >&2
