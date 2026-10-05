import { describe, expect, it } from 'vitest'
import { brightenSedeHero, compactCampusCards, keepSedesCards, rewriteCampusPhotos } from './campus-photo'

const homeSedes = `<!doctype html><html><head><title>CEP</title></head><body>
<section class="bg-white"><div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<h2 class="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Nuestras sedes</h2>
<p>Conoce nuestros centros en Tenerife.</p>
<div class="mt-10 grid gap-8 md:grid-cols-2">
<article class="group block h-full"><div class="relative h-72 overflow-hidden"><img alt="CEP Sur" src="/api/media/file/campus-sur.svg"></div><div class="space-y-4 p-7"><h3 class="text-2xl font-black">CEP Sur</h3><p>Calle Arguayoda, 3</p></div></article>
<article class="group block h-full"><div class="relative h-72 overflow-hidden"><img alt="CEP Norte" src="/api/media/file/norte.png"></div><div class="space-y-4 p-7"><h3 class="text-2xl font-black">CEP Norte</h3><p>C.C. El Trompo</p></div></article>
<article class="group block h-full"><div class="relative h-72 overflow-hidden"><img alt="CEP Santa Cruz" src="/api/media/file/sc.png"></div><div class="space-y-4 p-7"><h3 class="text-2xl font-black">CEP Santa Cruz</h3><p>Plaza Jose Antonio Barrios Olivero</p></div></article>
</div></div></section>
</body></html>`

const listingSedes = `<!doctype html><html><head><title>Sedes</title></head><body>
<section><h1 class="mt-4 text-4xl">Nuestras sedes</h1></section>
<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
<article><img class="h-56 w-full" alt="CEP Sur" src="/images/sedes/sede-cep-sur.png"><h2>CEP Sur</h2></article>
<article><img class="h-56 w-full" alt="CEP Norte" src="/norte.png"><h2>CEP Norte</h2></article>
<article><img class="h-56 w-full" alt="CEP Santa Cruz" src="/sc.png"><h2>CEP Santa Cruz</h2></article>
</div></div>
</body></html>`

describe('rewriteCampusPhotos', () => {
  it('replaces the Sur SVG placeholder with the real campus photo', () => {
    const html = rewriteCampusPhotos(
      '<img alt="CEP Sur" src="/api/media/file/campus-sur.svg"><img alt="Norte" src="/api/media/file/norte.png">',
    )
    expect(html).toContain('/images/sedes/sede-cep-sur.png')
    expect(html).not.toContain('campus-sur.svg')
    expect(html).toContain('/api/media/file/norte.png')
  })

  it('rewrites the nested akademate media host', () => {
    const html = rewriteCampusPhotos(
      'https://cepformacion.app.akademate.com/api/media/file/teacher.webp https://cepformacion.akademate.com/api/media/file/staff.webp',
    )
    expect(html).toContain('https://cepformacion.com/api/media/file/teacher.webp')
    expect(html).toContain('/api/media/file/staff.webp')
    expect(html).not.toContain('cepformacion.app.akademate.com')
  })
})

