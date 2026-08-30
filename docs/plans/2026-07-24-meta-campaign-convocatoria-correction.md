# Plan de corrección convocatoria–campaña Meta Ads

## Estado

- **Fecha:** 2026-07-24
- **Última incorporación de alcance:** 2026-07-26, objetivo funcional adjunto
- **Fuente de alcance:** texto adjunto `pasted-text.txt`, incorporado como
  contrato funcional y requisitos de aceptación; la existencia de campañas
  activas concretas sigue siendo un dato comunicado por el equipo, no una
  verificación live contra Meta.
- **Situación:** implementación source-level auditada y detrás de flags; pendiente de aprobación y validación en staging
- **Severidad:** P1, asociación incorrecta o ausente en fichas de convocatorias
- **Activación:** prohibida en producción hasta completar staging y rollback
- **Permisos:** no se modifican roles, permisos, memberships ni accesos actuales
- **Integración:** subplan del despliegue multi-entidad CEP; queda condicionado al
  gate `enrollment_campaign_scope_reviewed` por entidad y no sustituye la
  validación financiera ni la futura matriz nominal de permisos.
- **Primer incremento implementado:** existe un endpoint de lectura por
  convocatoria, desactivado por defecto y limitado a `staging`, que prioriza
  `meta_ad_drafts` y devuelve estados `ambiguous`/`unavailable`; las tarjetas,
  listados y ficha individual ya tienen integración source-level opcional, sin
  activar la corrección en las superficies actuales.
- **Contrato de evidencia añadido:** se preparó un registrador source-level
  para una futura ejecución `authenticated_shadow_read_only` con las 56
  vinculaciones tipadas (20 globales y 12 por cada una de las 3 entidades),
  referencias content-addressed y contadores obligatorios de cero escrituras y
  cero cambios de permisos. Este contrato no afirma que exista ejecución real:
  mientras no se aporte un informe autenticado de staging, el registro no puede
  declarar staging listo, desplegar, migrar, activar ni cambiar permisos.

El objetivo funcional facilitado para esta corrección queda incorporado a este
documento como contrato de aceptación. Su incorporación no implica que el
backfill, la vinculación manual, el snapshot ni la activación en staging estén
ejecutados; esos elementos siguen sujetos a las puertas de salida descritas más
abajo.

## Requisitos incorporados del objetivo funcional

La corrección se evaluará con estas reglas, sin reinterpretar la asociación
por curso o por ciclo:

- La clave funcional es `tenant_id + convocatoria_id + meta_campaign_id`.
- El orden de resolución es: relación directa revisada, relación externa
  explícita, candidatos heurísticos solo como sugerencias y estado fail-closed
  cuando no exista una decisión inequívoca.
- `Sin campaña`, `Campaña sin vincular`, `Asociación ambigua` y `Estado no
disponible` son estados distintos. Un error de red, una tabla ausente o una
  integración sin respuesta nunca se presenta como ausencia confirmada.
- El contrato de lectura por convocatoria debe devolver, cuando exista,
  campaña, conjunto de anuncios, anuncio principal, enlaces internos y de Meta
  Ads Manager sin secretos, métricas acotadas a esa campaña/anuncio, fecha de
  sincronización, `source` y marca `stale`.
- La interfaz objetivo comprende tarjetas de ciclos, listados generales y la
  ficha individual `/programacion/{convocatoriaId}`. Estas superficies se
  consideran integradas solo a nivel de código; su validación live/staging
  sigue pendiente.
- Las campañas externas al workflow solo producen candidatos hasta que una
  persona autorizada las vincule. Toda vinculación futura deberá conservar
  actor, fecha y motivo; el backfill inicial será `dry-run` y separará
  `segura`, `ambigua` y `no encontrada`.
