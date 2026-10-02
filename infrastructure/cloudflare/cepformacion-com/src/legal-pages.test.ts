import { describe, expect, it } from 'vitest'
import { applyHomeFooter, applyHomeHeader, freezeTransparencyHub, injectTransparencyHubPicker, isTransparencyFilePath, isTransparencyHub, isTransparencyPortalPath, legalPageId, lightenTransparencyPortal, markTransparencyPage, paintPublicNotFound, rewriteLegalPages, rewriteTransparencyAssets, separateTransparencySections, stampTransparencyUpdated, transparencyFileHeaders } from './legal-pages'

const shell = `<!doctype html><html><body>
<header>CEP</header>
<main class="flex-1"><section class="rounded-2xl border border-amber-200 bg-amber-50"><h2>Inventario verificable</h2><p>SOLARIA AGENCY OÜ. Esta política no afirma que todos los proveedores configurables estén activos.</p></section></main>
<script src="/_next/static/chunks/app/(public)/p/legal/privacidad/page.js"></script>
<script>self.__next_f.push(1)</script>
<footer>Información regulatoria; no constituye certificación.</footer>
</body></html>`

describe('legal pages', () => {
  it('recognizes public and internal legal paths', () => {
    expect(legalPageId('/legal')).toBe('index')
    expect(legalPageId('/legal/privacidad')).toBe('privacidad')
    expect(legalPageId('/p/legal/cookies/')).toBe('cookies')
    expect(legalPageId('/legal/transparencia')).toBe('transparencia')
    expect(legalPageId('/legal/accesibilidad')).toBe('accesibilidad')
    expect(legalPageId('/legal/portal')).toBeNull()
    expect(isTransparencyHub('/transparencia')).toBe(true)
    expect(isTransparencyPortalPath('/transparencia/aproem')).toBe(true)
    expect(isTransparencyFilePath('/transparencia/acaten/09-subvenciones/2024-subvencion-del-ministerio-de-trabajo-a.pdf')).toBe(true)
    expect(isTransparencyFilePath('/transparencia/acaten')).toBe(false)
    expect(transparencyFileHeaders('/transparencia/acaten/09-subvenciones/2024-subvencion-del-ministerio-de-trabajo-a.pdf').get('content-type')).toBe('application/pdf')
    expect(isTransparencyPortalPath('/legal/transparencia')).toBe(false)
    const marked = markTransparencyPage('<html lang="es"><body></body></html>')
    expect(marked).toContain('<html data-cep-transparency-page="1" lang="es">')
    expect(markTransparencyPage(marked)).toBe(marked)
    expect(legalPageId('/cursos')).toBeNull()
  })

  it('serves a portal page without the Next bundle', () => {
    const page = `<html><head><link rel="stylesheet" href="/_next/static/css/a.css"><link rel="preload" as="script" href="/_next/static/chunks/w.js"></head><body><div data-transparency-portal="aproem"></div><script src="/_next/static/chunks/main.js"></script><script>self.__next_f.push(1)</script><script data-cep-keep="1">keep()</script></body></html>`
    const html = lightenTransparencyPortal(page)
    expect(html).not.toContain('__next_f')
    expect(html).not.toContain('/_next/static/chunks')
    expect(html).toContain('rel="stylesheet"')
    expect(html).toContain('data-cep-keep="1"')
    expect(html).toContain('data-cep-portal-runtime="1"')
    expect(html).toContain('[data-portal-document]')
    expect(html).toContain('/api/transparencia/visitas')
    expect(html).toContain('collapsible-trigger')
    expect(html).toContain('cloneNode(true)')
    expect(html).not.toContain('innerHTML')
    expect(lightenTransparencyPortal(html)).toBe(html)
    const hub = lightenTransparencyPortal('<html><body><h1>Hub</h1><script>self.__next_f.push(1)</script></body></html>')
    expect(hub).not.toContain('__next_f')
    expect(hub).not.toContain('data-cep-portal-runtime')
  })

  it('replaces the portal header with the home header', () => {
    const page = '<html><body><header>Portal</header><main>ok</main></body></html>'
    const home = '<html><body><header class="home"><nav><a href="/">Inicio</a></nav></header></body></html>'
    const html = applyHomeHeader(page, home)
    expect(html).toContain('data-cep-home-header="1"')
    expect(html).toContain('href="/"')
    expect(html).toContain('>Inicio<')
    expect(html).not.toContain('>Portal<')
    expect(html).toContain('data-cep-home-header-pin="1"')
    expect(applyHomeHeader(html, home)).toBe(html)
  })

  it('replaces the legal main with continuous text and drops Solaria and warning boxes', () => {
    const html = rewriteLegalPages(shell, '/legal/cookies')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    expect(main).toContain('Política de cookies')
    expect(main).toContain('Google Analytics 4')
    expect(main).toContain('Píxel de Meta')
    expect(main).not.toContain('Inventario verificable')
    expect(main).not.toContain('amber-')
    expect(main).not.toContain('SOLARIA')
    expect(main).not.toContain('proveedores configurables')
    expect(html).not.toContain('no constituye certificación')
    expect(html).toContain('data-cep-legal-lock="1"')
    expect(html).not.toContain('/_next/static/chunks/')
    expect(html).not.toContain('__next_f')
    expect(main).toContain('cep_cookie_consent_v1')
    expect(main).toContain('_fbp')
    expect(main).toContain('G-ZPBEY6SHX9')
  })

  it('leaves the designed transparency portal and its scripts in place', () => {
    const html = rewriteLegalPages(shell, '/transparencia')
    expect(html).toContain('/_next/static/chunks/')
    expect(html).toContain('__next_f')
    expect(html).not.toContain('data-cep-legal-lock')
    const absolute = html.replace('/_next/', 'https://cepformacion-staging.akademate.com/_next/')
    const withAssets = rewriteTransparencyAssets(absolute, 'https://cepformacion-staging.akademate.com')
    expect(withAssets).toContain('/_next/static/chunks/')
    expect(withAssets).not.toContain('cepformacion-staging.akademate.com/_next/')
    const linked = rewriteTransparencyAssets(
      '<a href="https://origin.cepformacion.com/transparencia/aproem/10-otros/a.pdf">pdf</a>',
      'https://origin.cepformacion.com',
    )
    expect(linked).toContain('https://cepformacion.com/transparencia/aproem/10-otros/a.pdf')
    expect(linked).not.toContain('origin.cepformacion.com')
    expect(rewriteLegalPages(shell, '/transparencia/aproem')).toContain('__next_f')
  })

  it('replaces the quiet hub cards with a sede selector', () => {
    const hub = `<article><h1>Portal de transparencia</h1><p class="mt-3 max-w-2xl text-sm">texto</p><ul class="mt-6 grid gap-4 sm:grid-cols-2"><li>Abrir portal</li></ul></article>`
    const html = injectTransparencyHubPicker(hub)
    expect(html).toContain('data-cep-portal-picker')
    expect(html).toContain('31 de Diciembre de 2025')
    expect(html).toContain('href="/transparencia/aproem"')
    expect(html).toContain('href="/transparencia/acaten"')
    expect(html).toContain('min-height:calc(100svh - 8rem)')
    expect(html).not.toContain('<select')
    expect(html).not.toContain('Abrir portal')
    expect(injectTransparencyHubPicker(html)).toBe(html)
    const dropdown = '<article><h1>Portal de transparencia</h1><form data-cep-portal-picker="1" action="/transparencia/aproem"><label>Elige la sede</label><select id="cep-portal-sede"><option value="/transparencia/aproem">APROEM</option></select><button>Ver transparencia</button></form></article>'
    const cards = injectTransparencyHubPicker(dropdown)
    expect(cards).toContain('href="/transparencia/aproem"')
    expect(cards).toContain('href="/transparencia/acaten"')
    expect(cards).not.toContain('<select')
    expect(cards).not.toContain('Elige la sede')
    expect(injectTransparencyHubPicker(cards)).toBe(cards)
    const frozen = freezeTransparencyHub(`${hub}<script>self.__next_f.push(1)</script>`)
    expect(frozen).toContain('href="/transparencia/acaten"')
    expect(frozen).not.toContain('__next_f')
  })

  it('stamps the portal update date', () => {
    const html = stampTransparencyUpdated('<h1>Portal de transparencia de APROEM</h1><p class="mt-2 text-sm leading-normal text-muted-foreground">Actualizado el <time dateTime="2026-09-29">29 de septiembre de 2026</time></p><p class="text-sm leading-normal text-muted-foreground">Datos a <time dateTime="2025-12-31">31 de diciembre de 2025</time></p><p data-transparency-count="true">27 documentos</p><p class="text-sm leading-normal text-muted-foreground">4<!-- --> <!-- -->documentos</p><a>PDF<span class="text-muted-foreground">12 KB</span></a><li><a href="#apartado-normativa-aplicable"><span>Normativa aplicable</span></a></li><h2 class="text-base font-semibold leading-snug"><span>Normativa aplicable</span></h2><div data-transparency-portal="aproem"><span data-portal-document="Declaración de Accesibilidad de la web" data-pending="true"><span data-slot="badge">PENDIENTE</span></span></span></div>')
    expect(html).toContain('PORTAL DE TRANSPARENCIA (actualizado a 31 de Diciembre de 2025)')
    expect(html).not.toContain('septiembre de 2026')
    expect(html).not.toContain('27 documentos')
    expect(html).not.toContain('documentos')
    expect(html).not.toContain('12 KB')
    expect(html).toContain('>(PDF)</a>')
    expect(html).not.toContain('>PDF</a>')
    expect(html).not.toContain('Normativa aplicable')
    expect(html).toContain('href="/transparencia/aproem/10-otros/declaracion-de-accesibilidad.pdf"')
    expect(html).toContain('(ODT)')
    expect(html).not.toContain('PENDIENTE')
  })

  it('spaces transparency section cards without joining them', () => {
    const html = separateTransparencySections('<html><head></head><body><div data-transparency-tree></div></body></html>')
    expect(html).toContain('data-cep-transparency-gap')
    expect(html).toContain('gap:1.75rem')
    expect(separateTransparencySections(html)).toBe(html)
  })

  it('paints a public 404 inside the site shell', () => {
    const shell = '<html><head><title>Inicio</title></head><body><header>Menú</header><main class="flex-1"><h1>Home</h1></main><footer>Pie</footer><script>self.__next_f.push(1)</script></body></html>'
    const html = paintPublicNotFound(shell)
    expect(html).toContain('Página no encontrada')
    expect(html).toContain('<header>Menú</header>')
    expect(html).toContain('<footer>Pie</footer>')
    expect(html).toContain('Volver al inicio')
    expect(html).not.toContain('Ir al dashboard')
    expect(html).not.toContain('__next_f')
    expect(html).not.toContain('<h1>Home</h1>')
  })

  it('names Brevo, the 14-day withdrawal and unpublished subsidy documents', () => {
    const privacy = rewriteLegalPages(shell, '/legal/privacidad')
    const terms = rewriteLegalPages(shell, '/legal/terminos')
    const providers = rewriteLegalPages(shell, '/legal/subencargados')
    const transparency = rewriteLegalPages(shell, '/legal/transparencia')
    const access = rewriteLegalPages(shell, '/legal/accesibilidad')
    expect(privacy).toContain('artículo 7 de la Ley Orgánica 3/2018')
    expect(privacy).toContain('APROEM, que gestiona esa subvención')
    expect(terms).toContain('14 días naturales')
    expect(terms).toContain('tomo 3660')
    expect(providers).toContain('Brevo (Sendinblue)')
    expect(transparency).toContain('mailto:info@cursostenerife.es')
    expect(transparency).toContain('no se publican en esta web')
    expect(transparency).not.toContain('cep-redacted')
    expect(transparency).not.toContain('no constan todavía')
    expect(access).toContain('parcialmente conforme')
    expect(access).toContain('WCAG 2.2')
    expect(access).toContain('EFQM 500')
    expect(access).toContain('ISO 18000')
    expect(access).not.toContain('No es un sello') 
    expect(`${privacy}${terms}${providers}${transparency}${access}`).not.toMatch(/SOLARIA|Solaria/)
  })

  it('renders transparency when the origin page has no main', () => {
    const html = rewriteLegalPages('<html><body><h1>404</h1></body></html>', '/legal/transparencia')
    expect(html).toContain('data-cep-legal-rendered="transparencia"')
    expect(html).toContain('mailto:info@cursostenerife.es')
  })

  it('removes the Next.js 404 screen from a legal page', () => {
    const shell = `<html><head><meta name="robots" content="noindex"/><title>404: This page could not be found.</title></head><body><div style="font-family:system-ui;height:100vh;text-align:center;display:flex"><div><h1 class="next-error-h1">404</h1><div><h2>This page could not be found.</h2></div></div></div></body></html>`
    const html = rewriteLegalPages(shell, '/legal/transparencia')
    expect(html).not.toContain('next-error-h1')
    expect(html).not.toContain('This page could not be found')
    expect(html).not.toContain('noindex')
    expect(html).toContain('Transparencia de la formación subvencionada | CEP Formación')
    expect(html).toContain('mailto:info@cursostenerife.es')
  })

  it('uses the homepage footer on the portal', () => {
    const home = `<html><head></head><body><footer class="border-t"><div class="bg-slate-50 py-12"><h3>Sedes</h3><h3>Información</h3><h3>Legal</h3><a href="/transparencia">Transparencia</a></div></footer><style data-cep-gbp-open="1">footer{display:grid}</style></body></html>`
    const page = `<html><head></head><body><main>Buscar documento</main><footer><h3>Oferta formativa</h3></footer></body></html>`
    const html = applyHomeFooter(page, home)
    expect(html).toContain('data-cep-home-footer="1"')
    expect(html).toContain('>Sedes<')
    expect(html).toContain('href="/transparencia"')
    expect(html).toContain('Buscar documento')
    expect(html).not.toContain('>Oferta formativa<')
    expect(html).toContain('data-cep-gbp-open="1"')
    expect(html).toContain('data-cep-home-footer-pin')
    expect(html).not.toContain('innerHTML')
    expect(applyHomeFooter(html, home)).toBe(html)
  })

  it('does not duplicate the lock', () => {
    const once = rewriteLegalPages(shell, '/legal/privacidad')
    const twice = rewriteLegalPages(once, '/legal/privacidad')
    expect(twice.match(/data-cep-legal-lock="1"/g)?.length).toBe(1)
    expect(twice).toContain('B70729272')
    expect(twice).toContain('ACATEN 2020 S.L.')
    expect(twice).not.toMatch(/SOLARIA|Solaria/)
  })
})
