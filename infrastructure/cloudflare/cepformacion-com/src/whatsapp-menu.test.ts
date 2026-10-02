import { describe, expect, it } from 'vitest'
import { rewriteWhatsAppMenu } from './whatsapp-menu'

const popup = `<div id="wa-popup"><div style="background:#25D366"><p style="margin:0;font-weight:700;font-size:16px">Akademate</p></div><div style="padding:12px"><a href="https://wa.me/34622416020"><span>CF</span><strong>CEP Norte</strong></a><a href="https://wa.me/34622736101"><span>CD</span><strong>CEP DESEMPLEADOS</strong></a><a href="https://wa.me/34618989648"><span>CS</span><strong>CEP Santa Cruz</strong></a><a href="https://wa.me/34620073492"><strong>CEP SUR</strong></a></div></div></body>`

describe('whatsapp menu', () => {
  it('orders Norte, Santa Cruz, Sur and desempleados last, with a page message and a round logo', () => {
    const html = rewriteWhatsAppMenu(popup)
    const norte = html.indexOf('CEP Norte')
    const santa = html.indexOf('CEP Santa Cruz')
    const courses = html.indexOf('CEP trabajadores desempleados y ocupados')
    const sur = html.indexOf('>CEP Sur<')
    expect(norte).toBeGreaterThan(0)
    expect(norte).toBeLessThan(santa)
    expect(santa).toBeLessThan(sur)
    expect(sur).toBeLessThan(courses)
    expect(html).toContain('34622736101')
    expect(html).toContain('34620073492')
    expect(html).toContain('cepformacion.com')
    expect(html).toContain('border-radius:999px')
    expect(html).toContain('/logos/cep-formacion-logo-rectangular.png')
    expect(html).toContain('data-cep-wa-menu-lock="1"')
    expect(html).toContain('data-cep-wa-toggle')
    expect(html).toContain('function contentPad')
    expect(html).toContain('data-cep-wa-watch')
    expect(html).not.toContain('if (!pad) return')
    expect(html).toContain('>CEP Formación</p>')
    expect(html).not.toContain('>Akademate<')
    expect(html).not.toContain('>CF<')
  })
})
