# Akademate — Estrategia de Infraestructura y Modelo de Negocio

**Versión:** 1.0
**Fecha:** 2026-03-10
**Estado:** Definición inicial — pendiente implementación

---

## 1. Visión General

Akademate es una plataforma SaaS de gestión para academias y centros de formación. La arquitectura distingue dos planos:

- **Plano central (`akademate.com`)** — SaaS multitenant compartido. Gestiona clientes Starter y Pro, monitoriza nodos Enterprise, controla facturación y soporte.
- **Plano Enterprise (servidores dedicados)** — Instancias aisladas por cliente. Base de datos propia, dominio propio, personalización total. Conectadas al central vía API.

---

## 2. Planes Comerciales

| Plan | Infraestructura | BD | Dominio | Precio referencia |
|------|----------------|-----|---------|-------------------|
| **Starter** | Cluster compartido | Schema compartido | Subdominio akademate.com | ~€199/mes |
| **Pro** | Cluster compartido | Schema compartido | Dominio propio (CNAME) | ~€299/mes |
| **Enterprise** | Servidor Hetzner dedicado | PostgreSQL independiente | Dominio propio (A record) | ~€599+/mes |
| **Perpetual** | Servidor propio del cliente | Independiente | Propio | Licencia única |

---

## 3. Modelo Enterprise — Licencia Vitalicia

### 3.1 Estructura temporal

```
Meses 1-24   →  Plan Enterprise (cuota mensual/anual)
              Servidor Hetzner gestionado por Akademate
              Plataforma conectada al central
              Soporte incluido

Mes 25+      →  Opción de compra: Licencia Permanente Akademate
              Precio = 2.5-3× cuota anual (descuento por fidelidad)
```

### 3.2 Lo que incluye la Licencia Permanente

- Derecho de uso perpetuo de la versión adquirida
- Tres opciones de hosting:
  - **A) Transferencia Hetzner** — el servidor pasa a la cuenta del cliente (más sencillo)
  - **B) Migración on-premise** — exportación completa + instalación en hardware del cliente
  - **C) Nuevo servidor cliente** — cliente contrata VPS propio, Akademate migra
- Manual de operaciones + documentación técnica completa
- Desconexión limpia del plano central

### 3.3 Lo que NO incluye (requiere contrato adicional)

- Actualizaciones de versiones mayores (contrato de mantenimiento anual)
- Soporte técnico activo (contrato de soporte anual con SLA)
- Acceso al dashboard central de Akademate

### 3.4 Contrato de No Reventa — puntos clave

**Prohibido:**
- Revender acceso a la plataforma a terceros
- Usar el software como base de un producto competidor
- Distribuir o instalar en múltiples servidores sin nueva licencia
- Sublicenciar a otras entidades
- Eliminar referencias de autoría de Akademate del código

**Permitido:**
- Uso interno ilimitado (alumnos, cursos, staff propios)
- Personalización visual completa (ya incluida en Enterprise)
- Contratar técnicos externos para mantenimiento de su instancia
- Migrar de servidor (la licencia es del software, no del servidor)

### 3.5 License Check técnico

Incluso en modo Perpetual, el software realiza una validación de licencia contra `license.akademate.com` cada 30 días. Si no se valida en 90 días → modo degradado (funcionalidad limitada, no bloqueo total). Esto permite detectar uso no autorizado.

---

## 4. Cliente 0 — CEP Formación

CEP Formación es el primer cliente Enterprise. Sirve como **prueba de concepto del modelo Enterprise** y define el playbook para clientes futuros.

### 4.1 Dominios

| Dominio | Estado actual | Estado final |
|---------|--------------|--------------|
| `cepcomunicacion.com` | ~~Cloudflare Pages estático~~ → **301 a cursostenerife.es** | Web pública Akademate CEP |
| `cursostenerife.es` | WordPress/LucusHost (SEO principal) | 301 permanente a cepcomunicacion.com |
| `admin.cepcomunicacion.com` | No existe | Dashboard admin CEP (tenant-admin) |

