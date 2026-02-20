# Storybook Roadmap - Tenant Admin (2026-02-20)

## Objetivo
Levantar un Storybook operativo para el sistema visual de `tenant-admin`, usarlo como contrato UI y base de QA visual en el Ralph Loop.

## Estado actual
- Storybook instalado en `apps/tenant-admin` con framework `@storybook/nextjs`.
- Configuración inicial en `apps/tenant-admin/.storybook`.
- Stories base creadas para fundamentos (`Button`, `Badge`, `Input`, `Card`) y patrón Akademate (`PageHeader`).

## Plan de implementación (Ralph Loop)
1. Foundations (hecho)
- Tokens visuales y componentes base.
- Objetivo: documentar variaciones principales y estados.

2. Layout Shell
- Story de sidebar expanded/collapsed.
- Story de topbar con notificaciones/perfil.
- Criterio: validar centrado, hover y activos en colapsado.

3. Módulos académicos
- Stories compuestas para cards/listados de `Cursos`, `Ciclos`, `Sedes`, `Campus`.
- Criterio: jerarquía tipográfica homogénea en todo el dashboard.

4. Estados UX
- Empty, loading, error, success para tablas y cards.
- Criterio: no dejar estados visuales sin cubrir.

5. Accesibilidad y QA
- Ejecutar addon a11y sobre stories críticas.
- Integrar `build-storybook` en CI (paso no bloqueante inicial).

## Comandos
- Desarrollo local:
  - `pnpm --filter @akademate/tenant-admin storybook`
- Build estático:
  - `pnpm --filter @akademate/tenant-admin build-storybook`

## Entregables siguientes
- Historias de `AppSidebar`, `PageHeader` avanzado y patrones de tablas de dashboard.
- Checklist visual por sección del tenant dashboard mapeada contra Storybook.
