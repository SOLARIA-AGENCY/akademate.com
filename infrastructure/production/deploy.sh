#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Deploy Akademate a servidor Hetzner de producción
# Servidor: 46.62.222.138 | Tailscale: 100.112.153.111
# SSH Key: ~/.ssh/akademate-prod
# =============================================================================

set -euo pipefail

SERVER="46.62.222.138"
SSH_KEY="$HOME/.ssh/akademate-prod"
SSH_USER="root"
REPO_URL="git@github.com:NAZCAMEDIA/akademate.com.git"  # ajustar si es diferente
REPO_DIR="/opt/akademate/repo"
TRAEFIK_DIR="/opt/akademate/traefik"
WEB_DIR="/opt/akademate/web"

ssh_cmd() {
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$SSH_USER@$SERVER" "$@"
}

rsync_to() {
  local src="$1" dst="$2"
  rsync -avz --delete -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
    "$src" "$SSH_USER@$SERVER:$dst"
}

echo "=== Akademate Deploy ==="
echo "Servidor: $SERVER"
echo ""

# ─── 1. Setup directorios en servidor ───────────────────────────────────────
echo "[1/5] Creando directorios en servidor..."
ssh_cmd "mkdir -p $TRAEFIK_DIR/data $WEB_DIR $REPO_DIR"

# ─── 2. Sincronizar código fuente ────────────────────────────────────────────
echo "[2/5] Sincronizando código fuente..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.turbo' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='*.log' \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
  "$REPO_ROOT/" "$SSH_USER@$SERVER:$REPO_DIR/"

# ─── 3. Desplegar Traefik ────────────────────────────────────────────────────
echo "[3/5] Desplegando Traefik..."
rsync_to "$SCRIPT_DIR/traefik/docker-compose.yml" "$TRAEFIK_DIR/docker-compose.yml"
rsync_to "$SCRIPT_DIR/traefik/traefik.yml" "$TRAEFIK_DIR/traefik.yml"

ssh_cmd "
  # Crear red proxy si no existe
  docker network inspect proxy >/dev/null 2>&1 || docker network create proxy

  # Preparar acme.json
  touch $TRAEFIK_DIR/data/acme.json
  chmod 600 $TRAEFIK_DIR/data/acme.json

  # Levantar Traefik
  cd $TRAEFIK_DIR
  docker compose pull
  docker compose up -d
  echo 'Traefik: OK'
  docker ps | grep traefik
"

# ─── 4. Construir y desplegar Web ────────────────────────────────────────────
echo "[4/5] Construyendo y desplegando Web..."
rsync_to "$SCRIPT_DIR/web/docker-compose.yml" "$WEB_DIR/docker-compose.yml"
if [ ! -f "$SCRIPT_DIR/web/.env" ]; then
  echo "AVISO: No existe infrastructure/production/web/.env — usando .env.example"
  rsync_to "$SCRIPT_DIR/web/.env.example" "$WEB_DIR/.env"
else
  rsync_to "$SCRIPT_DIR/web/.env" "$WEB_DIR/.env"
fi

ssh_cmd "
  cd $WEB_DIR
  # Build (puede tardar 3-5 min)
  docker compose build --no-cache
  docker compose up -d
  echo 'Web: OK'
  docker ps | grep akademate-web
"

# ─── 5. Verificar ────────────────────────────────────────────────────────────
echo "[5/5] Verificando..."
sleep 5
ssh_cmd "
  echo '--- Contenedores activos ---'
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  echo ''
  echo '--- Logs Traefik (últimas 10 líneas) ---'
  docker logs traefik --tail 10
"

echo ""
echo "=== Deploy completado ==="
echo "  Web:     http://$SERVER (→ redirect a https cuando DNS apunte)"
echo "  Traefik: docker logs traefik -f"
echo "  Web:     docker logs akademate-web -f"
