# Sparrow Deck for MTG Color Combinations

A perceptual learning app for Magic: The Gathering color combination names — built with Vanilla TypeScript, esbuild, and Honeycomb observability.

Online: https://jessitron.github.io/mtg-sparrow/

**Current version:** v0.15.0

---

## What It Is

Magic: The Gathering uses specific proper nouns for color combinations — names like "Azorius" (White-Blue), "Grixis" (Blue-Black-Red), and "Temur" (Green-Blue-Red). New players encounter these terms immediately but the names are arbitrary and non-obvious.

This app applies the [Sparrow Deck](https://www.youtube.com/watch?v=...) perceptual learning technique: rapid-fire exposure to many examples in short bursts trains the brain's pattern recognition system rather than analytical memory.

**The interaction is simple:**

1. A welcome screen appears with instructions
2. Click "Learn guild names" to start a session
3. See mana pips → say the combo name aloud → the name auto-reveals → next card appears
4. After 25 cards (or tap "Done for now"), rate how it felt

There is no scoring, no pass/fail, no timer. Say the name aloud — that's the whole technique.

---

## What's Implemented

- Welcome screen with instructions and the Boros fallback hint
- Guild subgroups: sessions begin with the 5 allied guilds (Azorius, Dimir, Rakdos, Gruul, Selesnya)
- Two-column educational session end screen: Allied column always visible; Enemy column unlocks after any enemy practice
- Interactive SVG color wheels: allied pentagon (Arc 8) and enemy star pattern (Arc 9) with bidirectional hover between wheel and guild list
- Gear icon settings panel: version display, Honeycomb trace link, and single-tap progress reset
- 10 guild names (two-color combinations) displayed as standard mana symbols
- 25-card sessions with auto-reveal (3s) and auto-advance (2s)
- Early tap/spacebar to skip ahead
- "Done for now" button to end a session early
- Pause control
- Self-assessment prompt after each session ("How did that feel?")
- "Learn" vs "Practice" button text adapts based on session history
- Honeycomb traces for every session and card

---

## Combo Pages

Static reference pages for each of the 20 color combinations live in `combo/`. Each page includes the combo name, mana pips, a five-color pentagon highlighting the combo's colors, a flavor description, and a gallery of example cards.

- **Index**: `combo/` — all 20 combos in a card grid, grouped by level (allied guilds, enemy guilds, wedges, shards), with "Learn these names" buttons linking to the quiz
- **Detail**: `combo/<id>.html` (e.g., `combo/grixis.html`) — individual combo pages with full card gallery

These are SEO-friendly static HTML generated from `src/data/combos.ts` and `src/data/guild-descriptions.ts`:

```bash
npm run build:combos
```

The end page links to these combo pages from each combo's description.

---

## Running Locally

### Prerequisites

- Node.js (v18+)
- A Honeycomb ingest-only API key configured in `src/telemetry/init.ts`

### Build and Serve

```bash
# Build (production)
./scripts/build.sh

# Build and watch (development)
./scripts/dev.sh

# Serve locally (serves dist/ on port 3000)
./scripts/serve.sh
```

Open `http://localhost:3000` in a browser.

### Type Check

```bash
./scripts/typecheck.sh
# or:
npm run typecheck
```

### Run Verification Tests

```bash
# Requires server running on :3000
npm test
# or directly:
node scripts/test-arc9-enemy-wheel.mjs
```

---

## Project Structure

```
src/
  main.ts                 # Welcome page entry point — telemetry init, start button
  slides.ts               # Slides page entry point — session lifecycle, card display, event handlers
  session.ts              # Session state, deck building (Fisher-Yates shuffle), timing constants
  progression.ts          # Subgroup unlock/completion tracking (localStorage)
  data/combos.ts          # All color combination records (guilds + shards + wedges)
  ui/
    render.ts             # DOM rendering functions
    settings.ts           # Settings panel wiring
    guild-columns.ts      # Two-column guild display with color wheels
    self-assessment.ts    # Self-assessment prompt UI
  telemetry/
    init.ts               # Honeycomb SDK initialization (internal — do not import directly)
    telemetry.ts          # App-facing telemetry API (the only file app code should import from)
index.html                # Welcome page
slides.html               # Slides (session) page
style.css                 # Shared styles
welcome.css               # Welcome page styles
slides.css                # Slides page styles
assessment.css            # Assessment page styles (future)
end.css                   # End page styles (future)
dist/                     # Build output (not committed)
scripts/                  # All runnable commands are shell scripts here
```

### Key Constants (in `src/session.ts`)

| Constant             | Default | Purpose                            |
| -------------------- | ------- | ---------------------------------- |
| `SESSION_CARD_COUNT` | 25      | Cards per session                  |
| `REVEAL_DELAY_MS`    | 3000    | Time before name auto-reveals      |
| `ADVANCE_DELAY_MS`   | 2000    | Time after reveal before next card |

These are intentional tuning parameters. Adjust and observe via Honeycomb.

---

## Observability

Every session produces a trace in Honeycomb:

- **Session span**: `session.tier` (`'guild_allied'` or `'guild_enemy'`), `session.subgroup_size`, `session.card_count`, `session.completed`, `session.duration_ms`, `session.self_assessment`, `session.started_from` (`'welcome_screen'` or `'session_end_screen'`), `session.welcome_dwell_ms`
- **Card spans** (children): `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`, `card.advanced_early`
- **Resource**: `service.name = "sparrow-deck"`, `service.version`, `browser.language`, `browser.platform`

After a session starts, the settings panel (gear icon) shows a direct link to the session trace in Honeycomb.

**Honeycomb environment**: `modernity` / dataset: `sparrow-deck`

---

## Architecture Decisions

Key decisions are recorded in:

- `small-arc-studios/roles/librarian/notes/decision-log.md` — full decision history (DEC-001 through DEC-060+)
- `docs/PROPOSAL.md` — original proposal with client annotations
- `small-arc-studios/roles/librarian/notes/arc*-record.md` — per-arc records

Notable decisions:

- **No framework** — Vanilla TypeScript + esbuild. The app is a card flipper; a framework adds overhead without solving a real problem.
- **No scoring** — Perceptual learning is undermined by evaluation anxiety. No scores, no streaks, no leaderboards.
- **Telemetry wrapper** — `src/telemetry/telemetry.ts` is the only file that imports from `@honeycombio/opentelemetry-web`. All other app code calls domain-meaningful helpers.
- **All commands via scripts** — Nothing runs with raw `npm`/`npx` directly. Scripts live in `scripts/`.

---

## Arc History

| Arc | Version | Name                             | Status   |
| --- | ------- | -------------------------------- | -------- |
| 1   | 0.1.0   | Project Scaffolding              | COMPLETE |
| 2a  | 0.2.0   | Render a Single Card             | COMPLETE |
| 2b  | 0.3.0   | Cycle Through a Deck             | COMPLETE |
| 4   | 0.4.0   | Session End Experience           | COMPLETE |
| 5   | 0.5.0   | Welcome Screen                   | COMPLETE |
| 6   | 0.6.0   | Static Welcome Screen            | COMPLETE |
| 7   | 0.7.0   | Guild Subgroups                  | COMPLETE |
| 8   | 0.8.0   | Session End Screen Redesign      | COMPLETE |
| 8+  | 0.8.0   | Allied Color Wheel               | COMPLETE |
| 9   | 0.8.0   | Enemy Color Wheel (Star Pattern) | COMPLETE |
| 10  | 0.9.0   | Settings (Gear Icon + Panel)     | COMPLETE |
| 11  | 0.10.0  | Card Art Images                  | COMPLETE |
| 12  | 0.11.0  | Mana Gas Background Animation    | COMPLETE |
| 13  | 0.12.0  | Session Timing Tuning            | COMPLETE |
| 14  | 0.13.0  | Session Telemetry (session.id)   | COMPLETE |
| 15  | 0.13.0  | CSS Split (5 files)              | COMPLETE |
| 16  | 0.14.0  | Extract Modules from main.ts     | COMPLETE |
| 17  | 0.15.0  | Create slides.html + slides.ts   | COMPLETE |

---

## Built By

Small Arc Studio — practicing Graceful Development.
