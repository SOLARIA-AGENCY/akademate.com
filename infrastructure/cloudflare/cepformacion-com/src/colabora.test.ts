import { describe, expect, it } from 'vitest'
import { colaboraPageId, rewriteColaboraLinks } from './colabora'

describe('rewriteColaboraLinks', () => {
  it('opens each colabora menu entry on its own page', () => {
    const html = rewriteColaboraLinks(`<body>
      <a href="/colabora?tipo=formacion-empresas#solicitud">Formación para empresas</a>
      <a href="/colabora?tipo=empresa-practicas#solicitud">Empresas de prácticas</a>
      <a href="/colabora?tipo=practicas-en-cep#solicitud">Prácticas</a>
      <a href="#solicitud">Enviar una solicitud</a>
    </body>`)
    expect(html).toContain('href="/colabora/formacion-para-empresas"')
    expect(html).toContain('href="/colabora/practicas"')
    expect(html).toContain('href="/colabora?tipo=empresa-practicas"')
    expect(html).toContain('href="#solicitud"')
    expect(html).not.toContain('tipo=formacion-empresas#solicitud')
    expect(html).toContain('data-cep-colabora-lock="1"')
    expect(html).not.toContain('innerHTML')
  })

  it('paints a distinct hero and one title for a colabora route', () => {
    const html = rewriteColaboraLinks(`<!doctype html><html><head><title>404</title></head><body><header></header><main><h1>No encontrado</h1></main><footer></footer></body></html>`, '/colabora/trabaja-con-nosotros')
    expect(colaboraPageId('/colabora/trabaja-con-nosotros')).toBe('trabaja-con-nosotros')
    expect(colaboraPageId('/colabora')).toBeNull()
    expect(html).toContain('data-cep-colabora-rendered="1"')
    expect(html).toContain('src="/website/cep/colabora/trabaja-con-nosotros.png"')
    expect(html).toContain('aspect-ratio:3/2')
    expect(html).toContain('<h2>Quiénes somos</h2>')
    expect(html).toContain('siete generaciones')
    expect(html).toContain('<h1>Trabaja con nosotros</h1>')
    expect(html.match(/<h1>/g)).toHaveLength(1)
    expect(html).toContain('name="intent" value="trabaja-con-nosotros"')
    expect(html).not.toContain('__next')
    const empresas = rewriteColaboraLinks(`<body><main></main></body>`, '/colabora/empresas')
    expect(empresas).toContain('src="/website/cep/colabora/proyecto-colaborativo.png"')
    expect(empresas).not.toContain('trabaja-con-nosotros.png')
  })

  it('is idempotent', () => {
    const once = rewriteColaboraLinks('<body><a href="/colabora?tipo=trabaja-con-nosotros#solicitud">Trabaja</a></body>')
    expect(rewriteColaboraLinks(once)).toBe(once)
  })
})
