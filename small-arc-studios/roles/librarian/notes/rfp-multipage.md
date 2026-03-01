# RFP: Multi-Page Decomposition

## Date: 2026-03-01

## Executive Summary

Break the current single-page application into true separate HTML pages: **welcome**, **slides**, **assessment**, and **end**. Each page loads independently, has its own JS bundle, and navigates via standard browser links. Browser back button and refresh work naturally.

## Problem Statement

The app currently constructs all screens via JavaScript DOM manipulation within a single `index.html`. Navigation between welcome, quiz, and end screens is invisible to the browser — no URL changes, no history entries. Refresh always returns to the welcome screen. The back button does nothing useful.

This is architecturally wrong for content that represents genuinely separate concerns. The welcome page is static orientation. The slides page is a timed interactive session. The end page is reflection and navigation. They share almost no runtime state.

## Goals

1. Each screen is a separate `.html` file with its own JS entry point
2. Browser back button works naturally (end → slides → welcome)
3. Refresh stays on the current page (end page doesn't reset to welcome)
4. Minimal data passes between pages (URL params + sessionStorage)
5. Telemetry remains observable per-page with session correlation
6. Progression state (localStorage) continues to work unchanged

## Non-Goals

- Server-side rendering or static site generator
- Client-side routing library (we want real page navigations)
- Shared JS bundles / code splitting (acceptable duplication at this scale)
- Changes to visual design or behavior within any screen

## Constraints & Assumptions

- Build tool stays esbuild (DEC-046)
- No new dependencies required
- Vanilla TypeScript, no framework (DEC-006)
- Hosted on GitHub Pages (DEC-007) — static files, no server
- All commands via scripts/ (DEC-028)

## Architectural Approach

### Pages

| Page | File | Entry Point | Purpose |
|------|------|-------------|---------|
| Welcome | `index.html` | `src/welcome.ts` | Static orientation, "Start" button |
| Slides | `slides.html` | `src/slides.ts` | Card quiz session |
| Assessment | `assessment.html` | `src/assessment.ts` | Post-session self-assessment ("How did that feel?") |
| End | `end.html` | `src/end.ts` | Guild columns, color wheels, navigation to next session |

### Build

```
esbuild src/welcome.ts src/slides.ts src/assessment.ts src/end.ts --bundle --outdir=dist/ --minify --sourcemap --format=esm
```

### Page-to-Page Data

**Welcome → Slides**: `slides.html?subgroup=allied&from=welcome`

**Slides → Assessment**: `assessment.html?subgroup=allied&cards=17&completed=true`

**Assessment → End**: `end.html?subgroup=allied&cards=17&completed=true&assessment=getting_there`

**End → Slides**: `slides.html?subgroup=enemy&from=end_screen`

**End → Welcome**: `index.html`

**Direct access to End**: `end.html` (no params — renders guild columns based on localStorage progression)

**Cross-page session correlation**: `mtg-sparrow.session.id` stored in `sessionStorage`, generated on session start, read by all subsequent pages.

### Telemetry Strategy

Per-page root spans, correlated by `mtg-sparrow.session.id` attribute. No cross-page trace continuity attempted. Each page initializes telemetry independently. Session-level attributes (`session.tier`, `session.subgroup`) carried on every span explicitly.

**What we lose**: Single trace waterfall view of a full session in Honeycomb.
**What we keep**: Every aggregation query we currently use. All card-level and session-level attributes.

### Shared Code (duplicated across bundles)

- `src/telemetry/` — init + wrapper (each page initializes independently)
- `src/data/combos.ts` — guild data (used by slides + end)
- `src/ui/pips.ts` — mana pip rendering (used by slides + end)
- `src/progression.ts` — localStorage progression (used by end, possibly welcome)
- `mana-gas.js` — background animation (included where wanted)

### CSS Split

The current monolithic `style.css` splits into page-specific stylesheets:

| File | Contents | Used by |
|------|----------|---------|
| `style.css` | Variables, reset, fonts, body, `#app`, `#gas`, footer, settings panel, trace links, gas buttons | All pages |
| `welcome.css` | `.welcome`, `.welcome-heading`, `.welcome-instructions`, `.welcome-button` | Welcome only |
| `slides.css` | `.card`, `.card-pips`, `.card-name`, animations, `.done-zone`, `.done-button`, card image grid, full-screen quiz layout | Slides only |
| `assessment.css` | `.self-assessment`, `.self-assessment-prompt`, `.self-assessment-buttons`, `.self-assessment-button` | Assessment only |
| `end.css` | `.session-end`, `.combo-summary`, `.guild-columns`, `.guild-column`, color wheel styles, highlight/dim, crest images | End only |

Each HTML page links `style.css` plus its own page CSS. Dead CSS (styles for components that no longer exist) is identified and removed during the split.

**Benefit**: Beyond organization, this gives us confidence about scope when changing styles — modifying `end.css` cannot break the slides page.

### Settings Panel

Duplicated as static HTML in each page that needs it. Small maintenance cost, consistent with DEC-049 (static HTML for static content).

## Risks

| Risk | Mitigation |
|------|-----------|
| Settings panel HTML duplication | Accept for now; extract to build-time partial if it becomes a burden |
| Telemetry flush before navigation | Explicit `flushSpans()` call before `window.location.assign()` on slides page |
| main.ts is 950+ lines | This refactor naturally decomposes it — that's a benefit, not a risk |
| mana-gas.js assumptions about DOM | Already defensive (`if (!canvas) return`); low risk |

## Testing Strategy

- Each page loads independently and renders correctly
- Navigation between pages passes correct parameters
- Back button behavior is natural
- Refresh on each page preserves correct state
- Telemetry spans fire with `mtg-sparrow.session.id` on each page
- Progression (localStorage) works across page loads
- Settings panel works on each page that has it

## Observability Plan

- Each page emits a startup span with `app.version` and `app.page`
- `mtg-sparrow.session.id` on all session-related spans across all pages
- `session.started_from` continues to indicate origin (welcome vs end screen)
- Structural version marker: `app.navigation = 'multi_page'` on all spans

## Initial Arc Candidates

1. **Split CSS into per-page stylesheets** (Structural) — decompose style.css into shared + welcome + slides + end; audit for dead CSS and remove it
2. **Extract shared modules from main.ts** (Structural) — pull guild columns, color wheels, session-end rendering out of main.ts into proper modules before splitting pages
3. **Create slides.html + src/slides.ts** (Structural) — the most complex page, with card timers, session state, and telemetry
4. **Create end.html + src/end.ts** (Structural) — guild columns, self-assessment, navigation buttons
5. **Slim down index.html + create src/welcome.ts** (Structural) — welcome page becomes the simplest page
6. **Cross-page telemetry with mtg-sparrow.session.id** (Operator) — session correlation across pages
7. **Update build scripts** (Structural) — esbuild multi-entry, dev workflow

These can likely be combined or resequenced. The SOW will define the actual arc plan.
