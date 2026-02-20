# Sparrow Deck for MTG Color Combinations

A perceptual learning app for Magic: The Gathering color combination names — built with Vanilla TypeScript, esbuild, and Honeycomb observability.

**Current version:** v0.5.0

---

## What It Is

Magic: The Gathering uses specific proper nouns for color combinations — names like "Azorius" (White-Blue), "Grixis" (Blue-Black-Red), and "Temur" (Green-Blue-Red). New players encounter these terms immediately but the names are arbitrary and non-obvious.

This app applies the [Sparrow Deck](https://www.youtube.com/watch?v=...) perceptual learning technique: rapid-fire exposure to many examples in short bursts trains the brain's pattern recognition system rather than analytical memory.

**The interaction is simple:**
1. A welcome screen appears with instructions
2. Click "Learn guild names" to start a session
3. See mana pips → say the combo name aloud → the name auto-reveals → next card appears
4. After 50 cards, rate how it felt

There is no scoring, no pass/fail, no timer. Say the name aloud — that's the whole technique.

---

## What's Implemented

- Welcome screen with instructions and the Boros fallback hint
- 10 guild names (two-color combinations) displayed as standard mana symbols
- 50-card sessions with auto-reveal (2.5s) and auto-advance (1.5s)
- Early tap/spacebar to skip ahead
- Pause and Stop controls
- Self-assessment prompt after each session ("How did that feel?")
- Combo summary (mana symbols shown as images) at session end
- Honeycomb traces for every session and card

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
```

### Run Verification Tests

```bash
# Requires server running on :3000
node scripts/test-v0.5.0.mjs
```

---

## Project Structure

```
src/
  main.ts                 # App entry point — session lifecycle, event handlers, welcome screen
  session.ts              # Session state, deck building (Fisher-Yates shuffle), timing constants
  data/combos.ts          # All color combination records (guilds + shards + wedges)
  ui/render.ts            # DOM rendering functions
  telemetry/
    init.ts               # Honeycomb SDK initialization (internal — do not import directly)
    telemetry.ts          # App-facing telemetry API (the only file app code should import from)
index.html
style.css
dist/                     # Build output (not committed)
scripts/                  # All runnable commands are shell scripts here
```

### Key Constants (in `src/session.ts`)

| Constant | Default | Purpose |
|---|---|---|
| `SESSION_CARD_COUNT` | 50 | Cards per session |
| `REVEAL_DELAY_MS` | 2500 | Time before name auto-reveals |
| `ADVANCE_DELAY_MS` | 1500 | Time after reveal before next card |

These are intentional tuning parameters. Adjust and observe via Honeycomb.

---

## Observability

Every session produces a trace in Honeycomb:

- **Session span**: `session.tier`, `session.card_count`, `session.completed`, `session.duration_ms`, `session.self_assessment`, `session.started_from`, `session.welcome_dwell_ms`
- **Card spans** (children): `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`, `card.advanced_early`
- **Resource**: `service.name = "sparrow-deck"`, `service.version`, `browser.language`, `browser.platform`

After a session starts, the footer shows a direct link to the session trace in Honeycomb.

**Honeycomb environment**: `modernity` / dataset: `sparrow-deck`

---

## Architecture Decisions

Key decisions are recorded in:
- `small-arc-studios/roles/librarian/notes/decision-log.md` — full decision history (DEC-001 through DEC-032)
- `docs/PROPOSAL.md` — original proposal with client annotations
- `small-arc-studios/roles/librarian/notes/arc*-record.md` — per-arc records

Notable decisions:
- **No framework** — Vanilla TypeScript + esbuild. The app is a card flipper; a framework adds overhead without solving a real problem.
- **No scoring** — Perceptual learning is undermined by evaluation anxiety. No scores, no streaks, no leaderboards.
- **Telemetry wrapper** — `src/telemetry/telemetry.ts` is the only file that imports from `@honeycombio/opentelemetry-web`. All other app code calls domain-meaningful helpers.
- **All commands via scripts** — Nothing runs with raw `npm`/`npx` directly. Scripts live in `scripts/`.

---

## Arc History

| Arc | Version | Name | Status |
|-----|---------|------|--------|
| 1 | 0.1.0 | Project Scaffolding | COMPLETE |
| 2a | 0.2.0 | Render a Single Card | COMPLETE |
| 2b | 0.3.0 | Cycle Through a Deck | COMPLETE |
| 4 | 0.4.0 | Session End Experience | COMPLETE |
| 5 | 0.5.0 | Welcome Screen | COMPLETE |

---

## Built By

Small Arc Studio — practicing Graceful Development.
