# Akademate.com — Plan de implementación: home como landing de ventas enterprise

**Fecha:** 2026-08-21
**Estado:** Listo para implementar (no implementado)
**Auditoría previa:** [`2026-08-21-akademate-com-communication-audit.md`](./2026-08-21-akademate-com-communication-audit.md)
**Alcance:** `apps/web` (akademate.com) únicamente
**Base obligatoria:** `origin/codex/akademate-public-es-verticals` @ `522f94e2`
**Objetivo:** home EN/ES ≤ 800 palabras de copy, ≤ 8 secciones, producto visible, un CTA. Sin roadmap, sin sellos no certificados, sin reseñas ajenas.

---

## 1. Antes de tocar nada: 6 hechos verificados

Estos seis puntos son la diferencia entre un PR que entra y uno que se queda bloqueado. Todos verificados sobre el árbol real.

### 1.1 El sitio publicado no está en `main`

`origin/main:apps/web/app/page.tsx` es un **coming soon con waitlist** (`ComingSoonPage`, 165 líneas). El home publicado en akademate.com vive en `origin/codex/akademate-public-es-verticals`, commit `522f94e2` (`feat(web): add claim-safe finance connector showcase`, 2026-08-10). Ese commit **no es ancestro de `main`**.

```bash
git merge-base --is-ancestor 522f94e2 origin/main   # falla: no es ancestro
```

Empieza así:

```bash
git fetch origin codex/akademate-public-es-verticals
git checkout -b cursor/home-enterprise-landing-<sufijo> 522f94e2
```

Si trabajas sobre `main` sin restaurar ese árbol, estarás editando el coming soon. Los componentes `apps/web/components/marketing/*`, `lib/i18n/dictionaries.ts` y `lib/marketing-content.ts` **no existen en `main`**.

### 1.2 `marketingText` lanza excepción si falta la traducción

```ts
export function marketingText(locale: Locale, source: string): string {
  if (locale !== 'es') return source
  const translated = spanishMarketingCopy[source as SpanishMarketingSource]
  if (!translated) throw new Error(`Missing Spanish marketing copy: ${source}`)
  return translated
}
```

Cualquier string nuevo pasado por `tx()` sin entrada en `spanishMarketingCopy` **revienta el render de `/es`** (error 500, no fallback). Consecuencia práctica: **prefiere reutilizar claves ya traducidas** antes que inventar copy nuevo. Cada string nuevo = una entrada obligatoria en `apps/web/lib/i18n/marketing-copy.ts`.

### 1.3 La suite e2e protege el bloat

`apps/web/e2e/home-page.spec.ts` **exige en el home** los mismos bloques que hay que quitar: 8 pilares, MCP con los 4 clientes de IA, campus físico, reseñas de CEP, 5 sellos de governance, apps y distribución web. No es una suite que "haya que arreglar de paso": es la barrera principal del trabajo. Matriz completa en §6.

### 1.4 El footer enlaza a `/#reservations`

```ts
{ name: dictionary.footer.reservations, href: '/#reservations' },
```

El home **debe conservar un elemento con `id="reservations"`**, o el test `all internal links on commercial pages resolve without dead routes or fragments` falla al comprobar el fragmento. Solución natural: el acto 1 (Fill) hereda `id="reservations"`.

### 1.5 Hay dos suites e2e y una está obsoleta

| Suite | Config | Estado |
|---|---|---|
| `apps/web/e2e/home-page.spec.ts`, `i18n-parity.spec.ts` | `apps/web/playwright.config.ts` | Vigente. Es la que hay que migrar. |
| `e2e/web/homepage.spec.ts`, `e2e/web/comprehensive.spec.ts` | raíz, `--project=web-chromium` | **Ya obsoleta contra producción**: espera `h1` con "Akademate" y un teléfono de 9 dígitos en el footer. El home real tiene `h1` = "Run your academy. Grow." y el footer no tiene teléfono. |

No persigas la suite obsoleta en este PR. Documenta que ya fallaba antes de tu cambio.

### 1.6 Registries que deben seguir traducidos aunque salgan del home

