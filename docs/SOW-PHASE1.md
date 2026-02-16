# Statement of Work: Phase 1 — Foundation

> Prepared by: Small Arc Studio
> Date: 2026-02-15
> Status: Draft — Awaiting Client Approval
> Reference: [Proposal](./PROPOSAL.md) | [Decision Log](../small-arc-studios/roles/librarian/notes/decision-log.md)

---

## Engagement Scope

**Phase 1: Foundation** establishes the project scaffolding, proves the card rendering pipeline, and delivers the first working card cycling session — all with observability from the start.

This SOW covers three arcs:

| Arc | Name | Type | Version |
|-----|------|------|---------|
| 1 | Project Scaffolding | Structural | 0.1.0 |
| 2a | Render a Single Card | User | 0.2.0 |
| 2b | Cycle Through a Deck | User | 0.3.0 |

Phase 1 delivers a working fixed-count card session for the 10 guild combinations with auto-reveal, early-tap acceleration, progress tracking, and full Honeycomb observability. It does not yet include tier selection, self-assessment, or onboarding.

Later phases will be re-planned after Phase 1 based on what we learn.

---

## Objectives

1. **Establish the build and telemetry pipeline** — TypeScript + esbuild + Honeycomb Web SDK, verified end-to-end.
2. **Prove mana pip rendering** — resolve the biggest visual risk by rendering a card with standard community symbols.
3. **Deliver the core interaction loop** — auto-reveal card cycling with early-tap acceleration, producing card-level spans in Honeycomb.
4. **Establish the observability baseline** — version markers, session spans, card spans, dwell time measurement.

---

## Success Criteria

Phase 1 is complete when:

1. The app builds with esbuild and serves a static page.
2. A single guild card renders with correct mana pip symbols and combination name.
3. A fixed-count session (~50 cards) cycles automatically through a shuffled deck of 10 guilds with auto-reveal (~2.5s) and auto-advance. Deck reshuffles to fill the count.
4. A progress counter shows current position (e.g., "Card 12 / 50").
5. Tap/click/spacebar skips ahead early (optional accelerator).
6. Session ends when all cards are shown, displaying total card count.
7. Every card cycle produces a child span in Honeycomb with `card.combo_name`, `card.colors`, and `card.dwell_time_ms`.
8. Early taps are distinguishable in traces (`card.advanced_early`).
9. `APP_VERSION` is visible in the UI footer and on every span.
10. All acceptance criteria for all three arcs are satisfied.
11. The Librarian has recorded all decisions and outcomes.

---

## Assumptions and Exclusions

### Assumptions

- Client provides a Honeycomb ingest-only API key before Arc 1 ships.
- Standard community mana symbols (Scryfall/Gatherer style) are available as SVG or image assets.
- The GitHub repository will be created before deployment is needed.
- All timing parameters (reveal delay, advance delay) are configurable constants, not hard-coded.

### Exclusions (deferred to later phases)

- Tier selection UI and tier unlock logic
- Session end screen with self-assessment (DEC-024) — Phase 1 shows card count only; self-assessment deferred
- "Say it out loud" prompting (DEC-015)
- Start screen and onboarding
- Shards & Wedges data (DEC-026)
- Guild subgroup filtering (DEC-022)
- Settings page with localStorage reset (DEC-025)
- Visual polish, accessibility, dark theme
- All future enhancements (real card images, adaptive pacing, etc.)

---

## Roles and Responsibilities

Per Small Arc Studio's role structure (see `small-arc-studios/ROLES.md`):

| Role | Responsibility in Phase 1 |
|------|--------------------------|
| **Project Lead** | Coordinates arcs, ensures client alignment, manages scope |
| **Architect** | Build pipeline, project structure, telemetry module design |
| **Designer** | Card layout, pip rendering, interaction timing |
| **Domain Expert** | Guild data accuracy, color/name correctness |
| **Observability Engineer** | Honeycomb SDK setup, span design, verification queries |
| **Tester** | Acceptance criteria verification, Honeycomb query verification |
| **Librarian** | Decision recording, arc outcomes, continuity |

---

## Communication Cadence

- **Arc 1 completion**: Demonstrated to client. Client approval required before proceeding.
- **After Arc 1 approval**: Continuous delivery through Arcs 2a and 2b. Client notified at each arc completion.
- **Phase 1 completion**: Full review with client. Phase 2 arcs planned based on learning.

---

## Change Management

- Tasks tracked via the team task system.
- Decisions recorded in the Librarian's decision log (DEC-NNN format).
- Arc definitions may be refined during delivery, but scope changes require client acknowledgment.
- Direction changes are explicit and documented.

