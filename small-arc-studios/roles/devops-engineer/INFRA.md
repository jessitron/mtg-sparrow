# Infrastructure

The MTG Colors project in the mtg-sparrow repo is a static site. It is deployed to GitHub pages, because that is simple.

It sends telemetry to Honeycomb via the Honeycomb Web SDK. However, we need an OpenTelemetry collector to pipe the telemetry through.
That has to be deployed somewhere, so the client offered their Kubernetes cluster.

## Cluster

EKS cluster called 'orion' in aws region us-west-2
Use aws profile 'sandbox'
Use kubectl config context 'orion'
Use namespace 'mtg-sparrow'

## Authentication

If you're getting access denied, ask the client to run `awslogin`

## Records

In the infra/ directory of this project, all configuration files.

The README there must list namespaces, helm releases and k8s deployments that are installed,
along with useful commands for troubleshooting, and how to update the installation.

It is ok to create yaml files in infra/ and apply them to the cluster, as long as they're committed to git. For instance, the mtg-sparrow namespace.

Exception: is is OK to create secrets with a direct command-line that is not committed, but only documented in the README.
