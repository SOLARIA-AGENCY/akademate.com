# CEP Formacion - Plan operativo Planning v1

**Fecha:** 2026-04-27
**Scope:** Tenant CEP Formacion en Akademate
**Input principal:** `/Users/carlosjperez/Downloads/cep_formacion_planificacion_cursos_sedes_personal.md`
**Objetivo:** convertir la informacion consolidada de CEP en un modelo operativo ejecutable para sedes, aulas, personal, cursos y convocatorias.

---

## 1. Prompt optimizado

Necesitamos planificar la implementacion por fases del modulo operativo de CEP Formacion en Akademate.

Primero debemos definir correctamente las sedes y sus aulas. Cada sede debe tener aulas/espacios con capacidad fisica, uso permitido, estado activo, turnos habilitados y reglas operativas. Esta informacion debe quedar asociada a sedes, no a cursos.

En paralelo debemos crear fichas de personal docente, academico y administrativo. El personal puede tener especialidades, sedes habituales, rol operativo y estado activo. Los docentes no pertenecen a un curso de forma exclusiva; se vinculan a convocatorias concretas.

Despues debemos cruzar los cursos detectados en el documento CEP contra los cursos ya ingestados en la base de datos. Los cursos que aparecen en el documento deben quedar activos. Los cursos existentes que no aparezcan deben pasar a no activo/inactivo operativo, sin eliminarse, porque pueden reactivarse en el futuro. Los cursos son entidades independientes de sedes, aulas y personal. El curso contiene la ficha academica/comercial base y puede tener precios base.

Finalmente debemos crear o actualizar convocatorias. Una convocatoria es una edicion concreta de un curso y debe vincular curso, sede, aula, docente/s, responsable administrativo, fechas, dias, horarios, turno, plazas, precio heredado o precio ajustado, estado y reglas de disponibilidad. La convocatoria puede heredar precio desde el curso, pero debe permitir override sin contaminar el precio base del curso.

Tambien debemos definir turnos de forma global por tenant. CEP puede operar con un maximo de 3 turnos por aula, aunque la operativa habitual use 2. Las plazas fisicas por aula y los turnos habilitados determinan la capacidad maxima operativa y, por extension, el techo teorico de facturacion del negocio.

Con esta base construiremos una matriz visual de ocupacion por sede, aula, turno y fecha. El planner debe detectar solapamientos: misma aula en la misma franja, mismo docente en dos aulas o cursos simultaneos, curso privado usando aulas restringidas de FPED en Norte, FPED usando Aula 5 Norte, capacidad excedida, fechas incoherentes y convocatorias sin docente/responsable/aula cuando sean obligatorios.

El plan debe priorizar calidad de datos y reglas de negocio antes de UI avanzada. Debe mantener trazabilidad de importacion, permitir validacion humana de datos dudosos y no eliminar registros historicos.

---

## 2. Principios de modelo

1. **Tenant-first:** todas las entidades llevan `tenant_id`.
2. **Curso independiente:** un curso no pertenece a una sede, aula ni docente.
3. **Convocatoria operativa:** sede, aula, turno, horario, docente, responsable, plazas y precio viven en la convocatoria.
4. **Precio heredable, no acoplado:** el curso define precio base; la convocatoria copia/hereda y puede sobrescribir.
5. **No borrar historico:** los cursos no detectados pasan a estado inactivo operativo, no se eliminan.
6. **Aulas como capacidad real:** las sedes deben tener aulas/espacios estructurados; la capacidad de negocio sale de aula x turno.
7. **Reglas antes que calendario:** el planner visual solo es fiable si antes existen reglas de conflicto y datos normalizados.
8. **Datos dudosos no se publican:** filas con fechas/capacidades incoherentes entran como `pending_validation`.

---

## 3. Estado actual observado

### 3.1 Ya existe en core Drizzle

- `centers`: sedes con capacidad general y metadata.
- `instructors`: docentes/instructores basicos.
- `courses`: cursos con `price`, `duration`, `status`, metadata.
- `course_runs`: convocatorias con `center_id`, `instructor_id`, fechas, plazas, precio y `schedule`.

### 3.2 Huecos operativos

- No existe tabla normalizada de aulas/espacios en Drizzle.
- Las aulas aparecen actualmente como `classrooms` embebidas en algunas pantallas de sedes.
- No hay modelo formal de turnos.
- No hay modelo de reglas de uso por aula: privado, FPED, ciclos, mixto.
- `course_runs` soporta un solo `instructor_id`; CEP necesita permitir varios docentes en algunas convocatorias.
- No hay sistema formal de conflictos de planificacion.
- No hay workflow de calidad de dato/importacion con estado de validacion.
- Los precios existen, pero falta semantica de herencia/override entre curso y convocatoria.

---

## 4. Fases de ejecucion