`apps/web/lib/i18n/marketing-copy.test.ts` recorre `operatingJourney`, `distributionModes`, `platformPillars`, `roadmapModules` e `integrationPillars` y exige traducción ES de cada string. Esos arrays **se quedan** en `marketing-content.ts` y los consume `/features`. **No borres entradas de `spanishMarketingCopy` que sigan referenciadas por ellos.** Desmontar del home ≠ borrar del repo.

---

## 2. Inventario del home actual con números de línea

`apps/web/app/page.tsx` @ `522f94e2` — 452 líneas, 20 bloques, 17 H2.

| Líneas | Bloque | Componente / fuente | Destino |
|---|---|---|---|
| 1–30 | imports | 17 componentes de marketing | Reducir a los reutilizados |
| 31–49 | `generateMetadata` | `publicPageMetadata` | Actualizar title/description |
| 51–80 | preparación de datos | `journey`, `distribution`, `homePillars`, `homePlans`, posts | Recortar a planes |
| 82–109 | **Hero** | `ProductHeroCarousel` | **Conservar**, copy nuevo |
| 111 | Client marquee | `ClientMarquee` | Conservar como franja de prueba |
| 112 | Trust signals | `TrustSignals` | Conservar comprimido o fusionar con marquee |
| 114 | Operations story | `AcademyOperationsStory` | **Conservar** → acto 2 |
| 116 | Roles/experiences | `ConnectedExperiences` | Conservar comprimido → acto 3, o `/features` |
| 118–144 | Learner journey 01–06 | `operatingJourney` | `/features` |
| 146–199 | **8 platform pillars** | `platformPillars`, `data-testid="visual-platform-pillars"` | `/features` |
| 201 | Campus físico QR/NFC/signage | `PhysicalCampusStory` | `/features` |
| 203 | MCP / IA | `HomeMcpConnect` | `/features#mcp-agentic-operations` |
| 205–234 | Distribución web (4 modos) | `WebsiteDistributionPreview` + `distributionModes` | Tab del acto 1 o `/features` |
| 236–271 | Página de curso + 7 chips | `CourseRegistrationPreview`, `id="reservations"` | **Conservar** → acto 1 (mantener el `id`) |
| 273–297 | Logos de integraciones | `ConnectorLogos` | Franja silenciosa bajo acto 3 |
| 299 | Finanzas coming soon | `FinanceConnectorShowcase` | `/pricing` o `/features` |
| 301 | Reseñas de alumnos CEP | `CustomerVoices` | Recast como caso, o fuera |
| 303 | Apps Mac/iPhone/iPad | `AppDownloadShowcase` | `/download` |
| 305–317 | 8 verticales en carousel | `SolutionCarousel`, `id="solutions"` | Chips → `/solutions` |
| 319–375 | 3 planes + features | `getPricingContent` | **Conservar** minimizado, `id="pricing"` |
| 377 | 5 marcos de governance | `GovernanceFrameworks` | `/sobre-nosotros` o `/features` |
| 379–428 | Insights + news | `getInsightPosts`, `getNewsPosts` | Footer / `/blog` |
| 430–447 | **CTA de cierre** | sección propia | **Conservar** |

Densidad medida en producción (texto visible del HTML):

| Página | Palabras |
|---|---|
| `/en` | 4.163 |
| `/es` | 4.575 |
| `/en/features` | 3.397 |
| `/en/pricing` | 9.358 |
| `/es/pricing` | 10.340 |

---

## 3. Arquitectura objetivo: 8 secciones

Orden final. Nada más entra en el home.

### S1 — Hero (conservar estructura, líneas 82–109)

- `dictionary.home.eyebrow` / `.title` / `.description` / `.primaryCta` / `.secondaryCta`
- Visual: `ProductHeroCarousel` sin cambios
- Secundario apunta a `/features`
- Presupuesto: ≤ 35 palabras (eyebrow + H1 + subtítulo)
- Fuera: los 6 chips de features bajo el H1 si existieran

### S2 — Prueba, una franja

