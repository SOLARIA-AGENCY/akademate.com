# Plan de Integración: C-BIAS ↔ Akademate Monitoring

**Fecha:** 2026-03-10
**Repositorios involucrados:**
- `C-BIAS-ENTERPRISES` — Plano de control central
- `akademate.com` — Proyecto gestionado

---

## Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                   C-BIAS SERVER (CAX11 ARM64)                   │
│                      100.69.163.44 (Tailscale)                  │
│                                                                 │
│  Prometheus ──── scrape via Tailscale ────────────────────────► │
│  Loki       ◄─── promtail logs via Tailscale ─────────────────  │
│  Grafana    ──── dashboards akademate + nodos ────────────────  │
│  Nanobot    ──── skill akademate-monitor ─────────────────────  │
│  n8n        ──── webhooks + alertas ──────────────────────────  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Tailscale VPN (privada)
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│              AKADEMATE SERVER (Hetzner CPX31)                   │
│                    IP pública + Tailscale IP                    │
│                                                                 │
│  node-exporter    :9100  → métricas servidor (CPU, RAM, disco)  │
│  cadvisor         :8080  → métricas contenedores Docker         │
│  pg-exporter-shared:9187 → métricas postgres-shared            │
│  pg-exporter-ent  :9188  → métricas postgres-enterprise        │
│  promtail               → envía logs a C-BIAS Loki             │
│                                                                 │
│  Apps (HTTPS público via Traefik):                              │
│  app.akademate.com → tenant-admin                               │
│  ops.akademate.com → admin-client                               │
│  monitor.akademate.com → Grafana LOCAL (solo admins)           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ API REST (HTTPS)
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│            NODOS ENTERPRISE (por cliente)                       │
│                                                                 │
│  CEP Formación: admin.cepcomunicacion.com                       │
│  → GET /akademate/v1/health                                     │
│  → GET /akademate/v1/metrics                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│           AKADEMATE SaaS DASHBOARD (vista superadmin)           │
│                                                                 │
│  /administracion/estado → Monitoring Hub                        │
│  ├── Servidor Akademate (CPU, RAM, disco, containers)           │
│  ├── Base de datos Shared (conexiones, queries, tamaño)        │
│  ├── Base de datos Enterprise (id)                             │
│  └── Nodos Enterprise (health, métricas de negocio por nodo)   │
└─────────────────────────────────────────────────────────────────┘
```

---

## PARTE 1: Cambios en C-BIAS-ENTERPRISES

### 1.1 Prometheus — Añadir scrape jobs Akademate

**Archivo:** `configs/prometheus/prometheus.yml`

Añadir al final del archivo:

```yaml
# ── AKADEMATE (via Tailscale) ──────────────────────────────────
- job_name: akademate_node
  static_configs:
    - targets: ['AKADEMATE_TAILSCALE_IP:9100']
      labels:
        project: akademate
        env: production
        instance: akademate-hetzner

- job_name: akademate_containers
  static_configs:
    - targets: ['AKADEMATE_TAILSCALE_IP:8080']
      labels:
        project: akademate
        env: production

- job_name: akademate_postgres_shared
  static_configs:
    - targets: ['AKADEMATE_TAILSCALE_IP:9187']
      labels:
        project: akademate
        db: akademate_shared
        tier: starter_pro

- job_name: akademate_postgres_enterprise
  static_configs:
    - targets: ['AKADEMATE_TAILSCALE_IP:9188']
      labels:
        project: akademate
        db: akademate_enterprise
        tier: enterprise
