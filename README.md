# Akademate

SaaS multitenant para gestión integral de academias/escuelas. Dominio principal: `akademate.com`. Stack base: Next.js 15 + Payload 3.67+ + Postgres 16 + Drizzle + Tailwind v4/shadcn + Redis/BullMQ + R2/MinIO.

## Documentación
- Especificación inicial: `docs/specs/ACADEIMATE_SPEC.md` (v1.5)
- ADRs: `docs/adr/` (pendiente)
- Informe SaaS enterprise: `docs/INFORME_SAAS_MULTITENANT_ENTERPRISE.md`
- Runbooks: `docs/runbooks/` (pendiente)
- UI Kit de referencia: `https://github.com/SOLARIA-AGENCY/Academate-ui`
- Referencia visual/funcional CEP: `https://github.com/SOLARIA-AGENCY/www.cepcomunicacion.com`

## Estructura propuesta
```
/
├─ apps/
│  ├─ ops/             # Dashboard global
│  ├─ admin-client/    # Dashboard cliente
│  ├─ campus/          # Campus alumno
│  └─ payload/         # Next + Payload API
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

## Próximos pasos sugeridos
1) Inicializar configuraciones base (TS, ESLint/Prettier, Tailwind v4/PostCSS) por app.
2) Crear packages compartidos (db/types/ui/api-client/jobs) siguiendo la spec.
3) Definir ADRs iniciales (multitenancy, auth, storage, UI kit).
4) Configurar CI/CD (GitHub Actions) y plantillas de Docker.

## Nota Codex / Limpieza
- Aviso de snapshot: evitar arrastrar directorios voluminosos sin seguimiento (ej. `apps/cms/@payload-config/components/ui/`) para no ralentizar el análisis; añádelos al `.gitignore` si aparecen en futuros módulos.
