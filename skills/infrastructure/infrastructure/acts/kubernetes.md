# kubernetes — the runtime side of an environment on a cluster

Each section fills the part an act marks **runtime**. The tool scripts reach `<environment>` as
`kubectl` context `<environment>`, namespace `<environment>`.

## Cluster

- A `KUBECONFIG` context `<environment>` that already reaches a cluster outside the infrastructure
  code: that cluster is adopted, and the infrastructure code provisions none.
- Otherwise, in the infrastructure code: the provider's managed cluster where it has one, else k3s on
  virtual machines.
- The Machine part writes context `<environment>` into the machine's `KUBECONFIG`.

## Data-store marker

The label sits on the workload's `metadata.labels`: the Deployment or StatefulSet that runs the store.

## TLS

`tools.ingress` routes each hostname, and `tools.certificates` issues its certificate by ACME.

## Deploy step

Each service's Helm chart lives in the repository, written where none exists. Per deployed service, with
the kubeconfig a secret of the GitHub environment holds: its image built from the deployed commit and
pushed to GitHub's container registry, tagged with the commit; then `helm upgrade --install <service>
<chart> --kube-context <environment> --namespace <environment>` with that tag set. The infrastructure
code puts the registry's pull secret in namespace `<environment>`. The pipeline is the only deployer:
the cluster runs no GitOps controller.

## Monitoring

`tools.monitoring` as Helm charts beside the application. Production's stack runs on a node pool or
cluster of its own.

## Backups

- The nightly dump: a CronJob writing to the backup bucket.
- The restore-test unit: CronJob `<store>-restore-test` with `suspend: true`, run on demand.

## Host patching

- Virtual-machine nodes: the operating system's unattended security updates, switched on in their
  provisioning. A managed cluster: the provider's automatic node patching.
- Pending-reboot check: each virtual-machine node's reboot-required marker, read over `ssh`; a managed
  cluster reports none.

## Preview unit

Namespace `pr-<n>` on staging's cluster, routed by staging's `tools.ingress`.
