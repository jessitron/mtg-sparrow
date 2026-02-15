# Proposal: Sparrow Deck for MTG Color Combinations

> Prepared by: Small Arc Studio
> Date: 2026-02-15
> Status: Draft — Awaiting Client Approval

---

## Executive Summary

We propose building a static web application that uses the Sparrow Deck perceptual learning technique to help new Magic: The Gathering players rapidly learn the community names for color combinations (guild, shard, and wedge names).

The app is intentionally simple in its interaction — show mana pip symbols, the learner says the name aloud and taps to reveal the answer, then the next card auto-advances — but grounded in a specific learning science (perceptual learning) that makes speed and volume of exposure the primary design drivers.

[ client: they don't tap to see the answer, the answer appears after 3s. Then the next card appears automatically... that delay can start at 1.5s, these should be easy to change]

[client: also a question, when does it end? I think Llew ends his after 3m]

The technical stack is proportional to the problem: Vanilla TypeScript, esbuild, GitHub Pages, and Honeycomb Web SDK for observability. No framework. The engineering investment goes into getting the learning interaction right and making the system observable, not into UI abstraction.

**Scope**: 20 core color combination names across two learning tiers.
**Delivery model**: Small arcs, one at a time, each producing observable change.

---

## Problem Statement

Magic: The Gathering's community uses specific proper nouns for color combinations — names like "Azorius" (White-Blue), "Grixis" (Blue-Black-Red), and "Temur" (Green-Blue-Red). New players encounter these terms immediately in deck discussions, tournament coverage, and online communities, but the names are arbitrary and non-obvious. There are 20 commonly-used names that a new player needs to internalize.

Traditional study methods (reading a list, flashcards) are slow and rely on rote memorization. The Sparrow Deck technique — developed by Llewellyn Falco and grounded in perceptual learning research — offers a faster path: rapid-fire exposure to many examples in short bursts trains the brain's pattern recognition system rather than analytical memory.

[client: the sparrow deck distinguishes only 2 things. We're talking about 20. Let's divide them into subgroups, starting with a subset of the 10 guilds]

The client (MTG Deck Builder, CEO: Jessitron) has personally experienced rapid learning via Sparrow Decks and seeks to apply the technique to MTG color combination names in a freely accessible web application.

---

## Goals and Non-Goals

### Goals

1. **Deliver a working Sparrow Deck for MTG color combinations** — a static web app that new players can use immediately to start learning guild, shard, and wedge names.
2. **Faithfully implement the Sparrow Deck technique** — rapid-fire, timed sessions with verbal prompting, no scoring, no evaluation anxiety.
3. **Support progressive difficulty** — start with the 10 guild names, unlock shards and wedges, then a mixed deck. [client: nice]
4. **Observe how people use the tool** — Honeycomb traces that answer real questions about session completion, pacing, and which names are hardest.
5. **Keep it simple** — the app should feel snappy, load fast, and work on mobile and desktop.

[client: and user feedback. Let's ask them after a 3-minute sparrow deck, "how did you do?"]

[client: as a future enhancement - it'll be more like the sparrow deck when we use real card images instead of just mana symbols]

### Non-Goals

- **Not a quiz or test** — no scores, streaks, leaderboards, or accuracy tracking.
- **Not a general-purpose flashcard app** — purpose-built for the Sparrow Deck technique.
- **Not a user-account system** — no login, no PII, no user tracking.
- **No backend** — fully static, no API calls, no database.
- **No four-color combinations** — deferred to future enhancement (naming is disputed in the community).
- **No reverse direction** — Colors-to-Name only; Name-to-Colors deferred.
- **No sound effects** — silent by default; pronunciation audio deferred.
- **No localization** — English only.

---

## Constraints and Assumptions

### Constraints

| Constraint                                                | Source             | Decision Ref     |
| --------------------------------------------------------- | ------------------ | ---------------- |
| Static web app — no backend, no server                    | RFP                | —                |
| Vanilla TypeScript + esbuild — no UI framework            | Client + Architect | DEC-006, DEC-009 |
| GitHub Pages hosting                                      | Client             | DEC-007          |
| Honeycomb Web SDK, wrapped in app module                  | Client             | DEC-008, DEC-020 |
| No PII, no user accounts, no cookies                      | Design philosophy  | DEC-003          |
| Ingest-only Honeycomb API key in JS bundle                | Accepted pattern   | DEC-008          |
| Standard community mana symbols (Scryfall/Gatherer style) | Client             | DEC-017          |
| Colors-to-Name direction only                             | Client             | DEC-016          |
| 20 core names (guilds + shards + wedges)                  | Client             | DEC-004          |

### Assumptions

- The client will provide a Honeycomb ingest-only API key before the first structural arc ships.
- The GitHub repository will be created before deployment.
- Standard mana symbols are licensed for free community sites (no trademark issue for a free app).
- Traffic will be low enough that Honeycomb's free tier is sufficient and 100% trace sampling is viable.
- The Sparrow Deck technique translates effectively to a digital format (supported by existing implementations at learnwithllew.github.io).

---

## Risks and Unknowns

### Technical Risks

| Risk                                               | Likelihood | Impact | Mitigation                                                                                                   |
| -------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Honeycomb Web SDK bundle size exceeds expectations | Medium     | Low    | Measure after first build. Lazy-load SDK after first paint if needed. esbuild `--analyze` to identify bloat. |
| Timer accuracy with `setInterval`                  | Medium     | Medium | Use `requestAnimationFrame` with elapsed time calculation instead.                                           |
| Mobile touch handling feels sluggish               | Low        | High   | Test on real devices early. Tap-anywhere target eliminates precision issues.                                 |
| Session abandonment loses trace data               | High       | Medium | Flush spans on `visibilitychange`/`beforeunload`.                                                            |
| esbuild dev workflow lacks HMR                     | Low        | Low    | Use a file watcher or manual refresh. Acceptable for a small app.                                            |

[client: loading performance is not a concern. Neither is precision of timing. Eliminate tapping (except once to start the deck), replace with auto-advance]

### Product Risks

| Risk                                         | Likelihood | Impact | Mitigation                                                                                    |
| -------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| Learners skip "say it out loud" step         | High       | Medium | Ambient prompting, onboarding hint. Cannot enforce without microphone (rejected per DEC-015). |
| 3-minute sessions feel too long or too short | Medium     | Low    | Timer duration can be adjusted; observability will show completion rates.                     |
| Users want scoring/gamification              | Medium     | Low    | Deliberate omission per learning science (DEC-003, DEC-013). Explain philosophy in UI.        |

[client: yeah, if they don't do it right, that's their choice. They can't always. Ambient prompting is a nice idea]

### Unknowns

- Optimal auto-advance delay (800ms is initial estimate; may need tuning based on observability data).
- Whether dwell time decreases across sessions at the population level (can only be observed after launch).
- Best visual treatment for the "say it" prompt (design iteration during implementation).

[client: does the data say anything about increasing the speed after practice?]

---

## Architectural Approach

### Stack

| Component     | Choice                                               | Rationale                                                                                        |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Language      | TypeScript                                           | Type safety for the data model; standard tooling                                                 |
| Build         | esbuild                                              | Client preference. Fast, simple, produces static output                                          |
| UI Framework  | None (Vanilla DOM)                                   | The app is a card flipper with a timer. A framework adds overhead without solving a real problem |
| Hosting       | GitHub Pages                                         | Free, zero ops, deploy via GitHub Actions                                                        |
| Observability | Honeycomb Web SDK (`@honeycombio/opentelemetry-web`) | Client's Honeycomb account; SDK wrapped in app module per DEC-020                                |

### Alternatives Considered and Rejected

- **Preact + HTM**: Component model for a problem that doesn't need one.
- **SvelteKit (SPA mode)**: Framework scaffolding would outweigh the app code.
- **Raw OTel packages**: More assembly required; Honeycomb Web SDK is simpler.
- **Vite**: Replaced by esbuild at client request.

### Project Structure

```
src/
  data/combos.ts          # All 20 color combination records (~2KB)
  core/session.ts         # Session state machine
  core/deck.ts            # Shuffle, tier filtering
  core/timer.ts           # 3-minute countdown (requestAnimationFrame)
  ui/render.ts            # DOM rendering functions
  ui/app.ts               # Event handlers, lifecycle
  telemetry/init.ts       # Honeycomb SDK initialization (internal)
  telemetry/telemetry.ts  # App-facing telemetry API (domain functions)
index.html
style.css
```

### Data Model

```typescript
type ColorCombo = {
  id: string; // e.g. "azorius"
  name: string; // "Azorius"
  colors: string[]; // ["W", "U"]
  tier: "guild" | "shard" | "wedge";
  flavorText?: string; // e.g. "Senate - law & order"
};
```

The data is static and tiny (~2KB). Imported as a module, no fetching.

### Telemetry Wrapper API

App code calls domain-meaningful functions only — never OTel or Honeycomb types directly:

- `startSession(tier)` — creates session root span
- `startCard(sessionSpan, combo, cardNumber)` — creates card child span
- `revealCard(cardSpan, dwellTimeMs)` — sets dwell time attribute
- `endCard(cardSpan)` — ends card span
- `endSession(sessionSpan, cardCount, completed, durationMs)` — sets summary attributes, ends span

### Bundle Size Estimate

| Component                | Gzipped      |
| ------------------------ | ------------ |
| Honeycomb Web SDK + deps | ~35-45KB     |
| App code                 | ~10KB        |
| **Total**                | **~45-55KB** |

[client: i expect larger for the web SDK, but it's fine]

Fast load on any connection.

---

## Observability Plan

### Guiding Principle

Instrument to answer questions, not to collect data. [client: this is good]

### Questions We Want to Answer

1. Are people completing sessions? (completion vs abandonment)
2. How many cards per session? (target: 60-90)
3. Which tier is most used?
4. How long do people spend on each card? (dwell time)
5. Which combos have the longest dwell times? (hardest names) [client: oh, this is a good idea! Let's let them tap to advance _early_ if they know the answer, and then we get a clue whether they're advancing!]
6. Do dwell times decrease over time? (population-level learning evidence)
7. What app version is in production?

### What We Explicitly Do NOT Track

- Individual user identity (no PII)
- Correctness / accuracy (not a quiz)
- User "scores" or "performance"

### Trace Structure

- **One trace per session** (3-minute burst = one trace)
- **One child span per card** (60-90 per session)
- Child spans enable `GROUP BY card.combo_name` and `AVG(card.dwell_time_ms)` in Honeycomb

[client: there's an automatic session ID added by Honeycomb Web SDK, which represents one page load. Later feature: local storage to notice page refreshes, which could indicate errors]

### Key Attributes

**Session span**: `app.version`, `session.tier`, `session.card_count`, `session.completed`, `session.duration_ms`

**Card span**: `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`

**Resource**: `service.name` ("sparrow-deck"), `service.version`, `browser.language`, `browser.platform`

### Structural Version Markers

- `APP_VERSION` constant, starting at `0.1.0`, incremented per arc
- Set as resource attribute and session span attribute
- Rendered in UI footer

### Blind Spots

- Session abandonment (mitigated: flush on `visibilitychange`)
- First-visit vs returning (by design — no user tracking)
- Offline usage (deferred)

---

## Testing Strategy

### Unit Tests

- **Data model**: All 20 combinations present, correct colors, correct tiers
- **Deck logic**: Shuffle produces all items, tier filtering works correctly
- **Session state machine**: State transitions (prompt → revealed → next card), timer boundary conditions
- **Timer**: Countdown accuracy, session end trigger

### Integration Tests

- **Card cycle**: Show card → tap → reveal → auto-advance → next card
- **Tier unlock**: Complete a session → next tier becomes available [client: we need to either offer an override, or remember that a user completed the first tier last visit, or both. If nothing else this is essential for testing!]
- **Session end**: Timer expires → session summary shows card count
- **Telemetry wrapper**: Spans created with correct attributes (using test doubles)

### End-to-End Tests

- **Full session**: Start a Guilds session, tap through cards, timer runs out, see summary [client: ah, this brings up -- let's make it a fixed number cards, so that if they tap early, the session is shortened ]
- **Tier progression**: Complete Guilds → unlock Shards & Wedges → complete → unlock All Core [client: wtf is All Core, I think these 20 combos is everything we need]
- **Persistence**: Unlock a tier, refresh the page, tier remains unlocked (localStorage) [client: ah, here it is. There must also be a way to override this. and a way to clear the local storage. This is necessary for testing. It can be a secret URL or something, or a button or a setting]

### Acceptance Testing

Each arc defines specific acceptance criteria. The tester role verifies these before an arc is declared complete. Observability verification (querying Honeycomb for expected spans) is part of acceptance for every arc.

---

## Initial Arc Candidates

These are directional, not final. Sequencing may evolve based on learning.

### Phase 1: Foundation

**Arc 1: Project Scaffolding** (Structural)

- Set up TypeScript + esbuild build pipeline
- Initialize Honeycomb Web SDK with wrapper module
- `APP_VERSION = 0.1.0` in code and UI footer
- Send test `app.startup` span to Honeycomb
- Observable outcome: Version visible in footer, startup span queryable in Honeycomb

[client: YES this is the perfect first arc]

**Arc 2: Card Data & Deck Logic** (Structural)

- Implement the 20 color combination records
- Shuffle and tier filtering logic
- Unit tests for data integrity and deck operations
- Observable outcome: `APP_VERSION = 0.2.0` in traces

[client: let's start with only guilds please]

### Phase 2: Core Experience

**Arc 3: Single-Tier Card Session** (User)

- Show mana pips → tap to reveal name → auto-advance
- Guilds tier only, no timer yet
- Session and card spans sent to Honeycomb with all attributes
- Observable outcome: User can tap through guild cards; traces show card-level dwell times

**Arc 4: Timer & Session Flow** (User)

- 3-minute countdown timer
- Session end screen with card count
- "Go Again" and "Done" actions
- `session.completed` and `session.card_count` attributes
- Observable outcome: Full 3-minute sessions queryable in Honeycomb

**Arc 5: Tier Progression** (User)

- Shards & Wedges tier, All Core (mixed) tier
- Tier unlock after completing one session at prior tier
- localStorage persistence for unlock state
- Tier selection on start screen
- Observable outcome: `session.tier` shows progression across sessions

### Phase 3: Polish

**Arc 6: Start Screen & Onboarding** (User)

- Landing page with app title, tier selection, "How does this work?" explainer
- First-visit onboarding hint for "say it out loud"
- Observable outcome: Clean entry point for new users

**Arc 7: Visual Polish & Accessibility** (User)

- Mana pip styling (standard community symbols)
- Dark card background, WCAG AA contrast
- Alt text, screen reader support, keyboard navigation
- Reduced motion support
- Observable outcome: Accessible, visually appealing card experience

### Future Enhancements (Not in Scope)

- Four-color combinations (DEC-004)
- Reverse direction: Name-to-Colors (DEC-016)
- Sound effects / pronunciation audio (DEC-018)
- Localization (DEC-019)
- Confidence tracking as a progress signal

---

## Rough Sizing

| Arc                              | Type       | Relative Size |
| -------------------------------- | ---------- | ------------- |
| 1. Project Scaffolding           | Structural | Small         |
| 2. Card Data & Deck Logic        | Structural | Small         |
| 3. Single-Tier Card Session      | User       | Medium        |
| 4. Timer & Session Flow          | User       | Medium        |
| 5. Tier Progression              | User       | Medium        |
| 6. Start Screen & Onboarding     | User       | Small         |
| 7. Visual Polish & Accessibility | User       | Medium        |

The first two arcs establish the foundation. Arcs 3-5 deliver the core learning experience. Arcs 6-7 polish the entry point and accessibility. After Arc 4, the app is usable; after Arc 7, it's complete for initial release.

---

## Decision Reference

This proposal is grounded in 20 recorded decisions (DEC-001 through DEC-020). The complete decision log is maintained by the Librarian at `small-arc-studios/roles/librarian/notes/decision-log.md`.

Key decisions shaping this proposal:

| Decision    | Summary                                           |
| ----------- | ------------------------------------------------- |
| DEC-003     | Not a quiz — perceptual learning, not testing     |
| DEC-004     | Skip four-color; focus on 20 core names           |
| DEC-005     | Learning tiers map to progressive difficulty      |
| DEC-006     | Vanilla TypeScript + esbuild, no framework        |
| DEC-007     | GitHub Pages hosting                              |
| DEC-008/020 | Honeycomb Web SDK, wrapped in app module          |
| DEC-010     | No flip animation — name fades over pips          |
| DEC-011     | Auto-advance after 800ms                          |
| DEC-012     | Tap-anywhere reveal                               |
| DEC-013     | No scores, streaks, or leaderboards               |
| DEC-014     | Tier unlock after one session, not accuracy-based |
| DEC-015     | Ambient "say it" prompting, no microphone         |
| DEC-016     | Colors-to-Name direction only                     |

---

## Next Steps

Upon client approval of this Proposal:

1. Small Arc Studio will produce a Statement of Work (SOW) with the arc sequence formalized.
2. The first arc (Project Scaffolding) will be defined at delivery-level detail.
3. Delivery begins.

The first completed arc will be demonstrated to the client before proceeding.
