import { describe, expect, it } from 'vitest'
import { rewriteAboutPage } from './about-page'

const about = `<!doctype html><html><head><title>Quiénes somos | CEP Formación</title></head><body>
<main class="flex-1">
<div class="bg-white text-gray-900">
<section><h1>Formación profesional con propósito y trayectoria en Tenerife</h1></section>
<section><h2>Nuestra historia</h2><p>CEP Formación nace con una visión clara: ofrecer formación útil, actualizada y orientada a resultados profesionales.</p></section>
<section><h3>Cómo trabajamos</h3><h3>Empleabilidad real</h3></section>
<section><h2>Nuestras sedes</h2>
<article><h3>CEP Sur</h3><p></p><a>Visitar sede</a></article>
</section>
</div>
</main>
</body></html>`

describe('rewriteAboutPage', () => {
  function visible(html: string): string {
    const lock = html.indexOf('<script data-cep-about-lock="1">')
    return lock === -1 ? html : html.slice(0, lock)
  }

  it('rebuilds the about page with the Cursos Tenerife history and campus facts', () => {
    const html = rewriteAboutPage(about)
    const body = visible(html)
    expect(html).toContain('data-cep-about="1"')
    expect(html).toContain('data-cep-about-lock="1"')
    expect(html).toContain('createElement')
    expect(html).not.toContain('innerHTML')
    expect(body).toContain('>Quiénes somos</h1>')
    expect(body).toContain('Formación profesional con propósito y trayectoria en Tenerife')
    expect(body).toContain('séptima generación')
    expect(body).toContain('Fran de Amo Olivier y Carol de Amo Olivier')
    expect(body).toContain('CEP Norte')
    expect(body).toContain('CEP Santa Cruz')
    expect(body).toContain('CEP Sur')
    expect(body).toContain('ADEPAC')
    expect(body).toContain('FUNDAE')
    expect(body).toContain('Higiene Bucodental')
    expect(body).toContain('href="/sedes/sede-norte"')
    expect(body).toContain('href="/sedes/cep-sur"')
    expect(body).toContain('href="/p/contacto"')
    expect(body).toContain('Premios Nacionales de Educación')
    expect(body).toContain('/website/cep/aproem/premios-nacionales-educacion-aproem.jpeg')
    expect(body).toContain('id="reconocimiento"')
    expect(body).not.toContain('nace con una visión clara')
    expect(body).not.toContain('Empleabilidad real')
    expect(body).not.toContain('<a>Visitar sede</a>')
  })

  it('is a no-op on other pages and idempotent on about', () => {
    const home = '<html><head><title>CEP Formación</title></head><body><main><h1>Inicio</h1></main></body></html>'
    expect(rewriteAboutPage(home)).toBe(home)
    const once = rewriteAboutPage(about)
    expect(rewriteAboutPage(once)).toBe(once)
  })
})
