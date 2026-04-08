# Session: Reel Progress Dots Arc (2026-04-01)

## What we built
- Added progress dot indicator to the end screen reel (5 dots, one per section)
- Dots are horizontally centered under the home-spiral logo, vertically centered on screen
- Clicking a dot navigates directly to that section (with full reel animation)
- Active dot syncs with all navigation methods (chevrons, scroll wheel, dot clicks, deep links)
- Telemetry: `end.progress_dot_click` event with target section name and index
- Hidden on mobile (< 700px)
- Version bumped to 0.44.0

## Files changed
- `src/ui/guild-columns.ts` — DOM creation, click handlers, active state sync in `updateNavButtons`
- `end.css` — styling for `.reel-progress-dots` and `.reel-progress-dot`
- `src/version.ts` — 0.43.0 → 0.44.0

## Design decisions
- Pure visual dots (no labels) — client's choice
- Position: horizontally centered under home-spiral (`left: 28px`), vertically centered on screen (`top: 50%`)
- Client initially wanted them "under the logo" but corrected that the vertical centering was preferred — only horizontal alignment under the spiral was desired
- `background-clip: content-box` trick for larger click target (18px) with smaller visual dot (10px)

## Commits
- f1ce817 — CSS styles
- 39b3dc4 — JS + version bump
- 762c168 — Verification test
- d15c117 — Tester notes
- 7f9caf6 — Reposition horizontally under spiral
- 10d2fb5 — Restore vertical centering
