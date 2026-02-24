# AKADEMATE Cliente Platform — Sprint Plan (2026-02-22)

## Executive Summary
- ✓ Objetivo: reconstruir la plataforma cliente de AKADEMATE sobre la base funcional CEP Formación, migrando UI a `akademate-ui` (shadcn) y habilitando personalización por tenant.
- ✓ Color base oficial por defecto: azul de la web pública AKADEMATE.
- ✓ Prioridad: paridad funcional CEP -> AKADEMATE + arquitectura multitenant configurable (nombre, logo, colores).
- 📌 Resultado esperado en 3 sprints: shell cliente nuevo, módulos core operativos, theming por tenant en producción.

## Prompt Optimizado (intención CTO)
```md
Construir la plataforma cliente de AKADEMATE (`akademate.com`) usando el MVP de CEP Formación como baseline funcional y de conexiones, migrando la interfaz completa a componentes `akademate-ui` (shadcn).

Requisitos críticos:
1) Mantener paridad funcional de CEP en los módulos core.
2) Implementar arquitectura multitenant estricta (`tenant_id`, aislamiento, roles).
3) Activar personalización por tenant: nombre, logo, paleta (color principal por defecto: azul AKADEMATE).
4) Todas las nuevas vistas deben usar design system (`akademate-ui`) y componentes reutilizables.
5) Entregar por fases con criterios de aceptación, pruebas y despliegue incremental.

Entregables:
- Matriz CEP -> AKADEMATE por módulo.
- Shell cliente nuevo con navegación, permisos y theming runtime.
- Módulos core migrados y validados.
- Panel de personalización por tenant.
- Plan de release y hardening final.
```

## Scope y Principios
- In Scope:
  - Dashboard cliente AKADEMATE (nueva base UI shadcn).
  - Migración de módulos funcionales CEP prioritarios.
  - Branding multi-tenant runtime.
- Out of Scope (fase posterior):
  - Reescritura total de lógica de negocio ya estable si no aporta valor inmediato.
  - Nuevas features no existentes en CEP sin impacto en release cliente.

## Matriz Base CEP -> AKADEMATE (MVP)
- Dashboard general CEP -> Dashboard Cliente AKADEMATE.
- Gestión de cursos/convocatorias CEP -> Catálogo AKADEMATE.
- Leads/marketing CEP -> CRM AKADEMATE.
- Gestión de alumnos/matrículas CEP -> Alumnos e Inscripciones AKADEMATE.
- Configuración visual CEP -> Branding por tenant AKADEMATE.
- Soporte/operativa CEP -> Módulo soporte cliente AKADEMATE.

## Configuración Tenant (contrato mínimo)
- `tenant_name`
- `tenant_slug`
- `logo_light_url`
- `logo_dark_url`
- `favicon_url`
- `theme_primary`
- `theme_secondary`
- `theme_accent`
- `theme_surface`
- `theme_text`

Reglas:
- Default del sistema: `theme_primary` azul AKADEMATE.
- Carga runtime por dominio/subdominio.
- Aplicación por CSS variables + tokens del design system.

## Plan por Sprints

### Sprint 1 — Plataforma Base y Branding Runtime
Progress [0/3]
- [ ] 1. Shell cliente AKADEMATE (layout, nav, header, auth guard, RBAC base).
- [ ] 2. Theming runtime por tenant (nombre/logo/colores) con fallback azul oficial.
- [ ] 3. Migración visual de páginas core de entrada (dashboard + listados principales) a componentes `akademate-ui`.

Entregables:
- `apps/tenant-admin` con shell homogéneo shadcn.
- Provider de tenant/theme activo por dominio.
- Primer set de pantallas CEP migradas visualmente sin regresión funcional.

Criterios de aceptación:
- ✓ Login + navegación estable.
- ✓ Cambio de tenant refleja branding sin redeploy.
- ✓ Typecheck/build sin errores.

### Sprint 2 — Migración de Módulos Core (paridad CEP)
Progress [0/5]
- [ ] 1. Catálogo (cursos, convocatorias, ciclos, sedes) migrado en UI shadcn.
- [ ] 2. CRM/Leads migrado y conectado.
- [ ] 3. Alumnos + matrículas migrado.
- [ ] 4. Soporte cliente (vista y flujos clave) migrado.
- [ ] 5. Integración completa de tablas/filtros/acciones con componentes modulares reutilizables.

Entregables:
- Paridad funcional CEP en módulos core priorizados.
- Componentes reutilizables documentados (tabla, filtros, formularios, actions bar, headers).

Criterios de aceptación:
- ✓ Flujos core CEP ejecutables en AKADEMATE cliente.
- ✓ Sin hardcodes de color/marca por página.
- ✓ Tests smoke por módulo.

### Sprint 3 — Personalización Avanzada, Hardening y Release
Progress [0/4]
- [ ] 1. Panel de personalización por tenant (nombre/logo/paleta) con preview en tiempo real.
- [ ] 2. QA transversal (accesibilidad, responsive, performance, contrastes).
- [ ] 3. Hardening seguridad multitenant (roles, auditoría, validaciones).
- [ ] 4. Release plan y despliegue controlado en NEMESIS + checklist GO-LIVE.

Entregables:
- UI de personalización operativa.
- Checklist de release y runbook de rollback.
- Versión candidata a producción.

Criterios de aceptación:
- ✓ Tenant onboarding configurable sin tocar código.
- ✓ P0/P1 cerrados.
- ✓ Veredicto GO de QA + CTO.

## Backlog Priorizado
- P0:
  - Shell cliente + branding runtime.
  - Módulos core con paridad CEP.
  - RBAC y aislamiento tenant.
- P1:
  - Panel avanzado de personalización y preview.
  - Cobertura de tests funcionales clave.
- P2:
  - Optimización UX/performance adicional.
  - Variantes visuales extra y automatización de diseño.

## Riesgos y Mitigación
- ⚠ Riesgo: divergencia funcional CEP vs AKADEMATE durante migración.
  - Mitigación: matriz de paridad por módulo + pruebas de regresión por flujo.
- ⚠ Riesgo: inconsistencias visuales por uso mixto de componentes legacy.
  - Mitigación: regla de bloqueo: toda vista nueva/migrada usa `akademate-ui`.
- ⚠ Riesgo: tenant branding incompleto en algunas rutas.
  - Mitigación: provider único de theme y auditoría automática de hardcodes.

## KPIs de ejecución
- KPI-1: % módulos CEP core migrados a AKADEMATE.
- KPI-2: % pantallas cliente con componentes `akademate-ui`.
- KPI-3: % rutas con branding runtime correcto por tenant.
- KPI-4: incidencias P0 abiertas por sprint.

## Next Actions (inmediatas)
- 1) Congelar alcance de módulos core de Sprint 2.
- 2) Crear tablero de implementación por rutas reales en `apps/tenant-admin/app/(dashboard)`.
- 3) Iniciar Sprint 1 con PR de shell + tenant theme provider + migración dashboard principal.
