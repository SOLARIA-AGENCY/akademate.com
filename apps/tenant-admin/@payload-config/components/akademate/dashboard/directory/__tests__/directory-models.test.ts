import { describe, expect, it } from 'vitest'
import {
  computeStaffDirectoryKpis,
  filterStaffDirectoryRows,
  mapStaffToDirectoryRow,
} from '../staff-directory-model'
import {
  computeCampusDirectoryKpis,
  computeConvocationDirectoryKpis,
  computeCourseDirectoryKpis,
  computeCycleDirectoryKpis,
} from '../catalog-directory-model'

describe('staff directory model', () => {
  it('maps a teacher from API fields and derives in-class from course runs', () => {
    const row = mapStaffToDirectoryRow(
      {
        id: 9,
        fullName: 'Elena Ramos',
        email: 'elena@akademate.com',
        position: 'Docente',
        employmentStatus: 'active',
        assignedCampuses: [{ id: 1, name: 'Sede Centro' }],
        qualifiedAreas: [{ id: 2, nombre: 'Informática' }],
        courseRunsCount: 3,
        courseRuns: [{ status: 'in_progress' }],
      },
      'profesor',
    )
    expect(row).toMatchObject({
      id: '9',
      department: 'Informática',
      campus: 'Sede Centro',
      workloadLabel: '3 cursos',
      status: 'en_clase',
      initials: 'ER',
    })
  })

  it('maps administrativos without in-class and uses contract as the extra column', () => {
    const row = mapStaffToDirectoryRow(
      {
        id: 'a1',
        firstName: 'Laura',
        lastName: 'Fernández',
        email: 'laura@akademate.com',
        position: 'Secretaría',
        contractType: 'full_time',
        employmentStatus: 'active',
        assignedCampuses: [{ name: 'Sede Norte' }],
        courseRuns: [{ status: 'in_progress' }],
      },
      'administrativo',
    )
    expect(row.status).toBe('activo')
    expect(row.workloadLabel).toBe('Tiempo completo')
  })

  it('computes KPIs from the live set instead of mock 128/116 figures', () => {
    const rows = [
      mapStaffToDirectoryRow(
        { id: 1, fullName: 'A', employmentStatus: 'active', assignedCampuses: [{ name: 'Centro' }] },
        'profesor',
      ),
      mapStaffToDirectoryRow(
        { id: 2, fullName: 'B', employmentStatus: 'temporary_leave', assignedCampuses: [{ name: 'Norte' }] },
        'profesor',
      ),
    ]
    const kpis = computeStaffDirectoryKpis(rows, 'profesor')
    expect(kpis.find((item) => item.id === 'total')?.value).toBe('2')
    expect(kpis.find((item) => item.id === 'activos')?.value).toBe('1')
    expect(kpis.find((item) => item.id === 'permiso')?.value).toBe('1')
    expect(kpis.find((item) => item.id === 'sedes')?.value).toBe('2 Sedes')
  })

  it('filters by search, status, department and campus together', () => {
    const rows = [
      mapStaffToDirectoryRow(
        {
          id: 1,
          fullName: 'Carlos Mendoza',
          email: 'c@akademate.com',
          position: 'Salud',
          employmentStatus: 'active',
          assignedCampuses: [{ name: 'Sede Centro' }],
        },
        'profesor',
      ),
      mapStaffToDirectoryRow(
        {
          id: 2,
          fullName: 'Elena Ramos',
          email: 'e@akademate.com',
          position: 'Arte',
          employmentStatus: 'inactive',
          assignedCampuses: [{ name: 'Sede Norte' }],
        },
        'profesor',
      ),
    ]
    expect(
      filterStaffDirectoryRows(rows, {
        search: 'mendoza',
        status: 'activo',
        department: 'Salud',
        campus: 'Sede Centro',
      }).map((row) => row.id),
    ).toEqual(['1'])
    expect(
      filterStaffDirectoryRows(rows, {
        search: '',
        status: 'inactivo',
        department: 'todos',
        campus: 'todos',
      }).map((row) => row.id),
    ).toEqual(['2'])
  })
})

describe('catalog directory KPIs', () => {
  it('counts courses, cycles, campuses and occupancy from real fields', () => {
    expect(
      computeCourseDirectoryKpis([
        { active: true, area: 'IFC', totalConvocatorias: 2 },
        { active: false, area: 'ADG', totalConvocatorias: 0 },
      ]).map((item) => item.value),
    ).toEqual(['2', '1', '1', '2'])

    expect(
      computeCycleDirectoryKpis([
        { nivel: 'Grado Superior', convocatorias: 1 },
        { nivel: 'Grado Medio', convocatorias: 0 },
      ]).map((item) => item.value),
    ).toEqual(['2', '1', '1', '1'])

    expect(
      computeCampusDirectoryKpis([
        { campusKind: 'physical', capacidad: 40 },
        { campusKind: 'virtual', capacidad: 0 },
      ]).map((item) => item.value),
    ).toEqual(['2', '1', '1', '40'])

    expect(
      computeConvocationDirectoryKpis([
        { estado: 'enrollment_open', plazas: 20, inscritos: 10 },
        { estado: 'in_progress', plazas: 20, inscritos: 10 },
      ]).find((item) => item.id === 'ocupacion')?.value,
    ).toBe('50%')
  })
})
