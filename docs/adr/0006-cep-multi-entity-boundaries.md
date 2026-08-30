# 0006 - Límites multi-entidad para Grupo CEP

- Status: Accepted for additive implementation; enforcement deferred. Commercial product model: see 0008 (OrganizationGroup + N tenants).
- Date: 2026-07-22

## Context

CEP opera una marca y una web pública comunes, pero CEP Norte, CEP Santa Cruz y
CEP Sur pueden pertenecer a entidades legales distintas. Cada entidad mantiene
su propia contabilidad y sus socios no autorizan que la información financiera
se comparta entre centros.

El sistema actual está en producción y sus usuarios conservan sus accesos. La
introducción del nuevo modelo no puede revocar ni ampliar permisos existentes
antes de que el modelo completo haya sido migrado, validado y autorizado.

## Decision

Se modelarán tres niveles diferentes:

1. **Grupo o marca CEP**: identidad pública y catálogos que pueden compartirse.
2. **Entidad legal**: propietario y frontera de aislamiento de los datos de
   negocio y financieros.
3. **Campus o sede física**: ubicación operativa subordinada a una entidad
   legal.

No se utilizará `campus_id` como única frontera de seguridad. Todo recurso local
debe pertenecer primero a una entidad legal y, cuando corresponda, a un campus.

### Propiedad de la información

| Ámbito compartido por el grupo  | Ámbito aislado por entidad legal          |
| ------------------------------- | ----------------------------------------- |
| Identidad del docente           | Asignación y acuerdo local del docente    |
| Plantilla o catálogo del curso  | Precio, convocatoria y horario            |
| Marca y contenido público común | Campus, aulas y disponibilidad local      |
| Proyección pública autorizada   | Matrículas, leads y expedientes           |
| Disponibilidad agregada mínima  | Campañas, gasto publicitario y atribución |
|                                 | Conexiones contables y datos financieros  |

Compartir la identidad de un docente no comparte sus condiciones económicas.
Tampoco elimina la restricción horaria global: los conflictos deben resolverse
por la identidad maestra del docente, aunque cada entidad lo referencie mediante
una asignación local diferente. El hook legado que compara directamente IDs de
instructor no constituye evidencia suficiente para este escenario y no se
modificará hasta que el nuevo esquema y su activación estén aprobados.
La proyección desde Payload exigirá una entidad legal explícita, procedente del
campo futuro o de una resolución shadow revisada. No inferirá la entidad desde
el campus, el dominio, el usuario que ejecuta la lectura ni la asignación del
docente. Los IDs actuales de `instructor` e `instructors` se resolverán contra
la asignación docente-entidad correspondiente antes de evaluar el horario.
La telemetría de esta evaluación solo podrá contener contadores y códigos de
incidencia permitidos. No incluirá IDs de tenant, entidad, campus, docente,
asignación o convocatoria, ni devolverá mensajes de error del cargador.
El cargador de staging usará paginación acotada y estable, profundidad cero y
`overrideAccess: false` para aplicar el acceso efectivo vigente. Rechazará la
página completa ante registros de otro
tenant, IDs duplicados, cambios de metadatos durante la lectura o conflicto
entre una entidad ya presente y una resolución revisada. No utilizará
credenciales de superadministrador como sustituto de un rol empresarial.
El adaptador Payload preparatorio recibe obligatoriamente el `PayloadRequest`
existente, consulta `course-runs` con filtro explícito de tenant y orden estable
por ID, y usa una selección inclusiva limitada a relaciones y campos horarios.
También elimina cualquier campo raíz adicional antes de entregar la página al
cargador. Permanece sin registrar en configuración, rutas, hooks o jobs. Mientras
el campo `legalEntity` no forme parte del esquema autorizado, la entidad solo
puede incorporarse mediante una resolución shadow revisada.
Compartir la plantilla de un curso no comparte convocatorias, precios,
matrículas ni resultados.

### Proyección web pública unificada

La web pública seguirá resolviéndose por la marca y tenant comunes. El catálogo
maestro publica cada curso una sola vez y puede mostrar convocatorias de varias
entidades, pero cada convocatoria conserva una única entidad validada y, cuando
es presencial o híbrida, una sede vinculada de forma unívoca a esa entidad.

