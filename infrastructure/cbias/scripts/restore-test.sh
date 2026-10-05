#!/usr/bin/env bash
set -euo pipefail
SRC=${1:-/var/backups/cbias-pre-rebuild-20260901-1159/volumes-meta/cbias_grafana_data.tgz}
test -f "$SRC"
VOL=restore-test-grafana
docker volume create "$VOL" >/dev/null
docker run --rm -v "$VOL":/dst -v "$(dirname "$SRC")":/src alpine:3.20 tar -xzf "/src/$(basename "$SRC")" -C /dst
docker run --rm -v "$VOL":/dst alpine:3.20 test -f /dst/grafana.db
docker volume rm "$VOL" >/dev/null
echo RESTORE_TEST_OK
