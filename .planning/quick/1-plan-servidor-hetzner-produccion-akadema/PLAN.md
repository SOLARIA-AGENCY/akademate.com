---
phase: quick-hetzner-prod
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - infrastructure/docker/docker-compose.traefik.yml
  - infrastructure/docker/docker-compose.shared.yml
  - infrastructure/docker/docker-compose.cep.yml
  - infrastructure/docker/docker-compose.monitoring.yml
  - infrastructure/docker/init-scripts/01-init-shared.sql
  - infrastructure/docker/init-scripts/02-init-enterprise.sql
  - infrastructure/docker/traefik/traefik.yml
  - infrastructure/docker/traefik/dynamic.yml
  - infrastructure/scripts/deploy-prod.sh
  - infrastructure/scripts/setup-server.sh
  - infrastructure/docker/DEPLOY.md
autonomous: true
requirements: [PROD-01, PROD-02, PROD-03, PROD-04, PROD-05]

must_haves:
  truths:
    - "akademate.com sirve la página Coming Soon con SSL válido (Let's Encrypt via Traefik)"
    - "tenant-admin accede a akademate_shared con autenticación Payload real (sin dev bypass)"
    - "tenant-cep accede a akademate_enterprise aislado (red Docker separada)"
    - "admin-client gestiona el SaaS desde ops.akademate.com"
    - "Grafana muestra métricas de ambas DBs y del servidor"
    - "Traefik gestiona SSL automático con ACME (Let's Encrypt) — SIN Coolify"
    - "Todo el stack se levanta con 'docker compose up -d' desde el servidor"
    - "No existe dependencia de NEMESIS ni de Coolify para operar en producción"
  artifacts:
    - path: "infrastructure/docker/docker-compose.traefik.yml"
      provides: "Traefik reverse proxy + ACME SSL + dashboard protegido"
    - path: "infrastructure/docker/docker-compose.shared.yml"
      provides: "Stack compartido: postgres-shared + redis + tenant-admin + web + admin-client"
    - path: "infrastructure/docker/docker-compose.cep.yml"
      provides: "Stack CEP: postgres-enterprise + tenant-cep (red aislada)"
    - path: "infrastructure/docker/docker-compose.monitoring.yml"
      provides: "Grafana + Prometheus + node-exporter + postgres-exporter (x2)"
    - path: "infrastructure/docker/init-scripts/01-init-shared.sql"
      provides: "Esquema inicial akademate_shared con extensiones UUID"
    - path: "infrastructure/docker/init-scripts/02-init-enterprise.sql"
      provides: "Esquema inicial akademate_enterprise aislado"
    - path: "infrastructure/docker/traefik/traefik.yml"
      provides: "Config estática Traefik: entrypoints HTTP/HTTPS, ACME, dashboard"
    - path: "infrastructure/docker/traefik/dynamic.yml"
      provides: "Config dinámica: middlewares (redirect HTTP→HTTPS, basicauth)"
    - path: "infrastructure/scripts/deploy-prod.sh"
      provides: "Script deploy [traefik|shared|cep|monitoring|all]"
    - path: "infrastructure/scripts/setup-server.sh"
      provides: "Script instalación inicial del servidor (Docker, firewall, directorios)"
    - path: "infrastructure/docker/DEPLOY.md"
      provides: "Guía completa de despliegue desde cero"
  key_links:
    - from: "tenant-cep"
      to: "postgres-enterprise"
      via: "DATABASE_URL en red akademate-cep (aislada)"
    - from: "Grafana"
      to: "postgres-shared + postgres-enterprise"
      via: "postgres_exporter en red traefik-public (solo métricas)"
    - from: "Traefik"
      to: "todos los servicios"
      via: "Labels Docker en red traefik-public, ACME con Let's Encrypt"
    - from: "deploy-prod.sh"
      to: "todos los compose files"
      via: "docker compose --project-name up -d"
---

<objective>
Desplegar Akademate en un servidor Hetzner de producción completamente autocontenido.

Arquitectura: Docker Compose puro + Traefik nativo con ACME. Sin Coolify. Sin dependencias externas.
Cualquier servidor con Docker instalado puede levantar el stack con `git clone + ./deploy-prod.sh all`.

Output:
- 1 servidor Hetzner configurado (solo Docker + firewall)
- Traefik como único reverse proxy con SSL automático
- 2 instancias PostgreSQL 16 independientes y aisladas
- 5 servicios funcionales con SSL válido
- Stack Grafana + Prometheus operativo
- Scripts de deploy reproducibles en cualquier servidor
</objective>

<tasks>

<!-- ============================================================ -->
<!-- WAVE 0 — CHECKPOINT HUMANO: Servidor Hetzner                 -->
<!-- ============================================================ -->

<task type="checkpoint:human-action" gate="blocking">
  <name>Wave 0 — Aprovisionar servidor Hetzner</name>
  <description>
    Acción manual requerida. Crear el servidor en Hetzner Cloud.

    **Specs recomendadas:**
    - Tipo: CPX31 (4 vCPU ARM, 8 GB RAM, 160 GB NVMe) → €15.90/mes
    - OS: Ubuntu 22.04 LTS
    - Datacenter: Nuremberg (EU, GDPR)
    - Firewall: puertos 22 (SSH), 80 (HTTP), 443 (HTTPS)
    - SSH Key: añadir la clave pública existente

    **RAM estimada en uso:**
    - Traefik: ~50 MB
    - postgres-shared: ~512 MB
    - postgres-enterprise: ~512 MB
    - Redis: ~64 MB
    - web (Coming Soon): ~128 MB
    - tenant-admin: ~512 MB
    - admin-client: ~512 MB
    - tenant-cep: ~512 MB
    - Grafana + Prometheus + exporters: ~512 MB
    - Total estimado: ~3.3 GB — cabe en 8 GB con margen

    **DNS (apuntar a la IP del servidor antes de levantar):**
    - akademate.com → IP del servidor
    - app.akademate.com → IP del servidor
    - ops.akademate.com → IP del servidor
    - monitor.akademate.com → IP del servidor
    - admin.cepcomunicacion.com → IP del servidor (cuando CEP firme)

    Una vez creado el servidor, continuar con Wave 1.
  </description>
