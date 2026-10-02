import { describe, expect, it } from 'vitest'
import { campusPublicHref, displayCampusName, rewriteCampusNames } from './campus-name'

describe('displayCampusName', () => {
  it('maps every public variant to the official names', () => {
    expect(displayCampusName('Sede CEP Sur')).toBe('CEP Sur')
    expect(displayCampusName('Sede Sur')).toBe('CEP Sur')
    expect(displayCampusName('CEP SUR')).toBe('CEP Sur')
    expect(displayCampusName('Sede Norte')).toBe('CEP Norte')
    expect(displayCampusName('Sede CEP Norte')).toBe('CEP Norte')
    expect(displayCampusName('Sede Norte – La Orotava')).toBe('CEP Norte')
    expect(displayCampusName('Sede Norte (La Laguna)')).toBe('CEP Norte')
    expect(displayCampusName('CEP FORMACION NORTE')).toBe('CEP Norte')
    expect(displayCampusName('Sede Santa Cruz')).toBe('CEP Santa Cruz')
    expect(displayCampusName('Sede Sede Santa Cruz')).toBe('CEP Santa Cruz')
    expect(displayCampusName('Sede CEP Santa Cruz')).toBe('CEP Santa Cruz')
    expect(displayCampusName('CEP Santa Cruz')).toBe('CEP Santa Cruz')
    expect(displayCampusName('CEP Virtual')).toBe('CEP Virtual')
    expect(campusPublicHref('CEP Virtual')).toBe('')
  })

  it('keeps placeholders and online labels', () => {
    expect(displayCampusName('Sede por confirmar')).toBe('Sede por confirmar')
    expect(displayCampusName('Online')).toBe('Online')
    expect(displayCampusName('100% online · desde casa')).toBe('100% online · desde casa')
  })
})

describe('campusPublicHref', () => {
  it('maps campus labels to public sede pages', () => {
    expect(campusPublicHref('Sede CEP Santa Cruz')).toBe('/sedes/sede-santa-cruz')
    expect(campusPublicHref('CEP Norte')).toBe('/sedes/sede-norte')
    expect(campusPublicHref('Sede Sur')).toBe('/sedes/cep-sur')
    expect(campusPublicHref('Online')).toBe('')
    expect(campusPublicHref('Por confirmar')).toBe('')
  })
})

describe('rewriteCampusNames', () => {
  it('rewrites card titles without putting Sede in the name', () => {
    const html = rewriteCampusNames(
      '<h3>Sede CEP Sur</h3><h3>Sede Norte</h3><span>Sede Sede Santa Cruz</span><span>Sede Santa Cruz</span>',
    )
    expect(html).toContain('>CEP Sur<')
    expect(html).toContain('>CEP Norte<')
    expect(html).toContain('>CEP Santa Cruz<')
    expect(html).not.toContain('Sede CEP')
    expect(html).not.toContain('Sede Norte')
    expect(html).not.toContain('Sede Santa Cruz')
    expect(html).not.toContain('Sede Sede')
  })

  it('is idempotent', () => {
    const once = rewriteCampusNames('<h3>Sede Norte</h3><span>CEP Santa Cruz</span>')
    expect(rewriteCampusNames(once)).toBe(once)
  })

  it('rewrites the sede page kicker without changing the official names', () => {
    expect(rewriteCampusNames('<p>Sede CEP Formación</p><h1>Sede Santa Cruz</h1>')).toBe(
      '<p>CEP Formación</p><h1>CEP Santa Cruz</h1>',
    )
  })
})
