> **Objetivo:** Este documento define una arquitectura implementable y evolutiva. El agente debe auditar el repositorio y el esquema existentes antes de crear entidades nuevas; cualquier modelo conceptual aquí descrito debe reutilizar o adaptar componentes existentes cuando sean equivalentes.

# AKADEMATE - Master Architecture & Implementation Specification

Versión 1.0 - 28 de agosto de 2026

---

# 0. Cómo usar esta especificación

Este documento es simultáneamente una especificación de producto, un mapa de dominio, una arquitectura técnica y un plan de implementación. No debe ejecutarse como una reescritura big-bang. El agente debe usarlo como estado objetivo, inventariar primero el sistema existente y migrar de forma incremental y reversible.

> **Regla de ejecución:** AUDITAR -> PROPONER MAPEO -> MIGRAR POR CAPACIDADES -> VALIDAR -> ACTIVAR. Nunca crear un segundo modelo paralelo si el actual puede evolucionar sin perder integridad.

| Bloque | Propósito |
| --- | --- |
| I. Modelo de negocio y dominio | Define Account, Tenant, Blueprints, personas, matrícula, Campus, docentes, sesiones, aprendizaje, comercio y finanzas. |
| II. Plataforma | Define workflows, integraciones, agentes IA, MCP/WebMCP, seguridad, compliance, globalización y SaaS billing. |
| III. Arquitectura técnica | Define PostgreSQL/Drizzle/Payload, modular monolith, eventos, Cells, observabilidad, DR y portabilidad. |
| IV. Implementación | Define roadmap incremental, migraciones, pruebas, criterios de aceptación y provisioning inicial en OVH. |

## 0.1 Índice ejecutivo

- 1. Visión, principios e invariantes
- 2. Taxonomía organizativa y multi-tenant
- 3. Blueprints y perfiles verticales
- 4. Modelo canónico de dominio
- 5. Personas, identidad, roles y actores
- 6. Matrícula, contratos comerciales, funding y entitlements
- 7. Vida del alumno y Campus adaptativo
- 8. Docentes, sesiones, disponibilidad y scheduling
- 9. Sedes, venues, recursos y colaboradores externos
- 10. Learning, contenido, clases online y vídeo
- 11. Asistencia, acceso físico y evidencias
- 12. Evaluaciones, exámenes, expediente y credenciales
- 13. Commerce y tienda
- 14. Finanzas y contabilidad
- 15. Comunicación, workflows y automatización
- 16. Web pública, CMS y frontera de Payload
- 17. Integration Hub y Developer Platform
- 18. IA, agentes, MCP y WebMCP
- 19. Ciberseguridad Zero Trust
- 20. Trust, privacidad y compliance
- 21. Arquitectura de datos
- 22. Arquitectura de aplicación y runtime
- 23. Plataforma SaaS global
- 24. SaaS billing, entitlements y metering
- 25. Reliability, observabilidad y disaster recovery
- 26. Calidad y estrategia de pruebas
- 27. Roadmap de implementación y migraciones
- 28. Provisioning V1 en OVH
- 29. Roadmap de escalado 0 -> global
- 30. Directiva operativa para el agente de implementación
- Apéndices. Catálogos de entidades, capabilities, eventos y criterios de aceptación

*Vista por capas de la plataforma objetivo.*

---

# 1. Visión, principios e invariantes

Akademate se define como un Academy Operating System multi-vertical, multi-tenant y extensible. Debe poder servir desde un estudio de yoga con decenas de clientes hasta un grupo educativo internacional con múltiples entidades fiscales, campus, alumnos, docentes y deployments dedicados, sin bifurcar el producto.

## 1.1 Arquitectura estratégica

```text
Canonical Core
+ Academy Blueprint
+ Capability Engine
+ Policy Engine
+ Vocabulary Pack
+ Navigation Pack
+ Workflow Pack
+ Tenant Configuration
+ Provider Adapters
+ Trust / Security Layer
```

## 1.2 Invariantes no negociables

- Un único Core canónico: los verticales no crean codebases, bases de datos ni dominios paralelos.
- Plan comercial, modo de deployment, blueprint académico y modelo organizativo son dimensiones independientes.
- Un Tenant representa una frontera fiscal/contable y operativa; una sede física no crea un Tenant si pertenece a la misma empresa.
- Una nueva razón social/fiscal crea un Tenant adicional y, por tanto, una contabilidad, facturación y campus independientes.
- Person es una identidad global; sus relaciones con cada Tenant son explícitas y tenant-scoped.
- UI, API, MCP, WebMCP, apps móviles y agentes IA invocan los mismos Application Services y las mismas políticas server-side.
- Payment != Invoice != Revenue != Enrollment. Booking != Attendance. AccessEvent != Attendance. Product != Offering. Tenant != Location. PartnerOrganization != Venue.
- PostgreSQL es la fuente de verdad. Payload es CMS/configuración/editorial, no el corazón universal del dominio.
- Las integraciones externas se implementan mediante Provider Adapters; el Core no depende directamente de Stripe, Zoom, Google, Sage, lectores NFC o un LLM concreto.
- Toda acción relevante tiene Actor, Tenant, Purpose, autorización y Audit Trail.
- Los cambios de alto riesgo siguen PREVIEW -> APPROVE -> COMMIT y permiten rollback o compensación cuando proceda.
- La plataforma se diseña para Managed SaaS, Dedicated Cloud y On-Premise usando los mismos contenedores y contratos de dominio.

## 1.3 Lo que Akademate no debe convertirse en

- Una aplicación construida dentro de Payload con reglas de negocio repartidas en hooks y collections.
- Un conjunto de if tenantId == CEP o if blueprint == YOGA distribuidos por frontend y backend.
- Un ecosistema de microservicios prematuros que dependan síncronamente unos de otros.
- Una base de datos global monolítica imposible de regionalizar o aislar por Cells.
- Una aplicación que obligue a todo alumno a instalar una app móvil para recibir un servicio que ya ha pagado.
- Un sistema en el que IA o MCP tengan acceso directo a SQL, secretos o shell de producción.

# 2. Taxonomía organizativa y multi-tenant

*Account/Group agrupa Tenants; Tenant es la frontera fiscal y contable.*

## 2.1 Account / OrganizationGroup

Representa la relación comercial principal con Akademate y agrupa uno o más Tenants. Puede representar una academia individual, un grupo empresarial, una red o una franquicia. No emite por defecto las facturas académicas del grupo ni contiene matrícula propia.

| Entidad | Responsabilidad |
| --- | --- |
| Account / OrganizationGroup | Suscripción Akademate, plan, deployment, tenant seats, SSO, usuarios globales, branding compartido, políticas corporativas y reporting consolidado. |
| Tenant | Empresa/razón fiscal operativa. Frontera de contabilidad, facturación, matrícula, campus y aislamiento de datos. |
| LegalEntity | Datos fiscales del Tenant: razón social, identificación fiscal, domicilio, jurisdicción, perfiles tributarios. Regla V1: 1 Tenant = 1 LegalEntity primaria. |
| Location | Sede/ubicación física del Tenant. Un Tenant puede tener N Locations sin abrir otra contabilidad. |
| Campus | Espacio de experiencia académica/digital. Puede ser virtual, físico o híbrido y pertenece a un Tenant. |
| Venue | Lugar donde ocurre una actividad. Puede ser interno, externo, temporal, móvil o virtual. |
| PartnerOrganization | Empresa/institución colaboradora. Puede tener múltiples Venues y acuerdos. |

## 2.2 Regla fiscal

> **Invariante:** 1 razón social/fiscal operativa = 1 Tenant = 1 accounting boundary. Varias sedes de la misma empresa permanecen en el mismo Tenant. Una sede con otra razón fiscal crea un Tenant adicional.

## 2.3 Ejemplo CEP Formación

```text
CEP FORMACIÓN - OrganizationGroup
Enterprise | On-Premise
|
+-- Tenant A - Empresa fiscal A
|   +-- Contabilidad A
|   +-- Matrículas A
|   +-- Campus A
|   +-- Location física
|
+-- Tenant B - Empresa fiscal B
|   +-- Contabilidad B
|   +-- Matrículas B
|   +-- Campus B
|   +-- Location física
|
+-- Tenant C - Empresa fiscal C
|   +-- ...
|
+-- Tenant D - Empresa fiscal D
|   +-- Campus virtual
|
+-- Tenant E - Empresa fiscal E
    +-- Campus virtual
```

Los cinco Tenants pueden compartir identidad de usuarios y una capa de administración consolidada. Administrativos, docentes y alumnos pueden tener acceso cross-tenant si existen memberships y permisos explícitos. El reporting de grupo es una vista consolidada; nunca un libro contable compartido.

## 2.4 Dimensiones de configuración

| Dimensión | Valores de referencia | Pregunta que responde |
| --- | --- | --- |
| Commercial Plan | Launch / Business / Enterprise | ¿Qué puede contratar el cliente y cuáles son sus límites? |
| Deployment | Managed Cloud / Dedicated Cloud / On-Premise | ¿Dónde y con qué aislamiento se ejecuta? |
| Academy Blueprint | Professional / Wellness / Languages / Sports / Driving / ... | ¿Cómo funciona académicamente? |
| Organization Model | Single Tenant / Multi-location / Multi-tenant Group / Franchise | ¿Cómo está estructurada la organización? |
| Capabilities | recurring_sessions, external_practices, vehicles, exams, store, etc. | ¿Qué módulos funcionales están activos? |
| Policies | attendance, cancellation, access, payment, AI, privacy... | ¿Cómo se comportan esas capacidades? |
| Feature Flags | rollout técnico temporal | ¿Está desplegada/experimentándose una implementación concreta? |
| Tenant Config | preferencias editables del cliente | ¿Qué elige la academia dentro de sus entitlements? |

# 3. Blueprints y perfiles verticales

La web y el producto pueden comercializar numerosos verticales, pero no todos deben convertirse en enums rígidos. El sistema distingue Blueprint base, capabilities, delivery profile, commerce model, seasonality y organization model. Los 14 perfiles de mercado siguientes sirven como casos de prueba y presets de onboarding.

