import { describe, expect, test } from 'vitest'
import { buildStaffAreaAuditResult, type MissingTeacherAreaRow } from './audit-staff-qualified-areas'

describe('audit-staff-qualified-areas', () => {
  test('summarizes missing teachers with inferable and manual-review buckets', () => {
    const rows: MissingTeacherAreaRow[] = [
      {
        staffId: 1,
        fullName: 'Docente con evidencia',
        staffType: 'profesor',
        employmentStatus: 'active',
        isActive: true,
        inferredAreas: [
          { id: 7, codigo: 'SBD', nombre: 'Salud, Bienestar y Deporte', evidenceCount: 2 },
        ],
      },
      {
        staffId: 2,
        fullName: 'Docente sin evidencia',
        staffType: 'profesor',
        employmentStatus: 'active',
        isActive: true,
        inferredAreas: [],
      },
    ]

    const result = buildStaffAreaAuditResult(rows)

    expect(result.ok).toBe(false)
    expect(result.summary).toEqual({
      totalMissing: 2,
      inferable: 1,
      needsManualReview: 1,
      appliedTeachers: 0,
      appliedRelations: 0,
    })
  })

  test('passes only when no active teaching staff is missing qualified areas', () => {
    const result = buildStaffAreaAuditResult([], 3, 4)

    expect(result.ok).toBe(true)
    expect(result.summary).toEqual({
      totalMissing: 0,
      inferable: 0,
      needsManualReview: 0,
      appliedTeachers: 3,
      appliedRelations: 4,
    })
  })
})