</task>

<!-- ============================================================ -->
<!-- WAVE 1A — Script de setup inicial del servidor               -->
<!-- ============================================================ -->

<task id="setup-script" type="create-file" wave="1">
  <name>Wave 1A — Script setup-server.sh</name>
  <file>infrastructure/scripts/setup-server.sh</file>
  <description>
    Script idempotente de instalación inicial. Se ejecuta UNA VEZ en el servidor nuevo via SSH.
    Instala Docker, crea directorios de datos, configura firewall UFW y crea red traefik-public.
  </description>
  <content>
```bash
#!/usr/bin/env bash
# setup-server.sh — Instalación inicial del servidor Akademate
# Ejecutar: ssh root@IP 'bash -s' < setup-server.sh
set -euo pipefail

echo "==> [1/6] Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

echo "==> [2/6] Instalando Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

echo "==> [3/6] Configurando firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP (Traefik → redirect a HTTPS)
ufw allow 443/tcp  # HTTPS
ufw --force enable

echo "==> [4/6] Creando red Docker traefik-public..."
docker network create traefik-public 2>/dev/null || echo "   (ya existe, ok)"

echo "==> [5/6] Creando directorios de datos persistentes..."
mkdir -p /data/postgres-shared
mkdir -p /data/postgres-enterprise
mkdir -p /data/redis
mkdir -p /data/grafana
mkdir -p /data/prometheus
mkdir -p /data/traefik/acme    # Certificados Let's Encrypt
touch /data/traefik/acme/acme.json
chmod 600 /data/traefik/acme/acme.json

echo "==> [6/6] Clonando repositorio Akademate..."
cd /opt
git clone https://github.com/nazcamedia/akademate.com.git akademate || \
  (cd akademate && git pull)

echo ""
echo "✅ Setup completo. Continua con:"
echo "   cd /opt/akademate && cp infrastructure/docker/.env.prod.example infrastructure/docker/.env.prod"
echo "   (Edita .env.prod con tus valores reales)"
echo "   ./infrastructure/scripts/deploy-prod.sh all"
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 1B — Configuración Traefik                              -->
<!-- ============================================================ -->

<task id="traefik-static" type="create-file" wave="1">
  <name>Wave 1B — traefik/traefik.yml (config estática)</name>
  <file>infrastructure/docker/traefik/traefik.yml</file>
  <description>
    Configuración estática de Traefik v3. Define entrypoints, ACME/Let's Encrypt y providers.
    Sin Coolify — Traefik lee labels de los containers Docker directamente.
  </description>
  <content>
```yaml
# traefik.yml — Configuración estática Traefik v3
# Gestiona SSL automático via Let's Encrypt (ACME)

global:
  checkNewVersion: false
  sendAnonymousUsage: false

log:
  level: INFO

api:
  dashboard: true
  insecure: false  # Dashboard solo via HTTPS con auth

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

# ACME — Let's Encrypt
certificatesResolvers:
  letsencrypt:
    acme:
      email: hola@akademate.com
      storage: /acme/acme.json
      tlsChallenge: {}  # TLS-ALPN-01 (sin necesidad de abrir puerto 8080)

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false   # Solo containers con label traefik.enable=true
    network: traefik-public
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true
```
  </content>
</task>

<task id="traefik-dynamic" type="create-file" wave="1">
  <name>Wave 1B — traefik/dynamic.yml (config dinámica)</name>
  <file>infrastructure/docker/traefik/dynamic.yml</file>
  <description>
    Middlewares reutilizables: redirect HTTP→HTTPS y basicauth para Traefik dashboard + Grafana.
  </description>
  <content>
```yaml
# dynamic.yml — Middlewares y configuración dinámica Traefik

http:
  middlewares:
    # Redirect HTTP → HTTPS (se usa como fallback)
    https-redirect:
      redirectScheme:
        scheme: https
        permanent: true

    # BasicAuth para dashboard Traefik y Grafana (generado con: htpasswd -nB admin)
    # Cambiar TRAEFIK_DASHBOARD_PASSWORD en .env.prod
    dashboard-auth:
      basicAuth:
        users:
          - "${TRAEFIK_DASHBOARD_AUTH}"  # formato: user:$2y$...(bcrypt hash)

    # Security headers
    secure-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        forceSTSHeader: true
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"
```
  </content>
</task>

<task id="traefik-compose" type="create-file" wave="1">
  <name>Wave 1B — docker-compose.traefik.yml</name>
  <file>infrastructure/docker/docker-compose.traefik.yml</file>
  <description>
    Stack Traefik standalone. Se levanta primero y crea la red traefik-public.
    Todos los otros compose files se conectan a esta red para recibir tráfico.
  </description>
  <content>
```yaml
# docker-compose.traefik.yml
# Traefik v3 — Reverse proxy + SSL automático (Let's Encrypt)
# NO depende de Coolify. Autocontenido.

name: traefik

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik/dynamic.yml:/etc/traefik/dynamic.yml:ro
      - /data/traefik/acme:/acme
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      # Dashboard Traefik — https://traefik.akademate.com
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.akademate.com`)"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.middlewares=dashboard-auth"
      - "traefik.http.routers.traefik-dashboard.tls.certresolver=letsencrypt"
    environment:
      - TRAEFIK_DASHBOARD_AUTH=${TRAEFIK_DASHBOARD_AUTH}

networks:
  traefik-public:
    external: true  # Creada por setup-server.sh
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 1C — Init SQL scripts                                   -->
<!-- ============================================================ -->

<task id="sql-shared" type="create-file" wave="1">
  <name>Wave 1C — init-scripts/01-init-shared.sql</name>
  <file>infrastructure/docker/init-scripts/01-init-shared.sql</file>
  <content>
```sql
-- 01-init-shared.sql — Inicialización PostgreSQL akademate_shared
-- Tenants: Starter y Pro (multitenant por tenant_id)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsqueda full-text