---

## Deliverables: Planned Arcs

---

### Arc 1: Project Scaffolding

**Type:** Structural

**Intention:** Establish the build pipeline, telemetry foundation, and version marking system. Prove that spans flow from the browser to Honeycomb.

**Observable Outcome:** The app loads in a browser, displays `v0.1.0` in the footer, and sends an `app.startup` span to Honeycomb.

**Acceptance Criteria:**

- [ ] TypeScript + esbuild build pipeline produces a working static page
- [ ] `index.html` loads and renders a minimal page with version in footer
- [ ] Honeycomb Web SDK initialized via wrapper module (`src/telemetry/`)
- [ ] App code does not import from `@honeycombio/opentelemetry-web` or `@opentelemetry/api` directly (only via wrapper)
- [ ] `app.startup` span sent to Honeycomb on page load
- [ ] `APP_VERSION = "0.1.0"` appears as `service.version` resource attribute and in the startup span
- [ ] Version `v0.1.0` visible in UI footer
- [ ] Query Honeycomb: `service.name = "sparrow-deck"` returns the startup span with correct version

**Tests Included:**

- Unit: Telemetry wrapper module exports expected functions
- Integration: Build produces valid output; page loads without errors
- E2E: Open page in browser → version in footer → span appears in Honeycomb

**Observability Plan:**

- Span added: `app.startup` (root span, fires on page load)
- Attributes: `app.version`, resource attributes (`service.name`, `service.version`, `browser.language`, `browser.platform`)
- Question answered: "Is the telemetry pipeline working?"
- Verification: Query Honeycomb for `name = app.startup` where `service.name = sparrow-deck`

**Risks Reduced:**

- Build pipeline risk eliminated
- Honeycomb connectivity verified
- Telemetry wrapper pattern proven

**Expected Learning:**

- Actual bundle size of Honeycomb Web SDK with esbuild
- Whether auto-instrumentations need explicit disabling or are off by default
- Dev workflow ergonomics with esbuild (watch mode, refresh cycle)

---

### Arc 2a: Render a Single Card

**Type:** User

**Intention:** Prove the data-to-DOM rendering pipeline by displaying a single guild card with correct mana pip symbols and combination name. Resolve the biggest visual risk.

**Observable Outcome:** A page displays a single guild card showing mana pip symbols (e.g., White and Blue pips for Azorius) with the combination name visible. The card looks like a card.

**Acceptance Criteria:**

- [ ] Guild data model implemented: all 10 two-color guild records with `id`, `name`, `colors`, `tier`
- [ ] Data model type supports future tiers (`"guild" | "shard" | "wedge"`) but only guild records present
- [ ] Mana pip symbols render correctly for all 5 colors (W, U, B, R, G) using standard community symbols
- [ ] A single card displays: mana pips (large, centered) with combination name
- [ ] Card has a visible container (rounded rectangle, dark background, contrast for all pip colors)
- [ ] Pips displayed in WUBRG order for each combination
- [ ] `APP_VERSION = "0.2.0"` in footer and spans
- [ ] All 10 guild cards render correctly (verified by cycling through them manually or via test)

**Tests Included:**

- Unit: All 10 guild records present with correct colors and names; data model validates (no missing fields, no duplicate IDs)
- Unit: Pip rendering function produces correct output for each color
- Integration: Card component renders correct pips for a given `ColorCombo` record
- E2E: Page displays a guild card with visible pips and name

**Observability Plan:**

- Span changes: version marker updated to `0.2.0`. No new span types.
- Question answered: "What version is deployed?" (confirms Arc 2a shipped)
- Verification: Query Honeycomb for `service.version = 0.2.0`

**Risks Reduced:**

- Mana pip rendering risk eliminated (visual unknowns resolved)
- Data model proven
- Card layout validated across pip counts (2 pips for all guilds; layout ready for 3 pips in future)

**Expected Learning:**

- Best asset format for mana symbols (inline SVG vs image files)
- Card layout behavior on different screen sizes
- Whether the name-over-pips fade treatment works visually

---

### Arc 2b: Cycle Through a Deck

**Type:** User

**Intention:** Deliver the core Sparrow Deck interaction loop: cards auto-reveal in sequence with optional early-tap acceleration. Produce card-level telemetry in Honeycomb.

