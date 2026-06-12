import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { User } from 'lucide-react'
import { DashboardPageHeader } from '../../akademate/dashboard'
import { Badge } from '../badge'
import { PageHeader } from '../PageHeader'

describe('PageHeader', () => {
  it('renders top-level page headings without decorative metadata', () => {
    render(
      <PageHeader
        title="Profesores"
        description="Gestión del equipo docente"
        icon={User}
        badge={<Badge variant="outline">28 visibles</Badge>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Profesores' })).toBeInTheDocument()
    expect(screen.queryByText('Gestión del equipo docente')).not.toBeInTheDocument()
    expect(screen.queryByText('28 visibles')).not.toBeInTheDocument()
  })

  it('hides semantic badges in top-level page headings', () => {
    render(
      <PageHeader
        title="Convocatoria"
        icon={User}
        badge={<Badge variant="success">Publicado</Badge>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Convocatoria' })).toBeInTheDocument()
    expect(screen.queryByText('Publicado')).not.toBeInTheDocument()
  })
})

describe('DashboardPageHeader', () => {
  it('keeps the compact title-only contract for migrated dashboard pages', () => {
    render(
      <DashboardPageHeader
        title="Programación Académica"
        description="Calendario de convocatorias, horarios y ocupación"
        eyebrow="Gestión académica"
        meta={<Badge variant="success">3 activas</Badge>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Programación Académica' })).toBeInTheDocument()
    expect(screen.queryByText('Calendario de convocatorias, horarios y ocupación')).not.toBeInTheDocument()
    expect(screen.queryByText('Gestión académica')).not.toBeInTheDocument()
    expect(screen.queryByText('3 activas')).not.toBeInTheDocument()
  })
})