- Cada lectura y futura escritura deberá mantener tenant, entidad legal y sede
  como límites de seguridad. Si `legal_entity_id` o `campus_id` no están
  presentes en la fuente legada, deberán llegar mediante una resolución
  revisada; su ausencia, ambigüedad o contradicción devuelve `unavailable` y
  bloquea la asociación. No se acepta inferirlos desde el curso, el ciclo, una
  URL o el nombre de la campaña. Tampoco se aceptan `tenantId` ni
  `metaCampaignId` libres sin comprobar pertenencia al contexto autenticado.
- La batería mínima de aceptación incluye ciclos sin `course`, cursos
  normales, dos convocatorias del mismo curso, campañas de otro tenant,
  workflows repetidos, estados pausado/finalizado/borrador/error, fallo de
  Meta, ambigüedad, enlaces sin tokens, métricas no agregadas y regresión de
  permisos actuales.

Este bloque es contractual y no constituye evidencia de ejecución real contra
Meta, producción o staging.

## Registro de ejecución shadow de staging

Antes de activar cualquier flag en staging se deberá aportar un único artefacto
de ejecución autenticada que enlace cada gate global y cada gate de entidad con
su informe específico. El contrato exige 56 bindings: un binding por cada uno
de los 20 gates globales y tres bindings diferenciados por cada uno de los 12
gates de entidad. Cada binding debe conservar una referencia `review://`, una
referencia `evidence://sha256/...`, el tipo de artefacto específico y su digest;
la envolvente sella el `sourceSha`, el tenant objetivo, los tres informes de
revisión, la instantánea de entrada y la hora UTC.

El artefacto solo puede tener modo `authenticated_shadow_read_only` y veredicto
`registered_for_manual_review`. Sus campos `canDeclareStagingReady`,
`canDeploy`, `canMigrate`, `canActivate` y `canChangePermissions` permanecen en
`false`, y los contadores `writes` y `permissionChanges` deben ser exactamente
`0`. La validación source-level no sustituye la ejecución autenticada ni permite
fabricar evidencia a partir de hashes o referencias locales.

## Integración con el plan multi-entidad CEP

Esta corrección queda subordinada al despliegue sin impacto
[`2026-07-22-cep-multi-entity-zero-impact-rollout.md`](./2026-07-22-cep-multi-entity-zero-impact-rollout.md).
Durante toda la fase de asociación y lectura se mantienen exactamente los
roles, permisos, memberships y accesos actuales; no se activa todavía ningún
aislamiento efectivo ni se cambia la visibilidad de usuarios.

El contrato de scope runtime se observará únicamente en `shadow` y en
`staging`, con `legacyAllowed` como decisión efectiva y con escritura,
aplicación y cambio de permisos fijados en `false`. El adaptador Payload
preparatorio usa el `PayloadRequest` autenticado existente, `overrideAccess:
false`, selección mínima, filtros explícitos de tenant, paginación estable y
una topología entidad legal–sede revisada. Actualmente cubre
`course_run`, `enrollment`, `campaign` y `lead`; rechaza `media` de forma
cerrada hasta aprobar una fuente de propietario segura. Para `lead` solo
proyecta `tenant`, `campus` y la relación opcional `campaign`; esta relación se
contrasta con una resolución revisada del mismo scope y no se serializa PII. No
está registrado en ACL, endpoint, job, cron ni hook.

Por tanto, el enlace y las métricas de una campaña solo podrán considerarse
aislados por empresa y sede después de una ejecución staging autenticada que
valide los cruces negativos, el snapshot de Meta y el rollback. Una resolución
`review://` local permite observar una propuesta `wouldGrant`, pero no sustituye
campos de esquema, memberships ni evidencia de existencia fresca; tampoco
autoriza a afirmar que la campaña está disponible en producción.

## Anexo A — objetivo funcional incorporado al plan

El objetivo funcional recibido el 2026-07-26 queda incorporado como requisito
vinculante de esta corrección. No se trata de una tarea independiente ni de una
autorización para escribir en Meta: concreta el mismo alcance en los siguientes
bloques de entrega:

| Bloque              | Criterio que queda incorporado                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Asociación          | La relación se resuelve por `tenant_id + convocatoria_id + meta_campaign_id`; `course`, `cycle`, nombre, URL y UTM solo generan candidatos.                                                                                                                  |
| Estado              | `Campaña activa`, `Campaña pausada`, `Campaña finalizada`, `Campaña en preparación`, `Campaña sin vincular`, `Asociación ambigua`, `Estado no disponible` y `Sin campaña` son estados distintos. Un fallo de Meta nunca se convierte en ausencia confirmada. |
| API y métricas      | La lectura es por convocatoria, devuelve el anuncio/campaña resueltos, enlaces internos y de Ads Manager sin secretos, y métricas exclusivamente del `meta_campaign_id`/`meta_ad_id` asociado; puede usar snapshot fechado y marcado como `stale`.           |
| Interfaz            | Se incluyen tarjetas de ciclos, listados generales y la ficha individual `/programacion/{convocatoriaId}`, con badge real, estadísticas, última sincronización y número de anuncios.                                                                         |
| Campañas externas   | Se generan candidatos, pero una coincidencia ambigua requiere vinculación manual autorizada con actor, fecha, motivo y auditoría; el backfill inicial es únicamente `dry-run`.                                                                               |
| Aislamiento         | Cada consulta comprueba tenant y prepara entidad legal/sede sin inferencias; nunca se muestran campañas de otra convocatoria, empresa, sede o tenant.                                                                                                        |
| Seguridad operativa | Se mantienen roles, permisos, memberships y accesos actuales; no se despliega directamente en producción ni se activan escrituras o cierres automáticos en esta fase.                                                                                        |
| Aceptación          | Se ejecutan las pruebas de ciclos sin `course`, campañas paralelas del mismo curso, workflows repetidos, estados Meta, errores, ambigüedad, enlaces sin tokens, métricas acotadas y regresión de permisos.                                                   |

La fuente de este anexo es el texto adjunto por el solicitante (“OBJETIVO
Corregir la asociación y visualización de las campañas de Meta Ads en las
convocatorias”). Su incorporación actualiza el plan, pero no demuestra que
ninguna campaña concreta esté activa en Meta ni que la integración haya sido
validada en staging o producción.

## Objetivo

Corregir la asociación y visualización de las campañas de Meta Ads en las
convocatorias, especialmente en las convocatorias de ciclos formativos.

Actualmente existen campañas activas en Meta, pero algunas fichas muestran
incorrectamente `Sin campaña` o un estado equivalente. La ficha debe mostrar el
estado real y permitir acceder al anuncio o campaña que está ejecutándose,
junto con sus estadísticas específicas.

## Restricciones

1. No modificar los permisos, roles ni accesos actuales de ningún usuario.
2. No desplegar directamente en producción.
3. La implementación debe ser aditiva y compatible con la operativa actual.
4. No asociar campañas únicamente por curso o ciclo.
5. No presentar `Sin campaña` cuando Meta o la base de datos no respondan.
6. Mantener el aislamiento por tenant y, cuando esté disponible, por entidad
   legal y sede.
7. No exponer tokens, cuentas publicitarias, credenciales ni datos de otras
   empresas.

## Defecto confirmado

La ruta `/api/convocatorias` relaciona campañas mediante `campaign.course`.
Esto es incorrecto porque:

- Una convocatoria de ciclo puede tener `cycle` pero no `course`.
- Un mismo curso o ciclo puede tener varias convocatorias.
- Cada convocatoria puede disponer de una campaña diferente.
- La primera campaña encontrada puede terminar asignada a varias convocatorias.

La ficha de ciclos intenta corregirlo mediante coincidencias de código, nombre
y URL, pero este método es heurístico y puede producir falsos negativos, falsos
positivos y errores silenciosos.

## Hallazgos técnicos confirmados en código

- `apps/tenant-admin/app/api/convocatorias/route.ts` construye actualmente un
  mapa `campaignByCourse` y conserva la primera campaña encontrada por curso.
  Por tanto, no puede distinguir dos convocatorias del mismo curso y tampoco
  cubre correctamente una convocatoria de ciclo sin `course`.