-- Usuario de monitoreo (solo lectura, para postgres_exporter)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitor') THEN
    CREATE ROLE monitor WITH LOGIN PASSWORD '${MONITOR_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT pg_monitor TO monitor;
GRANT CONNECT ON DATABASE akademate_shared TO monitor;

-- Comentario identificador
COMMENT ON DATABASE akademate_shared IS 'Akademate SaaS — tenants Starter y Pro';
```
  </content>
</task>

<task id="sql-enterprise" type="create-file" wave="1">
  <name>Wave 1C — init-scripts/02-init-enterprise.sql</name>
  <file>infrastructure/docker/init-scripts/02-init-enterprise.sql</file>
  <content>
```sql
-- 02-init-enterprise.sql — Inicialización PostgreSQL akademate_enterprise
-- Exclusivo para clientes Enterprise (CEP Formación en Fase 1)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Usuario de monitoreo (solo lectura)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitor') THEN
    CREATE ROLE monitor WITH LOGIN PASSWORD '${MONITOR_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT pg_monitor TO monitor;
GRANT CONNECT ON DATABASE akademate_enterprise TO monitor;

COMMENT ON DATABASE akademate_enterprise IS 'Akademate Enterprise — instancias dedicadas (CEP Formación)';
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 2A — Stack compartido (Starter/Pro)                     -->
<!-- ============================================================ -->

<task id="compose-shared" type="create-file" wave="2">
  <name>Wave 2A — docker-compose.shared.yml</name>
  <file>infrastructure/docker/docker-compose.shared.yml</file>
  <description>
    Stack completo para tenants Starter/Pro.
    Incluye: postgres-shared, redis, web (coming soon), tenant-admin, admin-client.
    Todos en la misma red interna + conectados a traefik-public para SSL.
    CERO dependencia de Coolify.
  </description>
  <content>
```yaml
# docker-compose.shared.yml
# Stack Akademate — tenants Starter/Pro
# Red interna: akademate-shared
# Red pública: traefik-public (Traefik gestiona SSL)

name: akademate-shared

services:
  # ─── Base de datos Starter/Pro ───────────────────────────────
  postgres-shared:
    image: postgres:16-alpine
    container_name: postgres-shared
    restart: unless-stopped
    environment:
      POSTGRES_DB: akademate_shared
      POSTGRES_USER: ${POSTGRES_SHARED_USER}
      POSTGRES_PASSWORD: ${POSTGRES_SHARED_PASSWORD}
    volumes:
      - /data/postgres-shared:/var/lib/postgresql/data
      - ./init-scripts/01-init-shared.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    networks:
      - akademate-shared
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_SHARED_USER} -d akademate_shared"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Redis (caché y sesiones) ─────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: redis-shared
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - /data/redis:/data
    networks:
      - akademate-shared
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ─── Web pública Akademate (Coming Soon) ──────────────────────
  web:
    image: ghcr.io/nazcamedia/akademate-web:${WEB_VERSION:-latest}
    container_name: akademate-web
    restart: unless-stopped
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://app.akademate.com
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`akademate.com`) || Host(`www.akademate.com`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.routers.web.middlewares=secure-headers"
      - "traefik.http.services.web.loadbalancer.server.port=3000"

  # ─── Tenant Admin (Dashboard multitenant Starter/Pro) ────────
  tenant-admin:
    image: ghcr.io/nazcamedia/akademate-tenant-admin:${TENANT_ADMIN_VERSION:-latest}
    container_name: akademate-tenant-admin
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URI: postgresql://${POSTGRES_SHARED_USER}:${POSTGRES_SHARED_PASSWORD}@postgres-shared:5432/akademate_shared
      PAYLOAD_SECRET: ${PAYLOAD_SECRET}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis-shared:6379
      NEXT_PUBLIC_SERVER_URL: https://app.akademate.com
      # ⚠️ CRÍTICO: Dev bypass DESACTIVADO en producción
      NEXT_PUBLIC_DEV_AUTH_BYPASS: "false"
      NEXT_PUBLIC_ENABLE_DEV_LOGIN: "false"
    depends_on:
      postgres-shared:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - akademate-shared
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.tenant-admin.rule=Host(`app.akademate.com`)"
      - "traefik.http.routers.tenant-admin.entrypoints=websecure"
      - "traefik.http.routers.tenant-admin.tls.certresolver=letsencrypt"
      - "traefik.http.routers.tenant-admin.middlewares=secure-headers"
      - "traefik.http.services.tenant-admin.loadbalancer.server.port=3009"

  # ─── Admin Client (Gestor SaaS — superadmin) ─────────────────
  admin-client:
    image: ghcr.io/nazcamedia/akademate-admin-client:${ADMIN_CLIENT_VERSION:-latest}
    container_name: akademate-admin-client
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PAYLOAD_CMS_URL: https://app.akademate.com
      NEXT_PUBLIC_TENANT_URL: https://ops.akademate.com
      NEXT_PUBLIC_DEV_AUTH_BYPASS: "false"
    depends_on:
      - tenant-admin
    networks:
      - akademate-shared
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.admin-client.rule=Host(`ops.akademate.com`)"
      - "traefik.http.routers.admin-client.entrypoints=websecure"
      - "traefik.http.routers.admin-client.tls.certresolver=letsencrypt"
      - "traefik.http.routers.admin-client.middlewares=secure-headers"
      - "traefik.http.services.admin-client.loadbalancer.server.port=3006"

networks:
  akademate-shared:
    name: akademate-shared
  traefik-public:
    external: true
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 2B — Stack CEP Enterprise (red aislada)                 -->
<!-- ============================================================ -->

<task id="compose-cep" type="create-file" wave="2">
  <name>Wave 2B — docker-compose.cep.yml</name>
  <file>infrastructure/docker/docker-compose.cep.yml</file>
  <description>
    Stack Enterprise CEP Formación completamente aislado.
    postgres-enterprise en red separada (akademate-cep).
    tenant-cep NO puede acceder a postgres-shared ni viceversa.
    Activo solo cuando CEP firme Enterprise.
  </description>
  <content>
```yaml
# docker-compose.cep.yml
# Stack Enterprise CEP Formación — AISLADO
# Red interna: akademate-cep (separada de akademate-shared)
# Red pública: traefik-public (mismo Traefik, dominios distintos)