| # | Perfil | Implementación | Capacidades dominantes |
| --- | --- | --- | --- |
| 1 | Formación profesional / regulada | PROFESSIONAL_TRAINING | cursos, convocatorias, fases, asistencia, prácticas, evaluación, certificados |
| 2 | Yoga / Pilates / Wellness | WELLNESS | clases recurrentes, reservas, membresías, bonos, capacidad, no-shows |
| 3 | Deportes / clubes | SPORTS | programas, equipos, temporadas, tutores, instalaciones, trials, clinics |
| 4 | Campamentos | CAMPS | semanas/turnos, menores, tutores, capacidad, depósitos, documentación |
| 5 | Música / danza / artes | MUSIC_DANCE | clases recurrentes/1:1, familias, estudios, actuaciones, ensayos |
| 6 | Online / cohortes | ONLINE_COHORTS | programas, cohortes, campus, tareas, comunidad, progreso |
| 7 | Idiomas | LANGUAGES | niveles, placement tests, grupos, mensualidad, híbrido, 1:1 |
| 8 | Coding academy | CODING_ACADEMY | bootcamps, proyectos, mentorías, cohortes, certificaciones |
| 9 | Tutoring / apoyo escolar | TUTORING | hora/bonos/mensualidad, 1:1 o grupos, consumo de créditos |
| 10 | Certification provider | CERTIFICATION | formación opcional, examen, intentos, recertificación, credenciales |
| 11 | Centro híbrido | Capability/Delivery profile | mezcla presencial/online; no necesariamente blueprint independiente |
| 12 | Subscription studio | Commerce/Access profile | tiers, suscripción, unidades incluidas, extras; combina con Wellness u otros |
| 13 | Workshops / Clinics / Events | Offering profile | eventos temporales, venues variables, coaches, merchandising, seasonal standby |
| 14 | Autoescuela | DRIVING_SCHOOL | teoría 1:N, prácticas 1:1, vehículos, packs, examen, disponibilidad triple |

## 3.1 Blueprint inheritance

```text
baseBlueprint: PROFESSIONAL_TRAINING
customBlueprint: CEP_PROFESSIONAL_TRAINING
blueprintVersion: 1
enterpriseOverrides: [...]
```

Enterprise puede heredar un Blueprint estándar y extenderlo de manera versionada. El objetivo es evitar que customizaciones contractuales se conviertan en forks de código.

## 3.2 Onboarding adaptativo

1. Tipo de academia / modelo principal.
1. Cómo se enseña: 1:1, grupos, recurrente, cohortes, online, híbrido, prácticas externas, estacional.
1. Espacios y recursos: aulas, estudios, campos, vehículos, instrumentos, virtual rooms.
1. Modelo comercial: pago único, cuotas, membresía, packs, per-session, depósitos, financiación, beca/subvención.
1. Tipo de alumnado: adultos, menores/tutores, socios, atletas, candidatos, empleados corporativos, familias.
1. Campus: desactivado, opcional, recomendado o requerido por rol; app nativa nunca obligatoria.
1. Web: web Akademate, web existente, embeds, dominio propio; seleccionar template compatible.
1. Vista previa: menú, vocabulario, módulos, dashboard, checkout y web antes de confirmar.

# 4. Modelo canónico de dominio

El modelo canónico permite que vocabulario y workflows cambien sin renombrar tablas ni duplicar lógica. Las entidades de negocio deben vivir en módulos con fronteras explícitas, no como un grafo indiscriminado de relaciones.

```text
Person
Account / OrganizationGroup
Tenant / LegalEntity
Offering -> OfferingRun -> Phase -> Session
Enrollment / Membership / Entitlement
InstructorEngagement / InstructorAssignment
Location / Venue / Resource / PartnerOrganization
Booking / Attendance / Access
Assessment / ExamAttempt / AcademicRecord / Credential
Product / Order / Payment
Invoice / Ledger / JournalEntry
Conversation / Notification
Workflow / Automation
Integration / Agent / Audit / Compliance
```

## 4.1 Límites de bounded contexts

| Contexto | Responsabilidad | No debe poseer |
| --- | --- | --- |
| Identity & People | identidades, memberships, guardian relations, actor context | reglas de matrícula o facturación |
| Academic | offerings, runs, phases, sessions, enrolments académicos | pagos o contabilidad |
| Scheduling | disponibilidad, conflictos, viajes, recursos, reservas | verdad financiera |
| Learning | contenido, progreso, tareas, sesiones online | contabilidad o RBAC global |
| Assessment | tests, exámenes, intentos, rúbricas, resultados | emisión fiscal |
| Credentials | expedientes, certificados, credenciales, verificación | admisiones comerciales |
| Commerce | productos, carrito, pedidos, fulfillment | ledger contable como fuente de verdad |
| Finance | billing, invoices, payments, accounting, analytics financiera | reglas pedagógicas |
| Access & Attendance | check-in, evidencias, acceso físico, presencia | matrícula comercial |
| Communication | conversaciones, plantillas, notificaciones y routing | autorización final de acciones críticas |
| Integration | adaptadores externos, webhooks, health | reglas de negocio verticales |
| Trust | seguridad, privacidad, AI governance, compliance, audit | lógica académica principal |

# 5. Personas, identidad, roles y actores

## 5.1 Person global

Una persona no se duplica por Tenant. La misma identidad puede ser alumno, docente, tutor, administrativo o combinación de roles en distintos Tenants. Las relaciones operativas sí pertenecen a cada Tenant.

```text
Person
+-- TenantMembership -> Tenant A (ADMIN)
+-- StudentRelationship -> Tenant B
+-- InstructorEngagement -> Tenant C
+-- GuardianRelationship -> Child Person
+-- AccountMembership -> OrganizationGroup
```

## 5.2 Actor como concepto de seguridad

| ActorType | Ejemplos | Identidad/Autorización |
| --- | --- | --- |
| HUMAN | alumno, profesor, admin, tutor | User session + memberships + RBAC/ABAC |
| AI_AGENT | Scheduling Agent, Finance Assistant | AgentIdentity + delegated grants + risk policy |
| SERVICE | worker, integration service | service identity + scoped credentials |
| DEVICE | NFC reader, kiosk, edge gateway | device identity/certificate + device policy |

Toda operación importante incluye ActionContext: actorType, actorId, delegatedBy, accountId, tenantId, purpose, channel, correlationId, timestamp y policy decision.

## 5.3 Cross-tenant permissions

La pertenencia al OrganizationGroup no concede automáticamente acceso a todos los Tenants. El acceso se deriva de AccountMembership + TenantMembership + ResourcePolicy. Un usuario autorizado a varios Tenants puede cambiar de contexto o consultar vistas consolidadas sin romper las fronteras fiscales.

## 5.4 Guardian / family model

Los menores requieren GuardianRelationship con permisos granulares: canPay, canBook, canSign, canViewSchedule, canReceiveNotifications y scopes académicos. Nunca modelar simplemente parentEmail.

# 6. Matrícula, contratos comerciales, funding y entitlements

El concepto universal no es una “matrícula” académica. El Core separa la relación académica, el acuerdo comercial, el calendario de cobro y los derechos de uso.

```text
Offering
  -> Enrollment
      -> CommercialAgreement
           -> PriceComponents
           -> BillingPlan / BillingSchedule
           -> FundingAllocations
      -> Entitlements
      -> Academic / Campus access
```

## 6.1 PriceComponent catalog

| Tipo | Uso |
| --- | --- |
| REGISTRATION_FEE | alta/matrícula/expediente |
| TUITION | precio de formación |
| MEMBERSHIP | membresía recurrente |
| SESSION | sesión individual |
| SESSION_PACK | bono de sesiones |
| PROGRAM_FEE | programa completo |
| EVENT_FEE | clinic/workshop/evento |
| EXAM_FEE | derecho o tasa de examen |
| CERTIFICATION_FEE | emisión/gestión de certificación |
| INSURANCE | seguro obligatorio u opcional |
| LICENSE_FEE | licencia/federación |
| MATERIAL | libros/material |
| EQUIPMENT | equipamiento/ropa/uniforme |
| TRANSPORT | transporte |
| ACCOMMODATION | alojamiento |
| MEALS | manutención |
| PRACTICE | práctica adicional |
| OTHER | extra configurable |

Cada componente declara required/optional, included/separatelyCharged, tax category, sellerTenant, accounting category y fulfillment/entitlement cuando corresponda.

## 6.2 Enrollment templates por perfil

| Perfil | Relación principal | Cobro típico |
| --- | --- | --- |
| Professional / CEP | Enrollment a OfferingRun | registration fee + tuition; pago único/cuotas/financiación; extras |
| Wellness | Membership / booking access | alta opcional + mensual/trimestral/semestral/anual + day/week pass + packs |
| Sports | Season/Program/Team enrollment | inscripción + mensualidad/temporada + seguro/licencia/equipación + clinics |
| Camps | Turn/Week enrollment | precio completo o depósito + saldo + extras |
| Music/Dance | Program/Class relationship | matrícula anual + mensualidad + individual + extras |
| Online/Cohorts | Program enrollment | pago único/cuotas/suscripción + tutorías/certificación |
| Languages | Level/Group enrollment | matrícula + mensualidad/trimestre/curso + intensivos/1:1 |
| Coding | Bootcamp/Cohort | reserva + saldo/cuotas/financiación |
| Tutoring | Service/Pack | por hora, pack, mensualidad |
| Certification | Candidate / exam right | formación+examen, examen solo, reintento, recertificación |
| Hybrid | Composición | combina tuition/subscription/sessions/campus |
| Subscription Studio | Membership tier | cuota recurrente + créditos incluidos + extras |
| Clinic/Event | Event registration | ticket/precio completo/early bird/depósito + extras |
| Driving School | Permit/service bundle | matrícula + teoría + pack prácticas + tasas/examen + extras |

## 6.3 Entitlement Engine

El pago puede generar derechos, pero Payment y Entitlement permanecen separados. Entitlement representa qué puede consumir o utilizar una persona: acceso a un curso, X clases, 10 prácticas, un examen, un campus, un contenido o un evento.

```text
Entitlement
- ownerPersonId
- tenantId
- sourceOrderItemId / sourceEnrollmentId
- type
- quantity / remainingQuantity
- validFrom / validUntil
- status
- consumptionPolicy
- transferPolicy
- metadata
```

## 6.4 Becas, descuentos y subvenciones

> **Regla financiera:** Un curso subvencionado no pasa a tener precio cero. Se conserva el valor económico y se distribuye la obligación de pago entre Student y FundingSource.

```text
Course value: 2,000 EUR
FundingAllocation:
  Student       500 EUR
  Scholarship 1,500 EUR
```

FundingAgreement puede representar SCHOLARSHIP, PUBLIC_SUBSIDY, EMPLOYER, SPONSOR u OTHER y contener condiciones como attendance >= 80%, completion, documentation o assessment. Las condiciones generan alertas de riesgo; no modifican automáticamente contabilidad sin una regla contractual aprobada.

# 7. Vida del alumno y Campus adaptativo

## 7.1 Ciclo de vida universal

```text
PROSPECT
 -> APPLICATION / PURCHASE
 -> ENROLLMENT
 -> FINANCIAL SETUP
 -> ONBOARDING
 -> ACTIVE LEARNER
 -> SESSIONS / BOOKINGS / CONTENT
 -> ATTENDANCE + PROGRESS
 -> ASSESSMENT / REQUIREMENTS
 -> COMPLETION
 -> ALUMNI / RENEWAL / NEXT OFFERING
```

Cada Blueprint activa sólo las etapas pertinentes. Un clinic puede durar tres días; una membresía de yoga puede ser indefinida; un programa profesional puede durar un año.

## 7.2 Campus no obligatorio

> **Principio de adopción:** Todo alumno puede ser gestionado por Akademate; Campus es una capability configurable; el uso de app nativa nunca es requisito técnico para recibir el servicio.

