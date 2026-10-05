# C-BIAS monitoring core

Migratable Compose bundle for the C-BIAS control plane. Panels bind to Tailscale.
SSH, UFW and Tailscale stay on the host.

## Stack

Grafana, Prometheus, Loki, Promtail, node-exporter, cAdvisor, CrowdSec, cloudflared, Uptime Kuma.
ServerKit is a Compose profile: `docker compose --profile serverkit up -d`.

## Deploy

```bash
cp .env.example .env
# fill secrets on the server only
docker compose up -d
docker compose --profile serverkit up -d
```

Default bind: `TS_BIND=100.113.169.104`.
Uptime Kuma uses `:3001` after DigitalCircuitality is stopped.

## Backup

```bash
./scripts/backup.sh
./scripts/restore-test.sh
```

Rollback: restore Hetzner snapshot `cbias-pre-rebuild-20260901` (image 426865894)
or extract `/var/backups/cbias-pre-rebuild-20260901-1159`.

## CEP

Application errors go to GlitchTip on the CEP OVH host.
Uptime Kuma on C-BIAS is the external detector if that OVH host is down.

Bootstrap monitors (Tailscale only):

```bash
./scripts/kuma-bootstrap.sh
./scripts/validate-migration.sh
```

ServerKit: UI on Tailscale `http://100.113.169.104:5000`. CEP agent uses
`http://46.225.4.189:5000` (Hetzner firewall + UFW, source 37.59.119.219 only).
Exec on the CEP agent stays disabled. One host agent covers staging and production
containers on that OVH.

## OVH observability

The CEP OVH host runs node-exporter, cAdvisor, Promtail, and CrowdSec from
`infrastructure/cep/observability/`. Traefik runs with INFO logs, JSON access
logs, Prometheus metrics, and a bounded Docker log driver. C-BIAS scrapes the
exporters directly from `37.59.119.219`.

Loki is host-local on C-BIAS. The operations gateway keeps ServerKit on
`127.0.0.1:5002` and exposes its existing restricted `:5000` channel for
ServerKit, Socket.IO, and `/loki` log ingestion. The gateway is allowlisted
only for the CEP OVH source address by UFW and the Docker forwarding policy.

The `CEP OVH overview` dashboard covers host CPU, memory, disk, network,
Traefik request codes, container memory, and endpoint latency. Grafana alert
rules remain visible in the dashboard. External Telegram and email routes were
removed from the active notification policy. The remaining sink is local-only.

Cloudflare Worker `cepformacion.com` is probed by the separate Prometheus job
`cf-blackbox-http` and by Uptime Kuma. Do not scrape the Worker runtime. Do not
open Loki `:5000` to Cloudflare IPs. Worker logs go to Cloudflare Logpush or R2
when that pipeline is enabled. Analytics Engine dataset `cep_public_health` is
the technical analytics source for the Worker. Umami stays on OVH and is optional.

The private launcher is available at
`http://100.113.169.104:8088/` from Tailscale. It opens Grafana, Kuma,
ServerKit, Sentry, GlitchTip, and Prometheus in new tabs.

## Rollback

1. Hetzner snapshot image `426865894` (`cbias-pre-rebuild-20260901`).
2. Config+volume tarball `/var/backups/cbias-pre-rebuild-20260901-1159`.
3. Retired volumes were not deleted. Do not `docker volume rm` until a later restore test of the new stack is accepted.
4. CEP production Sentry DSN stays on `cepformacion-sentry.akademate.com` until a staging GlitchTip event is confirmed.
