import { describe, expect, it } from 'vitest'
import { decodeCfEmail, rewriteAntiSlop, stripTrackedCapsClasses } from './anti-slop'

describe('anti-slop rewrite', () => {
  it('strips tracked-out uppercase classes from chrome labels', () => {
    const html = `<h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Sedes</h3>
<span class="uppercase tracking-[0.24em]">Matrícula abierta</span>
<p class="uppercase tracking-[0.08em]">© 2026 CEP FORMACIÓN</p>`
    const next = stripTrackedCapsClasses(html)
    expect(next).not.toContain('uppercase')
    expect(next).not.toContain('tracking-[0.16em]')
    expect(next).not.toContain('tracking-[0.24em]')
    expect(next).toContain('>Sedes</h3>')
  })

  it('rewrites copy tells, emails and injects a hydration lock without innerHTML', () => {
    const encoded = '4b2e242a2e242a'
    const html = `<!doctype html><html><head><title>CEP FORMACION — Plataforma Educativa</title></head><body>
<footer>
  <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Sedes</h3>
  <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Contacto</h3>
  <h3 class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900">Participa</h3>
  <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="${encoded}">[email protected]</a>
</footer>
<p>2 Sedes en Tenerife</p>
<div>ISO 18000</div>
<p>© 2026 Akademate</p>
<p>En APROEM no solo concedemos becas. Creamos oportunidades.</p>
<img src="/media/admin-1.jpg" alt="Orientación laboral y empleabilidad en CEP Formación" />
</body></html>`
    const next = rewriteAntiSlop(html)
    const visible = next.slice(0, next.indexOf('data-cep-unslop-lock'))
    expect(visible).toContain('<title>CEP Formación, Plataforma Educativa</title>')
    expect(visible).toContain('3 campus en Tenerife')
    expect(visible).toContain('ISO 14001')
    expect(visible).not.toContain('ISO 18000')
    expect(visible).toContain('concedemos becas a quien no puede pagar')
    expect(visible).toContain('/website/cep/empleo/bolsa-empleo-oficina.jpg')
    expect(visible).toContain('Oficina de la bolsa de empleo de CEP Formación')
    expect(visible).not.toContain('/media/admin-1.jpg')
    expect(visible).not.toMatch(/footer[\s\S]*uppercase tracking-\[0\.16em\]/)
    expect(next).toContain('data-cep-unslop-lock="1"')
    expect(next).toContain('data-cep-unslop-css="1"')
    expect(next).not.toContain('innerHTML')
    expect(visible).toContain('© 2026 CEP FORMACION Y COMUNICACION')
    expect(visible).not.toContain('© 2026 Akademate')
    expect(next).toContain('.fixed.bottom-20 a[class*="rounded-full"]>span{color:#150702!important')
    expect(next).toContain('border-radius:999px!important;background:#fff!important')
  })

  it('fixes the campus count without leaving a glued 2, and drops the unsourced 98%', () => {
    const html = `<!doctype html><html><body>
<div class="text-center"><p class="text-3xl font-semibold">2</p><p class="mt-1 text-sm text-white/80">Sedes en Tenerife</p></div>
<div class="text-center"><p class="text-3xl font-semibold">98%</p><p class="mt-1 text-sm text-white/80">Inserción laboral</p></div>
<script>self.__next_f.push("{\\"children\\":\\"2\\"}],[\\"$\\",\\"p\\",null,{\\"className\\":\\"mt-1 text-sm text-white/80\\",\\"children\\":\\"Sedes en Tenerife\\"}{\\"children\\":\\"98%\\"}{\\"children\\":\\"Inserción laboral\\"}")</script>
</body></html>`
    const next = rewriteAntiSlop(html)
    const visible = next.slice(0, next.indexOf('data-cep-unslop-lock'))
    expect(visible).toContain('>3</p><p class="mt-1 text-sm text-white/80">Campus en Tenerife</p>')
    expect(visible).not.toContain('2Campus')
    expect(visible).not.toContain('98%')
    expect(visible).toContain('Agencia de colocación')
    expect(next).toContain('\\"children\\":\\"3\\"')
    expect(next).toContain('\\"children\\":\\"Autorizada\\"')
    expect(next).not.toContain('\\"children\\":\\"98%\\"')
  })

  it('renames Akademate in the visible text and in the flight', () => {
    const html = '<html><body><p>Al enviar el formulario aceptas que <!-- -->Akademate<!-- --> contacte contigo</p><script>self.__next_f.push("{\\"tenantName\\":\\"Akademate\\",\\"children\\":\\"Akademate\\"}")</script></body></html>'
    const next = rewriteAntiSlop(html)
    expect(next).not.toContain('>Akademate<')
    expect(next).not.toContain('<!-- -->Akademate<!-- -->')
    expect(next).not.toContain('\\"Akademate\\"')
    expect(next).toContain('CEP Formación')
  })

  it('decodes Cloudflare email protection hex', () => {
    // key 0x0a, rest XOR of info@x.es
    const email = 'info@x.es'
    const key = 0x0a
    const hex =
      key.toString(16).padStart(2, '0') +
      [...email].map((ch) => (ch.charCodeAt(0) ^ key).toString(16).padStart(2, '0')).join('')
    expect(decodeCfEmail(hex)).toBe(email)
  })
})
