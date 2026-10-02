import { describe, expect, it } from 'vitest'
import { liftSedePaths, liftSedeRequestPath } from './sede-path'

describe('liftSedeRequestPath', () => {
  it('raises /p/sedes one level and leaves other public paths', () => {
    expect(liftSedeRequestPath('/p/sedes')).toBe('/sedes')
    expect(liftSedeRequestPath('/p/sedes/sede-norte')).toBe('/sedes/sede-norte')
    expect(liftSedeRequestPath('/p/sedes/cep-sur/')).toBe('/sedes/cep-sur/')
    expect(liftSedeRequestPath('/sedes/sede-norte')).toBeNull()
    expect(liftSedeRequestPath('/p/cursos')).toBeNull()
  })
})

describe('liftSedePaths', () => {
  it('rewrites public sede links and canonicals without touching the app route payload', () => {
    const html = `<a href="/p/sedes/sede-santa-cruz">CEP Santa Cruz</a>
<link rel="canonical" href="https://cepformacion.com/p/sedes/sede-norte">
<script type="application/ld+json">{"url":"https://cepformacion.com/p/sedes/cep-sur"}</script>
<script id="__NEXT_DATA__">{"page":"/p/sedes/sede-norte"}</script>`
    const next = liftSedePaths(html)
    expect(next).toContain('href="/sedes/sede-santa-cruz"')
    expect(next).toContain('href="https://cepformacion.com/sedes/sede-norte"')
    expect(next).toContain('"url":"https://cepformacion.com/sedes/cep-sur"')
    expect(next).toContain('"page":"/p/sedes/sede-norte"')
    expect(next).not.toContain('href="/p/sedes')
    const flight = liftSedePaths(`<script>self.__next_f.push([1,"{\\"href\\":\\"/p/sedes/sede-norte\\"}"])</script>`)
    expect(flight).toContain('\\"href\\":\\"/sedes/sede-norte\\"')
  })
})
