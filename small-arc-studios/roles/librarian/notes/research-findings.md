# Research Findings

Findings from domain experts, recorded as they arrive.

---

## RF-001: Sparrow Deck Technique
- **Date**: 2026-02-15
- **Source**: Domain Expert (sparrow-deck-expert)
- **Full report**: `small-arc-studios/roles/domain-expert/notes/sparrow-deck-research.md`

### Summary

A Sparrow Deck is a rapid-fire perceptual learning technique created by Llewellyn Falco. It trains intuitive classification through compressed exposure — not through memorization or testing.

### Core Mechanics
1. **See** a stimulus
2. **Guess** the classification
3. **Say it out loud** (verbal reinforcement)
4. **See the answer** (immediate feedback)
5. **Move on quickly** (speed is the point)

### Session Structure
- 50-100 examples in a 3-minute burst
- Short, intense sessions — not long, studious ones
- Rapid pace engages pattern recognition over analytical reasoning

### Critical Design Constraint (DEC-003 pending)
**A Sparrow Deck is NOT a quiz.** This is the most design-shaping finding so far:
- No scoring, no pass/fail, no penalties
- No accuracy measurement as a goal
- Speed and volume of exposure drive learning, not deliberation
- The value is in the rapid exposure cycle itself
- Confidence tracking (not grading) may be appropriate as a progress signal

### How It Differs from Flashcards
- Flashcards: slow, self-paced, explicit memorization of individual facts
- Sparrow Deck: rapid-fire, timed, implicit/perceptual learning across patterns
- Grounded in perceptual learning research (Kathy Sierra, "Badass: Making Users Awesome")

### Why Speed Matters
Speed prevents the analytical/conscious mind from taking over. The pattern recognition system — far more powerful for classification — engages when you can't "think about it." This is the same mechanism behind perceptual learning in aviation training (120 minutes matching 1,000+ flight hours).

### Application to MTG Color Names
- ~31 named combinations (mono through five-color)
- Arbitrary proper nouns mapped to color sets — ideal for perceptual learning
- Stimulus options: Colors→Name, Name→Colors, or both
- Mana pip symbols are highly visual — good for rapid recognition
- Progressive difficulty suggested: guilds → shards → wedges → four-color → mixed
- 26 non-mono combinations can be shown multiple times per 50-100 card session

### Existing Implementation
- Angular web app at https://learnwithllew.github.io/SparrowDecks/
- Covers code quality, language identification, sparrow classification, etc.

### Sources Documented
See full report for 7 cited sources including LearnWithLlew, Falco's blog, perceptual learning research.

---

## RF-002: MTG Color Combinations
- **Date**: 2026-02-15
- **Source**: Domain Expert (mtg-colors-expert)
- **Full report**: `small-arc-studios/roles/domain-expert/notes/mtg-color-combinations.md`

### Summary

Magic: The Gathering has 5 colors arranged in a circle (WUBRG — "woo-berg"). Color relationships (allied vs enemy) determine how multi-color combinations are categorized.

### Total Combinations: 32
- Colorless: 1 (no name to learn)
- Mono-color: 5 (just the color names)
- Two-color guilds: 10 (Ravnica, 2005 — universally stable)
- Three-color shards: 5 (Alara, 2008 — universally stable)
- Three-color wedges: 5 (Tarkir, 2014 — standard, some legacy names persist)
- Four-color: 5 (naming is **disputed** — see DEC-004)
- Five-color: 1 (WUBRG)

### Core Learning Set: 20 stable names
The 10 guilds + 5 shards + 5 wedges have well-established, universally used names. These are the foundation.

### Recommended Learning Tiers
1. **Tier 1 — Must Know (10):** Guild names (two-color). Used constantly in all formats.
2. **Tier 2 — Should Know (10):** Shard + Wedge names (three-color). Frequent in Commander and Standard.
3. **Tier 3 — Nice to Know (6):** Four-color Nephilim names + WUBRG. Rarely needed.
4. **Bonus:** Legacy wedge names (BUG, RUG, Junk, American) for understanding veteran players.

### Tiering aligns with Sparrow Deck progressive difficulty
RF-001 suggested progressive difficulty. The natural tier structure (guilds → shards/wedges → four-color) maps directly to Sparrow Deck session design.