- `meta_ad_drafts` ya contiene `tenant_id`, `convocatoria_id`,
  `meta_campaign_id`, `meta_adset_id` y `meta_ad_id`. Esta relación debe ser la
  primera fuente de verdad disponible, sin crear una asociación paralela por
  curso o ciclo.
- `CampaignBadge` y `CampaignStatusDot` reducen actualmente los casos no
  resueltos al estado `none`/`Sin campaña`. El contrato visual deberá distinguir
  ausencia confirmada, campaña sin vincular, asociación ambigua e integración
  no disponible.
- La ficha de ciclos selecciona campañas mediante coincidencias y prioriza la
  primera activa. Esa lógica podrá generar candidatos para revisión, pero no
  confirmar por sí sola una relación convocatoria–campaña.

Estos hallazgos proceden de inspección estática del repositorio. No demuestran
todavía el estado de Meta, de la base de datos de producción ni de campañas
concretas.

## Modelo de asociación

La clave funcional debe ser:

```text
tenant_id + convocatoria_id + meta_campaign_id
```

Orden de resolución:

1. Relación directa existente en `meta_ad_drafts` para esa convocatoria.
2. Relación explícita y revisada para campañas creadas externamente en Meta.
3. Heurísticas de código, URL o UTM únicamente como sugerencias de vinculación;
   nunca deben utilizarse como verdad automática si existen varias candidatas.
4. Si no puede resolverse inequívocamente, mostrar `Campaña sin vincular` y
   permitir que un usuario ya autorizado seleccione la campaña correcta.

No se resolverá sustituyendo `course` por `cycle`, porque un ciclo también
puede tener varias convocatorias.

## API por convocatoria

Crear o ampliar un endpoint equivalente a:

```text
GET /api/convocatorias/{convocatoriaId}/campaign
```

Debe:

- Autenticar al usuario con los permisos actuales.
- Resolver `tenant_id`, `legal_entity_id` y `campus_id` desde el contexto
  autenticado y/o una resolución revisada, nunca desde parámetros libres ni
  heurísticas.
- Consultar únicamente campañas vinculadas a esa convocatoria.
- Consultar el estado actual de Meta cuando la integración esté disponible.
- Utilizar snapshot con fecha de sincronización cuando Meta no responda.
- Fallar de forma segura si hay asociaciones ambiguas.
- No devolver secretos ni credenciales.

Respuesta orientativa:

```json
{
  "linkStatus": "linked | not_linked | ambiguous | unavailable",
  "workflowStatus": "draft | review | meta_paused | active | error | ended",
  "deliveryStatus": "active | paused | completed | draft | unknown",
  "metaCampaignId": "...",
  "metaAdSetId": "...",
  "primaryMetaAdId": "...",
  "campaignName": "...",
  "adName": "...",
  "internalDetailUrl": "/campanas/{metaCampaignId}",
  "adsManagerUrl": "...",
  "metrics": {
    "spend": 0,
    "impressions": 0,
    "reach": 0,
    "clicks": 0,
    "ctr": 0,
    "cpc": 0,
    "leads": 0,
    "cpl": 0,
    "conversions": 0,
    "roas": 0
  },
  "lastSyncedAt": "...",
  "source": "meta_live | snapshot | workflow | unavailable",
  "stale": false
}
```

Las métricas deben pertenecer exclusivamente al `meta_campaign_id` o
`meta_ad_id` asociado. No se utilizarán métricas agregadas de toda la cuenta.
El snapshot conserva su origen y fecha: puede mostrar la última observación
válida como `stale`, pero no convierte una integración caída en `Sin campaña`.
Cuando no haya lectura live ni snapshot válido para el mismo scope, la respuesta
debe ser `linkStatus: "unavailable"` y `source: "unavailable"`.

## Reglas de estado

