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

---

## Session: Health Check Extension + Ingress (2026-03-30)

### What Was Done

1. Added `health_check` extension to collector config (endpoint `0.0.0.0:13133`).
2. Exposed port 13133 on the helm service.
3. Committed and applied via `helm upgrade` (revision 3). Verified pod healthy.
4. Created `infra/otel-collector-ingress.yaml` — ALB ingress for public access.
5. Committed and applied via `kubectl apply`. Verified it joined the existing ALB.

### Ingress Details

- **Hostname**: `mtg-sparrow.jessitron.honeydemo.io`
- **Backend**: `otel-collector-opentelemetry-collector:4318` (OTLP HTTP)
- **ALB group**: `only-one-alb-please` — shares the cluster's single ALB with 6 other ingresses
- **ALB hostname**: `k8s-onlyonealbplease-5cf2ceb8df-527308216.us-west-2.elb.amazonaws.com`
- **Health check**: Port 13133 (collector health_check extension), path `/`
- **TLS**: ACM wildcard cert auto-discovered (no certificate-arn needed)
- **DNS**: Auto-registered by external-dns via annotation

### ALB Sharing — Critical Notes

The cluster has ONE shared ALB. All ingresses MUST include these annotations to share it:

```yaml
alb.ingress.kubernetes.io/group.name: only-one-alb-please
alb.ingress.kubernetes.io/scheme: internet-facing
alb.ingress.kubernetes.io/target-type: ip
alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443},{"HTTP":80}]'
alb.ingress.kubernetes.io/ssl-redirect: "443"
```

**WARNING**: Omitting or changing `group.name` will spin up a NEW ALB. Do not do this.

The `load-balancer-attributes` annotation (S3 access logging) is present on most existing ingresses.

### Other Ingresses in the Cluster (for reference)

All in `default` namespace:
- `collectron-ingress` → `collector.jessitron.honeydemo.io` (another OTel collector on 4318)
- `fake-saml-idp-ingress` → `instruqt.jessitron.honeydemo.io`
- `jaeger-all-in-one-query` → `jaeger.jessitron.honeydemo.io`
- `mtg-deck-shuffler-ingress` → `mtg.jessitron.honeydemo.io`
- `nginx-for-hny-tricks-ingress` → `util.jessitron.honeydemo.io`
- `rollback-webhook` → `rollback.jessitron.honeydemo.io`

---

## Session: Config Lockdown — Null Out Chart Defaults (2026-03-30)

### Problem

The helm chart merges its own default config with the values we provide. This meant
the deployed collector was running components we don't need: jaeger receiver, zipkin
receiver, prometheus receiver, gRPC OTLP receiver, debug exporter, and a metrics pipeline.

### What Was Nulled Out

In `infra/otel-collector-values.yaml`, set these to `null` to prevent the chart from
adding them:

| Component | Chart Default | Action | Why |
|---|---|---|---|
| `receivers.jaeger` | Jaeger gRPC/thrift/compact | `null` | Not needed — only OTLP from browser |
| `receivers.zipkin` | Zipkin on 9411 | `null` | Not needed |
| `receivers.prometheus` | Self-scrape on 8888 | `null` | Not needed |
| `receivers.otlp.protocols.grpc` | gRPC on 4317 | `null` | Browser sends HTTP only |
| `exporters.debug` | Debug/stdout exporter | `null` | Clutters logs, not needed |
| `connectors` | (none by default but prevent future) | `null` | Not needed |
| `service.pipelines.metrics` | Metrics pipeline (debug exporter) | `null` | No metrics to export |

### What Was Kept

| Component | Config |
|---|---|
| `receivers.otlp.protocols.http` | Port 4318, CORS for mtgcolors.quest + localhost |
| `exporters.otlp_http/honeycomb` | OTLP HTTP to api.honeycomb.io |
| `extensions.health_check` | Port 13133 |
| `service.pipelines.traces` | otlp -> memory_limiter, batch -> otlp_http/honeycomb |
| `service.pipelines.logs` | otlp -> memory_limiter, batch -> otlp_http/honeycomb |

### Ports After Lockdown

| Port | Service | Purpose |
|---|---|---|
| 4318 | OTLP HTTP | Telemetry ingress (traces + logs) |
| 13133 | Health check | ALB health checks + k8s probes |
| ~~4317~~ | ~~gRPC~~ | Disabled |
| ~~14250, 6831, 14268~~ | ~~Jaeger~~ | Disabled |
| ~~9411~~ | ~~Zipkin~~ | Disabled |
| ~~8888~~ | ~~Prometheus metrics~~ | Still in service.telemetry (chart internal), but not exposed |

### Verification

- `helm template` confirmed rendered config contains only desired components
- Pod came up 1/1 Running, logs show only HTTP server starting (no gRPC)
- Test trace via `curl POST https://mtg-sparrow.jessitron.honeydemo.io/v1/traces` returned HTTP 200
- Helm revision: 4

### Technique Note

The helm chart docs mention a `alternateConfig` field that bypasses merging entirely.
We chose the `null` approach instead because:
- `alternateConfig` has NO defaults at all, so we'd lose the chart's k8s telemetry resource attributes
- `null` is more surgical: we keep what works and remove only what we don't want
- Easier to see intent — each null is documented

If the chart is used as a subchart, `null` may not work due to a helm bug (see chart docs). In that case, switch to `alternateConfig`.

### Open Questions / Next Steps

- If traffic grows, bump replicas and resource limits.