| Policy | Comportamiento |
| --- | --- |
| DISABLED | Akademate se usa internamente. Alumno sin login. |
| OPTIONAL | Alumno puede usar Campus, recepción/docente puede operar en su nombre. |
| RECOMMENDED | Campus aporta autoservicio pero existen alternativas. |
| REQUIRED | Cuenta Campus necesaria por procesos académicos; web sigue siendo alternativa a app nativa. |

## 7.3 Superficies del alumno

- Hoy / próximas actividades
- Calendario
- Mi formación / membresías
- Reservas y listas de espera
- Contenido y teoría
- Asistencia y progreso
- Evaluaciones y resultados
- Expediente y certificados
- Mensajes
- Documentos
- Pagos y facturas
- Tienda
- Acceso QR/NFC cuando exista
- Perfil y preferencias

La navegación es capability-driven. Yoga no debe mostrar ciclos, prácticas o expediente si no los utiliza; Professional Training sí puede mostrarlos.

## 7.4 Experiencia por dispositivo

| Superficie | Prioridad |
| --- | --- |
| iPhone / Android | Hoy, calendario, reservas, QR/NFC, notificaciones, mensajes, pagos, contenido rápido. |
| iPad | estudio, PDF/vídeo, evaluaciones, notas, clases online; también modo kiosk/teacher classroom. |
| Web/Desktop | trabajo intensivo: contenido, coding, tareas, exámenes largos, documentos, reporting personal. |
| Recepción/Backoffice | operación asistida para alumnos sin app: booking, cobro, check-in, identificación y soporte. |

# 8. Docentes, sesiones, disponibilidad y scheduling

## 8.1 Modelo docente

```text
Person
 -> InstructorProfile
     -> qualifications / skills / certifications
 -> InstructorEngagement (per Tenant)
     -> contract / compensation / roles / allowed session types
 -> InstructorAssignment
     -> Offering | Run | Phase | Module | Session | Student
 -> GlobalPersonCalendar
```

Un mismo docente puede tener diferentes relaciones contractuales, tarifas, permisos y sedes en distintos Tenants sin duplicar su identidad.

## 8.2 Session como unidad operativa

Session debe soportar cualquier cardinalidad de docentes y participantes: 1:1, 1:N, N:1 y N:M. Una convocatoria puede tener múltiples docentes por especialidad y una misma sesión práctica puede tener varios profesores simultáneos.

| Caso | Instructors | Participants | Recursos adicionales |
| --- | --- | --- | --- |
| Autoescuela práctica | 1 | 1 | 1 vehículo + punto de recogida |
| Autoescuela teoría | 1 | N | aula/virtual room |
| Yoga grupal | 1 | N | sala + capacidad |
| Yoga/idiomas privado | 1 | 1 | sala o virtual |
| Clinic | N | N | campo/venue + equipamiento |
| Práctica enfermería | N | N | lab/aula/material |

## 8.3 InstructorAssignment roles

- LEAD_INSTRUCTOR
- CO_INSTRUCTOR
- ASSISTANT
- TUTOR
- COACH
- EXAMINER
- SUPERVISOR
- SUBSTITUTE
- OBSERVER

Las horas docentes se calculan por Assignment y SessionExecution. Una sesión de cuatro horas con dos docentes genera ocho horas-docente si ambos impartieron cuatro horas.

## 8.4 SchedulingConstraintEngine

| Constraint | Ejemplos |
| --- | --- |
| Temporal overlap | docente/alumno/room/vehicle no pueden estar en dos sesiones incompatibles |
| Availability | calendario contractual, preferencias, excepciones, vacaciones |
| Qualification | certificaciones/requisitos para impartir una sesión |
| Capacity | aforo de sala/venue/session |
| Resource | vehículo, instrumento, equipo, aula |
| Travel/transition | tiempo de desplazamiento y buffers entre lugares |
| Working limits | máximo diario/semanal, descansos, consecutivas |
| Tenant/Policy | sedes autorizadas, restricciones contractuales, privacidad |

## 8.5 Desplazamiento

```text
earliestStart(B) >= end(A)
                 + travelTime(A.location, B.location)
                 + transitionBuffer(A, B)
```

El calendario del docente es global entre Tenants. El motor puede conocer un compromiso en otra empresa aunque la UI sólo revele “ocupado hasta 14:45” si la política de privacidad no permite mostrar el detalle.

## 8.6 Instructor Workspace

- Hoy / Mi día
- Calendario global
- Mis sesiones
- Abrir / iniciar / finalizar sesión
- Pasar y validar asistencia
- Material y contenidos
- Alumnos/grupos asignados
- Evaluaciones y feedback
- Mensajes contextuales
- Disponibilidad
- Sustituciones
- Documentos/certificaciones
- Actividad impartida y, cuando aplique, horas/importe estimado

# 9. Sedes, venues, recursos y colaboradores externos

## 9.1 Location, Campus y Venue

| Concepto | Significado |
| --- | --- |
| Location | sede física gestionada por un Tenant |
| Campus | espacio académico/digital del Tenant: virtual, physical o hybrid |
| Venue | lugar concreto de una Session/Run; puede ser interno, externo, temporal, móvil, outdoor o virtual |
| Resource | recurso reservable: sala, vehículo, instrumento, equipamiento, dispositivo |
| PartnerOrganization | empresa/institución colaboradora; puede poseer o referenciar múltiples Venues |

## 9.2 Prácticas externas

```text
PracticePlacement
- studentId
- tenantId
- offeringId / runId / phaseId?
- partnerOrganizationId
- venueId
- externalTutorId?
- internalTutorId?
- startDate / endDate
- plannedHours / completedHours
- attendance / status / documents
```

Las prácticas pueden formar parte de una fase del curso o comenzar tras finalizar la fase lectiva. Cada alumno puede estar en una empresa distinta. El aula interna se libera cuando las sesiones se desplazan a un venue externo.

## 9.3 Academias/clinics sin sede fija

Un Tenant no necesita una Location permanente. Clinics, workshops, camps o academias itinerantes pueden asignar Venue por OfferingRun/Session. La facturación y la identidad fiscal siguen en el Tenant, no en el venue.

## 9.4 Seasonality

```text
TenantOperatingState:
ACTIVE
SEASONAL_STANDBY
SUSPENDED
ARCHIVED
```

SEASONAL_STANDBY conserva datos, histórico, catálogo y configuración con una política de coste/retención propia. El plan comercial puede permitir periodos de standby y reactivación sin migración ni pérdida de información.

# 10. Learning, contenido, clases online y vídeo

## 10.1 Modelo de contenido

```text
LearningPath
 -> Module
    -> Lesson
       -> ContentAsset / Activity / Assignment

Content types:
VIDEO | DOCUMENT | AUDIO | INTERACTIVE | LINK | LIVE_SESSION | SCORM/LTI adapter
```

El motor debe permitir availability windows, prerequisites, completion rules, downloadable/stream-only y progreso. No acoplar el Core a un proveedor de vídeo o a un LMS externo concreto.

## 10.2 Clases online

```text
Session.deliveryMode:
IN_PERSON | ONLINE | HYBRID | MOBILE

VirtualMeeting
- sessionId
- provider
- externalMeetingId
- joinUrl / hostUrl
- attendanceSync
- recordingPolicy
- status
```

VideoConferenceProvider ofrece createMeeting/update/cancel/getParticipants/getAttendance/getRecording. Adaptadores posibles: Google Meet, Zoom, Microsoft Teams y futuros proveedores.

## 10.3 Grabaciones y multimedia

Recording y VideoAsset tienen políticas de acceso, retención, disponibilidad y consentimiento. Los archivos pesados se cargan directamente a object storage o media provider mediante signed URLs; nunca deben atravesar innecesariamente la RAM del servidor de aplicación.

# 11. Asistencia, acceso físico y evidencias

## 11.1 Separaciones

```text
Booking != AccessEvent != CheckIn != AttendanceRecord
```

Una reserva es intención, un acceso prueba entrada a una instalación, un check-in es una señal operacional y AttendanceRecord representa la conclusión de presencia según una policy.

## 11.2 AttendanceRecord

```text
AttendanceRecord
- personId
- sessionId
- status: PRESENT | ABSENT | LATE | LEFT_EARLY | EXCUSED | NO_SHOW
- checkInAt / checkOutAt
- attendedMinutes
- verificationStatus
- source
- verifiedBy
```

## 11.3 AttendanceEvidence

- INSTRUCTOR_CONFIRMATION
- ADMIN_CONFIRMATION
- QR_SCAN
- NFC_SCAN
- ACCESS_GATE
- ONLINE_JOIN
- ONLINE_LEAVE
- SELF_CHECKIN
- MANUAL_IMPORT

La autodeclaración puede ser UNVERIFIED hasta validación. Formación regulada o subvencionada puede exigir evidencias de mayor autoridad.

## 11.4 AttendancePolicy

- NONE
- TRACK_ONLY
- MIN_PERCENTAGE
- MIN_HOURS
- MIN_SESSIONS
- MANDATORY_SESSIONS
- ALL_SESSIONS
- CUSTOM

EligibilityEngine consume asistencia cuando un examen, subvención o certificación exige mínimos. La regla se configura por Offering/Run/Assessment, no por vertical hardcodeado.

## 11.5 Access Engine

El derecho de entrada reside en AccessGrant, no en el teléfono. AccessCredential sólo representa cómo se identifica el usuario.

```text
AccessCredential.type:
MOBILE_QR | MOBILE_NFC | PHYSICAL_NFC | PHYSICAL_CARD |
PRINTED_QR | STAFF_LOOKUP | TEMPORARY_CODE
```

La recepción debe poder admitir manualmente a una persona con entitlement válido si no tiene móvil o ha perdido el dispositivo. Los lectores hardware se integran mediante AccessControlProvider/Device Gateway y pueden mantener una allowlist offline de corta duración.

# 12. Evaluaciones, exámenes, expediente y credenciales

## 12.1 Assessment Engine

- QUIZ
- TEST
- EXAM
- PRACTICAL_EXAM
- ORAL_EXAM
- PROJECT
- ASSIGNMENT
- COMPETENCY_ASSESSMENT
- PLACEMENT_TEST
- EXTERNAL_EXAM
- CONTINUOUS_ASSESSMENT

Assessment declara deliveryMode, gradingMode, passingRule, attemptPolicy, timeLimit, availabilityWindow, eligibilityPolicy, proctoringPolicy y resultReleasePolicy.

## 12.2 Question Bank y versionado

Question y QuestionVersion son separados. Cada ExamAttempt referencia exactamente las versiones mostradas al candidato para que el examen histórico sea reproducible aunque la pregunta se edite después.

| Question type | Uso |
| --- | --- |
| SINGLE/MULTIPLE_CHOICE | tests automáticos |
| TRUE_FALSE | evaluación objetiva |
| SHORT/LONG_TEXT | respuesta libre/manual o híbrida |
| NUMERIC | cálculo |
| MATCHING/ORDERING/FILL_BLANK | interactivos |
| FILE_UPLOAD | proyectos/documentos |
| CODE | coding academies |
| AUDIO/VIDEO_RESPONSE | idiomas/oral/práctica |