- `Campaña activa`: campaña vinculada y entrega activa confirmada por Meta.
- `Campaña pausada`: campaña o anuncios vinculados actualmente pausados.
- `Campaña finalizada`: campaña terminada o archivada.
- `Campaña en preparación`: workflow en `draft` o `review`.
- `Campaña sin vincular`: Meta contiene candidatos, pero no hay relación directa.
- `Estado no disponible`: error de Meta, integración o sincronización.
- `Sin campaña`: solo cuando una consulta válida confirme que no existe ninguna
  relación ni candidato para esa convocatoria.

Un error de red o API nunca se convertirá automáticamente en `Sin campaña`.

## Interfaz

Actualizar como mínimo:

1. Tarjetas de convocatorias dentro de la ficha de ciclos.
2. Listados generales de convocatorias.
3. Ficha individual `/programacion/{convocatoriaId}`.

Cuando exista una campaña vinculada:

- Mostrar badge con el estado real.
- Hacer clic en el badge debe abrir `/campanas/{metaCampaignId}`.
- Añadir la acción `Ver estadísticas`.
- Añadir la acción secundaria `Abrir en Meta Ads Manager`.
- Mostrar la última fecha de sincronización.
- Advertir si las estadísticas proceden de un snapshot antiguo.
- Si hay varios anuncios, mostrar el principal y el número total de anuncios.

## Campañas existentes

Para campañas creadas fuera del workflow interno:

- Generar candidatos usando código de convocatoria, URL de destino, UTM y nombre.
- No confirmar automáticamente una asociación ambigua.
- Proporcionar una acción administrativa para vincular manualmente una campaña
  Meta a una convocatoria.
- Registrar quién realizó la vinculación y cuándo.
- Ejecutar inicialmente cualquier backfill en `dry-run` y entregar un informe
  de vinculación segura, ambigua y no encontrada.

## Seguridad y aislamiento

- Toda consulta debe incluir `tenant_id`.
- Preparar el modelo para añadir `legal_entity_id` sin cambiar todavía permisos.
- Una convocatoria nunca puede visualizar campañas de otro tenant o empresa.
- No aceptar `metaCampaignId` o `tenantId` sin comprobar que pertenecen al
  contexto autenticado.
- Mantener los permisos actuales durante toda esta fase.
- Registrar accesos y cambios de vinculación en auditoría.

## Pruebas obligatorias

1. Convocatoria de ciclo sin `course` y con `meta_ad_drafts` activo.
2. Convocatoria de curso normal con campaña activa.
3. Dos convocatorias del mismo curso con campañas diferentes.
4. Campaña del mismo curso vinculada a otra convocatoria: no debe aparecer.
5. Campaña de otro tenant: no debe aparecer.
6. Varios workflows: selección determinista del vigente.
7. Campaña pausada, finalizada, borrador y con error.
8. Fallo de Meta: mostrar `Estado no disponible`, no `Sin campaña`.
9. Asociación ambigua: no elegir automáticamente.
10. Enlace interno dirigido al `meta_campaign_id` correcto.
11. Enlace de Ads Manager dirigido al anuncio correcto y sin tokens.
12. Estadísticas correspondientes únicamente a la campaña seleccionada.
13. Convocatoria realmente sin campaña.
14. Compatibilidad con los permisos actuales sin modificar usuarios.

## Despliegue seguro

1. Implementar detrás de un feature flag desactivado.
2. Ejecutar backfill en `dry-run`.
3. Comparar asociaciones antiguas y nuevas.
4. Validar con convocatorias reales de ciclos.
5. Activar primero en staging.
6. Activar en producción en modo lectura.
7. No modificar permisos ni automatizar cierres publicitarios durante esta fase.
8. Entregar evidencia de pruebas y plan de rollback antes de activar escrituras.

El flag de servidor y, si existe superficie cliente, el flag público empiezan
apagados. El primer uso se limita a lectura en `staging`; cualquier paso hacia
producción requiere una aprobación posterior y explícita. Un rollback debe
apagar ambos flags, retirar el consumo del endpoint de la superficie visible y
conservar las relaciones preexistentes sin borrarlas ni reescribirlas. El
backfill continúa siendo únicamente una propuesta `dry-run`.

