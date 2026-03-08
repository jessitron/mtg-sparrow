# Arc 39: Deploy Markers

## Arc Details
- **Type**: Infrastructure Arc (Observability)
- **Date**: 2026-03-08
- **Status**: COMPLETE — Structural verification only

## Intention
Add deploy markers to Honeycomb so operators can correlate telemetry changes with deployments. This is the final arc in the Publish Readiness plan.

## Observable Outcome
After each successful GitHub Pages deploy, a marker appears on every Honeycomb query timeline (posted to `__all__` datasets). The marker includes the short commit SHA, a "deploy" type label, and a link to the commit on GitHub. A local script is also available for manual marker creation.

## What Was Built

### GitHub Actions Workflow Step
- Post-deploy step added to `.github/workflows/deploy.yml`
- Sends a marker to the Honeycomb Markers API after successful deploy
- Marker includes: short commit SHA in message, `deploy` type, link to commit on GitHub
- Posts to `__all__` datasets — marker appears on every query timeline without per-dataset configuration
- Requires `HONEYCOMB_API_KEY` secret in GitHub repo settings (client action needed)

### Local Deploy Marker Script
- `scripts/deploy-marker.sh` — manual marker creation for local use
- Derives SHA and repo URL from git
- Requires `HONEYCOMB_API_KEY` environment variable

## Verification
Structural verification only — workflow YAML is valid, script is executable, curl command targets correct Honeycomb API endpoint. Full end-to-end verification requires a real deploy with the `HONEYCOMB_API_KEY` secret configured in GitHub repo settings.

## Team
- **Developer**: Implemented GitHub Actions workflow step and local script.
- **Tester**: Structural verification of YAML validity, script executability, and API endpoint correctness.

## Acceptance Criteria — All Met (structurally)

- [x] GitHub Actions workflow sends marker to Honeycomb after successful deploy
- [x] Marker includes commit SHA, type, and link
- [x] Posts to `__all__` datasets
- [x] Local script available for manual marker creation
- [x] Structural verification confirms valid YAML and correct API endpoint

## Key Files
- `.github/workflows/deploy.yml` — deploy workflow with marker step
- `scripts/deploy-marker.sh` — local marker script

## Observability
- Deploy markers appear on all Honeycomb query timelines via `__all__` dataset targeting
- Commit SHA links enable direct tracing from marker to code change

## Decisions
- DEC-131: Deploy markers via Honeycomb Markers API to `__all__` datasets
- DEC-132: Marker sent as post-deploy step in GitHub Actions
- DEC-133: Local deploy-marker.sh script for manual use