## Fase 0 - Normalizacion y decisiones de dominio

**Objetivo:** fijar vocabulario y evitar implementar ambiguedades.

**Acciones:**

- Definir enums operativos:
  - `training_type`: `private`, `fped`, `cycle`, `other`.
  - `operational_status`: `active`, `inactive`, `pending_validation`, `archived`.
  - `room_usage_policy`: `private_only`, `fped_only`, `cycle_only`, `mixed`, `restricted`.
  - `planning_status`: `draft`, `pending_validation`, `validated`, `published`, `cancelled`, `completed`.
  - `price_source`: `course_default`, `run_override`, `manual_import`, `unknown`.
- Definir codigos estables:
  - Sede Norte: `cep-norte`.
  - Sede Santa Cruz: `cep-santa-cruz`.
  - Aulas por sede con slug estable.
- Definir maximo operativo de turnos por tenant: `3`.
- Decidir si `administrativos` se modelan en `instructors`, `users/memberships` o nueva entidad `staff_profiles`.

**Criterio de aceptacion:**

- Documento de decisiones cerrado.
- Diccionario de datos aprobado para importacion.

---

## Fase 1 - Sedes, aulas y turnos

**Objetivo:** dejar CEP modelado fisicamente antes de tocar convocatorias.

**Datos a crear/actualizar:**

### Sede Norte

| Aula | Capacidad | Uso |
|---|---:|---|
| Aula 1 | 17 | FPED |
| Aula 2 | 17 | FPED |
| Aula 3 | 17 | FPED |
| Aula 4 | 17 | FPED |
| Aula 5 | 17 | Privados |

### Sede Santa Cruz

| Aula / espacio | Capacidad | Uso |
|---|---:|---|
| Aula Polivalente | 17 | FPED / administrativos |
| Aula MAC | 18 | FPED / privados / ciclos |
| Aula 1 | 17 | FPED / administrativos |
| Aula 2 | 18 | privados / otros |
| Aula 3 | 17 | FPED / administrativos |
| Sillones / Area comun | 22 | privados / ciclos / estetica / higiene |

**Modelo recomendado:**

- Crear `rooms` o `classrooms` como tabla propia:
  - `id`, `tenant_id`, `center_id`, `name`, `slug`, `capacity`, `usage_policy`, `active`, `metadata`.
- Crear `shifts`:
  - `id`, `tenant_id`, `name`, `code`, `start_time`, `end_time`, `sort_order`, `active`.
- Crear relacion `room_shift_availability`:
  - `room_id`, `shift_id`, `enabled`, `exceptional`.

**Turnos CEP iniciales:**

| Codigo | Nombre | Uso |
|---|---|---|
| morning | Manana | habitual |
| afternoon | Tarde | habitual |
| evening_extra | Tercer turno | excepcional |

**Criterio de aceptacion:**

- Ambas sedes existen.
- Todas las aulas existen con capacidad y uso.
- Capacidad fisica:
  - Norte: 85.
  - Santa Cruz: 109.
- Capacidad habitual 2 turnos:
  - Norte: 170 plazas/dia.
  - Santa Cruz: 218 plazas/dia.
- Capacidad excepcional 3 turnos marcada como excepcional.

---

## Fase 2 - Personal docente, academico y administrativo

**Objetivo:** crear fichas de personas antes de vincularlas a convocatorias.

**Docentes privados Santa Cruz detectados:**

- Abraham Portocarrero: Quiromasaje.
- Agustin Ramo Mesa Padilla: Entrenamiento personal.
- Alicia Martin Gonzalez: ACV / ATV.
- Angel Luis Cruz: Agente funerario.
- David Hernandez: Agente funerario.
- Elena Micello: ACV / ATV / veterinaria.
- Epifanio Jesus Hernandez Delgado: Auxiliar de enfermeria.
- Javier Jesus Garcia Jorge: Farmacia / parafarmacia / dermocosmetica.
- Javier Seoane Cruz: Entrenamiento personal.
- Jessica Hernandez Nielsen: Farmacia / SPD.
- Josep Nacher: Farmacia / clinicas esteticas.
- Lucia Corominas Perez: Farmacia / clinicas esteticas / nutricosmetica.
- Luis Jose Gonzalez: Clinicas esteticas.
- Maria Rando Falcon: Enfermeria / entrenamiento personal.
- Nerea Illesca: Clinicas esteticas.
- Nuria Esther Angel Ramos: Odontologia.
- Oscar Arteaga: Entrenamiento personal.
- Raquel Trujillo: Peluqueria canina y felina.

**Administracion detectada:**

- Sandra Rodriguez Padron: administrativo, Sede Norte.
- Veronica Virginia Chacare Bohorquez: jefa de administracion, general.
- Aurelio Daniel Diaz Acosta: administrativo, Sede Santa Cruz.
- Jan Mendez Ceballos: administrativo, Sede Santa Cruz.

