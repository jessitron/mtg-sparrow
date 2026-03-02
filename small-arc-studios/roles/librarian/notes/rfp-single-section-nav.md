# RFP: Single-Section End Screen Navigation

## Date: 2026-03-02

## Executive Summary

Replace the multi-row end screen with a single-section-at-a-time view. One level fills the viewport at a time; arrow buttons navigate up and down. The experience feels like a slot machine settling on a result — focused, intentional, satisfying.

## Problem Statement

After completing the End Screen Refinements SOW (Arcs 22–23), the end screen shows all completed levels simultaneously as full-width rows. While this works, it presents a wall of content that can feel overwhelming, especially as more levels unlock. The rows were also not fully aligned with the client's original vision of a focused single-section experience.

The client wants the end screen to feel navigated, not scrolled. Each level should command the full viewport — a moment of presence before moving on.

## Goals

1. **Single-section view**: One level visible at a time, taking the full body area
2. **Snap navigation**: Up/down arrow buttons move between sections with a slot-machine feel
3. **Context-sensitive CTAs**: Button labels change based on position and unlock state
4. **Empty state**: Graceful presentation when nothing is unlocked yet
5. **Retain all content**: Guild flavor text, color wheel interaction, practice buttons — all preserved

## Non-Goals

- Wedge or shard content (future work)
- Changes to slides, assessment, or welcome pages
- Changes to progression/unlock logic
- New card imagery or guild data

## Constraints and Assumptions

- Vanilla TypeScript, esbuild, no framework
- CSS scroll-snap for section transitions (no JS animation library)
- Mobile responsiveness required
- All existing telemetry preserved; new navigation telemetry added
- The reverted original Arc 24 implementation does not inform this work

## Architectural Approach

### Layout Structure

```
.end-screen
  ├── .end-header  (Up button or Home button, context-sensitive)
  ├── .end-body    (scroll container with scroll-snap-type: y mandatory)
  │   └── .end-section × N  (one per unlocked level, scroll-snap-align: start)
  └── .end-footer  (Down button, or "Start [Level]" for locked, or "Share" on last)
```

The header and footer are fixed overlays. The body is the only scrollable region. CSS `scroll-snap-type: y mandatory` creates the slot-machine feel without JavaScript animation.

### Context-Sensitive Navigation Logic

| Position | Header | Footer |
|----------|--------|--------|
| First (only section) | Home | Next locked level "Start [Level]" or Share if all done |
| First of multiple | Home | Down arrow |
| Middle | Up arrow | Down arrow |
| Last | Up arrow | Next locked level "Start [Level]" or Share if all done |

### Empty State

When no levels are unlocked: no sections, just a home link centered on screen.

### Observability Plan

- `end.layout_version = 'single_section_v1'` structural marker
- `end.section_navigate` span with `navigate.direction` (up/down) and `navigate.target_section`
- `end.start_level_click` span when locked-level CTA is tapped

## Testing Strategy

- E2E: End screen renders single-section view with correct layout
- E2E: Navigation arrows move between sections
- E2E: Context-sensitive buttons appear correctly at first, last, and middle positions
- E2E: Empty state renders for a fresh session
- Honeycomb query confirms all three span types present
- Visual verification by tester

## Initial Arc Candidates

### Phase 1: Core Navigation

**Arc 24: Single-section end screen with snap navigation**
- Type: User Arc
- Rewrite end screen layout to header/body/footer pattern
- CSS scroll-snap for section transitions
- Context-sensitive CTAs
- Navigation telemetry

### Phase 2: Indicators & Polish

**Arc 25: Level dot indicator**
- Four dots on left edge showing progress through sections
- Solid = completed, empty = locked, larger = current
- Provides visual position context without additional navigation

**Arc 26: Polish**
- Transitions and timing refinement
- Mobile tuning
- Any rough edges identified in Arc 24 testing
