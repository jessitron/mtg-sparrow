# Architecture Options — Sparrow Deck for MTG Color Combos

> Architect: Small Arc Studio
> Date: 2026-02-15
> Status: Proposal (updated per client preference: esbuild over Vite)

---

## Problem Summary

A static web app that drills ~20-26 MTG color combination names using the Sparrow Deck rapid-fire technique. Key constraints:

- **No backend** — static hosting, all logic in the browser
- **Small data set** — 20-26 color combinations, hardcoded
- **Simple interaction** — show card, user guesses, reveal answer, next card
- **3-minute timed sessions** — 50-100 cards per burst
- **Progressive tiers** — Guilds → Shards+Wedges → Four-color → Mixed
- **Observability** — Honeycomb traces from the browser via OpenTelemetry
- **"Say it out loud"** — UX prompt, no speech recognition needed

---

## Data Model (shared across all options)

The card data is static and tiny. A single JSON/JS module:

```typescript
type ColorCombo = {
  id: string;              // e.g. "azorius"
  name: string;            // "Azorius"
  colors: string[];        // ["W", "U"]
  tier: "guild" | "shard" | "wedge" | "four-color" | "wubrg";
  flavorText?: string;     // e.g. "Senate — law & order"
  altNames?: string[];     // e.g. ["BUG"] for Sultai
};
```

Session state:

```typescript
type Session = {
  tier: Tier;
  cards: ColorCombo[];     // shuffled deck for this session
  currentIndex: number;
  phase: "prompt" | "revealed";
  startTime: number;
  durationMs: number;      // 180_000 (3 min)
};
```

This is ~2KB of data. No fetching, no API. Import it as a module.

---

## Option A: Vanilla HTML + TypeScript (esbuild) ✅ SELECTED

### Stack
- **Framework:** None — vanilla DOM manipulation
- **Language:** TypeScript (for type safety on the data model)
- **Build:** esbuild (extremely fast TS bundler, minimal config)
- **Hosting:** GitHub Pages (via `gh-pages` branch or `/docs` folder)
- **Observability:** `@opentelemetry/sdk-trace-web` + `@opentelemetry/exporter-trace-otlp-http` sending to Honeycomb

### Structure
```
src/
  data/
    combos.ts          # All color combination data
  core/
    session.ts         # Session state machine
    deck.ts            # Shuffle, tier filtering
    timer.ts           # 3-minute countdown
  ui/
    render.ts          # DOM rendering functions
    app.ts             # Event handlers, lifecycle
  telemetry/
    tracing.ts         # OTel setup, span helpers
index.html
style.css
```

### Pros
- **Minimal complexity** — no framework to learn or maintain
- **Tiny bundle** — just the app code + OTel SDK (~30KB gzipped for OTel)
- **Fast** — no virtual DOM, no reconciliation overhead
- **No framework churn** — vanilla JS/TS doesn't go out of date
- **Easy to understand** — any developer can read it
- **esbuild is blazing fast** — sub-millisecond builds, near-zero config

### Cons
- Manual DOM updates (but the UI is simple — one card at a time)
- No component model (but we have maybe 3-4 "views")
- State management is DIY (but the state is small and linear)
- esbuild doesn't have a built-in dev server with HMR (but a simple `--watch` + live-server or `esbuild --serve` covers it)

### Verdict
The app is fundamentally: show a card, flip it, show the next one, with a timer. This is well within what vanilla DOM manipulation handles elegantly. The complexity of React/Svelte is not justified. esbuild keeps the build tooling minimal and fast — no config files, just a build script.

---

## Option B: Preact + HTM (No Build Step Option)

### Stack
- **Framework:** Preact (3KB) with HTM (tagged template alternative to JSX)
- **Language:** JavaScript (could use TypeScript with Vite)
- **Build:** Optional — can run from CDN with no build step at all, or use Vite
- **Hosting:** GitHub Pages
- **Observability:** Same OTel setup

### Pros
- Component model if UI grows more complex than expected
- Can start with zero build tooling (CDN imports)
- React-compatible API if we ever need React ecosystem libraries

### Cons
- Additional dependency (small, but still a dependency)
- Preact's value shows in larger apps with many components
- The "no build step" option limits TypeScript usage

### Verdict
Preact is a reasonable choice if we expect the UI to become component-heavy, but for a card-flipping app with a timer, it's adding abstraction without clear benefit.

---

## Option C: Svelte (SvelteKit in SPA mode)

