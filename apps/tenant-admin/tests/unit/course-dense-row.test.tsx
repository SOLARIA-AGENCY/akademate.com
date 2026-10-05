import { describe, expect, it } from 'vitest'
import { render, screen } from '../utils/test-utils'
import { CourseDenseRow } from '../../app/(public)/_components/CourseDenseRow'
import { CourseDenseCatalog, groupDenseCourses } from '../../app/(public)/_components/CourseDenseCatalog'
import { displayCourseTitle } from '../../app/(public)/_components/course-title'

const SAMPLE = [
  { id: '1', name: 'Zumba clínica', typeLabel: 'Privados', href: '/a', enrollmentOpen: false },
  { id: '2', name: 'Inglés B1', typeLabel: 'Teleformación', href: '/b', enrollmentOpen: true },
  { id: '3', name: 'Auxiliar de farmacia', typeLabel: 'Privados', href: '/c', enrollmentOpen: true },
  { id: '4', name: 'Gestión de redes', typeLabel: 'Desempleados', href: '/d', enrollmentOpen: false },
  { id: '5', name: 'Dietética', typeLabel: 'Ocupados', href: '/e', enrollmentOpen: true },
]

describe('displayCourseTitle', () => {
  it('sentence-cases shouting names and roman numerals', () => {
    expect(displayCourseTitle('AUXILIAR DE ÓPTICA')).toBe('Auxiliar de óptica')
    expect(displayCourseTitle('Adiestramiento Canino I')).toBe('Adiestramiento canino I')
  })
})

describe('groupDenseCourses', () => {
  it('groups by type, sorts names, and keeps the public type order', () => {
    const groups = groupDenseCourses(SAMPLE)

    expect(groups.map((group) => group.key)).toEqual(['privados', 'ocupados', 'desempleados'])
    expect(groups[0]?.courses.map((course) => course.name)).toEqual(['Auxiliar de farmacia', 'Zumba clínica'])
    expect(groups.find((group) => group.key === 'ocupados')?.label).toBe('Cursos para ocupados')
    expect(groups.find((group) => group.key === 'desempleados')?.label).toBe('Cursos para desempleados')
    expect(groups.find((group) => group.key === 'privados')?.label).toBe('Cursos privados')
    expect(groups.map((group) => group.key)).not.toContain('teleformacion')
  })
})

describe('CourseDenseCatalog', () => {
  it(
    'renders type titles and keeps type names off each row',
    () => {
      render(<CourseDenseCatalog courses={SAMPLE} />)

      expect(screen.getByRole('heading', { name: 'Cursos privados' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Cursos para ocupados' })).toBeInTheDocument()
      expect(screen.getByText('Auxiliar de farmacia').closest('a')).not.toHaveTextContent('Cursos privados')
      expect(document.querySelector('.space-y-20')).toBeTruthy()
      expect(document.querySelector('.grid-cols-1')).toBeTruthy()
    },
    20_000,
  )
})

describe('CourseDenseRow', () => {
  it('keeps a reserved badge slot so rows match with or without matrícula abierta', () => {
    const { rerender } = render(
      <CourseDenseRow
        course={{
          id: 'open',
          name: 'Auxiliar de farmacia',
          typeLabel: 'Privados',
          href: '/p/cursos/farmacia',
          enrollmentOpen: true,
        }}
      />
    )

    const openSlot = document.querySelector('[data-slot="enrollment-badge-slot"]')
    expect(openSlot).toHaveClass('h-5')
    expect(screen.getByText('Matrícula abierta')).toBeInTheDocument()
    expect(screen.getByText(/Ver curso/)).toBeInTheDocument()
    expect(screen.queryByText('Privados')).toBeNull()

    rerender(
      <CourseDenseRow
        course={{
          id: 'closed',
          name: 'Auxiliar de farmacia',
          typeLabel: 'Privados',
          href: '/p/cursos/farmacia',
          enrollmentOpen: false,
        }}
      />
    )

    const closedSlot = document.querySelector('[data-slot="enrollment-badge-slot"]')
    expect(closedSlot).toHaveClass('h-5')
    expect(screen.queryByText('Matrícula abierta')).toBeNull()
    expect(screen.queryByText('Matrícula cerrada')).toBeNull()
  })

  it('shows Matrícula cerrada from Payload when enrollment is closed', () => {
    render(
      <CourseDenseRow
        course={{
          id: 'closed-run',
          name: 'Auxiliar de farmacia',
          typeLabel: 'Privados',
          href: '/p/cursos/farmacia',
          enrollmentOpen: false,
          enrollmentClosed: true,
        }}
      />,
    )
    expect(screen.getByText('Matrícula cerrada')).toBeInTheDocument()
    expect(screen.queryByText('Matrícula abierta')).toBeNull()
  })

  it('shows shouting course names in sentence case', () => {
    render(
      <CourseDenseRow
        course={{
          id: 'shout',
          name: 'AUXILIAR DE ÓPTICA',
          typeLabel: 'Privados',
          href: '/p/cursos/optica',
          enrollmentOpen: false,
        }}
      />,
    )
    expect(screen.getByText('Auxiliar de óptica')).toBeInTheDocument()
    expect(screen.queryByText('AUXILIAR DE ÓPTICA')).toBeNull()
  })
})