- `ClientMarquee` + `TrustSignals` fusionados en **una** franja visual
- Sin H2 propio. Sin párrafo.
- `ClientMarquee` debe seguir conteniendo el string `Built around every academy model` porque `public-cro-quality.test.ts` lo lee del archivo del componente
- Si se añade el caso CEP: claim de **software** ("CEP Formación opera oferta, captación y campus sobre Akademate"), enlazando a su web pública. Nunca reseñas de alumnos.
- Presupuesto: ≤ 30 palabras

### S3 — Acto 1: Fill · `id="reservations"` (obligatorio)

- Eyebrow + H2 + 1 frase
- Visual: `CourseRegistrationPreview`
- Opcional: `WebsiteDistributionPreview` como **tab dentro de este acto**, no sección aparte
- Fuera: los 7 chips (`Shareable URL`, `Social preview`, `Login options`, `Capacity`, `Waitlist`, `Payments`, `Consent`)
- Presupuesto: ≤ 45 palabras

### S4 — Acto 2: Run

- Eyebrow + H2 + 1 frase
- Visual: `AcademyOperationsStory` (conserva `data-testid="academy-operations-story"`)
- Presupuesto: ≤ 45 palabras

### S5 — Acto 3: Teach & collect

- Eyebrow + H2 + 1 frase
- Visual: `ConnectedExperiences` comprimido (tabs de roles) **o** un solo frame de campus/cobros
- Debajo: `ConnectorLogos` como franja silenciosa, sin H2 y sin etiquetas "coming soon" / "connector-ready"
- Presupuesto: ≤ 45 palabras

### S6 — Para quién, una fila

- H2 + chips de 4–6 verticales → `/solutions/[slug]`
- Reutiliza `verticals` de `marketing-content.ts` y `getLocalizedVertical`
- Fuera: `SolutionCarousel` con párrafos y controles
- Conservar `id="solutions"` solo si algo lo enlaza
- Presupuesto: ≤ 40 palabras

### S7 — Planes · `id="pricing"`

- H2 + 3 cards: nombre, 1 línea, CTA
- Origen: `getPricingContent(locale).page.cards`, **sin** `plan.features.slice(0, 4)`
- Enlace final a `/pricing`
- Presupuesto: ≤ 60 palabras

### S8 — Cierre

- H2 + 1 frase + `Book a demo` → `/contacto?asunto=demo`
- Una línea de trust factual. `GDPR` y hosting en la UE son defendibles: la producción corre en Hetzner (ver `README.md`). **ISO 27001 / SOC 2 / OWASP no**: hoy son "governance references", no certificaciones.
- Presupuesto: ≤ 30 palabras

**Total objetivo: ≤ 330 palabras de copy propio.** El resto del presupuesto de 800 lo consumen los visuales de producto, planes y chips. Margen de sobra.

---

## 4. Cambios archivo por archivo

| Archivo | Acción | Detalle |
|---|---|---|
| `apps/web/app/page.tsx` | **Reescritura mayor** | 452 → ~200 líneas. 8 secciones. Quitar imports de `PhysicalCampusStory`, `HomeMcpConnect`, `AppDownloadShowcase`, `GovernanceFrameworks`, `FinanceConnectorShowcase`, `CustomerVoices`, `SolutionCarousel` (si se sustituye por chips). Quitar `journey`, `homePillars`, `insightPosts`, `newsPosts`. Actualizar `generateMetadata`. |
| `apps/web/lib/i18n/dictionaries.ts` | Editar bloque `home` | Nuevos `eyebrow`, `title`, `description`, `secondaryCta` en EN y ES. Ver §5. |
| `apps/web/lib/i18n/marketing-copy.ts` | Añadir entradas | Solo para strings nuevos. **No borrar** entradas usadas por `operatingJourney`, `distributionModes`, `platformPillars`, `roadmapModules`, `integrationPillars`. |
| `apps/web/lib/public-navigation.ts` | Recortar `publicNavigation` | De 7 a 4: `/features`, `/solutions`, `/pricing`, `/sobre-nosotros`. Blog, News y Download salen del nav primario. |
| `apps/web/components/layout/header.tsx` | Ajuste menor | Ya renderiza desde `publicNavigation`; `getNavigationLabel` puede conservar las claves sobrantes sin daño. Verificar que el menú móvil sigue operable por teclado. |
| `apps/web/components/layout/footer.tsx` | Ajuste | Blog / News / Download pasan a ser la vía de acceso. Mantener `/#reservations` **o** cambiarlo si el acto 1 usa otro `id` — pero entonces cambia el `id`, no dejes el enlace roto. |
| `apps/web/app/features/page.tsx` | Recibir lo desmontado | Alojar `platformPillars` (8 pilares), `PhysicalCampusStory`, `AppDownloadShowcase` si no va a `/download`, y el journey si se conserva. Intro ≤ 40 palabras. Que deje de clonar el home. |
| `apps/web/app/sobre-nosotros/page.tsx` | Recibir governance | `GovernanceFrameworks` aterriza aquí (o en `/features`). El componente **no se borra**: `public-cro-quality.test.ts` lo lee. |
| `apps/web/e2e/home-page.spec.ts` | **Migración de tests** | Ver §6. |
| `apps/web/e2e/i18n-parity.spec.ts` | Migración de tests | Ver §6. |

