# C-BIAS inventory 2026-09-01

Snapshot: Hetzner image `426865894` (`cbias-pre-rebuild-20260901`), 40 GB, available.
On-server backup: `/var/backups/cbias-pre-rebuild-20260901-1159` (SHA256 verified).
Off-box config tarball: `~/Documents/backups/cbias-pre-rebuild-20260901/opt-cbias-config.tgz`.
Grafana volume restore probe: `grafana.db` extracted successfully. Volumes were not deleted.

## Observability change set

Pre-change snapshot: Hetzner image `426910538`
(`cbias-observability-prechange-20260901`), materialized successfully.
Pre-change backups:

- C-BIAS: `/var/backups/cbias-20260901-1443` with SHA256 verification.
- CEP OVH: `/opt/cep/backups/observability-prechange-20260901-1444` with SHA256 verification.

Measured baseline: C-BIAS had 18,643 Prometheus series, 323 MB Prometheus data,
36 MB Loki data, 55% root disk usage, and 2.4 GB available memory. CEP OVH had
26% root disk usage, 22 GB RAM, no swap, and 11 GB available memory.

CEP OVH now exposes node-exporter `:9100`, cAdvisor `:8081`, Traefik metrics
`:8082`, and CrowdSec metrics `:6061` only to C-BIAS `46.225.4.189`.
Traefik access logs are JSON at `/var/log/traefik/access.log`.
Promtail ships Docker and UFW logs through the private C-BIAS operations gateway
at `:5000/loki`; no public Loki listener remains.

C-BIAS has 14 Prometheus targets, all UP at verification time. The staging
synthetic endpoint currently returns HTTP 500, so `probe_success=0` remains
visible and alertable instead of being masked.

## Withdrawal decisions

| Component | Evidence | Action |
|-----------|----------|--------|
| Nanobot | Telegram experiment, docker.sock mounted, hkuds/dashboard not running | Stop. Keep volume. |
| DigitalCircuitality | Standalone nginx on `:3001` since 2026-03-18, no compose project | Stop. Frees Kuma port. |
| CheckCle | 12 self-monitors of C-BIAS labs (n8n, Shuffle, Falco, Velociraptor, Nanobot). 3.4 GB sqlite | Stop after Kuma covers HTTP. Keep volume. |
| Shannon | Compose present, zero containers | Leave files. Do not start. |
| n8n | Postgres `workflow_entity` empty, 0 executions, 0 webhooks | Stop. Keep postgres volume. |
| Watchtower | `MONITOR_ONLY=true` plus `:latest` tags | Stop. Pin images instead of auto-update. |
| Shuffle / Falco / Velociraptor / Termix | Declared, not part of monitoring core | Stop if running. Keep files. |

## Keep

Grafana 12.4.0, Prometheus 3.10.0, Loki/Promtail 3.6.5, node-exporter 1.10.2, cAdvisor 0.55.1, CrowdSec 1.7.6, cloudflared 2026.2.0, Uptime Kuma 2.1.1, ServerKit 1.7.0 (profile).
