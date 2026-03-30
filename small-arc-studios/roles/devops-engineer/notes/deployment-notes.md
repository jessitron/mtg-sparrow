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

### Open Questions / Next Steps

- Consider adding a metrics pipeline if the collector self-telemetry is needed.
- If traffic grows, bump replicas and resource limits.
