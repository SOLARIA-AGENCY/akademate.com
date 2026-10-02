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
import { colaboraPageId, rewriteColaboraLinks } from './colabora'
import { rewriteMobileNav } from './mobile-nav'
import { isCertificationAssetPath, isPartnerAssetPath } from './partners'
import { isEmpleoAssetPath } from './empleo-image'
import { isIdiomasAssetPath, rewriteIdiomasPhoto } from './idiomas-photo'
import { isCourseHeroAssetPath, rewriteCourseHeroes } from './course-heroes'
import { isUnpublishedRunCode, stripUnpublishedRunLinks } from './unpublished-runs'
import { rewriteHeaderBundle, rewriteHeaderScriptSrc } from './header-bundle'
import { rewritePartnersBanner } from './partners-banner'
import { placeCampusOnPortalNav, rewriteChromeNav } from './chrome-nav'
import { rewriteWhatsAppMenu } from './whatsapp-menu'
import { rewriteTeachersCarousel } from './teachers-carousel'
import { rewriteAntiSlop } from './anti-slop'
import { applyAproemAccessibility } from './aproem-a11y'
import { rewriteLeadFormHtml, rewriteLeadFormScript } from './lead-form-a11y'
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
import { applyHomeFooter, applyHomeHeader, freezeTransparencyHub, isTransparencyFilePath, isTransparencyHub, isTransparencyPortalPath, legalPageId, lightenTransparencyPortal, markTransparencyPage, paintPublicNotFound, rewriteLegalPages, rewriteTransparencyAssets, separateTransparencySections, stampTransparencyUpdated, transparencyFileHeaders } from './legal-pages'
import { editorialPageId, isFounderAssetPath, rewriteEditorial } from './blog-editorial'
import { areaSlugFromPath, rewriteAreaPage } from './area-pages'
import { stripPublicLeadCopy } from './public-lead-copy'
import { injectNewsletterBanner, isNewsletterAssetPath } from './newsletter-banner'
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
  LEAD_ORIGIN,
  OVH_ORIGIN,
  PUBLIC_APP_ORIGIN,
  canonicalOriginForHost,
  isBlockedSitePath,
  isOriginFormPath,
  previewSitePath,
  proxyPublicApp,
} from './proxy'
import { dashboardVisitorRedirect, isDashboardHostname, proxyDashboard } from './dashboard-proxy'
import { isCampusHostname, LIVE_CAMPUS_ORIGIN, proxyCampusHost } from './campus-host'

const TRANSPARENCY_ORIGIN = 'https://origin.cepformacion.com'

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
  CAMPUS_ORIGIN_URL?: string
  ORIGIN_SERVICE_TOKEN?: string
  PREVIEW_TOKEN?: string
  PURGE_HMAC?: string
  CEP_REFRESH_TOKEN?: string
  CEP_CACHE?: KVNamespace
  HTML_EDGE?: KVNamespace
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
  const headers = new Headers({
    'content-type': 'text/html; charset=UTF-8',
    'cache-control': PUBLIC_HTML_CACHE,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  })
  if (extra) new Headers(extra).forEach((value, key) => headers.set(key, value))
  const sealed = sealPublicHtml(body)
  headers.set('content-security-policy', sealed.csp)
  return new Response(sealed.html, { status, headers })
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
              'cache-control': 'public, s-maxage=60, stale-while-revalidate=86400',
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

const OWN_LEAD_HOSTS = ['cepformacion.com', 'akademate.com']

function externalReferrer(value: string): string {
  try {
    const host = new URL(value).hostname.replace(/^www\./, '').toLowerCase()
    if (OWN_LEAD_HOSTS.some((own) => host === own || host.endsWith(`.${own}`))) return ''
    return value.slice(0, 2048)
  } catch {
    return ''
  }
}

function gaClientFromCookie(cookie: string): string {
  const match = cookie.match(/(?:^|;\s*)_ga=([^;]+)/)
  if (!match?.[1]) return ''
  const parts = decodeURIComponent(match[1]).split('.')
  if (parts.length < 4) return ''
  const id = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
  return /^\d+\.\d+$/.test(id) ? id : ''
}

function visitorCountry(request: Request): string {
  const header = (request.headers.get('cf-ipcountry') || '').trim().toLowerCase()
  if (/^[a-z]{2}$/.test(header) && header !== 'xx') return header
  return ''
}