**No tocar:** `apps/tenant-admin`, `apps/payload`, `apps/campus`, `packages/*`, webs de tenant (CEP), `lib/pricing-content.ts` (la matriz de `/pricing` es otro trabajo).

---

## 5. Especificación de copy

### 5.1 `dictionaries.ts` → bloque `home`

**EN**

```ts
home: {
  eyebrow: 'Academy operations platform',
  title: 'Run the whole academy in one system.',
  description:
    'Enrolment, teaching, payments and multi-site operations — one record for every role.',
  primaryCta: 'Book a demo',
  secondaryCta: 'See the product',
},
```

**ES**

```ts
home: {
  eyebrow: 'Plataforma de gestión para academias',
  title: 'Toda la academia, en un solo sistema.',
  description:
    'Matrículas, docencia, cobros y multisede. Un expediente para cada rol.',
  primaryCta: 'Reservar una demo',
  secondaryCta: 'Ver el producto',
},
```

> **Coherencia del CTA:** el ES del CTA de demo aparece en cuatro sitios — `header.bookDemo`, `home.primaryCta`, `features.primaryCta`, `pricing.primaryCta` — y además en `marketing-copy` como `'Book a demo' → 'Reservar una demo'` (lo usa el cierre vía `tx`). Si cambias el texto ES, cámbialo en **los cinco**. Lo más barato es conservar `Reservar una demo`.

### 5.2 Copy de los actos

Estos strings pasan por `tx()`. Cada uno **necesita** su entrada ES en `marketing-copy.ts` o `/es` devuelve 500.

| Sección | EN (clave source) | ES (entrada a añadir) |
|---|---|---|
| S3 eyebrow | `Fill every course` | `Llena cada curso` |
| S3 H2 | `Turn interest into a confirmed place.` | *ya existe* — reutilizar |
| S3 texto | `Publish an offer, take the booking and collect the payment.` | `Publica la oferta, recibe la reserva y cobra.` |
| S4 eyebrow | `Run every site` | `Gestiona todas las sedes` |
| S4 H2 | `One live view of the whole academy.` | `Una vista en directo de toda la academia.` |
| S4 texto | `Learners, timetables, sites and attendance in one place.` | `Alumnado, horarios, sedes y asistencia en un mismo lugar.` |
| S5 eyebrow | `Teach and collect` | `Imparte y cobra` |
| S5 H2 | `Campus and payments on one record.` | `Campus y cobros en un mismo expediente.` |
| S5 texto | `Give teachers and learners one workspace. Keep every payment tracked.` | `Un espacio para docentes y alumnado. Cada cobro, controlado.` |
| S6 H2 | `Built around your academy model.` | *ya existe* — reutilizar |
| S7 H2 | `Choose the operating scope you need.` | *ya existe* — reutilizar |
| S7 enlace | `Compare plans` | *ya existe* — reutilizar |
| S8 H2 | `Build the academy people want to join.` | *ya existe* — reutilizar |
| S8 CTA | `Book a demo` | *ya existe* — reutilizar |

