# Akademate

SaaS multitenant para gestión integral de academias/escuelas. Dominio principal: `akademate.com`. Stack base: Next.js 15 + Payload 3.67+ + Postgres 16 + Drizzle + Tailwind v4/shadcn + Redis/BullMQ + R2/MinIO.

## Documentación
- Especificación inicial: `docs/specs/ACADEIMATE_SPEC.md` (v1.5)
- ADRs: `docs/adr/` (pendiente)
- Informe SaaS enterprise: `docs/INFORME_SAAS_MULTITENANT_ENTERPRISE.md`
- **Auditoría Diciembre 2025:** `docs/AUDIT_REPORT_DIC2025.md` (7.0/10 - Producción-ready con remediación)
- Runbooks: `docs/runbooks/` (pendiente)
- UI Kit de referencia: `https://github.com/SOLARIA-AGENCY/Academate-ui`
- Referencia visual/funcional CEP: `https://github.com/SOLARIA-AGENCY/www.cepcomunicacion.com`

## Estructura actual
```
/
├─ apps/
│  ├─ portal/          # Portal desarrollo (localhost:3008) - Acceso a todos los dashboards
│  ├─ admin-client/    # Akademate Admin SaaS (localhost:3004) - Gestión multitenant
│  ├─ tenant-admin/    # Dashboard Cliente (localhost:3009) - Gestión academias (CEP template)
│  ├─ campus/          # Campus alumno (localhost:3005)
│  └─ payload/         # Next + Payload API (localhost:3003)
├─ packages/
│  ├─ db/              # Drizzle schema/migrations/seeds
│  ├─ types/           # TS + zod
│  ├─ ui/              # shadcn/ui + tokens
│  ├─ api-client/      # SDK multitenant
│  └─ jobs/            # Procesadores BullMQ
├─ infra/
│  ├─ docker/          # Dockerfiles, compose
│  ├─ terraform/ansible# Hetzner + LB
│  └─ scripts/         # backups, restore, scaling
├─ .github/workflows/  # CI/CD
└─ docs/               # specs, adr, runbooks
```

## Workspace
- pnpm workspaces (`pnpm-workspace.yaml`)
- Node 22+, pnpm 9+

## Oficina digital de obra (DFO) para seguimiento
- Ubicación única **dentro de este repo**: `infra/solaria-digital-field--operations` (no clonar fuera).
- Arranque mínimo (dashboard + MySQL):  
  ```bash
  cd infra/solaria-digital-field--operations
  cp .env.example .env    # solo la primera vez; ya viene uno listo para Akademate.com
  docker-compose up -d dashboard-backend mysql
  # Dashboard: http://localhost:3030  (Acceso rápido o carlosjperez / SolariaAdmin2024!)
  ```
- Arranque completo (agentes, minio, redis, postgres, nginx):  
  ```bash
  docker-compose up -d
  ```
- Ingestar progreso de Akademate al dashboard:  
  ```bash
  pnpm ingest-akademate
  ```
- MCP listo para agentes (Codex/Claude/Gemini CLI):  
  ```bash
  # Desde la raíz de akademate.com
  nohup pnpm exec mcp-server-playwright --port 8793 --headless --host 127.0.0.1 >/tmp/mcp-playwright.log 2>&1 &
  # Config de cliente:
  # "mcpServers": { "playwright": { "url": "http://127.0.0.1:8793/mcp" } }
  ```
- Modo todo-en-uno (un solo contenedor):  
  ```bash
  cd infra/solaria-digital-field--operations
  docker compose -f docker-compose.single.yml up -d   # arranca MySQL + dashboard en el mismo contenedor
  ```
- Desmontar la oficina al cerrar proyecto: `docker-compose down -v` (o con `-f docker-compose.single.yml`).
- MCP DFO (API completa: proyectos/tareas/alertas/logs):  
  ```bash
  pnpm mcp:dfo    # expone MCP por stdio; usar en tu cliente MCP
  # Config de ejemplo (Claude/Codex):
  # "mcpServers": { "solaria-dashboard": { "command": "pnpm", "args": ["-C", "/Users/carlosjperez/Documents/GitHub/akademate.com", "mcp:dfo"] } }
  ```
- MCP UI (opcional, navegación/playwright): `pnpm mcp:playwright` (servidor MCP headless para abrir dashboard/health).
- Smoke UI/ API con Playwright: `pnpm test:ui:dfo` (requiere oficina corriendo en http://localhost:3030).

## Dashboards disponibles

| Dashboard | Puerto | URL | Descripción |
|-----------|--------|-----|-------------|
| Portal | 3008 | http://localhost:3008 | Centro de acceso a todos los dashboards |
| Akademate Admin | 3004 | http://localhost:3004 | Dashboard SaaS multitenant (gestión negocio) |
| Tenant Admin | 3009 | http://localhost:3009 | Dashboard cliente/academias (template CEP) |
| Payload CMS | 3003 | http://localhost:3003/admin | Backoffice y API |
| Campus Virtual | 3005 | http://localhost:3005 | Portal del alumno |
| SOLARIA DFO | 3030 | http://localhost:3030 | Digital Field Operations |

## Arranque desarrollo
```bash
# Instalar dependencias
pnpm install

# Levantar todos los dashboards
pnpm dev

# O individualmente:
pnpm --filter @akademate/portal dev      # Portal :3008
pnpm --filter @akademate/admin-client dev # Admin :3004
pnpm --filter @akademate/tenant-admin dev # Tenant :3009
pnpm --filter @akademate/payload dev      # Payload :3003
pnpm --filter @akademate/campus dev       # Campus :3005
```

## Próximos pasos sugeridos
1) Personalización de branding por tenant (ver `apps/tenant-admin/BRANDING_CUSTOMIZATION_ROADMAP.md`)
2) Definir ADRs iniciales (multitenancy, auth, storage, UI kit)
3) Configurar CI/CD (GitHub Actions) y plantillas de Docker
4) Integración completa Payload <-> Tenant Admin

## Nota Codex / Limpieza
- Aviso de snapshot: evitar arrastrar directorios voluminosos sin seguimiento (ej. `apps/cms/@payload-config/components/ui/`) para no ralentizar el análisis; añádelos al `.gitignore` si aparecen en futuros módulos.
