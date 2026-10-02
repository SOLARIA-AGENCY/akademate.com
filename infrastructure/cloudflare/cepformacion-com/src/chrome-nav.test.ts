import { describe, expect, it } from 'vitest'
import { placeCampusOnPortalNav, rewriteChromeNav } from './chrome-nav'

const page = `<!doctype html><html><body>
<header><nav class="hidden lg:flex items-center gap-3">
<a href="/aproem" class="text-sm font-medium text-gray-600 brand-hover transition-colors">APROEM</a>
<a href="/#nuevas-formaciones" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Nuevas formaciones</a>
<a href="/colabora" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Colabora</a>
<a href="/empleo" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Bolsa de trabajo</a>
<a href="/blog" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Blog</a>
<a href="/noticias" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Noticias</a>
<a href="/faq" class="text-sm font-medium text-gray-600 brand-hover transition-colors">FAQ</a>
<a href="/campus" class="brand-btn">Campus</a>
</nav></header>
<footer>
<div>
<h3 class="text-sm font-semibold text-slate-900">Participa</h3>
<ul class="mt-4 space-y-2.5 text-sm font-semibold text-slate-700">
<li><a href="/colabora?tipo=trabaja-con-nosotros">Trabaja con nosotros</a></li>
</ul>
</div>
<nav aria-label="Páginas legales">
<a href="/p/legal/privacidad">Privacidad</a>
</nav>
</footer>
</body></html>`

