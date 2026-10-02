import { describe, expect, it } from 'vitest'
import { editorialPageId, isFounderAssetPath, rewriteEditorial } from './blog-editorial'

const shell = `<!doctype html><html><head><title>Viejo</title></head><body><header></header><main><p>Origen</p></main><footer></footer></body></html>`

describe('rewriteEditorial', () => {
  it('publishes the family history on the existing history url', () => {
    const html = rewriteEditorial(shell, '/blog/conocer-nuestra-historia')
    expect(editorialPageId('/blog/conocer-nuestra-historia')).toBe('post')
    expect(html).toContain('Fran de Amo Olivier')
    expect(html).toContain('Carol de Amo Olivier')
    expect(html).toContain('séptima generación')
    expect(html).not.toContain('El relato que')
    expect(html).not.toContain('el texto que')
    expect(html).toContain('/website/cep/hero/blog-formacion-hero-v2.png')
    expect(html).toContain('data-cep-editorial-hero="blog"')
    expect(html).toContain('<h1>La historia familiar de quienes dirigen CEP Formación</h1>')
    expect(html.indexOf('cep-editorial-hero-photo')).toBeLessThan(html.indexOf('cep-editorial-photos'))
    expect(html.match(/<h1>/g)?.length).toBe(1)
    expect(html).toContain('/images/fundadores/fran-de-amo.png')
    expect(html).toContain('/images/fundadores/carol-de-amo.jpg')
    expect(isFounderAssetPath('/images/fundadores/fran-de-amo.png')).toBe(true)
    expect(isFounderAssetPath('/images/fundadores/carol-de-amo.jpg')).toBe(true)
    expect(isFounderAssetPath('/images/sedes/sede-cep-norte.png')).toBe(false)
    expect(html).toContain('application/ld+json')
    expect(html).toContain('https://wa.me/?text=')
    expect(html).not.toContain('Carlina')
    expect(html).not.toContain('<main><p>Origen</p></main>')
  })

  it('publishes the three campuses as a second blog article', () => {
    const html = rewriteEditorial(shell, '/blog/tres-sedes-cep-formacion-tenerife')
    expect(html).toContain('CEP Orotava')
    expect(html).toContain('sede-cep-sur.png')
    expect(html).toContain('data-cep-editorial-rendered="post"')
  })

  it('puts the two new articles ahead of the existing blog list', () => {
    const index = `<main><a href="/blog/como-elegir-formacion-profesional-en-tenerife">Guía</a></main>`
    const html = rewriteEditorial(index, '/blog')
    expect(html.indexOf('conocer-nuestra-historia')).toBeLessThan(html.indexOf('como-elegir-formacion'))
    expect(html).toContain('tres-sedes-cep-formacion-tenerife')
    expect(html).toContain('Leer artículo')
    expect(html).toContain('26/9/2026')
    expect(html).toContain('text-xl font-black leading-tight text-slate-950')
  })

  it('keeps the article after the contact shell would hydrate', () => {
    const poisoned = shell.replace(
      '</body>',
      '<script>self.__next_f.push([1,"Contacta con nosotros"])</script><script src="/_next/static/chunks/main.js"></script></body>',
    )
    const html = rewriteEditorial(poisoned, '/blog/conocer-nuestra-historia')
    expect(html).not.toContain('__next_f')
    expect(html).not.toContain('/_next/static')
    expect(html).toContain('data-cep-editorial-lock="1"')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('La historia familiar')
    const styled = rewriteEditorial(
      shell.replace('</head>', '<link rel="stylesheet" href="/_next/static/css/app.css"></head>'),
      '/noticias',
    )
    expect(styled).toContain('/_next/static/css/app.css')
  })

  it('replaces the empty blog shell with the evergreen cards', () => {
    const empty = `<main><div class="mx-auto max-w-7xl px-4 py-14"><p class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-slate-600">Todavía no hay artículos publicados. Cuando el centro los escriba aparecerán aquí.</p></div></main>`
    const html = rewriteEditorial(empty, '/blog')
    expect(html).toContain('conocer-nuestra-historia')
    expect(html).toContain('tres-sedes-cep-formacion-tenerife')
    expect(html).toContain('como-elegir-formacion-profesional-en-tenerife')
    expect(html).toContain('teleformacion-estudiar-a-tu-ritmo')
    expect(html).toContain('agencia-colocacion-y-bolsa-de-empleo')
    expect(html).toContain('ciclos-formativos-oficiales-salidas-profesionales')
    expect(html).toContain('0500000212')
    expect(html).not.toContain('admin-1.jpg')
    expect(html).not.toContain('Todavía no hay artículos publicados')
    expect(html).toContain('data-cep-editorial-grid="1"')
  })

  it('does not leave the Next payload that restores the empty blog and freezes the menu', () => {
    const live = `<html><head></head><body><header><nav><a href="/">Inicio</a></nav></header><main><p class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-slate-600">Todavía no hay artículos publicados. Cuando el centro los escriba aparecerán aquí.</p></main><script>self.__next_f.push([1,"Todavía no hay artículos publicados"])</script><script src="/_next/static/chunks/main.js"></script><script data-cep-chrome-nav-lock="1">header</script></body></html>`
    const html = rewriteEditorial(live, '/blog')
    expect(html).not.toContain('__next_f')
    expect(html).not.toContain('/_next/static')
    expect(html).toContain('data-cep-chrome-nav-lock="1"')
    expect(html).toContain('data-cep-editorial-grid="1"')
    expect(html).toContain('<header>')
  })

  it('fills the news section with the Sur sede item and drops the empty-state copy', () => {
    const html = rewriteEditorial(shell, '/noticias')
    expect(html).toContain('data-cep-editorial-rendered="noticias"')
    expect(html).toContain('CEP Sur, en San Isidro')
    expect(html).toContain('/images/sedes/sede-cep-sur.png')
    expect(html).toContain('href="/sedes/cep-sur"')
    expect(html).toContain('cepsur.es')
    expect(html).not.toContain('Todavía no hay noticias')
    expect(html).not.toContain('Aquí van las novedades')
    expect(editorialPageId('/blog')).toBe('blog')
    expect(editorialPageId('/cursos')).toBeNull()
  })
})