## 12.3 Exam lifecycle

```text
Eligibility
 -> ExamEntitlement (free or purchased)
 -> ExamBooking / ExamSession
 -> ExamAttempt
 -> Grading / Review
 -> Result
 -> Appeal (optional)
 -> AcademicRecord
 -> Credential eligibility
```

Los exámenes pueden ser online, presenciales, híbridos o externos. Proctoring es Provider-based y cualquier uso de IA con impacto alto requiere clasificación, evaluación de riesgo y human oversight.

## 12.4 Academic Record

AcademicRecord pertenece al Tenant que lo emite. Person puede tener múltiples expedientes de distintos Tenants. El alumno puede ver una vista consolidada, pero esa vista no sustituye los expedientes oficiales separados.

## 12.5 Credential Engine

- INTERNAL_CERTIFICATE
- COURSE_COMPLETION
- ATTENDANCE_CERTIFICATE
- MICROCREDENTIAL
- OPEN_BADGE
- PROFESSIONAL_CERTIFICATION
- EXTERNAL_CREDENTIAL
- OFFICIAL_QUALIFICATION

CredentialProvider abstrae emisión, verificación, revocación, reemisión y exportación. Preparar interoperabilidad con estándares de credenciales verificables/Open Badges/Europass cuando aplique; emitir una credencial técnicamente no concede a una academia autoridad legal para otorgar una titulación oficial.

## 12.6 Verification

Los certificados/credenciales pueden incluir verificationCode/QR y una URL pública de verificación con exposición mínima de datos. Estados: ACTIVE, EXPIRED, REVOKED, SUSPENDED, SUPERSEDED.

# 13. Commerce y tienda

## 13.1 Product vs Offering

> **Invariante:** Offering es la actividad académica/deportiva. Product es algo que se puede comprar. Pueden relacionarse, pero no son la misma entidad.

```text
Offering: Clinic Tenerife 2027
Products:
- Entrada Clinic
- Entrada VIP
- Camiseta
- Cena final
- Examen / certificación asociada
```

## 13.2 Commerce Core

```text
Product
 -> ProductVariant
 -> Price
 -> Cart
 -> Order
 -> OrderItem
 -> Payment
 -> Refund
 -> Fulfillment
```

- PHYSICAL
- DIGITAL
- SERVICE
- FEE
- ENTITLEMENT
- EVENT
- EXAM
- CERTIFICATION
- SESSION_PACK
- OTHER

## 13.3 Fulfillment

- SHIP_PRODUCT
- PICKUP_PRODUCT
- GRANT_ENTITLEMENT
- CREATE_ENROLLMENT
- CREATE_EXAM_RIGHT
- CREATE_BOOKING_CREDIT
- GRANT_DIGITAL_ACCESS

## 13.4 Store surfaces

El mismo catálogo alimenta Web pública, Campus Store y Reception/POS. Product.visibility puede ser PUBLIC, STUDENTS_ONLY, MEMBERS_ONLY, SPECIFIC_ENROLLMENTS, SPECIFIC_GROUP o PRIVATE_LINK. Un producto siempre tiene sellerTenantId.

## 13.5 Checkout multi-tenant

> **Regla V1:** 1 sellerTenant = 1 checkout = 1 invoice boundary. Una experiencia cross-tenant puede mostrar productos de varios Tenants, pero debe separar la transacción fiscal.

# 14. Finanzas y contabilidad

## 14.1 Capas financieras

1. Commercial: qué se vende y a quién.
1. Billing: qué se cobra y cuándo.
1. Invoicing: documento fiscal.
1. Payments/Treasury: movimiento real de dinero.
1. Accounting: representación contable.
1. Financial Analytics: sede, curso, profesor, producto, partner, etc.

## 14.2 Flujo universal

```text
Enrollment / Order / Membership
 -> CommercialAgreement
 -> BillingPlan / BillingSchedule
 -> Invoice
 -> Payment
 -> AccountingEvent
 -> JournalEntry
```

## 14.3 Accounting boundary

> **Invariante:** JournalEntry.tenantId y ledgerId son obligatorios. ConsolidatedReporting suma Tenants; nunca crea un SharedLedger de operaciones normales.

## 14.4 Revenue recognition

Diseñar desde el inicio RevenueRecognitionPolicy aunque la V1 use reglas sencillas: IMMEDIATE, OVER_SERVICE_PERIOD, ON_SESSION_DELIVERY, ON_EVENT_COMPLETION o MANUAL. Cobrar 720 EUR de una membresía anual no implica necesariamente reconocer 720 EUR de ingreso en el mismo instante.

## 14.5 Multi-payer

Student y Payer son conceptos distintos. Un CommercialAgreement puede repartir la obligación entre alumno, tutor, empresa, administración, beca o patrocinador. Cada receivable conserva su pagador y fuente.

## 14.6 Payments

PaymentProviderAdapter desacopla Stripe, PayPal, transferencia, efectivo, domiciliación, TPV u otros. No almacenar PAN/CVV. Soportar pending, authorized, paid, failed, cancelled, refunded, partially_refunded y disputed, además de idempotencia y webhooks verificados.

## 14.7 Docentes y costes

```text
SessionExecution
 -> InstructorTeachingLedger (per instructor assignment)
 -> Approval
 -> InstructorPayable
 -> Payroll / SupplierInvoice according to engagement
```

CompensationModel puede ser SALARIED, HOURLY, PER_SESSION, PER_STUDENT, PERCENTAGE, FIXED_PROGRAM_FEE, EXTERNAL_PROVIDER, UNPAID o CUSTOM.

## 14.8 Partners, venues e intercompany

PracticePlacement o Session no generan gasto por sí mismos. PartnerAgreement/VenueRental/IntercompanyAgreement define la consecuencia económica. Un grupo puede registrar revenue/expense intercompany sin mezclar los ledgers de sus Tenants.

## 14.9 AccountingRuleEngine

No implementar if yogaMembership -> account X. AccountingRule resuelve economicEventType + productCategory + taxProfile + recognitionPolicy -> JournalTemplate. Las reglas son versionadas y auditables.

# 15. Comunicación, workflows y automatización

## 15.1 Communication Hub

```text
Notification / Message
 -> NotificationRouter
    -> IN_APP
    -> PUSH
    -> EMAIL
    -> SMS
    -> approved external channels
```

El usuario puede tener CommunicationPreference por tipo de evento y los Tenants pueden conectar proveedores propios. El profesor no necesita exponer su email personal; una Conversation queda contextualizada por Tenant, Offering, Session y participantes autorizados.

## 15.2 Communication templates

- BOOKING_CONFIRMED
- SESSION_CANCELLED
- PAYMENT_DUE
- PAYMENT_FAILED
- NEW_CONTENT
- EXAM_AVAILABLE
- PRACTICE_ASSIGNED
- WAITLIST_PROMOTED
- CERTIFICATE_READY

## 15.3 Automation Engine

```text
TRIGGER
 -> CONDITIONS
 -> ACTIONS

Example:
practiceCreditsChanged
AND remaining <= 2
THEN notify learner + expose PracticePack product
```

Automation es event-driven. No debe autorizar acciones fuera de RBAC/Policy Engine. Acciones financieras, datos masivos o high-risk pueden requerir aprobación.

## 15.4 Workflow Engine

```text
Enrollment:
APPLICATION -> DOCUMENTS_PENDING -> PAYMENT_PENDING -> ENROLLED -> ACTIVE

Practice:
REQUESTED -> COMPANY_ASSIGNED -> AGREEMENT_PENDING -> APPROVED -> ACTIVE -> COMPLETED

Exam:
NOT_ELIGIBLE -> ELIGIBLE -> PURCHASED -> SCHEDULED -> ATTENDED -> PASSED/FAILED
```

# 16. Web pública, CMS y frontera de Payload

## 16.1 Responsabilidad de Payload

- Páginas y layout editorial
- Website template engine
- Media metadata y assets
- Blog/news
- SEO
- Bloques reutilizables
- Contenido editable
- Configuración editorial seleccionada
- Catálogo público como proyección cuando proceda

> **Frontera:** Payload no debe convertirse en la única capa de dominio para sesiones, attendance, finance, payments, exams, scheduling o accounting. Esos módulos viven en Application/Domain Services sobre PostgreSQL/Drizzle.

## 16.2 Website Template Engine

Cada Blueprint ofrece familias de cuatro templates realmente diferenciados. El contenido se desacopla del layout; cambiar template no pierde cursos, clases, precios, profesores, SEO, forms ni leads.

- Hero
- FeatureGrid
- Schedule
- OfferCatalogue
- TeacherGrid
- Testimonials
- Pricing
- Memberships
- FAQ
- LeadForm
- BookingWidget
- Locations
- Events
- CTA
- ProductGrid
- Cart/Checkout entry points

## 16.3 Rutas adaptativas

Las rutas públicas se resuelven desde Blueprint/Vocabulary/Capabilities. Ejemplos: /clases y /membresias para Wellness; /cursos y /convocatorias para Professional; /teoria y /practicas para Driving. No hardcodear por Tenant.

# 17. Integration Hub y Developer Platform

## 17.1 Provider abstractions

| Provider interface | Ejemplos |
| --- | --- |
| VideoConferenceProvider | Google Meet, Zoom, Teams |
| CalendarProvider | Google Calendar, Microsoft 365, iCalendar |
| PaymentProvider | Stripe, PayPal, manual/bank providers |
| AccountingConnector | Sage/Holded/Xero/QuickBooks/custom according to market |
| SignatureProvider | external e-sign providers, OTP/simple acceptance |
| AccessControlProvider | NFC/RFID/QR/door/turnstile adapters |
| MediaProvider | object storage/video streaming |
| AIProvider | OpenAI/others/private/local |
| Email/SMS Provider | transactional and messaging |
| ProctoringProvider | manual/external proctoring |
| LearningIntegrationProvider | SCORM/xAPI/LTI or LMS bridges |
| IdentityProvider | OIDC/SAML/SCIM/enterprise SSO |

## 17.2 Integration record

```text
IntegrationConnection
- tenantId / accountId
- providerType
- providerKey
- encryptedCredentialRef
- scopes
- status
- health
- region/data-processing metadata
- webhook configuration
- retry policy
- audit metadata
```

## 17.3 Public API / Webhooks / SDK

API versionada y tenant-scoped. Webhook subscriptions con firma, idempotencia, retry y dead-letter. A medio plazo: developer tenants, API keys/OAuth apps, SDK TypeScript/Python, sandbox y marketplace. Nunca romper contratos públicos sin política de deprecación.

## 17.4 Device Gateway

Lectores NFC/QR/turnstiles y hardware no se conectan directamente a PostgreSQL. Device Gateway autentica dispositivos, recibe eventos y aplica AccessPolicy. Enterprise puede desplegar un Edge Gateway local con cache offline.