function enrichLeadBody(raw: ArrayBuffer, request: Request): ArrayBuffer {
  let parsed: Record<string, unknown>
  try {
    const value = JSON.parse(new TextDecoder().decode(raw)) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return raw
    parsed = value as Record<string, unknown>
  } catch {
    return raw
  }
  const referrer = externalReferrer(request.headers.get('referer') || '')
  if (referrer && !parsed.referrer) parsed.referrer = referrer
  const country = visitorCountry(request)
  const gaClientId = gaClientFromCookie(request.headers.get('cookie') || '')
  const current = parsed.lead_metadata
  const metadata = current && typeof current === 'object' && !Array.isArray(current)
    ? { ...(current as Record<string, unknown>) }
    : {}
  if (country && !metadata.country) metadata.country = country
  if (gaClientId && !metadata.ga_client_id) metadata.ga_client_id = gaClientId
  if (Object.keys(metadata).length > 0) parsed.lead_metadata = metadata
  if (country && !parsed.country) parsed.country = country
  if (gaClientId && !parsed.ga_client_id) parsed.ga_client_id = gaClientId
  return new TextEncoder().encode(JSON.stringify(parsed))
}

async function proxyLead(request: Request, _env: WorkerEnv, pathname: string): Promise<Response> {
  const body = enrichLeadBody(await request.arrayBuffer(), request)
  const headers: Record<string, string> = {
    'content-type': request.headers.get('content-type') || 'application/json',
    accept: request.headers.get('accept') || 'application/json',
    'x-forwarded-host': 'cepformacion.akademate.com',
    'x-forwarded-proto': 'https',
    'x-cep-worker': '1',
  }
  const ip = (request.headers.get('cf-connecting-ip') || '').trim()
  if (ip) headers['x-forwarded-for'] = ip
  const userAgent = (request.headers.get('user-agent') || '').trim()
  if (userAgent) headers['user-agent'] = userAgent
  const country = visitorCountry(request)
  if (country) headers['cf-ipcountry'] = country
  const tag = (response: Response) => {
    const next = new Headers(response.headers)
    stripOriginDisclosure(next)
    next.set('x-cep-lead', 'ovh')
    return new Response(response.body, { status: response.status, headers: next })
  }
  try {
    return tag(await fetch(`${LEAD_ORIGIN}${pathname}`, { method: 'POST', headers, body }))
  } catch {
    return new Response(JSON.stringify({ error: 'No se pudo guardar el lead' }), {
      status: 502,
      headers: { 'content-type': 'application/json', 'x-cep-lead': 'ovh' },
    })
  }
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
            rewriteCourseHeroes(rewriteWhatsAppMenu(rewriteChromeNav(rewriteBolsaNav(rewriteColaboraLinks(rewriteMobileNav(rewriteCampusNav(html)), pathname)))), pathname),
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
  return injectNewsletterBanner(
    applyAproemAccessibility(rewriteLeadFormHtml(keepSedesCards(stripUnpublishedRunLinks(next), pathname)), pathname),
    pathname,
  )
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

async function publicNotFoundPage(request: Request, canonicalOrigin: string): Promise<Response> {
  let shell = ''
  try {
    const page = await proxyPublicApp(request, '/', canonicalOrigin, { origin: PUBLIC_APP_ORIGIN })
    if (page.ok) shell = await page.text()
  } catch {
    shell = ''
  }
  return htmlResponse(paintPublicNotFound(shell), { 'cache-control': 'no-store' }, 404)
}

const HTML_FRESH_MS = 60_000
const PUBLIC_HTML_CACHE = 'public, max-age=60, stale-while-revalidate=86400'
const CDN_HTML_CACHE = 'public, max-age=3600, stale-while-revalidate=604800'
const HTML_STORE_CONTROL = 'public, max-age=604800'

function rememberPublicHtml(headers: Headers): void {
  headers.set('cache-control', PUBLIC_HTML_CACHE)
  headers.set('cdn-cache-control', CDN_HTML_CACHE)
}
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
const PROBE_PREFIXES = ['/wp-', '/xmlrpc', '/cgi-bin', '/server-status', '/actuator']
const LEAD_POST_LIMIT = 20
const LEAD_WINDOW_SEC = 600
const internalRefreshRequests = new WeakSet<Request>()

export function isProbePath(pathname: string): boolean {
  const path = pathname.toLowerCase()
  if (path.includes('..')) return true
  if (path === '/.well-known' || path.startsWith('/.well-known/')) return false
  if (path.endsWith('.php') || path.includes('.php/')) return true
  if (PROBE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix))) return true
  return path.split('/').some((segment) => segment.startsWith('.'))
}

