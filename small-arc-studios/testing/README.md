# Small Arc Studio — Testing Techniques

This directory contains Small Arc Studio's internal testing products: reusable techniques for verifying visual and behavioral properties of web applications.

These are not throwaway scripts. They are tools we maintain, improve, and bring to every engagement.

## Standard

A testing technique must:

- **Produce correct results.** A wrong reading is a bug in the technique, not an acceptable approximation.
- **Have complete coverage.** If elements are skipped, that's a gap to investigate, not a "known limitation" to shrug at.
- **Be generalizable.** Developed against a client's codebase, but designed to work on any web application.
- **Be debuggable.** When output looks wrong, it should be possible to understand why — save intermediate artifacts, provide verbose modes, explain the methodology.
- **Eat its own dog food.** The report output must pass its own checks.

## Where things live

- **This directory** (`small-arc-studios/testing/`) — technique design docs, known limitations, roadmap. The product knowledge.
- **`tests/`** — the runnable scripts, implemented against the current client's codebase.
- **Someday** — when techniques are mature enough, they extract into a standalone package usable across engagements.

## Current Techniques

### Contrast Verification

**Problem:** Does all text on a page have sufficient contrast against its actual rendered background?

Two complementary approaches:

**Approach 1 — axe-core** (`tests/contrast-check.mjs`)
- Standard accessibility tool, solid on simple backgrounds
- Reports "incomplete" for gradients, transparency, layered elements
- Run: `npm run test:contrast`
- Output: console summary

**Approach 2 — Screenshot diff** (`tests/contrast-screenshot-diff.mjs`)
- Two-screenshot technique that captures actual rendered pixels
- Resolves the cases axe-core can't handle
- Supports `data-contrast-check` attribute for labeling elements and opting in non-text elements (SVG icons)
- Per-page `setup` callbacks for reaching specific visual states (opening menus, dismissing modals, expanding collapsed sections)
- Run: `npm run test:contrast-diff`
- Output: console summary + HTML report with cropped element screenshots, color swatches, annotated full-page screenshots with pass/fail/plain toggle
- Design doc: [contrast-screenshot-diff.md](contrast-screenshot-diff.md)

#### How the screenshot diff works

1. Collect all text nodes + `data-contrast-check` labeled elements
2. Screenshot A: page as rendered
3. Disable CSS transitions, set `color: transparent` on text elements, `opacity: 0` on labeled non-text elements
4. Screenshot B: backgrounds only
5. Per element: diff A vs B → glyph pixels → mode text color and mode background color → WCAG contrast ratio
6. HTML report with embedded crops, swatches, and annotated screenshots

#### Key bugs found and fixed during development

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Wrong colors on elements with styled backgrounds | `visibility: hidden` removes the whole element including its background | Use `color: transparent` instead |
| Below-fold elements skipped | Viewport-only screenshots | Full-page screenshots |
| Elements with CSS transitions show 0 glyph pixels | `color: transparent` animates over 200ms | Inject `* { transition: none !important }` |

#### Known limitations

- **Gradient backgrounds** produce one contrast number (mode color), but contrast actually varies across the element
- **SVG icons** require explicit `data-contrast-check` labeling — not auto-discovered
- **Collapsed content** (details, accordions) needs a `setup` callback to open before checking
- **Color quantization** (nearest-8 rounding) may introduce ±0.2 contrast ratio error at boundaries

### Visual Fit (planned)

**Problem:** Does text fit inside non-rectangular CSS containers (border-radius, clip-path)?

**Approach:** Range + elementFromPoint probing. Research notes in `notes/2026-04-08-visual-fit-testing-technique.md`.

Not yet implemented.

## Roadmap

### Contrast — next steps
1. Expand to all 12 page+state combinations (currently checking 4 pages)
2. Evaluate color quantization error impact on pass/fail decisions
3. Handle gradient variation within a single element (report min/max, not just mode)
4. Auto-discover SVG icons instead of requiring manual labeling
5. Verbose/debug mode that saves intermediate screenshots per element
6. Parameterize the page+state matrix so the script isn't mtg-sparrow-specific

### New techniques
- Visual fit checking (Range + elementFromPoint)
- Overflow detection for text in constrained containers
- Responsive breakpoint verification (does layout break at specific widths?)
