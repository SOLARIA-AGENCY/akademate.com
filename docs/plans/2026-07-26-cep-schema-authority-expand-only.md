# CEP multi-entidad: autoridad y expansión nullable

## Decisión

Payload sigue siendo la autoridad operativa de `course-runs`, `enrollments`,
`campaigns`, `leads`, `campuses`, `classrooms`, `staff` y `media`. El esquema
Drizzle es un modelo paralelo parcial: sus tablas homónimas no demuestran
paridad de IDs, campos, relaciones ni lifecycle con las colecciones Payload.
`centers` e `instructors` son, como máximo, aliases semánticos de campus y una
parte de staff. No deben usarse como autoridad de una migración operativa sin
una decisión posterior y evidencia de correspondencia.

## Expansión propuesta (no aplicada)

El primer cambio de esquema, si se aprueba posteriormente, será exclusivamente
expand-only: relación nullable `legal_entity` en `campuses`, `classrooms`,
`course-runs`, `enrollments`, `campaigns` y `leads`. No habrá `NOT NULL`, índices
únicos, hooks, ACL, endpoints, jobs ni activación en esa iteración.

`staff` conserva una identidad maestra compartida; sus acuerdos locales deberán
vivir en un recurso de asignación independiente. `media` permanece compartido
por tenant y no hereda propietario del uploader ni de sus consumidores. El
estado actual de ambos, sin tenant directo en la colección auditada, es una
brecha externa que debe resolverse antes de afirmar aislamiento runtime.

## Contrato del dry-run

`packages/tenant/src/multi-entity-schema-expansion-plan.ts` solo acepta registros
sintéticos o bindings previamente revisados. No contiene readers ni clientes de
base de datos. Clasifica cada recurso como:

- `ready`: propietario revisado único y dependencias compatibles, o master
  compartido sin asignación local.
- `missing`: falta un propietario revisado explícito.
- `ambiguous`: existen varios propietarios o se intenta asignar silenciosamente
  un master compartido.
- `cross_scope`: el propietario revisado, existente o dependiente cruza entidad.

Una propuesta solo puede ser `set_if_null`. Su rollback es
`null_if_unchanged`: restaura `NULL` únicamente si el valor actual sigue siendo
exactamente el escrito por esa propuesta. Nunca reemplaza ni borra un valor
preexistente o modificado después.

## Adaptador Payload preparatorio

`apps/tenant-admin/src/multi-entity/schema-expansion-payload-loader.ts` exporta un
loader source-level para formar las entradas del planner desde un
`PayloadRequest` ya autenticado. Solo funciona con contexto explícito
`environment: staging`, conserva `overrideAccess: false`, pagina con límites y
no registra rutas, jobs, hooks, ACL ni operaciones de escritura.

En el esquema legado, el loader no solicita `legal_entity`: el propietario solo
puede proceder de bindings inyectados con referencia `review://`. Sin binding,
el planner deja el registro en `missing`; varios propietarios revisados lo dejan
en `ambiguous`, siempre con `operation: none`. Declarar
`legalEntityFieldAvailable: true` habilita la lectura del valor existente, pero
no autoriza una migración ni un backfill.

La lectura queda limitada a `campuses`, `classrooms`, `course-runs`,
`enrollments`, `campaigns` y `leads`. Para `enrollments`, el tenant del
`course_run` se comprueba con una segunda lectura acotada. `staff` y `media` se
rechazan porque el esquema actual no permite demostrar en esa colección un
límite tenant seguro. El adaptador nunca deriva entidad legal de campus, curso,
usuario, rol, dominio, slug o nombre.

## Fuera de alcance

No se aplicaron migraciones ni backfills, no se consultaron datos reales durante
la validación source-level y no se tocaron roles, memberships o permisos
efectivos. Quedan pendientes la decisión
formal del nombre/colección de entidades legales, la correspondencia Payload ↔
tablas físicas/Drizzle, una migración generada y revisada, y ensayos con backup
restaurado en staging antes de cualquier activación.
