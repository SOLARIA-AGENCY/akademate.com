import { describe, expect, it } from 'vitest'
import { isCourseHeroAssetPath, rewriteCourseHeroes } from './course-heroes'

describe('rewriteCourseHeroes', () => {
  it('swaps each study-type fallback for the photographic hero', () => {
    const html = [
      '/website/cep/courses/fallback-privados.png',
      '/website/cep/courses/fallback-desempleados.png',
      '/website/cep/courses/fallback-ocupados.png',
      '/website/cep/courses/fallback-teleformacion.png',
    ].join(' ')
    const next = rewriteCourseHeroes(html)
    expect(next).toContain('/website/cep/hero/cursos-privados-v2.jpg')
    expect(next).toContain('/website/cep/hero/cursos-desempleados-v2.jpg')
    expect(next).toContain('/website/cep/hero/cursos-ocupados-v2.jpg')
    expect(next).toContain('/website/cep/hero/cursos-teleformacion-v2.jpg')
    expect(next).not.toContain('fallback-privados')
  })

  it('swaps the akademate fallback path the origin sends now', () => {
    const html = '/website/akademate/fallback-teleformacion.png \\/website\\/akademate\\/fallback-ocupados.png'
    const next = rewriteCourseHeroes(html)
    expect(next).toContain('/website/cep/hero/cursos-teleformacion-v2.jpg')
    expect(next).toContain('\\/website\\/cep\\/hero\\/cursos-ocupados-v2.jpg')
    expect(next).not.toContain('fallback-teleformacion')
    expect(next).not.toContain('fallback-ocupados')
  })

  it('writes the live study-type title into the current course hero h1', () => {
    const cases = [
      ['Privados', 'Cursos privados'],
      ['Trabajadores/as ocupados/as', 'Cursos para trabajadores/as ocupados/as'],
      ['Trabajadores/as desempleados/as', 'Cursos para trabajadores/as desempleados/as'],
      ['Teleformación', 'Cursos teleformación'],
    ] as const
    for (const [eyebrow, title] of cases) {
      const html = `<p class="text-meta font-semibold text-white/70">${eyebrow}</p><h1 class="mt-3 max-w-full text-balance break-words text-2xl font-semibold leading-snug tracking-tight text-white @min-[640px]:text-3xl @min-[1024px]:text-4xl">Cursos</h1>`
      const next = rewriteCourseHeroes(html)
      expect(next).toContain(`>${title}</h1>`)
      expect(next).toContain('data-cep-study-hero-lock="1"')
    }
  })

  it('swaps listing heroes for photographic assets by path', () => {
    const blog = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-formacion.svg" alt="Blog">',
      '/blog',
    )
    expect(blog).toContain('/website/cep/hero/blog-formacion-hero-v2.png')
    const sedes = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-campus.svg" alt="Sedes">',
      '/sedes',
    )
    expect(sedes).toContain('/website/cep/hero/sedes-tenerife-hero-v2.png')
    const conv = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-formacion.svg" alt="Convocatorias">',
      '/convocatorias',
    )
    expect(conv).toContain('/website/cep/hero/convocatorias-hero-v3.png')
    expect(conv).not.toContain('ciclos-formativos-hero')
    const ciclos = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-formacion.svg" alt="Ciclos">',
      '/ciclos',
    )
    expect(ciclos).toContain('/website/cep/hero/ciclos-formativos-hero-v2.png')
    expect(ciclos).not.toContain('convocatorias-hero')
    const colabora = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-formacion.svg" alt="Colabora">',
      '/colabora',
    )
    expect(colabora).toContain('/website/cep/hero/colabora-hero-v1.png')
    expect(colabora).not.toContain('hero-formacion.svg')
    const faq = rewriteCourseHeroes(
      '<img src="/website/akademate/hero-campus.svg" alt="FAQ">',
      '/faq',
    )
    expect(faq).toContain('/website/cep/hero/faq-hero-v1.png')
    const about = rewriteCourseHeroes(
      '<img src="/media/cep-formacion-tenerife-hero.webp" alt="Quiénes somos">',
      '/quienes-somos',
    )
    expect(about).toContain('/website/cep/hero/quienes-somos-hero-v1.png')
    expect(about).not.toContain('cep-formacion-tenerife-hero.webp')
  })

  it('lifts the dark veil so the course hero photograph stays readable', () => {
    const html = `<head></head><section class="relative isolate"><div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/15"></div></section>`
    const next = rewriteCourseHeroes(html)
    expect(next).toContain('data-cep-hero-photo="1"')
    expect(next).toContain('object-position:center center!important')
    expect(next).toContain('transparent 72%')
  })

  it('serves the photographic heroes from worker assets', () => {
    expect(isCourseHeroAssetPath('/website/cep/hero/cursos-privados-v2.jpg')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/blog-formacion-hero-v2.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/convocatorias-hero-v3.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/ciclos-formativos-hero-v2.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/sedes-tenerife-hero-v2.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/colabora-hero-v1.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/hero/empleo-hero-v1.png')).toBe(true)
    expect(isCourseHeroAssetPath('/website/cep/courses/fallback-privados.png')).toBe(false)
  })
})
