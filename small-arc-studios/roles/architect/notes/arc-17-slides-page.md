# Arc 17 — Architectural Notes: slides.html + src/slides.ts

Date: 2026-03-01
Architect: Small Arc Studio

---

## Context

Arc 17 creates the first standalone page in the multi-page decomposition. It splits the session lifecycle out of `main.ts` into a dedicated `slides.ts` entry point, removing all card/session logic from the welcome page.

Current state after Arc 16: `main.ts` is 438 lines handling both the welcome screen and the full session lifecycle.

---

## 1. What Stays in main.ts (Welcome Page)

main.ts becomes a thin welcome-screen handler:

- `APP_VERSION` export
- `DOMContentLoaded` handler:
  - `initTelemetry(APP_VERSION)` — creates sessionId in sessionStorage
  - `sendStartupSpan(APP_VERSION)` — sends structural marker (welcome page only)
  - `wireSettings(APP_VERSION, () => null)` — no session span on welcome page
  - Record `welcomeScreenLoadTime = Date.now()`
  - Start button click → `window.location.href = slides.html?subgroup=allied&from=welcome&welcome_dwell_ms=NNN`
  - `visibilitychange` flush (for abandoned welcome sessions — keeps telemetry complete)

**Removed from main.ts:** all session state variables, all session functions, click/keydown handlers, the `?screen=end` dev shortcut.

---

## 2. What Moves to slides.ts

slides.ts is a new entry point for `slides.html`. On load it:

1. Calls `initTelemetry(APP_VERSION)` — reads existing `sessionId` from sessionStorage (set by welcome page; same browsing session)
2. Does NOT call `sendStartupSpan()` — that's welcome-only
3. Reads URL params: `subgroup` (default: `"allied"`) and `from` (default: `"welcome"`) and `welcome_dwell_ms` (default: `0`)
4. Creates and starts session immediately
5. Starts session span with `app.page='slides'` and `app.navigation='multi_page'`

All session functions move to slides.ts:
- `startSession`, `showCard`, `goToNextCard`, `handleAdvance`, `stopSession`
- `clearTimers`, `endCardSpan`, `endSessionSpan`
- All module-level state: `session`, `sessionSpan`, `cardSpan`, `cardShowTime`, `revealTimer`, `advanceTimer`, `paused`, `nameRevealed`, `currentTraceUrl`

Click/keydown handlers for card advancement belong in slides.ts.

---

## 3. End-of-Session Flow (Key Architectural Change)

**Current behavior:** `showSessionEnd()` in main.ts shows self-assessment inline, then guild columns.

**New behavior in slides.ts:** when the session ends (completed or stopped):

1. Record progression side effects (`markSubgroupUnlocked`, `markSubgroupCompleted`) — must happen before span ends
2. End session span (without `session.self_assessment` — that attribute moves to assessment page)
3. Navigate: `window.location.href = assessment.html?subgroup=...&cards=NNN&completed=true|false`

`showSessionEnd()`, `buildSelfAssessment`, and `showSessionEndColumns` are **not** used in slides.ts. The self-assessment inline UI is gone; assessment.html owns that experience.

**Trade-off:** `session.self_assessment` is no longer on the session span. It becomes a separate span attribute on the assessment page. This is acceptable per the per-page telemetry design (DEC-058: no cross-page trace continuity).

---

## 4. URL Param Contracts

### welcome → slides.html
```
?subgroup=allied|enemy&from=welcome&welcome_dwell_ms=NNN
```
- `subgroup`: which guild set to practice
- `from`: navigation origin (for telemetry: `session.started_from`)
- `welcome_dwell_ms`: time spent on welcome screen (integer milliseconds)

### slides.html → assessment.html
```
?subgroup=allied|enemy&cards=NNN&completed=true|false
```
- `subgroup`: passed through so assessment → end can track progression display
- `cards`: actual number of cards shown (for threshold check and display)
- `completed`: whether all 25 cards were shown

assessment.html decides whether to show the assessment prompt (if `cards > SELF_ASSESSMENT_MIN_CARDS`) or skip straight to end.html.

### assessment.html → end.html (Arc 19 — for reference)
```
?subgroup=allied|enemy&cards=NNN&completed=true|false&assessment=VALUE
```
- `assessment`: the self-assessment value (or omitted if skipped)

---

## 5. Build Config Changes

Current `package.json` scripts:
```
"build": "esbuild src/main.ts --bundle --outfile=dist/bundle.js --minify --sourcemap --format=esm"
"dev":   "esbuild src/main.ts --bundle --outfile=dist/bundle.js --sourcemap --format=esm --watch"
```

New pattern — add slides.ts as a second bundle (keep `bundle.js` name to avoid breaking index.html):
```
"build": "esbuild src/main.ts --bundle --outfile=dist/bundle.js --minify --sourcemap --format=esm && esbuild src/slides.ts --bundle --outfile=dist/slides.js --minify --sourcemap --format=esm"
"dev":   "esbuild src/main.ts --bundle --outfile=dist/bundle.js --sourcemap --format=esm --watch & esbuild src/slides.ts --bundle --outfile=dist/slides.js --sourcemap --format=esm --watch"
```