name: akademate-cep

services:
  # ─── Base de datos exclusiva CEP ─────────────────────────────
  postgres-enterprise:
    image: postgres:16-alpine
    container_name: postgres-enterprise
    restart: unless-stopped
    environment:
      POSTGRES_DB: akademate_enterprise
      POSTGRES_USER: ${POSTGRES_CEP_USER}
      POSTGRES_PASSWORD: ${POSTGRES_CEP_PASSWORD}
    volumes:
      - /data/postgres-enterprise:/var/lib/postgresql/data
      - ./init-scripts/02-init-enterprise.sql:/docker-entrypoint-initdb.d/02-init.sql:ro
    networks:
      - akademate-cep  # SOLO red CEP — invisible desde akademate-shared
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_CEP_USER} -d akademate_enterprise"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Tenant CEP (Dashboard personalizado CEP Formación) ──────
  tenant-cep:
    image: ghcr.io/nazcamedia/akademate-tenant-admin:${CEP_VERSION:-latest}
    container_name: akademate-tenant-cep
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URI: postgresql://${POSTGRES_CEP_USER}:${POSTGRES_CEP_PASSWORD}@postgres-enterprise:5432/akademate_enterprise
      PAYLOAD_SECRET: ${CEP_PAYLOAD_SECRET}  # Secret distinto al compartido
      NEXT_PUBLIC_SERVER_URL: https://admin.cepcomunicacion.com
      # Personalización CEP
      NEXT_PUBLIC_ACADEMY_NAME: "CEP Formación"
      NEXT_PUBLIC_ACADEMY_LOGO: "/logos/cep-logo.png"
      NEXT_PUBLIC_ACADEMY_PRIMARY_COLOR: "#005A9C"
      # Dev bypass desactivado
      NEXT_PUBLIC_DEV_AUTH_BYPASS: "false"
      NEXT_PUBLIC_ENABLE_DEV_LOGIN: "false"
    depends_on:
      postgres-enterprise:
        condition: service_healthy
    networks:
      - akademate-cep
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.cep-admin.rule=Host(`admin.cepcomunicacion.com`)"
      - "traefik.http.routers.cep-admin.entrypoints=websecure"
      - "traefik.http.routers.cep-admin.tls.certresolver=letsencrypt"
      - "traefik.http.routers.cep-admin.middlewares=secure-headers"
      - "traefik.http.services.cep-admin.loadbalancer.server.port=3009"

networks:
  akademate-cep:
    name: akademate-cep   # Red aislada — postgres-enterprise no accesible desde shared
  traefik-public:
    external: true
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 2C — Stack Monitoring                                   -->
<!-- ============================================================ -->

<task id="compose-monitoring" type="create-file" wave="2">
  <name>Wave 2C — docker-compose.monitoring.yml</name>
  <file>infrastructure/docker/docker-compose.monitoring.yml</file>
  <content>
```yaml
# docker-compose.monitoring.yml
# Grafana + Prometheus + Node Exporter + 2 PostgreSQL Exporters
# Accede a ambas DBs solo para métricas (usuario monitor)

name: akademate-monitoring

services:
  # ─── Prometheus ───────────────────────────────────────────────
  prometheus:
    image: prom/prometheus:v2.51.2
    container_name: prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml:ro
      - /data/prometheus:/prometheus
    networks:
      - monitoring
      - akademate-shared    # Para raspar postgres-shared y redis
      - akademate-cep       # Para raspar postgres-enterprise
    # Prometheus NO expuesto a internet — solo Grafana lo consulta

  # ─── Node Exporter (métricas del servidor) ────────────────────
  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    restart: unless-stopped
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  # ─── PostgreSQL Exporter — DB Shared ─────────────────────────
  postgres-exporter-shared:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: postgres-exporter-shared
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "postgresql://monitor:${MONITOR_PASSWORD}@postgres-shared:5432/akademate_shared?sslmode=disable"
    networks:
      - monitoring
      - akademate-shared
    depends_on:
      - prometheus

  # ─── PostgreSQL Exporter — DB Enterprise ─────────────────────
  postgres-exporter-enterprise:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: postgres-exporter-enterprise
    restart: unless-stopped
    environment:
      DATA_SOURCE_NAME: "postgresql://monitor:${MONITOR_PASSWORD}@postgres-enterprise:5432/akademate_enterprise?sslmode=disable"
    networks:
      - monitoring
      - akademate-cep
    depends_on:
      - prometheus

  # ─── Grafana ──────────────────────────────────────────────────
  grafana:
    image: grafana/grafana:10.4.0
    container_name: grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP: "false"
      GF_SERVER_ROOT_URL: https://monitor.akademate.com
      GF_SERVER_DOMAIN: monitor.akademate.com
    volumes:
      - /data/grafana:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - monitoring
      - traefik-public
    depends_on:
      - prometheus
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`monitor.akademate.com`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.routers.grafana.middlewares=secure-headers"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"

networks:
  monitoring:
    name: monitoring
  akademate-shared:
    external: true
  akademate-cep:
    external: true
  traefik-public:
    external: true
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 3 — Configuración Prometheus + Grafana provisioning     -->
<!-- ============================================================ -->

<task id="prometheus-config" type="create-file" wave="3">
  <name>Wave 3A — monitoring/prometheus.yml</name>
  <file>infrastructure/docker/monitoring/prometheus.yml</file>
  <content>
```yaml
# prometheus.yml — Scrape config Akademate
global:
  scrape_interval: 30s
  evaluation_interval: 30s
  external_labels:
    env: production
    project: akademate

