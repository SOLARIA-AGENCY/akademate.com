import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffStatusBadge,
} from '../StaffBadges'
import { PersonalListItem } from '../PersonalListItem'

describe('StaffBadges', () => {
  it('keeps staff badges on fixed semantic widths by type', () => {
    const { container } = render(
      <div>
        <StaffCampusBadge>Sede Santa Cruz</StaffCampusBadge>
        <StaffCampusBadge>Sede Norte</StaffCampusBadge>
        <StaffContractBadge>Tiempo completo</StaffContractBadge>
        <StaffStatusBadge status="active" />
      </div>,
    )

    const campusBadges = container.querySelectorAll('.w-\\[9\\.25rem\\]')
    const contractBadges = container.querySelectorAll('.w-\\[8\\.75rem\\]')
    const statusBadges = container.querySelectorAll('.w-\\[6\\.75rem\\]')

    expect(campusBadges).toHaveLength(2)
    expect(contractBadges).toHaveLength(1)
    expect(statusBadges).toHaveLength(1)
  })
})

describe('PersonalListItem', () => {
  it('renders administrative staff with shared status, contract and campus badges', () => {
    render(
      <PersonalListItem
        teacher={{
          id: '7',
          firstName: 'Jan',
          lastName: 'Méndez Ceballos',
          email: 'jan@example.com',
          phone: '922 000 000',
          position: 'Administrativo',
          staffType: 'administrativo',
          active: true,
          contractLabel: 'Tiempo completo',
          assignedCampuses: [
            { id: 1, name: 'Sede Santa Cruz' },
            { id: 2, name: 'Sede Norte' },
          ],
        }}
        actionLabel="Ver ficha administrativo"
      />,
    )

    expect(screen.getByText('Jan Méndez Ceballos')).toBeInTheDocument()
    expect(screen.getByText('Administrativo')).toBeInTheDocument()
    expect(screen.getByText('Tiempo completo')).toBeInTheDocument()
    expect(screen.getByText('Sede Santa Cruz')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver ficha administrativo' })).toBeInTheDocument()
  })
})