# 18. IA, agentes, MCP y WebMCP

## 18.1 Interaction & Agent Plane

Human UI, API clients, MCP, WebMCP, internal agents y devices son canales diferentes hacia los mismos Application Services. Ningún canal posee una ruta privilegiada al Core.

## 18.2 AgentIdentity y delegación

```text
AgentIdentity
- ownerAccountId / ownerTenantId?
- purpose
- allowedCapabilities
- allowedTools
- dataScopes
- autonomyLevel
- status

AgentGrant
- agentId
- delegatorActorId
- tenantScope
- permissions
- expiry
- budgets / limits
```

## 18.3 Autonomy levels

| Nivel | Capacidad |
| --- | --- |
| A0 ANSWER_ONLY | responder sin consultar datos privados |
| A1 READ | consultar recursos autorizados |
| A2 DRAFT | preparar horarios, emails, matrículas, facturas sin confirmar |
| A3 LIMITED_ACTION | acciones reversibles y autorizadas |
| A4 SUPERVISED_AUTONOMY | secuencias con límites y approval gates |
| A5 SYSTEM_AUTOMATION | agentes internos especializados con políticas estrictas |

## 18.4 Tool risk classes

| Risk | Ejemplos | Control |
| --- | --- | --- |
| R0 | public/read-only innocuous | normal authorization |
| R1 | authenticated read / reversible | grant + tenant scope |
| R2 | operational write | policy + optional confirmation |
| R3 | invoice/refund/export/grade/pay approval | step-up + human approval by policy |
| R4 | bank account/RBAC/security/bulk delete/accounting close | human-only or dual approval |

## 18.5 PREVIEW -> APPROVE -> COMMIT

Scheduling, finance, migrations, bulk communications, imports y cambios críticos deben soportar drafts/plans idempotentes. El agente propone; la autoridad humana aprueba según RiskClass y Policy.

## 18.6 MCP Server

MCP se expone como interfaz oficial de plataforma con catálogo dinámico de tools según Tenant, RBAC, capabilities, AgentGrant y risk policy. tenantId proporcionado por el modelo nunca amplía el scope derivado del token. Usar OAuth/OIDC, tokens de corta duración, revocación y no reenviar tokens a servidores externos.

## 18.7 WebMCP

WebMCP se considera progressive enhancement para superficies web, no dependencia del Core. Las tools WebMCP llaman al API/Application Service autenticado; nunca ejecutan privilegios únicamente porque la tool esté visible en el navegador.

## 18.8 Agent security

- Agent runtimes aislados, sin acceso directo a DB, host, secrets o Docker socket.
- Egress allowlist para agentes con tools de red.
- Contenido de PDFs, emails, web y mensajes tratado como datos no confiables, nunca autoridad.
- Trust labels para SYSTEM/TRUSTED_INTERNAL/TENANT_ADMIN/AUTHENTICATED_USER/EXTERNAL/UNTRUSTED.
- Kill switch global/account/tenant/agent/tool.
- Budgets de runtime, tool calls, records, mensajes, dinero, tokens y coste.
- Auditoría de model/version, agent/version, policy/version y tool/version en acciones relevantes.

# 19. Ciberseguridad Zero Trust

## 19.1 Principio

> **Zero Trust:** Nunca confiar por origen. Cada operación autentica, autoriza, valida, limita scope, ejecuta y audita; esto aplica igualmente a humanos, servicios, agentes y dispositivos.

## 19.2 Controles base

- MFA/passkeys para roles sensibles.
- RBAC + ABAC/resource policies.
- RLS y tenant isolation en PostgreSQL.
- TLS en tránsito y cifrado en reposo.
- Secrets en vault/secrets files cifrados, nunca en prompts o frontend.
- Rate limiting, WAF y anti-abuse.
- CSRF/CORS/session hardening.
- Webhook signature verification e idempotency.
- Least privilege para DB users, workers, providers y devices.
- SAST, dependency scanning, secret scanning, image/container scanning y SBOM.
- Patch management y pinned dependencies.
- Penetration testing y agentic red teaming.
- Security events y SIEM integration.

## 19.3 Threats específicas de agentes

- Prompt injection directa e indirecta
- Tool poisoning / malicious MCP servers
- Confused deputy
- Cross-tenant privilege escalation
- Data exfiltration
- Memory poisoning
- Token forwarding/reuse
- Autonomous loops/cost exhaustion
- Malicious attachments/web content
- Financial action abuse

## 19.4 Support access

Soporte no dispone de backdoor permanente. TemporarySupportAccess requiere motivo, aprobación, expiración, read-only por defecto y audit. Impersonation se etiqueta visualmente y queda registrada.

# 20. Trust, privacidad y compliance

## 20.1 Trust domain

```text
TRUST
- Security
- Privacy / Data Governance
- AI Governance
- Audit
- Risk
- Vendor / Subprocessor Management
- Compliance Evidence
- Incident Management
- Retention / Legal Hold
```

## 20.2 GDPR / privacy by design

- ProcessingPurpose y LegalBasis por tratamiento.
- Consent versionado cuando la base sea consentimiento.
- Data Processing Registry / RoPA support.
- DataSubjectRequest: access/export/rectification/restriction/erasure.
- RetentionPolicy por categoría de datos.
- ErasureEngine: DELETE / ANONYMIZE / RESTRICT / RETAIN_LEGAL_OBLIGATION.
- Subprocessor Registry y data-processing regions.
- International transfer metadata.
- DPIA/impact assessment hooks para tratamientos de alto riesgo.
- BreachIncident workflow y evidence.

## 20.3 AI governance

```text
AIUseCase
- intendedPurpose
- provider/model/version
- riskClassification
- dataCategories
- decisionImpact
- humanOversightPolicy
- loggingPolicy
- retentionPolicy
- DPIA/impact flags
```

La IA puede resumir, asistir o recomendar; decisiones académicas significativas como admisión, calificación final, elegibilidad o proctoring de alto impacto requieren clasificación legal y human oversight. Una función de IA no adquiere autoridad porque produzca una puntuación.

## 20.4 Certificaciones / marcos objetivo

Diseñar “certification-ready” desde V1: controles y evidencia compatibles con ISO/IEC 27001 (seguridad), ISO/IEC 27701 (privacidad), ISO/IEC 42001 (gestión de IA), continuidad de negocio y marcos adicionales según mercado/cliente. Verificar siempre la edición vigente antes de una auditoría formal.

## 20.5 Compliance profile por Tenant

```text
TenantComplianceProfile
- jurisdictions[]
- educationType
- minors
- publicFunding
- AIEnabled
- biometrics
- onlineLearning
- payments
- deploymentMode
- residencyRequirements
- requiredControls[]
```

Biometría no se habilita en Core V1. Si un Enterprise la exige en el futuro, debe ser capability separada, con DPIA/revisión legal y proveedor específico.

# 21. Arquitectura de datos

## 21.1 PostgreSQL como sistema de registro

PostgreSQL + Drizzle es el Core transaccional. Payload puede usar el mismo PostgreSQL, pero la ownership de tablas y migraciones debe ser explícita. No crear dos ORMs compitiendo por la misma tabla sin contrato claro.

## 21.2 Multi-tenancy

- tenant_id NOT NULL en entidades tenant-scoped.
- RLS para tablas pooled críticas.
- Políticas server-side además de RLS.
- Account/group data separado de Tenant operational data.
- Global identity tables con memberships y scopes explícitos.
- Cross-tenant queries sólo a través de servicios autorizados, nunca desactivando RLS ad hoc.

## 21.3 Payload boundary

Payload mantiene CMS, media metadata, website templates y contenido editable. Entidades transaccionales que requieran locking, ledger, scheduling, exam attempts o alto volumen deben administrarse mediante Domain Services/Drizzle incluso si Payload ofrece una proyección de administración.

## 21.4 High-volume tables

- audit_events
- access_events
- attendance_evidence
- messages/events
- notification_events
- exam_answers/events
- agent_actions
- learning_events
- analytics_events

Diseñar partitioning por fecha/tenant cuando el volumen lo justifique; no hacerlo prematuramente en todas las tablas. Índices deben empezar por tenant_id cuando la selectividad y query pattern lo exijan. Archivar datos fríos a object storage/analytics.

## 21.5 Search y analytics

V1 puede usar PostgreSQL FTS. Introducir SearchProvider cuando la carga o UX lo requiera. Analytics debe salir del OLTP mediante Domain Events/CDC hacia un analytics store/warehouse; no ejecutar BI pesado sobre la base que procesa exámenes y pagos.

## 21.6 Object storage

Media, PDFs, contratos, certificados, grabaciones y uploads viven en ObjectStorageProvider S3-compatible. Signed uploads/downloads evitan transportar archivos grandes por los procesos Next/API. Buckets separados por clase de datos y ambiente.

# 22. Arquitectura de aplicación y runtime

*Patrón transaccional + Outbox para desacoplar módulos e integraciones.*

## 22.1 Modular Monolith primero

Implementar bounded contexts como módulos del mismo repositorio/runtime cuando sea razonable. No crear microservicios por sustantivo. Separar servicios sólo cuando exista una necesidad clara de escalado, seguridad, deployment o disponibilidad independiente.

## 22.2 Procesos desplegables iniciales

- Web/BFF surfaces
- Core API/Application runtime si ya existe separado
- Payload CMS
- Worker general
- Integration Worker
- Scheduler
- Realtime Gateway cuando sea necesario
- Agent Gateway/Runtime aislado cuando se active IA agentic

## 22.3 Candidatos a separación futura

- Exam Delivery por picos masivos
- Realtime/chat
- Media/transcoding
- Integration Workers
- AI Agent Runtime
- Search
- Analytics pipeline

## 22.4 Outbox e idempotencia

Toda transacción que deba producir efectos externos escribe business state + OutboxEvent en el mismo commit. Workers procesan con idempotency key. Ningún webhook duplicado puede generar dos pagos, dos facturas o dos credenciales.

## 22.5 Stateless compute

Web/API/Workers no almacenan estado duradero en filesystem local. Esto permite escalar horizontalmente y migrar de OVH VPS a Public Cloud/AWS/GCP sin cambiar dominio.

# 23. Plataforma SaaS global

## 23.1 Arquitectura Cells

```text
GLOBAL CONTROL PLANE
- Accounts
- Subscriptions
- Tenant Registry
- Tenant -> Region -> Cell routing
- Plans / Entitlements
- Deployments / Versions
- Feature flags
- Platform Ops

REGIONAL DATA PLANES
EU -> CELL EU-01, EU-02...
US -> CELL US-01...
APAC -> CELL AP-01...
```

La Cell es la unidad repetible de capacidad y blast radius. Los primeros Tenants pueden vivir en una sola Cell lógica sobre un VPS; regionId/cellId/deploymentId deben existir desde V1 para no rediseñar el modelo más tarde.

## 23.2 Deployment modes