rule_files:
  - /etc/prometheus/alerts.yml

scrape_configs:
  - job_name: node
    static_configs:
      - targets: ['node-exporter:9100']
        labels:
          instance: hetzner-prod

  - job_name: postgres_shared
    static_configs:
      - targets: ['postgres-exporter-shared:9187']
        labels:
          db: akademate_shared
          tier: starter_pro

  - job_name: postgres_enterprise
    static_configs:
      - targets: ['postgres-exporter-enterprise:9187']
        labels:
          db: akademate_enterprise
          tier: enterprise

  - job_name: traefik
    static_configs:
      - targets: ['traefik:8080']
```
  </content>
</task>

<task id="prometheus-alerts" type="create-file" wave="3">
  <name>Wave 3A — monitoring/alerts.yml</name>
  <file>infrastructure/docker/monitoring/alerts.yml</file>
  <content>
```yaml
# alerts.yml — Reglas de alertas Akademate
groups:
  - name: server
    rules:
      - alert: HighCPU
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "CPU > 80% durante 10 minutos"

      - alert: HighMemory
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "RAM > 85% — considerar scale up"

      - alert: DiskSpaceLow
        expr: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disco > 80% — limpiar o ampliar"

  - name: databases
    rules:
      - alert: PostgresDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL {{ $labels.db }} caído"

      - alert: PostgresTooManyConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "PostgreSQL {{ $labels.db }} con >80 conexiones activas"
```
  </content>
</task>

<task id="grafana-datasource" type="create-file" wave="3">
  <name>Wave 3B — Grafana datasource provisioning</name>
  <file>infrastructure/docker/monitoring/grafana/provisioning/datasources/prometheus.yml</file>
  <content>
```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 4 — Script deploy + .env.example + DEPLOY.md            -->
<!-- ============================================================ -->

<task id="deploy-script" type="create-file" wave="4">
  <name>Wave 4A — scripts/deploy-prod.sh</name>
  <file>infrastructure/scripts/deploy-prod.sh</file>
  <description>
    Script principal de despliegue. Autocontenido — no requiere Coolify.
    Uso: ./deploy-prod.sh [traefik|shared|cep|monitoring|all]
  </description>
  <content>
```bash
#!/usr/bin/env bash
# deploy-prod.sh — Deploy Akademate en producción (sin Coolify)
# Uso: ./deploy-prod.sh [traefik|shared|cep|monitoring|all]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR/../docker"
ENV_FILE="$DOCKER_DIR/.env.prod"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ ERROR: No se encontró $ENV_FILE"
  echo "   Crea el archivo a partir de: $DOCKER_DIR/.env.prod.example"
  exit 1
fi

deploy() {
  local STACK=$1
  local FILE=$2
  echo ""
  echo "==> Desplegando: $STACK"
  docker compose --project-name "akademate-$STACK" \
    --env-file "$ENV_FILE" \
    -f "$DOCKER_DIR/$FILE" \
    up -d --remove-orphans
  echo "✅ $STACK desplegado"
}

case "${1:-all}" in
  traefik)    deploy traefik docker-compose.traefik.yml ;;
  shared)     deploy shared docker-compose.shared.yml ;;
  cep)        deploy cep docker-compose.cep.yml ;;
  monitoring) deploy monitoring docker-compose.monitoring.yml ;;
  all)
    deploy traefik docker-compose.traefik.yml
    echo "   Esperando que Traefik levante..."
    sleep 5
    deploy shared docker-compose.shared.yml
    deploy monitoring docker-compose.monitoring.yml
    echo ""
    echo "✅ Stack completo desplegado"
    echo "   akademate.com          → https://akademate.com"
    echo "   app.akademate.com      → https://app.akademate.com"
    echo "   ops.akademate.com      → https://ops.akademate.com"
    echo "   monitor.akademate.com  → https://monitor.akademate.com"
    echo "   traefik.akademate.com  → https://traefik.akademate.com"
    echo ""
    echo "   CEP (cuando firme Enterprise):"
    echo "   ./deploy-prod.sh cep"
    ;;
  *)
    echo "Uso: $0 [traefik|shared|cep|monitoring|all]"
    exit 1
    ;;
esac
```
  </content>
</task>

<task id="env-example" type="create-file" wave="4">
  <name>Wave 4B — .env.prod.example</name>
  <file>infrastructure/docker/.env.prod.example</file>
  <description>
    Plantilla de variables de entorno para producción.
    NUNCA commitear .env.prod con valores reales.
  </description>
  <content>