Antes de conectar este modelo a la web efectiva, una proyección shadow debe
compararlo con la salida vigente. La proyección recibe únicamente campos
públicos allow-listed y no acepta importes internos, matrículas, campañas,
conexiones contables, usuarios ni payloads crudos. La vista pública omite tenant,
entidad legal, bindings y todos los IDs fuente; las incidencias con IDs quedan
en el plan diagnóstico interno y nunca en telemetría. Una entidad `proposed`, una sede
sin binding validado, un binding ambiguo, un cruce sede-entidad o un slug público
duplicado bloquean la proyección completa; no se sirve un resultado parcial.
El modo shadow mantiene siempre `canPublish: false` y `canActivate: false`.

El reader preparatorio consulta `courses`, `cycles`, `campuses` y `course-runs` de forma
secuencial, paginada y acotada con el `PayloadRequest` existente, `depth: 0` y
`overrideAccess: false`. Solo lee cursos, ciclos y sedes activos y convocatorias
en estado público. La entidad de una convocatoria procede obligatoriamente de una
resolución `review://` única contra una entidad validada; nunca se infiere de la
sede. Los campos de precio, ocupación, contacto e internos se descartan antes
de construir el snapshot. Cada convocatoria debe relacionarse con exactamente
un curso o un ciclo compartido; ambos vínculos o ninguno bloquean la proyección.

La comparación shadow solo puede ejecutarse con
`AKADEMATE_CEP_PUBLIC_PROJECTION_SHADOW_ENABLED=true` y entorno `staging`.
Compara conjuntos allow-listed de slugs de cursos, ciclos, sedes y convocatorias
contra un baseline inyectado y emite
únicamente conteos de coincidencias, ausencias y novedades. Ni siquiera con
resultado `aligned` puede publicar o activar. El reader y el runner permanecen
sin registrar en configuración, rutas o jobs.

El adaptador de baseline reproduce las cuatro páginas canónicas actuales:
`/cursos`, `/ciclos`, `/sedes` y `/convocatorias`. Conserva sus filtros y topes
visibles actuales (200, 50, 20 y 50 registros respectivamente), utiliza el
`PayloadRequest` existente con `overrideAccess: false` y reduce cada resultado
exclusivamente al slug público. El inicio no define el baseline porque sus
secciones son selecciones editoriales parciales. Los errores de proveedor,
slugs inválidos, duplicados o respuestas sobredimensionadas fallan cerrados y
sin conservar contenido privado.

Una composición Payload desconectada une el snapshot candidato y ese baseline
con el runner de comparación. Copia únicamente los dos valores del gate, no
conserva el resto del entorno y no realiza ninguna lectura si el flag está
apagado o el entorno es producción. En staging ejecuta primero la proyección y
después el baseline; cualquier fallo se reduce a un motivo agregado sin datos
del proveedor. La composición sigue sin estar registrada en runtime.

Las observaciones aisladas no satisfacen el gate público. El manifiesto de
evidencia exige al menos tres muestras `aligned` con referencias `evidence://`
distintas. Una muestra bloqueada prevalece sobre cualquier alineación y una
divergencia impide la revisión aunque existan otras muestras alineadas. El
manifiesto agrega únicamente contadores, rechaza observaciones falsificadas o
inconsistentes y nunca conserva referencias, slugs ni identificadores. Su mejor
resultado es `ready_for_staging_review`; mantiene `canPublish: false`,
`canActivate: false` y `canChangePermissions: false`.

### Baseline de accesos actuales

Antes de cualquier ensayo se captura un baseline canónico de las asignaciones
vigentes: ID técnico, rol, tenant y estado `is_active` de cada usuario del
tenant, más los superadmins de plataforma que conservan acceso transversal. No
se leen nombres, correos, teléfonos, credenciales, API keys ni sesiones. El
digest SHA-256 combina esas asignaciones ordenadas con el digest de un artefacto
RBAC revisado; así un cambio de código de autorización también invalida el
baseline aunque los usuarios no cambien.