**Antes de añadir una entrada, busca la clave**: muchas ya están traducidas y duplicar valores rompe el test `contains non-empty unique Spanish values` (exige valores ES únicos).

```bash
rg -n "'Turn interest into a confirmed place\.'" apps/web/lib/i18n/marketing-copy.ts
```

### 5.3 Reglas de estilo

- `connected` / `conectada`: ≤ 2 apariciones en todo el home
- `operating system` / `sistema operativo`: ≤ 1
- Prohibido `clarity` / `claridad` como titular
- Prohibido `coming soon` en el home
- Cada `<p>`, `<h1>`, `<h2>`, `<h3>` debe caber en **≤ 2 líneas renderizadas** a 390px y 1440px — el test `commercial copy stays within a two-line visual budget` lo mide con umbral 2.15. Es tu aliado: si un párrafo se pasa, es que sobra texto.
- ES nativo, no calco. Corregir los leftovers detectados en producción: `12–13 September`, `Your finance provider`, quotes en inglés dentro de `/es`.

---

## 6. Migración de tests

Sin esto el PR no pasa. Referencias a `522f94e2`.

### 6.1 `apps/web/e2e/home-page.spec.ts`

**Test `communicates a growth outcome, real proof and clear conversion` (L4–67) — reescribir**

| Líneas | Aserción | Acción |
|---|---|---|
| 6 | `h1` = `Run your academy. Grow.` | Actualizar al nuevo H1 |
| 7 | link `Book a demo` visible | Conservar |
| 9–12 | heading `One workspace for every role.` | Quitar del home; comprobar en `/features` |
| 13–17 | tablist `Akademate experiences` + tab `Teachers` | Conservar solo si `ConnectedExperiences` se queda en S5; si no, mover a `/features` |
| 18–23 | `academy-operations-story` + `Active learners` + `Academy overview` | **Conservar** (S4) |
| 27–29 | `visual-platform-pillars`: 8 `article`, 8 `img` | **Mover a `/features`** |
| 30–33 | `connected-campus-story` | Mover a `/features` |
| 34–41 | `home-mcp-connect` + ChatGPT/Claude/Grok/Gemini | Mover a `/features#mcp-agentic-operations` |
| 42–44 | `Built around every academy model` + verticales | Conservar (S2/S6) |
| 45–49 | región `Akademate trust signals` | Conservar adaptado (S2) |
| 50–55 | `Let every academy voice be heard.` + reseña CEP | **Eliminar del home** |
| 56–59 | headings `Launch` / `Business` / `Enterprise` | Conservar (S7) |
| 60 | heading `Payments and finance` (pilar) | Eliminar del home |
| 61–62 | `banner` con links `Blog` y `News` | **Cambiar**: ya no están en el nav primario |
| 63–64 | `contentinfo` con `Blog` y `News` | Conservar (siguen en el footer) |
| 65–66 | links sociales | Conservar |

**Test `serves persistent English and Spanish routes` (L69–103)** — actualizar H1 en L76 (ES) y L91 (EN). El resto (cookie de locale, 200 en rutas, `/api/health`) no cambia.

**Test `renders distinct web distribution modes and a complete shareable course journey` (L230–273)** — el tablist `Website distribution options` deja de estar en el home salvo que lo integres como tab de S3. Decide y ajusta. Las aserciones de `#reservations` (L255–272: URL del curso, plazas, avatares, diálogo `Share course`) **se conservan**, y por eso el `id="reservations"` es obligatorio.

**Test `runs slow accessible carousels with manual control and complete card borders` (L275–323)** — región `Academy models` con 8 `Explore solution` y 8 botones desaparece si S6 pasa a chips: reescribir. Las aserciones de bordes de las cards de distribución (L313–322) se eliminan con la sección. El marquee (L282–295, duraciones `[132, 148]`) se conserva si S2 mantiene `ClientMarquee`.

**Test `commercial copy stays within a two-line visual budget` (L377–428)** — **no tocar.** Debe seguir verde.