```bash
# .env.prod.example — Copiar a .env.prod y rellenar valores reales
# IMPORTANTE: .env.prod está en .gitignore — NUNCA hacer git add de este archivo

# ── Versiones de imágenes Docker ─────────────────────────────────
WEB_VERSION=latest
TENANT_ADMIN_VERSION=latest
ADMIN_CLIENT_VERSION=latest
CEP_VERSION=latest

# ── PostgreSQL Shared (Starter/Pro) ──────────────────────────────
POSTGRES_SHARED_USER=akademate
POSTGRES_SHARED_PASSWORD=CAMBIAR_PASSWORD_SEGURO_32_CHARS

# ── PostgreSQL Enterprise (CEP) ───────────────────────────────────
POSTGRES_CEP_USER=akademate_cep
POSTGRES_CEP_PASSWORD=CAMBIAR_PASSWORD_SEGURO_32_CHARS

# ── Usuario monitor (read-only, para postgres_exporter) ──────────
MONITOR_PASSWORD=CAMBIAR_PASSWORD_MONITOR

# ── Redis ─────────────────────────────────────────────────────────
REDIS_PASSWORD=CAMBIAR_PASSWORD_REDIS

# ── Payload CMS ───────────────────────────────────────────────────
PAYLOAD_SECRET=CAMBIAR_SECRET_MINIMO_32_CHARS_ALEATORIO
CEP_PAYLOAD_SECRET=CAMBIAR_SECRET_DISTINTO_AL_SHARED

# ── Traefik Dashboard ─────────────────────────────────────────────
# Generar con: htpasswd -nB admin | sed -e 's/\$/\$\$/g'
TRAEFIK_DASHBOARD_AUTH=admin:$$2y$$12$$HASH_AQUI

# ── Grafana ───────────────────────────────────────────────────────
GRAFANA_USER=admin
GRAFANA_PASSWORD=CAMBIAR_PASSWORD_GRAFANA

# ── Email (Let's Encrypt) ─────────────────────────────────────────
ACME_EMAIL=hola@akademate.com
```
  </content>
</task>

<task id="gitignore-env" type="modify-file" wave="4">
  <name>Wave 4B — Añadir .env.prod a .gitignore</name>
  <file>infrastructure/docker/.gitignore</file>
  <content>
```
# Producción — NUNCA commitear
.env.prod
acme.json

# Datos de postgres (si se montan aquí en lugar de /data/)
data/
```
  </content>
</task>

<task id="deploy-guide" type="create-file" wave="4">
  <name>Wave 4C — DEPLOY.md (guía completa)</name>
  <file>infrastructure/docker/DEPLOY.md</file>
  <content>
```markdown
# Akademate — Guía de Despliegue en Producción

## Arquitectura

```
Internet
   │
   ▼
Traefik (puerto 80/443)
   │  SSL automático Let's Encrypt
   ├─── akademate.com          → web (Coming Soon)
   ├─── app.akademate.com      → tenant-admin (Payload CMS multitenant)
   ├─── ops.akademate.com      → admin-client (Gestor SaaS)
   ├─── monitor.akademate.com  → Grafana
   ├─── traefik.akademate.com  → Traefik dashboard
   └─── admin.cepcomunicacion.com → tenant-cep (cuando CEP firme)

Redes Docker (aisladas):
   traefik-public   ← todos los servicios expuestos
   akademate-shared ← postgres-shared + redis + tenant-admin + admin-client + web
   akademate-cep    ← postgres-enterprise + tenant-cep (AISLADA)
   monitoring       ← prometheus + grafana + exporters
```

## Requisitos previos

- Servidor Ubuntu 22.04 LTS (recomendado: Hetzner CPX31)
- Docker instalado
- DNS configurado (todos los subdominios → IP del servidor)
- Puerto 80 y 443 abiertos

## Primer deploy (desde cero)

```bash
# 1. Ejecutar en el servidor nuevo
ssh root@IP_SERVIDOR 'bash -s' < infrastructure/scripts/setup-server.sh

# 2. En el servidor, clonar el repo y configurar variables
cd /opt/akademate
cp infrastructure/docker/.env.prod.example infrastructure/docker/.env.prod
nano infrastructure/docker/.env.prod   # Rellenar todos los valores

# 3. Construir y publicar imágenes Docker (desde tu máquina local o CI)
# (ver sección de CI/CD más abajo)

# 4. Levantar el stack
./infrastructure/scripts/deploy-prod.sh all
```

## Activar CEP Enterprise (cuando firme)

```bash
# Asegurarse de que DNS admin.cepcomunicacion.com → IP del servidor
./infrastructure/scripts/deploy-prod.sh cep
```

## Actualizar una imagen

```bash
# En el servidor
cd /opt/akademate
git pull
docker pull ghcr.io/nazcamedia/akademate-tenant-admin:latest
./infrastructure/scripts/deploy-prod.sh shared
```

## Verificar estado

```bash
docker compose -p akademate-traefik ps
docker compose -p akademate-shared ps
docker compose -p akademate-cep ps
docker compose -p akademate-monitoring ps
```

## Backups PostgreSQL

```bash
# Backup manual shared
docker exec postgres-shared pg_dump -U akademate akademate_shared | gzip > backup-shared-$(date +%Y%m%d).sql.gz

# Backup manual enterprise
docker exec postgres-enterprise pg_dump -U akademate_cep akademate_enterprise | gzip > backup-cep-$(date +%Y%m%d).sql.gz
```

## Sin Coolify — ¿Por qué?

Este stack NO usa Coolify intencionalmente:
- **Portabilidad total**: cualquier servidor con Docker puede levantar el stack
- **Sin single point of failure**: si Coolify tuviese un problema, el stack seguiría operativo
- **Reproducibilidad**: `git clone + deploy-prod.sh all` = mismo resultado siempre
- **Simplicidad**: Traefik maneja SSL directamente con ACME/Let's Encrypt
- **Migración trivial**: para mover a otro servidor, copiar /data/* + deploy-prod.sh
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE 5 — ESTRATEGIA DEV/PROD                                 -->
<!-- ============================================================ -->

<!--
  FILOSOFÍA:
  - Dev:  Infra (postgres + redis) en Docker. Apps corren LOCAL con pnpm dev.
          → Cambio de código = hot reload inmediato. Sin rebuild de imágenes.
  - Staging: Stack completo en Docker (--build) para validar antes de producción.
  - Prod: Imágenes pre-construidas, sin volúmenes de código, Traefik + SSL.
-->

<task id="compose-infra-dev" type="create-file" wave="5">
  <name>Wave 5A — docker-compose.infra.yml (infra para desarrollo local)</name>
  <file>infrastructure/docker/docker-compose.infra.yml</file>
  <description>
    Solo PostgreSQL + Redis. Se usa en desarrollo para que las apps corran
    localmente con pnpm dev con hot reload, conectándose a la infra en Docker.
    NO incluye apps — esas corren fuera de Docker en dev.
  </description>
  <content>
```yaml
# docker-compose.infra.yml — Infraestructura para desarrollo local
# Uso: docker compose -f infrastructure/docker/docker-compose.infra.yml up -d
#
# Las apps NO están aquí — corren con: pnpm dev
# Esto permite hot reload inmediato sin reconstruir imágenes.