**Estado actual (modo obras):**
- `cepcomunicacion.com` redirige 301 a `cursostenerife.es` ✅ (activo desde 2026-03-10)
- Todo el tráfico y SEO consolidado en `cursostenerife.es` durante la construcción
- El email de `cepcomunicacion.com` (Google Workspace MX) no se ve afectado

**Flip final (cuando el servidor Enterprise esté listo):**
- `cursostenerife.es` → 301 → `cepcomunicacion.com`
- `cepcomunicacion.com` sirve la plataforma Akademate Enterprise CEP

### 4.2 Tracking CEP

| Propiedad | ID | Dominio |
|-----------|----|---------|
| GA4 | `G-347NGFNZ90` | cepcomunicacion.com |
| GTM | `GTM-5D4839F3` | cepcomunicacion.com |
| GA4 | `G-KFVWD6LVCB` | cursostenerife.es |
| Facebook Pixel | `831036194188836` | cursostenerife.es |

### 4.3 Entradas de la plataforma CEP

1. **Web pública** (`cepcomunicacion.com`) — lo que ven los alumnos potenciales: catálogo de cursos, landing de captación, preinscripciones. Sustituye a cursostenerife.es.
2. **Dashboard admin** (`admin.cepcomunicacion.com`) — lo que usa el equipo de CEP: gestión de cursos, alumnos, matrículas, comunicaciones.

---

## 5. API de Conexión Central ↔ Nodo Enterprise

### 5.1 Principio de diseño

El nodo Enterprise es **soberano** — opera de forma autónoma aunque el central caiga. El central es el **plano de control** — visibilidad, facturación, soporte, actualizaciones.

### 5.2 Autenticación

- **API Key** generada al provisionar el nodo, almacenada como hash en el central
- **HMAC-SHA256** en cada request: `X-Akademate-Signature: HMAC(body + timestamp, secret)`
- **Rotación** de keys desde el panel central sin downtime

### 5.3 Endpoints del Nodo (exposición hacia el central)

**Base URL:** `https://api.{dominio-cliente}/akademate/v1/`

```
GET  /health          → Estado del nodo en tiempo real
GET  /metrics         → Métricas de negocio agregadas (30 días)
GET  /plan            → Plan activo y límites
POST /events          → Webhook de eventos hacia el central (iniciado por el nodo)
```

#### GET /health — respuesta
```json
{
  "status": "operational",
  "version": "1.4.2",
  "uptime_seconds": 864000,
  "db": "connected",
  "storage_mb_used": 2340,
  "timestamp": "2026-03-10T09:00:00Z"
}
```

#### GET /metrics — respuesta
```json
{
  "period": "last_30_days",
  "active_users": 47,
  "courses_total": 12,
  "courses_active": 8,
  "enrollments_total": 234,
  "enrollments_new": 31,
  "leads_captured": 89,
  "revenue_eur": 18400
}
```

#### POST /events — payload del nodo
```json
{
  "event": "enrollment.created",
  "node_id": "cep-formacion",
  "data": { "course_id": "aux-farmacia", "count_today": 5 },
  "timestamp": "2026-03-10T09:15:00Z"
}
```

**Eventos relevantes:** `enrollment.created`, `lead.captured`, `payment.received`, `storage.warning`, `deploy.updated`, `error.critical`

### 5.4 Endpoints del Central (exposición hacia el nodo)

**Base URL:** `https://api.akademate.com/enterprise/v1/`

```
GET  /plan/validate              → Validación de licencia (1×/día)
GET  /nodes/:node_id/releases    → Versión recomendada
POST /nodes/:node_id/alert       → Notificaciones del central al nodo
```

### 5.5 Modelo de datos en el central

```sql
enterprise_nodes (
  id, node_id, name, api_key_hash,
  server_ip, server_region, server_provider,
  plan_expires_at, last_heartbeat_at,
  status, version, created_at
)

enterprise_metrics (
  node_id, period_date,
  active_users, enrollments, leads, revenue_eur,
  storage_mb, recorded_at
)

enterprise_events (
  node_id, event_type, payload, received_at
)
```

---

## 6. Estrategia de Infraestructura — Escalado por Clientes de Pago

### 6.1 Fase 0 — NEMESIS (beta, 0-10 clientes)

