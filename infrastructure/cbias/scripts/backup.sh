#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +%Y%m%d-%H%M)
DEST=/var/backups/cbias-${STAMP}
mkdir -p "$DEST/volumes"
cd /opt/cbias
tar -czf "$DEST/opt-cbias-config.tgz" --exclude='shannon/xben-benchmark-results' .
for v in cbias_grafana_data cbias_prometheus_data cbias_loki_data cbias_uptime_data cbias_crowdsec_data serverkit_data cbias_serverkit_data; do
  docker volume inspect "$v" >/dev/null 2>&1 || continue
  docker run --rm -v "$v":/src:ro -v "$DEST/volumes":/out alpine:3.20 tar -czf "/out/${v}.tgz" -C /src .
done
sha256sum "$DEST/opt-cbias-config.tgz" "$DEST/volumes"/*.tgz > "$DEST/SHA256SUMS"
sha256sum -c "$DEST/SHA256SUMS"
echo "BACKUP_OK $DEST"
