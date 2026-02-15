# Observability Plan — Sparrow Deck for MTG Color Combos

> Observability Engineer: Small Arc Studio
> Date: 2026-02-15
> Status: Proposal (Updated — esbuild + Honeycomb Web SDK)

---

## Guiding Principle

This app is a perceptual learning tool. Our observability goal is not to monitor uptime or catch errors — it's to **understand how people use the learning tool** and whether the app is functioning as designed.

We instrument to answer questions, not to collect data.

---

## Questions We Want to Answer in Honeycomb

These are the questions that drive every instrumentation decision:

### About Learning Sessions
1. **Are people completing sessions?** (Do they finish the 3-minute timer, or abandon early?)
2. **How many cards per session?** (Is the pacing right? 60-90 is the target.)
3. **Which tier do people use most?** (Are they progressing through tiers?)
4. **How long do people spend on each card?** (Dwell time on question side → reveal)

### About Specific Color Combos
5. **Which combos have the longest dwell times?** (These are the "hard" ones — where the learner pauses longest before tapping to reveal.)
6. **Do dwell times decrease across sessions?** (Evidence that learning is happening — though we track this at the population level, not per-user.)

### About the App Itself
7. **Is the OTel pipeline working?** (Are we receiving data?)
8. **What app version is in production?** (Structural version marker.)
9. **What browsers/devices are people using?** (Informs design priorities.)

### Anti-questions (things we explicitly do NOT track)
- Individual user identity (no PII, no user IDs, no accounts)
- Correctness / accuracy (this is not a quiz)
- User "scores" or "performance"

---

## Trace Structure

### One Trace Per Session

A single learning session (3-minute burst) maps naturally to one trace. This is the right granularity because:
- A session is the fundamental unit of the learning technique
- It has a clear start and end
- It contains a bounded number of child events (60-90 cards)
- Honeycomb can aggregate across traces to answer population-level questions

### Span Hierarchy

```
session (root span, ~3 minutes)
├── card (child span, ~2-3 seconds each)
├── card
├── card
├── ... (60-90 cards)
```

**Why child spans for cards (not span events)?** Honeycomb queries work best on spans — each span is a row in the dataset. We want to `GROUP BY card.combo_name` and calculate `AVG(card.dwell_time_ms)`, which requires card-level spans. Span events can't be independently queried this way. The cost is manageable: ~75 spans/session at low traffic won't strain any Honeycomb plan.

**Why not deeper nesting?** The card interaction is simple: show → tap → reveal → auto-advance. Adding sub-spans for each phase would add noise without answering any of our questions.

---

## Span Attributes

### Session Span (Root)

| Attribute | Type | Example | Purpose |
|-----------|------|---------|---------|
| `app.version` | string | `"0.1.0"` | Structural version marker |
| `session.tier` | string | `"guild"` | Which tier was selected |
| `session.card_count` | int | `72` | Total cards shown (set at end) |
| `session.completed` | bool | `true` | Did the timer run to zero? (vs. abandoned) |
| `session.duration_ms` | int | `180000` | Actual session length |
| `session.id` | string | `"a1b2c3"` | Random ID for correlating cards to session |

### Card Span (Child)

| Attribute | Type | Example | Purpose |
|-----------|------|---------|---------|
| `card.combo_id` | string | `"azorius"` | Which combo was shown |
| `card.combo_name` | string | `"Azorius"` | Human-readable name |
| `card.colors` | string | `"WU"` | Color letters concatenated |
| `card.tier` | string | `"guild"` | Tier of this combo |
| `card.number` | int | `47` | Position in session (1-based) |
| `card.dwell_time_ms` | int | `1850` | Time from shown to reveal tap |

The card span's `duration` (automatic from OTel) covers the full card lifecycle: shown → revealed → auto-advance → next card appears. The `card.dwell_time_ms` attribute isolates the thinking time specifically.

### Resource Attributes (Set Once at SDK Init)

| Attribute | Type | Example | Purpose |
|-----------|------|---------|---------|
| `service.name` | string | `"sparrow-deck"` | Service identification |
| `service.version` | string | `"0.1.0"` | App version (also on session span) |
| `browser.user_agent` | string | UA string | Browser/device info |
| `browser.language` | string | `"en-US"` | Browser language |
| `browser.platform` | string | `"MacIntel"` | OS info |

---

## Structural Version Markers

Every arc must leave a runtime-visible mark. For this app:

1. **`app.version`** — A semver string set as both a resource attribute and a session span attribute
2. **Defined in code** — A single `APP_VERSION` constant in `src/telemetry/tracing.ts` (or a shared constants file)
3. **Visible in Honeycomb** — Every trace carries the version, so we can filter/compare behavior across versions
4. **Visible to operators** — The version is also rendered in a small footer on the start screen (e.g., "v0.1.0")

### Version Progression Plan
- `0.1.0` — First Structural Arc (scaffolding + OTel + version marker)
- `0.2.0` — First User Arc (single-tier card session)
- Increment minor version for each arc

---

## SDK & Build Configuration

### Build Tool: esbuild

