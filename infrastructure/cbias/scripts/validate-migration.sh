#!/usr/bin/env bash
set -euo pipefail
echo "=== C-BIAS core ==="
docker compose -f /opt/cbias/docker-compose.yml --profile serverkit ps --format "table {{.Name}}\t{{.Status}}"
echo "=== prometheus targets ==="
curl -sS -m 5 "http://${TS_BIND:-100.113.169.104}:9090/api/v1/targets" | python3 -c "import json,sys; d=json.load(sys.stdin); t=d['data']['activeTargets']; print('targets', len(t), 'up', sum(1 for x in t if x['health']=='up'))"
echo "=== grafana ==="
curl -sS -m 5 -o /dev/null -w "grafana:%{http_code}\n" "http://${TS_BIND:-100.113.169.104}:3000/api/health"
echo "=== kuma ==="
curl -sS -m 5 -o /dev/null -w "kuma:%{http_code}\n" "http://${TS_BIND:-100.113.169.104}:3001"
echo "=== serverkit ==="
curl -sS -m 5 "http://127.0.0.1:5000/api/v1/system/health"
echo
echo "=== resources ==="
free -h | head -2
df -h / | tail -1
echo "VALIDATE_CORE_OK"
