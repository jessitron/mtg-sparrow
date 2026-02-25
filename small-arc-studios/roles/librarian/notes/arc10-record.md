# Arc 10: Settings (Gear Icon + Panel)

## Overview

| Field | Value |
|-------|-------|
| **Arc** | 10 |
| **Name** | Settings (Gear Icon + Panel) |
| **Type** | User Arc |
| **Target Version** | 0.9.0 |
| **Start Date** | 2026-02-25 |
| **Completion Date** | 2026-02-25 |
| **Status** | COMPLETE |

## Intention

Replace the version footer with a gear icon button that opens a settings panel overlay. The panel consolidates version info, the current Honeycomb trace link, and a progress reset action — all of which were previously scattered or inaccessible. This fulfills DEC-025 (settings page with localStorage reset), which was planned from the original proposal.

## Observable Outcome

The version footer is gone. A gear icon appears in its place. Clicking it opens a settings panel overlay with:
- App version (v0.9.0)
- "Current trace" link to Honeycomb (visible only during or after a session)
- "Reset progress" button that clears `sparrow-deck.progression` from localStorage and reloads the page

The panel is dismissible by clicking the close button or the backdrop. Resetting progress emits a `settings.reset_progress` telemetry event.

## Acceptance Criteria

All 34/34 Playwright checks passed.

- Gear icon visible on page
- Clicking gear icon opens settings panel
- Settings panel shows version v0.9.0
- Honeycomb trace link visible only during/after a session
- "Reset progress" button clears localStorage and reloads
- Panel dismisses on close button click
- Panel dismisses on backdrop click
- `settings.reset_progress` telemetry event emitted on reset
- APP_VERSION bumped to 0.9.0

## Key Decisions Made During Arc 10

- **DEC-047 implemented**: Gear icon replaces version footer — version and trace link moved into settings panel. The footer had outgrown its role; centralizing these controls in a panel is cleaner.
- **DEC-048 implemented**: Reset is single-tap, no confirmation — keep it simple. The app has no destructive data (no account, no cloud state); progression resets from a deliberate action are acceptable without a prompt.
- **DEC-049 implemented**: Settings panel is static HTML in `index.html`, wired in `DOMContentLoaded` — not dynamically constructed. Consistent with DEC-033 (static content belongs in HTML).

## Files Involved

- `index.html` — gear icon button added; `<footer id="app-version">` removed; settings panel overlay added as static HTML
- `src/main.ts` — `currentTraceUrl` stored at module level; settings panel open/close wiring in `DOMContentLoaded`; reset handler clears localStorage, emits telemetry, reloads page; APP_VERSION bumped to 0.9.0
- `style.css` — gear icon and settings panel overlay styles
- `scripts/test-v0.9.0.mjs` — Playwright verification script (34 checks)

## Implementation Notes

### Gear icon button (`index.html`)

The gear icon replaces `<footer id="app-version">`. It is a `<button>` element with `id="settings-btn"` containing a unicode gear glyph (⚙). Positioned in the corner via CSS.

### Settings panel (`index.html`)

Static HTML panel with `id="settings-panel"`, hidden by default (`display: none`). Contains:
- Version display (`id="settings-version"`)
- Honeycomb trace link (`id="settings-trace-link"`) — hidden until a session starts
- Reset progress button (`id="settings-reset-btn"`)
- Close button (`id="settings-close-btn"`)
- Backdrop overlay for dismiss-on-click

### `currentTraceUrl` at module level (`src/main.ts`)

Previously the trace URL was ephemeral — set in the footer after a session started. Now it is stored at module level so the settings panel can read it whenever it opens.

### Reset handler (`src/main.ts`)

```ts
settingsResetBtn.addEventListener('click', () => {
  emitEvent('settings.reset_progress');
  localStorage.removeItem('sparrow-deck.progression');
  location.reload();
});
```

Single-tap, no confirmation. Clears the `sparrow-deck.progression` key and reloads. On reload the app returns to its initial state (allied guilds unlocked, enemy column locked).

### Telemetry

`settings.reset_progress` span event emitted immediately before the reset. This provides observability into how frequently users reset — useful for understanding whether progression feels too slow or the reset is being used as a testing aid.

## Observability

- `settings.reset_progress` telemetry event on every reset
- `service.version` resource attribute bumped to `0.9.0` — all traces from this version forward are distinguishable

## Verification

- **Verification by**: Tester (2026-02-25)
- **Result**: 34/34 browser checks PASS
- **Test script**: `scripts/test-v0.9.0.mjs` (Playwright)

## Learning Captured

- **Settings panels beat footers**: The version footer had quietly accumulated responsibilities (version, trace link). Promoting it to a proper panel gives each piece of information the right affordance — version is a label, trace link is an action, reset is a destructive action. Mixing these in a footer created a confusing UI.
- **No confirmation for low-stakes resets**: The app stores no account data, no cloud state, no irreplaceable input. A reset is a user-directed restart. Adding a confirmation dialog would add friction without protecting anything of value.
- **Static HTML for static panels**: Following DEC-033, the settings panel lives in `index.html` as static markup. JS only wires behavior. This keeps the HTML inspectable and the JavaScript focused on dynamics.

## Outcome

Arc 10 delivered successfully. All 34 acceptance criteria satisfied.

**What was delivered:**
- Gear icon button replacing the version footer
- Settings panel overlay (version, trace link, reset button)
- Single-tap progress reset with `settings.reset_progress` telemetry
- APP_VERSION bumped to 0.9.0
- `currentTraceUrl` stored at module level for settings panel access

**Version**: 0.9.0

**Next arc candidates:**
- Card Images (DEC-035) — replace/augment mana pips with real Magic card art
- Visual differentiation of allied vs enemy wheel lines (follow-on to DEC-044)
- Shards & Wedges tier (three-color combinations)

---

*Record maintained by the Librarian. See decision-log.md for the full decision history.*
