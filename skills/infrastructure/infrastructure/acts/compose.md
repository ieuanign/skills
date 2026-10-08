# compose — the runtime side of an environment on virtual machines

Each section fills the part an act marks **runtime**. The tool scripts reach `<environment>` as
`ssh <environment>`, the project in the login directory there.

## Hosts

- Virtual machines at the provider, in the infrastructure code, with `docker compose` installed.
- Each answers `ssh <environment>`: the Machine part writes that host alias, with the key path, into the
  machine's SSH configuration. The login user runs `sudo -n` for the rotated-log cleanup `prune.sh` does.

## Data-store marker

The label sits on the Compose service: `labels: { infrastructure.data-store: "true" }`.

## TLS

`tools.proxy` runs as a Compose service, issuing certificates by ACME and routing each hostname.

## Deploy step

Over `ssh` with the key a secret of the GitHub environment holds: the deployed commit's tree — its
Compose files and every build context they name — copied into the login directory, then
`docker compose up --detach --build <services>` there, building each image on the host.

## Monitoring

`tools.monitoring` as Compose services beside the application. Production's stack runs on a small host
of its own.

## Backups

- The nightly dump: a Compose service the host's scheduler runs, writing to the backup bucket.
- The restore-test unit: Compose service `<store>-restore-test` under profile `restore-test`, run with
  `docker compose --profile restore-test run --rm --no-deps`.

## Host patching

- The operating system's unattended security updates, switched on in each host's provisioning.
- Pending-reboot check: `ssh <environment>` reading the operating system's reboot-required marker.

## Preview unit

Compose project `pr-<n>` on staging's hosts, behind staging's `tools.proxy`.

## Prune

`prune.sh` frees unused images, build cache and rotated logs on the host.