- Servidor actual en producción: `176.84.6.230`
- Coolify como orquestador
- PostgreSQL compartido (multitenant por `tenant_id`)
- Sin coste adicional de infraestructura
- **Límite:** ~10 tenants con tráfico moderado

### 6.2 Fase 1 — Cluster v1 (trigger: 1er cliente de pago)

Desplegar cluster dedicado en Hetzner:

| Componente | Tipo | Coste/mes |
|------------|------|-----------|
| Load Balancer | Hetzner LB11 | €6 |
| App Node 1 | CX22 (2vCPU/4GB) | €7 |
| App Node 2 | CX22 (2vCPU/4GB) | €7 |
| DB Primaria | CX32 (4vCPU/8GB) | €16 |
| DB Réplica | CX22 (2vCPU/4GB) | €7 |
| **Total** | | **~€43/mes** |

Con Coolify, almacenamiento, backups y R2 para medios: **~€80-100/mes total**

### 6.3 Umbrales de escalado

| Clientes pago | Acción infraestructura | Coste incremental |
|---|---|---|
| 1er pago | Desplegar Cluster v1 | +€80/mes |
| 10 clientes | +1 App Node (CX22) | +€7/mes |
| 20 clientes | DB upgrade a CX52 + 1 App Node | +€25/mes |
| 1er Enterprise | Hetzner dedicado aislado | +€40-60/mes por cliente |
| 50+ clientes | Revisión arquitectura completa | A calcular |

**Regla simple de escalado horizontal:**
```
Trigger: CPU > 70% sostenido 15 min  →  alerta
Trigger: RAM > 80%                   →  alerta crítica → provisionar node
Ratio: ~10-12 tenants activos por CX22
```

### 6.4 Estrategia de base de datos

| Rango tenants | Estrategia DB | Razón |
|---|---|---|
| 0-20 | Schema compartido (`tenant_id` en tablas) | Simple, suficiente |
| 20-50 | Database-per-tenant (PostgreSQL schemas) | Aislamiento, migraciones más fáciles |
| 50+ | Database-per-tenant + sharding geográfico | Performance |

Los tenants **Enterprise siempre tienen BD propia** desde el día 1 (en su servidor dedicado).

### 6.5 Separación de tráfico por plan

```
Starter/Pro  →  Cluster compartido (app nodes balanceados)
Enterprise   →  Servidor dedicado propio (nunca en el cluster)
```

Los clientes Enterprise nunca comparten recursos con clientes Starter/Pro.

---

## 7. Hoja de Ruta de Implementación

### Inmediato (ya hecho)
- [x] Redirect 301 `cepcomunicacion.com → cursostenerife.es` (Cloudflare Worker, 2026-03-10)

### Próximo Sprint
- [ ] Definir límites técnicos por plan (cursos, alumnos, storage)
- [ ] Implementar tabla `enterprise_nodes` en BD central
- [ ] Endpoint `/health` en instancias
- [ ] Vista "Nodos Enterprise" en Gestor SaaS

### Cuando CEP firme Enterprise
- [ ] Provisioning script Hetzner (levanta servidor, instala stack, genera API key)
- [ ] Deploy Akademate Enterprise CEP
- [ ] Configurar DNS `cepcomunicacion.com` y `admin.cepcomunicacion.com`
- [ ] Flip final: `cursostenerife.es → cepcomunicacion.com`

### Cuando llegue el 1er cliente de pago (Starter/Pro)
- [ ] Desplegar Cluster v1 en Hetzner
- [ ] Configurar Load Balancer
- [ ] Migrar NEMESIS → Cluster v1
- [ ] Monitoreo automático con Prometheus/Grafana

---

## 8. Referencias

- Servidor NEMESIS: `176.84.6.230` (Tailscale: `100.99.60.106`)
- Cloudflare cuenta: NAZCAMEDIA (`522997f4f57193b06db3286d8d6f2778`)
- Worker redirección CEP: `cep-redirect` (Version: `44fed4bc-25b7-4acb-9864-3167c88aaa75`)
- CEP Zone ID: `47c5baea8aa5acbf66a84cad238bcb88`
- Ver también: `memory/cep-dominios.md`
