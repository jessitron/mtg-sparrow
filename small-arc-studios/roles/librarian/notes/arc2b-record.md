# Arc 2b: Cycle Through a Deck

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 2b |
| **Name** | Cycle Through a Deck |
| **Type** | User |
| **Target Version** | 0.3.0 |
| **Start Date** | 2026-02-16 |
| **Completion Date** | 2026-02-16 |
| **Status** | COMPLETE |

## Intention

Deliver the core Sparrow Deck interaction loop: cards auto-reveal in sequence with optional early-tap acceleration. Produce card-level telemetry in Honeycomb.

## Observable Outcome

A fixed-count session (50 cards) cycles automatically through a shuffled deck of 10 guilds. Mana pips appear, the name auto-reveals after ~2.5s, then the next card appears after ~1s. Tapping/spacebar skips ahead early. A progress counter shows position. Session ends with card count display. Each card produces a span in Honeycomb.

## Acceptance Criteria

- [x] Session uses a fixed card count (~50, configurable constant) per DEC-021 -- **PASS** (`SESSION_CARD_COUNT = 50` in session.ts)
- [x] Deck shuffles all 10 guild cards; reshuffles as needed to fill the card count -- **PASS** (Fisher-Yates shuffle with batch repeat)
- [x] Cards auto-reveal: pips display for ~2.5s (tunable), then name fades in -- **PASS** (`REVEAL_DELAY_MS = 2500`, CSS opacity transition)
- [x] After name display (~1s, tunable), next card appears automatically -- **PASS** (`ADVANCE_DELAY_MS = 1000`)
- [x] Tap/click/spacebar skips ahead to next card early -- **PASS** (click on app, Space keydown)
- [x] Reveal delay and advance delay are configurable constants (easy to tune) -- **PASS** (exported constants in session.ts)
- [x] Progress counter visible during session (e.g., "Card 12 / 50") -- **PASS** (`.progress-counter` element)
- [x] Session wraps in a root span; each card is a child span -- **PASS** (Honeycomb confirms parent-child relationship)
- [x] Card spans include all required attributes -- **PASS** (`card.combo_id`, `card.combo_name`, `card.colors`, `card.tier`, `card.number`, `card.dwell_time_ms`, `card.advanced_early`)
- [x] `card.dwell_time_ms` measures time from card shown to reveal -- **PASS** (auto: ~3503ms, early: ~72-110ms)
- [x] `card.advanced_early` boolean distinguishes auto-reveal from early tap -- **PASS** (both true and false values confirmed)
- [x] Session span includes `session.tier` (hardcoded to `"guild"` for now) -- **PASS**
- [x] Session ends when all cards shown; displays total card count -- **PASS** ("50 cards" / "Session complete")
- [x] Session span includes `session.card_count` and `session.completed` -- **PASS** (50, true)
- [x] `APP_VERSION = "0.3.0"` in footer and spans -- **PASS** (UI and Honeycomb confirmed)
- [x] Flush spans on `visibilitychange` to capture abandoned sessions -- **PASS** (`session.completed = false` on abandon, `flushSpans()` called)

## Risks Reduced

- Interaction loop risk -- eliminated (auto-reveal timing validated)
- Fixed card count session model -- proven
- Card-level observability -- proven (all attributes flowing)
- Early-tap behavior -- confirmed (click and spacebar)
- Session abandonment data capture -- working via `visibilitychange`

## Key Files

- `src/session.ts` -- Session state, deck building (Fisher-Yates shuffle), timing constants
- `src/main.ts` -- Session lifecycle, card display loop, span management, event handlers, `visibilitychange` flush
- `src/ui/render.ts` -- Updated: `card-name-hidden` class for reveal animation, `revealName()` export
- `src/telemetry/telemetry.ts` -- Updated: `startChildSpan()`, `flushSpans()` added

## Implementation Notes