| Mode | Uso | Aislamiento |
| --- | --- | --- |
| Managed Cloud | Launch/Business | Cells pooled por región con RLS y políticas |
| Dedicated Cloud | Enterprise | Cell/DB/compute dedicados según contrato |
| On-Premise | Enterprise | contenedores y servicios en infraestructura cliente/partner; mismo Core |

## 23.3 Portabilidad

- OCI container images como unidad de distribución.
- Provider interfaces para storage, queue, event bus, secrets, email, video, AI, payments.
- PostgreSQL estándar como denominador común.
- Helm/Kubernetes opcional para Enterprise; Docker Compose válido para V1/pequeño deployment.
- No multi-cloud activo hasta que exista una necesidad comercial/operativa real.

## 23.4 Globalización

Locale no es sólo idioma. Tenant/Person deben soportar timezone, currency, date/number/name/address/phone formats, RTL, academic vocabulary, tax jurisdiction y data residency. Una Session almacena instantes de forma inequívoca y presenta horarios en timezone local.

# 24. SaaS billing, entitlements y metering

## 24.1 Dos finanzas independientes

> **Separación:** Academy Finance gestiona dinero alumno->academia. Platform Billing gestiona academia->Akademate. No compartir entidades de invoice/payment como si fueran el mismo negocio.

## 24.2 Platform subscription

```text
PlatformSubscription
- accountId
- plan
- billingCycle
- currency
- contract
- tenantSeats
- limits / entitlements
- addons
- status
```

## 24.3 Metering

- active learners
- tenant seats
- admin/user seats
- storage
- video
- AI tokens/credits
- SMS/WhatsApp
- signatures
- exam proctoring
- API usage
- automation executions
- email volume when needed

Costes variables de alto consumo deben medirse y repercutirse o limitarse por plan. El autoscaling técnico se basa en carga; FinOps y MRR determinan budgets/ceilings, no CPU directamente.

# 25. Reliability, observabilidad y disaster recovery

## 25.1 SLO/SLI

- availability
- API p95/p99 latency
- error rate
- queue latency
- job completion
- webhook delivery
- payment processing
- exam autosave durability
- backup freshness
- restore success
- integration health

## 25.2 Resiliencia

- Retries con exponential backoff y jitter
- Circuit breakers para proveedores
- Dead-letter queues
- Idempotency keys
- Backpressure y rate limiting
- Graceful degradation
- Health/readiness endpoints
- No synchronous chain of death entre matrícula y proveedores externos

## 25.3 Backup

Backup se considera válido sólo si puede restaurarse. Mantener PITR/WAL cuando sea posible, backups diarios/semanales, copies inmutables y ejercicios de restore. Definir RPO/RTO por plan únicamente después de validarlos operativamente.

## 25.4 Observability

OpenTelemetry-compatible logs/metrics/traces cuando el stack lo permita. Platform Ops necesita estado por Cell, DB, queue, integration, worker, backup, deployment y agent operations. Un monitor externo verifica disponibilidad incluso si toda la Cell está caída.

# 26. Calidad y estrategia de pruebas

## 26.1 Pirámide

- Unit tests de domain rules y policies.
- Integration tests con PostgreSQL real para RLS, transactions y migrations.
- Contract tests para provider adapters, API y MCP tools.
- End-to-end para journeys críticos.
- Security tests: cross-tenant, RBAC, SSRF, webhook, secrets, prompt injection, MCP/tool abuse.
- Load tests para reservas, exámenes, check-ins, billing cycles y notifications.
- Restore drills y migration rollback tests.

## 26.2 Matriz mínima Plan x Deployment x Blueprint

| Caso | Debe cubrir |
| --- | --- |
| Business + Managed + Wellness | membresía, booking, capacity, attendance, optional Campus, checkout |
| Business + Managed + Languages | levels, groups, online/presential, monthly billing, tests |
| Business + Managed + Sports | guardians, seasons, teams, clinics, insurance |
| Business + Managed + Driving | theory 1:N, practical 1:1, vehicle, travel, practice packs, exams |
| Enterprise + Dedicated + Network | multi-tenant/group, consolidated views, SSO, entitlements |
| Enterprise + On-Premise + Professional | CEP-like multi-tenant, advanced scheduling, practices, finance, campus, upgrades |

## 26.3 Invariantes de regresión

- Plan != Deployment.
- Enterprise puede ser Dedicated o On-Premise.
- Tenant isolation no depende del frontend.
- Desactivar capability elimina nav/routes/actions/tools relevantes, no sólo CSS.
- Cross-tenant users no obtienen acceso por conocer tenantId.
- Template switch no pierde contenido.
- Un profesor no puede quedar asignado a horarios físicamente imposibles.
- Dos docentes simultáneos contabilizan actividad por assignment.
- Funding no cambia el precio base.
- Un impago no bloquea Campus salvo policy explícita.
- Un agente IA nunca excede el grant delegado.

# 27. Roadmap de implementación y migraciones

El roadmap evita un big-bang. Cada fase deja el sistema operativo y migrable. El agente debe crear ADRs y migration notes para decisiones irreversibles.

## 27.1 Fase 0 - Discovery / Architecture Audit

1. Inventariar monorepo/apps, Payload collections, Drizzle schema, migrations, APIs/BFF, auth/RBAC, tenant model, finance, CMS, integrations y deployments.
1. Mapear cada entidad actual a bounded context objetivo: KEEP, EVOLVE, SPLIT, DEPRECATE o NEW.
1. Identificar acoplamientos “Course-centric” y tenant-specific conditionals.
1. Crear diagramas de dependencias y ownership de tablas.
1. Congelar nuevas excepciones CEP hasta definir capability/blueprint equivalente.
1. Producir migration plan reversible con backup/snapshot antes de cambios destructivos.

## 27.2 Fase 1 - Foundation P0

- Account/OrganizationGroup + Tenant + LegalEntity + Location/Campus basics
- Plan/Deployment/Blueprint/OrganizationModel
- Capability/Policy/FeatureFlag separation
- Global Person + memberships + ActorContext
- AuditEvent + correlation IDs
- RLS audit and tenant isolation tests
- Outbox/Event foundation
- ObjectStorageProvider
- Health/observability baseline
- regionId/cellId/deploymentId metadata

## 27.3 Fase 2 - Enrollment + Commerce + Finance foundation

- Offering/Run/Phase/Session canonicalization
- Enrollment + CommercialAgreement
- PriceComponent/BillingPlan/BillingSchedule
- Entitlement Engine
- Funding/Payer model
- Product/Order/Payment abstractions
- Invoice/Receivable/Payment status
- Finance event boundary
- Provider adapters for Stripe/PayPal/manual payments

## 27.4 Fase 3 - Campus + Scheduling + Attendance

- Campus adoption policies
- Student surfaces
- Booking/capacity/waitlist
- InstructorProfile/Engagement/Assignment
- GlobalPersonCalendar
- Travel/Transition/SchedulingConstraintEngine
- AttendanceRecord/Evidence/Policy
- AccessGrant/Credentials
- Reception-assisted workflows

## 27.5 Fase 4 - Learning + Assessment + Credentials

- LearningPath/Module/Lesson/Content
- VideoConferenceProvider + virtual meetings
- QuestionBank/versioning
- Assessment/ExamAttempt/ExamSession
- EligibilityEngine
- AcademicRecord
- Credential Engine + verification
- External exam/credential support

## 27.6 Fase 5 - External operations + advanced verticals

- PartnerOrganization/Venue
- PracticePlacement
- Driving vehicle/resource model
- Sports guardians/teams/seasons
- Clinics/events/seasonal standby
- B2B corporate accounts
- External tutor/partner portal

## 27.7 Fase 6 - Automation + Integrations + Agents

- Communication Hub/templates
- Workflow Engine
- Automation Engine
- Integration Center
- Public API/Webhooks
- MCP Server
- Agent Registry/Grants/Risk/Approval
- WebMCP progressive tools
- Device Gateway

## 27.8 Fase 7 - Global SaaS hardening

- SaaS billing/metering
- Regionalization/Cell router
- Data residency
- Analytics pipeline
- Search provider
- Enterprise SSO/SCIM
- Trust/Compliance Center
- DR automation
- Marketplace/developer platform

## 27.9 Estrategia de migraciones

- Preferir expand -> migrate -> verify -> contract.
- Backfill con jobs idempotentes y resumibles.
- Dual-read sólo temporal y medido; dual-write únicamente si existe un plan claro de retirada.
- Feature flag para activar nuevo path por Tenant.
- Shadow calculations para finance/scheduling antes de sustituir producción.
- No borrar columnas/tablas legacy hasta completar una ventana de observación y rollback.
- Migrations versionadas y compatibles con SaaS Continuous + Enterprise Stable/LTS.

# 28. Provisioning V1 en OVH

*Topología inicial recomendada: EU-OVH-01 como primera Cell lógica.*

## 28.1 Objetivo de infraestructura

Empezar barato pero no frágil. V1 usa un VPS de producción de clase aproximada 8 vCPU / 24 GB RAM / 200 GB NVMe y un VPS de staging de clase aproximada 4 vCPU / 8 GB RAM. Seleccionar el SKU OVH equivalente disponible en el momento de contratación; no acoplar automatización al nombre comercial del plan.

## 28.2 Topología

```text
PROD - EU-OVH-01
Ubuntu 24.04 LTS (o LTS soportada actual)
Docker Engine + Compose
Caddy
Web/BFF surfaces
Payload CMS
Core/Application runtime
Workers
Scheduler
PostgreSQL
Valkey
Monitoring exporters

EXTERNAL
OVH Object Storage S3-compatible
Payment/Email/Video/AI providers
Optional Cloudflare edge

STAGING
VPS separado + buckets y credentials separados
```

## 28.3 Estructura de host

```text
/srv/akademate/
  compose/prod/
  compose/monitoring/
  data/postgres/
  data/valkey/
  data/monitoring/
  releases/
  backup-cache/
  scripts/
  logs/

/etc/akademate/
  env/
  secrets/
```

## 28.4 Docker networks

```text
edge_net     -> Caddy + public-facing app services
app_net      -> application services + workers + Payload
data_net     -> PostgreSQL + Valkey (internal only)
ops_net      -> monitoring/exporters
```

PostgreSQL y Valkey no publican puertos a Internet. Sólo 80/443 son públicos; SSH se restringe por VPN/WireGuard o allowlist administrativa.

## 28.5 Servicios Compose iniciales

| Service | Responsabilidad | Persistencia |
| --- | --- | --- |
| caddy | TLS/reverse proxy/custom domains | config/certs |
| platform-ops | operación interna de plataforma | stateless |
| tenant-admin | backoffice tenant | stateless |
| campus | student/instructor surfaces | stateless |
| public-web | websites/landing/catalogue | stateless/cache |
| payload | CMS/editorial | DB + object storage |
| core-api/bff | application services | stateless |
| worker | jobs/outbox/integrations | stateless |
| scheduler | cron/domain schedules | stateless + advisory lock |
| postgres | source of truth | NVMe volume + backup |
| valkey | cache/queue/locks | ephemeral/rebuildable |
| exporters | monitoring | local metrics only |