describe('rewriteChromeNav', () => {
  it('drops header items from the flight and renames the jobs link', () => {
    const flight = `<script>self.__next_f.push([1,"{\\"label\\":\\"Sedes\\",\\"href\\":\\"/sedes\\",\\"kind\\":\\"link\\",\\"source\\":\\"$undefined\\",\\"children\\":\\"$undefined\\"},{\\"label\\":\\"FAQ\\",\\"href\\":\\"/faq\\",\\"kind\\":\\"link\\",\\"source\\":\\"$undefined\\",\\"children\\":\\"$undefined\\"},{\\"label\\":\\"Bolsa de empleo\\",\\"href\\":\\"/empleo\\"},{\\"children\\":\\"Bolsa de empleo\\"}"])</script>`
    const html = rewriteChromeNav(`<!doctype html><html><body><header><nav><a href="/sedes">Sedes</a></nav></header><footer></footer>${flight}</body></html>`)
    const payload = html.slice(html.indexOf('self.__next_f'), html.indexOf('</script>', html.indexOf('self.__next_f')))
    expect(payload).toContain('\\"label\\":\\"Sedes\\"')
    expect(payload).not.toContain('\\"label\\":\\"FAQ\\"')
    expect(payload).not.toContain('Bolsa de empleo')
    expect(payload).not.toContain('Bolsa de trabajo')
  })

  it('moves Blog into Participa and keeps APROEM out of the header', () => {
    const html = rewriteChromeNav(page)
    const visible = html.slice(0, html.indexOf('data-cep-chrome-nav-lock="1"'))
    const header = visible.slice(visible.indexOf('<header>'), visible.indexOf('</header>'))
    const footer = visible.slice(visible.indexOf('<footer>'), visible.indexOf('</footer>'))
    const participa = footer.slice(footer.indexOf('Participa'), footer.indexOf('</ul>'))
    expect(header).not.toContain('APROEM')
    expect(header).not.toContain('>Blog<')
    expect(header).not.toContain('>Noticias<')
    expect(header).not.toContain('>FAQ<')
    expect(header).not.toContain('Nuevas formaciones')
    expect(header).not.toContain('nuevas-formaciones')
    expect(header).toContain('Colabora')
    expect(footer).not.toContain('Páginas legales')
    expect(participa).toContain('href="/blog"')
    expect(participa).toContain('>Blog<')
    expect(participa).toContain('href="/noticias"')
    expect(participa).toContain('href="/faq"')
    expect(participa).toContain('>FAQ<')
    expect(html).toContain('data-cep-chrome-nav-lock="1"')
    expect(html).toContain('ensureParticipaBlog')
    expect(html).not.toContain('innerHTML')
  })

  it('adds Blog to Participa without duplicating APROEM in the legal nav', () => {
    const liveFooter = page.replace(
      '<a href="/p/legal/privacidad">Privacidad</a>',
      '<a href="/aproem">APROEM</a><a href="/p/legal">Centro legal</a><a href="/p/legal/privacidad">Privacidad</a>',
    )
    const html = rewriteChromeNav(liveFooter)
    const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'))
    const participa = footer.slice(footer.indexOf('Participa'), footer.indexOf('</ul>'))
    expect(footer).not.toContain('Páginas legales')
    expect(participa).toContain('href="/blog"')
    expect(footer.match(/href="\/aproem"/g)?.length ?? 0).toBe(0)
  })

  it('puts Noticias next to Blog in Información when the header loses it', () => {
    const info = `<!doctype html><html><body>
<header><nav>
<a href="/noticias">Noticias</a>
<a href="/faq">FAQ</a>
</nav></header>
<footer>
<div data-cep-footer="info"><h3 class="text-sm font-semibold text-slate-900">Información</h3>
<ul class="mt-4 space-y-2.5 text-sm font-semibold text-slate-700"><li><a href="/blog" class="transition brand-hover">Blog</a></li><li><a href="/faq" class="transition brand-hover">FAQ</a></li></ul></div>
</footer>
</body></html>`
    const html = rewriteChromeNav(info)
    const header = html.slice(html.indexOf('<header>'), html.indexOf('</header>'))
    const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'))
    const column = footer.slice(footer.indexOf('Información'), footer.indexOf('</ul>'))
    expect(header).not.toContain('>Noticias<')
    expect(header).not.toContain('>FAQ<')
    expect(column).toContain('href="/noticias"')
    expect(column.indexOf('href="/blog"')).toBeLessThan(column.indexOf('href="/noticias"'))
    expect(column.indexOf('href="/noticias"')).toBeLessThan(column.indexOf('href="/faq"'))
    expect(footer.match(/href="\/faq"/g)?.length).toBe(1)
    expect(html).toContain('ensureInfoLinks')
  })

  it('does not duplicate footer links', () => {
    const already = page
      .replace(
        '<ul class="mt-4 space-y-2.5 text-sm font-semibold text-slate-700">',
        '<ul class="mt-4 space-y-2.5 text-sm font-semibold text-slate-700"><li><a href="/blog">Blog</a></li>',
      )
      .replace(
        '<a href="/p/legal/privacidad">Privacidad</a>',
        '<a href="/aproem">APROEM</a><a href="/blog">Blog</a><a href="/p/legal/privacidad">Privacidad</a>',
      )
    const html = rewriteChromeNav(already)
    const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'))
    expect(footer).not.toContain('Páginas legales')
    expect(footer.match(/href="\/blog"/g)?.length).toBe(1)
  })

  it('keeps the header tree React hydrates and builds the tools bar after hydration', () => {
    const html = rewriteChromeNav(page)
    const header = html.slice(html.indexOf('<header>'), html.indexOf('</header>'))
    const nav = header.slice(header.indexOf('<nav'), header.indexOf('</nav>'))
    const lock = html.slice(html.indexOf('function ensureHeaderChrome'))
    expect(header).not.toContain('data-cep-header-tools')
    expect(nav).toContain('href="/campus"')
    expect(header).not.toContain('Buscar en cursos')
    expect(lock.indexOf('tools.appendChild(link)')).toBeLessThan(lock.indexOf('tools.appendChild(form)'))
    expect(lock.indexOf('tools.appendChild(form)')).toBeLessThan(lock.indexOf('nav.appendChild(campus)'))
    expect(html).toContain('afterHydration(start)')
    expect(html).toContain('html[data-cep-transparency-page] header div.flex.h-12 > nav{order:4;display:flex!important;flex:1 0 100%;flex-wrap:wrap;align-items:center;justify-content:flex-end')
  })

  it('moves Ver campus into the portal nav', () => {
    const portal = `<html data-cep-transparency-page="1"><header><nav>
<a href="/colabora">Colabora</a>
</nav><div data-cep-header-tools="1"><a href="/transparencia">Transparencia</a><a href="/campus" class="brand-btn">Ver campus</a></div></header></html>`
    const html = placeCampusOnPortalNav(portal)
    const header = html.slice(html.indexOf('<header>'), html.indexOf('</header>'))
    const nav = header.slice(header.indexOf('<nav'), header.indexOf('</nav>'))
    const tools = header.slice(header.indexOf('data-cep-header-tools'), header.indexOf('</header>'))
    expect(nav).toContain('href="/campus"')
    expect(header).not.toContain('Bolsa de trabajo')
    expect(tools).not.toContain('href="/campus"')
    expect(placeCampusOnPortalNav(html)).toBe(html)
  })

  it('is idempotent', () => {
    const once = rewriteChromeNav(page)
    expect(rewriteChromeNav(once)).toBe(once)
  })

  it('turns the bottom AI Act label into Transparencia and drops the bar', () => {
    const withAi = page.replace(
      '<nav aria-label="Páginas legales">',
      '<h3>Legal</h3><ul></ul><nav aria-label="Páginas legales">',
    ).replace(
      '<a href="/p/legal/privacidad">Privacidad</a>',
      '<a href="/legal/ia" class="transition hover:text-slate-950">Transparencia y AI Act</a>',
    )
    const html = rewriteChromeNav(withAi)
    const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'))
    expect(footer).toContain('href="/legal"')
    expect(footer).not.toContain('Páginas legales')
    expect(footer).not.toContain('Transparencia y AI Act')
    expect(footer).not.toContain('href="/legal/ia"')
    expect(html).toContain("link.textContent = 'Transparencia'")
    expect(html).toContain("setAttribute('aria-label', 'AI Act')")
  })

  it('puts the legal column beside Información and lists Transparencia', () => {
    const html = rewriteChromeNav(`<footer>
<div data-cep-sedes-footer="1"><h3>Sedes</h3><div class="mt-4"><p>Santa Cruz</p></div>
<div class="mt-8"><h3>Legal</h3><ul><li><a href="/legal/privacidad">Privacidad</a></li></ul><div aria-label="Información regulatoria">sello</div></div>
</div>
<div><h3>Oferta formativa</h3><ul><li><a href="/cursos">Cursos</a></li></ul></div>
<div><h3>Información</h3><ul><li><a href="/blog">Blog</a></li></ul></div>
</footer>`)
    const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'))
    const sedes = footer.slice(footer.indexOf('data-cep-sedes-footer'), footer.indexOf('Oferta formativa'))
    const infoAt = footer.indexOf('>Información<')
    const legalAt = footer.indexOf('>Legal<')
    expect(sedes).toContain('Santa Cruz')
    expect(sedes).not.toContain('>Legal<')
    expect(legalAt).toBeGreaterThan(infoAt)
    expect(footer.slice(infoAt, legalAt)).not.toContain('Oferta formativa')
    expect(footer).toContain('href="/transparencia"')
    expect(footer).toContain('>Transparencia<')
    expect(footer).toContain('Declaración de Accesibilidad APROEM')
    expect(footer).toContain('Declaración de Accesibilidad ACATEN 2020 SL')
    expect(footer).toContain('href="/transparencia/aproem/10-otros/declaracion-de-accesibilidad.pdf"')
    expect(footer).toContain('href="/transparencia/acaten/10-otros/declaracion-de-accesibilidad.odt"')
    expect(footer).toContain('(PDF)')
    expect(footer).toContain('(ODT)')
    expect(footer).toContain('Privacidad')
    expect(footer).toContain('Información regulatoria')
    expect(html).toContain('placeLegalBesideInfo')
    expect(html).not.toContain("marginTop = '2rem'")
  })

  it('leaves the header tools in place once Transparencia, search and campus are ordered', () => {
    const html = rewriteChromeNav(page)
    expect(html).toContain('function headerToolsSettled()')
    expect(html).toContain('if (headerToolsSettled())')
    expect(html).toContain("closest('#public-mobile-menu')")
  })
})