## Dependencia con el cierre automático de publicidad

Este plan debe completarse en modo lectura antes de permitir que el cierre
automático pause anuncios. El motor de cierre puede seguir generando propuestas
shadow, pero ninguna propuesta puede convertirse en escritura hasta que:

- la relación convocatoria–campaña sea explícita y no ambigua;
- el estado de entrega se contraste con Meta live o un snapshot vigente;
- el scope `tenant + entidad legal + convocatoria` esté verificado;
- exista idempotencia, auditoría y rollback por campaña;
- las pruebas negativas cross-tenant y cross-entity estén verificadas.

Esta corrección también es una dependencia del plan global
[`2026-07-22-cep-multi-entity-zero-impact-rollout.md`](./2026-07-22-cep-multi-entity-zero-impact-rollout.md):
el artefacto de alcance convocatoria–campaña debe comprobar la relación directa
por entidad y convocatoria, pero no autoriza por sí solo cambios en Meta,
activación de permisos ni consolidación de gasto.

## Plan de ejecución por fases

### Fase 0 — Baseline y contrato, sin escrituras

1. Capturar en `dry-run` la respuesta actual de convocatorias y las relaciones
   existentes en `meta_ad_drafts`, sin almacenar secretos ni payloads crudos.
2. Definir un único contrato de resolución y de estados para API y componentes.
3. Registrar las convocatorias de ciclos que hoy muestran un badge incorrecto
   como casos de aceptación, sin modificarlas.
4. Confirmar antes de cualquier migración cuál es la autoridad de esquema para
   esta relación y evitar una tabla o campo duplicado entre Payload y Drizzle.

**Puerta de salida:** baseline revisable, contrato aprobado y cero cambios de
permisos, datos o producción.

### Fase 1 — Resolución aditiva detrás de feature flag

1. Implementar un resolver puro y tenant-scoped por convocatoria.
2. Priorizar relaciones directas de `meta_ad_drafts` y relaciones externas
   explícitamente revisadas.
3. Devolver estados `ambiguous` y `unavailable` de forma fail-closed.
4. Mantener el comportamiento vigente como fallback mientras el feature flag
   permanezca desactivado, sin presentar ese fallback como evidencia nueva.
5. Añadir el endpoint por convocatoria usando la autenticación y autorización
   actuales; no introducir nuevos roles ni ampliar capacidades.

**Implementación local disponible:**
`GET /api/convocatorias/{convocatoriaId}/campaign` ejecuta esta resolución solo
con `AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED=true` y
`AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT=staging`. La relación directa se lee
con `tenant_id + convocatoria_id`; las coincidencias por curso se devuelven
como candidatos heurísticos y nunca como asociación confirmada. El endpoint no
crea tablas, no escribe Meta, no acepta `tenantId` libre y responde
`unavailable` cuando no puede consultar la fuente.

Las tarjetas de ciclos y los listados de convocatorias incorporan ahora un
componente de lectura opcional que consulta ese endpoint. Con el flag apagado
recupera exactamente el badge legado; con una respuesta válida distingue
`Campaña sin vincular`, `Asociación ambigua` y `Estado no disponible`, enlaza el
detalle de la campaña resuelta y ofrece sus estadísticas y Meta Ads Manager.
El navegador solo realiza esa consulta cuando también está definido
`NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED=true`, por lo que
el flag público y el servidor deben activarse conjuntamente en staging. La
ficha individual de programación ya consume el mismo contrato source-level;
queda pendiente su validación autenticada en staging.

**Puerta de salida:** pruebas unitarias y adversariales del resolver y del
aislamiento, con el feature flag desactivado por defecto.

### Fase 2 — Lectura, métricas e interfaz en staging

1. Integrar estado live de Meta con fallback a snapshot fechado y marcado como
   obsoleto cuando corresponda.
