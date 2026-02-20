# Ralph Loop - Plan de Implementación Diseño Tenant Dashboard

Fecha: 2026-02-20
Método: iteraciones cortas, evidencia por ciclo, gates de typecheck + smoke visual.

## Objetivo
Cerrar hallazgos P1/P2 del baseline visual y dejar dashboard tenant 100% alineado a spec de diseño (grid, spacing, tokens, tipografía, patrones).

## Iteración 1 (completada) — Baseline
- Output: `docs/audits/tenant-visual-baseline-2026-02-20.md`
- Estado: ✅ completada

## Iteración 2 — Shell Grid Alignment (P1)
- Scope:
  - `app/(dashboard)/layout.tsx`
  - `@payload-config/components/layout/AppSidebar.tsx`
- Cambios:
  - topbar 80px
  - sidebar expanded 240 / collapsed 80
  - sincronizar paddings/margins a grid desktop
- Gate:
  - typecheck PASS
  - smoke rutas: `/dashboard`, `/cursos`, `/campus-virtual`

## Iteración 3 — Tokenización de colores/sombras (P1)
- Scope:
  - crear mapa de tokens brand/elevation
  - sustituir inline colors críticos en módulos P1
- Prioridad de reemplazo:
  1. `administracion/*`
  2. `programacion*`
  3. `ciclos*`
  4. `facturacion/*`
- Gate:
  - reducción mínima 60% de hardcodes
  - typecheck PASS

## Iteración 4 — Tipografía jerárquica card (P1)
- Scope:
  - normalizar títulos y cuerpo en cards principales a escala 24/16/14/16
- Excepciones permitidas:
  - hero explícitos de detalle con justificación
- Gate:
  - auditoría visual comparativa antes/después

## Iteración 5 — Patrones de negocio (P2)
- Scope:
  - aplicar `PricingFeatureCard`, `BudgetKpiCard`, `StepperPattern` en módulos reales
- Módulos objetivo:
  - Facturación
  - Cursos (nueva convocatoria/alta)
  - Campus Virtual (inscripciones)
- Gate:
  - 3 módulos con patrón integrado

## Iteración 6 — QA de consistencia transversal (P1/P2)
- Checklist:
  - hover/focus/active
  - spacing entre secciones
  - contraste AA
  - estados loading/empty/error
- Gate:
  - 0 P1 abiertos
  - backlog P2 documentado

## Iteración 7 — Cierre y despliegue
- Acciones:
  - actualizar docs de design system
  - commit + push
  - deploy NEMESIS
  - smoke endpoints principales
- Gate final:
  - typecheck PASS
  - tenant healthy
  - veredicto GO

## KPIs de progreso
- `% páginas spec-compliant`
- `# hardcodes color en runtime`
- `# hallazgos P1 abiertos`
- `# módulos con patrones nuevos integrados`

