import { describe, expect, it } from 'vitest'
import { CEP_DEFAULT_WEBSITE } from '../defaults'

describe('CEP_DEFAULT_WEBSITE', () => {
  it('includes canonical public pages for the website inventory', () => {
    const paths = CEP_DEFAULT_WEBSITE.pages.map((page) => page.path)

    expect(paths).toContain('/')
    expect(paths).toContain('/cursos')
    expect(paths).toContain('/ciclos')
    expect(paths).toContain('/convocatorias')
    expect(paths).toContain('/sedes')
    expect(paths).toContain('/blog')
    expect(paths).toContain('/faq')
    expect(paths).toContain('/contacto')
  })

  it('uses CEP visual identity defaults', () => {
    expect(CEP_DEFAULT_WEBSITE.visualIdentity.fontPrimary).toBe('Poppins')
    expect(CEP_DEFAULT_WEBSITE.visualIdentity.colorPrimary).toBe('#f2014b')
    expect(CEP_DEFAULT_WEBSITE.visualIdentity.logoPrimary).toBe('/logos/cep-formacion-logo.png')
  })

  it('has navigation entries for core catalog routes', () => {
    const navHrefs = CEP_DEFAULT_WEBSITE.navigation.items.map((item) => item.href)

    expect(navHrefs).toContain('/')
    expect(navHrefs).toContain('/cursos')
    expect(navHrefs).toContain('/ciclos')
    expect(navHrefs).toContain('/convocatorias')
  })
})