describe('compactCampusCards', () => {
  it('puts home campus cards on a compact 3-col desktop row', () => {
    const html = rewriteCampusPhotos(homeSedes)
    expect(html).toContain('data-cep-campus-grid="1"')
    expect(html).toContain('lg:grid-cols-3')
    expect(html).toContain('md:grid-cols-2')
    expect(html).not.toContain('gap-8 md:grid-cols-2')
    expect(html).toContain('@media (min-width:1024px)')
    expect(html).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
    expect(html).toContain('height:10.5rem!important')
    expect(html).toContain('CEP SUR')
    expect(html).toContain('CEP NORTE')
    expect(html).toContain('CEP SANTA CRUZ')
    expect(html).toContain('Calle Arguayoda, 3')
    expect(html).toContain('data-cep-campus-grid-css="1"')
    expect(html).toContain('data-cep-campus-grid-lock="1"')
  })

  it('keeps listing campuses in one lg row instead of wrapping at xl', () => {
    const html = compactCampusCards(listingSedes)
    expect(html).toContain('<div data-cep-campus-grid="1" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">')
    expect(html).toContain('CEP SUR')
    expect(html).toContain('CEP NORTE')
    expect(html).toContain('CEP SANTA CRUZ')
    expect(html).not.toContain('class="grid gap-6 md:grid-cols-2 xl:grid-cols-3"')
  })

  it('inserts the Sur photo and leaves the loose area badges off the card', () => {
    const html = rewriteCampusPhotos(`<!doctype html><html><head></head><body>
<section><h1>Nuestras sedes</h1>
<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
<article class="overflow-hidden rounded-lg border border-slate-200 bg-white"><div class="space-y-3 p-6"><h2>CEP Sur</h2><p>San Isidro · Calle Arguayoda, 3</p><a href="/sedes/cep-sur">Ver sede completa →</a></div></article>
<article class="overflow-hidden rounded-lg border border-slate-200 bg-white"><img alt="CEP Norte" src="/norte.png"><h2>CEP Norte</h2></article>
</div></section></body></html>`)
    const card = html.slice(html.indexOf('<article'), html.indexOf('</article>'))
    expect(html).toContain('<img src="/images/sedes/sede-cep-sur.png" alt="CEP SUR" class="h-56 w-full object-cover"/>')
    expect(card).not.toContain('data-cep-area-badges="sur"')
    expect(card).not.toContain('>Sanitaria<')
    expect(card).not.toContain('>Tecnología<')
    expect(html).not.toContain('>Seguridad<')
    expect(html).toContain('ensureSurCard')
    expect(html).toContain('/norte.png')
  })

  it('replaces course chips on a sede card with the areas those courses belong to', () => {
    const html = rewriteCampusPhotos(`<!doctype html><html><head></head><body>
<h1>Nuestras sedes</h1>
<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
<article class="overflow-hidden rounded-lg border border-slate-200 bg-white"><div class="space-y-3 p-6"><h2>CEP Norte</h2><div class="flex flex-wrap gap-2"><a href="/cursos/instructora-de-yoga-priv">Instructor o Instructora de Yoga</a><a href="/cursos/ayudante-tecnico-veterinario-atv-priv">Ayudante Técnico Veterinario (ATV)</a><a href="/cursos/auxiliar-de-odontologia-e-higiene-priv">Auxiliar de Odontologia e Higiene</a><a href="/cursos/quiromasaje-priv">Quiromasaje</a><a href="/cursos/adiestramiento-canino-i-priv">Adiestramiento Canino I</a></div></div></article>
<article class="overflow-hidden rounded-lg border border-slate-200 bg-white"><h2>CEP Sur</h2></article>
</div>
</body></html>`)
    const card = html.slice(html.indexOf('<article'), html.indexOf('</article>'))
    expect(card).toContain('data-cep-area-badges="campus"')
    expect(card.indexOf('Veterinaria')).toBeLessThan(card.indexOf('Sanitaria'))
    expect(card.indexOf('Sanitaria')).toBeLessThan(card.indexOf('Salud y deporte'))
    expect(card).not.toContain('Instructor o Instructora de Yoga')
    expect(card).not.toContain('/cursos/')
    expect(html).toContain('paintAreas')
  })

  it('drops the Next payload on the sedes index so hydration cannot restore course chips', () => {
    const html = keepSedesCards(
      `<html><head></head><body><header><a href="/">Inicio</a></header><article><h2>CEP Santa Cruz</h2><div data-cep-area-badges="campus">Sanitaria</div></article><script>self.__next_f.push([1,"Auxiliar de Farmacia"])</script><script src="/_next/static/chunks/sedes.js"></script><script data-cep-campus-grid-lock="1">lock</script></body></html>`,
      '/sedes',
    )
    expect(html).not.toContain('__next_f')
    expect(html).not.toContain('/_next/static')
    expect(html).toContain('data-cep-campus-grid-lock="1"')
    expect(html).toContain('data-cep-area-badges="campus"')
    expect(html).toContain('<header>')
    expect(keepSedesCards('<script>self.__next_f.push(1)</script>', '/')).toContain('__next_f')
  })

  it('does not rewrite unrelated two-column grids', () => {
    const html = compactCampusCards(
      '<html><head></head><body><h2>Cursos</h2><div class="mt-10 grid gap-8 md:grid-cols-2"><article>Curso A</article><article>Curso B</article></div></body></html>',
    )
    expect(html).not.toContain('<div data-cep-campus-grid="1"')
    expect(html).not.toContain('data-cep-campus-grid-css="1"')
    expect(html).toContain('class="mt-10 grid gap-8 md:grid-cols-2"')
    expect(html).not.toContain('lg:grid-cols-3')
  })

  it('is idempotent on an already compacted home grid', () => {
    const once = rewriteCampusPhotos(homeSedes)
    const twice = rewriteCampusPhotos(once)
    expect(twice.match(/<div data-cep-campus-grid="1"/g)?.length).toBe(1)
    expect(twice.match(/data-cep-campus-grid-css="1"/g)?.length).toBe(1)
    expect(twice.match(/data-cep-campus-grid-lock="1"/g)?.length).toBe(1)
    expect(twice.match(/class="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"/g)?.length).toBe(1)
  })
})