function cacheBypassAllowed(request: Request, env: WorkerEnv): boolean {
  if (internalRefreshRequests.has(request)) return true
  const token = env.CEP_REFRESH_TOKEN
  if (!token) return false
  return request.headers.get('x-cep-refresh') === '1'
    && safeEqual(request.headers.get('x-cep-refresh-token') || '', token)
}

function scheduleHtmlRefresh(request: Request, env: WorkerEnv, ctx: ExecutionContext): void {
  const refreshHeaders = new Headers(request.headers)
  refreshHeaders.set('x-cep-refresh', '1')
  const next = new Request(request.url, { method: 'GET', headers: refreshHeaders })
  internalRefreshRequests.add(next)
  ctx.waitUntil(handleRequest(next, env, ctx).then((res) => res.arrayBuffer()))
}

function stripOriginDisclosure(headers: Headers): void {
  headers.delete('x-powered-by')
  headers.delete('x-cep-data-origin')
  headers.delete('x-cep-html-origin')
}

const COOKIE_HANDLER_HASH = "'sha256-sWTfQRrOVg0MvYlUME7okQM+jzchJ1bt4bAp0gQKHb4='"
const DASHBOARD_CHUNK = /global-error-|\(dashboard\)\/not-found/i

function scriptNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com`,
    `script-src-attr 'unsafe-hashes' ${COOKIE_HANDLER_HASH}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net",
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export function stripLooseDashboardChunks(html: string): string {
  const flight = html.match(/<script\b[^>]*>[\s\S]*?self\.__next_f[\s\S]*?<\/script>/gi)?.join('') || ''
  if (DASHBOARD_CHUNK.test(flight)) return html
  return html
    .replace(/<script\b[^>]*src="[^"]*(?:global-error-|\(dashboard\)\/not-found)[^"]*"[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b[^>]*(?:global-error-|\(dashboard\)\/not-found)[^>]*>/gi, '')
}

function stampScripts(html: string, nonce: string): string {
  return html.replace(/<script\b([^>]*)>/gi, (open, attrs: string) => {
    if (/\snonce\s*=/i.test(open)) return open
    return `<script${attrs} nonce="${nonce}">`
  })
}

export function sealPublicHtml(html: string): { html: string; csp: string } {
  const nonce = scriptNonce()
  const body = stampScripts(stripLooseDashboardChunks(html), nonce)
  return { html: body, csp: contentSecurityPolicy(nonce) }
}

function applyPublicSeal(html: string, headers: Headers): string {
  const sealed = sealPublicHtml(html)
  headers.set('content-security-policy', sealed.csp)
  return sealed.html
}

function honeypotTripped(raw: ArrayBuffer): boolean {
  try {
    const value = JSON.parse(new TextDecoder().decode(raw)) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const field = (value as Record<string, unknown>).cep_hp
    return typeof field === 'string' && field.trim() !== ''
  } catch {
    return false
  }
}

function leadPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Accept',
      'access-control-max-age': '600',
      'cache-control': 'no-store',
    },
  })
}

async function leadRateLimited(request: Request, env: WorkerEnv): Promise<boolean> {
  if (!env.CEP_CACHE) return false
  const ip = (request.headers.get('cf-connecting-ip') || 'unknown').trim() || 'unknown'
  const window = Math.floor(Date.now() / (LEAD_WINDOW_SEC * 1000))
  const key = `lead-rl:${ip}:${window}`
  try {
    const current = Number(await env.CEP_CACHE.get(key) || '0')
    if (!Number.isFinite(current)) return false
    if (current >= LEAD_POST_LIMIT) return true
    await env.CEP_CACHE.put(key, String(current + 1), { expirationTtl: LEAD_WINDOW_SEC })
    return false
  } catch {
    return false
  }
}

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
  return new Request(`https://cepformacion.com/__cache/html-news21${path}`)
}

const HTML_EDGE_TTL_SEC = 604_800

type EdgeHtmlMeta = { builtFrom?: string; cachedAt?: string }

function edgeHtmlKey(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  return `html-news21:${path}`
}

async function readEdgeHtml(env: WorkerEnv, pathname: string): Promise<{ html: string; csp: string; meta: EdgeHtmlMeta } | null> {
  if (!env.HTML_EDGE) return null
  try {
    const key = edgeHtmlKey(pathname)
    const [found, csp] = await Promise.all([
      env.HTML_EDGE.getWithMetadata<EdgeHtmlMeta>(key, 'text'),
      env.HTML_EDGE.get(`${key}:csp`),
    ])
    if (!found.value || !csp) return null
    return { html: found.value, csp, meta: found.metadata || {} }
  } catch {
    return null
  }
}

