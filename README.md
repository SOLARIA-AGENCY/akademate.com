# Akademate

SaaS multitenant para gestión integral de academias/escuelas. Dominio principal: `akademate.com`. Stack base: Next.js 15 + Payload 3.67+ + Postgres 16 + Drizzle + Tailwind v4/shadcn + Redis/BullMQ + R2/MinIO.

## Documentación
- Especificación inicial: `docs/specs/ACADEIMATE_SPEC.md` (v1.5)
- ADRs: `docs/adr/` (pendiente)
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

## Próximos pasos sugeridos
1) Inicializar configuraciones base (TS, ESLint/Prettier, Tailwind v4/PostCSS) por app.
2) Crear packages compartidos (db/types/ui/api-client/jobs) siguiendo la spec.
3) Definir ADRs iniciales (multitenancy, auth, storage, UI kit).
4) Configurar CI/CD (GitHub Actions) y plantillas de Docker.

## Nota Codex / Limpieza
- Aviso de snapshot: evitar arrastrar directorios voluminosos sin seguimiento (ej. `apps/cms/@payload-config/components/ui/`) para no ralentizar el análisis; añádelos al `.gitignore` si aparecen en futuros módulos.
