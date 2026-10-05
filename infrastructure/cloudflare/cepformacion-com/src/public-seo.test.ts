import { describe, expect, it } from 'vitest'
import {
  catalogHasIndexableEntities,
  rewriteLegacyPublicLinks,
  rewritePublicSeo,
  seoForPath,
  sitemapEntriesFromSnapshot,
  sitemapXml,
} from './public-seo'
import type { CatalogSnapshot } from './render'

const snapshot = {
  meta: {
    tenant: 'cep',
    host: 'cepformacion.akademate.com',
    generatedAt: '2026-09-09T12:00:00.000Z',
    version: 'origin-html',
    cacheTtlSeconds: 60,
  },
  data: {
    branding: { academyName: 'CEP Formación' },
    courses: [{ slug: 'canino', nombre: 'Adiestramiento' }],
    cycles: [
      { slug: 'cfgm-farmacia-parafarmacia', name: 'Farmacia' },
      { slug: 'qa-ciclo-omega-persistencia', name: 'QA' },
    ],
    convocatorias: [{ codigo: 'SC-2026-020' }],
    campuses: [{ slug: 'sede-santa-cruz', name: 'CEP Santa Cruz' }],
    teachers: [],
    sitemap: [{ path: '/', changefreq: 'daily', lastmod: '2026-09-03' }],
  },
} as CatalogSnapshot

describe('rewriteLegacyPublicLinks', () => {
  it('canonicalizes visible hrefs and the flight payload the client hydrates', () => {
    const html = `<a href="/p/cursos?tipo=privados">Cursos privados</a><script>self.__next_f.push([1,"{\\"href\\":\\"/p/cursos?tipo=privados\\"}"])</script><script>{"page":"/p/cursos"}</script>`
    const next = rewriteLegacyPublicLinks(html)
    expect(next).toContain('href="/cursos?tipo=privados"')
    expect(next).toContain('\\"href\\":\\"/cursos?tipo=privados\\"')
    expect(next).toContain('"page":"/p/cursos"')
  })
})

describe('public SEO rewrite', () => {
  it('maps Tenerife titles for listing routes', () => {
    expect(seoForPath('/').title).toContain('Tenerife')
    expect(seoForPath('/').description).toContain('CEP Norte')
    expect(seoForPath('/contacto').title).toContain('Tenerife')
    expect(seoForPath('/p/contacto').title).toContain('Tenerife')
    expect(seoForPath('/cursos')?.description).toContain('CEP Sur')
    expect(seoForPath('/site/sedes')?.title).toContain('Tenerife')
  })

  it('replaces SaaS title, description and missing canonical on home', () => {
    const html = `<!doctype html><html><head>
<title>CEP Formación, Plataforma Educativa</title>
<meta name="description" content="Gestion integral para centros de formacion con branding, campus virtual y operaciones SaaS.">
</head><body><h1>Home</h1></body></html>`
    const next = rewritePublicSeo(html, '/')
    expect(next).toContain('<title>CEP Formación | Cursos y FP en Tenerife</title>')
    expect(next).toContain('CEP Santa Cruz, CEP Norte y CEP Sur')
    expect(next).toContain('<link rel="canonical" href="https://cepformacion.com/">')
    expect(next).not.toContain('Plataforma Educativa')
    expect(next).not.toContain('operaciones SaaS')
    expect(next).not.toContain('—')
    expect(next).toContain('name="robots" content="index,follow,max-image-preview:large"')
    expect(next).toContain('data-cep-jsonld="org"')
    expect(next).toContain('CEP Santa Cruz')
    expect(next).toContain('38005')
    expect(next).toContain('EducationalOrganization')
    expect(next).toContain('sameAs')
    expect(next).toContain('https://www.facebook.com/cepsantacruz')
    expect(next).toContain('https://cursostenerife.es/')
    expect(next).toContain('https://cepsur.es/')
    expect(next).toContain('CEP Formaci')
    expect(next).not.toContain('CIF')
    expect(next).toContain('lang="es"')
  })

  it('copies the home title into the Next flight so hydration matches', () => {
    const html = `<!doctype html><html><head>
<title>CEP FORMACIÓN — Plataforma Educativa</title>
</head><body><script>self.__next_f.push([1,"children\\":\\"CEP FORMACIÓN — Plataforma Educativa\\""])</script></body></html>`
    const next = rewritePublicSeo(html, '/')
    expect(next).toContain('<title>CEP Formación | Cursos y FP en Tenerife</title>')
    expect(next).toContain('CEP Formación | Cursos y FP en Tenerife')
    expect(next).not.toContain('Plataforma Educativa')
  })

  it('puts the Facebook page in the footer contact list', () => {
    const html = `<!doctype html><html><head><title>CEP</title></head><body>
<ul><li>Email: <a href="/cdn-cgi/l/email-protection#abc" class="font-semibold text-[#f2014b] hover:underline"><span class="__cf_email__" data-cfemail="abc">[email&#160;protected]</span></a></li><li>Horario: L-V 10:00-14:00 y 16:00-20:00</li></ul>
</body></html>`
    const next = rewritePublicSeo(html, '/contacto')
    expect(next).toContain('href="https://www.facebook.com/cepsantacruz"')
    expect(next).toContain('>facebook.com/cepsantacruz</a>')
    const footer = next.slice(next.indexOf('>Email:'))
    expect(footer).toContain('facebook.com/cepsantacruz')
  })

  it('expands sitemap from catalog entities and drops QA ciclos', () => {
    const entries = sitemapEntriesFromSnapshot(snapshot)
    const paths = entries.map((entry) => entry.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/cursos')
    expect(paths).toContain('/cursos/canino')
    expect(paths).toContain('/ciclos/cfgm-farmacia-parafarmacia')
    expect(paths).toContain('/convocatorias/SC-2026-020')
    expect(paths).toContain('/sedes/sede-santa-cruz')
    expect(paths).not.toContain('/ciclos/qa-ciclo-omega-persistencia')
    expect(paths.some((path) => path.startsWith('/p/'))).toBe(false)
    expect(catalogHasIndexableEntities(snapshot)).toBe(true)
    expect(sitemapXml(entries)).toContain('https://cepformacion.com/cursos/canino')
    expect(sitemapXml(entries)).not.toContain('<lastmod>2026-09-09</lastmod>')
  })

  it('uses the course date and ignores the catalog generation day', () => {
    const dated = {
      ...snapshot,
      data: {
        ...snapshot.data,
        courses: [{ slug: 'canino', nombre: 'Adiestramiento', updated_at: '2026-08-02T10:00:00.000Z' }],
      },
    } as CatalogSnapshot
    const course = sitemapEntriesFromSnapshot(dated).find((entry) => entry.path === '/cursos/canino')
    expect(course?.lastmod).toBe('2026-08-02')
    const home = sitemapEntriesFromSnapshot(dated).find((entry) => entry.path === '/')
    expect(home?.lastmod).toBeNull()
  })
})
