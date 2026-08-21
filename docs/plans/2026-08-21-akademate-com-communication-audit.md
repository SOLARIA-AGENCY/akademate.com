# Akademate.com — Auditoría de comunicación y plan de landing enterprise

**Fecha:** 2026-08-21  
**Estado:** Listo para implementación  
**Sitio auditado:** [https://akademate.com](https://akademate.com) (EN/ES, producción viva)  
**Producto:** SaaS vertical para academias (web + admisiones + operación + campus + pagos)  
**Objetivo del trabajo:** convertir el home en un landing de ventas enterprise internacional, con menos texto, menos superficie y más producto.  
**Plan de implementación:** [`2026-08-21-akademate-home-landing-implementation.md`](./2026-08-21-akademate-home-landing-implementation.md)

---

## 0. Prompt listo para otro agente

Copia y pega el bloque siguiente en un agente de implementación. El prompt es autónomo: incluye contexto, investigación, auditoría, arquitectura de página, reglas de copy, archivos y Definition of Done.

````markdown
# TAREA: Rediseñar el home de akademate.com como landing de ventas enterprise

## Quién eres
Eres un director de comunicación B2B + implementador frontend. No eres un copywriter que añade párrafos. Tu trabajo es **quitar superficie, subir estatus y hacer que el producto se venda solo**. El resultado debe parecer una compañía internacional (Stripe / Linear / Rippling), no un catálogo de módulos ni una landing de startup local.

## Qué NO debes hacer
- No reescribas el home añadiendo más secciones, más pilares, más “coming soon” o más sellos.
- No conviertas el home en una enciclopedia del producto. El catálogo vive en `/features` y `/pricing`.
- No inventes certificaciones (ISO 27001, SOC 2) ni métricas de clientes que no existan.
- No uses reseñas de alumnos de CEP Formación como si fueran clientes de Akademate. Esas reseñas hablan de la academia, no del software.
- No dejes “Akademate apps are coming”, Holded/Xero/QuickBooks “coming soon” ni MCP como bloques de primer nivel en el home.
- No toques `apps/tenant-admin` ni las webs de academias (CEP). Esto es solo `apps/web` (akademate.com).
- No partas de `origin/main`. En `main` el home es un coming soon y **no es el código de producción**.

## Fuente de verdad (obligatorio leer antes de editar)

1. Sitio publicado (comunicación real):
   - https://akademate.com/en
   - https://akademate.com/es
   - https://akademate.com/en/features
   - https://akademate.com/en/pricing
   - https://akademate.com/en/solutions
   - https://akademate.com/en/contacto
2. Código de producción (NO está en `main`):
   - Branch: `origin/codex/akademate-public-es-verticals`
   - Commit de referencia: `522f94e2` — `feat(web): add claim-safe finance connector showcase`
   - Home: `apps/web/app/page.tsx` (~449 líneas, 17+ bloques)
   - Copy: `apps/web/lib/i18n/dictionaries.ts`, `apps/web/lib/i18n/marketing-copy.ts`, `apps/web/lib/marketing-content.ts`, `apps/web/lib/home-experience-i18n.ts`
   - Componentes: `apps/web/components/marketing/*`
3. Auditoría y plan: `docs/plans/2026-08-21-akademate-com-communication-audit.md`

Arranca el trabajo desde el branch de producción (`origin/codex/akademate-public-es-verticals` o el commit `522f94e2`) rebaseado sobre la base que te indiquen. Si trabajas desde `main`, primero restaura/cherry-pickea el árbol de `apps/web` de ese commit. Si no lo haces, estarás destruido el coming soon, no el sitio publicado.

## Problema de negocio
El home publicado ya intenta verse enterprise, pero **explica demasiado y vende poco**. Es un whitepaper scrolleable:

| Página | Palabras aprox. (HTML visible) |
|---|---|
| `/en` | 4.163 |
| `/es` | 4.575 |
| `/en/features` | 3.397 |
| `/en/pricing` | 9.358 |
| `/es/pricing` | 10.340 |

El visitante (dueño/director de academia, operador multi-sede, CFO de grupo) no necesita 8 pilares × 5 bullets, 6 pasos del learner journey, 4 modos de publicación, campus físico, MCP, apps, 8 verticales, 3 planes, 5 marcos de compliance y 2 teasers editoriales en la misma página.

## Investigación: cómo debe ser un home enterprise 2026

Patrón de referencia (Linear, Stripe, Rippling, Notion):

1. **5 segundos:** qué es, para quién, qué outcome, qué hago ahora.
2. **Headline ≤ 8–12 palabras.** Outcome, no catálogo. Linear: “The product development system for teams and agents.” Stripe: “Financial infrastructure to grow your revenue.”
3. **Un CTA primario.** Aquí: “Book a demo” / “Reservar una demo”. El secundario es “See the product” / “Ver el producto”, no “Explorar la plataforma” hacia otra enciclopedia.
4. **El producto es el argumento.** UI real o mock de alta fidelidad del dashboard, no grids de iconos. Linear *es* el demo. Stripe enseña el producto, no lo describe.
5. **3–5 pilares de outcome**, no 8–23 módulos. Cada pilar = 1 frase + 1 visual de producto. El detalle va a `/features`.
6. **Prueba social arriba**, no en el scroll 12. Logos reales o un caso nombrado. Si no hay logos de clientes Akademate, usa 1 caso verificable (CEP Formación como academia operando sobre Akademate) con *claim de software*, no reseñas de alumnos.
7. **Progressive disclosure.** Home = tesis + prueba + 3 capacidades + 1 prueba de conversión + CTA. Features = módulos. Solutions = vertical. Pricing = alcance comercial.
8. **Menos copy, más aire.** Tipografía grande, tracking negativo, whitespace. El estatus enterprise viene de restricción, no de vocabulario (“operating system”, “connected”, “clarity” repetidos 20 veces).
9. **Cero roadmap en el home.** “Coming soon”, conectores no listos, apps nativas y MCP son señales de inmadurez si se ponen al mismo nivel que el producto vivo.
10. **IA = secundaria y gobernada.** Una línea o un recuadro pequeño, no una sección hero. Akademate vende operación de academias; MCP es un plus.

Meta de copy del home (EN y ES, texto visible de marketing, sin nav/footer/legal):
- **≤ 650–800 palabras**
- **≤ 8 secciones** (hero cuenta)
- **≤ 6 H2**
- Hero: 1 eyebrow + 1 H1 + 1 subtítulo de 1 frase + 2 CTAs + 1 visual
- Cada bloque de feature: título ≤ 6 palabras, cuerpo ≤ 14 palabras

## Arquitectura objetivo del HOME (en este orden, y nada más)

1. **Nav corta.** Product / Solutions / Pricing / Company. CTA persistente: Book a demo. Language switch. Quitar del nav primario: Blog, News, Download, “Who it’s for” como label largo. Download y apps no son un item de primer nivel.
2. **Hero.** H1 outcome + subtítulo mecanismo + Demo / See product + visual de *command center* real (el carousel/mock que ya existe: Academy overview, sessions, admissions pulse). Nada de 6 chips de features debajo del H1.
3. **Prueba (1 pantalla).** Una fila: o logos de academias reales, o un caso único (“CEP Formación opera captación, oferta y campus sobre Akademate”) + 2–3 métricas *solo si son reales*. Si no hay métricas auditables, no las inventes; usa el caso cualitativo.
4. **Producto en 3 actos (no 8 pilares).**
   1. **Fill the academy** — oferta pública, reserva, pago, lista de espera. Visual: página de curso / checkout (ya existe `CourseRegistrationPreview`).
   2. **Run the academy** — alumnos, horarios, sedes, asistencia, equipo. Visual: `AcademyOperationsStory` / hero operations.
   3. **Teach and collect** — campus + cobros. Visual: un solo frame, no dos secciones más.
5. **Un momento de producto profundo.** Un solo mock interactivo o tabbed (Operate / Publish / Enrol) — ya existe en el hero. No repetirlo 4 veces más abajo (website distribution + course page + operations + roles).
6. **Para quién, en una fila.** 4–6 verticales como chips/cards de una línea que enlazan a `/solutions/[slug]`. No un carousel largo con párrafos.
7. **Planes en 3 cards, sin tabla.** Launch / Business / Enterprise, una línea cada una, CTA a `/pricing`. La matriz de 23 capacidades **no** entra en el home.
8. **Cierre.** Una frase + Book a demo + contacto. Trust de verdad: GDPR + “EU-hosted” o lo que sea factual. ISO/SOC solo si hay certificación real; hoy son “governance references” y en el home parecen sellos falsos. Muévelos a `/legal` o Company.

## Qué sale del HOME (mover, no borrar del producto)

| Bloque actual | Destino |
|---|---|
| 8 platform pillars (Web, Growth, Academic, People, Campus, Payments, Library, Insight) | `/features` como grid único. En home, como mucho 3 actos. |
| Learner journey 01–06 Discover→Grow | `/features` o eliminar. Es jerga interna. |
| Roles (Academy team / Teachers / Learners) con 5 bullets | `/features` o un tab discreto dentro del acto 2 |
| Physical campus (QR/NFC/Digital signage) | `/features` o módulo paid. No es el job-to-be-done del primer scroll. |
| MCP / ChatGPT / Claude / Grok / Gemini | `/features#mcp` o `/legal/ia`. Una mención de una línea máximo. |
| Website distribution 4 modos | Dentro del acto 1, un tab, no sección propia. |
| Course registration preview | Es el visual del acto 1. No necesita H2 + 7 chips de “Shareable URL / Consent / …” |
| Connector logos (Stripe, PayPal, Meta, Zoom, Zapier…) | Franja silenciosa bajo acto 3, sin párrafo. “Coming soon” no se etiqueta en home. |
| Finance Holded / Xero / QuickBooks coming soon | Solo `/pricing` o `/features`. El home no anuncia integraciones no vivas. |
| Customer voices (3 quotes CEP) | Reescribir como caso Akademate o quitar. No citar “best academy on the island” en un SaaS. |
| App download Mac/iPhone/iPad coming soon | `/download`. Fuera del home. |
| 8 solution cards con párrafos | Chips → `/solutions` |
| Pricing cards + copy de planes | 3 cards mínimas → `/pricing` |
| Governance GDPR/AI Act/ISO/SOC/OWASP | Company o Legal. En home, 1 línea factual. |
| Insights + news teasers | Footer o `/blog`. El home no es revista. |

## Tono y copy

**Posicionamiento:** el sistema operativo de academias — pero **dilo una vez**, no en cada H2.

**Voz:** internacional, precisa, calmada. Frases cortas. Verbos concretos (publish, enrol, collect, schedule). Cero slogans vacíos (“grow with confidence”, “build the academy people want to join”, “one connected learner journey”).

**EN (dirección, no texto final obligatorio):**
- H1: `Run the whole academy in one system.`
- Sub: `Enrolment, teaching, payments and multi-site operations — one record, every role.`
- CTA: `Book a demo` / `See product`

**ES (no calco del inglés):**
- H1: `Toda la academia, en un solo sistema.`
- Sub: `Matrículas, docencia, cobros y operación multi-sede. Un expediente, cada rol.`
- CTA: `Pedir una demo` / `Ver el producto`

El español actual es traducción enterprise (“sistema operativo”, “alcance operativo”, “espacio de trabajo enfocado”). Debe sonar a director de academia en Madrid/México/Bogotá, no a whitepaper traducido.

**Reglas de wording:**
- Prohibido repetir “connected / conectada” más de 2 veces en el home.
- Prohibido “operating system / sistema operativo” más de 1 vez.
- Prohibido “clarity / claridad” como headline.
- Prohibido “coming soon” en el home.
- Claims de producto = lo que está en producción (web de academia, leads/CRM, convocatorias, campus, pagos Stripe). Roadmap = nunca en home.

## Diseño visual (estatus, no rediseño de marca)
- Mantén la paleta actual (`#06142f`, `#f7f9fc`, azul). Es correcta.
- Más whitespace. Menos cards con borde. Menos grids 2×4 de módulos.
- El peso visual debe estar en **un** product shot por sección, no en iconos Lucide + 5 bullets.
- Nav y footer más quietos. Footer: Product, Solutions, Pricing, Company, Legal, idioma. Sin “Download apps” como columna hero.

## i18n y SEO
- Toda cadena visible en EN y ES. No dejes inglés en `/es` (hoy hay “12–13 September”, “Your finance provider”, quotes EN en página ES).
- Paridad de rutas `/en` y `/es`.
- Metadata: title corto, description de 1 frase, OG con product visual.
- Actualiza e2e: `apps/web/e2e/home-page.spec.ts`, `i18n-parity.spec.ts`, tests de marketing copy. Si un test exige 8 pilares o 6 journey steps en el home, cámbialo: esos tests están protegiendo el problema.

## Implementación
1. Lee el sitio live y este documento.
2. Restaura el código de producción (`522f94e2` / `origin/codex/akademate-public-es-verticals`) como base de `apps/web`.
3. Rediseña `apps/web/app/page.tsx` a las 8 secciones de arriba. Reutiliza componentes (`ProductHeroCarousel`, `AcademyOperationsStory`, `CourseRegistrationPreview`). No crees 10 componentes nuevos.
4. Recorta diccionarios y `marketing-content` usados por el home. No borres el catálogo: sírvelo desde `/features`.
5. Nav/footer: `apps/web/lib/public-navigation.ts`, `header.tsx`, `footer.tsx`.
6. Features: deja de repetir el home. Features = catálogo de módulos (el explorer de 23 items puede quedarse, pero con intro de 40 palabras, no otro home).
7. Pricing: no es este sprint salvo que el home deje de embeber la matriz. El home solo enlaza.
8. Corre tests de `apps/web`. No rompas i18n routing ni formularios de contacto/demo.

## Definition of Done
- Home EN y ES ≤ 800 palabras de copy de marketing.
- ≤ 8 secciones, ≤ 6 H2.
- Hero responde en 5s: qué / para quién / outcome / CTA.
- Hay 1 visual de producto dominante above the fold.
- Cero “coming soon”, cero sellos ISO/SOC en home, cero reseñas de alumnos CEP usadas como social proof del SaaS.
- 3 actos de producto visibles; 8 pilares ya no están en el home.
- CTA primario único y repetido al cierre: demo.
- ES nativo, sin leftovers EN.
- Tests e2e/i18n del home actualizados y en verde.
- Diff fácil de revisar: home + nav/footer + copy, no un rewrite de todo `apps/web`.
````

---

## 1. Investigación: cómo debe ser

### 1.1 Qué hace un home que vende (B2B SaaS 2026)

Un comprador enterprise escanea; no lee. En 5 segundos debe poder responder:

1. ¿Qué es esto?
2. ¿Es para mí?
3. ¿Qué cambia si lo compro?
4. ¿Qué hago ahora?

La evidencia de mercado (patrones 2026 de Stripe, Linear, Rippling, Notion y teardowns de conversión B2B) coincide:

- **Headline de outcome, ≤ 12 palabras.** No “plataforma todo-en-uno con módulos”.
- **Un CTA primario.** Dos CTAs del mismo peso (“Book a demo” + “Explore the platform”) bajan conversión. El secundario debe ser *ver el producto*, no *ir a otra página-catálogo*.
- **Producto first.** Screenshot, mock de alta fidelidad o micro-demo. Las ilustraciones abstractas y los grids de iconos no construyen modelo mental.
- **3 a 6 capacidades**, cada una atada a un outcome y a un visual. El resto es `/features`.
- **Prueba social en el primer scroll**, no en el bloque 11. Logos nombrados o un caso. Estrellas inventadas o reseñas ajenas destruyen trust.
- **El home enruta.** No cierra el job de Features, Solutions y Pricing. Manda a cada ICP a su página en un scroll.
- **Cierre con el mismo CTA.** Quien llegó al final es high-intent.

Linear no describe Linear: Linear *corre* en la página. Stripe carga el estatus en tipografía, un producto visible y números reales. Rippling enseña un sistema amplio **sin** volcar 23 módulos en el primer viewport. La disciplina común es **quitar**.

### 1.2 Qué señala “empresa internacional”

No es vocabulario (“operating system”, “governance”, “ecosystem”). Es:

- Restricción visual y verbal
- Producto fotografiado como software de verdad
- Claims auditables
- Nav corta y estable
- Ausencia de roadmap en la superficie comercial
- Localización nativa, no calco
- Precio o alcance comercial accesible sin un tratado

### 1.3 Anatomía objetivo vs. catálogo

```
HOME (venta)          FEATURES (profundidad)       PRICING (compra)
─────────────────     ──────────────────────       ────────────────
Qué / quién / CTA     8 pilares + módulos          3 planes
1 visual producto     explorer / workflows         matriz y add-ons
3 actos               integraciones                legal comercial
1 caso                MCP / apps / campus físico   FAQ
verticales en chips   roadmap etiquetado           “talk to sales”
3 planes en 1 línea
cierre demo
```

### 1.4 Benchmarks de densidad

| Superficie | Palabras visibles (aprox.) | Lectura |
|---|---|---|
| Home Akademate EN | 4.163 | Enciclopedia |
| Home Akademate ES | 4.575 | Enciclopedia |
| Features EN | 3.397 | Segundo home |
| Pricing EN / ES | 9.358 / 10.340 | Contrato, no página |
| Home enterprise de referencia | 600–1.200 de copy + UI | Escaneable |

El problema no es “falta de contenido”. Es **exceso de superficie con el mismo mensaje**.

---

## 2. Auditoría del sitio publicado

### 2.1 Hallazgo crítico de repo

`origin/main` **no es el sitio publicado**. En `main`, `apps/web/app/page.tsx` es un coming soon + waitlist. El marketing vivo vive en `origin/codex/akademate-public-es-verticals` (`522f94e2` y padres). Cualquier agente que edite `main` sin restaurar ese árbol estará optimizando la página equivocada.

### 2.2 Inventario del home live

Orden real de bloques (producción):

1. Hero dark — “Run your academy. Grow.” + carousel Operate/Publish/Enrol
2. Client marquee
3. Trust signals (consent, classroom, configure stack)
4. Academy command centre (mock dashboard + admissions pulse)
5. One workspace per role (3 tabs × 5 bullets)
6. Learner journey 01–06
7. Eight platform pillars (40 capabilities)
8. Physical campus (QR/NFC + digital signage)
9. MCP / AI agents
10. Website distribution (4 modos, repetido)
11. Shareable course page (mock checkout + 7 chips)
12. Integration logos
13. Finance connectors coming soon (Holded, Xero, QuickBooks)
14. Customer voices (3 reseñas CEP)
15. Native apps coming soon
16. Eight academy models
17. Three pricing scopes
18. Five governance frameworks
19. Insights + news
20. Closing CTA

Son **17 H2** en una sola URL. El mensaje se repite: “one / connected / operating / clarity”.

### 2.3 Diagnóstico por eje

#### Comunicación

| Síntoma | Evidencia | Efecto |
|---|---|---|
| Tesis diluida | H1 corto, pero 19 bloques lo vuelven a explicar | El visitor no recuerda *una* promesa |
| Jerga de plataforma | “operating system”, “command centre”, “connected learner record”, “operating scope” | Suena a deck interno, no a venta |
| ES calco | “sistema operativo”, “alcance operativo”, “espacio de trabajo enfocado”; leftovers EN (`12–13 September`, `Your finance provider`, quotes EN) | Barato para un “international company” |
| Features como lista de la compra | 8 pilares × 5 items en home *y* otra vez en `/features` | Sensación de software inacabado que necesita justificarse |
| CTA ambiguo | Primario demo + secundario “Explore the platform” hacia otro muro de texto | El siguiente paso no es único |

#### Credibilidad enterprise

| Síntoma | Evidencia | Riesgo |
|---|---|---|
| Social proof ajeno | “The best academy on the island” — reseña de alumno CEP | El SaaS se atribuye el NPS de un cliente |
| Sellos no certificados | ISO 27001, SOC 2, EU AI Act como “Governance reference” | Parece certification-washing |
| Roadmap en home | Apps, Holded/Xero/QBO, MCP, Zapier “connector-ready” | Empresa internacional no vende el backlog |
| Métricas del mock | 1,284 learners, +12%, 92% attendance | Si se leen como KPI de Akademate, son inventadas |
| Nav inflada | Features, Who it’s for, Pricing, Blog, News, Download, Company | Download/apps en nav primario = producto no listo |

#### UX de venta

- El primer product visual es bueno (carousel). Luego se **re-explica** con roles, journey, pillars, campus, web, course page.
- Pricing embebido sin precio (“Tailored proposal”) está bien para enterprise, pero la **tabla de 23 filas** en `/pricing` (~10k palabras) es un RFP, no una página de planes.
- Contacto es sólido (form + demo). El home debería terminar ahí, no en blog.

### 2.4 Qué SÍ funciona (no tirar)

- Categoría clara: sistema para academias, no un LMS genérico.
- Hero visual (Operate / Publish / Enrol) y el mock de “Academy overview”.
- Bilingüe EN/ES con routing `/en` `/es`, sitemap y hreflang.
- Separación conceptual Features / Solutions / Pricing / Contact.
- Paleta navy (`#06142f`) y tipografía tight: dirección visual correcta.
- Un cliente real utilizable: CEP Formación (web pública + operación). Hay que usarlo como **caso de software**, no como testimonios de alumnos.
- CTA de demo existente (`/contacto?asunto=demo`).
- Producto real detrás: tenant web, CRM, convocatorias, campus, Stripe. El home puede *mostrar* eso.

### 2.5 Scorecard

| Criterio | 1–5 | Nota |
|---|---|---|
| Claridad de oferta en 5s | 3 | H1 funciona; el resto lo tapa |
| Estilo international / enterprise | 2 | Vocabulario sí, disciplina no |
| Densidad de copy | 1 | 4k–4.5k palabras |
| Producto visible vs. texto | 3 | Buenos mocks, ahogados |
| Prueba social honesta | 2 | Caso real mal usado |
| Home como máquina de demo | 2 | Demasiadas salidas, un solo job |
| Features sin volcar el catálogo | 1 | Home = Features = Pricing lite |
| i18n nativo | 2 | Estructura bien; ES traducido |

**Media: 2.0 / 5.** No es un sitio amateur. Es un sitio **sobreescrito**.

---

## 3. Plan de optimización

### Fase A — Alinear código (0, bloqueante)

1. Confirmar que el branch de trabajo parte de `origin/codex/akademate-public-es-verticals` (`522f94e2`), no de `main`.
2. Si hay que abrir PR contra `main`, el PR debe **traer** el árbol de marketing o el revisor estará mirando un coming soon.

### Fase B — Recortar el home (prioridad 1, este sprint)

Reescribir `apps/web/app/page.tsx` a 8 secciones. Reutilizar, no recrear:

- `ProductHeroCarousel` → hero
- `AcademyOperationsStory` → acto “Run”
- `CourseRegistrationPreview` → acto “Fill”
- `SolutionCarousel` → versión compacta (chips)
- Pricing: 3 cards existentes, sin intro larga
- `Header` / `Footer` → nav recortada

Quitar del árbol del home: `HomeMcpConnect`, `PhysicalCampusStory`, `AppDownloadShowcase`, `GovernanceFrameworks`, `FinanceConnectorShowcase`, `CustomerVoices` (hasta recast), `WebsiteDistributionPreview` como sección propia, journey 01–06, grid de 8 pilares, teasers de blog.

**Copy nuevo** en `dictionaries.ts` + strings de home en `marketing-copy.ts`. Presupuesto: ≤ 800 palabras EN y ES.

### Fase C — Reubicar profundidad (prioridad 1, mismo PR si cabe)

- `/features`: una intro de 40 palabras + el explorer de módulos. Eliminar del features page los bloques que clonan el home (roles, distribution, apps).
- `/solutions`: ya es utilizable. El home solo apunta.
- `/pricing`: fuera de scope funcional, pero el home no debe duplicar cards largas ni FAQ.
- `/download` y MCP: enlaces de footer o features, no nav primaria.

### Fase D — Trust honesto (prioridad 2)

- Caso CEP: “Academia real operando oferta, leads y campus en Akademate” + enlace a la web pública del tenant. Cero quotes de alumnos.
- Compliance: en home, “GDPR · hosted in the EU” (solo si es verdad). ISO/SOC/OWASP → página Company/Legal como *roadmap de controles*, no badges.
- Integraciones en home: Stripe y Cloudflare si están *Available*. El resto, silencio.

### Fase E — Verificación

- Contar palabras del HTML visible del home (script o `e2e`): techo 800 de copy de marketing.
- Checklist 5 segundos con alguien que no haya visto el sitio.
- `pnpm` tests de `apps/web` (home, i18n parity, marketing-copy).
- Revisión visual EN y ES, desktop y mobile: un product shot por sección, no muros.

### Fuera de este plan

- Rediseño de marca / logo
- Blog, news, legal pages
- Implementar ISO/SOC
- Apps nativas
- Cambiar pricing comercial o la matriz RFP (salvo extraerla del home)
- Webs de tenant (CEP)

---

## 4. Copy de partida (dirección)

No es texto final cerrado; es el techo de densidad.

**EN**

- Eyebrow: `Academy operations`
- H1: `Run the whole academy in one system.`
- Sub: `Enrolment, teaching, payments and multi-site operations — one record for every role.`
- Primary: `Book a demo`
- Secondary: `See the product`
- Act 1: `Turn interest into a confirmed place.`
- Act 2: `Run every site from one picture.`
- Act 3: `Teach, collect, and see what is working.`
- Close: `See Akademate on your academy.`

**ES**

- Eyebrow: `Operación de academias`
- H1: `Toda la academia, en un solo sistema.`
- Sub: `Matrículas, docencia, cobros y multi-sede. Un expediente para cada rol.`
- Primary: `Pedir una demo`
- Secondary: `Ver el producto`
- Act 1: `Del interés a la plaza confirmada.`
- Act 2: `Todas las sedes, una sola foto.`
- Act 3: `Impartir, cobrar y ver qué funciona.`
- Close: `Mira Akademate en tu academia.`

---

## 5. Criterios de aceptación (para el PR de implementación)

- [ ] Base = código del sitio publicado, no el coming soon de `main`
- [ ] Home ≤ 8 secciones y ≤ 800 palabras EN/ES
- [ ] Producto visible above the fold
- [ ] 3 actos, no 8 pilares
- [ ] Cero coming soon / sellos no certificados / reseñas de alumnos CEP
- [ ] Nav primaria ≤ 5 items + CTA demo
- [ ] ES sin leftovers EN
- [ ] Features deja de ser un clon del home
- [ ] Tests de home/i18n actualizados
- [ ] El diff se puede revisar en una pasada (home + chrome + copy)