El reader exige una referencia `review://` y un request de auditoría de
plataforma para evitar resultados parciales impuestos por el ACL actual de
`users`. Ese uso excepcional no convierte al superadmin en rol financiero o
empresarial. La lectura usa `overrideAccess: false`, es paginada, estable y
acotada. El artefacto final solo contiene digest y contadores por rol; alimenta
directamente `capturedDigest` y `currentDigest` del ensayo de rollback. Una
diferencia bloquea el proceso y nunca autoriza cambios de permisos.

El artefacto RBAC se genera mediante
`node --no-warnings --experimental-strip-types scripts/generate-cep-rbac-policy-artifact.ts`.
El inventario incluye middleware, configuración Payload, jerarquía de roles,
filtros tenant, ACL de colecciones, rutas de autenticación y otras decisiones
activas detectadas en `tenant-admin`. Excluye pruebas y tipos generados; el
código multi-entidad shadow solo puede entrar por el `schema-gate` explícito de
entorno no productivo y no forma parte del runtime de producción. Diez autoridades núcleo son
obligatorias; una ausencia, duplicidad, ruta inválida o archivo no clasificable
falla cerrada. El JSON contiene exclusivamente rutas, tamaños y SHA-256 por
archivo, además del digest global. `--summary` permite verificar métricas sin
emitir el inventario completo.

El digest generado desde un worktree en desarrollo no constituye por sí solo
el baseline aprobado. Debe regenerarse desde el SHA exacto desplegado en
staging, revisarse el inventario y asociarse a una referencia de evidencia antes
de capturar usuarios. Cualquier cambio posterior de archivo, ruta o inventario
produce un digest distinto y bloquea la comparación de accesos.

### Finanzas

- Cada entidad legal tendrá conexiones contables y credenciales independientes.
- Las credenciales nunca se almacenarán en registros compartidos por el grupo.
- Todo dato importado conservará `legal_entity_id`, identificador externo,
  origen y fecha de sincronización.
- No existirá una vista consolidada financiera por defecto.
- El acceso operativo no implicará acceso financiero.
- Los operadores técnicos de la plataforma no recibirán acceso financiero de
  negocio salvo membresía explícita y auditable.
- La primera integración será de lectura; cualquier escritura requerirá una
  decisión y un control posterior independientes.

La política futura de lectura financiera se evaluará por el alcance completo
`tenant + entidad legal + conexión contable`. Requiere una conexión revisada,
activa y `read_only` y una membresía empresarial activa con `finance.read`.
`finance.manage` no se convierte implícitamente en lectura y el superadmin de
plataforma no sustituye esa membresía. El contrato local solo admite `disabled`
o `shadow`, mantiene la decisión legacy efectiva y no puede aplicar cambios de
permisos; permanece sin registrar en rutas, jobs, hooks o configuración hasta
que exista una autorización posterior y explícita.

La futura lectura se proyectará desde un snapshot ya validado de una única
entidad y conexión. El overview devolverá agregados por moneda y estado de
conciliación, nunca payloads ni identificadores de transacciones, matrículas o
campañas. Cualquier denegación, cruce de scope o inconsistencia bloquea el
resultado completo; no se publicarán métricas parciales ni una vista agregada
de varias empresas. Esta proyección sigue desconectada de rutas y proveedores.

El adaptador Payload preparatorio de relaciones financieras solo lee
`enrollments` y `campaigns` desde un plan de alcance revisado. Las matrículas se
limitan por `course_run.tenant` y las campañas por su `tenant` directo; en ambos
casos la entidad legal procede exclusivamente del plan revisado y nunca se
infiere de esos vínculos. La lectura exige cobertura exacta de los IDs esperados,
usa `depth: 0`, `overrideAccess: false`, orden estable y selección mínima, y
descarta campos personales antes de formar el snapshot. Permanece sin registrar
en la configuración de Payload.

El esquema Payload actual no aporta eventos individuales de pago ni gasto
publicitario diario. Por tanto, `enrollments.amount_paid` solo puede actuar como
total de control, y el presupuesto de una campaña no puede convertirse en gasto
real. Esas dos fuentes requerirán adaptadores independientes y evidencia propia
antes de habilitar una conciliación real.

