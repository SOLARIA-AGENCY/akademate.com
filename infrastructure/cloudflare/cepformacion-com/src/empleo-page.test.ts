import { describe, expect, it } from 'vitest'
import { rewriteEmpleoPage } from './empleo-page'

describe('rewriteEmpleoPage', () => {
  it('restores the agency page from the copy already in the repo', () => {
    const html = rewriteEmpleoPage('<html><body><main><p>corta</p></main><footer>pie</footer></body></html>', '/empleo')
    const visible = html.slice(0, html.indexOf('data-cep-empleo-lock="1"'))
    expect(visible).toContain('0500000212')
    expect(visible).toContain('ACATEN 2020 S.L')
    expect(visible).toContain('922 219 257')
    expect(visible).toContain('carmen.diaz@cursostenerife.es')
    expect(visible).toContain('Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife')
    expect(visible).toContain('/website/cep/empleo/bolsa-empleo-oficina.jpg')
    expect(visible).toContain('Para candidatos')
    expect(visible).toContain('Para empresas')
    expect(visible).not.toContain('>corta<')
    expect(visible).toContain('<footer>pie</footer>')
    expect(rewriteEmpleoPage(html, '/cursos')).toBe(html)
  })
})
