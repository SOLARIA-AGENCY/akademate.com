# Akademate Design Extraction (Imagenes de Referencia)

Fecha: 2026-02-20
Scope: extracción visual/técnica de 9 referencias y traducción a reglas implementables en el Design System de `tenant-admin`.

## 1) Pricing Card + Tooltip contextual
Fuente visual: card “Business” con badge “Popular”, lista de features, precio y CTA verde.

### Anatomía
- Card principal con radio alto (16-24px), fondo claro, borde sutil y sombra suave.
- Header con título fuerte + subtítulo de billing.
- Badge “Popular” en chip de estado (verde).
- Lista de features con check + texto secundario.
- Bloque de precio destacado + unidad temporal.
- CTA full-width al pie con color de acción fuerte.
- Tooltip contextual al hover/focus de feature.

### Reglas
- CTA principal: botón de ancho completo al final del módulo.
- Tooltip: contenido explicativo corto (1-3 líneas), anclado al item.
- Densidad recomendada: `p-4`/`p-6`, `gap-3`, lista vertical compacta.

---

## 2) Desktop Sidebar Spacing Cheat Sheet
Fuente visual: sidebar expandida/colapsada con métricas de spacing.

### Medidas extraídas
- Alto header/brand: ~44px
- Separación header → search: ~16px
- Search block vertical: ~32px
- Section label (Main, Communication): ~16px + separación superior
- Item row nav: ~40px alto
- Gap entre items: ~4px
- Bloque promo interno: ~208px alto aprox
- Footer user row: ~48px alto
- Sidebar expandida: 240px ancho
- Sidebar colapsada: 80px ancho

### Reglas
- Sidebar expanded/collapsed fija: `240/80`.
- Nav item: altura uniforme de 40px, padding horizontal consistente.
- En modo colapsado: iconos centrados visualmente y hover igualmente visible.
- Separadores por grupo con spacing vertical constante.

---

## 3) Elevation / Shadow System
Fuente visual: dos recetas de sombras (alpha 5% y 6%).

### Preset A (alpha 5%)
Color base: `#000000` @ 5%
- `0 0 0 1px`
- `0 1px 1px 0`
- `0 2px 2px 0`
- `0 4px 4px 0`
- `0 8px 8px 0`
- `0 16px 16px 0`

### Preset B (alpha 6%)
Color base: `#000000` @ 6%
- `0 0 0 1px`
- `0 1px 1px -0.5px`
- `0 3px 3px -1.5px`
- `0 6px 6px -3px`
- `0 12px 12px -6px`
- `0 24px 24px -12px`

### Reglas
- Surface/base cards: usar preset A (niveles bajos-medios).
- Overlays/popovers/modales: usar preset B (niveles medios-altos).
- No mezclar sombras arbitrarias fuera de tokens.

---

## 4) Budget KPI Card
Fuente visual: card de presupuesto mensual con slider de progreso y estado.

### Anatomía
- Label de contexto (“Monthly Budget”).
- KPI principal grande (`$12,000`).
- Métricas secundarias en dos columnas (Spend / Remaining).
- Barra/track multicolor de estado.
- Punto activo / hito visual al final del track.
- Estado textual (“Ongoing”).

### Reglas
- KPI numérico protagonista + 2 métricas soporte.
- Progreso con color semántico (safe→warn→critical).
- Acción secundaria opcional en esquina (“More details”).

---

## 5) Neutral Color Scale (AAA pass)
Fuente visual: escalas neutrales light y dark espejadas.

### Escala Light
- Base `#FFFFFF`
- 50 `#FAFAFA`
- 100 `#F5F5F5`
- 200 `#E5E5E5`
- 300 `#D4D4D4`
- 400 `#A3A3A3`
- 500 `#737373`
- 600 `#525252`
- 700 `#404040`
- 800 `#262626`
- 900 `#171717`
- 950 `#0A0A0A`

### Escala Dark (invertida por intención de uso)
- Base `#000000`
- 50 `#0A0A0A`
- 100 `#171717`
- 200 `#262626`
- 300 `#373737`
- 400 `#525252`
- 500 `#8A8A8A`
- 600 `#A3A3A3`
- 700 `#D4D4D4`
- 800 `#E5E5E5`
- 900 `#F5F5F5`
- 950 `#FAFAFA`

### Reglas
- Neutrales para superficies, bordes y texto; estados semánticos van aparte.
- Contraste mínimo AA; objetivo AAA en textos críticos y navegación principal.

---

## 6) Desktop App Grid
Fuente visual: grid desktop con nav lateral + content columns.

### Medidas extraídas
- Frame: 1440x1024
- Header/top panel: 80px alto
- Navigation rail: 240px ancho
- Content columns: 8 columnas
- Column width: 130px
- Gutter: 16px
- Offset / outer margin: 24px

### Reglas
- Layout shell estandar:
  - top bar: 80px
  - left nav: 240px
  - content: grid 8 cols + gutter 16 + margin 24
- Mantener snaps a grid en cards/charts/tablas para consistencia visual.

---

## 7) Typography Hierarchy Card Pattern
Fuente visual: comparación “incorrecto vs correcto”.

### Hallazgos
- Jerarquía rota cuando headline, subheadline, body y button compiten en tamaño.
- Jerarquía correcta cuando cada rol tipográfico tiene salto claro.

### Escala recomendada (desktop card)
- Headline: 24px (o 26px en variantes grandes)
- Subheadline: 16px
- Body: 14px
- Button label: 16px

### Reglas
- Evitar mezclas 26/11/12/18 en la misma card.
- Mantener relaciones estables: Headline > Subheadline > Body ~= Button.

---

## 8) UX Steppers (5 variantes)
Fuente visual: catálogo de steppers horizontales/progresivos.

### Variantes detectadas
1. Segmentado tipo “tabs conectados”
2. Icon-based con línea de progreso
3. Numbered con subrayado por paso
4. Estado por paso (Completed / In Progress / Pending)
5. Minimal line con número/círculo

### Reglas
- Todo wizard multi-step debe incluir estado actual y estado global.
- No esconder pasos futuros; mostrar secuencia completa.
- Definir patrón único por flujo (onboarding, checkout, alta curso).

---

## 9) Traducción a tokens/componentes Akademate

### Nuevos tokens recomendados
- `--elevation-1 ... --elevation-6`
- `--neutral-50 ... --neutral-950` (light/dark mapping)
- `--sidebar-expanded: 240px`
- `--sidebar-collapsed: 80px`
- `--topbar-height: 80px`
- `--grid-gutter: 16px`
- `--grid-margin: 24px`

### Nuevos patrones de componente
- `PricingFeatureCard`
- `ContextTooltip`
- `BudgetKpiCard`
- `AppGridOverlay`
- `SidebarSpacingSpec`
- `StepperShowcase` (5 variantes)
- `TypographyHierarchyDemo`

## 10) Criterios de aceptación para implementación
- Todos los módulos nuevos usan tokens, no valores mágicos.
- Header/sidebar/card/table alineados a grid definido.
- Stepper común para flujos con onboarding o formularios largos.
- Auditoría visual por página con checklist de jerarquía, spacing, contraste y estados.
