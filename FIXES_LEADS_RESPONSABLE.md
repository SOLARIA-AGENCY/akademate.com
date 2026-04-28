# FIXES_LEADS_RESPONSABLE

## Campo que alimentaba "Sistema" (antes)
- La vista de `/leads` usaba `lead.lastInteractor.name`.
- En `apps/tenant-admin/app/api/leads/route.ts` se forzaba fallback `name: 'Sistema'` cuando no había nombre humano en la última interacción.
- Resultado: el listado mostraba `Responsable: Sistema` aunque hubiese gestión humana en notas/interacciones.

## Campo/fuente usada ahora
Prioridad de responsable aplicada en la ficha de lead:
1. `assignedTo` (resuelto desde `leads.assigned_to_id` o `leads.assigned_to` + join con `users`).
2. `lastInteractor` (última interacción con identidad humana, sin fallback visual a sistema).
3. Fallback final de UI: `Sin asignar`.

## Decisión tomada
- Se aplicó una combinación **A + B + C**:
  - **A (ideal):** si hay usuario asignado, se muestra.
  - **B (fallback):** si no hay asignación, se usa último actor humano de interacción.
  - **C (último recurso):** si no hay actor humano, se muestra `Sin asignar`.
- Se eliminó el fallback visual `Sistema` en la API para `lastInteractor`.
- Se eliminó la tarjeta colapsable de "Métricas extendidas / Ver detalle" de `/leads`.

## Verificación de usuario "Vero" en BD (producción)
Consulta realizada el **2026-04-22** en base de datos de producción:
- `id=7`
- `email=veronica.chacare@cursostenerife.es`
- `name=Veronica Chacare`
- `role=lectura`
- `tenant_id=1`

Observación adicional:
- En leads auditados (`id` 27, 28, 30), `assigned_to_id` estaba `NULL`.
- Existen interacciones de esos leads con `user_id=7`, por lo que el fallback por última interacción humana es necesario cuando no hay asignación explícita.

## TODOs pendientes
- Añadir acción operativa de asignación directa de responsable desde la tarjeta/listado (`Asignar`) para reducir casos `Sin asignar`.
- Si negocio quiere separar "No interesado" y "Descartado" con semántica distinta en todas las vistas, unificar copy/filtros end-to-end.
