import { describe, expect, test } from 'vitest'
import {
  buildStaffAreaAssignmentPlan,
  parseStaffAreaAssignmentCsv,
  type StaffAreaAssignmentArea,
  type StaffAreaAssignmentStaff,
} from './apply-staff-qualified-areas'

describe('apply-staff-qualified-areas', () => {
  const activeTeacher: StaffAreaAssignmentStaff = {
    id: 32,
    fullName: 'Docente Activo',
    staffType: 'profesor',
    employmentStatus: 'active',
    isActive: true,
    tenantIds: [1],
  }

  const activeArea: StaffAreaAssignmentArea = {
    id: 7,
    nombre: 'Área Salud, Bienestar y Deporte',
    codigo: 'salud',
    active: true,
  }

  test('parses semicolon and pipe separated area ids', () => {
    const records = parseStaffAreaAssignmentCsv([
      'staff_id,area_ids,reason',
      '32,"7;8",Excel audit',
      '33,9|10,Manual review',
    ].join('\n'))

    expect(records).toEqual([
      { line: 2, staffId: 32, areaIds: [7, 8], reason: 'Excel audit' },
      { line: 3, staffId: 33, areaIds: [9, 10], reason: 'Manual review' },
    ])
  })

  test('rejects duplicated staff rows', () => {
    expect(() => parseStaffAreaAssignmentCsv([
      'staff_id,area_ids',
      '32,7',
      '32,8',
    ].join('\n'))).toThrow(/duplicado/i)
  })

  test('builds a valid assignment plan for active teaching staff and active areas', () => {
    const records = parseStaffAreaAssignmentCsv('staff_id,area_ids\n32,7')
    const plan = buildStaffAreaAssignmentPlan(
      records,
      new Map([[activeTeacher.id, activeTeacher]]),
      new Map([[activeArea.id, activeArea]]),
      1,
    )

    expect(plan.ok).toBe(true)
    expect(plan.totalRecords).toBe(1)
    expect(plan.validRecords).toBe(1)
    expect(plan.totalRelations).toBe(1)
    expect(plan.items[0].errors).toEqual([])
  })

  test('blocks inactive or non-teaching staff and missing areas', () => {
    const records = parseStaffAreaAssignmentCsv([
      'staff_id,area_ids',
      '44,7',
      '45,99',
    ].join('\n'))

    const plan = buildStaffAreaAssignmentPlan(
      records,
      new Map<number, StaffAreaAssignmentStaff>([
        [44, { ...activeTeacher, id: 44, staffType: 'administrativo' }],
        [45, { ...activeTeacher, id: 45, employmentStatus: 'inactive' }],
      ]),
      new Map([[activeArea.id, activeArea]]),
      1,
    )

    expect(plan.ok).toBe(false)
    expect(plan.invalidRecords).toBe(2)
    expect(plan.items[0].errors).toEqual(['Personal #44 no es docente ni academico'])
    expect(plan.items[1].errors).toEqual(['Docente #45 no esta activo', 'Area #99 no existe'])
  })

  test('blocks staff without assigned campuses in the selected tenant', () => {
    const records = parseStaffAreaAssignmentCsv('staff_id,area_ids\n32,7')
    const plan = buildStaffAreaAssignmentPlan(
      records,
      new Map([[activeTeacher.id, { ...activeTeacher, tenantIds: [2] }]]),
      new Map([[activeArea.id, activeArea]]),
      1,
    )

    expect(plan.ok).toBe(false)
    expect(plan.items[0].errors).toEqual([
      'Docente #32 no pertenece al tenant #1 o no tiene sede asignada en ese tenant',
    ])
  })
})
