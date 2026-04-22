# ADDS_GRAFICAS_ANALITICAS

## Librería elegida
- Se usa `recharts` (ya instalada en `apps/tenant-admin`) para evitar dependencias nuevas y mantener consistencia con React/Next.
- Se implementó una capa mínima de resiliencia con `ChartErrorBoundary` para que un fallo de render en chart no bloquee la pantalla.

## Fuente de datos reutilizada
- Fuente principal: `GET /api/analytics/dashboard?range={7d|30d|90d}` (la misma que alimenta la tabla existente).
- Datos consumidos:
  - `traffic.series_by_granularity` (`hour|day|week|month`)
  - fallback a `traffic.series` cuando no existe una granularidad concreta.
- No se añadieron endpoints nuevos ni llamadas duplicadas para gráficas.

## Componentes añadidos
- `GraficaVisitantesTiempo`
  - Props: `data`, `granularidad`, `showFallbackBanner`, `mode`.
  - Modos:
    - `all`: orgánico + Facebook Ads + Google Ads + total
    - `total`: solo total sesiones
    - `organic`: orgánico + tendencia MA(3)
- `PaidChannelStackedChart`
  - Barras apiladas por canal de pago (`Facebook Ads`, `Google Ads`).
- `FacebookSessionsSpendChart`
  - Doble eje: sesiones (línea) + gasto estimado (barras).
- `HourlyDistributionChart`
  - Barras de distribución horaria (0h-23h), mostrado solo cuando hay datos horarios y granularidad día.

## Integración en UI
- Se conectó el selector de granularidad existente a las gráficas.
- Regla de `Hora`:
  - Solo disponible cuando `range=7d` y hay datos horarios reales.
  - En caso contrario se deshabilita con tooltip explicativo.
- Se añadió gráfica principal en `Visión General` y gráfica adicional de total sesiones vs tiempo.
- En pestaña `Orgánico` se añadió gráfica dedicada (incluye tendencia MA(3)).
- En pestaña `Facebook Ads` se añadió gráfica de sesiones + gasto estimado.
- En pestaña `Google Ads` se reemplazó bloque vacío por `EmptyState` con CTA de conexión.
- Se mantiene la tabla de detalle `Fecha | Orgánico | Pago | Facebook | Google | Total` y su coherencia con los mismos datos de fuente.

## Banner de calidad de dato
- Cuando GA4 está en fallback interno (`source_health.traffic === 'internal'`), la gráfica principal muestra banner:
  - "Datos de sesiones basados en Meta API + estimación interna."

## TODOs cuando GA4 esté conectado
- Añadir serie horaria real (sin estimación) para mejorar análisis intradía.
- Sustituir "gasto estimado" de Facebook por serie diaria de gasto real desde API.
- Habilitar visualización real de Google Ads cuando la integración pase de `pending_connection`.
- Considerar guardar preferencia de granularidad por usuario/tenant.
