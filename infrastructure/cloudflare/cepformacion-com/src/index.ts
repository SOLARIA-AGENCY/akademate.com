import type { CatalogSnapshot } from './render'
import {
  applyOvhHomeCatalog,
  bindSedeRunsToCourses,
  catalogFromOriginHtml,
  catalogHasHomeCourses,
  coalesceCatalog,
  convocatoriasFromSedeHtml,
  coursesFromOriginHtml,
  mergeConvocatorias,
} from './catalog-from-html'
import { replaceHomeCourseCatalog } from './home-courses'
import { campusLandingHtml, campusShellPath, embedCampusInSite, isCampusPath, rewriteCampusNav } from './campus'
import { rewriteBolsaNav } from './bolsa-nav'
import { rewriteEmpleoPage } from './empleo-page'
import { rewriteColaboraLinks } from './colabora'
import { rewriteMobileNav } from './mobile-nav'
import { isCertificationAssetPath, isPartnerAssetPath } from './partners'
import { isEmpleoAssetPath } from './empleo-image'
import { isIdiomasAssetPath, rewriteIdiomasPhoto } from './idiomas-photo'
import { isCourseHeroAssetPath, rewriteCourseHeroes } from './course-heroes'
import { isUnpublishedRunCode, stripUnpublishedRunLinks } from './unpublished-runs'
import { rewriteHeaderBundle, rewriteHeaderScriptSrc } from './header-bundle'
import { rewritePartnersBanner } from './partners-banner'
import { rewriteChromeNav } from './chrome-nav'
import { rewriteWhatsAppMenu } from './whatsapp-menu'
import { rewriteTeachersCarousel } from './teachers-carousel'
import { rewriteAntiSlop } from './anti-slop'
import { rewritePublicCards } from './public-cards'
import { rewriteCycleCatalog, rewriteHomeCycles } from './cycle-catalog'
import { rewriteCourseCatalog, omitIdleHomeCatalogLock } from './course-catalog'
import { replaceActiveConvocatorias } from './active-convocatorias'
import { rewriteAboutPage } from './about-page'
import { faviconIcoBytes } from './favicon'
import { injectGoogleTag } from './google-tag'
import { hideTestCycles, isHiddenPublicCyclePath } from './hidden-cycles'
import { brightenSedeHero, isSedeAssetPath, keepSedesCards, rewriteCampusPhotos } from './campus-photo'
import { liftSedePaths, liftSedeRequestPath } from './sede-path'
import { isTransparencyHub, isTransparencyPortalPath, legalPageId, rewriteLegalPages, rewriteTransparencyAssets } from './legal-pages'
import { editorialPageId, isFounderAssetPath, rewriteEditorial } from './blog-editorial'
import { areaSlugFromPath, rewriteAreaPage } from './area-pages'
import { stripPublicLeadCopy } from './public-lead-copy'
import { rewriteSubsidyNotice } from './subsidy-notice'
import { extractProfessorPosition, fillInstructorTitles } from './instructor-title'
import { isSocialAssetPath, rewriteGoogleBusiness } from './gbp'
import { rewriteCampusWebsites } from './campus-web'
import {
  catalogHasIndexableEntities,
  legacyPublicRedirect,
  rewriteLegacyPublicLinks,
  rewritePublicSeo,
  sitemapEntriesFromSnapshot,
  sitemapXml,
} from './public-seo'
import {
  BRAND_ORIGIN,
  CANONICAL_ORIGIN,
  DASHBOARD_UPSTREAM,
  DATA_ORIGIN,
  OVH_ORIGIN,
  PUBLIC_APP_ORIGIN,
  canonicalOriginForHost,
  isBlockedSitePath,
  isOriginFormPath,
  previewSitePath,
  proxyPublicApp,
} from './proxy'
import { dashboardVisitorRedirect, isDashboardHostname, proxyDashboard } from './dashboard-proxy'

const PUBLIC_SITE_URL = `${BRAND_ORIGIN}/`
const LOGO_URL = `${BRAND_ORIGIN}/logos/cep-formacion-logo-rectangular.png`
const FAVICON_URL = `${BRAND_ORIGIN}/website/cep/logos/cep-circle-icon.svg`

type AnalyticsEngine = {
  writeDataPoint: (event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }) => void
}

export type WorkerEnv = {
  MODE?: string
  ORIGIN_API_URL?: string
  DASHBOARD_ORIGIN_URL?: string
  ORIGIN_SERVICE_TOKEN?: string
  PREVIEW_TOKEN?: string
  PURGE_HMAC?: string
  CEP_CACHE?: KVNamespace
  AE?: AnalyticsEngine
  ASSETS?: Fetcher
}

