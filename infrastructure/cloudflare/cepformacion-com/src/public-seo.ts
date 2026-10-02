import { isHiddenPublicCycle } from './hidden-cycles'
import type { CatalogSnapshot } from './render'

export const CANONICAL_PUBLIC_ORIGIN = 'https://cepformacion.com'

const SAAS_DESCRIPTION =
  'Gestion integral para centros de formacion con branding, campus virtual y operaciones SaaS.'

const SAAS_TITLE_RE =
  /CEP FORMACI[OÓ]N(?:\s*[,—–-]\s*|\s+)\s*Plataforma Educativa/gi

const STATIC_PATHS = [
  '/',
  '/cursos',
  '/ciclos',
  '/convocatorias',
  '/sedes',
  '/contacto',
  '/quienes-somos',
  '/legal',
  '/blog',
  '/blog/conocer-nuestra-historia',
  '/blog/tres-sedes-cep-formacion-tenerife',
  '/noticias',
] as const

const LEGACY_PUBLIC_SECTION =
  'cursos|ciclos|convocatorias|contacto|quienes-somos|legal|areas|profesores|empleo'

export type SitemapEntry = { path: string; changefreq: string; lastmod: string | null }

type SeoPage = { title: string; description: string }

export function publicCanonicalPath(pathname: string): string {
  let path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/p/formacion') return '/'
  if (path === '/site/sedes') return '/sedes'
  path = path.replace(/^\/p\/sedes(?=\/|$)/, '/sedes')
  return path.replace(new RegExp(`^\\/p(?=\\/(?:${LEGACY_PUBLIC_SECTION})(?:\\/|$))`), '')
}

export function legacyPublicRedirect(pathname: string): string | null {
  const current = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  const next = publicCanonicalPath(current)
  return next === current ? null : next
}

function normalizePath(pathname: string): string {
  return publicCanonicalPath(pathname)
}

export function seoForPath(pathname: string): SeoPage | null {
  const path = normalizePath(pathname)
  if (path === '/') {
    return {
      title: 'CEP Formación | Cursos y FP en Tenerife',
      description:
        'Cursos, ciclos formativos y convocatorias abiertas en CEP Santa Cruz, CEP Norte y CEP Sur. Formación presencial en Tenerife.',
    }
  }
  if (path === '/contacto') {
    return {
      title: 'Contacto | CEP Formación en Tenerife',
      description:
        'Pide información sobre cursos y ciclos en CEP Formación. Campus en Santa Cruz de Tenerife, La Orotava y el Sur.',
    }
  }
  if (path === '/sedes') {
    return {
      title: 'Sedes en Tenerife | CEP Formación',
      description:
        'CEP Santa Cruz, CEP Norte en La Orotava y CEP Sur. Centros de formación presencial en Tenerife.',
    }
  }
  if (path === '/cursos') {
    return {
      title: 'Cursos en Tenerife | CEP Formación',
      description:
        'Catálogo de cursos privados, para trabajadores/as desempleados/as y trabajadores/as ocupados/as en CEP Santa Cruz, CEP Norte y CEP Sur.',
    }
  }
  if (path === '/ciclos') {
    return {
      title: 'Ciclos formativos en Tenerife | CEP Formación',
      description:
        'CFGM Farmacia y Parafarmacia y CFGS Higiene Bucodental en CEP Formación, Tenerife.',
    }
  }
  if (path === '/convocatorias') {
    return {
      title: 'Convocatorias abiertas en Tenerife | CEP Formación',
      description: 'Matrícula abierta de cursos y ciclos en CEP Santa Cruz, CEP Norte y CEP Sur.',
    }
  }
  return null
}

function upsertTag(html: string, pattern: RegExp, tag: string): string {
  if (pattern.test(html)) return html.replace(pattern, tag)
  if (html.includes('</head>')) return html.replace('</head>', `${tag}\n</head>`)
  return `${tag}\n${html}`
}

function replaceTitle(html: string, title: string): string {
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  }
  return upsertTag(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
}

function upsertNamedMeta(html: string, name: string, content: string): string {
  const named = new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*>`, 'i')
  const contentFirst = new RegExp(`<meta\\b[^>]*content=["'][^"']*["'][^>]*name=["']${name}["'][^>]*>`, 'i')
  const tag = `<meta name="${name}" content="${content}">`
  if (named.test(html)) return html.replace(named, tag)
  if (contentFirst.test(html)) return html.replace(contentFirst, tag)
  return upsertTag(html, named, tag)
}

function upsertPropertyMeta(html: string, property: string, content: string): string {
  const named = new RegExp(`<meta\\b[^>]*property=["']${property}["'][^>]*>`, 'i')
  const tag = `<meta property="${property}" content="${content}">`
  if (named.test(html)) return html.replace(named, tag)
  return upsertTag(html, named, tag)
}

function ensureCanonical(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${href}">`
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag)
  }
  return upsertTag(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag)
}

