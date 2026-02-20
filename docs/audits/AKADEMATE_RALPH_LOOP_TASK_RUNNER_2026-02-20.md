# AKADEMATE — Ralph Loop Task Runner (Ejecución Integral)

## Estado
- **Modo:** Ralph Loop activo
- **Fecha inicio:** 2026-02-20
- **Owner:** Codex
- **Objetivo:** Cerrar fallos críticos de auth/runtime y unificar diseño de servicios Akademate.

## Reglas de ejecución por iteración
1. Seleccionar 1-3 tareas pequeñas de alto impacto.
2. Implementar cambios mínimos viables.
3. Ejecutar gates de validación.
4. Registrar evidencia en `LOGS.md`.
5. Commit/push al cerrar cada bloque estable.

## Gates obligatorios
- `pnpm --filter @akademate/tenant-admin exec tsc --noEmit --pretty false`
- Smoke HTTP de servicios (3003/3004/3005/3006/3009)
- Si hay cambios de UI/auth: verificación de rutas clave autenticadas

## Baseline técnico (Iteración 1)
- `:3006` -> 200
- `:3004` -> 307 a `/login`
- `:3003/admin` -> 200
- `:3009` -> 307 a `/auth/login`
- `:3005` -> 200
- Probe Payload auth: `POST /api/users/login` con `admin@akademate.com` => **500** `Something went wrong.`

## Backlog ejecutable (Task Format)

### Fase A — Auth & Runtime P0
- [ ] A1. Payload login root-cause: depurar `500 Something went wrong` en `POST /api/users/login`.
- [ ] A2. Seed/credenciales: validar/crear `ops@akademate.com` (`superadmin`) y admin dev CMS.
- [ ] A3. Ops auth bridge: verificar mapping endpoint/body desde `:3004` hacia Payload.
- [ ] A4. Tenant runtime: eliminar cualquier crash residual en `:3009` rutas core.

### Fase B — Producto P1
- [ ] B1. Web `/cursos`: resolver SSR exception + fallback seguro.
- [ ] B2. Campus credenciales: documentar usuario/clave dev en launchpad.
- [ ] B3. Verificar flujos CRUD mínimos en tenant (cursos, sedes, personal, leads).

### Fase C — Unificación UI
- [ ] C1. Definir y aplicar tokens globales dark navy + glass + CTA azul-cyan.
- [ ] C2. Unificar login Campus a patrón Ops/Payload.
- [ ] C3. Revisar consistencia visual tenant interior (spacing, cards, inputs, botones).
- [ ] C4. Revisar web pública para adherencia a tokens/estilo shadcn (sin romper marketing).

### Fase D — QA & Cierre
- [ ] D1. Auditoría funcional completa por rutas críticas.
- [ ] D2. Auditoría visual con evidencia (capturas + consola + PASS/FAIL por ruta).
- [ ] D3. Informe final GO/NO-GO con P0-P3.

## Rutas críticas de validación
- Tenant: `/dashboard`, `/programacion`, `/planner`, `/cursos`, `/campus-virtual`, `/leads`, `/personal`, `/sedes`, `/administracion/usuarios`, `/campanas`, `/creatividades`, `/perfil`
- Ops: `/login`
- Payload: `/admin/login` + API login
- Web: `/`, `/cursos`
- Campus: `/login`

## Plantilla de cierre de iteración
- **Iteración:** N
- **Tareas ejecutadas:**
- **Cambios:**
- **Tests/Gates:**
- **Resultado:** PASS / PARTIAL / FAIL
- **Próximo paso:**
