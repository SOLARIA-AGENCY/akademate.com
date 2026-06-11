import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { User } from 'lucide-react'
import { Badge } from '../badge'
import { PageHeader } from '../PageHeader'

describe('PageHeader', () => {
  it('hides decorative count badges from top-level page headings', () => {
    render(
      <PageHeader
        title="Profesores"
        icon={User}
        badge={<Badge variant="outline">28 visibles</Badge>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Profesores' })).toBeInTheDocument()
    expect(screen.queryByText('28 visibles')).not.toBeInTheDocument()
  })

  it('keeps semantic status badges in page headings', () => {
    render(
      <PageHeader
        title="Convocatoria"
        icon={User}
        badge={<Badge variant="success">Publicado</Badge>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Convocatoria' })).toBeInTheDocument()
    expect(screen.getByText('Publicado')).toBeInTheDocument()
  })
})