Los adaptadores externos preparatorios de cobros y publicidad reciben clientes
inyectados que solo exponen lectura. Cada conexión declara un identificador
propio, proveedor, cuenta externa, estado `active`, modo `read_only` y una
referencia `review://`; una misma cuenta o conexión no puede asignarse a dos
entidades. Los IDs externos de matrículas y campañas se traducen únicamente
mediante relaciones revisadas. La lectura es paginada y acotada, detecta ciclos,
duplicados y respuestas malformadas, y reduce cada respuesta al mínimo snapshot
necesario. Los clientes conservan las credenciales y los adaptadores no
persisten datos, descubren fuentes ni se registran en ejecución.

La revisión estructural de cobros se sella por separado para Norte, Santa Cruz
y CEP Sur. Cada artefacto liga el scope de la conexión contable al scope propio
de pagos, una cuenta proveedor exclusiva y un mapa matrícula externa–local
revisado. Solo admite `listPaymentEvents`, no invoca la API, no resuelve
credenciales y no conserva IDs legibles. El compositor compara el scope contable
con la conexión de la misma revisión de entidad; un contrato válido de otra
empresa falla cerrado. Esta evidencia no sustituye una prueba live ni demuestra
el origen real de las relaciones.

La fuente publicitaria usa el mismo patrón con una cuenta exclusiva y mappings
campaña externa–local por entidad. El contrato mínimo solo expone
`listDailyAdvertisingSpend`, exige gasto diario, moneda y estados explícitos de
disponibilidad, y mantiene en `false` invocación, escritura y pausa de campañas.
Las huellas se recalculan desde los mappings antes de redactar los IDs. El scope
contable debe coincidir con la conexión revisada de la misma empresa. Esta
evidencia no demuestra conectividad con Meta ni gasto real descargado.

La cobertura Payload se acredita con un contrato cruzado que recibe el plan
revisado por entidad y los mappings originales de cobros y publicidad. Recalcula
las huellas de ambas fuentes, exige cobertura exacta de matrículas y campañas y
rechaza IDs locales no numéricos, compartidos o sin convocatoria padre. El
`payloadTenantId` queda separado del tenant financiero y la entidad legal nunca
se infiere de Payload. El artefacto es redactado, no lee Payload, no invoca
proveedores y prohíbe expresamente usar superadmin como autoridad empresarial.

La composición shadow financiera es deliberadamente unientidad: combina un
reader contable, dos relaciones Payload y dos fuentes operativas externas para
un único tenant, entidad y conexión contable. No ofrece batch multiempresa,
store ni callback de escritura. El gate impide toda lectura salvo con flag
explícito en staging y la salida omite configuración e identificadores. Marcar
la composición como piloto CEP Sur exige una segunda referencia `review://`
distinta de la revisión de alcance; el código no infiere el piloto desde el
nombre o campus de la entidad.

El reader de transacciones contables importadas también permanece inyectado y
desconectado de una persistencia concreta. Cada entidad admite una sola conexión
revisada, activa y `read_only`, y una conexión no puede compartirse entre
entidades. El repositorio debe filtrar simultáneamente por tenant, entidad y
conexión, paginar por `external_id_asc` y conservar una versión estable durante
toda la lectura. El reader verifica esos invariantes y reduce cada fila a los
campos de conciliación; no transporta descripción, contraparte, cuenta, centro
de coste, hash ni payload contable adicional.

La auditoría cross-entity financiera requiere exactamente tres candidatos
revisados del mismo tenant, entidades y conexiones distintas, y un único
candidato piloto CEP Sur con revisión independiente. Solo se ejecuta con flag
propio en staging. Carga y valida cada entidad secuencialmente, descarta su
snapshot antes de continuar y detiene la ejecución ante la primera brecha o
fallo. Su evidencia contiene únicamente número de entidades y superficies
evaluadas y brechas detectadas; no incluye volúmenes, IDs, importes, monedas ni
referencias y no constituye una vista financiera consolidada.

La evidencia específica del harness agrupa una observación positiva completa
de tres entidades y quince superficies con tres observaciones negativas
revisadas: cruce de scope, relación cobro–matrícula inválida y relación
gasto–campaña inválida. Solo acepta el positivo como `isolated` y los negativos
como `breach_detected`. Las etiquetas de escenario son clasificación de
revisión, no prueba autónoma del origen de la mutación. Su bridge propone un
único binding global `financial_isolation_harness_verified` y carece de
autoridad para marcar readiness o ejecutar operaciones.

