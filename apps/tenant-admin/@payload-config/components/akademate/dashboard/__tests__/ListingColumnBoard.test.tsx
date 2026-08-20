import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ENROLLMENT_LIST_COLUMNS,
  ListingColumnBoard,
  formatListingDate,
} from '../ListingColumnBoard'

describe('ListingColumnBoard', () => {
  it('renders column titles for list view', () => {
    render(
      <ListingColumnBoard columns={ENROLLMENT_LIST_COLUMNS}>
        <div>fila</div>
      </ListingColumnBoard>,
    )

    expect(screen.getByText('Alumno')).toBeInTheDocument()
    expect(screen.getByText('Curso/Ciclo')).toBeInTheDocument()
    expect(screen.getByText('Fecha matrícula')).toBeInTheDocument()
    expect(screen.queryByText('Convocatoria')).not.toBeInTheDocument()
    const header = screen.getByText('Alumno').closest('[data-slot="listing-column-header"]')
    expect(header?.className).toContain('rounded-xl')
    expect(header?.className).toContain('border')
  })

  it('formats enrollment dates in UI type, not a mono SKU', () => {
    expect(formatListingDate('2026-01-15')).toMatch(/2026/)
    expect(formatListingDate('2026-01-15')).not.toBe('2025-01')
    expect(formatListingDate(null)).toBe('—')
  })
})
