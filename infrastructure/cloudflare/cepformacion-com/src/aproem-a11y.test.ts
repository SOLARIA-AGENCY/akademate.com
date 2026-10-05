import { describe, expect, it } from 'vitest'
import { applyAproemAccessibility, installAproemPhotoHero } from './aproem-a11y'

const page = '<html lang="es"><head></head><body><header></header><main class="flex-1"><p class="brand-text">APROEM</p></main></body></html>'

describe('applyAproemAccessibility', () => {
  it('adds a skip link and a darker brand only on the APROEM page', () => {
    const html = applyAproemAccessibility(page, '/aproem')
    expect(html).toContain('--brand:#d0013f')
    expect(html).toContain('Saltar al contenido')
    expect(html).toContain('id="contenido"')
    expect(html).toContain('height:18rem')
    expect(html).toContain('height:22rem')
    expect(html).toContain('display:contents')
    expect(html).toContain('border-color:rgb(255 255 255/.92)')
    expect(html).toContain('a:focus-visible')
    expect(html).toContain('a.brand-btn,button.brand-btn{color:#fff!important}')
    expect(html).not.toContain('[style*="color: rgb(242, 1, 75)"]')
    expect(html).not.toContain('a:last-child{background:transparent')
    expect(html).not.toContain('MutationObserver')
    expect(html).not.toContain('innerHTML')
    expect(applyAproemAccessibility(html, '/aproem')).toBe(html)
  })

  it('leaves the rest of the site alone', () => {
    expect(applyAproemAccessibility(page, '/')).toBe(page)
    expect(applyAproemAccessibility(page, '/transparencia/aproem')).toBe(page)
  })
})

const washed = `<main><section class="relative overflow-hidden bg-[var(--brand-light)]"><img src="/website/cep/aproem/aproem-hero.jpg" alt=""/><div class="bg-white/72"><h1>APROEM</h1></div></section><script>{"src":"/website/cep/aproem/aproem-hero.jpg","alt":""}</script></main>`

describe('installAproemPhotoHero', () => {
  it('points the hero and its payload at the 1280x720 photo without rebuilding the tree', () => {
    const html = installAproemPhotoHero(washed)
    expect(html).toContain('/website/cep/hero/aproem-hero-v2.png')
    expect(html).toContain('Asesoría de una beca APROEM en un aula de Tenerife')
    expect(html).not.toContain('aproem-hero.jpg')
    expect(html).toContain('bg-white/72')
    expect(html).toContain('<h1>APROEM</h1>')
    expect(html).not.toContain('MutationObserver')
    expect(installAproemPhotoHero(html)).toBe(html)
  })
})