## 28.6 PostgreSQL V1

- Pin de major version compatible con Payload/Drizzle actuales; no mezclar upgrade DB con re-arquitectura.
- pg_stat_statements.
- Slow query logging con umbral razonable.
- Autovacuum monitoring.
- Connection limits por role.
- Separate application roles según necesidad.
- RLS tests ejecutados en CI.
- Outbox table transaccional.
- No usar filesystem del container para uploads.

## 28.7 Object Storage

```text
Buckets PROD:
- akademate-prod-media
- akademate-prod-private-documents
- akademate-prod-backups
- akademate-prod-audit

Buckets STAGING:
- akademate-staging-media
- akademate-staging-backups
```

Backups bucket se crea desde el primer día con Versioning + Object Lock si el producto/región lo soporta. Los buckets privados nunca se exponen públicamente; acceso mediante signed URLs y policies mínimas.

## 28.8 Backup V1

1. Backup/snapshot del VPS como capa de recuperación del host.
1. Backup PostgreSQL independiente mediante pgBackRest o herramienta equivalente compatible con S3.
1. Archive continuo de WAL cuando sea soportado/configurado para PITR.
1. Differential/daily + full weekly, con retención operativa definida.
1. Copia a bucket con versioning/Object Lock.
1. Replicación cross-region cuando esté disponible.
1. Copia semanal off-provider antes de considerar el sistema maduro.
1. Restore drill mensual automático hacia una DB temporal/staging con smoke tests.

> **Backup gate:** Un backup no cuenta como válido hasta que exista evidencia reciente de restauración satisfactoria.

## 28.9 Seguridad del host

- SSH keys only; PasswordAuthentication no; root login no.
- UFW/nftables + firewall de red proveedor.
- Automatic security updates controladas.
- Docker containers non-root/no-new-privileges/read-only FS donde sea viable.
- No Docker socket expuesto.
- No pgAdmin/Grafana/Portainer público; administración por VPN.
- SOPS+age o secrets files cifrados; permissions 0600.
- Log rotation para evitar llenar NVMe.
- Fail2ban opcional si SSH expuesto, aunque se prefiere VPN.
- Auditar acceso y cambios de deployment.

## 28.10 Monitoring V1

- CPU/RAM/disk/disk IO
- container health/restarts
- PostgreSQL connections/locks/slow queries/DB size
- Valkey memory/queue depth
- API latency/5xx
- worker failures/queue lag
- backup freshness
- last successful restore test
- TLS expiry
- external uptime probe

## 28.11 CI/CD

```text
Git push
 -> CI tests
 -> security scans
 -> build OCI images
 -> push registry (GHCR/OVH/private registry)
 -> backup gate
 -> deploy versioned image tags
 -> run expand migration
 -> health + smoke tests
 -> promote
 -> rollback image if needed
```

No compilar producción en el VPS. No usar latest como única referencia. Cada release debe poder relacionarse con git commit, migration set, container digest y deployment record.

## 28.12 Orden de provisioning

1. Contratar PROD y STAGING en región europea adecuada y registrar deployment/cell IDs.
1. Hardening básico del sistema, usuarios admin, SSH/VPN y firewall.
1. Instalar Docker/Compose y configurar log rotation.
1. Crear buckets S3, versioning, Object Lock/retention y credenciales mínimas.
1. Configurar Caddy y DNS; emitir TLS.
1. Desplegar PostgreSQL y crear roles/databases; validar backups antes de subir datos reales.
1. Desplegar Valkey y redes internas.
1. Desplegar apps/core/worker/scheduler con imágenes versionadas.
1. Configurar secrets y provider credentials.
1. Configurar pgBackRest/WAL y ejecutar primera restauración.
1. Configurar monitoring + external uptime.
1. Configurar CI/CD staging -> production con approval gate.
1. Ejecutar tenant isolation/security smoke tests.
1. Crear primera OrganizationGroup/Tenant de prueba y recorrer journeys end-to-end.
1. Abrir producción únicamente tras backup, restore, payment sandbox/live separation y audit checks.

# 29. Roadmap de escalado 0 -> global

| Etapa | Infraestructura | Trigger de migración |
| --- | --- | --- |
| 0-20 Tenants | 1 PROD VPS + 1 STAGING; Postgres/Valkey local; Object Storage externo | base estable; mantener mientras SLO, coste y DB estén holgados |
| 20-50 | upgrade vertical o separar worker/app si queue/CPU lo exige | CPU sostenida, queue lag, memoria, deploy contention |
| 50-100 | separar DB y compute; app replicas; LB; PgBouncer/proxy según conexiones | DB empieza a dominar recursos o blast radius no aceptable |
| 100-500 | EU-CELL-01 completa + posible EU-CELL-02; analytics/search externos | tenant density, DB IO, compliance/SLA, grandes picos |
| Internacional | Control Plane + regional Cells EU/US/APAC | demanda comercial, data residency, latency, regulation |
| Enterprise | Dedicated Cell / On-Premise | contrato, compliance, isolation, custom SLA |

## 29.1 Triggers cuantitativos

- p95/p99 latency fuera de SLO.
- DB CPU/IO/working set o connection pressure sostenidos.
- Queue lag excede ventana de negocio.
- Disk growth incompatible con backup/restore targets.
- Exámenes/reservas generan picos que requieren aislamiento.
- Un Tenant consume una fracción desproporcionada de la Cell.
- Requisitos de residencia de datos o SLA.
- Blast radius de una Cell supera tolerancia operacional.
- Coste por Tenant empeora y existe una opción gestionada más eficiente.

## 29.2 Migración de OVH VPS a Cells cloud

La migración debe ser de infraestructura, no de dominio: contenedores OCI, PostgreSQL, S3-compatible storage y Provider abstractions permiten mover compute a OVH Public Cloud, AWS o GCP. Introducir nueva Cell, replicar/migrar datos, cambiar TenantRouter y retirar la Cell antigua por lotes.

# 30. Directiva operativa para el agente de implementación

> **Mandato:** Implementar el estado objetivo de este documento de forma incremental, preservando compatibilidad, datos, tenant isolation y capacidad de rollback. No interpretar la especificación como autorización para sustituir entidades existentes sin auditoría.

## 30.1 Antes de escribir código

1. Leer arquitectura del monorepo, apps, package boundaries, Docker, CI/CD y deployments.
1. Inspeccionar schema PostgreSQL, Drizzle y Payload; producir ER map y ownership map.
1. Identificar auth/session/RBAC/RLS existentes.
1. Identificar tenant/account/location/campus actuales y diferencias respecto al modelo objetivo.
1. Identificar Course/Run/Session, enrolment, people, finance, CMS e integrations.
1. Identificar datos CEP custom y separar qué es reusable capability vs enterprise override.
1. Entregar: current architecture, gaps, target mapping, migrations, files/tables affected, risk matrix y rollback plan.
1. Esperar aprobación para cambios destructivos o grandes migraciones.

## 30.2 Reglas de implementación

- No scattered tenant-specific conditionals.
- No nuevas tablas si existe una entidad equivalente que pueda evolucionar.
- No renombrar DB por vocabulario de vertical.
- Server-side authorization en todos los write paths y tools.
- Transactions para invariantes; outbox para side effects.
- Idempotency en payments, webhooks, workers, imports y agent commits.
- Backward-compatible migrations.
- Feature flags sólo para rollout; capabilities para producto.
- Tests obligatorios para multi-tenant, cross-tenant, plan/deployment y high-risk actions.
- Documentar cada ADR y migration with rollback.

## 30.3 Definition of Done por capability

1. Domain model y ownership definidos.
1. Migration/backfill idempotente.
1. Application Service + policy checks.
1. UI adaptativa por Blueprint/Capability.
1. API/tool contracts versionados.
1. Audit events.
1. Observability/metrics.
1. Unit + integration + E2E + security tests.
1. Documentación operativa/rollback.
1. Activación gradual por Tenant y validación de métricas.

---

# Apéndice A. Registro canónico de entidades

| Entidad | Contexto | Función |
| --- | --- | --- |
| Account | Platform | grupo/cliente contractual |
| AccountMembership | Identity | usuario a grupo |
| Tenant | Platform | frontera fiscal/operativa |
| LegalEntity | Finance | datos fiscales del Tenant |
| TenantMembership | Identity | usuario a Tenant/rol |
| Person | People | identidad global |
| UserIdentity | Identity | método login |
| GuardianRelationship | People | tutor-menor |
| StudentRelationship | People | persona como alumno tenant-scoped |
| InstructorProfile | People | perfil docente global |
| InstructorEngagement | People/Finance | relación docente-Tenant |
| InstructorAssignment | Academic | asignación docente a scope |
| Location | Resources | sede física |
| Campus | Academic/Experience | campus tenant-scoped |
| Venue | Resources | lugar de actividad |
| Resource | Resources | aula/vehículo/equipo |
| PartnerOrganization | External Ops | empresa colaboradora |
| PracticePlacement | External Ops | práctica alumno-partner |
| Offering | Academic | oferta canónica |
| OfferingRun | Academic | edición/convocatoria |
| Phase | Academic | fase del run |
| Module | Learning | unidad curricular |
| Session | Academic/Scheduling | unidad temporal operativa |
| SessionExecution | Academic | ejecución real |
| Enrollment | Academic | relación alumno-oferta |
| CommercialAgreement | Commerce/Finance | condiciones económicas |
| PriceComponent | Commerce | componente de precio |
| BillingPlan | Finance | forma de cobro |
| BillingSchedule | Finance | vencimientos |
| FundingAgreement | Finance | beca/subvención/tercero |
| FundingAllocation | Finance | reparto pagadores |
| Entitlement | Commerce/Access | derecho de acceso/consumo |
| Membership | Commerce | relación recurrente |
| Booking | Scheduling | reserva |
| WaitlistEntry | Scheduling | lista de espera |
| AttendanceRecord | Attendance | presencia resuelta |
| AttendanceEvidence | Attendance | evidencia |
| AccessGrant | Access | derecho físico/digital |
| AccessCredential | Access | credencial |
| AccessEvent | Access | evento de entrada/salida |
| LearningPath | Learning | recorrido |
| Lesson | Learning | lección |
| ContentAsset | Learning | contenido |
| Assignment | Learning | tarea |
| ContentProgress | Learning | progreso |
| Assessment | Assessment | evaluación |
| Question | Assessment | pregunta lógica |
| QuestionVersion | Assessment | snapshot/version |
| ExamAttempt | Assessment | intento |
| ExamSession | Assessment/Scheduling | sesión de examen |
| AssessmentAppeal | Assessment | revisión/reclamación |
| Competency | Assessment | competencia |
| CompetencyAchievement | Academic Record | logro |
| AcademicRecord | Credentials | expediente tenant-scoped |
| AcademicDocument | Credentials | snapshot documental |
| Credential | Credentials | credencial emitida/importada |
| CredentialIssuer | Credentials | organismo emisor |
| Product | Commerce | objeto comprable |
| ProductVariant | Commerce | variante |
| Cart | Commerce | carrito |
| Order | Commerce | pedido |
| OrderItem | Commerce | línea pedido |
| Payment | Finance | cobro/pago |
| Refund | Finance | devolución |
| Invoice | Finance | documento fiscal |
| Receivable | Finance | cuenta por cobrar |
| Ledger | Accounting | libro contable |
| JournalEntry | Accounting | asiento |
| AccountingRule | Accounting | mapeo evento->asiento |
| InstructorTeachingLedger | Finance | actividad remunerable docente |
| PartnerAgreement | Finance/External | acuerdo económico partner |
| Conversation | Communication | hilo contextual |
| Message | Communication | mensaje |
| Notification | Communication | notificación |
| CommunicationTemplate | Communication | plantilla |
| WorkflowDefinition | Platform | máquina de estados |
| AutomationRule | Platform | trigger-condition-action |
| IntegrationConnection | Integration | conexión proveedor |
| WebhookSubscription | Integration | suscripción eventos |
| DeviceIdentity | Access/Security | hardware autorizado |
| AgentIdentity | AI/Agent | agente |
| AgentGrant | AI/Agent | delegación |
| AIUseCase | Trust | caso de uso IA |
| AuditEvent | Trust | auditoría funcional |
| SecurityEvent | Trust | evento seguridad |
| Consent | Privacy | consentimiento versionado |
| DataSubjectRequest | Privacy | solicitud derechos |
| RetentionPolicy | Privacy | retención |
| ComplianceEvidence | Trust | evidencia de control |
| PlatformSubscription | SaaS Billing | suscripción Akademate |
| UsageMeter | SaaS Billing | medición |
| CapabilityEntitlement | SaaS Billing | capacidad/límite contractual |
| Deployment | Platform Ops | deployment físico/lógico |
| Region | Platform Ops | residencia/región |
| Cell | Platform Ops | unidad de capacidad |
| TenantRoute | Platform Ops | tenant->region/cell |

