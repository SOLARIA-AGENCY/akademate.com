# AUDIT_LEADS_INSCRIPCIONES_UNIFICACION_Y_CLASIFICACION

## Resumen ejecutivo
- Causa raíz detectada: `/leads` y `/inscripciones` consumían `GET /api/leads` sin una clasificación comercial de procedencia por campaña activa de Meta.
- Solución aplicada: clasificación central en backend (`bucket=leads|inscripciones`) + enriquecimiento de cada lead con metadatos comerciales.
- Resultado: ambas bandejas ya no dependen de filtros visuales; la separación ocurre en API y ambas usan un componente de tarjeta compartido.

## Causa exacta del solapamiento
1. `/leads` consultaba `/api/leads` global (sin segmentación comercial).
2. `/inscripciones` solo filtraba por `lead_type=inscripcion`.
3. No existía una función única de bucket comercial (ads activo vs orgánico/no resuelto).
4. Se mostraban slugs técnicos (`source_form`) en UI como procedencia final.

## Campos identificados para clasificación
- Identidad lead: `id`, `first_name`, `last_name`, `email`, `phone`.
- Clasificación operativa: `status`, `lead_type`, `priority`.
- Trazabilidad origen: `source_form`, `source_page`, `source_details`.
- Tracking paid: `campaign`, `campaign_code`, `utm_campaign`, `utm_source`, `meta_campaign_id`, `ad_id`, `adset_id`, `fbclid`, `fbc`, `fbp`.
- Enriquecimiento de gestión: `assignedTo`, `lastInteractor`, `interactionCount`.

## Regla de clasificación aplicada
Implementada en `apps/tenant-admin/lib/leads/commercialBuckets.ts`:

1. **Lead (bucket `leads`)**
- Si existe match con campaña **activa y meta-like** (por id, token UTM/código, o meta campaign id activo), se clasifica en `leads`.

2. **No resuelto (bucket `unresolved`)**
- Si hay señales Meta (utm/meta ids/fbclid/source meta) pero no se puede resolver una campaña activa válida.
- En UI se visualiza en `/inscripciones` con badge `Origen no resuelto`.

3. **Inscripción orgánica (bucket `inscripciones`)**
- Tráfico y formularios sin señal de campaña Meta activa.

## Cambios técnicos aplicados

### Backend
- Archivo: `apps/tenant-admin/app/api/leads/route.ts`
- Añadido parsing de query:
  - `bucket=leads`
  - `bucket=inscripciones`
  - Alias: `commercial_bucket`
- Enriquecimiento por lead con:
  - `commercial_bucket`
  - `commercial_origin_label`
  - `commercial_source_label`
  - `commercial_campaign_label`
  - `commercial_unresolved`
  - `commercial_ads_active`
  - `commercial_reason`
- Si hay bucket, la paginación se aplica tras clasificar, para evitar solapamiento lógico entre bandejas.

### Frontend (unificación visual)
- Nuevo componente compartido:
  - `apps/tenant-admin/app/(app)/(dashboard)/_components/CommercialIntakeCard.tsx`
- `/leads` refactorizado para usar la tarjeta común.
- `/inscripciones` refactorizado para usar la misma tarjeta común.
- Eliminada exposición de slugs técnicos en primer nivel de ficha.
- Procedencia mostrada de forma legible (origen + fuente), más badges operativos.

### Fuentes de datos por vista
- `/leads`: `GET /api/leads?bucket=leads`
- `/inscripciones`: `GET /api/leads?bucket=inscripciones`
  - Incluye `unresolved` por diseño.

## Decisiones de UI
- Patrón único de tarjeta en ambas bandejas:
  - Nombre completo
  - Estado (badge semántico)
  - Programa/curso/convocatoria legible
  - Contacto (email/teléfono)
  - Procedencia legible
  - CTA fijo `Ver ficha`
- `/leads` mantiene acciones rápidas operativas (llamar, WA, email, nota, cambio de estado) dentro del mismo card pattern.

## Gaps detectados y fallbacks
1. No todas las campañas activas locales exponen `meta_campaign_id` persistido.
- Fallback: matching por `campaign` relación + `utm_campaign/campaign_code` + señales Meta.

2. Hay registros históricos con trazabilidad incompleta.
- Fallback: clasificar como `unresolved` y mostrar en inscripciones con badge.

3. Algunas fuentes antiguas guardan metadata en `source_details` JSON parcial.
- Fallback robusto: extracción defensiva de campos en runtime.

## TODOs recomendados de backend
1. Persistir `meta_campaign_id` de forma canónica en colección `campaigns` (si no está normalizado en todos los tenants).
2. Añadir snapshot explícito `commercial_bucket` en el alta del lead para auditoría histórica inmutable.
3. Añadir tests API para:
- `bucket=leads`
- `bucket=inscripciones`
- casos `unresolved`.
