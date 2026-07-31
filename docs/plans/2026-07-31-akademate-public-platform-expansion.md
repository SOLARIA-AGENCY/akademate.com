# Akademate Public Platform Expansion

**Fecha:** 2026-07-31
**Rama:** `codex/akademate-public-expansion`
**Base:** `5815eb35`
**Superficie:** exclusivamente `apps/web` y documentación SaaS pública
**Fuera de alcance:** CEP, sus datos, contenedores, tráfico, configuración y despliegue

## Goal extension

Ampliar el goal de Akademate Next con una superficie pública coherente con el producto objetivo: un sistema operativo configurable para organizaciones educativas, deportivas, de bienestar y de formación que conecta captación, reservas, admisiones, pagos, operación, campus virtual, comunicación, finanzas y crecimiento.

## Solution Registry

| Enfoque | Correctitud | Mantenibilidad | Escalabilidad | Simplicidad | Pragmatismo | Veredicto |
|---|---:|---:|---:|---:|---:|---|
| Extender páginas con contenido local | 7 | 5 | 5 | 8 | 7 | Rápido, pero duplica contenido y aumenta deriva |
| Registry central + páginas compuestas | 9 | 9 | 9 | 7 | 9 | Seleccionado: una fuente para journeys, módulos, integraciones, verticales y planes |

## Alcance funcional público

### 1. Reservation & Admissions Engine

- [x] Flujo visible `Discover -> Reserve -> Confirm -> Pay -> Participate -> Progress`.
- [x] Modos: enquiry, application, hold, free registration, paid enrolment y waitlist.
- [x] Capacidad, caducidad, documentación, aprobación y recordatorios como política configurable.
- [x] Separación clara entre lead, application, reservation, registration, enrolment y participant.

### 2. Offer and capacity core

- [x] Offering, run/season, sessions, resources, capacity, access rules y commercial policy.
- [x] Sesión única, series, recurrencia semanal, calendario académico, temporada y bajo demanda.
- [x] Capacidad por sede, sala, pista, profesor, entrenador, edad, nivel o tarifa.

### 3. Campus and delivery

- [x] Campus virtual para alumno.
- [x] Workspace de profesores para preparar cursos, tareas, notas y comunicación.
- [x] Operación presencial, online e híbrida conectada.
- [x] Asistencia, progreso, evaluaciones, certificados y materiales.
- [x] Chat y comunicación interna como capacidad del producto objetivo.

### 4. Marketing, CRM and Ads

- [x] Captación desde fichas, campañas, formularios y reservas.
- [x] Atribución UTM y contexto de fuente.
- [x] Meta Ads / Facebook Ads, conversion events y CAPI como integración.
- [x] MCP para operar conectores de marketing con permisos y trazabilidad.
- [x] Email journeys, confirmaciones, recordatorios y nurturing.

### 5. Payments and finance

- [x] Separar billing SaaS de pagos del participante.
- [x] Arquitectura de adaptadores para Stripe, PayPal y SEPA.
- [x] Pago único, depósito, cuotas, suscripción, membresía, bono y pago por temporada.
- [x] Payment Context inmutable: vendedor legal, cuenta receptora, moneda, precio, impuestos y políticas.
- [x] Conciliación, reembolsos, facturación, saldos y exportación a APIs financieras/ERP.
- [x] Herencia de cuenta receptora Organization -> Brand -> Location -> Offering.

### 6. Domains and organisational hierarchy

- [x] Organization, brand, location, domain y payment account.
- [x] Subdominio Akademate y dominio propio.
- [x] Contexto por hostname: branding, idioma, catálogo, legal y pagos.
- [x] Casos multi-sede, multi-marca y franquicia.

## Verticales cubiertos

1. Formación profesional y reglada.
2. Academias de idiomas.
3. Estudios de yoga, pilates y bienestar.
4. Academias deportivas.
5. Clubes deportivos y equipos por temporada.
6. Campus de verano y programas estacionales.
7. Escuelas de música, danza y artes escénicas.
8. Bootcamps y escuelas online por cohortes.
9. Formación corporativa B2B.
10. Grupos multi-sede y franquicias educativas.

## Clientes tipo