**Modelo recomendado:**

- Mantener `instructors` para docentes si el scope MVP necesita solo docencia.
- Crear `staff_profiles` si se quiere cubrir administrativo, academico, docente y mixto:
  - `id`, `tenant_id`, `user_id?`, `name`, `email?`, `phone?`, `roles[]`, `primary_center_id?`, `specializations[]`, `active`, `metadata`.
- Crear tabla puente para multiples sedes:
  - `staff_center_assignments`.
- Crear tabla puente para multiples docentes por convocatoria:
  - `course_run_instructors`.

**Criterio de aceptacion:**

- Fichas creadas o actualizadas sin duplicados por nombre normalizado.
- Roles separados: docente, administrativo, jefatura, academico.
- Especialidades importadas como tags normalizados.
- Personas sin email pueden existir como ficha operativa incompleta.

---

## Fase 3 - Cursos: activar, inactivar y precios base

**Objetivo:** alinear catalogo de cursos con la realidad operativa 2026.

**Regla principal:**

- Si aparece en el documento CEP consolidado: `active = true`.
- Si existe en BD pero no aparece en el documento: `active = false` o `operational_status = inactive`.
- Nunca eliminar cursos por no aparecer.

**Curso como entidad independiente:**

- No guardar sede, aula ni docente como dependencia dura del curso.
- El curso puede tener:
  - `base_price`.
  - `enrollment_fee`.
  - `installment_amount`.
  - `installment_count`.
  - `currency`.
  - `duration_hours`.
  - `training_type_default`.

**Precios:**

- El curso define precio comercial base.
- La convocatoria hereda snapshot del precio al crearse.
- La convocatoria puede cambiar su precio sin modificar el curso.
- Cambiar precio del curso no debe reescribir convocatorias ya publicadas salvo accion explicita.

**Criterio de aceptacion:**

- Reporte de cruce:
  - cursos existentes activados,
  - cursos nuevos creados,
  - cursos existentes inactivados,
  - conflictos por nombre/tipo.
- Precio base cargado cuando el documento lo aporta.
- Cursos sin precio quedan marcados `price_source = unknown` o pendiente de validacion.

---

## Fase 4 - Convocatorias

**Objetivo:** crear ediciones concretas de cursos con planning real.

**Campos obligatorios para convocatoria validada:**

- `tenant_id`.
- `course_id`.
- `training_type`.
- `center_id`.
- `room_id`.
- `start_date`.
- `end_date`.
- `schedule` estructurado:
  - dias de semana,
  - hora inicio,
  - hora fin,
  - turno,
  - excepciones.
- `capacity`.
- `price_snapshot`.
- `planning_status`.

**Campos recomendados:**

- docentes multiples.
- responsable administrativo.
- codigo interno.
- matriculados visibles/importados.
- fuente de importacion.
- notas.
- validation flags.

**Regla de precio:**

- Al crear convocatoria:
  - copiar precio base del curso a `price_snapshot`.
  - marcar `price_source = course_default`.
- Si se edita precio de convocatoria:
  - marcar `price_source = run_override`.
  - no tocar curso.
- Si se edita precio de curso:
  - aplicar solo a futuras convocatorias por defecto.

**Criterio de aceptacion:**

- Convocatorias creadas en `pending_validation` si tienen:
  - fecha incoherente,
  - aula/capacidad dudosa,
  - docente no identificado,
  - horario incompleto,
  - precio ambiguo.
- Convocatorias completas pueden pasar a `validated`.

---

## Fase 5 - Reglas de planificacion y conflictos

**Objetivo:** impedir confirmaciones operativas imposibles.

**Reglas P1:**

1. Misma aula, fecha y franja horaria solapada = conflicto bloqueante.
2. Mismo docente en dos convocatorias solapadas = conflicto bloqueante.
3. Norte Aula 5 solo privados = FPED bloqueado.
4. Norte Aulas 1-4 solo FPED = privados bloqueados salvo override autorizado.
5. Matriculados > capacidad de aula/convocatoria = alerta alta.
6. Fecha fin anterior a fecha inicio = bloqueo.
7. Convocatoria presencial sin sede/aula = bloqueo.
8. Convocatoria validada sin docente = alerta o bloqueo segun tipo.

**Reglas P2:**

1. Responsable administrativo ausente = alerta.
2. Aula con tercer turno = alerta de excepcionalidad.
3. Curso con precio desconocido = alerta comercial.
4. Horas declaradas incompatibles con calendario = alerta.
5. FPED y privado en mismo espacio mixto Santa Cruz = requiere validacion si hay solape.

**Modelo recomendado:**

