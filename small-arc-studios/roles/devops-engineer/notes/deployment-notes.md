# DevOps Engineer — Deployment Notes

## Session: OTel Collector Initial Deployment (2026-03-30)

### Cluster Access

- Cluster: orion (EKS, us-west-2)
- AWS Profile: sandbox
- kubectl context: orion
- Namespace: mtg-sparrow (did not exist before this session — created via infra/namespace.yaml)

### What Was Done

1. Created `infra/` directory from scratch (did not exist).
2. Authored `infra/namespace.yaml` — declarative namespace manifest.
3. Authored `infra/otel-collector-values.yaml` — helm values for the OTel collector.
4. Authored `infra/README.md` — documents namespaces, helm releases, deployments, secrets, commands, update procedure.
5. Committed all three files before applying to cluster.
6. Applied the namespace: `kubectl --context orion apply -f infra/namespace.yaml`
7. Created the Honeycomb API key secret via kubectl (not committed).
8. Installed the collector via helm.

### Helm Chart

- Repo: `open-telemetry` → `https://open-telemetry.github.io/opentelemetry-helm-charts`
- Chart: `open-telemetry/opentelemetry-collector`
- Version installed: 0.147.1 (appVersion: 0.147.0)
- Release name: `otel-collector`
- Namespace: `mtg-sparrow`

### Collector Configuration Decisions

- **Mode: deployment** (not daemonset) — we don't need node-level scraping, just a central receiver for OTLP from the web app.
- **Image: otel/opentelemetry-collector-contrib** — contrib build supports more exporters including otlphttp.
- **Pipelines: traces + logs** — mtgcolors.quest emits both. No metrics pipeline needed yet.
- **CORS**: Allowed origin `https://mtgcolors.quest` plus `http://localhost:*` for dev.
- **Exporter**: `otlp_http/honeycomb` → `https://api.honeycomb.io` with `x-honeycomb-team` header from secret. (Note: `otlphttp` alias is deprecated in collector 0.147; use `otlp_http` — corrected in values file post-first-install.)
- **Resources**: Conservative (50m/128Mi request, 200m/256Mi limit) — low-traffic static site.

### Secrets

- Secret `honeycomb-api-key` in `mtg-sparrow` namespace.
- Key: `api-key`
- Value: Honeycomb ingest key for the `modernity` workspace, `sparrow-deck` environment.
- Created via kubectl CLI — NOT in git.

### Verification

After install, verify with:
```bash
kubectl --context orion -n mtg-sparrow get pods
kubectl --context orion -n mtg-sparrow logs -l app.kubernetes.io/name=opentelemetry-collector --tail=50
```

Look for: collector starting up, pipelines initialized, no exporter errors.

### Open Questions / Next Steps

- The collector service is ClusterIP only. If the web browser (client-side JS) needs to send OTLP directly, we need an Ingress or LoadBalancer. Current assumption: a backend proxy or the site SDK sends to this collector — confirm with Observability Engineer.
- Consider adding a metrics pipeline if the collector self-telemetry is needed.
- If traffic grows, bump replicas and resource limits.