Los casos negativos de entidad no se derivan del mismo resultado global. Un
runner inyectado ejecuta por separado cruce de scope, cobro–matrícula inválido y
gasto–campaña inválido para cada scope ligado por digest. Una observación sin
brecha produce `gap_detected`. El manifiesto exige tres entidades y conexiones
distintas, un único piloto CEP Sur y nueve casos rechazados; crea un artefacto
por entidad para `isolation_negative_cases_verified`. Sus etiquetas continúan
siendo clasificación revisada y no attestation de un entorno desplegado.

La revisión de conexión contable permanece separada de la resolución del
secreto y de la verificación contractual del proveedor. El manifiesto exige
tres conexiones activas y `read_only`, entidades, conexiones y compañías
externas exclusivas, además de un único piloto CEP Sur. No acepta referencias
de secretos ni afirma conectividad; publica `configured_not_resolved` y digests
redactados que permiten al assertor comprobar scope y empresa externa no
compartida.
La canonicalización del `scopeDigest` es única para conexión, aislamiento y
conciliación. El compositor cruza los tres artefactos mediante el review de
entidad y rechaza cualquier divergencia de tenant, entidad o conexión.

Las referencias de secretos se revisan en otro artefacto. Solo se admiten
localizadores opacos de backends permitidos; el locator se descarta y se conserva
su digest más el tipo de backend. Tres entidades no pueden compartir referencia.
El estado es `reference_configured_not_resolved`, sin lectura ni resolución de
credenciales, y el scope debe coincidir con la conexión contable revisada.

La forma del cliente del proveedor se acredita en un tercer artefacto, sin
invocar la API ni resolver secretos. Solo admite `listTransactions`, exige
paginación por cursor acotada y conserva digests de scope y de la pareja
proveedor–empresa externa. El compositor cruza ambos con la conexión revisada;
un contrato de otra conexión o compañía falla cerrado. Este gate demuestra
compatibilidad estructural del cliente inyectado, no conectividad live ni
autenticación correcta.

Las tres observaciones de conciliación se pueden agrupar en un manifiesto
content-addressed sin datos financieros agregados. El contrato exige scopes,
conexiones, revisiones de entidad y ejecuciones independientes, además de un
único piloto CEP Sur. Produce un artefacto distinto por entidad y un digest
global determinista; cualquier observación bloqueada prevalece sobre las demás.
El verificador recalcula toda la cadena y rechaza campos adicionales o
capacidades de escritura, aplicación, activación o binding automático. Este
artefacto solo prepara la revisión manual de `finance_shadow_observed`: no
modifica el readiness ni demuestra por sí solo una ejecución real en staging.

El bridge de aplicación asociado solo acepta un manifiesto elegible y tres
mapeos explícitos entre digest de artefacto y revisión de entidad. Verifica los
digests de campaña y readiness, rechaza correspondencias parciales o duplicadas
y propone exactamente tres bindings del gate `finance_shadow_observed`. No
dispone de funciones de inserción, verificación, despliegue, activación ni
cambio de permisos; el bundle global sigue siendo la única pieza que evalúa la
coherencia conjunta de los 56 controles.

### Autorización y transición

La autorización futura se expresará mediante membresías explícitas al grupo y a
cada entidad legal. No habrá una pertenencia implícita a todas las entidades ni
un rol de negocio universal.

Durante la transición:

- Los roles, membresías y permisos actuales no se modifican.
- No se ejecutan asignaciones masivas de usuarios.
- La política nueva se entrega inicialmente desactivada y después en modo
  sombra: calcula y registra qué decidiría, pero la decisión efectiva continúa
  siendo la del sistema actual.
- Este incremento no ofrece un modo de enforcement.
- Cuando la implementación y el aislamiento estén validados, se preparará una
  matriz nominal por usuario. Los permisos se cambiarán manualmente, uno a uno,
  con autorización expresa y verificación posterior.

### Condiciones previas al enforcement

El cambio de permisos queda bloqueado hasta demostrar, como mínimo:

1. Backfill completo y reconciliado de entidad legal y campus.
2. Cero divergencias inexplicadas en modo sombra para los flujos críticos.
3. Pruebas negativas de acceso cruzado en UI, API, exportaciones, jobs y cachés.
4. CEP Sur operativa como piloto sin regresiones en los centros actuales.
5. Integraciones contables separadas y secretos aislados.
6. Observabilidad, auditoría y rollback ensayados.
7. Matriz nominal aprobada para cada usuario afectado.

## Consequences

- La web pública puede permanecer unificada y publicar contenido de varias
  entidades mediante una proyección controlada.
- Docentes y cursos dejan de duplicarse, mientras sus relaciones comerciales y
  operativas permanecen locales.
- Las consultas y jobs sobre datos locales deberán exigir contexto de entidad
  legal; los recursos de campus exigirán además contexto de campus.
- El modelo se parece a un grupo educativo multi-entidad, no necesariamente a
  una franquicia: no se presupone ninguna relación contractual de franquicia.
- La primera entrega no cambia el comportamiento de autorización en producción.

## Restricción actual de autoridad de esquema

El repositorio contiene dos modelos de persistencia que no son intercambiables:

- `apps/tenant-admin` usa Payload y migraciones con identificadores `serial`; es
  la superficie que contiene las colecciones CEP actuales y numerosas rutas
  ejecutan SQL directo sobre esas tablas.
- `packages/db` define un esquema Drizzle con identificadores UUID y tablas con
  nombres coincidentes.
- `infrastructure/scripts/deploy.sh` intenta ejecutar automáticamente la ruta de
  migraciones Drizzle.

Hasta consolidar esta autoridad, queda prohibido registrar el modelo CEP
multi-entidad en el journal Drizzle o aplicarlo a producción. Hacerlo podría
intentar alterar tablas Payload con tipos incompatibles. El modelo debe portarse
a la autoridad Payload o separarse físicamente como control plane con una base y
un ciclo de migración independientes.

Esta restricción no impide desarrollar contratos puros, evaluadores en modo
sombra ni adaptadores externos desconectados. Sí bloquea cualquier migración de
datos, backfill o activación de filtros en producción.

Como preparación reversible, las colecciones Payload sombra pueden formar parte
de la configuración únicamente con una bandera explícita y una etiqueta de
entorno no productivo. Permanecen ocultas, con acceso denegado para todos los
usuarios y sin migración registrada. Esta expansión condicional es la única
integración runtime deliberada del trabajo preparatorio; el bundle estricto,
Finanzas y los lectores de campañas permanecen desconectados. Esta preparación
no resuelve todavía la autoridad del esquema ni autoriza su activación en una
base compartida.

Los backfills preparatorios deben separar planificación y aplicación. El módulo
de planificación solo puede producir propuestas `set_if_null`; no puede escribir
en Payload ni corregir silenciosamente un valor existente. La observabilidad de
autorización se limita a contadores agregados y no conserva IDs de usuario,
entidad, sede o membership.

## Gate de preparación de staging

La entrada a revisión de staging se evalúa mediante un manifiesto puro de 56
checks: 20 globales y 12 por cada una de las tres entidades. Incluye autoridad
de esquema, Node 22, baseline y conservación de accesos, flags apagados, backup,
migración expand-only, dry-runs, rollback, web pública unificada, cursos y
docentes compartidos, horarios, autorización shadow, bloqueo nominal de permisos,
aislamiento financiero,
importación contable staging y observabilidad; por entidad incluye datos legales,
campus, conexión y proveedor
contables, referencia de secreto, relaciones Payload, cobros, publicidad,
rollback, casos negativos y observación financiera.

La evidencia de importación contable debe ser content-addressed, determinista y
vinculada al SHA fuente y al digest del tenant. Solo una ejecución completa de
las tres entidades puede ser elegible para binding manual. El hash no es una
firma ni prueba por sí mismo que la ejecución ocurriera en staging.

La unión con el bundle se realiza mediante una propuesta manual vinculada a la
campaña y a la revisión de readiness. El bridge no cambia estados a `verified`,
no inserta bindings automáticamente y rechaza artefactos reutilizados desde
otra campaña aunque su hash interno sea válido.