- `planning_conflicts`:
  - `id`, `tenant_id`, `course_run_id`, `type`, `severity`, `status`, `message`, `related_resource`, `detected_at`, `resolved_at`.
- Servicio `detectPlanningConflicts(courseRunId | tenantId, dateRange)`.
- Ejecutar en:
  - importacion,
  - creacion/edicion de convocatoria,
  - cambio de aula,
  - cambio de docente,
  - publicacion.

**Criterio de aceptacion:**

- No se puede publicar una convocatoria con conflicto P1 abierto.
- Las alertas P2 se muestran, pero permiten guardar borrador.

---

## Fase 6 - Planner visual y matriz de ocupacion

**Objetivo:** convertir los datos en herramienta diaria de gestion.

**Vistas necesarias:**

- Matriz por sede:
  - filas: aulas,
  - columnas: turnos / franjas horarias,
  - filtro por dia, semana, mes.
- Vista por docente:
  - agenda y solapamientos.
- Vista por curso:
  - convocatorias activas/historicas.
- Vista capacidad/facturacion:
  - plazas fisicas,
  - plazas operativas,
  - plazas ocupadas,
  - plazas libres,
  - ingreso teorico por convocatoria,
  - ingreso maximo teorico por aula/turno.

**KPIs CEP iniciales:**

- Ocupacion por sede.
- Ocupacion por aula.
- Ocupacion por turno.
- Plazas libres por convocatoria.
- Convocatorias pendientes de validacion.
- Conflictos P1/P2 abiertos.
- Carga por docente.
- Carga por administrativo.
- Potencial de facturacion por aula y turno.

**Criterio de aceptacion:**

- Planner permite detectar visualmente aulas libres/ocupadas.
- Conflictos aparecen antes de publicar.
- La matriz explica capacidad real, no solo numero de cursos.

---

## 5. Orden recomendado de implementacion tecnica

1. Crear migraciones/modelo para `rooms`, `shifts`, `room_shift_availability`, `staff_profiles`, `course_run_instructors`, `planning_conflicts`.
2. Crear seed/importador de sedes, aulas y turnos CEP.
3. Crear importador de personal CEP.
4. Extender importador de cursos para activar/inactivar y cargar precios base.
5. Crear importador de convocatorias desde markdown normalizado.
6. Implementar detector de conflictos.
7. Exponer APIs internas para sedes/aulas/turnos/personal/convocatorias.
8. Actualizar UI de sedes para aulas normalizadas.
9. Actualizar UI de personal.
10. Actualizar UI de cursos con estado operativo y precio base.
11. Actualizar UI de convocatorias con aula, turnos, docentes multiples, responsable y precio heredado/override.
12. Crear planner visual.

---

## 6. Backlog MVP

### P0

- Tabla normalizada de aulas.
- Turnos por tenant.
- Seed CEP sedes/aulas.
- Personal docente/administrativo.
- Estado activo/inactivo de cursos.
- Precio base de curso y snapshot/override en convocatoria.
- Validador de conflictos P1.

### P1

- Importador completo desde documento consolidado.
- Convocatorias `pending_validation`.
- Multiples docentes por convocatoria.
- Responsable administrativo por convocatoria.
- Planner semanal por sede/aula/turno.
- Dashboard de conflictos.

### P2

- Capacidad/facturacion teorica por aula.
- Reglas avanzadas por tipo de formacion.
- Auditoria de cambios de planning.
- Workflow de aprobacion para overrides.
- Export Excel/CSV de matriz operativa.

---

## 7. Riesgos

| Severidad | Riesgo | Mitigacion |
|---|---|---|
| P1 | Datos con fechas incoherentes contaminan planning | Importar como `pending_validation` y bloquear publicacion |
| P1 | Aulas embebidas en UI divergen de modelo DB | Normalizar aulas como tabla y migrar UI |
| P1 | Un solo instructor por `course_runs` no cubre CEP | Crear puente `course_run_instructors` |
| P1 | Cambios de precio de curso alteran convocatorias historicas | Usar snapshot en convocatoria |
| P2 | Cursos inactivos se confunden con archivados | Separar `published/archived` de `operational_active` |
| P2 | Santa Cruz tiene espacios mixtos | Reglas por aula + validacion por solape |

---

## 8. Definition of Done

- CEP tiene sedes y aulas normalizadas.
- CEP tiene turnos configurados con maximo 3.
- Personal detectado existe como ficha operativa.
- Cursos detectados estan activos; no detectados quedan inactivos sin borrarse.
- Cursos tienen precio base cuando se conoce.
- Convocatorias tienen precio snapshot editable.
- Convocatorias vinculan curso, sede, aula, turno, horario, docente/s y responsable.
- El sistema detecta conflictos P1 automaticamente.
- El planner muestra ocupacion por sede/aula/turno.
- Las filas dudosas permanecen pendientes de validacion.