- **Session architecture**: `SessionState` holds deck, index, completion flag, and start time. `createSession()` builds a shuffled 50-card deck. `advanceCard()` increments and signals completion.
- **Timing flow**: `showCard()` -> `revealTimer` (2.5s) -> `revealName()` -> `advanceTimer` (1s) -> `goToNextCard(false)`. Early tap calls `goToNextCard(true)` which clears both timers.
- **Span hierarchy**: `session` root span created at session start. Each `card` span is a child via `startChildSpan()`. Card span ends when advancing (early or auto). Session span ends at session completion or abandonment.
- **Dwell time**: Measured as `Date.now() - cardShowTime`. For auto-reveal cards this is ~3.5s (reveal + advance delays). For early taps it reflects user reaction time.
- **Session end is terminal**: No restart without page reload. Correct for current scope.

## Known Issues (non-blocking)

- **Direct OTel type import**: `src/main.ts` line 11 imports `Span` type from `@opentelemetry/api` directly. This is type-only (tree-shaken, no runtime impact) but breaks the telemetry wrapper encapsulation from Arc 1 (DEC-020). The wrapper could re-export the `Span` type. Minor -- flagged for cleanup.
- **Auto-instrumentations**: Honeycomb Web SDK still produces TTFB, FCP, and LCP spans despite `instrumentations: []`. Consistent with Arc 2a observation. Not harmful.

## Key Decisions Made During Arc 2b

No new decisions. Implementation followed the plan from DEC-021 (fixed card count), DEC-011/DEC-012 (auto-reveal and early tap), and DEC-020 (telemetry wrapper).

## Verification

- **Code/behavior verification by**: Tester (2026-02-16)
- **Honeycomb verification by**: Tester (2026-02-16)
- **Result**: All 16 acceptance criteria PASS.
- **Full report**: `small-arc-studios/roles/tester/notes/arc2b-verification.md`
- **Test script**: `scripts/test-arc2b.mjs` (Playwright, exercises full session flow)

## Honeycomb Data Observed

- **Session spans**: `session.tier=guild`, `session.card_count=50`, `session.completed=true`, `session.duration_ms` (~8-10s in test runs with early tapping)
- **Card spans**: All 10 guild IDs present, `card.number` range 1-50, `card.dwell_time_ms` distinguishes auto (~3503ms) from early (~72-110ms), `card.advanced_early` boolean works
- **All spans**: `service.version=0.3.0`

## Learning Captured

- **Dwell time distribution**: Auto-revealed cards show ~3503ms dwell (2500ms reveal + 1000ms advance). Early-advanced cards show ~72-110ms (click latency). This confirms the timing model works and the observability data will be meaningful for real usage.
- **Session duration varies**: Two test sessions measured 8374ms and 10295ms for 50 cards. With heavy early tapping, sessions can be much shorter than the ~3min auto-advance estimate.
- **visibilitychange is reliable**: The abandon handler correctly captures in-flight card and session spans with appropriate flags.
- **Span flush in headless browsers**: 12s wait before browser close is reliable for SDK flush. Consistent with Arc 2a learning.
- **Telemetry wrapper gap**: The `Span` type should be re-exported from the wrapper module to maintain encapsulation.

## Outcome

Arc 2b delivered successfully. All 16 acceptance criteria satisfied.

**What was established:**
- Complete Sparrow Deck interaction loop: auto-reveal with early-tap acceleration
- Fisher-Yates shuffle with reshuffle to fill fixed card count
- Session and card span hierarchy in Honeycomb with full attribute set
- Progress counter and session end screen
- Abandoned session capture via `visibilitychange`
- Configurable timing constants for future tuning

**Risks reduced:**
- Interaction loop -- eliminated
- Session model -- proven
- Card-level observability -- proven
- Session abandonment -- captured

**This completes Phase 1.** All three arcs (1, 2a, 2b) are verified and recorded.

**Next phase**: Phase 2 planning begins after client review. Candidates include session end self-assessment, tier selection, shards & wedges data, and visual polish.

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