name: akademate-infra-dev

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-dev
    restart: unless-stopped
    ports:
      - "5432:5432"   # Expuesto al host para que pnpm dev conecte directamente
    environment:
      POSTGRES_DB: akademate_dev
      POSTGRES_USER: akademate
      POSTGRES_PASSWORD: akademate_dev_password
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
      - ./init-scripts/01-init-shared.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U akademate -d akademate_dev"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"   # Expuesto al host para que pnpm dev conecte
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
    # Sin contraseña en dev para simplicidad

  # Opcional: pgAdmin para inspeccionar la BD visualmente
  pgadmin:
    image: dpage/pgadmin4:8
    container_name: pgadmin-dev
    profiles: ["tools"]   # Solo se levanta con: --profile tools
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: dev@akademate.com
      PGADMIN_DEFAULT_PASSWORD: dev
    volumes:
      - pgadmin-dev-data:/var/lib/pgadmin

volumes:
  postgres-dev-data:
  pgadmin-dev-data:
```
  </content>
</task>

<task id="env-development" type="create-file" wave="5">
  <name>Wave 5B — .env.development (variables para dev local)</name>
  <file>apps/tenant-admin/.env.development</file>
  <description>
    Variables para desarrollo local. Las apps leen este archivo cuando corren
    con pnpm dev. Apuntan a postgres y redis en Docker (localhost:5432, localhost:6379).
    Este archivo SÍ puede estar en el repo (sin secrets reales).
  </description>
  <content>
```bash
# .env.development — Variables para desarrollo local
# Usado por: pnpm dev en apps/tenant-admin
# Infra: docker compose -f infrastructure/docker/docker-compose.infra.yml up -d

# ── Payload CMS ───────────────────────────────────────────────────
DATABASE_URI=postgresql://akademate:akademate_dev_password@localhost:5432/akademate_dev
PAYLOAD_SECRET=dev-secret-not-for-production-32chars

# ── Redis ─────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── URLs ──────────────────────────────────────────────────────────
NEXT_PUBLIC_SERVER_URL=http://localhost:3009
NEXT_PUBLIC_WEB_URL=http://localhost:3000

# ── Dev flags (DESACTIVAR en producción) ─────────────────────────
NODE_ENV=development
NEXT_PUBLIC_DEV_AUTH_BYPASS=false
NEXT_PUBLIC_ENABLE_DEV_LOGIN=false

# ── S3 / Storage (usar local filesystem en dev) ───────────────────
PAYLOAD_MEDIA_LOCAL=true
```
  </content>
</task>

<task id="dev-script" type="create-file" wave="5">
  <name>Wave 5C — scripts/dev.sh (arranque rápido de entorno dev)</name>
  <file>infrastructure/scripts/dev.sh</file>
  <description>
    Script de un solo comando para levantar el entorno de desarrollo completo.
    Levanta infra en Docker y luego ejecuta pnpm dev en el monorepo.
  </description>
  <content>
```bash
#!/usr/bin/env bash
# dev.sh — Arranca el entorno de desarrollo Akademate
# Uso: ./infrastructure/scripts/dev.sh [up|down|reset]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INFRA_COMPOSE="$REPO_ROOT/infrastructure/docker/docker-compose.infra.yml"

case "${1:-up}" in
  up)
    echo "==> [1/2] Levantando infraestructura (postgres + redis)..."
    docker compose -f "$INFRA_COMPOSE" up -d

    echo "==> [2/2] Esperando que postgres esté listo..."
    until docker exec postgres-dev pg_isready -U akademate -d akademate_dev -q; do
      sleep 1
    done

    echo ""
    echo "✅ Infraestructura lista:"
    echo "   PostgreSQL → localhost:5432 (db: akademate_dev, user: akademate)"
    echo "   Redis      → localhost:6379"
    echo ""
    echo "Ahora ejecuta en otra terminal:"
    echo "   pnpm dev                    # Todas las apps"
    echo "   pnpm --filter tenant-admin dev  # Solo tenant-admin"
    echo ""
    echo "Para pgAdmin (inspector BD): docker compose -f $INFRA_COMPOSE --profile tools up -d"
    ;;

  down)
    echo "==> Parando infraestructura..."
    docker compose -f "$INFRA_COMPOSE" down
    echo "✅ Infraestructura parada (datos preservados en volúmenes Docker)"
    ;;

  reset)
    echo "⚠️  Esto eliminará TODOS los datos de desarrollo. ¿Continuar? [y/N]"
    read -r confirm
    if [ "$confirm" = "y" ]; then
      docker compose -f "$INFRA_COMPOSE" down -v
      echo "✅ Infraestructura y datos eliminados. Próximo 'dev.sh up' reiniciará desde cero."
    else
      echo "Cancelado."
    fi
    ;;

  logs)
    docker compose -f "$INFRA_COMPOSE" logs -f
    ;;

  *)
    echo "Uso: $0 [up|down|reset|logs]"
    exit 1
    ;;
esac
```
  </content>
</task>

<task id="dev-prod-strategy-doc" type="create-file" wave="5">
  <name>Wave 5D — DEV-PROD-STRATEGY.md</name>
  <file>infrastructure/docker/DEV-PROD-STRATEGY.md</file>
  <content>
```markdown
# Akademate — Estrategia Dev / Prod con Docker

## El Principio

> **Infra siempre en Docker. Apps donde corresponda según el entorno.**

