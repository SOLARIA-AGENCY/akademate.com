# AUDIT_LEADS

Fecha: 2026-04-21
Scope: `/app/(app)/(dashboard)/leads/page.tsx`

## 1) Auditoria de codigo

### 1.1 Ubicaciones principales
- Pagina `/leads`: `apps/tenant-admin/app/(app)/(dashboard)/leads/page.tsx`
- API listado/kpis: `apps/tenant-admin/app/api/leads/route.ts`, `apps/tenant-admin/app/api/leads/dashboard/route.ts`
- API interacciones (nota rapida): `apps/tenant-admin/app/api/leads/[id]/interactions/route.ts`
- API cambio estado: `apps/tenant-admin/app/api/leads/[id]/route.ts`

### 1.2 Filtros detectados (antes del refactor)
- Buscador inline
- Filtro `Tipo` inline
- Filtro `Estado` inline
- Filtro `Vistas operativas` inline

### 1.3 Ficha de lead detectada (antes)
- Render en fila compacta con nombre/contacto/origen/programa + badges + `lastInteractor` + `interactionCount` + `timeAgo`.

### 1.4 Campos renderizados y procedencia
- `first_name`, `last_name` -> `fullName(lead)`
- `email`, `phone` -> ficha
- `lead_type | type` -> badge tipo
- `status` -> badge estado
- `source_form/source_page/source_details` -> `resolveLeadOrigin`
- `callback_notes/source_details/course_name/campaign_code/utm_campaign` -> `resolveLeadProgramLabel`
- `lastInteractor.name/channel` -> metadata operacional
- `interactionCount` -> contador contactos
- `createdAt | created_at` -> antiguedad (`timeAgo`)
- `next_action_date`, `enrollment_id`, `gdpr_consent` -> vistas operativas

### 1.5 Hallazgos sobre campos ambiguos
- `Sistema` provenia de `lead.lastInteractor.name` sin etiqueta semantica de rol.
- Numero `4/8/10/9` provenia de `lead.interactionCount` y se mostraba como `Nx`.
- `x` era solo sufijo de formato (`${interactionCount}x`), no accion real.

### 1.6 Duplicidad tipo/estado
- En dataset de ejemplo, varios leads comparten `Inscripcion` + `Contactado`; la combinacion de filtros inline generaba ruido visual.

### 1.7 Inconsistencia estado `No interesado` vs `Descartado`
- El sistema soporta ambos (`not_interested`, `discarded`).
- Antes no quedaba clara la diferencia al filtrar/leer fichas.
- Se normalizo visualmente con etiquetas explicitas:
  - `No interesado (recuperable)`
  - `Descartado (definitivo)`

## 2) Auditoria UX

### 2.1 Elementos interactivos above-the-fold (antes)
- Buscador (1)
- Botones `Tipo` (4)
- Botones `Estado` (8)
- Botones `Vistas operativas` (5)
- Total aprox: **18 controles** antes del primer lead.

### 2.2 Lectura operativa <3 segundos
- Antes: baja, por saturacion de filtros y ficha comprimida.
- Ahora: mejora por tabs operativas, badge de vencido y acciones inline.

### 2.3 Acciones rapidas sin abrir ficha
- Antes: no disponibles directamente en listado.
- Ahora: `Llamar`, `WA`, `Email`, `Nota rapida`, cambio de estado inline.

### 2.4 Campos sin etiqueta semantica clara
- `interactionCount` mantiene ambiguedad funcional (intentos vs interacciones efectivas).
- Se dejo `// TODO: clarificar...` en el componente para trazabilidad.

## 3) Cambios implementados

- Barra de trabajo nueva:
  - Buscador siempre visible
  - Tabs operativas con contador por bandeja
  - Boton `Filtros avanzados` en `Sheet` (Tipo + Estado)
- KPIs reducidos a 4 visibles:
  - Total leads
  - Sin atender
  - Vencidos hoy
  - T. respuesta media
- KPIs secundarios movidos a panel expandible (`Metricas extendidas`).
- Ficha redisenada en 3 zonas:
  - Identidad + programa + badges
  - Contacto/origen + ultima nota + antiguedad
  - Acciones rapidas + estado inline + abrir ficha
- Estado vacio renovado con CTA `Ver todos los leads`.
- Flag visual de lead test (`Badge Test`) por `is_test` o heuristica.

## 4) Restricciones respetadas

- Sin cambios de modelo de datos de lead.
- Sin cambios en endpoints existentes.
- Compatibilidad preservada para filtros actuales (reorganizados en panel avanzado).

## 5) Pendientes sugeridos

- Confirmar definicion de negocio exacta entre `not_interested` y `discarded` para automatizaciones futuras.
- Confirmar semantica de `interactionCount` para texto final en UI y reporting.
