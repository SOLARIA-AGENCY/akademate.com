import { describe, expect, it } from 'vitest'
import { extractProfessorPosition, fillInstructorTitles } from './instructor-title'

const card = `<a href="/p/profesores/ana-gonzalez"><h3>Ana González</h3><p class="mt-2 text-sm leading-6 text-gray-600">Profesional asignado a esta convocatoria.</p></a>`

describe('instructor title', () => {
  it('reads the position from the professor page', () => {
    expect(extractProfessorPosition('<p class="mt-4 text-xl text-white/80">Profesora de quiromasaje</p>')).toBe('Profesora de quiromasaje')
  })

  it('replaces the placeholder with that title', async () => {
    const html = await fillInstructorTitles(card, async () => 'Profesora de quiromasaje')
    expect(html).toContain('Profesora de quiromasaje')
    expect(html).not.toContain('Profesional asignado a esta convocatoria.')
  })

  it('keeps the placeholder when the professor page has no title', async () => {
    const html = await fillInstructorTitles(card, async () => null)
    expect(html).toContain('Profesional asignado a esta convocatoria.')
  })
})
