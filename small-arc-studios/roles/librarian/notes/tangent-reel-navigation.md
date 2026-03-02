# Tangent Session: Slot Machine Prototype + End Screen Reel Navigation

**Date**: 2026-03-02
**Type**: Unplanned exploration (outside formal SOW process)
**Decisions recorded**: DEC-081 through DEC-089

---

## What Was Explored

This session began as an open-ended exploration of a reel/slot-machine navigation pattern, motivated by earlier failed attempts at scroll-snap navigation for the end screen (Arc 24, reverted twice). Rather than continuing under SOW discipline, the client and team agreed to experiment freely.

---

## What Was Built

### 1. Slot Machine Prototype (`/slot-machine`)

A standalone page exploring the reel mechanic in isolation.

**Files created:**
- `slot-machine.html` — standalone page, new esbuild entry point
- `slot-machine.css` — reel window, symbols, pull button styles
- `src/slot-machine.ts` — reel mechanics: advance, spinTo, wheel cooldown

**Key mechanics established:**
- Single reel of 5 mana symbol emojis (from `colorEmojiMap`)
- Pull button advances the reel by one position (clicking)
- Scroll inside the window advances one step per gesture
- `cubic-bezier(0.2, 0.8, 0.3, 1.05)` at 600ms — "slot machine feel" with gentle bounce
- 700ms timestamp-based cooldown absorbs trackpad inertia
- `spinning` boolean prevents overlapping animations

### 2. End Screen Reel Navigation

The slot machine mechanic was applied to the end screen, replacing the stacked row layout (`rows_v1`) with a reel pattern (`reel_v1`).

**Files modified:**
- `src/ui/guild-columns.ts` — reel construction, navigation, span management
- `src/end.ts` — root span wiring, trace link, section lifecycle
- `end.css` — viewport clipping, reel positioning, nav button styles

**Key behavior changes:**
- Level sections (Allied, Enemy) are reel faces — one visible at a time
- A clipping viewport (`level-sections-viewport`) constrains display to one section
- The reel (`level-sections-reel`) translates with the same cubic-bezier animation
- Viewport height animates dynamically to match the current section's height
- Top nav button: up-arrow chevron, or "Home" (navigates to `/`) at top of reel
- Bottom nav button: down-arrow chevron, or "Share" (placeholder — no action yet) at end of reel
- Navigation is clamped — no wrap-around
- Scroll inside viewport triggers reel advance (same 700ms cooldown)

### 3. End Screen Observability Overhaul

**Problems fixed:**
- Spans (`session.summary`, `end.guild_highlight`, `end.scryfall_click`) were orphaned — no parent span existed
- No way to observe time-on-section
- Trace link hidden unless user arrived from a session

**What was added:**
- `end.page_view` root span — covers entire page visit, parent of all end-screen spans
- `end.section_view` child spans — one per section visit, carries `end.section_index` and `end.section_name`, lives as long as user is on that section
- `end.guild_highlight` and `end.scryfall_click` now nest under `end.section_view`
- `end.section_navigate` removed (replaced by section_view boundaries)
- Trace link in settings always visible (wired to `end.page_view` trace ID)

**Structural marker updated:**
- `end.layout_version` changed from `rows_v1` to `reel_v1`

---

## Key Technical Decisions

| Decision | What | Why |
|---|---|---|
| DEC-081 | Standalone prototype page | Explore mechanic safely before applying to production |
| DEC-082 | Reel over stacked rows | Focus on one level at a time; better for future dot indicator |
| DEC-083 | cubic-bezier(0.2, 0.8, 0.3, 1.05) @ 600ms | Slot machine feel with gentle bounce; confirmed empirically |
| DEC-084 | 700ms timestamp gate for wheel | Absorbs trackpad inertia without adding lag |
| DEC-085 | end.page_view root span | Fix orphaned spans; establish coherent traces |
| DEC-086 | end.section_view spans | Time-on-section observability; natural parent for interaction events |
| DEC-087 | Mutable SpanRef pattern | Avoid stale closure on section span reference |
| DEC-088 | Trace link always visible | page_view always exists; no reason to gate it |
| DEC-089 | layout_version = reel_v1 | Structural marker must reflect architectural change |

---

## Open Items / Next Steps

- **Share button** (bottom nav at last section) is a placeholder — no action yet. Future arc could wire this to Web Share API or copy-to-clipboard.
- **Dot indicator** (Arc 25 in the prior SOW plan) is a natural companion to reel navigation — four dots on left edge, solid/empty/larger for state.
- **Polish** (Arc 26 in prior plan): transitions, mobile tuning.

---

## Relationship to Prior SOW

The prior SOW (Single-Section End Screen Navigation, Arcs 24–26, v0.22.0) was targeting a similar goal but via scroll-snap. That approach was attempted and reverted twice (the Arc 24 reverts visible in git history). This tangent session effectively achieves the goals of that SOW by a different implementation path.

The client and team should decide whether to formally close or revise the SOW, or treat this as informal delivery. The core behavior is working; observability is confirmed; the structural marker is updated.
