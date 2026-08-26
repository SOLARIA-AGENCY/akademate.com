import { describe, expect, it } from 'vitest'
import {
  convocationStatusLabel,
  resolveCatalogActiveStatus,
  resolveConvocationDirectoryStatus,
  resolveStaffDirectoryStatus,
  staffStatusVisual,
} from '../directory-status'

describe('directory status mapping', () => {
  it('maps employment leave and inactive without inventing in-class', () => {
    expect(resolveStaffDirectoryStatus({ employmentStatus: 'temporary_leave' })).toBe('permiso')
    expect(resolveStaffDirectoryStatus({ employmentStatus: 'inactive' })).toBe('inactivo')
    expect(resolveStaffDirectoryStatus({ employmentStatus: 'active', isActive: false })).toBe(
      'inactivo',
    )
  })

  it('marks in-class only when a live course run exists and the kind allows it', () => {
    expect(
      resolveStaffDirectoryStatus({
        employmentStatus: 'active',
        allowInClass: true,
        courseRunStatuses: ['draft', 'in_progress'],
      }),
    ).toBe('en_clase')
    expect(
      resolveStaffDirectoryStatus({
        employmentStatus: 'active',
        allowInClass: false,
        courseRunStatuses: ['in_progress'],
      }),
    ).toBe('activo')
  })

  it('returns pill copy and colors for every staff status', () => {
    expect(staffStatusVisual('activo').label).toBe('Activo')
    expect(staffStatusVisual('en_clase').dotClass).toContain('blue')
    expect(staffStatusVisual('permiso').label).toBe('En Permiso')
    expect(staffStatusVisual('inactivo').label).toBe('Inactivo')
  })

  it('maps catalog and convocation statuses without hardcoded tenant ids', () => {
    expect(resolveCatalogActiveStatus(true)).toBe('activo')
    expect(resolveCatalogActiveStatus(false)).toBe('inactivo')
    expect(resolveConvocationDirectoryStatus('enrollment_open')).toBe('enrollment_open')
    expect(convocationStatusLabel('enrollment_open')).toBe('Matrícula abierta')
    expect(convocationStatusLabel('in_progress')).toBe('En curso')
    expect(convocationStatusLabel('unknown')).toBe('Estado')
  })
})
