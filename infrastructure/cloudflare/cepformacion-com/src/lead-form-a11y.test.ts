import { describe, expect, it } from 'vitest'
import { rewriteLeadFormHtml, rewriteLeadFormScript } from './lead-form-a11y'

const script = `(0,n.jsx)(s.p,{type:"text",required:!0,placeholder:"Nombre completo *",value:b}),(0,n.jsx)(s.p,{type:"email",required:!0,placeholder:"Email *",value:x}),(0,n.jsx)(s.p,{type:"tel",required:!0,placeholder:"Telefono *",value:_})`

describe('lead form accessibility', () => {
  it('adds hidden names and autocomplete in the client bundle', () => {
    const next = rewriteLeadFormScript(script)
    expect(next).toContain('autoComplete:"name","aria-label":"Nombre completo"')
    expect(next).toContain('autoComplete:"email","aria-label":"Correo electrónico"')
    expect(next).toContain('autoComplete:"tel","aria-label":"Teléfono"')
    expect(rewriteLeadFormScript(next)).toBe(next)
  })

  it('marks the same fields in the html and darkens only the form notice', () => {
    const html = `<html><head></head><body><form><input placeholder="Nombre completo *" /><input placeholder="Email *" /><input placeholder="Telefono *" /><p class="text-xs text-gray-400 text-center">Sin compromiso.</p><script src="/_next/static/chunks/app.js"></script></form></body></html>`
    const next = rewriteLeadFormHtml(html)
    expect(next).toContain('autocomplete="name" aria-label="Nombre completo"')
    expect(next).toContain('autocomplete="tel" aria-label="Teléfono"')
    expect(next).toContain('color:#6b7280')
    expect(next).toContain('/_next/static/chunks/app.js?cep=lead1"')
    expect(rewriteLeadFormHtml(next)).toBe(next)
  })

  it('names the home fields in the html and in the flight', () => {
    const html = '<html><body><input placeholder="Nombre" data-oid="a"/><input placeholder="Email" data-oid="b"/><textarea placeholder="Cuéntanos qué formación te interesa" data-oid="c"></textarea><script>self.__next_f.push([1,"{\\"placeholder\\":\\"Nombre\\",\\"data-oid\\":\\"a\\"}"])</script></body></html>'
    const next = rewriteLeadFormHtml(html)
    expect(next).toContain('placeholder="Nombre" id="cep-nombre" name="nombre" autocomplete="name"')
    expect(next).toContain('placeholder="Email" id="cep-email" name="email"')
    expect(next).toContain('id="cep-mensaje" name="mensaje"')
    expect(next).toContain('\\"id\\":\\"cep-nombre\\",\\"name\\":\\"nombre\\"')
    expect(rewriteLeadFormHtml(next)).toBe(next)
  })

  it('leaves pages without that form alone', () => {
    const html = '<html><head></head><body><p class="text-gray-400">Inicio</p></body></html>'
    expect(rewriteLeadFormHtml(html)).toBe(html)
  })
})
