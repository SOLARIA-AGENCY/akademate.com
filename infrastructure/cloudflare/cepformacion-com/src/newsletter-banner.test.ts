import { describe, expect, it } from 'vitest'
import { injectNewsletterBanner, showsNewsletterBanner } from './newsletter-banner'

const page = '<main>Curso</main><footer>CEP</footer>'

describe('newsletter banner', () => {
  it('shows on the public sections and stays off the rest', () => {
    expect(showsNewsletterBanner('/')).toBe(true)
    expect(showsNewsletterBanner('/cursos')).toBe(true)
    expect(showsNewsletterBanner('/cursos/auxiliar-farmacia')).toBe(true)
    expect(showsNewsletterBanner('/convocatorias')).toBe(true)
    expect(showsNewsletterBanner('/sedes/sede-norte')).toBe(true)
    expect(showsNewsletterBanner('/quienes-somos')).toBe(true)
    expect(showsNewsletterBanner('/colabora')).toBe(true)
    for (const tipo of [
      'trabaja-con-nosotros',
      'practicas-en-cep',
      'imparte-formacion',
      'proyecto-colaborativo',
      'empresa-practicas',
      'formacion-empresas',
    ]) {
      expect(showsNewsletterBanner(`/colabora?tipo=${tipo}`)).toBe(true)
      expect(showsNewsletterBanner(`/colabora?tipo=${tipo}#solicitud`)).toBe(true)
    }
    expect(showsNewsletterBanner('/p/cursos')).toBe(true)
    expect(showsNewsletterBanner('/transparencia')).toBe(false)
    expect(showsNewsletterBanner('/ciclos')).toBe(false)
    expect(showsNewsletterBanner('/campus')).toBe(false)
  })

  it('puts the home block under the campuses section', () => {
    const home = '<main><section class="bg-white"><h2>Nuestras sedes</h2></section><section class="teachers">Equipo</section><section class="bg-slate-950 text-white"><h2 class="mt-5">Solicita información</h2></section></main><footer>CEP</footer>'
    const html = injectNewsletterBanner(home, '/')
    const block = html.indexOf('data-cep-newsletter="1"')
    const sedesEnd = html.indexOf('</section>')
    expect(block).toBeGreaterThan(sedesEnd)
    expect(block).toBeLessThan(html.indexOf('Equipo'))
    expect(html.indexOf('>Solicita información</h2>')).toBeGreaterThan(block)
  })

  it('places a content-sized subscribe button before the footer', () => {
    const html = injectNewsletterBanner(page, '/convocatorias')
    expect(html.indexOf('data-cep-newsletter="1"')).toBeLessThan(html.indexOf('<footer'))
    expect(html).toContain('>Quiero suscribirme</button>')
    expect(html).toContain('Suscríbete y recibe la oferta del mes')
    expect(html).toContain('.cep-news button{width:auto;')
    expect(html).toContain('cep-news-photo')
    expect(html).toContain('/website/cep/newsletter/tenerife.jpg')
    expect(html).toContain('/website/cep/newsletter/recepcion-vacia.jpg')
    expect(html).toContain('0.9fr_1.1fr')
    expect(html).not.toContain('[200,700,1500,3000]')
    expect(html).toContain('min-height:32rem')
    expect(html).toContain("lead_type:'newsletter'")
    expect(injectNewsletterBanner(html, '/convocatorias')).toBe(html)
  })

  it('leaves pages outside the list untouched', () => {
    expect(injectNewsletterBanner(page, '/legal/privacidad')).toBe(page)
  })
})