**Test `legal routes and visual governance marks resolve without unsupported claims` (L430–470)** — L433–439 y L454–455 comprueban en `/` el texto de frameworks, 5 `framework mark` y las imágenes GDPR / EU AI Act. Mover esas aserciones a la página que reciba `GovernanceFrameworks`. Conservar L456 (`not.toContainText(/certified|official seal|approved by/i)`) y el recorrido de rutas legales.

**Test `loads every marketing image when its card enters the viewport` (L538–563)** — L544 exige ≥ 10 imágenes visibles en el home móvil. Al recortar bajará. Cuenta las reales y ajusta el umbral con honestidad; no infles el home para satisfacer el test.

**Test `all internal links on commercial pages resolve` (L565–595)** — comprueba fragmentos. Repasa que cada `#ancla` enlazada (`/#reservations` del footer, y `#solutions` / `#pricing` si algo los usa) exista en el home final.

### 6.2 `apps/web/e2e/i18n-parity.spec.ts`

**`Spanish conversion surfaces do not fall back to English controls` (L85–122)** — la lista `forbidden` de `/es` (L89–100) incluye centinelas de secciones que se van: `One workspace for every role.`, `Publish your way`, `Example public course page`, `Seasonal and cohort-ready`, `Connector-ready`, `The academy command centre`, `See the whole academy.`, `Explore every module`, `Compare plans`. Sustitúyelos por centinelas del home nuevo y traslada los que sigan vivos a la comprobación de la página que los aloje. Un centinela que ya no puede aparecer no prueba nada.

**`desktop previews respond to pointer hover while preserving tab semantics` (L124–149)** — exige **tres** tablists en `/en`: `Akademate experiences`, `Website distribution options`, `Future Akademate applications`. Las dos últimas salen del home. Mueve esas comprobaciones a `/features` y `/download`.

**Bucle de paridad (L36–83)** — canonical, hreflang y ausencia de enlaces sin prefijo de locale. **No tocar**; debe seguir verde.

**`all 23 Spanish feature modules preview on hover` (L151–174)** — vive en `/es/features`. No la rompas al reorganizar Features: el tablist debe seguir teniendo 23 tabs y sin scroll vertical interno.

### 6.3 Tests unitarios (vitest)

| Archivo | Riesgo |
|---|---|
| `lib/public-cro-quality.test.ts` | Lee `app/page.tsx` (necesita `<h1` y `<section`), `ClientMarquee.tsx` (string `Built around every academy model`) y `GovernanceFrameworks.tsx` (string `Governance reference`). **No borres esos componentes**, solo desmóntalos del home. |
| `lib/i18n/marketing-copy.test.ts` | Exige traducción ES de todos los strings de `operatingJourney`, `distributionModes`, `platformPillars`, `roadmapModules`, `integrationPillars`, y valores ES **únicos**. |
| `lib/home-experience-i18n.test.ts`, `lib/marketing-content.test.ts`, `lib/secondary-public-content.test.ts`, `lib/public-spanish-vertical-surfaces.test.ts`, `lib/public-surface-security.test.ts` | Ejecutar y revisar; algunos leen contenido del home. |

### 6.4 Suite obsoleta de la raíz

`e2e/web/comprehensive.spec.ts` espera `h1` con "Akademate" (L28–29) y un teléfono de 9 dígitos en el footer (L74–79). Ninguna de las dos cosas existe en producción hoy. **Deuda previa, fuera de alcance.** Menciónalo en el PR para que nadie lo lea como una regresión tuya.

---

## 7. Verificación

```bash
# 1. Tipos y unitarios
pnpm --filter @akademate/web typecheck
pnpm --filter @akademate/web test

# 2. Build de producción
pnpm --filter @akademate/web build

# 3. E2E del home (config propio de apps/web)
pnpm --filter @akademate/web dev            # :3006
pnpm exec playwright test --config apps/web/playwright.config.ts

# 4. Lint y formato del repo
pnpm lint
pnpm format
```

**Presupuesto de palabras**, con el servidor levantado:

```bash
for url in http://localhost:3006/en http://localhost:3006/es; do
  words=$(curl -sL "$url" | python3 -c "import sys,re; h=sys.stdin.read(); print(len(re.sub('<[^>]+>',' ',h).split()))")
  echo "$words  $url"
done
```

