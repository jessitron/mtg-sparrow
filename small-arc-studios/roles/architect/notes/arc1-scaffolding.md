# Arc 1: Project Scaffolding — Architecture Notes

> Date: 2026-02-15
> Status: Completed

## Decisions Made

### Build pipeline
- **esbuild** as bundler, invoked via npm scripts (no config file needed)
- `npm run build`: production with `--minify --sourcemap --format=esm`
- `npm run dev`: watch mode with `--sourcemap --format=esm`
- Entry point: `src/main.ts` → Output: `dist/bundle.js`

### TypeScript config
- Strict mode enabled
- Target: ES2020, Module: ES2020
- Module resolution: `bundler` (works well with esbuild)
- Libs: DOM + ES2020
- `skipLibCheck: true` for faster compilation

### Bundle format
- ESM (`--format=esm`) — matches `<script type="module">` in index.html
- This means the bundle uses `import`/`export` syntax and runs as a module in the browser

### Bundle size observation
- Production bundle: **147.3KB** (with Honeycomb SDK + OpenTelemetry)
- This is larger than the ~50KB estimate in architecture-options.md
- The Honeycomb SDK pulls in more than raw OpenTelemetry
- Not a concern per client (bundle size deprioritized, see arc2-breakdown.md)

### Project structure
```
index.html          # App shell with version footer
style.css           # Base styles (dark theme, centered layout)
package.json        # Dependencies and build scripts
tsconfig.json       # TypeScript configuration
src/
  main.ts           # Entry point (developer created)
  telemetry/
    telemetry.ts    # Telemetry wrapper (developer created)
    init.ts         # Telemetry initialization (developer created)
dist/
  bundle.js         # Built output (gitignored)
  bundle.js.map     # Source map (gitignored)
```

### Coordination with Developer
- Developer completed tasks #3 (main.ts) and #4 (telemetry wrapper) in parallel
- main.ts references `id="app-version"` in the DOM — index.html footer uses this id
- Telemetry module wraps Honeycomb SDK; app code imports only from `src/telemetry/`

## For Next Architect

- The build pipeline is proven and working
- Bundle size is ~147KB — monitor but don't optimize unless it becomes a problem
- The `dev` script lacks a built-in server; may want to add `npx serve .` or similar for local development
- All telemetry goes through the wrapper in `src/telemetry/` — maintain this boundary
