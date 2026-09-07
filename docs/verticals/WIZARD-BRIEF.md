# BRIEF: Vertical Configuration Engine + Onboarding Wizard (Akademate)

Prompt optimizado a partir de la Fase 0 (docs/verticals/) y de las 10 landings (rama `feat/vertical-landings`). Listo para pegar en una sesión de implementación.

---

## ROL
Eres product engineer + arquitecto de plataforma SaaS multitenant (Next.js 15, TypeScript estricto, Postgres + Drizzle, RLS por `tenant_id`). Construyes el motor de configuración por vertical y su wizard de alta. No inventes features: todo módulo debe existir en el canon de producto o quedar marcado como roadmap/HOLD.

## OBJETIVO
Un wizard de onboarding sencillo que, al elegir el tipo de academia, **reconfigura el SaaS en caliente**: nombre y número de páginas del menú, vocabulario del vertical, módulos activos y oferta comercial de add-ons. La lógica de negocio y el esquema son SIEMPRE generales y compartidos; lo que diferencia una academia de otra son sus **restricciones (entitlements)**, no ramas de código.

## INSUMOS (leer primero)
- `docs/verticals/README.md`: matriz maestra vertical × módulo + CTA por vertical + gaps HOLD.
- `docs/verticals/VERTICAL-01/02/05`: estudios con dolores, journey y módulos Core/Importante/Opcional/N/A.
- Canon de módulos: 8 pilares (Web and commerce, Growth and admissions, Academic operations, People and workforce, Campus and learning, Payments and finance, Library and resources, Insight and ecosystem) y catálogo de 23 sub-módulos.
- 10 verticales con slugs canon: `professional-training`, `wellness`, `sports`, `languages`, `driving-schools`, `seasonal`, `coding-academies`, `performing-arts`, `online-cohorts`, `networks`.
- Infra existente: feature flags (`apps/tenant-admin/app/api/feature-flags/route.ts`), enums de billing (`packages/types/src/billing.ts`), planes Launch/Business/Enterprise, `tenant_id` en todas las entidades.
- Gaps confirmados (marcar como add-on "próximamente", JAMÁS activables): QR/NFC access, digital signage, diary vehículo+monitor como recurso, fees de no-show automáticos, Verifactu, conectores Zoom/WhatsApp.

## MODELO CRÍTICO: 3 sets de módulos por vertical
1. **CORE (fijo, incluido):** lo que la landing promete. Define el menú visible y el checklist de setup.
2. **ADD-ON (opcional, comprable):** extensiones típicamente relevantes para ese vertical; se ofrecen en el paso 3 del wizard y en el marketplace.
3. **MARKETPLACE (resto):** no entra en el menú por defecto pero es comprable puntualmente. Ejemplo canónico: un campamento de verano probablemente nunca querrá digital signage, pero si un cliente lo necesita, debe poder comprarlo y al activarse aparece en su menú.

Reglas inquebrantables:
- Los sets se definen como **datos** (tabla de definiciones + matriz de entitlements), nunca con `if vertical === 'x'` en lógica de negocio.
- Ocultar módulo = ocultar entry points de menú/nav; **los datos nunca se destruyen ni se bloquean a ciegas** (re-activar un módulo restaura todo).
- Cambiar de vertical más tarde re-ejecuta la configuración de menú sin migraciones destructivas.
- Multi-programa (ej. academia deportiva con campus de verano): vertical primario + verticales secundarios; los sets se fusionan con core unión, no sustitución.
- Features roadmap: visibles en marketplace con estado "próximamente" (no comprables) hasta que producto las entregue.

## WIZARD (simple, 3 pasos + salida)
- **Paso 1 — Tipo:** grid de 10 tarjetas (título del vertical + su frase de la landing). Atajo "No estoy seguro" → 3 preguntas: ¿qué vendes? (membresía/bonos · matrícula de curso · plaza de temporada · cohorte) · ¿cómo reservan? (web · teléfono/WhatsApp · presencial) · ¿dónde se imparte? (sala propia · vehículo · varias sedes · online). Mapa de respuestas → vertical sugerido.
- **Paso 2 — Tu menú:** resumen de lo que cambia: páginas del menú (nombre y nº), vocabulario elegido (alumno/socio/deportista/learner), reglas por defecto del vertical. Botón "Se ve bien".
- **Paso 3 — Add-ons sugeridos:** sólo los del set 2 de ese vertical, con estado incluido/próximamente; precio teaser → `/pricing`. Saltable.
- **Salida:** dashboard ya configurado. El marketplace completo vive siempre en `Configuración → Módulos` (los 3 sets visibles: incluido · add-on · resto).

