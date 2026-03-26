# Scripts

Shell scripts and utilities for the MTG Sparrow project. Most have corresponding `npm run` entries in package.json.

## Build & Dev

| Script | npm command | Description |
|--------|------------|-------------|
| `build.sh` | `npm run build` | Production build via esbuild |
| `dev.sh` | `npm run dev` | Watch mode for development |
| `typecheck.sh` | `npm run typecheck` | Run TypeScript type checking |

## Serve

| Script | npm command | Description |
|--------|------------|-------------|
| `serve.sh` | `npm run serve` | Start a local dev server |
| `serve-background.sh` | — | Start dev server in background (for CI/testing) |
| `stop-server.sh` | — | Stop background dev server |
| `open-in-browser.sh` | — | Open the local site in a browser |

## Testing

| Script | npm command | Description |
|--------|------------|-------------|
| `test-sequence.sh` | `npm run test:sequence` | Run sequence property tests |

## Data & Analysis

| Script | npm command | Description |
|--------|------------|-------------|
| `summarize-combos.sh` | `npm run summarize:combos` | Print summary of card data per color combo |
| `summarize-combos.ts` | — | Source for the combo summary (bundled by the .sh) |

## Ops

| Script | npm command | Description |
|--------|------------|-------------|
| `deploy-marker.sh` | — | Send a deploy marker to Honeycomb |
| `check-debug-span.mjs` | — | Verify debug spans in telemetry |