function stripSaasTitle(html: string, fallback: string): string {
  return html.replace(/<title\b[^>]*>([\s\S]*?)<\/title>/i, (full, inner: string) => {
    if (!SAAS_TITLE_RE.test(inner)) return full
    SAAS_TITLE_RE.lastIndex = 0
    return `<title>${fallback}</title>`
  })
}

/** The <title> and the Next flight must carry the same string or hydration throws #418. */
function syncFlightTitle(html: string): string {
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]
  if (!title) return html
  const pattern = new RegExp(SAAS_TITLE_RE.source, 'gi')
  return html.replace(pattern, () => title)
}

const OG_IMAGE = `${CANONICAL_PUBLIC_ORIGIN}/logos/cep-formacion-logo-rectangular.png`
const FACEBOOK_PAGE = 'https://www.facebook.com/cepsantacruz'

export function rewriteFacebookPage(html: string): string {
  if (html.includes('facebook.com/cepsantacruz')) return html
  const emailLi = html.match(/<li>Email:\s*<a\b[^>]*>[\s\S]*?<\/a><\/li>/i)
  if (!emailLi) return html
  const link = `<li>Facebook: <a href="${FACEBOOK_PAGE}" class="font-semibold text-[#f2014b] hover:underline" target="_blank" rel="noopener noreferrer">facebook.com/cepsantacruz</a></li>`
  return html.replace(emailLi[0], `${emailLi[0]}${link}`)
}

type CampusJsonLd = {
  name: string
  url: string
  street: string
  postalCode: string
  locality: string
  telephone: string
  sameAs: string[]
}

const CAMPUS_JSON_LD: CampusJsonLd[] = [
  {
    name: 'CEP Santa Cruz',
    url: `${CANONICAL_PUBLIC_ORIGIN}/sedes/sede-santa-cruz`,
    street: 'Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro',
    postalCode: '38005',
    locality: 'Santa Cruz de Tenerife',
    telephone: '+34-922-219-257',
    sameAs: [
      'https://cursostenerife.es/',
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(
          'CEP Formación Santa Cruz, Plaza José Antonio Barrios Olivero, 38005 Santa Cruz de Tenerife',
        ),
    ],
  },
  {
    name: 'CEP Norte',
    url: `${CANONICAL_PUBLIC_ORIGIN}/sedes/sede-norte`,
    street: 'C.C. El Trompo, última planta',
    postalCode: '38300',
    locality: 'La Orotava',
    telephone: '+34-622-416-020',
    sameAs: [
      'https://cursostenerife.es/',
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(
          'CEP Formación Norte, C.C. El Trompo, Molinos de Gofio 2, 38312 La Orotava',
        ),
    ],
  },
  {
    name: 'CEP Sur',
    url: `${CANONICAL_PUBLIC_ORIGIN}/sedes/cep-sur`,
    street: 'Calle Arguayoda, 3',
    postalCode: '38611',
    locality: 'San Isidro',
    telephone: '+34-922-393-692',
    sameAs: [
      'https://cepsur.es/',
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('CENTRO FORMACION CEP SUR, Calle Arguayoda 3, 38611 San Isidro'),
    ],
  },
]

export function organizationJsonLd(origin = CANONICAL_PUBLIC_ORIGIN): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${origin}/#org`,
        name: 'CEP Formación',
        url: `${origin}/`,
        logo: OG_IMAGE,
        sameAs: [FACEBOOK_PAGE],
        areaServed: 'Santa Cruz de Tenerife',
        department: CAMPUS_JSON_LD.map((campus) => ({ '@id': `${campus.url}#place` })),
      },
      ...CAMPUS_JSON_LD.map((campus) => ({
        '@type': 'EducationalOrganization',
        '@id': `${campus.url}#place`,
        name: campus.name,
        url: campus.url,
        parentOrganization: { '@id': `${origin}/#org` },
        address: {
          '@type': 'PostalAddress',
          streetAddress: campus.street,
          postalCode: campus.postalCode,
          addressLocality: campus.locality,
          addressRegion: 'Santa Cruz de Tenerife',
          addressCountry: 'ES',
        },
        telephone: campus.telephone,
        sameAs: campus.sameAs,
      })),
    ],
  }
  return `<script type="application/ld+json" data-cep-jsonld="org">${JSON.stringify(graph)}</script>`
}

function ensureLangEs(html: string): string {
  if (/<html\b[^>]*\blang=/i.test(html)) {
    return html.replace(/<html\b([^>]*)>/i, (_full, attrs: string) => {
      if (/\blang=/i.test(attrs)) return `<html${attrs.replace(/\blang=(["']).*?\1/i, 'lang="es"')}>`
      return `<html lang="es"${attrs}>`
    })
  }
  return html.replace(/<html\b/i, '<html lang="es"')
}

function ensureJsonLd(html: string): string {
  if (/data-cep-jsonld="org"/i.test(html)) return html
  return upsertTag(html, /data-cep-jsonld="org"/i, organizationJsonLd())
}