## MOTOR DE CONFIGURACIÓN (la parte crítica)
Modelo de datos mínimo:
- `vertical_profiles`: slug, labels de entidad (ES/EN: alumno·socio·deportista·monitor·convocatoria·bono...), `menu_items[]` ordenados, defaults de constraints, tono de copy.
- `module_catalog`: id + nombre por los 23 sub-módulos del canon + estado (live | roadmap).
- `vertical_entitlements` (seed por vertical): (vertical × módulo) → `core | addon | marketplace | off`.
- `tenant_entitlements`: overrides comprados por tenant (add-on activado) + vertical primario/secundarios.
- Constraints de metodología (2ª capa, configurables por tenant sobre defaults del vertical): umbrales de asistencia (25%/75%), alertas por faltas consecutivas, depósitos, plazos de convocatoria, política de cancelación.
- Menu builder en runtime: filtra nav/rail/sidebar por entitlements del tenant y pinta labels con el vocabulario del vertical. El rail respeta la preferencia de compacta sin scroll.

## MENÚS CORE POR VERTICAL (default, afinables; los que no aplican NO se muestran)
- **FP regulada:** Dashboard · Admisiones · Alumnos/Expedientes · Académico (cohortes/convocatorias) · Asistencia · Campus · Finanzas · Multi-sede · Analíticas · Configuración.
- **Wellness:** Dashboard · Clases (agenda) · Socios · Membresías y bonos · Check-in · Pagos · Web/Reservas · Analíticas · Configuración.
- **Deportivas:** Dashboard · Pruebas/Admisiones · Deportistas y tutores · Equipos · Entrenamientos/Instalaciones · Temporadas · Asistencia · Pagos · Analíticas · Configuración.
- **Idiomas:** Dashboard · Nivelación/Admisiones · Grupos y niveles · Horarios · Alumnos · Facturación mensual · Campus híbrido · Analíticas · Configuración.
- **Autoescuelas:** Dashboard · Alumnos · Agenda de clases · Vehículos y monitores · Exámenes/convocatorias · Pagos · Web · Configuración.
- **Campus de verano:** Dashboard · Campamentos (programas) · Semanas y plazas · Familias/Participantes · Depósitos y documentos · Comunicación · Check-in · Configuración.
- **Coding:** Dashboard · Admisiones · Cohortes · Campus de proyectos · Mentores · Portafolio · Pagos · Analíticas · Configuración.
- **Artes escénicas:** Dashboard · Matrículas · Clases y estudios · Alumnos y familias · Actuaciones/Eventos · Pagos · Configuración.
- **Online/cohortes:** Dashboard · Admisiones · Cohortes · Campus (LMS) · Comunidad · Progreso · Pagos · Analíticas · Configuración.
- **Grupos/franquicias:** Dashboard · Red y marcas · Sedes · Estándares · Finanzas por sede · Informes de red · Configuración.
Nota: módulos N/A por vertical según matriz (ej. LMS oculto en wellness; signage oculto en autoescuelas y online) permanecen en marketplace.

## FASES (entregables)
1. **F1 Motor:** tablas + seeds de la matriz (10×23) + menu builder + vocabulario en tenant-admin. Tests de matriz (paridad con docs/verticals).
2. **F2 Wizard:** UI de alta (pasos 1-3) escribiendo `vertical_profiles` + `tenant_entitlements`.
3. **F3 Marketplace:** página Módulos con los 3 sets, estados y compra de add-on (gated a la decisión de pricing público).
4. **F4 Vocabulario y copy:** labels i18n por vertical en toda la app (listados, emails, botones).
5. **F5 Refinamiento:** estudios batch 2 (03, 04, 06 primero) → ajustar sets y defaults con evidencia, no con suposiciones.

## ACEPTACIÓN (escenarios de prueba)
- Elegir "Campamento de verano" → menú con ~8 páginas, sin LMS ni contabilidad; digital signage aparece en marketplace como "próximamente".
- Elegir "FP regulada" → admisiones/expedientes/asistencia core; vocabulario alumno/convocatoria; umbrales 25%/75% precargados y editables.
- Comprar signage como campamento → aparece en menú, datos intactos, sin redeploy.
- Cambiar de vertical → menú re-configurado; RLS y datos intactos.
- Ningún `if vertical` en lógica de negocio; toda la matriz es dato testeable.

## NO HACER
- No activar ni prometer features roadmap (QR/NFC, signage, diary de vehículos, fees, Verifactu) fuera del estado "próximamente".
- No clonar configuraciones: un vertical nuevo = una fila de seeds + labels, no código nuevo.
- No mezclar la línea CEP OVH con el SaaS akademate.com salvo como datos de caso ancla.
- No mostrar al cliente entradas de menú de módulos sin entitlement (tampoco vacías "coming soon" salvo en marketplace).
