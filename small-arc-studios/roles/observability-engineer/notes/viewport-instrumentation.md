# Viewport & Screen Size Instrumentation

## Date
2026-03-30

## Context
Client reported layout issues: iPad required scrolling to reach exit button; ultrawide monitor had too-small slide area. Added instrumentation to understand device/layout dimensions.

## What Was Added

### Resource Attributes (`src/telemetry/telemetry.ts`)
Added to `resourceAttrs` in `initTelemetry()` before calling `init()`:
- `screen.width` — `window.screen.width` (physical screen)
- `screen.height` — `window.screen.height` (physical screen)
- `viewport.width` — `window.innerWidth` (actual layout viewport)
- `viewport.height` — `window.innerHeight` (actual layout viewport)

**Note**: `screen.width`, `screen.height`, `browser.width`, `browser.height` were already being captured by the HoneycombWebSDK auto-instrumentation. Our explicit resource attributes ensure they're always present even if the SDK behavior changes.

### Session Span Attributes (`src/slides.ts`, `startSession()`)
Added immediately after `sessionSpan = startSpan('session', sessionAttrs)`:
- `session.page_height` — `document.documentElement.scrollHeight`
- `session.viewport_height` — `window.innerHeight`
- `session.has_scrollbar` — boolean: `scrollHeight > innerHeight`

Added via `requestAnimationFrame` (after layout settles) following `buildSessionUI()` / `showCard()`:
- `session.slide_height_pct` — card container height as % of viewport (rounded integer)

## Honeycomb Board
**"Screen & Viewport Analysis"**
URL: https://ui.honeycomb.io/modernity/environments/sparrow-deck/board/r1frVgioD4x
Board ID: `r1frVgioD4x`
Environment: `sparrow-deck`

### Panels
1. Screen Width Distribution — HEATMAP(screen.width) — **live data now**
2. Viewport Width Distribution — HEATMAP(browser.width) — **live data now** (will update to viewport.width post-deploy)
3. Screen Height Distribution — HEATMAP(screen.height) — **live data now**
4. Sessions by Tier — placeholder for `session.has_scrollbar` scrollbar analysis (update after deploy)
5. Sessions by Familiarity — placeholder for `session.slide_height_pct` and viewport/page height comparison (update after deploy)

### Post-Deploy Updates Needed
Once `session.has_scrollbar`, `session.slide_height_pct`, `session.viewport_height`, `session.page_height` columns appear in sparrow-deck:
- Replace panel 4 with: COUNT where `session.has_scrollbar = true` vs total session COUNT
- Replace panel 5 with: HEATMAP(`session.slide_height_pct`) on session spans
- Add panel: P50/P99 of `session.viewport_height` vs `session.page_height` for direct comparison

## Column Status
- `screen.width` — existed before (auto-SDK), now also explicit resource attr
- `screen.height` — existed before (auto-SDK), now also explicit resource attr
- `browser.width` — exists (auto-SDK viewport width proxy)
- `browser.height` — exists (auto-SDK viewport height proxy)
- `viewport.width` — NEW (our explicit resource attr)
- `viewport.height` — NEW (our explicit resource attr)
- `session.page_height` — NEW (session span)
- `session.viewport_height` — NEW (session span)
- `session.has_scrollbar` — NEW (session span)
- `session.slide_height_pct` — NEW (session span, via requestAnimationFrame)
