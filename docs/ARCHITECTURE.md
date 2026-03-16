# Akademate Architecture Overview

**Version:** 2.0.0
**Last Updated:** March 2026
**Status:** Production — Hetzner Docker Stack

---

## Infrastructure Overview (Hetzner Cloud)

Akademate opera sobre **dos servidores Hetzner** con roles bien diferenciados:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HETZNER CLOUD                                     │
│                                                                             │
│  ┌─────────────────────────────┐    ┌────────────────────────────────────┐  │
│  │   Proyecto: CBIAS           │    │   Proyecto: AKADEMATE              │  │
│  │   IP: 100.69.163.44         │    │   akademate-prod (CX23 #113412533) │  │
│  │   Tipo: CAX11 (ARM64)       │    │   IP: 46.62.222.138                │  │
│  │   OS: Ubuntu 24.04          │    │   IPv6: 2a01:4f9:c012:25e8::/64   │  │
│  │                             │    │   Tipo: CX23 (2 vCPU Intel, 4 GB) │  │
│  │   Servicios:                │    │   OS: Ubuntu 24.04                 │  │
│  │   • Grafana (métricas)      │    │   Disco: 80 GB (55% usado)        │  │
│  │   • Prometheus (scraping)   │◄───┤                                    │  │
│  │   • Loki (logs)             │    │   Contenedores (Docker):           │  │
│  │   • CrowdSec (seguridad)    │    │   • traefik v3.2 (:80/:443)       │  │
│  │                             │    │   • akademate-web (:3006)          │  │
│  │   Acceso: Tailscale VPN     │    │   • akademate-tenant (:3009)       │  │
│  │   (red NEMESIS)             │    │   • akademate-ops (:3010)          │  │
│  │                             │    │   • akademate-db postgres:16       │  │
│  └─────────────────────────────┘    └────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │   Servidores Enterprise (futuro — uno por cliente dedicado)         │   │
│  │   Ej: cep-prod (si CEP Formación firma Enterprise)                  │   │
│  │   • Servidor CX/CAX independiente                                   │   │
│  │   • Base de datos dedicada (PostgreSQL propio)                      │   │
│  │   • Dominio propio (cepformacion.es)                                │   │
│  │   • Gestionado desde akademate-prod                                 │   │
│  │   • Métricas enviadas a CBIAS Grafana                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Servidor CBIAS (Central de Monitoreo)

| Parámetro | Valor |
|-----------|-------|
| Nombre | cbias-central (o similar) |
| Hetzner Project | CBIAS |
| IP Pública | — (solo acceso Tailscale) |
| IP Tailscale | `100.69.163.44` |
| Tipo | CAX11 (ARM64, 2 vCPU Ampere, 4 GB RAM) |
| OS | Ubuntu 24.04 |
| Rol | Monitoreo central de todos los proyectos |

**Stack de monitoreo:**
- **Grafana** — Dashboards de métricas para todos los servidores
- **Prometheus** — Scraping de métricas desde akademate-prod + clientes enterprise
- **Loki** — Agregación de logs
- **CrowdSec** — Detección de amenazas a nivel de red

> CBIAS es privado — solo accesible via Tailscale (red NEMESIS). No tiene IP pública expuesta.

---

### Servidor akademate-prod (Producción Akademate)

| Parámetro | Valor |
|-----------|-------|
| Nombre | akademate-prod |
| ID Hetzner | #113412533 |
| IP Pública | `46.62.222.138` |
| IPv6 | `2a01:4f9:c012:25e8::/64` |
| Tipo | CX23 (2 vCPU Intel Xeon, 3.7 GB RAM, 40 GB SSD) |
| OS | Ubuntu 24.04 LTS |
| Disco usado | ~20 GB / 38 GB (55%) |
| Acceso SSH | `ssh -i ~/.ssh/akademate-prod root@46.62.222.138` |
| Alias SSH | `ssh akademate-prod` |

**Contenedores activos:**

| Contenedor | Imagen | Puerto interno | Estado | Rol |
|------------|--------|----------------|--------|-----|
| `traefik` | traefik:v3.2 | 80, 443 → público | Healthy | SSL termination + reverse proxy |
| `akademate-web` | akademate-web:latest | 3006 | Healthy | Landing page pública |
| `akademate-tenant` | akademate-tenant:latest | 3009 | Healthy | Dashboard de academias (tenant) |
| `akademate-ops` | akademate-ops:latest | 3010 | Healthy | Panel de administración SaaS |
| `akademate-db` | postgres:16-alpine | 5432 (internal) | Healthy | Base de datos PostgreSQL compartida |

**Estructura de directorios en servidor:**
```
/opt/akademate/
├── backups/          # Dumps periódicos de PostgreSQL
├── cep/              # Config específica CEP Comunicación
├── monitoring/       # Configuración Prometheus exporters
├── repo/             # Código fuente (git clone)
├── shared/           # Volumenes compartidos (media, uploads)
├── traefik/          # Configuración Traefik
│   ├── traefik.yml   # Config principal
│   └── conf.d/       # Dynamic routing por dominio
├── tenant-admin/     # Docker compose tenant
├── ops/              # Docker compose ops
└── web/              # Docker compose web
```

---

### Routing DNS → Contenedor (Traefik)

| Dominio | Contenedor destino | Puerto | Notas |
|---------|-------------------|--------|-------|
| `akademate.com` | akademate-web | 3006 | www → no-www redirect |
| `www.akademate.com` | akademate-web | 3006 | Redirect 301 a raíz |
| `app.akademate.com` | akademate-tenant | 3009 | Dashboard genérico tenants |
| `cepcomunicacion.akademate.com` | akademate-tenant | 3009 | Tenant CEP Comunicación |
| `admin.akademate.com` | akademate-ops | 3010 | Panel SaaS operaciones |

**SSL:** Let's Encrypt automático via Traefik certresolver.

**Archivos de routing:** `/opt/akademate/traefik/conf.d/`
- `web.yml` — akademate.com + www
- `app.yml` — app.akademate.com
- `cep-comunicacion.yml` — cepcomunicacion.akademate.com
- `tenant-admin.yml` — admin.akademate.com

---

### Modelo Enterprise: Servidores Dedicados por Cliente

Cuando un cliente firma plan Enterprise dedicado (€1200/mes), recibe:

```
┌─────────────────────────────────────────────────────┐
│  cliente-prod (Hetzner CX23/CX32)                   │
│  IP: <dedicada>                                     │
│                                                     │
│  Contenedores:                                      │
│  • traefik (SSL propio del dominio del cliente)     │
│  • akademate-tenant (instancia exclusiva)           │
│  • akademate-db (PostgreSQL dedicado = isolación     │
│    total de datos)                                  │
│                                                     │
│  Dominio: cepformacion.es (DNS propio del cliente)  │
│                                                     │
│  Gestionado desde: admin.akademate.com              │
│  Métricas enviadas a: CBIAS Grafana (100.69.163.44) │
└─────────────────────────────────────────────────────┘
```

Ventajas del modelo dedicado:
- Aislamiento completo de datos (GDPR / cumplimiento normativo)
- SLA independiente (no comparte recursos con otros tenants)
- Personalización avanzada (dominio propio, branding completo)
- Capacidad de crecer el servidor sin afectar a otros clientes

---

### Workflow de Deployment

```bash
# 1. Build imagen amd64 (desde MacBook M-chip)
docker buildx build --platform linux/amd64 \
  -t akademate-ops:latest \
  -f apps/admin-client/Dockerfile \
  --load .

# 2. Exportar + enviar al servidor
docker save akademate-ops:latest | \
  gzip | \
  ssh -i ~/.ssh/akademate-prod root@46.62.222.138 \
  'gunzip | docker load'

# 3. Reiniciar contenedor en servidor
ssh akademate-prod \
  'cd /opt/akademate/ops && docker compose up -d --no-deps akademate-ops'

# 4. Verificar salud
ssh akademate-prod 'docker ps --format "{{.Names}} {{.Status}}"'
```

---

## Executive Summary

Akademate is a multi-tenant SaaS platform for training institutions. The architecture follows a monorepo structure with clear separation between applications, shared packages, and infrastructure.

| Metric | Value |
|--------|-------|
| Apps | 7 |
| Packages | 12 |
| Unit Tests | 641 |
| E2E Tests | 44 |
| Quality Score | 7.0/10 |

---

## System Architecture

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                      INTERNET                           │
                                    └───────────────────────────┬─────────────────────────────┘
                                                                │
                                    ┌───────────────────────────▼─────────────────────────────┐
                                    │                    LOAD BALANCER                        │
                                    │               (Nginx / Cloudflare)                      │
                                    └───────────────────────────┬─────────────────────────────┘
                                                                │
                    ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
                    │                                           │                                           │
        ┌───────────▼───────────┐               ┌───────────────▼───────────────┐           ┌───────────────▼───────────────┐
        │   @akademate/web      │               │   @akademate/portal           │           │   @akademate/admin-client     │
        │   Public Website      │               │   Tenant Portal               │           │   SaaS Admin Dashboard        │
        │   :3006               │               │   :3002                       │           │   :3001                       │
        └───────────┬───────────┘               └───────────────┬───────────────┘           └───────────────┬───────────────┘
                    │                                           │                                           │
                    │               ┌───────────────────────────┼───────────────────────────┐               │
                    │               │                           │                           │               │
                    │   ┌───────────▼───────────┐   ┌───────────▼───────────┐   ┌───────────▼───────────┐   │
                    │   │   @akademate/payload  │   │  @akademate/campus    │   │ @akademate/tenant-admin│   │
                    │   │   API + CMS           │   │  Student Campus       │   │  Academy Dashboard    │   │
                    │   │   :3003               │   │  :3005                │   │  :3009                │   │
                    │   └───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘   │
                    │               │                           │                           │               │
                    └───────────────┼───────────────────────────┼───────────────────────────┼───────────────┘
                                    │                           │                           │
                    ┌───────────────▼───────────────────────────▼───────────────────────────▼───────────────┐
                    │                              SHARED PACKAGES LAYER                                    │
                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
                    │  │   api   │ │api-client│ │  auth   │ │ catalog │ │   db    │ │  jobs   │ │  leads  │ │
                    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
                    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │
                    │  │   lms   │ │operations│ │ tenant  │ │  types  │ │   ui    │                         │
                    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                         │
                    └───────────────────────────────────────────┬───────────────────────────────────────────┘
                                                                │
                    ┌───────────────────────────────────────────▼───────────────────────────────────────────┐
                    │                               DATA LAYER                                              │
                    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
                    │  │   PostgreSQL    │  │     Redis       │  │    R2/MinIO     │  │     BullMQ      │  │
                    │  │   (Primary DB)  │  │   (Cache/Queue) │  │   (File Storage)│  │   (Job Queue)   │  │
                    │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
                    └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Architecture

### Domain Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/catalog` | Course catalog management | db | 47 |
| `@akademate/leads` | Lead management & scoring | db | 23 |
| `@akademate/operations` | Enrollments, calendar, attendance | db | - |
| `@akademate/lms` | Learning management system | db | - |

### Infrastructure Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/db` | Drizzle ORM schema & migrations | drizzle-orm | 58 |
| `@akademate/api` | REST API utilities, GDPR, rate limiting | types | 186 |
| `@akademate/auth` | JWT, sessions, password hashing | types | 45 |
| `@akademate/tenant` | Multi-tenant resolution & context | types | 25 |
| `@akademate/jobs` | BullMQ job definitions | types | 8 |

### Shared Packages

| Package | Description | Dependencies | Tests |
|---------|-------------|--------------|-------|
| `@akademate/types` | TypeScript types & Zod schemas | zod | 111 |
| `@akademate/ui` | UI components (shadcn/ui based) | react | - |
| `@akademate/api-client` | Multi-tenant API SDK | types | 20 |

### Package Dependency Graph

```
                          ┌─────────────┐
                          │   @types    │
                          └──────┬──────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐             ┌─────────┐             ┌─────────┐
   │   db    │             │   api   │             │  auth   │
   └────┬────┘             └────┬────┘             └────┬────┘
        │                       │                       │
        │         ┌─────────────┼─────────────┐        │
        │         │             │             │        │
        ▼         ▼             ▼             ▼        ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ catalog │ │  leads  │ │operations│ │   lms   │ │ tenant  │
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Multi-Tenancy Architecture

### Tenant Resolution Strategy

```
Request → [X-Tenant-ID Header] → [Cookie] → [Subdomain] → [Custom Domain]
                 ↓                  ↓            ↓               ↓
            API calls         Sessions      demo.akademate.io  custom.com
```

### Database Isolation

- **Strategy:** Row-Level Security (RLS) with `tenant_id` column
- **Schema:** Shared tables with tenant isolation via policies
- **Indexing:** All queries filtered by `tenant_id` first

```sql
-- Example RLS policy
CREATE POLICY tenant_isolation ON courses
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Tenant Context Flow

```typescript
// packages/tenant/src/middleware.ts
export async function tenantMiddleware(req, res, next) {
  const resolution = getFullTenantResolution(req.headers)
  if (!resolution.isValid) {
    return res.status(400).json({ error: 'Tenant required' })
  }
  req.tenantId = resolution.tenantId
  next()
}
```

---

## Application Architecture

### Apps Overview

| App | Purpose | Framework | Port |
|-----|---------|-----------|------|
| `web` | Public marketing site | Next.js 15 | 3006 |
| `portal` | Tenant student portal | Next.js 15 | 3002 |
| `admin-client` | SaaS administration | Next.js 15 | 3001 |
| `tenant-admin` | Academy management | Next.js 15 | 3009 |
| `campus` | Student LMS | Next.js 15 | 3005 |
| `payload` | CMS + API backend | Payload 3 | 3003 |
| `ops` | Operations dashboard | Next.js 15 | - |

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Login  │────▶│  Auth   │────▶│   JWT   │
└─────────┘     └─────────┘     │ Package │     │  Token  │
                                └─────────┘     └────┬────┘
                                                     │
                                                     ▼
                                               ┌─────────┐
                                               │ Session │
                                               │ (Redis) │
                                               └─────────┘
```

---

## Data Architecture

### Core Schema Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                          TENANT                                 │
│  id, slug, name, settings, branding, plan_id                   │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │    COURSES      │     │     LEADS       │
│ tenant_id (FK)  │     │ tenant_id (FK)  │     │ tenant_id (FK)  │
│ role, email     │     │ title, price    │     │ email, status   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   COURSE_RUNS   │              │
         │              │ start, end, seats│             │
         │              └────────┬────────┘              │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   ENROLLMENTS   │
                        │ user_id, run_id │
                        │ status, paid    │
                        └─────────────────┘
```

### GDPR Data Handling

- **Article 5:** Data minimization in collection
- **Article 7:** Consent tracking with `consent_logs` table
- **Article 15:** Data export via `GDPRExportService`
- **Article 17:** Right to erasure via `GDPRDataDeletionService`

---

## Security Architecture

### Authentication

- **Method:** JWT + Session tokens
- **Storage:** Redis for sessions, HTTPOnly cookies for tokens
- **Password:** Argon2id hashing (via `@akademate/auth`)

### Authorization

- **Model:** Role-Based Access Control (RBAC)
- **Roles:** `super_admin`, `admin`, `manager`, `user`, `student`
- **Granularity:** Tenant-scoped permissions

### Rate Limiting

```typescript
// packages/api/src/rateLimit.ts
export const rateLimiters = {
  api: new RateLimiter({ max: 100, window: '1m' }),
  auth: new RateLimiter({ max: 5, window: '15m' }),
  upload: new RateLimiter({ max: 10, window: '1h' }),
}
```

---

## Testing Architecture

### Test Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  44 tests
                    │ (Playwright)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Integration │  ~100 tests
                    │   Tests     │
                    └──────┬──────┘
                           │
            ┌──────────────▼──────────────┐
            │        Unit Tests           │  541 tests
            │         (Vitest)            │
            └─────────────────────────────┘
```

### Test Commands

```bash
# Unit tests
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode

# E2E tests
pnpm test:e2e          # Run all E2E tests
pnpm test:e2e:web      # Web portal only
pnpm test:e2e:admin    # Admin client only
pnpm test:e2e:mobile   # Mobile viewport
pnpm test:e2e:ui       # Interactive UI mode
```

---

## Deployment Architecture

> Ver sección **Infrastructure Overview** al inicio de este documento para la arquitectura completa y actualizada de Hetzner.

### Resumen Stack Producción (marzo 2026)

```
Internet → Traefik v3.2 (SSL) → Docker containers en akademate-prod
                                 ├── akademate-web (Next.js 15, :3006)
                                 ├── akademate-tenant (Next.js 15 + Payload 3, :3009)
                                 ├── akademate-ops (Next.js 15, :3010)
                                 └── akademate-db (PostgreSQL 16, :5432 interno)
```

**No hay Redis, Nginx, PM2 ni BullMQ activos en producción actualmente.** El stack es deliberadamente simple: Next.js standalone + PostgreSQL + Traefik.

### CI/CD Pipeline

```
[Push] → [Lint/Type Check] → [Unit Tests] → [Build Docker amd64] → [Deploy manual ssh]
```

El deploy es manual actualmente (no hay GitHub Actions para producción). La automatización es work-in-progress.

---

## Related Documentation

- [Multitenancy ADR](./adr/0001-multitenancy.md)
- [Authentication ADR](./adr/0002-auth.md)
- [Storage ADR](./adr/0003-storage.md)
- [UI Kit ADR](./adr/0004-ui-kit.md)
- [CI/CD ADR](./adr/0005-ci-cd.md)
- [Audit Report December 2025](./AUDIT_REPORT_DIC2025.md)
- [Project Milestones](./PROJECT_MILESTONES.md)

---

## Appendix: Quick Reference

### Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Run tests
pnpm test
pnpm test:e2e

# Database
pnpm db:generate    # Generate migrations
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio

# Linting
pnpm lint
pnpm format
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `S3_ENDPOINT` | R2/MinIO endpoint | Yes |
| `S3_ACCESS_KEY` | Storage access key | Yes |
| `S3_SECRET_KEY` | Storage secret key | Yes |

---

*Actualizado: Marzo 2026*
*Akademate v1.x — Stack Docker/Hetzner*
