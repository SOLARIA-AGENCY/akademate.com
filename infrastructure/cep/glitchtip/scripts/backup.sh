#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date -u +%Y%m%d-%H%M)
DEST=${1:-/opt/cep/glitchtip/backups/cep-glitchtip-$STAMP}
mkdir -p "$DEST"
cd /opt/cep/glitchtip
tar -czf "$DEST/glitchtip-config.tgz" docker-compose.yml .env.example
docker exec cep-glitchtip-postgres pg_dump -U glitchtip glitchtip | gzip > "$DEST/glitchtip.sql.gz"
sha256sum "$DEST"/* > "$DEST/SHA256SUMS"
sha256sum -c "$DEST/SHA256SUMS"
echo "GLITCHTIP_BACKUP_OK $DEST"