2. Calcular métricas únicamente para la campaña o anuncio resuelto.
3. Ampliar badges y acciones en ficha de ciclos, listados y ficha individual.
4. Validar enlaces internos y de Ads Manager sin tokens ni parámetros sensibles.
5. Ejecutar las catorce pruebas obligatorias, incluyendo los tres intentos de
   ruptura mínimos: dato límite, fallo cerrado y variante no cubierta.

**Puerta de salida:** staging verificado, sin fuga cross-tenant/cross-entity y
con rollback documentado. No autoriza todavía escrituras ni producción.

### Fase 3 — Backfill revisable y lectura controlada

1. Ejecutar candidatos de backfill solo en `dry-run`.
2. Separar resultados en `segura`, `ambigua` y `no encontrada`.
3. Exigir revisión humana para asociaciones ambiguas y conservar actor, fecha,
   origen y evidencia de la decisión.
4. Comparar durante un periodo acordado el resolver antiguo y el nuevo en modo
   shadow, sin que el antiguo pueda convertir errores en `Sin campaña`.
5. Preparar activación de solo lectura y rollback; cualquier activación real
   requerirá una decisión posterior y explícita.

**Puerta de salida:** informe de deltas, aprobación funcional de CEP y evidencia
de que los accesos efectivos siguen siendo los mismos.

### Fase 4 — Escrituras y automatización, fuera de este alcance

La vinculación manual persistente y el cierre automático de publicidad no se
activarán en esta corrección de lectura. Requerirán una fase posterior con
autorización explícita, idempotencia, auditoría, rollback probado y permisos
personalizados aprobados manualmente.

## Seguimiento de avance

- 🟩 100% | 🟩 🟩 🟩 🟩 | Defecto y superficies estáticas identificados.
- 🟩 100% | 🟩 🟩 🟩 🟩 | Restricciones, contrato objetivo y pruebas definidos.
- 🟩 100% | 🟩 🟩 🟩 🟩 | Contrato source-level de ejecución shadow preparado y validado; no equivale a staging ejecutado.
- 🟩 100% | 🟩 🟩 🟩 🟩 | Runner y loader shadow ampliados a `lead` con tenant/sede/campaña mínimos, sin PII ni cambios de permisos.
- ⬜ 0% | ⬜ ⬜ ⬜ ⬜ | Baseline runtime y campañas reales de ciclos.
- 🟩 90% | 🟩 🟩 🟩 🟨 | Resolver, endpoint, tarjetas/listados y ficha individual integrados detrás de feature flag; falta ejecución staging.
- 🟨 45% | 🟩 ⬜ ⬜ ⬜ | Métricas específicas y snapshot live/snapshot; falta validación en staging.
- ⛔ 0% | ⛔ ⬜ ⬜ ⬜ | Producción y escrituras; fuera de alcance hasta aprobación.

El delta de avance se actualizará por evidencia obtenida, no por código escrito
ni por intención. Una prueba de fuente estática no contará como validación de
Meta o producción.

## Definición de terminado de esta corrección

- Existe una sola resolución determinista por `tenant + convocatoria`.
- Una campaña de otra convocatoria, tenant, empresa o sede nunca es elegible.
- Los estados `Sin campaña`, `Campaña sin vincular`, `Asociación ambigua` y
  `Estado no disponible` son distintos en API y UI.
- Los enlaces apuntan a la campaña/anuncio resuelto y no contienen secretos.
- Las métricas no mezclan campañas ni agregados de cuenta.
- El feature flag permanece apagado por defecto y el rollback está probado.
- La matriz de accesos efectivos antes/después no presenta ningún delta.
- No se habilita cierre publicitario automático ni escritura en Meta.

## Criterio de aceptación

La corrección se considerará válida cuando una convocatoria de ciclo con una
campaña activa muestre `Campaña activa`, enlace a su detalle específico,
presente estadísticas de esa campaña y no pueda visualizar información
publicitaria perteneciente a otra convocatoria, tenant, empresa o sede.