```

> `AKADEMATE_TAILSCALE_IP` se asigna al hacer Tailscale auth en el nuevo servidor.

### 1.2 Promtail — Recibir logs de Akademate

El Promtail en Akademate enviará logs al Loki de C-BIAS.
No se necesita cambio en C-BIAS — Loki ya acepta escritura remota.
Verificar que el puerto Loki (3100) está accesible dentro de la Tailscale VPN.

### 1.3 Grafana — Nuevo dashboard Akademate

**Archivo nuevo:** `configs/grafana/dashboards/akademate-overview.json`

Dashboard con paneles:
- **Server health:** CPU, RAM, disco, uptime (fuente: akademate_node)
- **Contenedores:** Count running, reiniciar, memoria por container (fuente: akademate_containers)
- **PostgreSQL Shared:** Conexiones, queries/s, tamaño BD, locks (fuente: akademate_postgres_shared)
- **PostgreSQL Enterprise:** Mismo set para BD CEP (fuente: akademate_postgres_enterprise)
- **Tráfico web:** Requests/s, latencia, error rate (si Traefik expone métricas)
- **Disponibilidad:** Links a Uptime Kuma para dominios akademate.com

### 1.4 Nanobot — Nuevo skill `akademate-monitor`

**Directorio nuevo:** `configs/nanobot/skills/akademate-monitor/`

**SKILL.md:**
```markdown
# akademate-monitor

## Descripción
Monitorea el servidor Akademate y sus servicios vía Prometheus y health endpoints.
Alerta cuando hay problemas con el servidor, las bases de datos o los nodos Enterprise.

## Triggers
- Heartbeat: incluido en checks cada 15 minutos
- Alerta: cuando Prometheus detecta anomalía en métricas akademate_*

## Capacidades
- Consultar Prometheus para métricas de Akademate
- Verificar status de los 5 servicios (web, tenant-admin, admin-client, tenant-cep, monitoring)
- Verificar health de nodos Enterprise via API REST
- Alertar via Telegram cuando CPU > 80%, RAM > 85%, DB caído, error rate alto
- Reportar resumen diario de Akademate

## Herramientas disponibles
- Prometheus query API: http://cbias-prometheus:9090/api/v1/query
- HTTP GET a endpoints Akademate (via Tailscale)
- Telegram Bot API para notificaciones

