# Engagement History

Summary of formal engagements (RFPs, SOWs, Plans) that defined arc delivery.

---

## Initial Engagement: Sparrow Deck for MTG Color Combinations

**Date**: 2026-02-15
**Type**: Original RFP → Direction → Plan

**Problem**: MTG community language is specific; color combination names are a steep learning curve for new players. The client wanted a static web app applying the Sparrow Deck rapid-fire perceptual learning technique.

**Discovery highlights**:
- RF-001: Sparrow Deck is a rapid-fire perceptual learning tool — NOT a quiz. No scoring, no pass/fail. Speed and volume of exposure drive learning.
- RF-002: 20 core stable names (10 guilds + 5 shards + 5 wedges). Natural tier structure aligns with Sparrow Deck progressive difficulty.
- RF-003: Vanilla TypeScript + esbuild (no framework). Engineering attention should go to observability, not UI abstraction.

**Key early decisions**: DEC-001 through DEC-029.

**Delivered arcs**: 1, 2a, 2b, 3–12 (scaffolding through card images).

---

## RFP: Multi-Page Decomposition

**Date**: 2026-03-01
**Status**: COMPLETE — closed as SOW Completion 2026-03-02

**Problem**: The SPA constructed all screens via DOM manipulation. Navigation was invisible to the browser. `main.ts` was 950+ lines.

**Solution**: Four separate HTML pages (welcome, slides, assessment, end), each with its own JS bundle and CSS. Standard browser navigation. `mtg-sparrow.session.id` correlates telemetry across pages.

**What we lost**: Single trace waterfall view of a full session.
**What we kept**: All aggregation queries, all card-level and session-level attributes.

**Delivered arcs**: 14 (telemetry first), 15 (CSS split), 16 (module extraction), 17 (slides page), 18 (assessment page), 19 (end page), 20 (welcome page), 21 (cross-page telemetry verification).

**Final version**: v0.20.0. All 4 pages emit `app.navigation = 'multi_page'`.

---

## RFP/SOW: End Screen Refinements

**Date**: 2026-03-02
**Status**: COMPLETE — closed 2026-03-02

**Problem**: The two-column end screen was cramped, had no descriptive guild content, and didn't scale to 4 levels.

**Solution**: Full-width stacked rows per level. Three-part layout: summary (left), centered color wheel (center), flavor panel with descriptions (right).

**Delivered arcs**: 22 (row layout), 23 (guild flavor text + Scryfall links + iconic card additions).

**Note**: Immediately followed by unplanned Tangent Session that replaced the rows layout with a reel navigation pattern (DEC-081 through DEC-089). The rows layout was short-lived — `end.layout_version` went from `rows_v1` to `reel_v1`.

---

## RFP/SOW: Draggable Mana Symbols

**Date**: 2026-03-07
**Status**: COMPLETE — single arc engagement

**Problem**: The mana gas simulation was passive. To test encounter detection, users had to wait for random collisions.

**Solution**: Click/touch drag on mana gas particles. Pool-ball collision while dragging, momentum on release.

**Delivered arc**: 32 (draggable mana symbols). Immediately followed by Arc 33 (three-color encounters) as a related plan.

---

## Plan: Mana Gas Three-Color Encounters

**Date**: 2026-03-07
**Status**: COMPLETE — single arc

**Problem**: The mana gas simulation treated a third color entering a pair encounter as a disruptive "intruder". With wedge/shard data now in the app, three-color clusters should be recognized as a teaching moment.

**Solution**: Upgrade model — third matching particle upgrades to triple, downgrades when it drifts. Gold visual treatment.

**Delivered arc**: 33. `mana-gas-encounter` CustomEvent dispatched but Honeycomb listener deferred.

---

## Plan: Trace-Participating Logs

**Date**: 2026-03-07
**Status**: COMPLETE — single arc

**Problem**: `addSpanEvent()` calls only ship when the parent span ends. Browser spans may never end (tab close, navigation). Events were being silently lost.

**Solution**: OTel Logs API with `SimpleLogRecordProcessor` — logs sent immediately, carry trace_id for waterfall correlation. Required SDK upgrade to v1.x.

**Delivered arc**: 34.

---

## Plan: Publish Readiness

**Date**: 2026-03-08
**Status**: COMPLETE — all 5 arcs delivered in one session

**Problem**: MTG Sparrow had strong core functionality but wasn't ready for public sharing: known bugs, no license, no favicon, generic titles, prototype pages publicly accessible, no mobile welcome, no deploy markers.

**Solution**: A hardening pass covering bug fixes, legal/identity, cleanup, mobile, and ops.

**Arcs delivered**:
- Arc 35: Bug fixes (home link, image layout shift, Scryfall fallback, reel animation conflict)
- Arc 36: CC0 license, About page, "MTG Colors" identity, favicon, OG tags, Share with UTM tracking
- Arc 37: Prototype cleanup, APP_VERSION extracted to version.ts, bumped to 0.27.0
- Arc 38: Mobile welcome (dual-block HTML + CSS media query)
- Arc 39: Deploy markers in GitHub Actions + local script

**Post-plan polish**: Menu redesign (injectMenuDOM(), hamburger, CSS unification), logo design with `renderLogo()`, slides button cleanup, logo entrance animation.

---

## Plan: Feedback Input

**Date**: 2026-03-10
**Status**: COMPLETE — single arc

**Problem**: Users had no way to send feedback from within the app before wider publishing.

**Solution**: Feedback modal accessible from hamburger menu. Feedback goes to Honeycomb as `feedback.submit` spans — automatic session correlation, no backend needed.

**Delivered arc**: 41. Additional scope delivered beyond plan: context provider pattern for per-page enrichment, dialog-pause coordination, spacebar fix.

---

## Plan: Name Scroll (Arcs 42–43)

**Date**: 2026-03-14
**Status**: COMPLETE

**Source**: Direct advice from Llewellyn Falco (Sparrow Deck creator) — with 5 names per level (vs 2 in the original), learners need to see name options upfront. Show names before slides begin, keep them visible.

**Solution**: Level intro screen showing "LEVEL N" and a scroll div with 5 combo names. Then the scroll docks to the left edge as a persistent reference during all slides. Current combo name highlights on reveal.

**Arcs delivered**: 42 (intro screen), 43 (persistent docked reference). CTA unified to "BEGIN" (DEC-160).

**Observability**: `session.has_name_scroll = true` structural marker on session spans.
