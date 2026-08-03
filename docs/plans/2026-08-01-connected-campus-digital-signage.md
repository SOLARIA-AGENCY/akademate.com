# Connected Campus y Digital Signage

**Estado:** Fase 0 avanzada; contratos, compilador, esquema PostgreSQL y aislamiento RLS verificados; runtime de dispositivo pendiente

**Ámbito:** Akademate Next SaaS multitenant

**Exclusiones:** runtime, datos, configuración y despliegue de CEP Formación

## Objetivo

Convertir las pantallas de cada sede en un canal operativo conectado a Akademate. El módulo
publicará calendarios de clases, disponibilidad de salas, avisos, comunicaciones y promociones,
manteniendo control por tenant, sede, zona, horario y rol.

Digital Signage será una **extensión de pago** para todos los planes. La extensión cubre el
software de gestión y publicación contratado. Pantallas, reproductores, soportes, instalación,
conectividad y licencias de proveedores externos se presupuestan por separado.

## Solution Registry

| Enfoque | Idea central | Correctitud | Mantenibilidad | Escalabilidad | Simplicidad | Pragmatismo |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| A. Publicación directa por proveedor | Integrar cada marca de pantalla o player dentro del core | 6 | 5 | 5 | 7 | 5 |
| B. Orquestador multitenant con adaptadores | Modelo canónico de contenido, playlists y dispositivos; cada proveedor se conecta mediante un adaptador validado | 9 | 9 | 9 | 7 | 9 |

**Seleccionado: B.** Mantiene el dominio de Akademate independiente del hardware, permite
incorporar proveedores sin duplicar reglas y concentra aislamiento, auditoría y reintentos.

## Alcance funcional

### Gestión de pantallas

- Registro de reproductores y pantallas por `tenant_id`, sede y zona.
- Código de emparejamiento de un solo uso, rotación de credenciales y revocación remota.
- Estado online, última conexión, versión del player, contenido activo y errores de reproducción.
- Agrupación de dispositivos para publicar por sede, planta, recepción, aula o zona común.

### Contenido y datos operativos

- Calendarios de clases y horarios de salas sincronizados con operaciones académicas.
- Avisos, noticias, cambios de aula, recordatorios, eventos y promociones de cursos.
- Plantillas con identidad visual del tenant y variantes por formato de pantalla.
- Activos multimedia namespaced por tenant en R2/MinIO, con validación de tipo y tamaño.
- Bloques de datos vivos que muestran solo campos expresamente autorizados para publicación.

### Programación y publicación

- Playlists con orden, duración, prioridad, periodo de validez y franja horaria.
- Publicación por sede, zona, grupo de pantallas o dispositivo individual.
- Flujo borrador → revisión → aprobación → publicación, según permisos del tenant.
- Anulación prioritaria para comunicaciones urgentes, con caducidad automática y auditoría.
- Manifiesto versionado para que el player conserve la última programación válida sin conexión.

### Operación 24/7

- Heartbeat, estado de descarga, confirmación de reproducción y alertas de dispositivo.
- Panel de flota con filtros por tenant, sede, zona, estado y versión.
- Reintentos idempotentes mediante jobs tenant-aware y cola separada por tipo de operación.
- Métricas de disponibilidad y reproducción sin capturar imágenes, audio ni datos personales.

## Arquitectura propuesta

1. `@akademate/signage-domain`: tipos, reglas de programación y compilación determinista de
   playlists.
2. `@akademate/signage-adapters`: contrato estable para players y proveedores externos.
3. API tenant-aware para pantallas, contenido, playlists, publicaciones y heartbeats.
4. Worker de publicación para compilar manifiestos, distribuirlos y reconciliar resultados.
5. Workspace de administración en tenant-admin y vista de flota para operaciones.
6. Player web/PWA de referencia con caché offline; players nativos o de terceros usan el mismo
   manifiesto firmado.

Entidades mínimas: `signage_displays`, `signage_display_groups`, `signage_assets`,
`signage_templates`, `signage_playlists`, `signage_playlist_items`, `signage_publications`,
`signage_device_events` y `signage_emergency_overrides`. Todas llevan `tenant_id`; las entidades
operativas añaden `site_id` o un alcance equivalente cuando corresponda.

## Seguridad y privacidad

- RLS y autorización por `tenant_id` en cada lectura y escritura.
- Scopes separados para crear contenido, aprobar publicaciones, gestionar dispositivos y emitir
  alertas urgentes.
- Credenciales de dispositivo hasheadas, de mínimo privilegio y sin acceso a APIs administrativas.
- La revocación de una publicación o credencial es terminal; no puede reactivarse modificando la fila.
- Manifiestos firmados, URLs de activos con expiración y protección frente a replay.
- Auditoría de emparejamiento, aprobación, publicación, anulación y revocación.
- Ningún nombre, nota, asistencia individual u otro dato personal aparece en pantalla por defecto.
- Plantillas con datos personales requieren un propósito documentado y una configuración explícita.

### Frontera de confianza del backend