**Observable Outcome:** A fixed-count session (~50 cards) cycles automatically through a shuffled deck of 10 guilds, reshuffling to fill the count. Mana pips appear, the name auto-reveals after ~2.5s, then the next card appears. Tapping skips ahead early. A progress counter shows "Card 12 / 50". When all cards are shown, the session ends and displays the total card count. Each card produces a span in Honeycomb with dwell time and combo identification.

**Acceptance Criteria:**

- [ ] Session uses a fixed card count (~50, configurable constant) per DEC-021
- [ ] Deck shuffles all 10 guild cards; reshuffles as needed to fill the card count
- [ ] Cards auto-reveal: pips display for ~2.5s (tunable), then name fades in
- [ ] After name display (~1s, tunable), next card appears automatically
- [ ] Tap/click/spacebar skips ahead to next card early
- [ ] Reveal delay and advance delay are configurable constants (easy to tune)
- [ ] Progress counter visible during session (e.g., "Card 12 / 50")
- [ ] Session wraps in a root span; each card is a child span
- [ ] Card spans include: `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`, `card.advanced_early`
- [ ] `card.dwell_time_ms` measures time from card shown to reveal (whether auto or early tap)
- [ ] `card.advanced_early` boolean distinguishes auto-reveal from early tap
- [ ] Session span includes `session.tier` (hardcoded to `"guild"` for now)
- [ ] Session ends when all cards have been shown; displays total card count
- [ ] Session span includes `session.card_count` and `session.completed` (true when all cards shown)
- [ ] `APP_VERSION = "0.3.0"` in footer and spans
- [ ] Flush spans on `visibilitychange` to capture abandoned sessions

**Tests Included:**

- Unit: Shuffle produces all items, no duplicates, no omissions
- Unit: Deck reshuffles to fill fixed card count when count exceeds unique cards
- Unit: Auto-reveal timer fires after configured delay
- Unit: Early tap cancels auto-reveal timer and advances
- Unit: Session ends after fixed card count reached
- Integration: Full card cycle: show → auto-reveal → advance → next card
- Integration: Progress counter increments correctly
- Integration: Session end triggers after final card
- Integration: Telemetry wrapper produces correct span attributes for a card cycle
- E2E: Open page → cards cycle automatically → tap to skip → session ends at card count → verify spans in Honeycomb

**Observability Plan:**

- Spans added: `session` (root), `card` (child, repeated ~50x)
- Attributes added: `session.tier`, `session.card_count`, `session.completed`, `session.duration_ms`, `card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`, `card.advanced_early`
- Questions answered:
  - "Which combos have the longest dwell times?" → `AVG(card.dwell_time_ms) GROUP BY card.combo_name`
  - "Which combos do people tap early on?" → `COUNT WHERE card.advanced_early = true GROUP BY card.combo_name`
  - "What's the average pacing?" → `P50(card.dwell_time_ms)` over time
  - "How long do sessions take?" → `HEATMAP(session.duration_ms)` (varies based on early tapping)
  - "Are people completing sessions?" → `COUNT WHERE session.completed = true`
- Verification: Complete a full 50-card session, then query Honeycomb:
  - Find session span with `session.tier = guild` and `session.completed = true`
  - See ~50 card child spans with all attributes populated
  - Run `AVG(card.dwell_time_ms) GROUP BY card.combo_name` and see results for all 10 guilds

**Risks Reduced:**

- Interaction loop risk eliminated (auto-reveal timing validated)
- Fixed card count session model proven
- Card-level observability proven
- Early-tap behavior confirmed
- Session abandonment data captured (flush on `visibilitychange`)

**Expected Learning:**

- Whether ~2.5s reveal delay feels right (tuning data from real usage)
- Whether early-tap is intuitive without instruction
- How long a 50-card session takes with and without early tapping
- Which guild names have the longest dwell times (first real learning data)
- Whether 50 cards is the right session length (observability data on completion and duration)

---

## What Comes After Phase 1

Phase 2 arcs will be planned after Phase 1 delivery, informed by what we learn. Candidates from the Proposal include:

- Session end screen with self-assessment (DEC-024)
- Guild subgroup tier (DEC-022) and tier selection UI
- Shards & Wedges data
- "Say it out loud" prompting
- Start screen and onboarding
- Settings page with localStorage reset (DEC-025)
- Visual polish and accessibility

Arc sequencing will be determined based on Phase 1 learning and client priorities.

---

## Approval

This SOW covers Phase 1 only. Client approval authorizes delivery of Arcs 1, 2a, and 2b.

Arc 1 will be demonstrated to the client upon completion. Subsequent arcs proceed continuously with notification at each completion.

Phase 2 planning begins after Phase 1 delivery.