**Note:** `--watch` in parallel with `&` requires care in dev mode. A simpler approach is two sequential `--watch` calls backgrounded, or a helper script. The dev script pattern may need a small wrapper. Recommend a `scripts/dev.sh` update that runs both watchers in background and waits.

---

## 6. slides.html Structure

slides.html is a new HTML file at the root (alongside index.html). It:

- Links the same CSS files as index.html (all 5: style.css, welcome.css, slides.css, assessment.css, end.css) — or just the relevant subset. **Recommendation:** link only `style.css` and `slides.css` to avoid loading unused styles.
- Has a `<main id="app">` container (same as index.html — the session rendering code uses `document.getElementById('app')`)
- **Includes the settings panel HTML** (duplicated per SOW decision DEC-054 or equivalent)
- Does **not** have the mana gas canvas (that's welcome-page ambiance)
- Loads `dist/slides.js` (not `dist/bundle.js`)

Settings panel in slides.html: identical HTML block to index.html. `wireSettings(APP_VERSION, () => sessionSpan)` will work because the same DOM IDs are present.

---

## 7. Telemetry Attributes on slides.ts

Session span additional attributes (beyond current):
```
'app.page': 'slides'
'app.navigation': 'multi_page'
```

All card spans inherit these via the tracer resource attributes or can be added explicitly. The `app.navigation` attribute is the structural marker for Arc 17 (verifiable in Honeycomb).

The trace URL setup (for settings panel "Current trace" link) stays in slides.ts where the session span lives. On the welcome page, the trace link stays hidden (no active session span).

---

## 8. wireSettings on slides.ts

`wireSettings(APP_VERSION, () => sessionSpan)` works without modification. The reset button fires `settings.reset_progress` event on the session span if one is active, then clears localStorage and reloads — which will reload slides.html, and slides.ts will start a new session. This is acceptable behavior.

---

## 9. README.md Accuracy Issues Found

The README has several outdated items that should be corrected in Arc 17 (or as part of it):

1. `**Current version:** v0.9.0` — should be v0.14.0 (updating to v0.15.0 in Arc 17)
2. Project structure shows `main.ts` as "session lifecycle, event handlers, welcome screen" — needs `slides.ts` added
3. Arc history table stops at Arc 10 — needs Arcs 11-17 added
4. Session constants table shows `SESSION_CARD_COUNT = 20` — code says 25
5. "20-card sessions" in feature list — should be 25
6. CSS file list shows `style.css` only — should show all 5 CSS files

**Recommendation:** README update is part of Arc 17's definition of done.

---

## 10. Structural Risk: Dev Mode with Two Entry Points

The current `scripts/dev.sh` just runs `npm run dev`. With two `--watch` instances, we need both to run simultaneously. Options:

A. Update `dev` script to use `&` with a wait, plus cleanup trap
B. Use a dev wrapper script that runs two esbuild processes
C. Use esbuild's `--entry-names` flag with `--outdir=dist` — but this renames `bundle.js` to `main.js`, requiring index.html update

**Recommendation:** Option A or B — keep `bundle.js` naming, run two parallel watchers. Update `scripts/dev.sh` to handle this explicitly rather than baking complex shell into package.json.

---

## 11. What's Not in Arc 17

These questions are deferred to later arcs:
- assessment.html (Arc 18)
- end.html (Arc 19)
- Slimming index.html and deleting old session code from main.ts beyond welcome-screen residue (Arc 20)
- Cross-page telemetry verification (Arc 21)

**slides.ts in Arc 17 still contains** `showSessionEndColumns` calls and `buildSelfAssessment` inline — OR it navigates to assessment.html immediately. Given that assessment.html doesn't exist yet, slides.ts needs a temporary fallback for Arc 17: show a minimal "session ended" message or navigate to index.html. **Strongly recommend navigating directly** to a stub assessment.html or to index.html as the session-end destination for Arc 17 verification, with a TODO comment.

**Actually, cleaner approach:** slides.ts navigates to `assessment.html` as the final destination. Since assessment.html doesn't exist yet, Arc 17 verification confirms that: (a) the slides page loads, (b) cards are shown, (c) session spans appear in Honeycomb with `app.page='slides'` and `app.navigation='multi_page'`. The navigation to assessment.html will 404 — that's acceptable for Arc 17 since Arc 18 creates it.

---

## Summary: Arc 17 Deliverables

1. `src/slides.ts` — new entry point, session lifecycle code from main.ts
2. `slides.html` — new HTML page with settings panel, loads `dist/slides.js`
3. `package.json` — updated `build` and `dev` scripts for two entry points
4. `scripts/dev.sh` — updated for parallel watch (if needed)
5. `src/main.ts` — slimmed to welcome screen only
6. `README.md` — version, structure, arc history updated
7. Structural marker: `app.navigation='multi_page'` and `app.page='slides'` on session spans

**Version bump:** 0.14.0 → 0.15.0
