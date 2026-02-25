# Arc 8 Post-Enhancements: Color Wheel Integration

## Overview

| Field | Value |
|-------|-------|
| **Classification** | Post-Arc-8 Enhancement (no version bump) |
| **Name** | Color Wheel Integration |
| **Type** | User Arc |
| **Base Version** | 0.8.0 |
| **Date** | 2026-02-25 |
| **Status** | COMPLETE |

## Intention

Extend the Arc 8 session end screen with an SVG pentagon that teaches the color wheel spatial relationship underlying the allied/enemy distinction. Add bidirectional hover interaction between the wheel and the guild list. Improve visual clarity of the locked enemy column. Introduce "Learn" vs "Practice" button text based on whether the user has previously completed a session of each subgroup type.

## What Was Built

### 1. SVG Color Wheel (`color-wheel-test.html` + `src/main.ts`)

A standalone test page (`color-wheel-test.html`) was built first for iteration. It shows a pentagon of the 5 MTG mana colors (W, U, B, R, G) arranged clockwise from White at top. Allied lines (pentagon edges) are rendered in gold; enemy lines (star diagonals) in dashed blue-purple. Mana symbol SVGs are loaded via `<image href="images/X.svg">` tags, reusing existing assets.

The pentagon (allied lines only, no enemy star) was then integrated into the session end screen's Allied Guilds column, placed between the explanation text and the guild list. The wheel is built programmatically in TypeScript using `document.createElementNS`.

Animation-readiness was built in: all lines carry `stroke-dasharray`/`stroke-dashoffset` attributes, and all elements have semantic IDs and classes for future animation targeting.

### 2. Bidirectional Hover Highlighting

Hovering a line in the wheel highlights:
- The hovered line (brightened, thickened)
- Both endpoint mana symbols on the wheel
- The matching guild entry in the list below

Hovering a guild name in the list highlights:
- The guild row
- The corresponding line in the wheel
- Both endpoint mana symbols

Non-highlighted elements dim via a `.dim` CSS class. This required JavaScript event listeners bridging the SVG DOM and the HTML guild list — CSS alone cannot cross this boundary.

Wide transparent hit areas (24px-wide invisible `<line>` overlays) make lines easy to hover without precision clicking.

### 3. UI Refinements

- Allied lines thickened to 8px for visual weight
- Column headers centered
- Locked enemy column simplified: removed teaser text, now shows only a vertically centered button

### 4. "Learn" vs "Practice" Button Text

Buttons read "Learn allied guilds" / "Learn enemy guilds" until the user has completed at least one session of that subgroup type, then switch to "Practice allied guilds" / "Practice enemy guilds". Tracking extends `ProgressionState` in `src/progression.ts` with a `completedSubgroups` array. The switch happens at the session end screen, so even the first session's end screen shows "Practice" for the type just completed — by the time the user sees the button, they have in fact practiced.

## Key Decisions Made

See DEC-039, DEC-040, DEC-041, DEC-042 in decision-log.md.

## Files Involved

- `color-wheel-test.html` — standalone test page for iteration (kept, not served)
- `src/main.ts` — color wheel builder, hover event wiring, button text logic
- `src/progression.ts` — extended with `completedSubgroups: string[]`, `hasCompletedSubgroup(type)`, `markSubgroupCompleted(type)`
- `style.css` — color wheel sizing, highlight/dim transitions, locked column centering

## Implementation Notes

### `src/progression.ts` extensions
- `ProgressionState` now includes `completedSubgroups: string[]` (defaults to `[]`)
- `hasCompletedSubgroup(subgroup: string): boolean` — reads from `completedSubgroups` array
- `markSubgroupCompleted(subgroup: string): void` — appends to array if not already present; idempotent
- Existing `enemyUnlocked` field and functions unchanged; all localStorage access still try/catch wrapped

### Color wheel (`src/main.ts`)
- `buildColorWheel(): SVGElement` — creates the pentagon programmatically with `createElementNS`
- Five vertices placed at standard pentagon angles (72° increments, starting at top)
- Mana symbols rendered as `<image>` tags sized to 32×32px at each vertex
- Allied lines (pentagon edges) use `stroke: #c8a000` (gold), `stroke-width: 8`
- Wide hit-area lines are transparent overlays, `stroke-width: 24`, `pointer-events: stroke`
- Semantic IDs: `wheel-line-{guild-key}`, `wheel-symbol-{color}`, `wheel-hitarea-{guild-key}`

### Bidirectional hover (`src/main.ts`)
- Guild rows carry `data-guild` attributes matching the wheel line IDs
- On `mouseenter`: add `.highlight` to target elements; add `.dim` to all others in the SVG and list
- On `mouseleave`: remove all `.highlight` and `.dim` classes
- Separate listeners for hit areas (SVG) and guild rows (HTML)

### Button text logic (`src/main.ts`)
- `getButtonText(subgroup: string): string` — returns `'Practice'` or `'Learn'` prefix based on `hasCompletedSubgroup()`
- `markSubgroupCompleted()` called in `showSessionEnd()` before building the column buttons

### Styles (`style.css`)
- `.color-wheel-container` — centers the SVG, sets fixed width
- `.guild-entry.highlight`, `line.highlight` — brightened, full opacity
- `.guild-entry.dim`, `line.dim` — reduced opacity (0.25) for contrast
- `.guild-column--locked` — `display: flex; flex-direction: column; justify-content: center; align-items: center`

## Observability

No new telemetry spans introduced in this enhancement. The `completedSubgroups` array lives in localStorage and provides implicit behavioral tracking — the presence of a subgroup in the array indicates at least one completed session of that type. Future arcs may choose to emit a span event on first subgroup completion if Honeycomb analysis of the "Learn→Practice" transition becomes desirable.

## Learning Captured

- **SVG over Canvas for small interactive diagrams**: SVG is the correct choice when each visual element needs to be an individually targetable DOM node. With ~15 elements in this scene, SVG's element-per-node model maps cleanly. Canvas would require reimplementing a scene graph and hit-testing from scratch.
- **`<image>` for SVG asset reuse**: Using `<image href="images/X.svg">` inside an SVG cleanly reuses existing mana symbol assets without inlining the full SVG paths. Simple and maintainable.
- **JS required for SVG/HTML boundary hover**: CSS `:hover` and sibling selectors cannot cross the SVG/HTML DOM boundary. JavaScript event listeners adding/removing classes on both sides is the correct pattern.
- **Wide hit areas for line hover**: Thin SVG lines (even at 8px) are imprecise click targets. Overlaying a transparent wide `<line>` with `pointer-events: stroke` is the standard pattern for making lines interactive without changing their visual appearance.
- **"By the time you see it, you've done it"**: Marking subgroup completion before rendering the end screen buttons means the first post-session view already reflects "Practice" — which is accurate, since the user just practiced.
- **Session end screen as iterative surface**: Arc 8 introduced the two-column layout; this enhancement layered educational interactivity onto it without restructuring it. The column structure proved stable as an extension point.

## Outcome

Color wheel integration delivered as a post-Arc-8 enhancement. The session end screen now teaches the allied/enemy spatial relationship interactively, not just textually. Button text adapts to the user's history. The locked enemy column is visually cleaner.

**What was delivered:**
- Animated-ready SVG pentagon showing MTG color wheel (allied lines, mana symbols)
- Integrated into Allied Guilds column on session end screen
- Bidirectional hover: wheel line ↔ guild list entry, with dimming of non-highlighted elements
- "Learn" vs "Practice" button text based on `completedSubgroups` in localStorage
- Locked enemy column simplified to vertically centered button only
- Column headers centered

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