| Cliente tipo | Necesidad dominante | Configuración Akademate |
|---|---|---|
| Centro de FP multi-programa | admisión, documentación, matrícula y campus | application + approval + instalments + academic calendar |
| Estudio de yoga urbano | recurrencia, bonos, membresías y capacidad por sala | instant booking + membership + session packs |
| Academia deportiva infantil | edad, nivel, tutor, asistencia y rendimiento | guardian consent + assessment + recurring sessions |
| Club deportivo federado | equipos, temporada, licencias y cuotas | teams + season + approval + annual fee |
| Campus de verano temporal | lanzamiento rápido, semanas, depósito y documentación médica | Launch plan + run capacity + deposit + reminders |
| Academia de idiomas | prueba de nivel, grupos y mensualidades | assessment + level + cohorts + recurring billing |
| Escuela de danza o música | horarios, profesor, salas, actuaciones y pagos | recurring sessions + resources + attendance + events |
| Bootcamp online | cohortes, contenidos, tareas, chat y pagos | online campus + assignments + community + instalments |
| Proveedor de formación corporativa | empresas pagadoras, grupos privados y reporting | B2B billing + private cohorts + reports |
| Franquicia de academias | branding común, operación local y finanzas separadas | brand hierarchy + custom domains + payment inheritance |

## Planes públicos sin precio

### Launch

Para campus, cohortes, eventos y programas temporales. Catálogo limitado, reservas, pagos, comunicación y cierre del programa.

### Business

Para academias y centros en operación recurrente. CRM, reservas, operaciones, campus, pagos, finanzas, equipos y automatización.

### Enterprise

Para grupos, franquicias y organizaciones con integración, dominios, despliegue dedicado, private cloud u on-premise.

## Integraciones objetivo

- Payment providers: Stripe, PayPal, SEPA/direct debit.
- Finance: accounting, invoicing, reconciliation, banking/ERP APIs and exports.
- Marketing: Meta Ads, Facebook/Instagram attribution, CAPI, Google Ads and email providers.
- Productivity and interoperability: API, webhooks and MCP connectors.

La web describirá esta arquitectura como capacidad configurable. La disponibilidad exacta y el proveedor se concretan durante onboarding; no se publicarán credenciales, identificadores de cliente ni promesas de certificación.

## Plan de implementación pública

- [x] Fase 1: prompt, content registry, tests contract-first.
- [x] Fase 2: imágenes originales de hero, wellness, deporte/campus y red multi-sede.
- [x] Fase 3: landing ampliada con journey, verticales, módulos, pagos, growth y planes.
- [x] Fase 4: features por dominios operativos y capacidades.
- [x] Fase 5: pricing Launch, Business y Enterprise.
- [x] Fase 6: SEO, sitemap, accesibilidad, responsive y performance.
- [x] Fase 7: QA visual, consola/red, test/build y pre-flight de diseño.
- [x] Fase 8: commit/push y despliegue independiente de `apps/web` con verificación de artefacto servido.

## Evidencia de release

- Release público inicial: `fd595da03e62af33d488b3f6dbb51a56e163d663`.
- Release público actual: `48ad1af4aef16ba1a290776f730b655ff765ce30`.
- Servicio modificado: únicamente `akademate-web`.
- Relay transaccional: Worker `akademate-contact-mailer`, versión `b70659cd-545d-491d-af35-b0076fc207c6`.
- Verificación live: health con revisión exacta, contenido nuevo servido, formulario real `200` y 10/10 E2E aprobados.
- Invariantes: IDs de los tres contenedores tenant sin cambios; ningún despliegue CEP.

## Quality Gate

- [x] NIVEL 1: typecheck/build de `apps/web`.
- [x] NIVEL 2: suite existente sin regresiones.
- [x] NIVEL 3: tests nuevos adversariales de contenido e integraciones.
- [x] Tres intentos de ruptura: copy/claims, móvil/overflow y assets/red.
- [x] No trackers antes de consentimiento; si no hay trackers, no se añade consent manager innecesario.
- [x] Rutas legales y badges regulatorios siguen operativos y sin certificación implícita.
- [x] Ninguna modificación o despliegue de CEP.
