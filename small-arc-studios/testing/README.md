# Small Arc Studio — Testing Techniques

This directory contains Small Arc Studio's internal testing products: reusable techniques for verifying visual and behavioral properties of web applications.

These are not throwaway scripts. They are tools we maintain, improve, and bring to every engagement.

## Standard

A testing technique must:

- **Produce correct results.** A wrong reading is a bug in the technique, not an acceptable approximation.
- **Have complete coverage.** If elements are skipped, that's a gap to investigate, not a "known limitation" to shrug at.
- **Be generalizable.** Developed against a client's codebase, but designed to work on any web application.
- **Be debuggable.** When output looks wrong, it should be possible to understand why — save intermediate artifacts, provide verbose modes, explain the methodology.

## Current Techniques

### Contrast Verification

**Problem:** Does all text on a page have sufficient contrast against its actual rendered background?

**Approach 1 — axe-core** (`tests/contrast-check.mjs`): Standard accessibility tool. Handles solid backgrounds reliably. Reports "incomplete" for gradients, transparency, layered elements — which is most of the interesting cases.

**Approach 2 — Screenshot diff** (`tests/contrast-screenshot-diff.mjs`): Two-screenshot technique that captures actual rendered pixels. Resolves the cases axe-core can't handle. See [contrast-screenshot-diff.md](contrast-screenshot-diff.md) for the technique design, known issues, and improvement roadmap.

### Visual Fit (planned)

**Problem:** Does text fit inside non-rectangular CSS containers (border-radius, clip-path)?

**Approach:** Range + elementFromPoint probing. See `notes/2026-04-08-visual-fit-testing-technique.md` for the research.

Not yet implemented.