async function storeEdgeHtml(env: WorkerEnv, pathname: string, html: string, csp: string, builtFrom: string, cachedAt: string): Promise<void> {
  if (!env.HTML_EDGE || !cachedAt || !csp) return
  const key = edgeHtmlKey(pathname)
  try {
    if ((await env.HTML_EDGE.get(`${key}:at`)) === cachedAt) return
    await Promise.all([
      env.HTML_EDGE.put(key, html, {
        expirationTtl: HTML_EDGE_TTL_SEC,
        metadata: { builtFrom, cachedAt },
      }),
      env.HTML_EDGE.put(`${key}:csp`, csp, { expirationTtl: HTML_EDGE_TTL_SEC }),
      env.HTML_EDGE.put(`${key}:at`, cachedAt, { expirationTtl: HTML_EDGE_TTL_SEC }),
    ])
  } catch {
    /* The colo copy still answers. A global miss falls through to origin. */
  }
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

function homeHeaderSnippet(homeHtml: string): string {
  const start = homeHtml.search(/<header\b/i)
  const end = homeHtml.search(/<\/header>/i)
  if (start < 0 || end < 0) return ''
  const header = homeHtml.slice(start, end + '</header>'.length)
  if (!header.includes('data-cep-header-tools="1"')) return ''
  return header
}

async function loadHomeHeaderSource(
  _request: Request,
  _env: WorkerEnv,
  ctx: ExecutionContext,
  cache: Cache,
): Promise<string> {
  const snippetKey = new Request(`${CANONICAL_ORIGIN}/__cache/home-header-v3`)
  const ready = await cache.match(snippetKey)
  if (ready) return ready.text()
  const hit = await cache.match(publicHtmlCacheKey('/'))
  if (!hit) return ''
  const header = homeHeaderSnippet(await hit.text())
  if (!header) return ''
  ctx.waitUntil(cache.put(snippetKey, new Response(header, {
    headers: { 'cache-control': 'public, max-age=600' },
  })))
  return header
}

function homeFooterSnippet(homeHtml: string): string {
  const start = homeHtml.search(/<footer\b/i)
  const end = homeHtml.search(/<\/footer>/i)
  if (start < 0 || end < 0) return ''
  const footer = homeHtml.slice(start, end + '</footer>'.length)
  const style = homeHtml.match(/<style\b[^>]*data-cep-gbp-open="1"[^>]*>[\s\S]*?<\/style>/i)?.[0] || ''
  return `<html><head>${style}</head><body>${footer}</body></html>`
}

async function loadHomeFooterSource(
  _request: Request,
  _env: WorkerEnv,
  ctx: ExecutionContext,
  cache: Cache,
): Promise<string> {
  const snippetKey = new Request(`${CANONICAL_ORIGIN}/__cache/home-footer-v1`)
  const ready = await cache.match(snippetKey)
  if (ready) return ready.text()
  const hit = await cache.match(publicHtmlCacheKey('/'))
  if (!hit) return ''
  const cached = await hit.text()
  const snippet = homeFooterSnippet(cached)
  if (!snippet.includes('data-cep-sedes-footer="1"')) return ''
  ctx.waitUntil(cache.put(snippetKey, new Response(snippet, {
    headers: { 'cache-control': 'public, max-age=600' },
  })))
  return snippet
}

function usefulStatic(response: Response, pathname: string): boolean {
  if (!response.ok) return false
  const type = (response.headers.get('content-type') || '').toLowerCase()
  if ((pathname.endsWith('.js') || pathname.endsWith('.css')) && type.includes('text/html')) return false
  return true
}

async function firstUsefulStatic(pending: Array<Promise<Response>>, pathname: string): Promise<Response | null> {
  return new Promise((resolve) => {
    let left = pending.length
    if (left === 0) {
      resolve(null)
      return
    }
    let done = false
    for (const item of pending) {
      item.then((response) => {
        if (!done && usefulStatic(response, pathname)) {
          done = true
          resolve(response)
          return
        }
        left -= 1
        if (!done && left === 0) resolve(null)
      }).catch(() => {
        left -= 1
        if (!done && left === 0) resolve(null)
      })
    }
  })
}

async function serveNextStatic(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
  cache: Cache,
  canonicalOrigin: string,
  pathname: string,
  started: number,
): Promise<Response> {
  const cacheName = pathname.endsWith('.js') ? `/__cache/next-lead1${pathname}` : `/__cache/next${pathname}`
  const key = new Request(`${CANONICAL_ORIGIN}${cacheName}`)
  if (!cacheBypassAllowed(request, env)) {
    const hit = await cache.match(key)
    if (hit) {
      const headers = new Headers(hit.headers)
      stripOriginDisclosure(headers)
      headers.set('x-cep-cache', 'hit')
      record(env, pathname, 'next-hit', hit.status, Date.now() - started)
      return new Response(request.method === 'HEAD' ? null : hit.body, { status: hit.status, headers })
    }
  }
  const found = await firstUsefulStatic([
    proxyPublicApp(request, pathname, canonicalOrigin, { origin: PUBLIC_APP_ORIGIN }),
    proxyPublicApp(request, pathname, canonicalOrigin, { origin: TRANSPARENCY_ORIGIN }),
  ], pathname)
  if (!found) {
    record(env, pathname, 'next-miss', 404, Date.now() - started)
    return new Response(null, { status: 404, headers: { 'cache-control': 'public, max-age=60' } })
  }
  const raw = await found.arrayBuffer()
  const body = pathname.endsWith('.js')
    ? new TextEncoder().encode(rewriteLeadFormScript(new TextDecoder().decode(raw)))
    : raw
  const headers = new Headers()
  const type = found.headers.get('content-type')
  if (type) headers.set('content-type', type)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  headers.set('x-cep-cache', 'miss')
  ctx.waitUntil(cache.put(key, new Response(body, { status: 200, headers })))
  record(env, pathname, 'next-miss', 200, Date.now() - started)
  return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers })
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
    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      !isDashboardHostname(url.hostname) &&
      !isCampusHostname(url.hostname)
    ) {
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

    if (isCampusHostname(url.hostname)) {
      const response = await proxyCampusHost(request, env.CAMPUS_ORIGIN_URL || LIVE_CAMPUS_ORIGIN)
      record(env, url.pathname, 'campus-origin', response.status, Date.now() - started)
      return response
    }

    if (isProbePath(url.pathname)) {
      record(env, url.pathname, 'probe-404', 404, Date.now() - started)
      return notFound()
    }

    if (
      (isPartnerAssetPath(url.pathname) || isCertificationAssetPath(url.pathname) || isEmpleoAssetPath(url.pathname) || isIdiomasAssetPath(url.pathname) || isCourseHeroAssetPath(url.pathname) || isFounderAssetPath(url.pathname) || isSedeAssetPath(url.pathname) || isSocialAssetPath(url.pathname) || isNewsletterAssetPath(url.pathname)) &&
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
        fetch(PUBLIC_SITE_URL, { headers: { accept: 'text/html', 'x-cep-worker': '1' }, signal: AbortSignal.timeout(8000) }),
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
      if (request.method === 'OPTIONS') return leadPreflight()
      if (request.method === 'POST' && url.pathname === '/api/leads') {
        const raw = await request.arrayBuffer()
        if (honeypotTripped(raw)) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'cache-control': 'no-store',
              'x-cep-lead': 'drop',
            },
          })
        }
        if (await leadRateLimited(request, env)) {
          return new Response(JSON.stringify({ error: 'Demasiados envíos. Espera unos minutos e inténtalo de nuevo.' }), {
            status: 429,
            headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
          })
        }
        return proxyLead(new Request(request.url, { method: 'POST', headers: request.headers, body: raw }), env, url.pathname)
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
            let html = rewritePublicHtml(embedded, null, url.pathname)
            const headers = new Headers(response.headers)
            headers.delete('content-length')
            stripOriginDisclosure(headers)
            headers.set('cache-control', 'private, no-cache, no-store, max-age=0, must-revalidate')
            html = applyPublicSeal(html, headers)
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

    if (url.pathname === '/api/transparencia/visitas' && (request.method === 'GET' || request.method === 'POST')) {
      try {
        const target = new URL(`${url.pathname}${url.search}`, TRANSPARENCY_ORIGIN)
        const proxied = await fetch(target, {
          method: request.method,
          headers: {
            accept: 'application/json',
            'content-type': request.headers.get('content-type') || 'application/json',
            'user-agent': request.headers.get('user-agent') || 'cepformacion-com-worker',
          },
          body: request.method === 'POST' ? await request.text() : undefined,
        })
        record(env, url.pathname, 'transparency-visits', proxied.status, Date.now() - started)
        return new Response(proxied.body, {
          status: proxied.status,
          headers: {
            'content-type': proxied.headers.get('content-type') || 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        })
      } catch (error) {
        console.error('cep-transparency-visits', error)
        record(env, url.pathname, 'transparency-visits-error', 502, Date.now() - started)
        return new Response(JSON.stringify({ count: null }), {
          status: 502,
          headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
        })
      }
    }

    if (isTransparencyPortalPath(url.pathname)) {
      if (isTransparencyFilePath(url.pathname) && env.ASSETS) {
        const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }))
        if (asset.ok) {
          const headers = transparencyFileHeaders(url.pathname)
          const length = asset.headers.get('content-length')
          if (length) headers.set('content-length', length)
          record(env, url.pathname, 'transparency-file', 200, Date.now() - started)
          return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers })
        }
        record(env, url.pathname, 'transparency-file-missing', 404, Date.now() - started)
        return publicNotFoundPage(request, canonicalOrigin)
      }
      const htmlKey = publicHtmlCacheKey(url.pathname)
      const bypassPortalCache = cacheBypassAllowed(request, env)
      if (!bypassPortalCache && (request.method === 'GET' || request.method === 'HEAD')) {
        const hit = await cache.match(htmlKey)
        const cachedAt = Number(hit?.headers.get('x-cep-cached-at') || 0)
        const age = cachedAt ? Date.now() - cachedAt : Number.POSITIVE_INFINITY
        if (hit) {
          if (!Number.isFinite(age) || age >= HTML_FRESH_MS) scheduleHtmlRefresh(request, env, ctx)
          const headers = new Headers(hit.headers)
          stripOriginDisclosure(headers)
          headers.set('x-cep-cache', age < HTML_FRESH_MS ? 'hit' : 'stale')
          rememberPublicHtml(headers)
          record(env, url.pathname, age < HTML_FRESH_MS ? 'portal-hit' : 'portal-stale', hit.status, Date.now() - started)
          return new Response(request.method === 'HEAD' ? null : hit.body, { status: hit.status, headers })
        }
      }
      try {
        const [response, homeHtml, homeHeader] = await Promise.all([
          proxyPublicApp(request, url.pathname, canonicalOrigin, { origin: TRANSPARENCY_ORIGIN }),
          loadHomeFooterSource(request, env, ctx, cache),
          loadHomeHeaderSource(request, env, ctx, cache),
        ])
        const contentType = response.headers.get('content-type') || ''
        if (response.status === 404) {
          record(env, url.pathname, 'transparency-not-found', 404, Date.now() - started)
          return publicNotFoundPage(request, canonicalOrigin)
        }
        if (!contentType.includes('text/html')) {
          record(env, url.pathname, 'transparency-asset', response.status, Date.now() - started)
          return response
        }
        let html = stampTransparencyUpdated(separateTransparencySections(rewriteTransparencyAssets(await response.text(), TRANSPARENCY_ORIGIN)))
        if (homeHtml) html = applyHomeFooter(html, homeHtml)
        if (homeHeader) html = applyHomeHeader(html, homeHeader)
        if (isTransparencyHub(url.pathname)) html = freezeTransparencyHub(html)
        html = rewriteChromeNav(html)
        html = markTransparencyPage(html)
        html = placeCampusOnPortalNav(html)
        html = lightenTransparencyPortal(html)
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        stripOriginDisclosure(headers)
        rememberPublicHtml(headers)
        headers.set('x-cep-cached-at', String(Date.now()))
        headers.set('x-cep-cache', 'miss')
        headers.set('x-cep-transparency', 'portal')
        html = applyPublicSeal(html, headers)
        if (response.status === 200 && request.method === 'GET') {
          const stored = new Headers(headers)
          stored.set('cache-control', HTML_STORE_CONTROL)
          ctx.waitUntil(cache.put(htmlKey, new Response(html, { status: 200, headers: stored })))
        }
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

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname.startsWith('/_next/static/')) {
      return serveNextStatic(request, env, ctx, cache, canonicalOrigin, url.pathname, started)
    }

    try {
      const htmlKey = publicHtmlCacheKey(url.pathname)
      const bypassHtmlCache = cacheBypassAllowed(request, env) || Boolean(legalPageId(url.pathname)) || isTransparencyHub(url.pathname) || Boolean(editorialPageId(url.pathname)) || Boolean(colaboraPageId(url.pathname)) || Boolean(areaSlugFromPath(url.pathname))
      if (!bypassHtmlCache && publicHtmlCacheable(request, url)) {
        const hit = await cache.match(htmlKey)
        const cachedAt = Number(hit?.headers.get('x-cep-cached-at') || 0)
        const age = cachedAt ? Date.now() - cachedAt : Number.POSITIVE_INFINITY
        if (hit) {
          if (!Number.isFinite(age) || age >= HTML_FRESH_MS) scheduleHtmlRefresh(request, env, ctx)
          const edgeBody = env.HTML_EDGE ? hit.clone() : null
          const headers = new Headers(hit.headers)
          stripOriginDisclosure(headers)
          headers.set('x-cep-cache', age < HTML_FRESH_MS ? 'hit' : 'stale')
          rememberPublicHtml(headers)
          if (!isTransparencyHub(url.pathname)) headers.delete('x-robots-tag')
          if (edgeBody) {
            ctx.waitUntil((async () => {
              const cachedAtHeader = hit.headers.get('x-cep-cached-at') || ''
              const csp = hit.headers.get('content-security-policy') || ''
              if (!cachedAtHeader || !csp) return
              if ((await env.HTML_EDGE?.get(`${edgeHtmlKey(url.pathname)}:at`)) === cachedAtHeader) return
              await storeEdgeHtml(
                env,
                url.pathname,
                await edgeBody.text(),
                csp,
                hit.headers.get('x-cep-built-from') || '',
                cachedAtHeader,
              )
            })())
          }
          record(env, url.pathname, age < HTML_FRESH_MS ? 'html-hit' : 'html-stale', hit.status, Date.now() - started)
          return new Response(hit.body, { status: hit.status, headers })
        }
        const edge = await readEdgeHtml(env, url.pathname)
        if (edge) {
          const edgeAt = Number(edge.meta.cachedAt || 0)
          const edgeAge = edgeAt ? Date.now() - edgeAt : Number.POSITIVE_INFINITY
          if (!Number.isFinite(edgeAge) || edgeAge >= HTML_FRESH_MS) scheduleHtmlRefresh(request, env, ctx)
          const headers = new Headers()
          rememberPublicHtml(headers)
          headers.set('content-security-policy', edge.csp)
          headers.set('x-content-type-options', 'nosniff')
          headers.set('referrer-policy', 'strict-origin-when-cross-origin')
          headers.set('content-type', 'text/html; charset=UTF-8')
          headers.set('x-cep-cached-at', edge.meta.cachedAt || String(Date.now()))
          headers.set('x-cep-built-from', edge.meta.builtFrom || 'origin')
          headers.set('x-cep-cache', 'edge')
          const storedHeaders = new Headers(headers)
          storedHeaders.set('cache-control', HTML_STORE_CONTROL)
          ctx.waitUntil(cache.put(htmlKey, new Response(edge.html, { status: 200, headers: storedHeaders })))
          record(env, url.pathname, 'html-edge', 200, Date.now() - started)
          return new Response(edge.html, { status: 200, headers })
        }
      }

      let response: Response
      const htmlOrigin = originBase(env)
      let builtFrom = htmlOrigin === PUBLIC_APP_ORIGIN ? 'hetzner' : 'origin'
      const fetchDocument = (origin: string) =>
        proxyPublicApp(request, url.pathname, canonicalOrigin, {
          origin,
          cacheTtl: 300,
        })
      const fetchEditorialShell = () =>
        proxyPublicApp(request, areaSlugFromPath(url.pathname) ? '/cursos' : '/contacto', canonicalOrigin, {
          origin: PUBLIC_APP_ORIGIN,
        })
      try {
        response = await fetchDocument(htmlOrigin)
        if (response.status >= 500 && htmlOrigin !== PUBLIC_APP_ORIGIN) {
          builtFrom = 'hetzner'
          response = await fetchDocument(PUBLIC_APP_ORIGIN)
        }
        if (url.pathname.startsWith('/_next/static/') && response.status === 404) {
          const staged = await proxyPublicApp(request, url.pathname, canonicalOrigin, {
            origin: TRANSPARENCY_ORIGIN,
          })
          response = staged.ok
            ? staged
            : await proxyPublicApp(request, url.pathname, canonicalOrigin, {
                origin: OVH_ORIGIN,
              })
          builtFrom = staged.ok ? 'staging' : 'ovh'
        }
      } catch (error) {
        // /noticias on the tenant host 307s to /auth/login. That throw is the
        // dashboard capture, not a missing page. Editorial routes paint on the
        // public shell instead of returning 502.
        if (htmlOrigin !== PUBLIC_APP_ORIGIN) {
          try {
            builtFrom = 'hetzner'
            response = await fetchDocument(PUBLIC_APP_ORIGIN)
          } catch (fallbackError) {
            if (!editorialPageId(url.pathname) && !colaboraPageId(url.pathname) && !areaSlugFromPath(url.pathname) && !isTransparencyHub(url.pathname)) throw fallbackError
            builtFrom = 'hetzner'
            response = await fetchEditorialShell()
          }
        } else if (!editorialPageId(url.pathname) && !colaboraPageId(url.pathname) && !areaSlugFromPath(url.pathname) && !isTransparencyHub(url.pathname)) {
          throw error
        } else {
          response = await fetchEditorialShell()
        }
      }
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        let html = await response.text()
        let status = response.status
        if ((legalPageId(url.pathname) || isTransparencyHub(url.pathname) || editorialPageId(url.pathname) || colaboraPageId(url.pathname) || areaSlugFromPath(url.pathname)) && (status !== 200 || !/<header\b/i.test(html) || !/<footer\b/i.test(html))) {
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
          const enrich = internalRefreshRequests.has(request)
          if (enrich && url.pathname === '/') snapshot = await withOvhHomeRuns(env, snapshot)
          if (enrich && areaSlugFromPath(url.pathname)) snapshot = await withAreaCatalog(env, snapshot)
          const catalogPath = url.pathname.replace(/\/+$/, '') || '/'
          if (enrich && snapshot && (catalogPath === '/cursos' || catalogPath === '/p/cursos')) {
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
        if (internalRefreshRequests.has(request)) {
          html = await fillInstructorTitles(html, (href) => loadProfessorPosition(env, href))
        }
        html = rewritePublicHtml(html, snapshot, url.pathname)
        if (areaSlugFromPath(url.pathname)) html = rewriteAreaPage(html, snapshot, url.pathname)
        const barePath = url.pathname.replace(/\/+$/, '') || '/'
        if (internalRefreshRequests.has(request) && (barePath === '/convocatorias' || barePath === '/p/convocatorias') && snapshot) {
          snapshot = omitUnpublishedRuns(await withListingRuns(env, snapshot))
          html = replaceActiveConvocatorias(html, snapshot)
          catalogNote = `${catalogNote};active-source=listings`
        }
        if ((legalPageId(url.pathname) || isTransparencyHub(url.pathname)) && html.includes('data-cep-legal-rendered=')) status = 200
        if (editorialPageId(url.pathname) && html.includes('data-cep-editorial-rendered=')) status = 200
        if (colaboraPageId(url.pathname) && html.includes('data-cep-colabora-rendered=')) status = 200
        if (areaSlugFromPath(url.pathname) && html.includes('data-cep-area-rendered=')) status = 200
        const headers = new Headers(response.headers)
        headers.delete('content-length')
        stripOriginDisclosure(headers)
        if (!isTransparencyHub(url.pathname)) headers.delete('x-robots-tag')
        if (legalPageId(url.pathname) || isTransparencyHub(url.pathname)) {
          headers.set('cache-control', 'no-store')
        } else {
          rememberPublicHtml(headers)
        }
        headers.set('x-cep-built-from', builtFrom)
        headers.set('x-cep-cached-at', String(Date.now()))
        headers.set('x-cep-cache', 'miss')
        headers.set('x-cep-catalog', catalogNote)
        html = applyPublicSeal(html, headers)
        if (
          status === 200 &&
          publicHtmlCacheable(request, url) &&
          !legalPageId(url.pathname) &&
          !isTransparencyHub(url.pathname) &&
          !response.headers.get('set-cookie')
        ) {
          const storedHeaders = new Headers(headers)
          storedHeaders.set('cache-control', HTML_STORE_CONTROL)
          ctx.waitUntil(Promise.all([
            cache.put(htmlKey, new Response(html, { status, headers: storedHeaders })),
            storeEdgeHtml(
              env,
              url.pathname,
              html,
              headers.get('content-security-policy') || '',
              builtFrom,
              headers.get('x-cep-cached-at') || '',
            ),
          ]))
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
          stripOriginDisclosure(headers)
          headers.set('cache-control', 'public, max-age=60')
          headers.set('x-cep-flight', '1')
          record(env, url.pathname, 'flight-rewrite', response.status, Date.now() - started)
          return new Response(rewritten, { status: response.status, headers })
        }
        record(env, url.pathname, 'origin-html', response.status, Date.now() - started)
        const headers = new Headers(response.headers)
        stripOriginDisclosure(headers)
        return new Response(source, { status: response.status, headers })
      }
      record(env, url.pathname, 'origin-html', response.status, Date.now() - started)
      const passed = new Headers(response.headers)
      stripOriginDisclosure(passed)
      return new Response(response.body, { status: response.status, headers: passed })
    } catch (error) {
      console.error('cep-worker-html-error', error)
      record(env, url.pathname, 'origin-html-error', 502, Date.now() - started)
      return htmlResponse(
        `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Sitio no disponible</title></head><body><h1>Sitio no disponible</h1><p><a href="${CANONICAL_ORIGIN}/">Abrir el sitio operativo</a></p></body></html>`,
        { 'cache-control': 'no-store' },
        502,
      )
    }
}

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>
