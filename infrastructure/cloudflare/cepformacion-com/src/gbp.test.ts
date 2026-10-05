import { describe, expect, it } from 'vitest'
import { isSocialAssetPath, rewriteGoogleBusiness, sedeSlugFromPath } from './gbp'

const footerPage = `<!doctype html><html><body>
<footer>
<h3 class="text-sm font-semibold text-slate-900">Sedes</h3>
<div class="mt-4 space-y-4 text-sm text-slate-700">
<p><span class="block font-semibold text-slate-900">CEP Santa Cruz</span>Plaza José Antonio Barrios Olivero</p>
<p><span class="block font-semibold text-slate-900">CEP Norte</span>Molinos de Gofio 2</p>
<p><span class="block font-semibold text-slate-900">CEP Sur</span>Calle Arguayoda 3</p>
</div>
</footer>
</body></html>`

const sedePage = `<!doctype html><html><body>
<section>
<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
<h2 class="text-lg font-semibold text-slate-950">Cómo llegar</h2>
<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
<p>Plaza Jose Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005, Santa Cruz de Tenerife</p>
<a href="https://www.google.com/maps/search/?api=1&amp;query=Plaza">Abrir ubicación en Google Maps</a>
</div>
</div>
</section>
${footerPage}
</body></html>`

describe('rewriteGoogleBusiness', () => {
  it('serves the three social icons from the worker', () => {
    expect(isSocialAssetPath('/logos/social-instagram.png')).toBe(true)
    expect(isSocialAssetPath('/logos/social-facebook.png')).toBe(true)
    expect(isSocialAssetPath('/logos/social-linkedin.png')).toBe(true)
    expect(isSocialAssetPath('/logos/cep-formacion-logo.png')).toBe(false)
  })

  it('reads sede slugs from public paths', () => {
    expect(sedeSlugFromPath('/p/sedes/sede-santa-cruz')).toBe('sede-santa-cruz')
    expect(sedeSlugFromPath('/p/sedes/sede-norte/')).toBe('sede-norte')
    expect(sedeSlugFromPath('/site/sedes/cep-sur')).toBe('cep-sur')
    expect(sedeSlugFromPath('/p/cursos')).toBeNull()
  })

  it('keeps sede addresses and drops the Google profile links', () => {
    const html = rewriteGoogleBusiness(footerPage, '/')
    const visible = html.slice(0, html.indexOf('data-cep-gbp-lock="1"'))
    expect(visible).not.toContain('data-cep-gbp-footer="1"')
    expect(visible).not.toContain('Google, CEP Santa Cruz')
    expect(visible).toContain('Plaza José Antonio Barrios Olivero')
    expect(html).toContain('repeat(3,minmax(0,1fr))')
    expect(html).toContain('data-cep-gbp-lock="1"')
    expect(html).not.toContain('innerHTML')
    expect(rewriteGoogleBusiness(html, '/')).toBe(html)
  })

  it('puts social icons in the logo column and the two legal marks under Legal', () => {
    const html = `<footer><div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:px-8"><div class="flex flex-col items-center lg:items-start"><img alt="CEP"><p>Centro</p></div><div><h3>Oferta formativa</h3></div><div><h3>Legal</h3><ul><li>Privacidad</li></ul></div><div class="flex flex-col items-center gap-3 lg:items-end"><div class="flex flex-nowrap items-center justify-center gap-3 lg:justify-end mt-2" aria-label="Información regulatoria"><a href="/legal/privacidad">RGPD</a></div></div></div></footer>`
    const next = rewriteGoogleBusiness(html, '/')
    const visible = next.slice(0, next.indexOf('data-cep-gbp-lock="1"'))
    expect(visible).toContain('data-cep-social="1"')
    expect(visible).toContain('/logos/social-facebook.png')
    expect(visible).toContain('/logos/social-instagram.png')
    expect(visible).toContain('/logos/social-linkedin.png')
    expect(visible).toContain('https://www.instagram.com/cep_formacion')
    const legalAt = visible.indexOf('<h3>Legal</h3>')
    const marksAt = visible.indexOf('Información regulatoria')
    expect(marksAt).toBeGreaterThan(legalAt)
    expect(visible.indexOf('</ul>', legalAt)).toBeLessThan(marksAt)
  })

  it('adds the sedes column and Google links when the origin footer has no Sedes heading', () => {
    const html = `<footer><div class="bg-slate-50 py-12"><div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:px-8"><div class="flex flex-col items-center lg:items-start"><img src="/logo.png" alt="CEP"/><p>Centro</p></div><div><h3 class="text-sm font-semibold text-slate-900">Oferta formativa</h3></div><div><h3>Información</h3></div><div><h3>Legal</h3></div></div></div></footer>`
    const next = rewriteGoogleBusiness(html, '/')
    const visible = next.slice(0, next.indexOf('data-cep-gbp-lock="1"'))
    expect(visible).toContain('data-cep-sedes-footer="1"')
    expect(visible).toContain('Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005')
    expect(visible).toContain('Molinos de Gofio 2, 38312 La Orotava')
    expect(visible).toContain('Calle Arguayoda 3, 38611 San Isidro')
    expect(visible).not.toContain('Google, CEP Santa Cruz')
    const sedesAt = visible.indexOf('data-cep-sedes-footer="1"')
    const ofertaAt = visible.indexOf('Oferta formativa')
    expect(sedesAt).toBeGreaterThan(-1)
    expect(ofertaAt).toBeGreaterThan(sedesAt)
    expect(visible).toContain('data-cep-footer="info"')
    expect(visible).toContain('grid-column:3')
    expect(next).toContain('ensureInfoColumn')
    expect(visible.indexOf('mx-auto max-w-7xl px-4 py-8')).toBe(-1)
  })

  it('replaces the Cómo llegar placeholder with an embed and review link', () => {
    const html = rewriteGoogleBusiness(sedePage, '/p/sedes/sede-santa-cruz')
    const visible = html.slice(0, html.indexOf('data-cep-gbp-lock="1"'))
    expect(visible).toContain('data-cep-gbp-map="1"')
    expect(html).toContain('data-cep-gbp-lock="1"')
    expect(visible).toContain('output=embed')
    expect(visible).toContain('z=14')
    expect(visible).toContain('height:70vh')
    expect(html).toContain('data-cep-gbp-open="1"')
    expect(html).toContain('grid-template-columns:1fr')
    expect(visible).toContain('Ver ficha y reseñas')
    expect(visible).toContain('maps/dir/')
    expect(visible).not.toContain('Abrir ubicación en Google Maps')
    expect(visible.match(/data-cep-gbp-map="1"/g)?.length).toBe(1)
  })
})
