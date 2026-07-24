import { describe, expect, it } from 'vitest'
import {
  getPublicCourseUi,
  normalizePublicCampusLabel,
  type PublicCourseCardData,
} from '@payload-config/components/akademate/public/CoursePublicCards'

function course(overrides: Partial<PublicCourseCardData> = {}): PublicCourseCardData {
  return {
    id: 'course-1',
    slug: 'curso-prueba',
    nombre: 'Curso prueba',
    studyType: 'privados',
    studyTypeLabel: 'Privado',
    imagenPortada: '/course.jpg',
    enrollmentStatus: 'none',
    ...overrides,
  }
}

describe('public course card metadata', () => {
  it('shows the normalized start date and real campus for an open course', () => {
    const ui = getPublicCourseUi(
      course({
        enrollmentStatus: 'open',
        nextRun: {
          startDate: '2026-08-05T10:00:00.000Z',
          campusLabel: 'Sede Norte · La Orotava',
          campusHref: '/p/sedes/sede-norte',
        },
      })
    )

    expect(ui.statusLabel).toBe('Matrícula abierta')
    expect(ui.availabilityLabel).toMatch(/^05 ago 2026$/)
    expect(ui.campusLabel).toBe('Sede CEP NORTE')
    expect(ui.campusHref).toBe('/p/sedes/sede-norte')
  })

  it('uses the neutral upcoming state without inventing a date or campus', () => {
    const ui = getPublicCourseUi(course())

    expect(ui.statusLabel).toBe('Próximamente')
    expect(ui.availabilityLabel).toBe('Fecha por confirmar')
    expect(ui.campusLabel).toBe('Sede por confirmar')
    expect(ui.campusHref).toBeNull()
  })

  it('normalizes every CEP campus to the same concise naming convention', () => {
    expect(normalizePublicCampusLabel('CEP Norte')).toBe('Sede CEP NORTE')
    expect(normalizePublicCampusLabel('Sede Sur · Adeje')).toBe('Sede CEP SUR')
    expect(normalizePublicCampusLabel('Sede Santa Cruz · Santa Cruz de Tenerife')).toBe('Sede CEP SANTA CRUZ')
  })
})
