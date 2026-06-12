import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffStatusBadge,
} from '../StaffBadges'
import { StaffCard } from '../StaffCard'
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

describe('StaffCard', () => {
  it('warns when teaching staff has no qualified area assigned', () => {
    render(
      <StaffCard
        id={32}
        fullName="Sheila Méndez"
        staffType="profesor"
        position="Docente"
        contractType="full_time"
        employmentStatus="active"
        photo="/placeholder-avatar.svg"
        email="sheila@example.com"
        phone="922 000 000"
        assignedCampuses={[{ id: 2, name: 'Sede Norte', city: 'La Orotava' }]}
        qualifiedAreas={[]}
        courseRunsCount={0}
        onView={() => undefined}
        detailLabel="Ver ficha docente"
      />,
    )

    expect(screen.getByText('Sheila Méndez')).toBeInTheDocument()
    expect(screen.getByText('Sin área habilitada')).toBeInTheDocument()
    expect(screen.getByText('0 convocatorias')).toBeInTheDocument()
  })

  it('does not show teaching area warning for administrative staff', () => {
    render(
      <StaffCard
        id="7"
        fullName="Jan Méndez Ceballos"
        staffType="administrativo"
        position="Administrativo"
        contractType="Tiempo completo"
        employmentStatus="active"
        photo="/placeholder-avatar.svg"
        email="jan@example.com"
        phone="922 000 000"
        assignedCampuses={[
          { id: 1, name: 'Sede Santa Cruz', city: 'Santa Cruz de Tenerife' },
          { id: 2, name: 'Sede Norte', city: 'La Orotava' },
        ]}
        onView={() => undefined}
        detailLabel="Ver ficha administrativo"
      />,
    )

    expect(screen.getByText('Jan Méndez Ceballos')).toBeInTheDocument()
    expect(screen.queryByText('Sin área habilitada')).not.toBeInTheDocument()
    expect(screen.getByText('Sede Santa Cruz')).toBeInTheDocument()
    expect(screen.getByText('Sede Norte')).toBeInTheDocument()
  })
})
