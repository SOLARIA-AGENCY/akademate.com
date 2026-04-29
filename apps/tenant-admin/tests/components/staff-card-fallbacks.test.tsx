import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { StaffCard } from '../../@payload-config/components/ui/StaffCard'

const baseStaff = {
  id: 1,
  fullName: 'Sheila Méndez',
  position: 'Aux. en Clínicas Estéticas',
  contractType: 'freelance',
  employmentStatus: 'active',
  photo: '/placeholder-avatar.svg',
  email: '',
  phone: '',
  assignedCampuses: [{ id: 2, name: 'Sede Norte', city: 'La Orotava' }],
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
}

describe('StaffCard fallbacks', () => {
  it('shows the teacher fallback for teaching staff without a real photo', () => {
    render(<StaffCard {...baseStaff} staffType="profesor" />)

    expect(screen.getByText('Autónomo')).toBeInTheDocument()
    expect(screen.getByText('Imagen genérica de docente')).toBeInTheDocument()
    expect(screen.queryByAltText('Sheila Méndez')).not.toBeInTheDocument()
  })

  it('shows the administrative fallback for administrative staff without a real photo', () => {
    render(<StaffCard {...baseStaff} staffType="administrativo" fullName="Laura Fernández" />)

    expect(screen.getByText('Imagen genérica de administrativo')).toBeInTheDocument()
    expect(screen.queryByAltText('Laura Fernández')).not.toBeInTheDocument()
  })
})
