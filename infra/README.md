# MTG Sparrow — Infrastructure

Kubernetes infrastructure for the MTG Colors project (mtgcolors.quest).
Static site deployed to GitHub Pages; OTel collector runs on EKS for telemetry.

## Cluster

| Setting | Value |
|---------|-------|
| Cluster | `orion` |
| Region | `us-west-2` |
| AWS Profile | `sandbox` |
| kubectl context | `orion` |

## Namespaces

| Namespace | Purpose |
|-----------|---------|
| `mtg-sparrow` | All MTG Sparrow project resources |

## Helm Releases

| Release | Chart | Namespace | Values File |
|---------|-------|-----------|-------------|
| `otel-collector` | `open-telemetry/opentelemetry-collector` | `mtg-sparrow` | `infra/otel-collector-values.yaml` |

## Kubernetes Deployments

| Name | Namespace | Replicas | Purpose |
|------|-----------|----------|---------|
| `otel-collector` | `mtg-sparrow` | 1 | Receives OTLP, forwards to Honeycomb |

## Secrets

Secrets are created via CLI and NOT committed to git.

| Secret Name | Namespace | Keys | How to Create |
|-------------|-----------|------|---------------|
| `honeycomb-api-key` | `mtg-sparrow` | `api-key` | See below |

### Creating the Honeycomb API Key Secret

```bash
kubectl --context orion -n mtg-sparrow create secret generic honeycomb-api-key \
  --from-literal=api-key=<YOUR_HONEYCOMB_API_KEY>
```

The API key is an ingest key from the Honeycomb `modernity` workspace, `sparrow-deck` environment.

## Ingresses

| Ingress Name | Namespace | Hostname | Backend | Manifest |
|---|---|---|---|---|
| `otel-collector-ingress` | `mtg-sparrow` | `mtg-sparrow.jessitron.honeydemo.io` | `otel-collector-opentelemetry-collector:4318` | `infra/otel-collector-ingress.yaml` |

The ingress shares the cluster's single ALB via `alb.ingress.kubernetes.io/group.name: only-one-alb-please`.
ALB health checks target the collector's `health_check` extension on port 13133.
DNS is auto-managed by external-dns.

## OTel Collector Endpoints

### From within the cluster

- gRPC: `otel-collector-opentelemetry-collector.mtg-sparrow.svc.cluster.local:4317`
- HTTP: `otel-collector-opentelemetry-collector.mtg-sparrow.svc.cluster.local:4318`
- Health check: `otel-collector-opentelemetry-collector.mtg-sparrow.svc.cluster.local:13133`

### From the public internet (via ALB ingress)

- OTLP HTTP: `https://mtg-sparrow.jessitron.honeydemo.io`
- Example: `POST https://mtg-sparrow.jessitron.honeydemo.io/v1/traces`

The collector accepts OTLP from `https://mtgcolors.quest` and `http://localhost:*` (CORS configured).

## Useful Commands

### Check namespace

```bash
kubectl --context orion get namespace mtg-sparrow
```

### Check collector pod status

```bash
kubectl --context orion -n mtg-sparrow get pods
kubectl --context orion -n mtg-sparrow describe pod -l app.kubernetes.io/name=opentelemetry-collector
```

### View collector logs

```bash
kubectl --context orion -n mtg-sparrow logs -l app.kubernetes.io/name=opentelemetry-collector --tail=100
```

### Check collector service

```bash
kubectl --context orion -n mtg-sparrow get svc
```

### List helm releases

```bash
helm --kube-context orion -n mtg-sparrow list
```

### Check ingress status

```bash
kubectl --context orion -n mtg-sparrow get ingress
```

Verify the ADDRESS column shows the existing ALB hostname (`k8s-onlyonealbplease-*.elb.amazonaws.com`).
If it shows a different hostname or is empty for a long time, something went wrong.

## How to Update

### Update collector configuration

1. Edit `infra/otel-collector-values.yaml`
2. Commit the change
3. Apply with helm upgrade:

```bash
helm --kube-context orion upgrade otel-collector open-telemetry/opentelemetry-collector \
  -n mtg-sparrow \
  -f infra/otel-collector-values.yaml
```

### Update collector chart version

```bash
helm repo update open-telemetry
# Review changes, then:
helm --kube-context orion upgrade otel-collector open-telemetry/opentelemetry-collector \
  -n mtg-sparrow \
  -f infra/otel-collector-values.yaml
```

### Update ingress

1. Edit `infra/otel-collector-ingress.yaml`
2. Commit the change
3. Apply:

```bash
kubectl --context orion apply -f infra/otel-collector-ingress.yaml
```

WARNING: Do NOT change `alb.ingress.kubernetes.io/group.name` — it must remain `only-one-alb-please` to share the existing ALB. Changing or removing it will create a new ALB.

### Apply namespace manifest

```bash
kubectl --context orion apply -f infra/namespace.yaml
```

## Initial Install Procedure

```bash
# 1. Create namespace
kubectl --context orion apply -f infra/namespace.yaml

# 2. Create secret (not committed)
kubectl --context orion -n mtg-sparrow create secret generic honeycomb-api-key \
  --from-literal=api-key=<KEY>

# 3. Install collector
helm --kube-context orion install otel-collector open-telemetry/opentelemetry-collector \
  -n mtg-sparrow \
  -f infra/otel-collector-values.yaml

# 4. Create ingress (shares existing ALB)
kubectl --context orion apply -f infra/otel-collector-ingress.yaml
```