### Stack
- **Framework:** SvelteKit with `adapter-static`
- **Language:** Svelte + TypeScript
- **Build:** Vite (built into SvelteKit)
- **Hosting:** GitHub Pages / Netlify / Vercel
- **Observability:** Same OTel setup

### Pros
- Excellent reactivity model for UI state (timer, card transitions)
- Compiles away — small runtime
- Nice DX with single-file components

### Cons
- **Heaviest tooling** for the simplest problem — SvelteKit brings routing, SSR config, adapter config
- More files and conventions to understand
- Svelte 5 runes are relatively new; ecosystem is still adjusting
- Overkill for an app with essentially one screen and one interaction

### Verdict
SvelteKit is a great framework, but this app has one route and one interaction loop. The framework scaffolding would outweigh the app code.

---

## Recommendation: Option A — Vanilla TypeScript + esbuild

**Rationale:**

1. **Complexity proportional to the problem.** The app is a card flipper with a timer. The entire interaction is: show stimulus → wait for tap → reveal answer → next card → repeat for 3 minutes. A framework adds overhead without solving a real problem.

2. **Observability is the real technical challenge.** OpenTelemetry in the browser requires careful setup regardless of framework. Keeping the rest simple means we can focus engineering attention on getting traces right.

3. **esbuild is the leanest build tool available.** Sub-millisecond builds, native TypeScript support, tree-shaking, and near-zero configuration. No config files needed — a single build command or a short build script handles everything. Client preference confirmed.

4. **GitHub Pages hosting is free and simple.** The client's repo is already on GitHub. An `esbuild` output deployed to GitHub Pages keeps the operational model dead simple.

5. **Small bundle = fast load.** For a learning tool that should feel snappy, a ~50KB total bundle (app + OTel) loads fast on any connection.

---

## Observability Approach (preliminary)

This will be detailed in Task #5, but the architecture must support it:

- **OpenTelemetry Web SDK** initialized at app startup
- **OTLP/HTTP exporter** sending to Honeycomb's OTLP endpoint
- **Key spans:**
  - `session` — wraps an entire 3-minute session (tier, card count)
  - `card-interaction` — each card cycle (combo shown, time-to-reveal, tier)
- **Honeycomb API key** — needs to be a browser-safe, ingest-only key (this is a static app, the key will be in the JS bundle — Honeycomb supports this with restricted dataset-scoped keys)
- **No PII** — we're only tracing interaction patterns, not user identity

### Client Question: Honeycomb Team/Dataset
We need to know: does the client have a Honeycomb account, or should we set one up? Honeycomb has a free tier that would work for this.

---

## Hosting Approach

**Recommended: GitHub Pages**

- Repo is already on GitHub
- `esbuild` → output to `dist/`
- Deploy via GitHub Actions or `gh-pages` branch
- Custom domain optional
- Free, zero ops

**Alternative: Netlify/Vercel** — only needed if we want preview deploys for PRs, which is nice but not essential.

### Client Question: Hosting Preference
Does the client have a preference for hosting? Any existing infrastructure we should use?

---

## Build & Dev Workflow

```
npm init -y
npm install --save-dev esbuild typescript
npm install @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-http

# Dev (watch mode + serve)
npx esbuild src/app.ts --bundle --outfile=dist/app.js --watch --sourcemap
# (serve dist/ with any static server, e.g. npx serve dist)

# Production build
npx esbuild src/app.ts --bundle --outfile=dist/app.js --minify --sourcemap
```

That's it. No config files. The build command is the config.

---

## Structural Risks

1. **OTel bundle size** — The OpenTelemetry web SDK can be large if not tree-shaken carefully. We should import only what we need and measure the bundle.
2. **Honeycomb API key exposure** — Ingest-only keys in static apps are an accepted pattern, but we should confirm with the client that this is acceptable.
3. **Mobile touch handling** — The rapid-fire interaction needs to feel good on mobile. Touch event handling in vanilla JS is straightforward but needs testing.
4. **Timer accuracy** — `setInterval` can drift. For a 3-minute timer, `requestAnimationFrame` with elapsed time calculation is more reliable.

---

## Decision for the Team

If this recommendation is approved:
- First Structural Arc: project scaffolding with esbuild + TypeScript + OTel initialization + version marker
- First User Arc: single-tier card session (guilds only, no timer yet)
- The observability strategy (Task #5) should detail the span design and Honeycomb setup
