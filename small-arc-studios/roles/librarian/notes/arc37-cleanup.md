# Arc 37: Clean Up Public-Facing Artifacts

## Arc Details
- **Type**: Structural Arc (Cleanup + Version Hygiene)
- **Date**: 2026-03-08
- **Status**: COMPLETE — 49/49 PASS

## Intention
Remove prototype pages and development artifacts that should not ship with a public release. Consolidate the duplicated APP_VERSION constant into a single source of truth. Bump the version to reflect the current state of the project.

## Observable Outcome
The five prototype/demo pages (prototype.html, color-wheel-test.html, mana-gas.html, slot-machine.html, card-back-demo.html) are gone. `service.version = '0.27.0'` appears on all spans in Honeycomb, confirming the version bump propagated across all entry points. All five production pages load correctly.

## What Was Built

### src/version.ts — Single Source of Truth for APP_VERSION
- Extracted `APP_VERSION` into a dedicated module (`src/version.ts`)
- All 5 entry points now import from this module instead of declaring their own constant
- Eliminates the risk of version drift between pages

### Version Bump to 0.27.0
- `package.json` version updated from 0.20.0 to 0.27.0
- `src/version.ts` exports `APP_VERSION = '0.27.0'`
- `service.version` resource attribute on all OTel spans reflects the new version

### Prototype Pages Removed
- `prototype.html` — original rapid-fire prototype
- `color-wheel-test.html` — color wheel development page
- `mana-gas.html` — mana gas particle effect demo
- `slot-machine.html` — slot machine experiment
- `card-back-demo.html` — card back visual demo

### Related Assets Removed
- `card-back.css` — styles for card-back-demo
- `slot-machine.css` — styles for slot-machine
- `src/slot-machine.ts` — slot machine TypeScript source

### Build Script Cleanup
- Removed slot-machine esbuild entry from build and dev scripts

## Team
- **Developer**: Extracted version module, removed prototype files, updated build scripts.
- **Tester**: 49/49 tests passed. Honeycomb verification confirmed `service.version = '0.27.0'` on all spans.

## Acceptance Criteria — All Met

- [x] APP_VERSION extracted to src/version.ts
- [x] All 5 entry points import from src/version.ts
- [x] Version bumped to 0.27.0 in package.json and src/version.ts
- [x] service.version = '0.27.0' confirmed on all spans in Honeycomb
- [x] prototype.html removed
- [x] color-wheel-test.html removed
- [x] mana-gas.html removed
- [x] slot-machine.html removed
- [x] card-back-demo.html removed
- [x] card-back.css, slot-machine.css, src/slot-machine.ts removed
- [x] slot-machine esbuild entry removed from build/dev scripts
- [x] All 5 production pages load correctly
- [x] Build passes

## Key Files
- `src/version.ts` — APP_VERSION single source of truth (new)
- `package.json` — version 0.27.0
- `scripts/build.sh`, `scripts/dev.sh` — slot-machine entry removed
- `tests/arc37-cleanup.mjs` — test script

## Observability
- `service.version = '0.27.0'` as resource attribute on all spans and logs
- Structural marker confirms the cleanup arc was delivered

## Decisions
- DEC-126: APP_VERSION extracted to src/version.ts
- DEC-127: Version bumped to 0.27.0
- DEC-128: Five prototype pages removed