describe('brightenSedeHero', () => {
  const sede = `<html><head></head><body><section class="relative overflow-hidden bg-slate-950"><img class="absolute inset-0 h-full w-full object-cover opacity-45" alt="CEP Norte" src="/api/media/file/sede-cep-norte.png"><div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/20"></div></section></body></html>`

  it('lifts the campus photo on a sede page and leaves the home untouched', () => {
    const detail = brightenSedeHero(sede, '/p/sedes/sede-norte')
    expect(detail).toContain('data-cep-sede-hero="1"')
    expect(detail).toContain('opacity:1!important')
    expect(detail).toContain('rgba(15,23,42,.72)')
    expect(detail).toContain('height:480px!important')
    expect(detail).toContain('[role="list"][aria-label$="de esta sede"] article{display:flex!important;flex-direction:column!important')
    expect(detail).not.toContain('min-height:44rem')
    expect(detail).toContain('data-cep-sede-orgs="1"')
    expect(detail).toContain('campus-organizations-title')
    expect(brightenSedeHero(sede, '/')).toBe(sede)
    expect(brightenSedeHero(sede, '/sedes')).toBe(sede)
  })

  it('uses the sede card photo instead of the generic campus render', () => {
    const generic = sede.replace('/api/media/file/sede-cep-norte.png', '/website/cep/campus-identity-physical.jpg')
    const norte = brightenSedeHero(generic, '/sedes/sede-norte')
    const cruz = brightenSedeHero(generic, '/sedes/sede-santa-cruz')
    const sur = brightenSedeHero(generic, '/sedes/cep-sur')
    expect(norte).toContain('src="/images/sedes/sede-cep-norte.png"')
    expect(norte).not.toContain('campus-identity-physical.jpg')
    const escaped = brightenSedeHero(
      generic.replace(
        'campus-identity-physical.jpg',
        'campus-identity-physical.jpg"></section><script>\\/website\\/cep\\/campus-identity-physical.jpg',
      ),
      '/sedes/sede-norte',
    )
    expect(escaped).not.toContain('campus-identity-physical')
    expect(cruz).toContain('src="/images/sedes/sede-cep-santa-cruz.png"')
    expect(sur).toContain('src="/images/sedes/sede-cep-sur.png"')
    expect(norte).toContain('data-cep-sede-hero-photo="1"')
  })
})