Referencia: 4.163 (EN) y 4.575 (ES) antes del cambio. El conteo incluye nav, footer y legal, así que el objetivo de "≤ 800 de copy de marketing" se traduce en un total razonable de **≈ 1.100–1.400**. Si sigues por encima de 2.000, no has recortado: has reordenado.

**Comprobación manual obligatoria**, EN y ES, a 390px y 1440px:

1. Un solo visual de producto domina el primer viewport
2. Cuenta las secciones: ≤ 8
3. Cuenta los H2: ≤ 6
4. Busca en la página `coming soon`, `ISO 27001`, `SOC 2`: cero resultados
5. `/es` sin una sola palabra en inglés
6. `/es` renderiza 200, no 500 (si sale 500, falta una entrada en `marketing-copy`)

---

## 8. Secuencia de commits

Un commit por cambio lógico. El PR debe poder revisarse de una pasada.

1. `feat(web): reduce home to eight selling sections` — `app/page.tsx`
2. `feat(web): rewrite home hero and act copy` — `dictionaries.ts`, `marketing-copy.ts`
3. `refactor(web): move platform catalogue off the home` — `features/page.tsx`, `sobre-nosotros/page.tsx`
4. `refactor(web): shorten primary navigation` — `public-navigation.ts`, `header.tsx`, `footer.tsx`
5. `test(web): align home e2e with the sales landing` — ambos spec

En el PR indica: base `522f94e2` (no `main`), motivo, y que `e2e/web/comprehensive.spec.ts` ya fallaba antes.

---

## 9. Riesgos

| Riesgo | Señal | Mitigación |
|---|---|---|
| Editar el coming soon de `main` | No existe `components/marketing/` | Verificar `git log -1 --format=%h` = `522f94e2` o descendiente |
| `/es` responde 500 | `Missing Spanish marketing copy: X` | Añadir la entrada, o reutilizar una clave ya traducida |
| Valor ES duplicado | Falla `contains non-empty unique Spanish values` | Cada valor ES debe ser único en el registry |
| Fragmento roto | Falla el test de enlaces internos | Conservar `id="reservations"` (footer lo enlaza) |
| Borrar componentes en vez de desmontarlos | Falla `public-cro-quality.test.ts` | Los componentes siguen en el repo; solo cambian de página |
| Test que exige el bloat | Falla `visual-platform-pillars` con 8 artículos | Mover la aserción a `/features`, no restaurar la sección |
| Umbral de imágenes | Falla `expect(count).toBeGreaterThanOrEqual(10)` | Recontar y bajar el umbral; no añadir imágenes de relleno |
| Recorte cosmético | Total sigue > 2.000 palabras | Volver a §3 y quitar secciones enteras, no frases |
| Claims inventados | `certified`, métricas nuevas | Solo GDPR y hosting UE (Hetzner, ver `README.md`) |

---

## 10. Definition of Done

- [ ] Base = `522f94e2` (o descendiente), no `main`
- [ ] Home ≤ 8 secciones y ≤ 6 H2 en EN y ES
- [ ] Copy de marketing del home ≤ 800 palabras por idioma
- [ ] Ningún `<p>`/`<h*>` supera 2 líneas renderizadas a 390px y 1440px
- [ ] Un visual de producto dominante above the fold
- [ ] Cero `coming soon`; cero ISO 27001 / SOC 2 / OWASP en el home
- [ ] Cero reseñas de alumnos de CEP como prueba social del SaaS
- [ ] 3 actos de producto; los 8 pilares viven en `/features`
- [ ] `id="reservations"` presente (o el enlace del footer actualizado)
- [ ] Nav primaria ≤ 4 ítems + CTA de demo
- [ ] `/es` sin leftovers en inglés y con 200 en todas las rutas
- [ ] `pnpm --filter @akademate/web typecheck`, `test` y `build` en verde
- [ ] `apps/web/e2e/home-page.spec.ts` e `i18n-parity.spec.ts` migrados y en verde
- [ ] `pnpm lint` y `pnpm format` en verde
- [ ] Diff limitado a home, chrome, copy, Features/Company y tests