function comingSoonHtml(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="CEP Formación. Nueva web en preparación.">
    <meta name="theme-color" content="#fff8f9">
    <link rel="canonical" href="${CANONICAL_ORIGIN}/">
    <link rel="icon" href="${FAVICON_URL}" type="image/svg+xml">
    <title>CEP Formación | Próximamente</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root { color-scheme: light; --ink: #3E091A; --muted: #6f5d60; --pink: #f2014b; --line: #eadadd; --paper: #fffdfd; }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        margin: 0;
        background: radial-gradient(circle at 18% 16%, rgba(242, 1, 75, .08), transparent 28rem), linear-gradient(145deg, #fff8f9 0%, var(--paper) 52%, #fff 100%);
        color: var(--ink);
        font-family: Manrope, ui-sans-serif, sans-serif;
      }
      main { min-height: 100vh; display: grid; grid-template-rows: 1fr auto; padding: 2rem clamp(1.25rem, 4vw, 4rem) 1.25rem; }
      .shell { width: min(100%, 70rem); margin: auto; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(16rem, .9fr); gap: clamp(2rem, 7vw, 7rem); align-items: center; padding: clamp(2rem, 8vw, 7rem) 0; }
      .mark { width: clamp(4.5rem, 10vw, 7rem); height: clamp(4.5rem, 10vw, 7rem); object-fit: contain; margin-bottom: 2rem; }
      .quiet-access { position: fixed; top: 1.5rem; right: clamp(1.25rem, 4vw, 4rem); width: .5rem; height: .5rem; border-radius: 50%; background: var(--pink); opacity: .06; }
      .quiet-access:hover, .quiet-access:focus-visible { opacity: 1; transform: scale(1.35); }
      .quiet-access:focus-visible { outline: 3px solid rgba(242, 1, 75, .3); outline-offset: 4px; }
      .eyebrow { margin: 0 0 1rem; color: var(--pink); font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
      h1 { max-width: 12ch; margin: 0; font-size: clamp(3rem, 8vw, 7rem); line-height: .9; letter-spacing: -.07em; font-weight: 780; }
      .intro { max-width: 34rem; margin: 1.75rem 0 0; color: var(--muted); font-size: clamp(1.05rem, 1.5vw, 1.3rem); line-height: 1.55; }
      .signal { position: relative; width: min(100%, 26rem); aspect-ratio: 1; justify-self: end; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 50%; background: rgba(255, 255, 255, .68); overflow: hidden; }
      .signal-logo { position: relative; z-index: 1; width: 48%; height: 48%; object-fit: contain; }
      footer { width: min(100%, 70rem); margin: auto; padding-top: 1rem; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; gap: 1rem; color: var(--muted); font-size: .9rem; }
      .access { display: inline-flex; align-items: center; min-height: 2.75rem; padding: .7rem 1rem; border-radius: 999px; background: var(--ink); color: white; text-decoration: none; font-weight: 700; }
      @media (max-width: 700px) { .shell { grid-template-columns: 1fr; } .signal { justify-self: center; } footer { flex-direction: column; align-items: flex-start; } }
    </style>
  </head>
  <body>
    <a class="quiet-access" href="/preview" aria-label="Abrir vista previa de la web" title="Vista previa"></a>
    <main>
      <section class="shell" aria-labelledby="title">
        <div>
          <img class="mark" src="${LOGO_URL}" alt="CEP Formación">
          <p class="eyebrow">CEP Formación</p>
          <h1 id="title">Estamos preparando algo nuevo.</h1>
          <p class="intro">Nuestra nueva web estará disponible muy pronto. Mientras tanto, puedes consultar toda la oferta formativa en el sitio actual.</p>
        </div>
        <div class="signal"><img class="signal-logo" src="${LOGO_URL}" alt="CEP Formación"></div>
      </section>
      <footer>
        <p>Formación que abre caminos.</p>
        <a class="access" href="${PUBLIC_SITE_URL}">Acceder a la web <span aria-hidden="true">↗</span></a>
      </footer>
    </main>
  </body>
</html>`
}

function htmlResponse(body: string, extra?: HeadersInit, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'cache-control': 'public, max-age=60, stale-while-revalidate=600',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...extra,
    },
  })
}

function originBase(env: WorkerEnv): string {
  return (env.ORIGIN_API_URL || PUBLIC_APP_ORIGIN).replace(/\/$/, '')
}

async function loadProfessorPosition(env: WorkerEnv, href: string): Promise<string | null> {
  if (!href.startsWith('/p/profesores/')) return null
  try {
    const response = await fetch(`${originBase(env)}${href}`, {
      headers: { accept: 'text/html' },
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (!response.ok) return null
    return extractProfessorPosition(await response.text())
  } catch {
    return null
  }
}

function dashboardOrigin(env: WorkerEnv): string {
  return (env.DASHBOARD_ORIGIN_URL || DASHBOARD_UPSTREAM).replace(/\/$/, '')
}

function record(env: WorkerEnv, route: string, cacheStatus: string, status: number, latencyMs: number): void {
  try {
    env.AE?.writeDataPoint({
      blobs: [route, cacheStatus, String(status)],
      doubles: [latencyMs, status],
      indexes: [route],
    })
  } catch {
    // Analytics Engine is optional.
  }
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return mismatch === 0
}

async function readCachedCatalog(env: WorkerEnv, cache: Cache, cacheKey: Request): Promise<CatalogSnapshot | null> {
  const cached = await cache.match(cacheKey)
  if (cached) {
    try {
      return (await cached.clone().json()) as CatalogSnapshot
    } catch {
      // continue
    }
  }
  const fromKv = await env.CEP_CACHE?.get('catalog:last', 'json')
  return (fromKv as CatalogSnapshot | null) ?? null
}

async function fetchOriginCatalog(env: WorkerEnv): Promise<CatalogSnapshot> {
  const token = env.ORIGIN_SERVICE_TOKEN
  if (!token) throw new Error('missing origin token')
  const originCatalog = new URL(`${originBase(env)}/api/public/v1/catalog`)
  originCatalog.searchParams.set('host', 'cepformacion.akademate.com')
  const response = await fetch(originCatalog.toString(), {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
  })
  if (!response.ok) {
    const body = (await response.text()).replace(/\s+/g, ' ').slice(0, 70)
    throw new Error(`origin ${response.status} ${originCatalog.host} ${body}`)
  }
  const text = await response.text()
  try {
    return JSON.parse(text) as CatalogSnapshot
  } catch {
    throw new Error('origin json')
  }
}

async function fetchOriginHtml(env: WorkerEnv, path: string): Promise<string> {
  try {
    const response = await fetch(`${originBase(env)}${path}`, { headers: { accept: 'text/html' } })
    if (!response.ok) return ''
    return await response.text()
  } catch {
    return ''
  }
}

const SEDE_CATALOG_PAGES: Array<[string, string]> = [
  ['/p/sedes/sede-santa-cruz', 'CEP Santa Cruz'],
  ['/p/sedes/sede-norte', 'CEP Norte'],
  ['/p/sedes/cep-sur', 'CEP Sur'],
]

async function withSedeCatalogRuns(
  env: WorkerEnv,
  snapshot: CatalogSnapshot,
  courseHtml: string,
): Promise<CatalogSnapshot> {
  const pages = await Promise.all(
    SEDE_CATALOG_PAGES.map(async ([path, campus]) => {
      const html = await fetchOriginHtml(env, path)
      return html ? convocatoriasFromSedeHtml(html, campus) : []
    }),
  )
  return mergeConvocatorias(snapshot, bindSedeRunsToCourses(coursesFromOriginHtml(courseHtml), pages.flat()))
}

const OVH_HOME_LISTING_PATHS = [
  '/p/cursos?tipo=privados',
  '/p/cursos?tipo=desempleados',
  '/p/cursos?tipo=ocupados',
  '/p/cursos?tipo=teleformacion',
  '/p/convocatorias',
]

const OVH_SEDE_PAGES: Array<[string, string]> = [
  ['/p/sedes/sede-norte', 'Sede Norte'],
  ['/p/sedes/sede-santa-cruz', 'Sede Santa Cruz'],
  ['/p/sedes/cep-sur', 'CEP Sur'],
]

async function withOvhHomeRuns(env: WorkerEnv, snapshot: CatalogSnapshot | null): Promise<CatalogSnapshot | null> {
  const origin = dashboardOrigin(env)
  const load = async (path: string) => {
    try {
      const response = await fetch(`${origin}${path}`, { headers: { accept: 'text/html' } })
      if (!response.ok) return ''
      return await response.text()
    } catch {
      return ''
    }
  }
  const pages = await Promise.all(OVH_HOME_LISTING_PATHS.map((path) => load(path)))
  const sedePages = await Promise.all(
    OVH_SEDE_PAGES.map(async ([path, campus]) => [await load(path), campus] as const),
  )
  let next = applyOvhHomeCatalog(snapshot, pages)
  if (!next) return snapshot
  for (const [html, campus] of sedePages) {
    if (!html) continue
    next = mergeConvocatorias(next, convocatoriasFromSedeHtml(html, campus))
  }
  return next
}

async function withListingRuns(env: WorkerEnv, snapshot: CatalogSnapshot | null): Promise<CatalogSnapshot | null> {
  const pages = await Promise.all(
    ['/p/cursos?tipo=privados', '/p/cursos?tipo=desempleados', '/p/cursos?tipo=ocupados', '/p/convocatorias', '/'].map((path) =>
      fetchOriginHtml(env, path),
    ),
  )
  let merged = snapshot
  for (const page of pages) {
    if (!page) continue
    merged = coalesceCatalog(merged, catalogFromOriginHtml(page))
  }
  return merged
}

async function withAreaCatalog(env: WorkerEnv, snapshot: CatalogSnapshot | null): Promise<CatalogSnapshot | null> {
  let merged = await withListingRuns(env, snapshot)
  const pages = await Promise.all(['/p/ciclos', '/p/cursos?tipo=teleformacion'].map((path) => fetchOriginHtml(env, path)))
  for (const page of pages) {
    if (!page) continue
    merged = coalesceCatalog(merged, catalogFromOriginHtml(page))
  }
  return merged
}


function omitUnpublishedRuns(snapshot: CatalogSnapshot | null): CatalogSnapshot | null {
  if (!snapshot?.data?.convocatorias?.length) return snapshot
  const convocatorias = snapshot.data.convocatorias.filter((item) => !isUnpublishedRunCode(item.codigo))
  if (convocatorias.length === snapshot.data.convocatorias.length) return snapshot
  return { ...snapshot, data: { ...snapshot.data, convocatorias } }
}

async function loadCatalog(
  env: WorkerEnv,
  cache: Cache,
  cacheKey: Request,
  ctx: ExecutionContext,
  options: { allowStale?: boolean } = {},
): Promise<{ snapshot: CatalogSnapshot | null; cacheStatus: string }> {
  let snapshot = await readCachedCatalog(env, cache, cacheKey)
  let cacheStatus = snapshot ? 'hit' : 'miss'
  try {
    const fresh = await fetchOriginCatalog(env)
    snapshot = fresh
    cacheStatus = cacheStatus === 'hit' ? 'revalidated' : 'origin'
    ctx.waitUntil(
      Promise.all([
        cache.put(
          cacheKey,
          new Response(JSON.stringify(fresh), {
            headers: {
              'content-type': 'application/json',
              'cache-control': 'public, s-maxage=60, stale-while-revalidate=600',
            },
          }),
        ),
        env.CEP_CACHE?.put('catalog:last', JSON.stringify(fresh), { expirationTtl: 86400 }),
      ]),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 160) : 'fail'
    if (options.allowStale === false) {
      return { snapshot: null, cacheStatus: snapshot ? `stale-ignored:${message}` : `error:${message}` }
    }
    cacheStatus = snapshot ? `stale:${message}` : `error:${message}`
  }
  return { snapshot, cacheStatus }
}

async function hydrateCatalogFromListings(
  request: Request,
  snapshot: CatalogSnapshot | null,
  canonicalOrigin: string,
): Promise<CatalogSnapshot | null> {
  if (catalogHasIndexableEntities(snapshot)) return snapshot
  const paths = ['/p/cursos', '/p/ciclos', '/p/convocatorias', '/sedes']
  let merged = snapshot
  for (const pathname of paths) {
    try {
      const response = await proxyPublicApp(request, pathname, canonicalOrigin, {
        origin: PUBLIC_APP_ORIGIN,
      })
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || !contentType.includes('text/html')) continue
      merged = coalesceCatalog(merged, catalogFromOriginHtml(await response.text()))
    } catch {
      // Listing pages are optional for sitemap coverage.
    }
  }
  return merged
}

function llmsTxt(snapshot: CatalogSnapshot | null): string {
  const name = snapshot?.data.branding.academyName || 'CEP Formación'
  const courses = (snapshot?.data.courses || [])
    .slice(0, 80)
    .map((course) => `- [${course.nombre}](${CANONICAL_ORIGIN}/cursos/${course.slug})`)
    .join('\n')
  const cycles = (snapshot?.data.cycles || [])
    .map((cycle) => `- [${cycle.name}](${CANONICAL_ORIGIN}/ciclos/${cycle.slug})`)
    .join('\n')
  const convocatorias = (snapshot?.data.convocatorias || [])
    .slice(0, 40)
    .map((item) => `- [${item.codigo}](${CANONICAL_ORIGIN}/convocatorias/${item.codigo})`)
    .join('\n')
  return `# ${name}

Sitio público de formación en Santa Cruz de Tenerife, La Orotava y San Isidro.

- [Inicio](${CANONICAL_ORIGIN}/)
- [Sedes](${CANONICAL_ORIGIN}/sedes)
- [Cursos](${CANONICAL_ORIGIN}/cursos)
- [Convocatorias](${CANONICAL_ORIGIN}/convocatorias)
- [Contacto](${CANONICAL_ORIGIN}/contacto)
- [Privacidad](${CANONICAL_ORIGIN}/legal/privacidad)
- [Accesibilidad](${CANONICAL_ORIGIN}/legal/accesibilidad)

## Cursos
${courses || '- [Catálogo de cursos](https://cepformacion.com/cursos)'}

## Ciclos
${cycles || '- [Ciclos formativos](https://cepformacion.com/ciclos)'}

## Convocatorias
${convocatorias || '- [Convocatorias](https://cepformacion.com/convocatorias)'}
`
}

async function proxyOrigin(request: Request, env: WorkerEnv, pathname: string): Promise<Response> {
  return fetch(`${originBase(env)}${pathname}`, {
    method: request.method,
    headers: {
      'content-type': request.headers.get('content-type') || 'application/json',
      accept: request.headers.get('accept') || 'application/json',
    },
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  })
}

async function proxyLead(request: Request, env: WorkerEnv, pathname: string): Promise<Response> {
  const body = await request.arrayBuffer()
  const headers = {
    'content-type': request.headers.get('content-type') || 'application/json',
    accept: request.headers.get('accept') || 'application/json',
    'x-forwarded-host': 'cepformacion.akademate.com',
    'x-forwarded-proto': 'https',
  }
  const post = (origin: string, replicate: boolean) =>
    fetch(`${origin}${pathname}`, {
      method: 'POST',
      headers: replicate ? { ...headers, 'x-cep-replicate': '1' } : headers,
      body: body.slice(0),
    })
  const tag = (response: Response, lead: string) => {
    const next = new Headers(response.headers)
    next.set('x-cep-lead', lead)
    return new Response(response.body, { status: response.status, headers: next })
  }
  try {
    const primary = await post(OVH_ORIGIN, false)
    if (primary.ok) {
      await post(originBase(env), true).catch(() => undefined)
      return tag(primary, 'ovh')
    }
    if (primary.status < 500) return tag(primary, 'ovh')
  } catch {
    // OVH did not take the lead. Hetzner still records it and sends the mail.
  }
  return tag(await post(originBase(env), false), 'hetzner')
}

function rewriteConvocatoriaSummary(html: string): string {
  return html.replaceAll('class="relative z-10 -mt-8 ', 'class="relative z-10 mt-8 ')
}

function rewritePublicHtml(
  html: string,
  snapshot: CatalogSnapshot | null = null,
  pathname = '',
): string {
  const rewritten = rewriteHeaderScriptSrc(rewriteAntiSlop(rewriteConvocatoriaSummary(
    rewriteTeachersCarousel(
      rewriteAboutPage(
        rewriteCourseCatalog(
          rewritePublicCards(
            rewriteCourseHeroes(rewriteWhatsAppMenu(rewriteChromeNav(rewriteBolsaNav(rewriteColaboraLinks(rewriteMobileNav(rewriteCampusNav(html)))))), pathname),
            snapshot,
            pathname,
          ),
          snapshot,
        ),
      ),
    ),
  )))
  let next = rewriteCampusWebsites(
    rewriteGoogleBusiness(
      injectGoogleTag(hideTestCycles(brightenSedeHero(rewriteCampusPhotos(rewriteIdiomasPhoto(rewritten)), pathname))),
      pathname,
    ),
    pathname,
  )
  const path = pathname.replace(/\/+$/, '') || '/'
  next = rewriteEmpleoPage(next, pathname)
  if (path === '/') next = rewriteHomeCycles(next, snapshot)
  if (path === '/p/ciclos' || path === '/ciclos') next = rewriteCycleCatalog(next, snapshot)
  next = stripPublicLeadCopy(
    rewriteEditorial(
      rewriteSubsidyNotice(
        rewriteAudienceLabels(
          omitIdleHomeCatalogLock(
            liftSedePaths(rewriteLegacyPublicLinks(rewritePublicSeo(rewriteLegalPages(next, pathname), pathname))),
          ),
        ),
        pathname,
        snapshot,
      ),
      pathname,
    ),
  )
  return keepSedesCards(stripUnpublishedRunLinks(next), pathname)
}

function rewriteAudienceLabels(html: string): string {
  const keep = 'Cursos ocupados / desempleados'
  const token = '___CEP_WA_COURSES___'
  return html
    .replaceAll(keep, token)
    .replaceAll('Cursos para desempleados', 'Cursos para trabajadores/as desempleados/as')
    .replaceAll('Cursos para ocupados', 'Cursos para trabajadores/as ocupados/as')
    .replaceAll('Cursos desempleados', 'Cursos para trabajadores/as desempleados/as')
    .replaceAll('Cursos ocupados y desempleados', 'Cursos para trabajadores/as ocupados/as y trabajadores/as desempleados/as')
    .replaceAll('Cursos ocupados', 'Cursos para trabajadores/as ocupados/as')
    .replaceAll('formación para ocupados y desempleados', 'formación para trabajadores/as ocupados/as y trabajadores/as desempleados/as')
    .replaceAll('para desempleados y ocupados', 'para trabajadores/as desempleados/as y trabajadores/as ocupados/as')
    .replaceAll('para desempleados u ocupados', 'para trabajadores/as desempleados/as o trabajadores/as ocupados/as')
    .replaceAll('para desempleados o para ocupados', 'para trabajadores/as desempleados/as o para trabajadores/as ocupados/as')
    .replaceAll('>Desempleados<', '>Trabajadores/as desempleados/as<')
    .replaceAll('>Ocupados<', '>Trabajadores/as ocupados/as<')
    .replaceAll(token, keep)
}

function notFound(): Response {
  return htmlResponse(
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>No encontrado</title></head><body><h1>No encontrado</h1></body></html>',
    { 'cache-control': 'public, max-age=300' },
    404,
  )
}

const HTML_FRESH_MS = 60_000
const HTML_STALE_MS = 600_000
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'campaign_id',
  'meta_campaign_id',
])
const DISCOVERY_404 = new Set([
  '/agents.txt',
  '/humans.txt',
  '/ads.txt',
  '/app-ads.txt',
  '/manifest.webmanifest',
  '/.well-known/agent.json',
])

function trackingQueryOnly(url: URL): boolean {
  for (const key of url.searchParams.keys()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) return false
  }
  return true
}

function publicHtmlCacheable(request: Request, url: URL): boolean {
  if (request.method !== 'GET') return false
  if (request.headers.get('authorization')) return false
  if (!trackingQueryOnly(url)) return false
  const path = url.pathname
  if (
    path.startsWith('/api') ||
    path.startsWith('/_next') ||
    path.startsWith('/internal') ||
    path.startsWith('/campus') ||
    path.startsWith('/admin') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/auth')
  ) {
    return false
  }
  return true
}

function publicHtmlCacheKey(pathname: string): Request {
  const path = pathname.replace(/\/+$/, '') || '/'
  return new Request(`https://cepformacion.com/__cache/html${path}`)
}

function securityTxt(): string {
  return [
    'Contact: mailto:privacidad@cursostenerife.es',
    'Expires: 2027-09-23T22:00:00.000Z',
    'Preferred-Languages: es',
    'Canonical: https://cepformacion.com/.well-known/security.txt',
    'Policy: https://cepformacion.com/legal/privacidad',
    '',
  ].join('\n')
}

async function handleRequest(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const started = Date.now()
    const url = new URL(request.url)
    const cache = caches.default
    const cacheKey = new Request(`${CANONICAL_ORIGIN}/__cache/catalog`)
    const previewPath = previewSitePath(url.pathname)
    const mode = env.MODE || 'origin-html'
    const canonicalOrigin = canonicalOriginForHost(url.hostname, url.origin)
    const liftedSede = liftSedeRequestPath(url.pathname)
    const liftedPublic = legacyPublicRedirect(url.pathname)
    const lifted = liftedSede || liftedPublic
    const toApex = url.hostname === 'www.cepformacion.com'
    if ((request.method === 'GET' || request.method === 'HEAD') && !isDashboardHostname(url.hostname)) {
      if (isHiddenPublicCyclePath(url.pathname)) {
        record(env, url.pathname, 'blocked', 404, Date.now() - started)
        return notFound()
      }
      if (lifted || toApex || url.protocol === 'http:') {
        const dest = new URL(url.toString())
        dest.protocol = 'https:'
        dest.hostname = 'cepformacion.com'
        if (lifted) dest.pathname = lifted
        record(env, url.pathname, 'canonical-redirect', 301, Date.now() - started)
        return Response.redirect(dest.toString(), 301)
      }
    }

    if (isDashboardHostname(url.hostname)) {
      const visitorRedirect = dashboardVisitorRedirect(request)
      if (visitorRedirect) {
        record(env, url.pathname, 'dashboard-origin', visitorRedirect.status, Date.now() - started)
        return visitorRedirect
      }
      const response = await proxyDashboard(request, dashboardOrigin(env))
      record(env, url.pathname, 'dashboard-origin', response.status, Date.now() - started)
      return response
    }

    if (
      (isPartnerAssetPath(url.pathname) || isCertificationAssetPath(url.pathname) || isEmpleoAssetPath(url.pathname) || isIdiomasAssetPath(url.pathname) || isCourseHeroAssetPath(url.pathname) || isFounderAssetPath(url.pathname) || isSedeAssetPath(url.pathname) || isSocialAssetPath(url.pathname)) &&
      env.ASSETS
    ) {
      const asset = await env.ASSETS.fetch(request)
      if (asset.ok) {
        const headers = new Headers(asset.headers)
        headers.set('cache-control', 'public, max-age=86400, immutable')
        headers.set('x-content-type-options', 'nosniff')
        record(env, url.pathname, 'partner-asset', 200, Date.now() - started)
        return new Response(asset.body, { status: 200, headers })
      }
    }

    if (url.pathname === '/health') {
      const origin = originBase(env)
      const probe = await Promise.allSettled([
        fetch(`${origin}/api/health`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(4000) }),
        fetch(`${origin}/api/public/v1/health`, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(4000),
        }),
        fetch(PUBLIC_SITE_URL, { headers: { accept: 'text/html' }, signal: AbortSignal.timeout(8000) }),
      ])
      const appRes = probe[0].status === 'fulfilled' ? probe[0].value : null
      const publicRes = probe[1].status === 'fulfilled' ? probe[1].value : null
      const htmlRes = probe[2].status === 'fulfilled' ? probe[2].value : null
      let originRevision: string | null = null
      if (appRes?.ok) {
        try {
          const body = (await appRes.json()) as { revision?: string }
          originRevision = body.revision ?? null
        } catch {
          originRevision = null
        }
      }
      const publicHealth = publicRes?.status ?? 0
      let originCatalogStatus = 0
      let originCatalogBearerOnly = 0
      let originCatalogError: string | null = null
      const token = env.ORIGIN_SERVICE_TOKEN
      if (!token) {
        originCatalogStatus = -1
      } else {
        try {
          const catalogUrl = new URL(`${origin}/api/public/v1/catalog`)
          catalogUrl.searchParams.set('host', 'cepformacion.akademate.com')
          const catalogHeaders = {
            authorization: `Bearer ${token}`,
            accept: 'application/json',
            'x-forwarded-host': 'cepformacion.akademate.com',
          }
          const [withEdge, bearerOnly] = await Promise.all([
            fetch(catalogUrl.toString(), {
              headers: { ...catalogHeaders, 'x-cep-edge-fetch': token },
              signal: AbortSignal.timeout(8000),
            }),
            fetch(catalogUrl.toString(), {
              headers: catalogHeaders,
              signal: AbortSignal.timeout(8000),
            }),
          ])
          originCatalogStatus = withEdge.status
          originCatalogBearerOnly = bearerOnly.status
          if (!withEdge.ok) originCatalogError = (await withEdge.text()).slice(0, 240)
          else if (!bearerOnly.ok) originCatalogError = (await bearerOnly.text()).slice(0, 240)
        } catch {
          originCatalogStatus = 0
        }
      }
      record(env, '/health', 'local', 200, Date.now() - started)
      return Response.json(
        {
          status: 'healthy',
          mode,
          origin,
          publicApp: PUBLIC_APP_ORIGIN,
          dataOrigin: DATA_ORIGIN,
          originAppHealth: appRes?.status ?? 0,
          originRevision,
          originPublicHealth: publicHealth,
          publicAppHealth: htmlRes?.status ?? 0,
          originCatalogReady: publicHealth === 200,
          originCatalogStatus,
          originCatalogBearerOnly,
          originCatalogError,
          preview: 'origin-html',
        },
        { headers: { 'cache-control': 'no-store' } },
      )
    }

    if (url.pathname === '/favicon.ico') {
      record(env, '/favicon.ico', 'icon', 200, Date.now() - started)
      return new Response(faviconIcoBytes(), {
        headers: {
          'content-type': 'image/x-icon',
          'cache-control': 'public, max-age=86400',
        },
      })
    }

    if (url.pathname === '/robots.txt') {
      const body = `User-agent: *\nAllow: /\nDisallow: /preview\nDisallow: /internal\nDisallow: /api\nDisallow: /dashboard\nDisallow: /admin\nDisallow: /auth\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`
      return new Response(body, {
        headers: {
          'content-type': 'text/plain; charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      })
    }

    if (url.pathname === '/internal/purge' && request.method === 'POST') {
      const secret = env.PURGE_HMAC
      const raw = await request.text()
      const signature = (request.headers.get('x-webhook-signature') || '').replace(/^sha256=/, '')
      if (!secret || !signature) {
        return Response.json({ ok: false }, { status: 401 })
      }
      const expected = await hmacHex(secret, raw)
      if (!safeEqual(expected, signature)) return Response.json({ ok: false }, { status: 401 })
      const idempotency = request.headers.get('x-idempotency-key') || ''
      if (idempotency && env.CEP_CACHE) {
        const seen = await env.CEP_CACHE.get(`purge:${idempotency}`)
        if (seen) return Response.json({ ok: true, duplicate: true })
        await env.CEP_CACHE.put(`purge:${idempotency}`, '1', { expirationTtl: 86400 })
      }
      ctx.waitUntil(cache.delete(cacheKey))
      return Response.json({ ok: true })
    }

    if (url.pathname === '/.well-known/security.txt') {
      return new Response(securityTxt(), {
        headers: {
          'content-type': 'text/plain; charset=UTF-8',
          'cache-control': 'public, max-age=86400',
        },
      })
    }

    if (DISCOVERY_404.has(url.pathname)) {
      record(env, url.pathname, 'discovery-404', 404, Date.now() - started)
      return notFound()
    }

    if (isOriginFormPath(url.pathname)) {
      if (request.method === 'POST' && url.pathname === '/api/leads') {
        return proxyLead(request, env, url.pathname)
      }
      return proxyOrigin(request, env, url.pathname)
    }

    if (
      isBlockedSitePath(url.pathname) ||
      isHiddenPublicCyclePath(url.pathname) ||
      (previewPath !== null && (isBlockedSitePath(previewPath) || isHiddenPublicCyclePath(previewPath)))
    ) {
      record(env, url.pathname, 'blocked', 404, Date.now() - started)
      return notFound()
    }

    if (previewPath !== null) {
      const destination = new URL(previewPath + url.search, `${canonicalOrigin}/`)
      record(env, url.pathname, 'preview-redirect', 302, Date.now() - started)
      return Response.redirect(destination.toString(), 302)
    }

    if (url.pathname === '/sitemap.xml' || url.pathname === '/llms.txt') {
      const loaded = await loadCatalog(env, cache, cacheKey, ctx)
      const snapshot = await hydrateCatalogFromListings(request, loaded.snapshot, canonicalOrigin)
      if (url.pathname === '/sitemap.xml') {
        record(env, '/sitemap.xml', loaded.cacheStatus, 200, Date.now() - started)
        return new Response(sitemapXml(sitemapEntriesFromSnapshot(snapshot)), {
          headers: {
            'content-type': 'application/xml; charset=UTF-8',
            'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        })
      }
      record(env, '/llms.txt', loaded.cacheStatus, 200, Date.now() - started)
      return new Response(llmsTxt(snapshot), {
        headers: {
          'content-type': 'text/plain; charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      })
    }

    if (mode === 'coming-soon') {
      record(env, url.pathname, 'coming-soon', 200, Date.now() - started)
      return htmlResponse(comingSoonHtml(), { 'cache-control': 'public, max-age=300' })
    }

    if (isCampusPath(url.pathname)) {
      try {
        const response = await proxyPublicApp(request, campusShellPath(), canonicalOrigin, {
          origin: PUBLIC_APP_ORIGIN,
        })
        const contentType = response.headers.get('content-type') || ''
        if (response.ok && contentType.includes('text/html')) {
          const embedded = embedCampusInSite(await response.text(), LOGO_URL)
          if (embedded) {
            const html = rewritePublicHtml(embedded, null, url.pathname)
            const headers = new Headers(response.headers)
            headers.delete('content-length')
            headers.set('cache-control', 'private, no-cache, no-store, max-age=0, must-revalidate')
            record(env, url.pathname, 'campus-site', 200, Date.now() - started)
            return new Response(html, { status: 200, headers })
          }
        }
      } catch {
        /* Fallback to the standalone landing if origin chrome is unavailable. */
      }
      record(env, url.pathname, 'campus-landing', 200, Date.now() - started)
      return htmlResponse(campusLandingHtml(LOGO_URL, FAVICON_URL), { 'cache-control': 'public, max-age=60' })
    }

    if (isTransparencyPortalPath(url.pathname)) {
      try {
        const response = await proxyPublicApp(request, url.pathname, canonicalOrigin, {
          origin: OVH_ORIGIN,
        })
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('text/html')) {
          record(env, url.pathname, 'transparency-asset', response.status, Date.now() - started)
          return response
        }
        const html = rewriteTransparencyAssets(await response.text(), OVH_ORIGIN)
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        headers.set('cache-control', 'no-store')
        headers.set('x-cep-html-origin', new URL(OVH_ORIGIN).host)
        headers.set('x-cep-transparency', 'portal')
        record(env, url.pathname, 'transparency-portal', response.status, Date.now() - started)
        return new Response(html, { status: response.status, headers })
      } catch (error) {
        console.error('cep-transparency-origin', error)
        record(env, url.pathname, 'transparency-origin-error', 502, Date.now() - started)
        return htmlResponse(
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Transparencia</title></head><body><h1>Transparencia</h1><p>El portal no está disponible en este momento.</p></body></html>',
          { 'cache-control': 'no-store' },
          502,
        )
      }
    }

    try {
      const htmlKey = publicHtmlCacheKey(url.pathname)
      const bypassHtmlCache = request.headers.get('x-cep-refresh') === '1' || Boolean(legalPageId(url.pathname)) || isTransparencyHub(url.pathname) || Boolean(editorialPageId(url.pathname)) || Boolean(areaSlugFromPath(url.pathname))
      if (!bypassHtmlCache && publicHtmlCacheable(request, url)) {
        const hit = await cache.match(htmlKey)
        const cachedAt = Number(hit?.headers.get('x-cep-cached-at') || 0)
        const age = cachedAt ? Date.now() - cachedAt : Number.POSITIVE_INFINITY
        if (hit && age >= 0 && age < HTML_STALE_MS) {
          if (age >= HTML_FRESH_MS) {
            const refreshHeaders = new Headers(request.headers)
            refreshHeaders.set('x-cep-refresh', '1')
            ctx.waitUntil(
              handleRequest(new Request(request.url, { method: 'GET', headers: refreshHeaders }), env, ctx).then((res) =>
                res.arrayBuffer(),
              ),
            )
          }
          const headers = new Headers(hit.headers)
          headers.set('x-cep-cache', age < HTML_FRESH_MS ? 'hit' : 'stale')
          headers.set('cache-control', 'public, max-age=60, stale-while-revalidate=600')
          record(env, url.pathname, age < HTML_FRESH_MS ? 'html-hit' : 'html-stale', hit.status, Date.now() - started)
          return new Response(hit.body, { status: hit.status, headers })
        }
      }

      let response: Response
      try {
        response = await proxyPublicApp(request, url.pathname, canonicalOrigin, {
          origin: PUBLIC_APP_ORIGIN,
        })
        if (url.pathname.startsWith('/_next/static/') && response.status === 404) {
          response = await proxyPublicApp(request, url.pathname, canonicalOrigin, {
            origin: OVH_ORIGIN,
          })
        }
      } catch (error) {
        // /noticias on the tenant host 307s to /auth/login. That throw is the
        // dashboard capture, not a missing page. Editorial routes paint on the
        // public shell instead of returning 502.
        if (!editorialPageId(url.pathname) && !areaSlugFromPath(url.pathname) && !isTransparencyHub(url.pathname)) throw error
        response = await proxyPublicApp(request, areaSlugFromPath(url.pathname) ? '/cursos' : '/contacto', canonicalOrigin, {
          origin: PUBLIC_APP_ORIGIN,
        })
      }
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        let html = await response.text()
        let status = response.status
        if ((legalPageId(url.pathname) || isTransparencyHub(url.pathname) || editorialPageId(url.pathname) || areaSlugFromPath(url.pathname)) && (status !== 200 || !/<header\b/i.test(html) || !/<footer\b/i.test(html))) {
          try {
            const shell = await proxyPublicApp(request, '/contacto', canonicalOrigin, {
              origin: PUBLIC_APP_ORIGIN,
            })
            const shellType = shell.headers.get('content-type') || ''
            const shellHtml = shell.ok && shellType.includes('text/html') ? await shell.text() : ''
            if (/<header\b/i.test(shellHtml) && /<footer\b/i.test(shellHtml) && /<main\b/i.test(shellHtml)) {
              html = shellHtml
              status = 200
            }
          } catch {
            /* Keep the original response when the site shell is unavailable. */
          }
        }
        let snapshot: CatalogSnapshot | null = null
        let catalogNote = 'skip'
        const needsCatalog =
          url.pathname === '/' ||
          url.pathname.startsWith('/p/cursos') ||
          url.pathname.startsWith('/p/ciclos') ||
          url.pathname.startsWith('/p/convocatorias') ||
          url.pathname.startsWith('/cursos') ||
          url.pathname.startsWith('/ciclos') ||
          url.pathname.startsWith('/convocatorias') ||
          Boolean(areaSlugFromPath(url.pathname))
        if (needsCatalog) {
          const htmlCatalog = catalogFromOriginHtml(html)
          const loaded = await loadCatalog(env, cache, cacheKey, ctx, { allowStale: false })
          snapshot = coalesceCatalog(loaded.snapshot, htmlCatalog)
          snapshot = omitUnpublishedRuns(snapshot)
          const runCount = snapshot?.data.convocatorias?.length || 0
          catalogNote = `${loaded.cacheStatus};runs=${runCount}`
          if (url.pathname === '/') snapshot = await withOvhHomeRuns(env, snapshot)
          if (areaSlugFromPath(url.pathname)) snapshot = await withAreaCatalog(env, snapshot)
          const catalogPath = url.pathname.replace(/\/+$/, '') || '/'
          if (snapshot && (catalogPath === '/cursos' || catalogPath === '/p/cursos')) {
            snapshot = await withSedeCatalogRuns(env, snapshot, html)
            catalogNote = `${catalogNote};sede-runs=${snapshot.data.convocatorias?.length || 0}`
          }
          snapshot = omitUnpublishedRuns(snapshot)
          if (url.pathname === '/' && catalogHasHomeCourses(snapshot)) {
            html = replaceHomeCourseCatalog(html, snapshot)
          }
          record(
            env,
            url.pathname,
            loaded.snapshot ? `origin-html-${loaded.cacheStatus}` : 'origin-html-parsed',
            response.status,
            Date.now() - started,
          )
        } else {
          record(env, url.pathname, 'origin-html', response.status, Date.now() - started)
        }
        if (url.pathname === '/') html = rewritePartnersBanner(html)
        html = await fillInstructorTitles(html, (href) => loadProfessorPosition(env, href))
        html = rewritePublicHtml(html, snapshot, url.pathname)
        if (areaSlugFromPath(url.pathname)) html = rewriteAreaPage(html, snapshot, url.pathname)
        const barePath = url.pathname.replace(/\/+$/, '') || '/'
        if ((barePath === '/convocatorias' || barePath === '/p/convocatorias') && snapshot) {
          snapshot = omitUnpublishedRuns(await withListingRuns(env, snapshot))
          html = replaceActiveConvocatorias(html, snapshot)
          catalogNote = `${catalogNote};active-source=listings`
        }
        if ((legalPageId(url.pathname) || isTransparencyHub(url.pathname)) && html.includes('data-cep-legal-rendered=')) status = 200
        if (editorialPageId(url.pathname) && html.includes('data-cep-editorial-rendered=')) status = 200
        if (areaSlugFromPath(url.pathname) && html.includes('data-cep-area-rendered=')) status = 200
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        headers.set('x-cep-html-origin', new URL(PUBLIC_APP_ORIGIN).host)
        headers.set('x-cep-data-origin', DATA_ORIGIN)
        headers.set(
          'cache-control',
          legalPageId(url.pathname) || isTransparencyHub(url.pathname) ? 'no-store' : 'public, max-age=60, stale-while-revalidate=600',
        )
        headers.set('x-cep-cached-at', String(Date.now()))
        headers.set('x-cep-cache', 'miss')
        headers.set('x-cep-catalog', catalogNote)
        if (
          status === 200 &&
          publicHtmlCacheable(request, url) &&
          !legalPageId(url.pathname) &&
          !isTransparencyHub(url.pathname) &&
          !response.headers.get('set-cookie')
        ) {
          const storedHeaders = new Headers(headers)
          storedHeaders.set('cache-control', 'public, max-age=600')
          ctx.waitUntil(cache.put(htmlKey, new Response(html, { status, headers: storedHeaders })))
        }
        return new Response(html, { status, headers })
      }
      if (
        contentType.includes('javascript') ||
        contentType.includes('text') ||
        contentType.includes('json')
      ) {
        const source = await response.text()
        let rewritten = source
        if (url.pathname.includes('/app/(public)/layout-') && contentType.includes('javascript')) {
          rewritten = rewriteHeaderBundle(rewritten)
        }
        if (
          rewritten.includes('/website/cep/courses/fallback-') ||
          rewritten.includes('/website/akademate/fallback-') ||
          rewritten.includes('/website/akademate/hero-')
        ) {
          rewritten = rewriteCourseHeroes(rewritten, url.pathname)
        }
        if (/seguimiento comercial|flujo actual de leads|historial del lead/i.test(rewritten)) {
          rewritten = stripPublicLeadCopy(rewritten)
        }
        if (rewritten !== source) {
          const headers = new Headers(response.headers)
          headers.delete('content-length')
          headers.set('cache-control', 'public, max-age=60')
          headers.set('x-cep-flight', '1')
          record(env, url.pathname, 'flight-rewrite', response.status, Date.now() - started)
          return new Response(rewritten, { status: response.status, headers })
        }
        record(env, url.pathname, 'origin-html', response.status, Date.now() - started)
        return new Response(source, { status: response.status, headers: response.headers })
      }
      record(env, url.pathname, 'origin-html', response.status, Date.now() - started)
      return response
    } catch (error) {
      console.error('cep-worker-html-error', error)
      record(env, url.pathname, 'origin-html-error', 502, Date.now() - started)
      return htmlResponse(
        `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Sitio no disponible</title></head><body><h1>Sitio no disponible</h1><p><a href="${PUBLIC_SITE_URL}">Abrir el sitio operativo</a></p></body></html>`,
        { 'cache-control': 'no-store' },
        502,
      )
    }
}

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>
