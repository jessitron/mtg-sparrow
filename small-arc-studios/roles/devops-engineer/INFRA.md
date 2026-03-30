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

The README there must list helm releases and k8s deployments that are installed,
along with useful commands for troubleshooting, and how to update the installation.
