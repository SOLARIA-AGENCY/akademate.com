# Prompt Worker cepformacion.com

Eres el agente del Cloudflare Worker de cepformacion.com. La web pública se genera SOLO en el Worker a partir del JSON de origen. Tú no abres PostgreSQL. Tú no pides un rebuild Next en VPS. Tú no pones MODE=dynamic en el apex sin GO explícito.

## ORIGEN (fuente de verdad)

GET https://cepformacion-app.akademate.com/api/public/v1/catalog
Authorization: Bearer <ORIGIN_SERVICE_TOKEN>   # scope catalog:read, ya existe
x-cep-edge-fetch: 1
x-forwarded-host: cepformacion.akademate.com

Si Traefik pisa x-forwarded-host, usa también `?host=cepformacion.akademate.com`.
Health del origen: GET https://cepformacion-app.akademate.com/api/health → `revision` del contenedor vivo (telemetría, no pin).
El Worker no se acopla a un SHA. Pinta el JSON que sirva el contenedor detrás de `cepformacion-app.akademate.com`. Si trae `data.website.pages[].sections`, recorre esas sections.
Media: proxifica solo `/api/media/file/*` contra ese mismo host. Nunca host `cepformacion.app` (punto, sin guion).

En runtime, `x-cep-edge-fetch` debe coincidir con `CEP_EDGE_FETCH_SECRET` / `ORIGIN_SERVICE_TOKEN` del origen. El valor `1` del contrato es el flag de intención; el Worker envía el secreto real para que el dashboard no redirija a `/dashboard`.

## PURGE

POST https://cepformacion.com/internal/purge
Content-Type: application/json
x-webhook-signature: <hmac-sha256-hex del body con CEP_WORKER_PURGE_SECRET>
{"source":"payload","at":"<iso>"}

Si el secret no está, el origen no pega. Tú invalidas KV/cache al recibir ese POST. No 500 al origen.

## APEX VS PREVIEW

https://cepformacion.com/ = coming-soon. No MODE=dynamic sin GO.
Verdad visual = https://cepformacion.com/preview.
0 `__NEXT_DATA__`. 0 proxy HTML a Next. 0 clonar www.cepcomunicacion.com. 0 sql-public-catalog.js como web.

## MARCA CEP — FAIL ACTUAL

Hoy `/preview` pinta `#2563eb` (azul Tailwind/Akademate) junto a `#f2014b`. Eso está mal.
Tokens obligatorios, host-only, nunca `if tenantId == CEP`:

- Marca / CTA / links: `#f2014b`
- Bloques oscuros: `#3E091A`
- Prohibido: `#0066CC`, `#2563eb`, `#3b82f6`, azul Akademate, oklch default shadcn azul
- Tipografía: Manrope
- Logo: PNG rectangular CEP dentro de disco blanco. No estirar. No letter-avatar.

El login del dashboard (cepformacion-app.akademate.com/login) ya tiene `--brand:#f2014b`. La web pública tiene que coincidir.

## CONTRATO DE CAPAS — pintar, no re-resolver

Si el JSON no trae un campo, la UI lo omite. No hay fallback de marketing. No hardcodees FAQ, horario, diploma ni precio en `render.ts`.
Convocatoria gana edición: fechas, horario, sede, precio, horas de ESA edición, diploma, plazas.
Curso gana editorial: nombre, imagen, programa, objetivos, FAQs, requisitos.
Ciclo solo si `cycle != null` (`training_type !== private` AND cycle id poblado). Un curso privado con `cycle_id` residual NO hereda prácticas del ciclo.

## HORAS

Dos enteros: `classroomHours`, `companyHours`. Nunca la suma. Nunca 0 fingido.
Card duración = `classroomHours`.
Card Prácticas solo si `companyHours != null`.
No existe `class_frequency` en CourseRuns. Usa `classFrequency` (nº de días) o omítelo.

## FAQS / HORARIO / PRECIO

FAQs = `course.landingFaqs`. Array vacío = no pintes FAQ. No rellenes 4 de oferta.
Horario = `schedule.days` + `start` + `end`. Si existen, no copy «te confirmamos horario».
Precio = `price.label`. Consultar se queda Consultar. No inventes €.

## NOMBRE E IMAGEN

`displayName` = `cycle.name || course.nombre` solo si `cycle != null`; si no, `course.nombre`.
Imagen: `imageUrl` o `course.imageUrl`. Rutas relativas `/api/media/file/...`

## SNAPSHOT MEDIDO EN PROD (04bfa5d)

meta.tenant = cep-formacion
counts: convocatorias 36, courses 193, cycles 4, campuses 5, teachers 100
36/36 classroomHours + schedule
20/36 companyHours (resto null)
8/36 con FAQs reales
34/36 course no null
piiHits []

Claves de convocatorias[n] (id 125):
id, codigo, status, startDate, endDate, enrollmentDeadline,
schedule { days, start, end }, classFrequency,
classroomHours, companyHours, certificationType, deliveryMode,
financialAidAvailable, price { label }, trainingLine, availableSeats,
course { id, slug, nombre, imageUrl, durationHours,
         landingObjectives, landingProgramBlocks, landingOutcomes,
         landingFaqs, landingAccessRequirements, landingTargetAudience },
campus { slug, name, city },
instructor { id, name, photoUrl },
cycle { slug, name, level } | null,
imageUrl, updatedAt

Muestra real: classroomHours 120, companyHours null, schedule.days ["friday"], price.label "Consultar", course.landingFaqs [].
campuses.whatsapp no existe. No lo inventes.

## PROHIBIDO

- Proxy HTML de Next `/p/*`
- Rebuild Docker en el VPS
- Hetzner como path de deploy
- Merge a main
- SQL / seed / PII en logs
- Meta ads
- Adjuntar ciclo a curso privado para inventar prácticas
- Sumar theory+practice en una sola card
- Copy «incluido mock»
- Pedir cutover del apex

Cuando `/preview` sea pixel-comparable a la marca CEP (`#f2014b` / `#3E091A`, sin azul) y pinte horas/FAQs/horario/precio desde el JSON, para. No pidas cutover.
