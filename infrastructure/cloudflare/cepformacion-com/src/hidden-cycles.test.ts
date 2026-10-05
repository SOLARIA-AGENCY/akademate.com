import { describe, expect, it } from 'vitest'
import { hideTestCycles, isHiddenPublicCycle, isHiddenPublicCyclePath } from './hidden-cycles'

describe('hidden public cycles', () => {
  it('hides QA ciclos and keeps the two official CEP cycles public', () => {
    expect(isHiddenPublicCycle('cfgm-farmacia-parafarmacia', 'Farmacia y Parafarmacia')).toBe(false)
    expect(isHiddenPublicCycle('cfgs-higiene-bucodental', 'Higiene Bucodental')).toBe(false)
    expect(isHiddenPublicCycle('farmacia', 'Farmacia y Parafarmacia')).toBe(false)
    expect(isHiddenPublicCycle('qa-ciclo-omega-persistencia', 'QA Ciclo Omega persistencia')).toBe(true)
    expect(isHiddenPublicCycle('auxiliar-de-farmacia-y-parafarmacia-priv', 'Auxiliar de Farmacia y Parafarmacia')).toBe(
      false,
    )
  })

  it('matches public cycle paths used by the Worker', () => {
    expect(isHiddenPublicCyclePath('/p/ciclos/cfgm-farmacia-parafarmacia')).toBe(false)
    expect(isHiddenPublicCyclePath('/ciclos/higiene-bucodental')).toBe(false)
    expect(isHiddenPublicCyclePath('/p/ciclos/qa-ciclo-omega-persistencia')).toBe(true)
    expect(isHiddenPublicCyclePath('/p/cursos/auxiliar-de-farmacia-y-parafarmacia-priv')).toBe(false)
  })

  it('removes QA cycle cards from HTML and keeps official cycles', () => {
    const html = hideTestCycles(`<!doctype html><html><head></head><body>
      <article><a href="/p/ciclos/cfgm-farmacia-parafarmacia"><h2>Farmacia y Parafarmacia</h2></a></article>
      <article><a href="/p/ciclos/qa-ciclo-omega-persistencia"><h2>QA Ciclo</h2></a></article>
      <a href="/p/cursos/auxiliar-de-farmacia-y-parafarmacia-priv">Auxiliar de Farmacia</a>
      <a href="/p/ciclos/dietetica">Dietética</a>
    </body></html>`)
    expect(html).toContain('/p/ciclos/cfgm-farmacia-parafarmacia')
    expect(html).not.toContain('/p/ciclos/qa-ciclo-omega-persistencia')
    expect(html).toContain('/p/cursos/auxiliar-de-farmacia-y-parafarmacia-priv')
    expect(html).toContain('/p/ciclos/dietetica')
    expect(html).toContain('data-cep-hidden-cycles-lock="1"')
  })
})