export function rewritePublicSeo(
  html: string,
  pathname: string,
  origin = CANONICAL_PUBLIC_ORIGIN,
): string {
  if (!html.includes('<html') && !html.includes('<head')) return html
  html = rewriteFacebookPage(html)
  const path = normalizePath(pathname)
  const page = seoForPath(path)
  const canonicalPath = path === '/' ? '/' : path
  let next = ensureLangEs(html)
  next = ensureCanonical(next, `${origin}${canonicalPath}`)
  next = upsertNamedMeta(next, 'robots', 'index,follow,max-image-preview:large')
  next = upsertNamedMeta(next, 'googlebot', 'index,follow')
  next = upsertPropertyMeta(next, 'og:locale', 'es_ES')
  next = upsertPropertyMeta(next, 'og:type', 'website')
  next = upsertPropertyMeta(next, 'og:image', OG_IMAGE)
  next = upsertNamedMeta(next, 'twitter:card', 'summary_large_image')
  next = ensureJsonLd(next)
  next = next.replaceAll(SAAS_DESCRIPTION, page?.description || 'CEP Formación. Cursos y ciclos formativos en Tenerife.')
  if (page) {
    next = replaceTitle(next, page.title)
    next = upsertNamedMeta(next, 'description', page.description)
    next = upsertPropertyMeta(next, 'og:title', page.title)
    next = upsertPropertyMeta(next, 'og:description', page.description)
    next = upsertPropertyMeta(next, 'og:url', `${origin}${canonicalPath}`)
    next = upsertNamedMeta(next, 'twitter:title', page.title)
    return syncFlightTitle(next)
  }
  return syncFlightTitle(stripSaasTitle(next, 'CEP Formación'))
}

function dayOf(raw: string | null | undefined): string | null {
  if (!raw) return null
  const day = raw.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
}

/** Catalog generation time is the fetch day, not the date of the page. */
function entityLastmod(raw: string | null | undefined, generatedDay: string | null): string | null {
  const day = dayOf(raw)
  if (!day || day === generatedDay) return null
  return day
}

export function rewriteLegacyPublicLinks(html: string): string {
  return html.replace(
    new RegExp(
      `(\\b(?:href|content)=["'][^"']*?|https:\\/\\/cepformacion\\.com|"url"\\s*:\\s*"|\\\\"href\\\\":\\\\"|\\\\"url\\\\":\\\\")\\/p\\/(${LEGACY_PUBLIC_SECTION})\\b`,
      'g',
    ),
    '$1/$2',
  )
}

function pushPath(map: Map<string, SitemapEntry>, path: string, changefreq: string, lastmod: string | null): void {
  const normalized = publicCanonicalPath(path.startsWith('/') ? path.split('?')[0] : `/${path}`)
  if (!normalized || normalized.includes('/qa-')) return
  if (isHiddenPublicCyclePathSafe(normalized)) return
  if (!map.has(normalized)) map.set(normalized, { path: normalized, changefreq, lastmod })
}

function isHiddenPublicCyclePathSafe(path: string): boolean {
  const match = path.match(/\/(?:p\/)?ciclos\/([^/?#]+)/i)
  if (!match) return false
  try {
    return isHiddenPublicCycle(decodeURIComponent(match[1]))
  } catch {
    return isHiddenPublicCycle(match[1])
  }
}

export function sitemapEntriesFromSnapshot(snapshot: CatalogSnapshot | null): SitemapEntry[] {
  const generatedDay = dayOf(snapshot?.meta.generatedAt)
  const map = new Map<string, SitemapEntry>()
  for (const path of STATIC_PATHS) pushPath(map, path, path === '/' ? 'daily' : 'weekly', null)
  if (!snapshot) return [...map.values()]
  for (const course of snapshot.data.courses || []) {
    if (course.slug) {
      pushPath(
        map,
        `/cursos/${course.slug}`,
        'weekly',
        entityLastmod(course.updated_at || course.created_at, generatedDay),
      )
    }
  }
  for (const cycle of snapshot.data.cycles || []) {
    if (cycle.slug) pushPath(map, `/ciclos/${cycle.slug}`, 'weekly', null)
  }
  for (const item of snapshot.data.convocatorias || []) {
    if (item.codigo) {
      pushPath(map, `/convocatorias/${item.codigo}`, 'weekly', entityLastmod(item.updatedAt, generatedDay))
    }
  }
  for (const campus of snapshot.data.campuses || []) {
    if (campus.slug) pushPath(map, `/sedes/${campus.slug}`, 'weekly', null)
  }
  for (const entry of snapshot.data.sitemap || []) {
    if (!entry?.path || entry.path === '/') continue
    pushPath(map, entry.path, entry.changefreq || 'weekly', entityLastmod(entry.lastmod, generatedDay))
  }
  return [...map.values()]
}

export function sitemapXml(entries: SitemapEntry[], origin = CANONICAL_PUBLIC_ORIGIN): string {
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${origin}${entry.path}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
  </url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
}

export function catalogHasIndexableEntities(snapshot: CatalogSnapshot | null | undefined): boolean {
  if (!snapshot) return false
  return (
    (snapshot.data.courses?.length || 0) +
      (snapshot.data.cycles?.length || 0) +
      (snapshot.data.convocatorias?.length || 0) +
      (snapshot.data.campuses?.length || 0) >=
    3
  )
}
