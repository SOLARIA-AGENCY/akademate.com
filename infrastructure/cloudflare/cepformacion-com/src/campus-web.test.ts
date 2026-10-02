import { describe, expect, it } from 'vitest'
import { campusWebFromName, campusWebFromPath, rewriteCampusWebsites } from './campus-web'

const homeCards = `<!doctype html><html><body>
<div data-cep-campus-grid="1">
<article>
<h3>CEP Santa Cruz</h3>
<div class="grid gap-3">
<div class="grid gap-1 sm:grid-cols-[7rem_1fr]"><span class="font-black text-slate-950">Email</span><a href="mailto:info@cursostenerife.es">info@cursostenerife.es</a></div>
<div class="grid gap-1 sm:grid-cols-[7rem_1fr]"><span class="font-black text-slate-950">Horario</span><span>L-V</span></div>
</div>
</article>
<article>
<h3>CEP Norte</h3>
<div class="grid gap-3">
<div class="grid gap-1 sm:grid-cols-[7rem_1fr]"><span class="font-black text-slate-950">Horario</span><span>L-V</span></div>
</div>
</article>
<article>
<h3>CEP Sur</h3>
<div class="grid gap-3">
<div class="grid gap-1 sm:grid-cols-[7rem_1fr]"><span class="font-black text-slate-950">Horario</span><span>Consultar</span></div>
</div>
</article>
</div>
</body></html>`

const sedePage = `<!doctype html><html><body>
<section>
<h2>Información de la sede</h2>
<dl>
<div><dt class="text-slate-500">Email</dt><dd class="mt-1 font-semibold text-slate-900">info@cursostenerife.es</dd></div>
<div><dt class="text-slate-500">Horario</dt><dd class="mt-1 font-semibold text-slate-900">L-V</dd></div>
</dl>
</section>
</body></html>`

describe('rewriteCampusWebsites', () => {
  it('maps GMB website hosts from campus names and sede paths', () => {
    expect(campusWebFromName('CEP SANTA CRUZ')?.host).toBe('cursostenerife.es')
    expect(campusWebFromName('CEP Norte')?.host).toBe('cursostenerife.es')
    expect(campusWebFromName('CEP SUR')?.host).toBe('cepsur.es')
    expect(campusWebFromPath('/p/sedes/cep-sur')?.href).toBe('https://cepsur.es/')
  })

  it('injects cursostenerife.es on Santa Cruz and Norte cards and cepsur.es on Sur', () => {
    const html = rewriteCampusWebsites(homeCards, '/')
    const visible = html.slice(0, html.indexOf('data-cep-campus-web-lock="1"'))
    expect(visible).toContain('cursostenerife.es')
    expect(visible).toContain('cepsur.es')
    expect(visible.match(/data-cep-campus-web="1"/g)?.length).toBe(3)
    expect(html).toContain('data-cep-campus-web-lock="1"')
    expect(html).not.toContain('innerHTML')
    expect(rewriteCampusWebsites(html, '/')).toBe(html)
  })

  it('injects the Santa Cruz website into the sede fact sheet', () => {
    const html = rewriteCampusWebsites(sedePage, '/p/sedes/sede-santa-cruz')
    const visible = html.slice(0, html.indexOf('data-cep-campus-web-lock="1"'))
    expect(visible).toContain('data-cep-campus-web="1"')
    expect(visible).toContain('cursostenerife.es')
    expect(visible).not.toContain('cepsur.es')
  })
})
