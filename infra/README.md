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

## OTel Collector Endpoints

Within the cluster, the collector is reachable at:

- gRPC: `otel-collector.mtg-sparrow.svc.cluster.local:4317`
- HTTP: `otel-collector.mtg-sparrow.svc.cluster.local:4318`

The collector accepts OTLP from `https://mtgcolors.quest` (CORS configured).

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
```