### Open Issue: Four-Color Naming
Four-color combinations have no settled community convention. Three competing systems:
- **Nephilim names** (Yore-Tiller, Glint-Eye, Dune-Brood, Ink-Treader, Witch-Maw) — known by enfranchised players
- **"Sans-X" convention** (Sans-Green, Sans-White, etc.) — most practical and commonly understood
- **Commander 2016 names** — not widely adopted

This is a product decision for the client. See DEC-004.

### Key Domain Details
- "U" for Blue because "B" was taken by Black
- Allied colors = adjacent on wheel; Enemy colors = across
- Shards = color + two allies (three consecutive); Wedges = color + two enemies
- Wedge names had legacy alternatives before 2014 (BUG, RUG, Junk, American)

### Sources Documented
See full report for 10 cited sources including Draftsim, MTG Wiki, MTG Arena Zone, Wargamer, WotC.

---

## RF-003: Architecture Recommendation
- **Date**: 2026-02-15
- **Source**: Architect
- **Full report**: `small-arc-studios/roles/architect/notes/architecture-options.md`

### Summary

Three options evaluated: Vanilla TypeScript + Vite, Preact + HTM, and SvelteKit. Recommendation was Option A, amended by client to use esbuild instead of Vite (DEC-009).

### Options Considered
1. **Vanilla TypeScript + Vite** (originally recommended) — no framework, minimal complexity, ~50KB total bundle
2. **Preact + HTM** — component model for a problem that doesn't need one
3. **SvelteKit (SPA mode)** — heaviest tooling for the simplest problem

### Approved Stack (amended per DEC-009)
- **Language**: TypeScript
- **Build**: esbuild (client preference for simplicity, replaces Vite)
- **Hosting**: GitHub Pages (free, zero ops, repo already on GitHub)
- **Observability**: OpenTelemetry Web SDK → Honeycomb via OTLP/HTTP

### Rationale
The app is a card flipper with a timer. The entire interaction is: show stimulus → tap → reveal → next → repeat for 3 minutes. A framework adds overhead without solving a real problem. Engineering attention should focus on observability, not UI abstraction.

### Proposed Project Structure
```
src/
  data/combos.ts       # Color combination data (~2KB)
  core/session.ts      # Session state machine
  core/deck.ts         # Shuffle, tier filtering
  core/timer.ts        # 3-minute countdown
  ui/render.ts         # DOM rendering
  ui/app.ts            # Event handlers, lifecycle
  telemetry/tracing.ts # OTel setup, span helpers
index.html
style.css
```

### Key Span Design (preliminary)
- `session` — wraps entire 3-minute session (tier, card count)
- `card-interaction` — each card cycle (combo shown, time-to-reveal, tier)

### Structural Risks Identified
1. **OTel bundle size** — needs tree-shaking, measure carefully
2. **Honeycomb API key in bundle** — ingest-only key is accepted pattern, needs client confirmation
3. **Timer accuracy** — `requestAnimationFrame` with elapsed time preferred over `setInterval`
4. **Mobile touch handling** — rapid-fire interaction needs to feel good on touch devices

### Open Client Questions
- Does client have a Honeycomb account? (Free tier would work)
- Hosting preference? (GitHub Pages recommended)

