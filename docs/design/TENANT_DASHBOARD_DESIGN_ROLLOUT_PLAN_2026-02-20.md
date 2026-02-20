# Plan de Auditoría e Implementación Visual - Tenant Dashboard

Fecha: 2026-02-20
Objetivo: aplicar de forma completa y verificable los patrones extraídos de referencias visuales al dashboard tenant.

## Resumen Ejecutivo
- Resultado esperado: UI consistente en spacing, grid, tipografía, elevación y componentes clave (pricing/budget/stepper/sidebar).
- Alcance: páginas `(dashboard)` + shell global (`layout/sidebar/header/footer`) + flujos de cursos/campus/configuración.
- Enfoque: auditoría por lotes + implementación incremental + gates de QA visual/funcional.

## Fase 1 - Baseline y Auditoría (P0)
1. Inventariar todas las páginas y mapearlas por plantilla visual (listado, detalle, wizard, settings).
2. Ejecutar checklist base por página:
   - Grid (80/240/8cols/16/24)
   - Header con `PageHeader`
   - Jerarquía tipográfica correcta
   - Sidebar spacing y hover consistentes
   - Tokens de color/sombra sin hardcode
3. Marcar severidad de hallazgos:
   - P0: rompe uso o navegación
   - P1: inconsistencia visual fuerte
   - P2: desalineación menor

Entregable: `docs/audits/tenant-visual-baseline-<fecha>.md`

## Fase 2 - Tokenización y Fundaciones (P0/P1)
1. Consolidar tokens:
   - neutrales light/dark
   - elevaciones A/B
   - métricas de shell/grid/sidebar
2. Reemplazar estilos mágicos (`hex`, sombras ad-hoc, tamaños aislados) por tokens.
3. Validar contraste AA/AAA en textos y navegación.

Gate:
- `pnpm --filter tenant-admin typecheck`
- no hardcodes críticos en shell y componentes base.

## Fase 3 - Componentización (P1)
1. Crear/estandarizar patrones reutilizables:
   - Pricing feature card con tooltip
   - Budget KPI card
   - Stepper suite (5 variantes)
   - Sidebar spec-compliant items
2. Integrar en módulos de mayor uso:
   - Cursos
   - Campus Virtual
   - Configuración
   - Administración

Gate:
- Screenshots de referencia por módulo
- sin regresiones de navegación ni layout shift grave.

## Fase 4 - Rollout por Ondas (P1/P2)
1. Onda A: Shell global + dashboard principal.
2. Onda B: Cursos + Programación + Planner.
3. Onda C: Campus Virtual + Analíticas + Leads.
4. Onda D: Configuración + Administración + Ayuda.

Cada onda incluye:
- implementación
- revisión visual comparativa
- test funcional smoke
- deploy staging

## Fase 5 - QA Integral y Cierre (P0/P1)
1. QA visual desktop (1440) y tablet/mobile.
2. QA interacción:
   - hover/focus/active
   - modales/sheets/tooltips
   - steppers y formularios largos
3. QA rendimiento visual:
   - evitar reflows innecesarios
   - revisar densidad y legibilidad

Criterio de cierre:
- 0 P0, 0 P1 abiertos
- documentación actualizada en design-system
- checklist firmado por módulo.

## Backlog técnico recomendado
- Añadir test visual automatizado (Playwright screenshots por ruta crítica).
- Crear lint rule para prohibir colores/sombras hardcodeadas fuera de tokens.
- Añadir dashboard de cobertura visual (% páginas conformes).