Las políticas PostgreSQL consumen `app.tenant_id`, `app.site_id`, `app.user_id` y `app.role` como
contexto transaccional. Solo el backend autenticado puede establecerlos y debe derivarlos de la sesión
verificada, nunca de parámetros libres del cliente. Las credenciales del rol de aplicación no se
entregan a navegadores, players, integradores ni consultas SQL genéricas.

RLS protege frente a cruces accidentales o manipulados dentro del rol de aplicación, pero no frente a
la apropiación total de esas credenciales: un atacante con acceso directo a ese rol podría establecer
los GUC de sesión. La custodia del secreto, la autenticación del comando y el establecimiento atómico
del contexto forman, por tanto, la frontera de confianza complementaria a RLS.

## Fases y checklist

### Fase 0 — Contratos y prototipo

- [x] ADR del dominio y contrato de adaptadores.
- [x] Esquema multitenant con RLS y migración monotónica.
- [x] Compilador de playlists con tests deterministas y de solapamientos horarios.
- [ ] Player web de referencia con caché de última programación válida.

### Fase 1 — MVP de una sede

- [ ] Emparejamiento seguro, registro de pantalla y heartbeat.
- [ ] Biblioteca de activos, plantillas, playlists y programación.
- [ ] Calendario de clases, avisos y promociones como bloques operativos.
- [ ] Publicación, revocación, reintentos y registro de auditoría.
- [ ] Dashboard de estado y reproducción.

### Fase 2 — Multi-sede y proveedores

- [ ] Grupos, zonas, permisos y aprobaciones por sede.
- [ ] Adaptadores de proveedores validados con pruebas de contrato.
- [ ] Alertas de dispositivos, actualizaciones y observabilidad de flota.
- [ ] Overrides urgentes con expiración y restauración automática.

### Fase 3 — Automatización y analítica

- [ ] Reglas por cambios de aula, capacidad, inicio de curso y eventos.
- [ ] Métricas de publicación y reproducción con procedencia y frescura.
- [ ] API y webhooks para integradores, con rate limits y scopes.
- [ ] Gestión de consumo para facturación de la extensión.

## Quality Gate

- El tenant A no puede enumerar, emparejar, publicar ni recibir eventos de pantallas del tenant B.
- Un player revocado no puede descargar nuevos manifiestos ni reutilizar credenciales anteriores.
- La pérdida de red conserva únicamente la última programación firmada y aún vigente.
- Una publicación parcial se reconcilia sin duplicar items ni alterar pantallas fuera de alcance.
- Los cambios de zona horaria, horario de verano y periodos solapados tienen comportamiento probado.
- El override urgente caduca y restaura la programación anterior de forma auditable.
- La UI diferencia claramente software incluido en la extensión de hardware y costes externos.
- Ninguna prueba o release de este módulo ejecuta comandos contra CEP Formación.
- El rollback con datos operativos falla cerrado; el rollback vacío revoca primero los privilegios de
  `campuses`, elimina Signage y no deja RLS o grants huérfanos.

## Tres intentos adversariales obligatorios por cambio

1. Cruce de tenant, sede o zona mediante identificadores manipulados.
2. Dispositivo sin conexión, credencial expirada o proveedor no disponible.
3. Variación temporal: solapamiento, cambio horario, contenido caducado o reordenación concurrente.

## Evidencia Fase 0 — 2026-08-02

- ADR: `docs/adr/0009-connected-campus-signage-domain.md`.
- Paquetes: `@akademate/signage-domain` y `@akademate/signage-adapters`.
- 20 pruebas focalizadas y dos typechecks estrictos pasan localmente.
- El compilador cubre repetibilidad estructural en el mismo runtime observado, IDs e instantes canónicos,
  colisiones, solapamientos temporales, ventanas nocturnas y transiciones DST.
- El gateway congela un snapshot de alcance y rechaza antes del dispatch el alcance inválido; el
  decoder rechaza sustitución de alcance, transporte inseguro, digest inválido y recibos ambiguos.
- Migración Next-only: `apps/tenant-admin/migrations/20260802_akademate_next_signage.ts`.
- Descubrimiento físico aislado: `apps/tenant-admin/migrations-next/`, con cinco wrappers exactos y sin
  imports CEP/legacy.
- PostgreSQL 16 aplicó las cinco migraciones Next sobre una base efímera limpia.
- El verificador real confirmó 6 tablas con RLS forzada, 12 políticas, rol de aplicación no-owner,
  no-superuser y sin `BYPASSRLS`, secretos de dispositivo no legibles y 28 intentos adversariales.
- El rollback con datos operativos fue rechazado y conservó la migración y sus cinco tablas.
- El rollback vacío eliminó las cinco tablas Signage, desactivó RLS de `campuses`, revocó sus cuatro
  privilegios DML al rol de aplicación y restauró `tenant_id` nullable.
- Una sede histórica con `tenant_id = NULL` hizo fallar la migración de forma transaccional: no se
  registró la migración, no quedó ninguna tabla Signage parcial y el registro incompatible se conservó.
- No se ha creado firma, player, proveedor, command API, UI ni despliegue. CEP continúa completamente
  fuera de esta implementación.