| Componente | Desarrollo | Producción |
|---|---|---|
| PostgreSQL | Docker (localhost:5432) | Docker (red interna) |
| Redis | Docker (localhost:6379) | Docker (red interna) |
| Next.js apps | `pnpm dev` (hot reload) | Imagen Docker construida |
| Traefik / SSL | ❌ No necesario | ✅ Traefik + Let's Encrypt |

---

## Entorno de Desarrollo

### Flujo de trabajo diario

```bash
# Terminal 1 — Levantar infra (una vez al día)
./infrastructure/scripts/dev.sh up

# Terminal 2 — Apps con hot reload
pnpm dev

# O solo una app específica:
pnpm --filter tenant-admin dev
pnpm --filter web dev
pnpm --filter admin-client dev
```

**Resultado:** Cambias un archivo `.tsx` → el browser se actualiza en < 1 segundo.
Sin rebuild de Docker. Sin esperar. Sin magia.

### URLs en desarrollo

| App | URL local |
|---|---|
| tenant-admin (Payload) | http://localhost:3009 |
| web pública | http://localhost:3000 |
| admin-client | http://localhost:3006 |
| campus | http://localhost:3010 |
| pgAdmin (opcional) | http://localhost:5050 |

### Variables de entorno en dev

Cada app tiene su `.env.development` local. Para tenant-admin:
- `DATABASE_URI` → apunta a `localhost:5432` (postgres en Docker)
- `REDIS_URL` → apunta a `localhost:6379` (redis en Docker)
- `NODE_ENV=development`
- `NEXT_PUBLIC_DEV_AUTH_BYPASS=false` ← mantener siempre false

### Reiniciar BD desde cero

```bash
./infrastructure/scripts/dev.sh reset  # Elimina volúmenes y datos
./infrastructure/scripts/dev.sh up     # Recrea desde cero
```

---

## Entorno de Staging (pre-producción)

Cuando quieras probar el stack completo en Docker antes de desplegar a producción:

```bash
# Build de todas las imágenes desde el código actual
docker compose \
  -f infrastructure/docker/docker-compose.shared.yml \
  --env-file infrastructure/docker/.env.staging \
  up --build -d

# Acceder en localhost (sin SSL, sin Traefik)
# Ajustar los labels de Traefik a false en staging o usar ports directos
```

Esto te permite verificar que las imágenes Docker construyen correctamente antes
de desplegar en Hetzner.

---

## Entorno de Producción (Hetzner)

```bash
# En el servidor Hetzner
git pull
./infrastructure/scripts/deploy-prod.sh all
```

Las imágenes se construyen via CI/CD (GitHub Actions) y se publican en
`ghcr.io/nazcamedia/akademate-*`. El servidor solo hace `docker pull` + `up`.

### Pipeline CI/CD (GitHub Actions — a implementar en v1.0)

```
Push a main
  → Build imágenes Docker (multi-arch: amd64 + arm64)
  → Push a ghcr.io/nazcamedia/akademate-*:latest
  → SSH al servidor Hetzner → git pull + deploy-prod.sh all
```

---

## Cuándo pasar de dev a "prod Docker"

| Hito | Acción |
|---|---|
| **v0.x (ahora)** | `pnpm dev` + infra Docker. Iterar rápido. |
| **v0.9 (feature complete)** | Staging completo en Docker. Validar imágenes. |
| **v1.0 (lanzamiento)** | Deploy a Hetzner. CI/CD activo. `pnpm dev` solo en local. |

---

## Estructura de archivos Docker

```
infrastructure/
└── docker/
    ├── docker-compose.infra.yml      ← DEV: solo postgres + redis
    ├── docker-compose.traefik.yml    ← PROD: Traefik + SSL
    ├── docker-compose.shared.yml     ← PROD: apps Starter/Pro
    ├── docker-compose.cep.yml        ← PROD: CEP Enterprise (cuando firme)
    ├── docker-compose.monitoring.yml ← PROD: Grafana + Prometheus
    ├── traefik/
    │   ├── traefik.yml               ← Config estática Traefik
    │   └── dynamic.yml               ← Middlewares
    ├── monitoring/
    │   ├── prometheus.yml
    │   ├── alerts.yml
    │   └── grafana/provisioning/
    ├── init-scripts/
    │   ├── 01-init-shared.sql
    │   └── 02-init-enterprise.sql
    ├── .env.prod.example             ← Plantilla vars producción
    ├── .gitignore                    ← .env.prod excluido
    ├── DEPLOY.md                     ← Guía despliegue producción
    └── DEV-PROD-STRATEGY.md          ← Este archivo
```
```
  </content>
</task>

<!-- ============================================================ -->
<!-- WAVE FINAL — Verificación en producción                      -->
<!-- ============================================================ -->

<task type="checkpoint:human-verify" gate="blocking">
  <name>Wave Final — Verificación en servidor</name>
  <description>
    Tras ejecutar deploy-prod.sh all, verificar que todos los servicios están operativos.

    **Checklist:**
    - [ ] https://akademate.com → Coming Soon con SSL válido (candado verde)
    - [ ] https://app.akademate.com → Login de tenant-admin (Payload CMS)
    - [ ] https://ops.akademate.com → Login de admin-client
    - [ ] https://monitor.akademate.com → Grafana con login
    - [ ] https://traefik.akademate.com → Dashboard Traefik con basicauth
    - [ ] `docker compose -p akademate-shared ps` → todos los servicios Up
    - [ ] Grafana muestra métricas de postgres-shared y node-exporter
    - [ ] Intentar login en tenant-admin con credenciales reales → éxito

    **Para activar CEP (cuando firme):**
    - [ ] DNS admin.cepcomunicacion.com → IP del servidor
    - [ ] `./deploy-prod.sh cep`
    - [ ] https://admin.cepcomunicacion.com → Login con branding CEP
  </description>
</task>

</tasks>
