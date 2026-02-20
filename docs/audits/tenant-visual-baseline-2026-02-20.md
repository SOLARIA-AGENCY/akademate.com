# Tenant Visual Baseline Audit - 2026-02-20

Scope: `apps/tenant-admin/app/(dashboard)` + shell lateral/superior.

## Executive Summary
- Estado general: ⚠ Parcial (base sólida, aún no 100% spec-compliant).
- Cobertura de encabezados: 72/73 páginas con `PageHeader|ComingSoonPage|redirect`.
- Hallazgos críticos P0: 0
- Hallazgos altos P1: 5
- Hallazgos medios P2: 6

## Métricas automáticas
- Páginas analizadas: 73
- Cobertura de header estandarizado: 72
- Archivos con hardcoded colors (`#hex`) en dashboard: 25
- Ocurrencias hardcoded colors (`#hex`) en dashboard: 119

## Hallazgos P1 (alto impacto)

### P1-01 — Shell no alineado al grid spec 80/240/8col
- Evidencia:
  - `apps/tenant-admin/app/(dashboard)/layout.tsx:134` usa `w-64` (256) y colapsado `w-16` (64).
  - `apps/tenant-admin/app/(dashboard)/layout.tsx:148` usa topbar `h-16` (64), no 80.
- Impacto: inconsistencia global de densidad y layout respecto al spec de diseño objetivo.
- Acción: migrar a variables (`--sidebar-expanded:240px`, `--sidebar-collapsed:80px`, `--topbar-height:80px`).

### P1-02 — Sidebar header spacing fuera de baseline
- Evidencia: `apps/tenant-admin/@payload-config/components/layout/AppSidebar.tsx:358` usa `h-16` en header/logo.
- Impacto: desalineación visual del primer bloque con el ritmo vertical deseado.
- Acción: normalizar a altura target y espaciados tokenizados.

### P1-03 — Hardcoded brand colors extendidos
- Evidencia: 119 ocurrencias de `#hex` (ej. `#F2014B`, `#ff2014`) en 25 archivos.
- Impacto: dificulta theming, dark mode coherente y mantenibilidad.
- Acción: reemplazar por tokens (ej. `hsl(var(--primary))`, `--brand-accent`) en UI runtime.

### P1-04 — Tipografías oversized en cards de contenido
- Evidencia: usos `text-4xl` en cards/hero internos (`ciclos/[id]`, `sedes/[id]`, `administracion/suscripcion`, `facturacion/PlanCard`).
- Impacto: rompe jerarquía visual en layouts densos y reduce escaneabilidad.
- Acción: aplicar escala card baseline (24/16/14/16) salvo casos hero explícitos y justificados.

### P1-05 — Único alias pendiente fuera de patrón detectado
- Evidencia: `apps/tenant-admin/app/(dashboard)/dashboard/page.tsx` (re-export técnico).
- Impacto: no funcional, pero aparece fuera del detector de componente base.
- Acción: excluir alias del audit automático o etiquetarlo como `technical alias`.

## Hallazgos P2 (medio)
- P2-01: mezcla de estilos inline `style={{ backgroundColor: '#F2014B' }}` vs clases utilitarias.
- P2-02: valores de spacing no centralizados en algunos bloques legacy.
- P2-03: presets de sombras no tokenizados como niveles semánticos.
- P2-04: steppers presentes pero no unificados por tipo de flujo.
- P2-05: componentes KPI financieros aún heterogéneos entre módulos.
- P2-06: ausencia de lint rule para bloquear hardcoded design values.

## Verificación de estabilidad
- `pnpm --filter tenant-admin typecheck` => PASS
- Sin regresiones de compilación detectadas en esta iteración.

## Recomendación inmediata (siguiente iteración)
1. Ajustar shell global a 80/240/80 en `layout` + `AppSidebar`.
2. Introducir tokens para brand/accent/elevation.
3. Iniciar reemplazo de hardcodes por lotes: `administracion/*`, `programacion*`, `ciclos*`, `facturacion/*`.
4. Aplicar escala tipográfica card en módulos con `text-4xl` no justificado.

