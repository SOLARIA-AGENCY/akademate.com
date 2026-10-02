import { describe, expect, it } from 'vitest'
import { stripPublicLeadCopy } from './public-lead-copy'

describe('stripPublicLeadCopy', () => {
  it('drops the dossier sentence from html and from the flight payload', () => {
    const html = stripPublicLeadCopy(
      'Deja tus datos y te enviaremos la ficha PDF de Técnicas en Quiromasaje. El lead quedará registrado para seguimiento comercial.',
    )
    expect(html).toBe('Deja tus datos y te enviaremos la ficha PDF de Técnicas en Quiromasaje.')
    expect(html.toLowerCase()).not.toContain('lead')

    const flight = stripPublicLeadCopy(
      'Deja tus datos y te enviaremos la ficha PDF de Técnicas en Quiromasaje. El lead quedar\\u00e1 registrado para seguimiento comercial.',
    )
    expect(flight).not.toMatch(/lead/i)
  })

  it('rewrites the other public sentences that name a lead', () => {
    const html = stripPublicLeadCopy(
      'Formulario conectado con el flujo actual de leads. La cita quedará en el historial del lead y podrá consultarse después.',
    )
    expect(html.toLowerCase()).not.toContain('lead')
    expect(html).toContain('en el historial y podrá')
  })
})