The project uses **esbuild** (not Vite). Key implications for observability:
- esbuild does tree-shaking, so unused OTel auto-instrumentations won't bloat the bundle
- No special esbuild plugins needed — the Honeycomb SDK is standard ESM/CJS
- We should verify final bundle size after build (esbuild's `--analyze` flag) to confirm OTel isn't pulling in unexpected transitive dependencies

### SDK: Honeycomb Web SDK (wrapped)

Per client guidance, we use Honeycomb's own browser distribution (`@honeycombio/opentelemetry-web`) rather than assembling raw OTel packages ourselves. This SDK wraps OTel and adds Honeycomb-specific conveniences.

**Critical design constraint:** The app code must NOT import from Honeycomb or OTel directly. All telemetry goes through our own wrapper module (`src/telemetry/`). This gives us:
- A single place to change if the SDK changes
- App code that reads in domain terms ("start session", "show card") not SDK terms ("startSpan", "setAttribute")
- Testability — we can stub the telemetry module in tests

### Packages Required

```
@honeycombio/opentelemetry-web              # Honeycomb's OTel distribution for browsers
@opentelemetry/api                          # Core API (for creating custom spans in our wrapper)
```

The Honeycomb Web SDK bundles the trace SDK, OTLP exporter, resource detection, and auto-instrumentations internally. We do **not** need to install those separately.

### Auto-Instrumentations: Mostly Disabled

The Honeycomb SDK includes `@opentelemetry/auto-instrumentations-web` which auto-instruments document load, fetch, XHR, and user interactions. For our app:

- **Document load** — Useful for free; keep enabled. Gives us page load timing.
- **Fetch/XHR** — The only network calls are OTel's own exporter calls. Disable to avoid self-referential noise.
- **User interactions** — Tempting but too noisy for rapid-fire tapping (60-90 taps/session). Disable. We instrument card interactions manually with domain-meaningful attributes.

### Bundle Size Estimate

The Honeycomb Web SDK pulls in OTel under the hood. Expected total:

| Component | Gzipped Size (approx) |
|-----------|----------------------|
| `@honeycombio/opentelemetry-web` (with deps) | ~35-45KB |
| Our app code | ~10KB |
| **Total** | **~45-55KB gzipped** |

Slightly larger than raw OTel assembly because the Honeycomb SDK includes auto-instrumentation infrastructure even if we disable most of it. Still acceptable — loads fast on any connection.

**Mitigation:** Measure after first build. If the bundle is unexpectedly large, we can:
1. Check esbuild's bundle analysis for bloat
2. Consider lazy-loading the SDK after first paint (session span doesn't start until "Start" is tapped)

### SDK Initialization (Honeycomb Web SDK)

```typescript
// src/telemetry/init.ts — SDK initialization (internal, not exported to app code)

import { HoneycombWebSDK } from '@honeycombio/opentelemetry-web';

export const APP_VERSION = '0.1.0';

const sdk = new HoneycombWebSDK({
  apiKey: '__HONEYCOMB_API_KEY__',  // Ingest-only key, safe for browser
  serviceName: 'sparrow-deck',
  // Disable noisy auto-instrumentations
  instrumentations: [],  // We handle all instrumentation manually
  resourceAttributes: {
    'service.version': APP_VERSION,
    'browser.language': navigator.language,
    'browser.platform': navigator.platform,
  },
});

sdk.start();
```

### The Wrapper Module (App-Facing API)

```typescript
// src/telemetry/telemetry.ts — The public API for the rest of the app

import { trace, Span, SpanStatusCode } from '@opentelemetry/api';
import { APP_VERSION } from './init';

const tracer = trace.getTracer('sparrow-deck', APP_VERSION);

// Domain-meaningful functions — the app never touches OTel directly

export function startSession(tier: string): Span {
  return tracer.startSpan('session', {
    attributes: {
      'app.version': APP_VERSION,
      'session.tier': tier,
    },
  });
}

export function startCard(sessionSpan: Span, combo: { id: string; name: string; colors: string; tier: string }, cardNumber: number): Span {
  const ctx = trace.setSpan(trace.active(), sessionSpan); // not shown: proper context
  return tracer.startSpan('card', {
    attributes: {
      'card.combo_id': combo.id,
      'card.combo_name': combo.name,
      'card.colors': combo.colors,
      'card.tier': combo.tier,
      'card.number': cardNumber,
    },
  });
}

export function revealCard(cardSpan: Span, dwellTimeMs: number): void {
  cardSpan.setAttribute('card.dwell_time_ms', dwellTimeMs);
}

export function endCard(cardSpan: Span): void {
  cardSpan.end();
}

export function endSession(sessionSpan: Span, cardCount: number, completed: boolean, durationMs: number): void {
  sessionSpan.setAttributes({
    'session.card_count': cardCount,
    'session.completed': completed,
    'session.duration_ms': durationMs,
  });
  sessionSpan.end();
}

export { APP_VERSION };
```

**The app imports from `src/telemetry/telemetry.ts` only.** It never sees OTel or Honeycomb types.

### Honeycomb Configuration

- **Endpoint:** Handled by the Honeycomb SDK (defaults to `https://api.honeycomb.io`)
- **API Key:** Client-provided, ingest-only, environment-scoped (safe for browser)
- **Dataset:** Auto-created from `serviceName` = `sparrow-deck`
- **No sampling:** Traffic will be low; send 100% of traces

### API Key Security Note

The Honeycomb ingest-only API key will be embedded in the JavaScript bundle. This is the accepted pattern for browser telemetry with Honeycomb:
- The key can only write data, not read or delete
- It's scoped to a single environment
- There's no PII in the telemetry data
- Rate limiting on Honeycomb's side prevents abuse

The client has a Honeycomb account and will supply the key.

---

## Honeycomb Queries We'll Build

### Session-Level Queries

1. **Sessions per day** — `COUNT` on session spans, `GROUP BY time`
2. **Session completion rate** — `COUNT` where `session.completed = true` / total `COUNT`
3. **Cards per session distribution** — `HEATMAP(session.card_count)`
4. **Tier popularity** — `COUNT` grouped by `session.tier`

### Card-Level Queries

5. **Hardest combos** — `AVG(card.dwell_time_ms)` grouped by `card.combo_name`, sorted descending
6. **Dwell time by tier** — `AVG(card.dwell_time_ms)` grouped by `card.tier`
7. **Dwell time over card position** — `AVG(card.dwell_time_ms)` grouped by `card.number` (does speed increase within a session?)
8. **Card pacing** — `P50(card.dwell_time_ms)`, `P95(card.dwell_time_ms)` over time

### Operational Queries

9. **Version adoption** — `COUNT` grouped by `app.version`
10. **Browser distribution** — `COUNT` grouped by `browser.user_agent` (parsed)

---

## Arc Observability Requirements

### For the First Structural Arc (Scaffolding)

**Must have:**
- OTel SDK initialized and sending to Honeycomb
- `APP_VERSION` constant set to `0.1.0`
- Version displayed in UI footer
- A test span sent on app load (e.g., `app.startup`) to verify the pipeline works
- Verification: query Honeycomb for `service.name = sparrow-deck` and see the startup span

**Acceptance test:** Open the app in a browser, see version in footer, then query Honeycomb and find the `app.startup` span with `service.version = 0.1.0`.

### For the First User Arc (Card Session)

**Must have:**
- Session root span wrapping the 3-minute session
- Card child spans with all card attributes
- `session.card_count` and `session.completed` set at session end
- Dwell time calculated and set as `card.dwell_time_ms`

**Acceptance test:** Complete a 3-minute Guilds session, then query Honeycomb:
- Find the session span with `session.tier = guild`
- See 60-90 card child spans
- Run `AVG(card.dwell_time_ms) GROUP BY card.combo_name` and see results for all 10 guild names

---

## Blind Spots to Watch

1. **Session abandonment** — If a user closes the tab mid-session, the session span may never complete. The Honeycomb SDK uses a `BatchSpanProcessor` internally that buffers spans. We should flush on `visibilitychange` or `beforeunload`.
2. **Auto-advance timing** — We measure dwell time (question → reveal) but not how long the answer is displayed. If the auto-advance timing is wrong, we won't see it in traces. Consider adding `card.reveal_display_ms` later.
3. **First-visit vs. returning** — We don't track users, so we can't distinguish a first session from a returning learner. This is by design (no PII), but it means we can't answer "do dwell times decrease for the same person." We can only look at population-level trends.
4. **Offline usage** — If someone uses the app offline (it's static, so it could work via cache), spans won't send. We could buffer in localStorage but this adds complexity. Defer unless it becomes a real concern.

### Recommended Mitigation for Session Abandonment

```typescript
// Flush spans when the page is being unloaded
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    provider.forceFlush();
  }
});
```

This is the most important blind spot to address. Without it, we'll systematically under-count abandoned sessions.

---

## What We Explicitly Do NOT Instrument

- **Individual user tracking** — No cookies, no fingerprinting, no user IDs
- **Error tracking / crash reporting** — If needed later, add a lightweight error boundary, but don't add Sentry-scale error tracking for a card flipper
- **Performance metrics (Web Vitals)** — The app is tiny; LCP/FID/CLS won't be interesting. If performance becomes a concern, we can add it.
- **Network performance** — No API calls to measure (static app)
- **A/B testing infrastructure** — Premature for v0.x

---

## Summary

The observability strategy is intentionally focused: **one trace per session, one span per card, meaningful attributes that answer real questions.** We resist the urge to instrument everything and instead instrument for the questions we listed at the top.

**SDK:** Honeycomb Web SDK (`@honeycombio/opentelemetry-web`), wrapped in our own `src/telemetry/` module so the app never touches OTel or Honeycomb types directly.

**Build:** esbuild handles bundling. Tree-shaking should keep the OTel footprint reasonable (~35-45KB gzipped for the SDK). We'll verify with esbuild's bundle analysis after the first build.

**Pipeline:** Browser → Honeycomb Web SDK → OTLP HTTP → Honeycomb. Client provides the API key.

Every arc will include observability acceptance criteria. No arc ships without runtime visibility.
