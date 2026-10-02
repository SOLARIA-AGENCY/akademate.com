import { describe, expect, it } from 'vitest'
import { OLD_CAMPUS_URL, campusLandingHtml, embedCampusInSite, isCampusPath, rewriteCampusNav } from './campus'

describe('isCampusPath', () => {
  it('matches public campus landing and ignores the blocked dashboard campus', () => {
    expect(isCampusPath('/campus')).toBe(true)
    expect(isCampusPath('/campus/')).toBe(true)
    expect(isCampusPath('/campus-virtual')).toBe(false)
    expect(isCampusPath('/cursos')).toBe(false)
  })
})

describe('rewriteCampusNav', () => {
  it('turns the header Contacto CTA into Campus and leaves other contacto links', () => {
    const html = `<header>
      <a href="/p/contacto" class="top">info@cepformacion.com</a>
      <a href="/p/contacto" class="brand-btn" style="background-color:#f2014b">Contacto</a>
    </header></body></html>`
    const next = rewriteCampusNav(html)
    expect(next).toContain('>Ver campus</a>')
    expect(next).toContain('href="/campus"')
    expect(next).not.toMatch(/class="brand-btn"[^>]*>\s*Contacto/)
    expect(next).toContain('href="/p/contacto" class="top">info@cepformacion.com</a>')
    expect(next).toContain('data-cep-campus-nav-lock="1"')
    expect(next).not.toContain('innerHTML')
    expect(next.indexOf('data-cep-campus-nav-lock="1"')).toBeGreaterThan(next.indexOf('</header>'))
  })

  it('drops the akademate campus login link and keeps the red campus control', () => {
    const html = `<header>
      <a href="https://cepformacion-campus.akademate.com/login" class="border">Campus Virtual</a>
      <a href="/campus" class="brand-btn">Campus</a>
    </header></body></html>`
    const next = rewriteCampusNav(html)
    const visible = next.slice(0, next.indexOf('data-cep-campus-nav-lock="1"'))
    expect(visible).not.toContain('cepformacion-campus.akademate.com/login')
    expect(visible).not.toContain('Campus Virtual')
    expect(visible).toContain('href="/campus" class="brand-btn">Ver campus</a>')
  })

  it('rewrites the header flight and drops the white Acceso link', () => {
    const html = `<header><a href="/acceso" data-slot="public-header-login">Acceso</a><a href="/p/contacto" class="brand-btn">Contacto</a></header><script>{\\"cta\\":{\\"label\\":\\"Contacto\\",\\"href\\":\\"/contacto\\"},\\"login\\":{\\"label\\":\\"Acceso\\",\\"href\\":\\"/acceso\\"}}</script></body>`
    const next = rewriteCampusNav(html)
    const visible = next.slice(0, next.indexOf('data-cep-campus-nav-lock="1"'))
    expect(visible).toContain('>Ver campus</a>')
    expect(visible).not.toContain('href="/acceso"')
    expect(visible).toContain('\\"label\\":\\"Ver campus\\"')
    expect(visible).toContain('\\"login\\":null')
    expect(visible).not.toContain('\\"label\\":\\"Acceso\\"')
  })

  it('drops the footer Acceso link and keeps Ver campus', () => {
    const html = `<footer><ul><li><a href="/blog" class="transition brand-hover">Blog</a></li><li><a href="/acceso" class="transition brand-hover">Acceso</a></li><li><a href="/campus" class="transition brand-hover">Ver campus</a></li></ul></footer>`
    const next = rewriteCampusNav(html)
    const visible = next.slice(0, next.indexOf('data-cep-campus-nav-lock="1"'))
    expect(visible).not.toContain('href="/acceso"')
    expect(visible).not.toContain('>Acceso</a>')
    expect(visible).toContain('>Ver campus</a>')
    expect(visible).toContain('href="/blog"')
    expect(next).toContain("closest('footer')")
  })

  it('does not duplicate the lock script', () => {
    const once = rewriteCampusNav('<body><a href="/contacto">Contacto</a></body>')
    const twice = rewriteCampusNav(once)
    expect(twice.match(/data-cep-campus-nav-lock="1"/g)?.length).toBe(1)
  })
})

describe('campusLandingHtml', () => {
  it('shows a disabled new-campus login and a simple current-campus button', () => {
    const html = campusLandingHtml('/logo.png', '/favicon.svg')
    const visible = html.replaceAll(OLD_CAMPUS_URL, '')
    expect(html).toContain('Acceso al campus')
    expect(html).toContain('Próximamente acceso al nuevo campus')
    expect(html).toContain('Usuario o correo')
    expect(html).toContain('Contraseña')
    expect(html).toContain('Recuperar contraseña')
    expect(html).toContain('type="password"')
    expect(html).toContain('disabled')
    expect(html).toContain('Acceso a campus actual')
    expect(html).toContain(`href="${OLD_CAMPUS_URL}"`)
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('#f2014b')
    expect(html).toContain('#3E091A')
    expect(html).toContain('href="/"')
    expect(html).not.toContain('name="password"')
    expect(html).not.toContain('#2563eb')
    expect(visible.toLowerCase()).not.toContain('acaten')
    expect(visible).not.toContain('espacioaulavirtual')
    expect(visible).not.toContain('campus.cepformacion.com')
    expect(html).not.toContain('Bienvenido al campus virtual de CEP Formación')
  })
})

describe('embedCampusInSite', () => {
  it('keeps the site header and footer and only replaces the page body', () => {
    const html = `<!doctype html><html><head><title>Contacto</title><script src="/_next/static/chunk.js"></script></head><body>
<header><a href="/">CEP</a><nav><a href="/p/cursos">Cursos</a><a href="/p/contacto" class="brand-btn">Contacto</a></nav></header>
<main class="flex-1">formulario de contacto</main>
<footer>Sedes Santa Cruz Norte Privacidad</footer>
</body></html>`
    const next = embedCampusInSite(html, '/logo.png')
    expect(next).toContain('<header>')
    expect(next).toContain('<footer>')
    expect(next).toContain('Sedes Santa Cruz Norte Privacidad')
    expect(next).toContain('data-cep-campus-page="1"')
    expect(next).toContain('Acceso al campus')
    expect(next).toContain('Próximamente acceso al nuevo campus')
    expect(next).toContain('Acceso a campus actual')
    expect(next).toContain('<title>Campus virtual | CEP Formación</title>')
    expect(next).toContain('href="https://cepformacion.com/campus"')
    expect(next).toContain('data-cep-campus-css="1"')
    expect(next).toContain('data-cep-campus-page-lock="1"')
    expect(next).not.toContain('formulario de contacto')
    expect(next).not.toContain('/_next/static/chunk.js')
    expect(next).not.toContain('Volver a la web')
    expect(next).not.toContain('innerHTML')
    expect(next).not.toContain('name="password"')
    expect(next).not.toContain('#2563eb')
  })

  it('returns null when the origin page has no site chrome', () => {
    expect(embedCampusInSite('<html><body>akademate /p/contacto</body></html>', '/logo.png')).toBeNull()
  })
})
