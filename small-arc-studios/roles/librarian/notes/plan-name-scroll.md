# Plan: Name Scroll (Arcs 42–43)

**Initiated**: 2026-03-14
**Source**: Direct advice from Llewellyn Falco (creator of the Sparrow Deck technique) to the client.
**Status**: Awaiting delivery

---

## Section 1: Discovery

### Problem

MTG Colors presents 5 combo names per level. Unlike the original Sparrow Deck (2 categories), learners cannot hold 5 arbitrary names in working memory while simultaneously learning color associations. This creates unnecessary cognitive load that is not part of the learning task.

The slideshow currently begins without introducing the names, leaving learners to encounter each name cold on the first card that reveals it. By the end of the session, a learner may finally recognize a name — but could have been learning sooner with earlier exposure.

### Source of Guidance

Llewellyn Falco, creator of the Sparrow Deck technique, advised the client directly: with 5 names per level (vs. 2 in the original), learners need to see the name options. Show names upfront, keep them visible.

### Goals

- Show learners the 5 names before the slideshow begins
- Keep names visible during the entire slideshow as a persistent reference
- Make the transition from intro to slideshow feel like one continuous motion

### Non-Goals

- Scoring or tracking which names the learner gets right
- Changing slide timing or progression system
- Building an actual scroll-unroll animation (the scroll is a div for now)

### Approach

A single "scroll" div element shows the 5 names centered on screen during a level intro, then slides left to dock as a persistent sidebar reference during the slideshow. The intro screen also shows a large "LEVEL N" heading.

### Observability

`session.has_name_scroll: true` attribute on session span as a structural marker, confirming the feature is active at runtime.

---

## Section 2: Arc Definitions

### Arc 42: Level Intro Screen

- **Type**: User
- **Intention**: Before slides begin, show a "LEVEL N" title and a scroll div with the 5 combo names centered on screen.
- **Observable Outcome**: User sees the level number and all 5 names before the first slide appears.
- **Acceptance Criteria**:
  - "LEVEL N" displayed large in Jost (sans-serif), centered on screen
  - Scroll div below the title, listing the 5 combo names in GoudyMediaeval
  - Level number mapping: allied=1, enemy=2, wedges=3, shards=4
  - Tap/click on screen triggers transition: scroll slides left, first card appears
  - `session.has_name_scroll: true` attribute recorded on session span
- **Risks Reduced**: Validates the intro screen concept before building the persistent docked reference.
- **Observability Confirmation**: Honeycomb session span shows `session.has_name_scroll = true`.

### Arc 43: Scroll Docks as Persistent Reference

- **Type**: User
- **Intention**: The scroll from the intro repositions to the left edge of the viewport and remains visible during all slides.
- **Observable Outcome**: Learners can glance at the 5 names at any point while guessing during a slide.
- **Acceptance Criteria**:
  - Scroll docks on the left side of the viewport after the intro transition completes
  - The current combo name highlights in the scroll when the answer is revealed
  - Scroll remains visible through the entire session (no dismissal)
  - Card area accommodates the docked scroll without overlap or layout breakage
- **Risks Reduced**: Completes Llewellyn's advice — names visible throughout the full learning session.
- **Observability Confirmation**: Honeycomb session span retains `session.has_name_scroll = true`; no layout errors in telemetry.

---

## Communication Cadence

- **Pause after Arc 42** for client review. Arc 42 changes the core session entry flow and warrants explicit approval before proceeding.
- **Continue through Arc 43** after client approval.

---

## Decision Cross-References

- DEC-152–159: Cylinder/scroll prototype geometry (separate visual exploration, informs scroll aesthetics)
- Prior arc history: see plan-publish-readiness.md, plan-feedback-input.md
