import { describe, expect, it } from 'vitest'
import { rewritePartnersBanner } from './partners-banner'

function visible(html: string): string {
  const lock = html.indexOf('data-cep-partners-lock="1"')
  return lock === -1 ? html : html.slice(0, lock)
}

const HOME_SLOT = `<body><main>
<div>
<section class="teachers"><h2>Equipo docente</h2></section>
<section class="reviews"><span>Google Business</span><h2>Qué dicen sobre CEP Formación</h2></section>
</div><div>
<section class="form"><span>Atención personalizada</span><h2>Solicita información</h2>
<form><button type="button">Solicitar información</button></form>
</section>
</div>
</main><footer>pie</footer></body>`

describe('rewritePartnersBanner', () => {
  it('adds one static logo grid before the footer when home slots are missing', () => {
    const html = rewritePartnersBanner('<body><main>home</main><footer>pie</footer></body>')
    const shown = visible(html)
    expect(shown).toContain('data-cep-partners="1"')
    expect(shown).toContain('data-cep-partners-grid="1"')
    expect(shown).toContain('Entidades y empresas colaboradoras')
    expect(shown).toContain('Certificaciones')
    expect(shown).toContain('/website/cep/partners/ashotel.jpg')
    expect(shown).toContain('/website/cep/certifications/iso-14001.jpg')
    expect(shown).toContain('/website/cep/partners/addanca.jpg')
    expect(shown).toContain('/website/cep/partners/dkv.jpg')
    expect(shown).toContain('alt="Hospital Quirón Salud"')
    expect(shown).toContain('alt="Clínica Veterinaria Añaza"')
    expect(shown).toContain('cep-partner-name')
    expect(shown).toContain('scale(1.08)')
    expect(shown).toContain('object-fit:contain')
    expect(shown).toContain('justify-content:center')
    expect(shown).not.toContain('grid-template-columns:repeat(auto-fill')
    expect(shown.match(/dkv\.jpg/g)?.length).toBe(1)
    expect(shown).not.toContain('cep-partners-rtl')
    expect(shown).not.toContain('data-dir="rtl"')
    expect(html).not.toContain('pointerdown')
    expect(html).toContain('data-cep-partners-lock="1"')
    expect(html).not.toContain('innerHTML')
    expect(shown.indexOf('data-cep-partners="1"')).toBeLessThan(shown.indexOf('<footer'))
  })

  it('places the logo grid after testimonials and before Solicita información', () => {
    const html = rewritePartnersBanner(HOME_SLOT)
    const shown = visible(html)
    const reviews = shown.indexOf('Qué dicen sobre CEP Formación')
    const partners = shown.indexOf('data-cep-partners="1"')
    const lead = shown.indexOf('>Solicita información<')
    const mainClose = shown.indexOf('</main>')
    expect(reviews).toBeGreaterThan(-1)
    expect(partners).toBeGreaterThan(reviews)
    expect(lead).toBeGreaterThan(partners)
    expect(mainClose).toBeGreaterThan(lead)
    expect(shown.match(/<section data-cep-partners="1"/g)?.length).toBe(2)
    expect(shown.indexOf('data-cep-brand="entities"')).toBeLessThan(shown.indexOf('data-cep-brand="certs"'))
    expect(html).toContain('placeSection')
    expect(html).toContain('Qué dicen sobre CEP')
  })

  it('matches accent and nbsp variants of the two headings', () => {
    const html = rewritePartnersBanner(`<body><main>
<section><h2>Qu&eacute; dicen&nbsp;sobre CEP Formaci&oacute;n</h2></section>
</div><div>
<section><h2>Solicita&nbsp;informaci&oacute;n</h2></section>
</div>
</main><footer></footer></body>`)
    const shown = visible(html)
    const reviews = shown.indexOf('Formaci')
    const partners = shown.indexOf('data-cep-partners="1"')
    const lead = shown.indexOf('Solicita')
    expect(partners).toBeGreaterThan(reviews)
    expect(lead).toBeGreaterThan(partners)
  })

  it('moves a misplaced origin carousel into the testimonials/form slot and keeps a single copy', () => {
    const misplaced = `<body><main>
<div>
<section><h2>Qué dicen sobre CEP Formación</h2></section>
</div><div>
<section><h2>Solicita información</h2></section>
</div>
<section data-cep-partners="1" aria-label="Empresas colaboradoras"><div class="cep-partners-bands">
<div class="cep-partners-track" data-dir="rtl"></div>
<div class="cep-partners-track" data-dir="ltr"></div>
</div></section>
</main>
<section data-cep-partners="1"><p>copy extra</p></section>
<footer>pie</footer></body>`
    const html = rewritePartnersBanner(misplaced)
    const shown = visible(html)
    expect(shown.match(/<section data-cep-partners="1"/g)?.length).toBe(2)
    const reviews = shown.indexOf('Qué dicen sobre CEP Formación')
    const partners = shown.indexOf('data-cep-partners="1"')
    const lead = shown.indexOf('>Solicita información<')
    expect(partners).toBeGreaterThan(reviews)
    expect(lead).toBeGreaterThan(partners)
  })

  it('ignores the same phrases when they only appear inside a script', () => {
    const html = rewritePartnersBanner(`<body>
<script>const copy = "Qué dicen sobre CEP Formación"; const form = "Solicita información";</script>
<main>
<section><h2>Qué dicen sobre CEP Formación</h2></section>
</div><div>
<section><h2>Solicita información</h2></section>
</div>
</main><footer></footer></body>`)
    const shown = visible(html)
    const scriptEnd = shown.indexOf('</script>')
    const partners = shown.indexOf('data-cep-partners="1"')
    expect(partners).toBeGreaterThan(scriptEnd)
    expect(partners).toBeGreaterThan(shown.indexOf('Qué dicen sobre CEP Formación', scriptEnd))
    expect(partners).toBeLessThan(shown.indexOf('>Solicita información<', scriptEnd))
  })

  it('does not duplicate the banner or lock', () => {
    const once = rewritePartnersBanner('<body><main></main><footer></footer></body>')
    const twice = rewritePartnersBanner(once)
    expect(twice).toBe(once)
    expect(once.match(/<section data-cep-partners="1"/g)?.length).toBe(2)
  })
})
