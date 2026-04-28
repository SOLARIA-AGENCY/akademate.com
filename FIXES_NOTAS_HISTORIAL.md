# FIXES_NOTAS_HISTORIAL

## Modelo actual de datos (notas/actividades)
- Se usa una sola tabla: `lead_interactions`.
- Campos relevantes: `lead_id`, `user_id`, `channel`, `result`, `note`, `tenant_id`, `created_at`.
- No existe columna `type` dedicada en este modelo actual.

## Campo discriminador usado
- Se usa `result` como discriminador funcional:
  - Nota manual del asesor: `result = 'note_added'`
  - Eventos de estado/sistema: `result = 'status_changed'`, `enrollment_started`, etc.

## Dónde se originaba la "creación automática" percibida
- En `apps/tenant-admin/app/api/leads/route.ts` se inserta automáticamente un evento de traza de origen (`status_changed`) al crear lead.
- En `apps/tenant-admin/app/api/leads/[id]/route.ts` se insertan eventos `status_changed` al actualizar estado/ficha.
- El problema de UI era que el bloque de notas permitía mezclar estas entradas con notas del asesor.

## Cambios aplicados
### 1) Notas del asesor: solo manuales
- En `apps/tenant-admin/app/(app)/(dashboard)/inscripciones/[id]/page.tsx`:
  - `advisorNotes` ahora filtra exclusivamente `result === 'note_added'` con autor humano.
  - El bloque de notas deja de mostrar eventos de sistema/auditoría.
  - Se mantiene creación de nota sin recargar página (inserción local inmediata).

### 2) Borrado de notas con confirmación
- Se añadió botón de eliminar por nota en UI (visible cuando `can_delete=true`).
- Confirmación obligatoria vía `AlertDialog`.
- Borrado sin recarga de página (actualización local de estado).
- API añadida en misma ruta:
  - `DELETE /api/leads/[id]/interactions` con `interactionId`.
  - Permisos: autor de la nota o rol admin/superadmin.
  - Restricción: solo permite eliminar `result='note_added'`.

### 3) Separación Bitácora/Historial
- Decisión tomada: **separación semántica sin duplicado**.
- El bloque de notas muestra únicamente notas manuales.
- El bloque "Historial de contacto y auditoría" excluye notas manuales.
- Resultado: un mismo evento ya no aparece en ambos bloques.

### 4) Limpieza de estados internos en UI
- Se añadió normalización de mensajes para `status_changed`.
- Cuando el texto llega como slug interno (`on_hold -> not_interested`, etc.), la UI renderiza versión legible:
  - `En espera -> No interesado`, etc.
- Se evita exposición de raw enums en la vista operativa.

## Raw slugs detectados y mapa aplicado
Detectados en producción (lead 30):
- `new`, `following_up`, `enrolling`, `on_hold`, `not_interested`

Mapa legible aplicado en UI:
- `new` -> `Nuevo`
- `contacted` -> `Contactado`
- `following_up` -> `En seguimiento`
- `interested` -> `Interesado`
- `enrolling` -> `En matriculación`
- `enrolled` -> `Matriculado`
- `on_hold` -> `En espera`
- `not_interested` -> `No interesado`
- `unreachable` -> `No contactable`
- `discarded` -> `Descartado`

## Notas de compatibilidad
- Se mantiene endpoint existente de interacciones (`GET/POST`) y se añade `DELETE` en la misma ruta.
- Se respeta filtrado por `tenant_id` en lectura y borrado.
- No se cambió el esquema físico de `lead_interactions` en este fix.

## TODOs
- Si se exige borrado reversible, añadir `deleted_at` + exclusión en consultas (soft delete).
- Si se desea separar definitivamente auditoría vs notas a nivel persistencia, introducir `type` explícito con migración.