## Queries Prometheus clave
- CPU: 100 - (avg(irate(node_cpu_seconds_total{project="akademate",mode="idle"}[5m])) * 100)
- RAM: (1 - (node_memory_MemAvailable_bytes{project="akademate"} / node_memory_MemTotal_bytes{project="akademate"})) * 100
- DB connections: pg_stat_activity_count{project="akademate"}
- Containers running: count(container_last_seen{project="akademate"})
```

### 1.5 Alertas Prometheus — Añadir reglas Akademate

**Archivo:** `configs/prometheus/akademate_alerts.yml`

```yaml
groups:
  - name: akademate
    rules:
      - alert: AkademateServerDown
        expr: up{project="akademate"} == 0
        for: 2m
        labels:
          severity: critical
          project: akademate
        annotations:
          summary: "Akademate server o exporter caído"

      - alert: AkademateHighCPU
        expr: 100 - (avg(irate(node_cpu_seconds_total{project="akademate",mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          project: akademate
        annotations:
          summary: "Akademate CPU > 80%"

      - alert: AkademateHighMemory
        expr: (1 - (node_memory_MemAvailable_bytes{project="akademate"} / node_memory_MemTotal_bytes{project="akademate"})) * 100 > 85
        for: 5m
        labels:
          severity: critical
          project: akademate

      - alert: AkadematePostgresDown
        expr: pg_up{project="akademate"} == 0
        for: 1m
        labels:
          severity: critical
          project: akademate
        annotations:
          summary: "PostgreSQL Akademate ({{ $labels.db }}) caído"
```

---

## PARTE 2: Cambios en Akademate Hetzner (Docker Compose)

### 2.1 Añadir exporters al docker-compose.monitoring.yml

Añadir a `infrastructure/docker/docker-compose.monitoring.yml`:

```yaml
  # ─── cAdvisor (métricas contenedores) ────────────────────────
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    container_name: cadvisor
    restart: unless-stopped
    privileged: true
    devices:
      - /dev/kmsg
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - "127.0.0.1:8080:8080"  # Solo accesible desde host/Tailscale
    networks:
      - monitoring
    labels:
      - "traefik.enable=false"  # No expuesto públicamente

  # ─── Node Exporter — puerto en loopback (solo Tailscale) ──────
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
    ports:
      - "127.0.0.1:9100:9100"  # Solo loopback — accesible vía Tailscale
    networks:
      - monitoring
    labels:
      - "traefik.enable=false"

  # ─── Promtail — envía logs a C-BIAS Loki ──────────────────────
  promtail:
    image: grafana/promtail:2.9.4
    container_name: promtail
    restart: unless-stopped
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./monitoring/promtail.yml:/etc/promtail/config.yml:ro
    networks:
      - monitoring
    labels:
      - "traefik.enable=false"
```

### 2.2 Configuración Promtail → C-BIAS Loki

**Archivo:** `infrastructure/docker/monitoring/promtail.yml`

```yaml
# promtail.yml — Colector de logs Akademate → C-BIAS Loki
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://CBIAS_TAILSCALE_IP:3100/loki/api/v1/push
    # C-BIAS Loki recibe en 3100 (dentro de la red Tailscale)

scrape_configs:
  - job_name: akademate-docker-logs
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: container
      - source_labels: ['__meta_docker_container_label_com_docker_compose_service']
        target_label: service
    pipeline_stages:
      - json:
          expressions:
            level: level
            msg: msg
      - labels:
          level:
      - static_labels:
          project: akademate
          env: production
```

### 2.3 Añadir Tailscale al servidor Akademate

En `infrastructure/scripts/setup-server.sh`, añadir tras Docker:

```bash
echo "==> Instalando Tailscale (para conexión con C-BIAS)..."
curl -fsSL https://tailscale.com/install.sh | sh
# Después del setup: tailscale up --authkey=TAILSCALE_AUTH_KEY
echo "   Ejecuta: tailscale up --authkey=\$TAILSCALE_AUTH_KEY"
echo "   Añade el servidor al tailnet C-BIAS/NAZCAMEDIA"
```

### 2.4 Firewall — solo Tailscale puede acceder a métricas

En `setup-server.sh`, los puertos de métricas NO se abren en UFW:
- `:9100` (node-exporter) — bind a `127.0.0.1` → Tailscale los alcanza via IP Tailscale
- `:8080` (cadvisor) — bind a `127.0.0.1`
- `:9187`, `:9188` (postgres-exporters) — bind a `127.0.0.1`

El tráfico C-BIAS → Akademate va encriptado por Tailscale WireGuard.

---

## PARTE 3: Monitoring Hub en Akademate Dashboard SaaS

### 3.1 Estrategia Vertical

```
SUPERADMIN ve:
  /administracion/estado
  ├── Tab: Servidor Akademate
  │   ├── Widget: CPU/RAM/Disco (datos de Prometheus local)
  │   ├── Widget: Containers (cadvisor)
  │   ├── Widget: postgres-shared health
  │   └── Widget: postgres-enterprise health
  └── Tab: Nodos Enterprise
      ├── Card: CEP Formación
      │   ├── Status: ● Operational
      │   ├── Version: 1.4.2
      │   ├── Métricas: 47 usuarios, 234 matrículas
      │   └── Último heartbeat: hace 5 min
      └── Card: [Próximo cliente Enterprise]
```

### 3.2 API Route: `/api/monitoring/server`

```typescript
// apps/tenant-admin/app/api/monitoring/server/route.ts
// Solo accesible para role = 'superadmin'
// Consulta Prometheus local (dentro del servidor, sin exponer públicamente)

export async function GET(request: Request) {
  // Verificar sesión superadmin
  const session = await getServerSession()
  if (session?.user?.role !== 'superadmin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prometheus corre en la misma red Docker (monitoring)
  const prometheusUrl = process.env.PROMETHEUS_URL ?? 'http://prometheus:9090'

  const [cpu, ram, disk] = await Promise.all([
    fetch(`${prometheusUrl}/api/v1/query?query=...`).then(r => r.json()),
    fetch(`${prometheusUrl}/api/v1/query?query=...`).then(r => r.json()),
    fetch(`${prometheusUrl}/api/v1/query?query=...`).then(r => r.json()),
  ])

  return Response.json({ cpu, ram, disk })
}
```

### 3.3 API Route: `/api/monitoring/nodes`

Llama a los endpoints `/akademate/v1/health` de cada nodo Enterprise registrado en BD.

```typescript
// apps/tenant-admin/app/api/monitoring/nodes/route.ts
// Consulta enterprise_nodes table → hace fetch a /health de cada nodo activo
```

### 3.4 Página existente a ampliar

**Archivo actual:** `apps/tenant-admin/app/(dashboard)/estado/page.tsx`

Ampliar con:
- Prometheus widgets (si rol superadmin)
- Nodos Enterprise cards
- Grafana embed (iframe del dashboard académate del C-BIAS, solo si accede via Tailscale)

---

## PARTE 4: Nanobot Akademate Agent

Un agente IA autónomo especializado en Akademate, independiente de Nanobot C-BIAS pero informado por él.

### Opción A (recomendada): Skill de Nanobot

Añadir `akademate-monitor` como skill de Nanobot C-BIAS. Ya tiene:
- Acceso a Prometheus (puede queriar métricas Akademate)
- Telegram para alertas
- n8n para automatización

**Coste:** ~2 horas. Sin nuevo contenedor.

### Opción B (futuro): Nanobot dedicado en Akademate

Instancia propia de Nanobot en el servidor Akademate, especializada en:
- Monitoreo de los 5 servicios Akademate
- Backups de las 2 BDs
- Health checks de nodos Enterprise
- Alertas Telegram sobre eventos de negocio (nueva matrícula, nuevo tenant, etc.)

**Coste:** +256MB RAM en el servidor Akademate. Para implementar en v1.0.

---

## Orden de Implementación

| Prioridad | Tarea | Repo | Impacto |
|---|---|---|---|
| 1 | Tailscale en Akademate Hetzner | akademate | Habilita todo |
| 2 | node-exporter + cadvisor + promtail en compose | akademate | Métricas y logs al aire |
| 3 | Scrape jobs Akademate en C-BIAS Prometheus | C-BIAS | Métricas visibles en Grafana |
| 4 | Dashboard Grafana `akademate-overview` | C-BIAS | Visibilidad completa |
| 5 | Alertas Prometheus akademate_alerts.yml | C-BIAS | Nanobot alertado |
| 6 | Skill `akademate-monitor` en Nanobot | C-BIAS | Agente IA activo |
| 7 | API routes `/api/monitoring/*` en tenant-admin | akademate | Dashboard SaaS |
| 8 | UI Monitoring Hub en `/administracion/estado` | akademate | Vista para superadmin |
| 9 | `enterprise_nodes` table + endpoints health | akademate | Vertical monitoring |
| 10 | Nanobot dedicado Akademate (Opción B) | akademate | v1.0 milestone |

---

## Variables de Entorno Necesarias

### En Akademate (.env.prod)
```bash
# Monitoring
PROMETHEUS_URL=http://prometheus:9090   # Red Docker interna
CBIAS_LOKI_URL=http://CBIAS_TAILSCALE_IP:3100  # Para promtail

# Tailscale
TAILSCALE_AUTH_KEY=tskey-auth-...       # Generado en admin Tailscale
```

### En C-BIAS (.env)
```bash
# Añadir IP Tailscale de Akademate cuando se cree el servidor
AKADEMATE_TAILSCALE_IP=100.x.x.x       # Asignada por Tailscale
```

---

## Resultado Final

```
Carlos ve en C-BIAS COMMAND (Dashboard):
  → Status card: "Akademate — ● Operational"
  → CPU: 34%, RAM: 61%, Disk: 23%
  → Containers: 7/7 running

Carlos ve en C-BIAS Grafana:
  → Dashboard "Akademate Overview"
  → Logs en Loki con label project=akademate

Nanobot avisa en Telegram:
  → "⚠️ Akademate RAM > 80% — tenant-admin usando 512MB, considerar upgrade"

Carlos ve en Akademate SaaS (/administracion/estado):
  → Servidor: CPU 34%, RAM 61%
  → postgres-shared: 12 conexiones, 2.3GB
  → Nodo CEP: ● Operational, última conexión hace 3min
```
