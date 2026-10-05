import { describe, expect, it } from 'vitest'
import type { CatalogSnapshot } from './render'
import { rewriteSubsidyNotice } from './subsidy-notice'

const snapshot = {
  data: {
    courses: [
      { slug: 'prl', nombre: 'PRL', studyType: 'desempleados' },
      { slug: 'yoga', nombre: 'Yoga', studyType: 'privados' },
    ],
  },
} as CatalogSnapshot

const page = '<html><body><main><h1>Curso</h1></main></body></html>'

describe('rewriteSubsidyNotice', () => {
  it('adds the free-training notice and logos on a subsidized course', () => {
    const html = rewriteSubsidyNotice(page, '/cursos/prl', snapshot)
    expect(html).toContain('data-cep-subsidy-notice="1"')
    expect(html).toContain('Formación gratuita')
    expect(html).toContain('fondo-social-europeo.jpeg')
    expect(html).toContain('servicio-canario-empleo.jpg')
    expect(html).toContain('/legal/transparencia')
    expect(rewriteSubsidyNotice(html, '/cursos/prl', snapshot).match(/data-cep-subsidy-notice/g)?.length).toBe(1)
  })

  it('adds the notice when the page already marks the course as free', () => {
    const marked = page.replace('<h1>', '<div>Formación gratuita subvencionada</div><h1>')
    const html = rewriteSubsidyNotice(marked, '/cursos/prl', null)
    expect(html).toContain('data-cep-subsidy-notice="1"')
    expect(html).toContain('servicio-canario-empleo.jpg')
  })

  it('leaves a private course unchanged', () => {
    expect(rewriteSubsidyNotice(page, '/cursos/yoga', snapshot)).toBe(page)
    expect(rewriteSubsidyNotice(page, '/cursos', snapshot)).toBe(page)
  })
})
