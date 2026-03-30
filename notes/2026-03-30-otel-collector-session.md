# Session Notes: OTel Collector Deployment (2026-03-30)

## What was accomplished

1. **Created DevOps Engineer role** for Small Arc Studio — owns infrastructure and helm deployments
2. **Deployed OTel Collector** on EKS cluster 'orion' in namespace 'mtg-sparrow'
   - Helm chart: open-telemetry/opentelemetry-collector (v0.147.1)
   - Mode: deployment (1 replica)
   - Receives OTLP HTTP only (port 4318), exports to Honeycomb
   - Health check extension on port 13133
3. **Created Ingress** sharing the existing ALB (`group.name: only-one-alb-please`)
   - Endpoint: `https://mtg-sparrow.jessitron.honeydemo.io`
   - Health check targets port 13133
4. **Locked down collector config** — explicitly nulled all helm chart defaults (jaeger, zipkin, prometheus, gRPC, debug exporter, metrics pipeline)
5. **Added session heartbeat** — direct-to-Honeycomb event via Events API (bypasses collector) for monitoring collector health
   - Fires once per new session, fire-and-forget
   - Uses X-Honeycomb-Team header, includes UTM params
   - `event.type: session.heartbeat`, `event.source: direct`
6. **Switched SDK to collector** — both init.ts and combo-telemetry.ts now use `endpoint` instead of `apiKey`
7. **Added provenance processor** — `resource/provenance` stamps `collector.name` and `collector.cluster` on every span and log

## Key infrastructure details

- ALB group name: `only-one-alb-please` (all ingresses in cluster share this)
- No certificate-arn needed — ACM auto-discovers wildcard cert for `*.jessitron.honeydemo.io`
- External-dns handles DNS registration automatically
- Collector Honeycomb API key stored as k8s secret `honeycomb-api-key` (separate from the browser SDK's hard-coded ingest key)

## Collector config is now at helm revision 5

## Files of note

- `infra/otel-collector-values.yaml` — collector config (OE owns config, DevOps deploys)
- `infra/otel-collector-ingress.yaml` — ingress manifest
- `infra/namespace.yaml` — namespace manifest
- `infra/README.md` — operational runbook
- `tests/arc72-session-heartbeat.mjs` — heartbeat test
- `tests/verify-collector-routing.mjs` — collector routing test