Cada check `verified` exige una referencia `evidence://`, pero su sintaxis no
demuestra autenticidad. Evidencia pendiente o ausente produce
`insufficient_evidence`; cualquier check fallido produce `blocked`. El máximo
veredicto es `ready_for_staging_review` y el manifiesto mantiene siempre
`canDeploy`, `canMigrate`, `canActivate` y `canChangePermissions` en `false`.
Solo contiene métricas agregadas por gate y nunca IDs, empresas, conexiones,
referencias de evidencia ni datos personales o financieros.

Las evidencias independientes se sellan además en un bundle de revisión
determinista. El bundle exige que los 56 controles pertenezcan a la misma
campaña, digest de fuente y tenant anonimizado; conserva el vínculo con la
revisión global o de entidad correspondiente y rechaza referencias ausentes,
duplicadas o reasignadas. El digest RBAC debe coincidir con los dos snapshots de
acceso y cualquier deriva del baseline bloquea el resultado. La salida elimina
IDs y referencias legibles, y mantiene siempre `canDeploy: false`,
`canMigrate: false`, `canActivate: false` y `canChangePermissions: false`.
`ready_for_manual_staging_review` solo habilita revisión humana del paquete; no
acredita que staging se haya ejecutado ni concede autoridad operativa.
Cada binding usa obligatoriamente una referencia content-addressed con la forma
`evidence://sha256/<digest>` derivada del `artifactDigest`. Sustituir el
artefacto sin cambiar la referencia, o la referencia sin cambiar el artefacto,
invalida el bundle.

El bundle restringe además el `artifactKind` de los treinta y dos contratos con
verificador revisado: decisión de autoridad, runtime Node 22, revisión expand-only,
dry-runs de migración y backfill, captura del baseline, acceso sin deriva, flags
apagados, restauración de backup revisada, autorización shadow, ensayo de rollback, proyección web pública
unificada, catálogo maestro compartido de cursos, registro maestro compartido
de docentes, horarios docentes shadow, cierre de matrícula shadow,
bloqueo nominal, importación
contable, aislamiento financiero global, redacción de observabilidad, revisión de perfiles legales,
mappings de campus y aulas por entidad, revisión de conexiones, referencias de
secretos, contrato no invocante del proveedor contable, fuentes externas de
cobros y publicidad, cobertura cruzada de relaciones Payload, relación explícita
de matrículas y campañas con convocatorias, rollback por
entidad, casos negativos por entidad y conciliación financiera por entidad. Son
32 tipos de gate y 56 bindings específicamente
restringidos; esta coincidencia de tipo no prueba todavía que el
verificador o el bridge se ejecutaran.
El manifiesto source-level publica
`specific_contract_coverage_complete_no_staging_execution`: cobertura completa
del contrato, pero `sourceRegisteredStagingExecutionBindings: 0`, sin afirmar que
haya inspeccionado un entorno ni ejecutado staging.

Un compositor estricto separado verifica los cincuenta y seis bindings protegidos:
recibe los treinta y dos artefactos completos, ejecuta sus
assertores, reconstruye las asociaciones mediante los bridges y exige igualdad
exacta. No confía en un recibo de hash suministrado por el llamador. Su salida
continúa obligatoriamente en `blocked_no_staging_execution_evidence`, porque un
digest reproducible no equivale a firma, attestation ni ejecución registrada. El
compositor permanece desconectado de rutas, hooks, jobs y activación.

`shared_teacher_registry_reviewed` usa el `staffId` maestro como identidad
compartida y mantiene cada relación empresa-sede en una asignación distinta.
Su matriz revisa siete casos, rechaza duplicados activos dentro de la misma
empresa y cruces de campus, tenant o entidad. No incorpora condiciones
económicas, no lee Payload y no crea ni asigna docentes reales.

`shared_course_catalog_reviewed` mantiene el curso maestro en el scope del
tenant y cada convocatoria bajo una entidad legal concreta. Su matriz de ocho
casos permite compartir un curso entre las tres empresas y bloquea duplicados,
ausencias, cruces de tenant, campus, aula o asignación docente. No incorpora
matrículas, campañas ni finanzas, y no crea o modifica datos reales.