### Proposed Arc Sequence (if approved)
1. First Structural Arc: project scaffolding + esbuild + TypeScript + OTel init + version marker
2. First User Arc: single-tier card session (guilds only, no timer yet)
3. Observability strategy (Task #5) to detail span design and Honeycomb setup

---

## RF-004: Interaction Design Concepts
- **Date**: 2026-02-15
- **Source**: Designer
- **Full report**: `small-arc-studios/roles/designer/notes/interaction-concepts.md`

### Design Philosophy
"A shuffling deck of cards, not a test." Every design choice serves rapid-fire exposure. The enemy is friction.

### Core Interaction — The Card Cycle
```
[See mana pips] → [Say name aloud] → [Tap to reveal] → [See name] → [Next card auto-advances]
```
- ~2-3 seconds per card → 60-90 exposures per 3-minute session
- Tap anywhere to reveal (full card is tap target)
- Name fades/slides over pips (no flip — keeps color-name association visible)
- Auto-advance after 800ms hold (user can tap to skip)

### Session Flow
Start Screen → Tier Selection → 3-Minute Session → Session End → Repeat or Next Tier

### Session End: Card Count Only
- Shows "You saw 72 cards in 3 minutes" — volume, not accuracy
- Options: Go Again, Try Next Tier, Done for Now

### Deliberately Omitted
No score, no percentage correct, no streaks, no leaderboards, no "wrong answer" summary (enforces DEC-003)

### Tier Unlock Model
- Guilds (default) → Shards & Wedges → All Core → (future tiers)
- Unlock after completing one session, not accuracy-based
- Prevents "I need to get good first" trap

### "Say It Out Loud" Approach
- Ambient visual prompt on each card (subtle "say it" text or speech bubble)
- First session gets slightly larger onboarding hint
- No microphone — trust the learner

### Mobile vs Desktop
- Mobile primary: card fills viewport, tap anywhere, timer in corner
- Desktop: same layout scaled, spacebar/Enter support
- Single-screen experience during sessions — no navigation, no scrolling

### Accessibility
- Mana pips distinguishable by shape (sun, drop, skull, fire, tree), not just color
- Alt text for all pips, WCAG AA contrast
- Full keyboard support, screen reader announcements
- Reduced motion support

### Design Principles
1. Speed over polish
2. Rhythm over reward
3. Trust the learner
4. One action (tap)
5. The content is the experience

### Open Client Questions
- ~~DEC-016: Learning direction~~ — RESOLVED: Colors→Name only (DEC-016)
- DEC-017: Mana symbol assets (official vs custom, trademark concerns)
- DEC-018: Sound effects (yes/no?)
- DEC-019: Language scope (English-only?)

---

## RF-005: Observability Plan (Updated)
- **Date**: 2026-02-15
- **Updated**: 2026-02-15 — Now reflects Honeycomb Web SDK + wrapper module per DEC-020
- **Source**: Observability Engineer
- **Full report**: `small-arc-studios/roles/observability-engineer/notes/observability-plan.md`

### Guiding Principle
Instrument to answer questions, not to collect data.

### SDK & Wrapper Architecture (DEC-020)
- **SDK**: `@honeycombio/opentelemetry-web` + `@opentelemetry/api`
- **Wrapper module**: `src/telemetry/` exposes domain-meaningful functions only:
  - `startSession(tier)` → session root span
  - `startCard(sessionSpan, combo, cardNumber)` → card child span
  - `revealCard(cardSpan, dwellTimeMs)` → sets dwell time attribute
  - `endCard(cardSpan)` → ends card span
  - `endSession(sessionSpan, cardCount, completed, durationMs)` → sets summary attributes, ends span
- **App code never imports from Honeycomb or OTel directly** — architectural constraint
- Auto-instrumentations: document-load kept; fetch/XHR/user-interactions disabled (noisy for rapid-fire tapping)

### Key Questions to Answer
1. Are people completing sessions? (completion vs abandonment)
2. How many cards per session? (target: 60-90)
3. Which tier is most used? (progression tracking)
4. How long per card? (dwell time)
5. Which combos have longest dwell times? (hardest names)
6. Do dwell times decrease over time? (population-level learning evidence)
7. Is the pipeline working?
8. What app version is in production?

### Anti-Questions (explicitly NOT tracked)
- Individual user identity (no PII, no user IDs, no accounts)
- Correctness / accuracy (not a quiz — DEC-003)
- User "scores" or "performance"

### Trace Structure
- **One trace per session** (3-minute burst = one trace)
- **One child span per card** (60-90 per session)
- Rationale: child spans let us `GROUP BY combo_name` and `AVG(dwell_time_ms)` in Honeycomb

### Session Span Attributes
| Attribute | Purpose |
|-----------|---------|
| `app.version` | Structural version marker |
| `session.tier` | Which tier selected |
| `session.card_count` | Total cards shown |
| `session.completed` | Timer ran to zero vs abandoned |
| `session.duration_ms` | Actual session length |
| `session.id` | Random correlation ID |

### Card Span Attributes
| Attribute | Purpose |
|-----------|---------|
| `card.combo_id` | Which combo shown |
| `card.combo_name` | Human-readable name |
| `card.colors` | Color letters (e.g., "WU") |
| `card.tier` | Tier of this combo |
| `card.number` | Position in session |
| `card.dwell_time_ms` | Time from shown to reveal |

### Resource Attributes (set once at SDK init)
- `service.name`: "sparrow-deck"
- `service.version`: APP_VERSION
- `browser.language`, `browser.platform`

### Structural Version Markers
- `APP_VERSION` constant starting at `0.1.0`
- Set as resource attribute AND session span attribute
- Rendered in UI footer (e.g., "v0.1.0")
- Increment minor version per arc

### Blind Spots Identified
1. **Session abandonment** — `BatchSpanProcessor` buffers; must flush on `visibilitychange`/`beforeunload`
2. **Auto-advance timing** — dwell time tracked but not answer display duration
3. **First-visit vs returning** — can't distinguish without user tracking (by design)
4. **Offline usage** — spans won't send; defer unless it becomes a concern

### Arc Observability Requirements
- **Structural Arc**: Honeycomb Web SDK init, `APP_VERSION = 0.1.0`, version in footer, test `app.startup` span verified in Honeycomb
- **User Arc**: session root span, card child spans, `session.card_count`/`session.completed` set at end, dwell time calculated

### Planned Honeycomb Queries
- Sessions per day, completion rate, cards per session heatmap, tier popularity
- Hardest combos by avg dwell time, dwell time by tier, pacing over card position
- Version adoption, browser distribution

### Bundle Size (updated)
~35-45KB gzipped for Honeycomb Web SDK (slightly larger than raw OTel assembly due to auto-instrumentation infrastructure). App code ~10KB. Total ~45-55KB. Client says bundle size is not a concern (DEC-027).

---

## RF-006: Arc 2 Breakdown (2a / 2b)
- **Date**: 2026-02-15
- **Source**: Architect + Designer
- **Full report**: `small-arc-studios/roles/architect/notes/arc2-breakdown.md`

### Summary
Original Arc 2 ("Card Data & Deck Logic") broken into two smaller arcs, each producing observable change.

### Arc 2a: Render a Single Card (User Arc, v0.2.0)
- Implement guild data model (10 two-color combos, typed for future tiers)
- Mana pip rendering (SVG/image assets, standard community symbols per DEC-017)
- Card layout: pips displayed, name fades in
- **Isolates the hardest visual unknowns**: pip rendering, card layout, data-to-DOM pipeline
- Telemetry: version marker only (0.2.0), no new spans
- Observable outcome: a card rendered on screen

### Arc 2b: Cycle Through the Deck (User Arc, v0.3.0)
- Shuffle logic
- Auto-advance: pips show ~2.5s, name fades in, then next card (tunable delays per DEC-011)
- Early-tap acceleration (optional skip-ahead per DEC-012)
- Sessions run indefinitely (no timer — timer deferred to later arc, card count per DEC-021)
- **Isolates the interaction loop**: auto-advance timing, shuffle, card cycling
- Telemetry: card child spans begin (`card.combo_id`, `card.combo_name`, `card.colors`, `card.dwell_time_ms`)
- Observable outcome: cards cycling with dwell time queryable in Honeycomb

### Why This Boundary
1. Arc 2a isolates visual risk (pip rendering)
2. Arc 2b isolates interaction risk (timing, cycling)
3. Each is independently observable
4. Timing can be tuned without re-risking rendering

### What Stays Out
- Timer / fixed card count: later arc
- Tier filtering/selection: later arc
- "Say it" prompt: polish phase
- Shards & Wedges data: later arc (DEC-026)

---

## RF-007: MTG Player Base & Target Audience
- **Date**: 2026-03-26
- **Source**: Client (market research via AI-assisted search)

### Summary

Estimates of the total MTG player base and the fraction who are realistic targets for mtgcolors.quest.

### Total Player Base
- Estimated range: **35–50 million players** globally

### Target Audience Framing
- The more meaningful metric is the **rate of new players joining**, not the total base.
- The site is useful during a window: after a player is curious enough to care about color identity names, but before they've already learned them.
- Wikipedia (via AI search) cites that **1/3 of MTG players have been playing less than 3 years**. Most of this cohort is in the potential audience — some are too new to care yet, some have already internalized the names.

### Conservative Estimate
- Taking the low bound: 35M × 1/3 ≈ **~10 million players in the potential audience**
- This is deliberately conservative (rounded down from 35M / 3 ≈ 11.7M).

### Language Scope Implications
- Not all players are English speakers.
- MTG is published in **6 languages**, with English as the tournament fallback.
- **Japanese is likely the second most common player language** after English.
- Current DEC-019 scope is English-only. This data does not compel localization now, but establishes the scale of the non-English opportunity for future consideration.
- See DEC-192 for the recorded decision on whether this research changes scope.