# Apéndice B. Catálogo inicial de capabilities

| Capability | Descripción |
| --- | --- |
| academic.courses | cursos/cohortes |
| academic.phases | fases |
| academic.recurring_sessions | sesiones recurrentes |
| academic.one_to_one | 1:1 |
| academic.multi_instructor | varios docentes |
| academic.external_practices | prácticas externas |
| academic.regulated_programmes | formación regulada |
| academic.levels | niveles |
| academic.teams | equipos |
| academic.seasons | temporadas |
| academic.guardians | tutores/menores |
| resources.rooms | aulas |
| resources.vehicles | vehículos |
| resources.external_venues | venues externos |
| resources.travel_constraints | desplazamientos |
| commerce.memberships | membresías |
| commerce.session_packs | bonos |
| commerce.store | tienda |
| commerce.events | eventos/clinics |
| finance.advanced | finanzas avanzadas |
| finance.multi_payer | varios pagadores |
| finance.funding | becas/subvenciones |
| learning.lms | contenido/campus learning |
| learning.video | vídeo |
| assessment.tests | tests |
| assessment.exams | exámenes |
| credentials.digital | credenciales digitales |
| access.qr | QR |
| access.nfc | NFC |
| communication.in_app | mensajería interna |
| integrations.api | API |
| integrations.webhooks | webhooks |
| agents.mcp | MCP |
| agents.webmcp | WebMCP |
| agents.ai_assistant | asistentes IA |
| organization.multi_tenant_group | grupos multiempresa |
| organization.franchise | franquicia |
| platform.seasonal_standby | standby estacional |

# Apéndice C. Catálogo inicial de Domain Events

| Event | Contrato mínimo |
| --- | --- |
| PersonCreated | versioned payload + tenant/account/correlation metadata |
| TenantCreated | versioned payload + tenant/account/correlation metadata |
| TenantActivated | versioned payload + tenant/account/correlation metadata |
| TenantStandbyEntered | versioned payload + tenant/account/correlation metadata |
| EnrollmentCreated | versioned payload + tenant/account/correlation metadata |
| EnrollmentActivated | versioned payload + tenant/account/correlation metadata |
| MembershipActivated | versioned payload + tenant/account/correlation metadata |
| EntitlementGranted | versioned payload + tenant/account/correlation metadata |
| EntitlementConsumed | versioned payload + tenant/account/correlation metadata |
| BookingCreated | versioned payload + tenant/account/correlation metadata |
| BookingCancelled | versioned payload + tenant/account/correlation metadata |
| WaitlistPromoted | versioned payload + tenant/account/correlation metadata |
| SessionScheduled | versioned payload + tenant/account/correlation metadata |
| SessionRescheduled | versioned payload + tenant/account/correlation metadata |
| SessionStarted | versioned payload + tenant/account/correlation metadata |
| SessionCompleted | versioned payload + tenant/account/correlation metadata |
| AttendanceRecorded | versioned payload + tenant/account/correlation metadata |
| AttendanceVerified | versioned payload + tenant/account/correlation metadata |
| AccessGranted | versioned payload + tenant/account/correlation metadata |
| AccessDenied | versioned payload + tenant/account/correlation metadata |
| PracticePlacementAssigned | versioned payload + tenant/account/correlation metadata |
| PracticePlacementCompleted | versioned payload + tenant/account/correlation metadata |
| AssessmentPublished | versioned payload + tenant/account/correlation metadata |
| ExamAttemptStarted | versioned payload + tenant/account/correlation metadata |
| ExamAttemptSubmitted | versioned payload + tenant/account/correlation metadata |
| AssessmentResultReleased | versioned payload + tenant/account/correlation metadata |
| CredentialIssued | versioned payload + tenant/account/correlation metadata |
| CredentialRevoked | versioned payload + tenant/account/correlation metadata |
| OrderConfirmed | versioned payload + tenant/account/correlation metadata |
| PaymentReceived | versioned payload + tenant/account/correlation metadata |
| PaymentFailed | versioned payload + tenant/account/correlation metadata |
| RefundIssued | versioned payload + tenant/account/correlation metadata |
| InvoiceIssued | versioned payload + tenant/account/correlation metadata |
| ReceivableOverdue | versioned payload + tenant/account/correlation metadata |
| InstructorHoursDelivered | versioned payload + tenant/account/correlation metadata |
| InstructorHoursApproved | versioned payload + tenant/account/correlation metadata |
| FundingApproved | versioned payload + tenant/account/correlation metadata |
| FundingAtRisk | versioned payload + tenant/account/correlation metadata |
| MessageCreated | versioned payload + tenant/account/correlation metadata |
| NotificationRequested | versioned payload + tenant/account/correlation metadata |
| IntegrationFailed | versioned payload + tenant/account/correlation metadata |
| WebhookReceived | versioned payload + tenant/account/correlation metadata |
| AgentActionProposed | versioned payload + tenant/account/correlation metadata |
| AgentActionApproved | versioned payload + tenant/account/correlation metadata |
| AgentActionCommitted | versioned payload + tenant/account/correlation metadata |
| SecurityEventDetected | versioned payload + tenant/account/correlation metadata |
| DataSubjectRequestOpened | versioned payload + tenant/account/correlation metadata |
| BackupCompleted | versioned payload + tenant/account/correlation metadata |
| RestoreTestCompleted | versioned payload + tenant/account/correlation metadata |

# Apéndice D. Checklist de aceptación de arquitectura

| Área | Criterio |
| --- | --- |
| Tenant | Nueva sede misma empresa no crea ledger; nueva razón fiscal crea nuevo Tenant/ledger/campus. |
| Identity | Una persona puede pertenecer a varios Tenants sin duplicarse. |
| Campus | Alumno sin app puede ser reservado, cobrado y marcado presente por recepción/docente. |
| Scheduling | Bloquea conflicto y tiempo de viaje cross-tenant. |
| Multi-instructor | Una Session admite N docentes y genera actividad por assignment. |
| Practices | Alumno puede ir a partner/venue externo distinto de otros alumnos. |
| Commerce | Web/Campus/POS comparten catálogo y sellerTenant. |
| Finance | Funding mantiene precio base y múltiples pagadores. |
| Exam | Online/presencial/externo, attempts, eligibility, result release y appeal. |
| Credential | Verificación/revocación y issuer authority. |
| Agents | MCP/WebMCP no pueden ampliar tenant scope ni ejecutar R4 sin autorización. |
| Security | RLS/cross-tenant tests, secrets aislados, audit append-only para crítico. |
| OVH | Backup independiente, immutable copy y restore drill aprobado. |
| Scaling | Cada Tenant tiene region/cell/deployment desde V1. |
| Payload | CMS/editorial separado de core transaccional. |

# Apéndice E. Decisiones de arquitectura (ADRs base)

| ADR | Decisión | Razón |
| --- | --- | --- |
| ADR-001 | PostgreSQL como source of truth | Portabilidad, relaciones, transacciones y RLS. |
| ADR-002 | Payload como CMS, no dominio universal | Evitar acoplar lógica crítica a collections/hooks. |
| ADR-003 | Modular Monolith + events primero | Menor complejidad; separación futura basada en necesidad. |
| ADR-004 | 1 Tenant = 1 accounting boundary | Aislamiento fiscal/operativo consistente. |
| ADR-005 | Person global + relationships tenant-scoped | Evita duplicados y habilita grupos/cross-tenant. |
| ADR-006 | Blueprint + Capabilities + Policies | Adaptación vertical sin forks. |
| ADR-007 | Outbox para side effects | Consistencia y resiliencia. |
| ADR-008 | Provider adapters | No dependencia de proveedores externos concretos. |
| ADR-009 | Agent-native, zero-trust | IA/MCP con delegación limitada y mismas políticas. |
| ADR-010 | Regional Cells como destino | Escalado, residencia y blast radius. |
| ADR-011 | OVH VPS como V1 | Coste inicial bajo con ruta de migración limpia. |
| ADR-012 | Object storage externo desde V1 | Stateless compute y backups independientes. |
| ADR-013 | Native app nunca como único acceso | Inclusión y continuidad operativa. |
| ADR-014 | Finance separado de Academic/Commerce | Evita mezclar pago, factura, ingreso y matrícula. |
| ADR-015 | Compliance/Trust P0 | GDPR, AI governance y audit desde diseño. |

# Cierre

Akademate debe evolucionar como una plataforma educativa adaptable, no como una colección de verticales independientes. La combinación de Core canónico, Blueprints/Capabilities/Policies, fronteras de Tenant correctas, PostgreSQL transaccional, Event/Outbox, Provider Adapters, Trust/Zero-Trust y Cells regionales permite empezar con una infraestructura OVH muy contenida y crecer hacia un SaaS internacional sin reescribir el producto.

> **Siguiente ejecución:** El primer trabajo del agente no es crear nuevas features: es ejecutar Fase 0, producir el mapa real del repositorio/esquema y devolver un plan de migración que compare el sistema actual con esta baseline. Sólo después se activa la Fase 1.
