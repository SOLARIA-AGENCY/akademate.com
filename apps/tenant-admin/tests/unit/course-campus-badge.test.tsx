import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  CoursePublicListItem,
  type PublicCourseCardData,
} from '@payload-config/components/akademate/public/CoursePublicCards'

const course: PublicCourseCardData = {
  id: 'course-1',
  slug: 'curso-prueba',
  nombre: 'Curso prueba',
  studyType: 'privados',
  studyTypeLabel: 'Privado',
  imagenPortada: '/course.jpg',
  enrollmentStatus: 'open',
  nextRun: {
    href: '/convocatorias/run-1',
    startDate: '2026-08-05T10:00:00.000Z',
    campusLabel: 'Sede Santa Cruz · Santa Cruz de Tenerife',
    campusHref: '/p/sedes/sede-santa-cruz',
  },
}

describe('compact course campus badge', () => {
  it('renders a fixed-size campus link without nesting anchors', () => {
    const html = renderToStaticMarkup(<CoursePublicListItem course={course} compact />)
    const container = document.createElement('div')
    container.innerHTML = html

    expect(html).toContain('href="/p/sedes/sede-santa-cruz"')
    expect(html).toContain('aria-label="Abrir Sede CEP SANTA CRUZ"')
    expect(html).toContain('h-7 w-44')
    expect(container.querySelectorAll('a a')).toHaveLength(0)
  })
})
