# Arc 17 Telemetry Verification — Honeycomb

**Date**: 2026-03-02
**Environment**: sparrow-deck
**Version checked**: 0.15.0
**Tool**: mcp__honeycomb__* (local)

---

## Summary

8 session spans and 17 card spans confirmed in Honeycomb at v0.15.0. Most telemetry is correct. Two issues found — one is a **bug requiring a fix before arc closure**, one is an expected gap.

---

## Verified Correct

### Session spans (8 total)
- `app.page = 'slides'` ✅
- `app.navigation = 'multi_page'` ✅
- `app.version = '0.15.0'` ✅
- `mtg-sparrow.session.id` present (10 distinct IDs seen across columns query) ✅
- `session.tier = 'guild_allied'` ✅
- `session.card_count = 2` ✅
- `session.completed = false` ✅
- `session.duration_ms` populated (range ~1140–1330ms) ✅
- `session.started_from = 'welcome'` ✅
- `session.welcome_dwell_ms = 0` ✅ (0 in Playwright — expected, no real dwell in tests)
- `session.subgroup_size = 5` ✅
- `session.enemy_unlocked = false` ✅

### Card spans (17 total — 2 per session in tests)
- `card.combo_id` populated (rakdos, azorius, selesnya, dimir, gruul) ✅
- `card.dwell_time_ms` populated (range ~509–645ms) ✅
- `card.advanced_early` present (true/false) ✅
- `card.number` populated (1, 2) ✅
- `card.combo_name`, `card.combo_emoji`, `card.colors`, `card.tier` all present ✅
- `slide.card_name` present ✅
- `mtg-sparrow.session.id` correlates to parent session ✅
- Correct trace.parent_id linking card spans to session spans ✅

---

## Bug: Card Spans Missing `app.page` and Wrong `app.navigation`

**Severity**: Medium — affects observability of card-level events

### What's happening
Card spans show `app.navigation = 'single_page'` and have **no `app.page` attribute**.
Session spans correctly show `app.navigation = 'multi_page'` and `app.page = 'slides'`.

### Root cause
In `src/telemetry/init.ts` (line 18), the SDK resource attribute is `'app.navigation': 'single_page'`.
This is the default for all spans.

In `src/slides.ts` (line 296–297), `app.page = 'slides'` and `app.navigation = 'multi_page'` are
set as **span-level attributes** on the `session` span only (inside `startSpan('session', {...})`).
Card spans do not set these attributes individually, so they inherit the resource-level `single_page`.

### Fix needed
`initTelemetry()` needs to accept `app.page` and `app.navigation` as parameters (or receive them
via a page context object) and pass them as resource attributes to the SDK, so ALL spans from
the slides page carry `app.page = 'slides'` and `app.navigation = 'multi_page'`.

Alternatively, card span creation could explicitly set these attributes — but resource-level is cleaner.

This should be addressed before Arc 18 ships, as all future pages will have the same issue.

---

## Expected Gap: No `app.startup` at v0.15.0

`app.startup` spans exist at v0.11.0–v0.14.0 but **none at v0.15.0**.

**This is expected**. The welcome page (`index.html`) emits `app.startup` and has not yet been
updated to v0.15.0 — that's Arc 20. The slides page intentionally does NOT emit `app.startup`
(see `slides.ts:319` comment: "Do NOT call sendStartupSpan — welcome page only").

No action needed for Arc 17.

---

## Trace Correlation

`mtg-sparrow.session.id` correctly correlates session and card spans across the same page load.
Verified: card spans share `mtg-sparrow.session.id` with their parent session span.
Cross-page correlation (slides → assessment) is deferred to Arc 21.

---

## Verdict

Arc 17 is **conditionally closeable** pending resolution of the card span attribute bug.

The session-level telemetry is correct and satisfies the primary Arc 17 observability requirements.
However, card spans carrying stale `app.navigation=single_page` is a real defect — when querying
by `app.navigation = 'multi_page'` for analytics, card events will be excluded.

**Recommendation**: Fix `initTelemetry()` to accept page-level resource attributes before marking Arc 17 complete, or explicitly track this as a known defect for Arc 18 to resolve.
