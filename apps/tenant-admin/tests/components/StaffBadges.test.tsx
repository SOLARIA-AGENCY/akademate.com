import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  StaffCampusBadge,
  StaffContractBadge,
  StaffCountBadge,
  StaffAreaBadge,
  StaffStatusBadge,
} from '../../@payload-config/components/ui/StaffBadges'

describe('StaffBadges', () => {
  it('normaliza estados de personal y mantiene tamaño estable', () => {
    render(
      <div>
        <StaffStatusBadge status="Activo" />
        <StaffStatusBadge status={false} />
        <StaffStatusBadge status="temporary_leave" />
      </div>
    )

    const active = screen.getByText('Activo')
    const inactive = screen.getByText('Inactivo')
    const leave = screen.getByText('Baja temporal')

    expect(active).toHaveClass('w-[6.75rem]')
    expect(active).toHaveClass('bg-primary')
    expect(inactive).toHaveClass('w-[6.75rem]')
    expect(leave).toHaveClass('w-[6.75rem]')
  })

  it('usa anchuras consistentes para sedes, contrato y contador', () => {
    render(
      <div>
        <StaffCampusBadge>Sede Santa Cruz</StaffCampusBadge>
        <StaffCampusBadge>Sede Norte</StaffCampusBadge>
        <StaffContractBadge>Tiempo Completo</StaffContractBadge>
        <StaffCountBadge count={2} />
      </div>
    )

    expect(screen.getByText('Sede Santa Cruz').closest('[data-testid="badge"]')).toHaveClass(
      'w-[9.25rem]'
    )
    expect(screen.getByText('Sede Norte').closest('[data-testid="badge"]')).toHaveClass(
      'w-[9.25rem]'
    )
    expect(screen.getByText('Tiempo Completo')).toHaveClass('truncate')
    expect(screen.getByText('2 convocatorias').closest('[data-testid="badge"]')).toHaveClass(
      'w-[8.75rem]'
    )
  })

  it('renderiza badges de area con color estable por semilla', () => {
    render(
      <div>
        <StaffAreaBadge seed="ODO-HIG">Odontología e Higiene Bucodental</StaffAreaBadge>
        <StaffAreaBadge seed="SAN">Sanidad</StaffAreaBadge>
      </div>
    )

    expect(screen.getByText('Odontología e Higiene Bucodental')).toHaveClass('truncate')
    expect(screen.getByText('Sanidad').closest('[data-testid="badge"]')).toHaveClass('rounded-full')
  })
})