`unified_public_web_reviewed` liga tres comparaciones shadow alineadas de la
superficie pública unificada. Cada observación debe cubrir al menos tres sedes y
tres convocatorias públicas; las salidas no contienen tenant, entidad legal ni
IDs de origen. Sus tres digests de observación deben ser distintos y se
serializan ordenados para conservar determinismo ante reordenación. El artefacto
no publica, activa ni modifica permisos y sigue separado de cualquier ejecución
real contra staging.

Los gates `access_baseline_captured` y `access_unchanged_verified` usan
artefactos separados y encadenados. El segundo solo se emite si el baseline
capturado y el actual tienen el mismo digest y política, y su bridge no contiene
operaciones de captura, activación o escritura. Estos contratos prueban
coherencia del contenido recibido; no certifican el origen productivo del
snapshot ni sustituyen una firma o una revisión externa.

Los gates `all_feature_flags_default_off` y `authorization_shadow_verified`
también se mantienen separados. El primero solo acepta los ocho flags
booleanos apagados y el modo de autorización `disabled`; el segundo exige las
cuatro combinaciones legacy/propuesta con la decisión efectiva siempre ligada
a legacy. Su bridge no expone enable, enforce, activate ni escritura. Estos
artefactos no certifican el entorno: sellan el estado y las observaciones que
reciben para revisión posterior.

`rollback_rehearsed` exige un artefacto con un caso reversible completo —nueve
controles y seis tipos de registro— y tres fallos cerrados: deriva de acceso,
cross-tenant y modificación posterior al backfill. El artefacto queda ligado al
baseline revisado y no contiene apply ni ejecución. Prueba el planificador sobre
entradas selladas, no una restauración real; la ejecución controlada de staging
continúa siendo evidencia externa obligatoria.

Cada entidad dispone además de un plan CAS independiente para los seis tipos de
registro operativo. Los tres planes comparten el artefacto global y el baseline
de acceso, pero usan scopes contables, revisiones y conjuntos de registros
distintos. No duplican el apagado de flags globales y solo aceptan
`restore_null_if_unchanged` cuando el valor actual sigue siendo la entidad
esperada. CEP Sur es el único piloto. El contrato no contiene apply ni acredita
que el rollback se haya ejecutado.

Durante implementación y validación de staging, el bloqueo nominal es
exclusivamente denegatorio. Incluso con un bundle listo para revisión manual,
mantiene deshabilitadas la generación de matrices nominales, la aplicación de
cambios, las operaciones masivas y el uso del superadmin técnico como autoridad
de negocio. Este contrato no contiene una operación de desbloqueo; la fase final
requerirá autorización explícita y rollback individual por usuario.

El gate `nominal_permission_phase_lock_verified` se respalda mediante una matriz
content-addressed de cuatro casos: dos fases cerradas por dos acciones
prohibidas, todas bajo baseline intacto, autorización deshabilitada y bundle
declarado listo para revisión. El verificador exige que los cuatro casos sigan
`locked`, sin generación, aplicación, cambio masivo ni superadmin y con rollback
individual obligatorio. Un bridge separado solo propone el binding global para
la misma campaña y readiness; mantiene `canBindAutomatically` y
`canMarkVerified` en `false` y no introduce una vía de desbloqueo.

## Rollback

Mientras el sistema esté desactivado o en modo sombra, el rollback consiste en
desactivar el cálculo y retirar la instrumentación; la autorización efectiva
sigue dependiendo del sistema actual. Las migraciones posteriores deberán ser
aditivas y reversibles antes de retirar campos o rutas heredadas.

El ensayo preparatorio enumera los siete flags shadow, el flag de importación
staging y el modo de autorización, pero no los modifica. Antes de declarar el
plan preparado exige
que el digest de usuarios, roles, permisos, memberships y accesos coincida con
el baseline capturado. Los registros backfilled solo generan una propuesta
`restore_null_if_unchanged` si conservan exactamente la entidad aplicada; un
valor cambiado después del backfill bloquea el plan y nunca se sobrescribe.
La observación exportable contiene únicamente contadores y no incluye digests,
referencias, tenant, sedes, entidades ni IDs. Este contrato prepara el ensayo;
no acredita que se haya ejecutado un rollback en staging.
