import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
}))

vi.mock('postgres', () => ({
  default: vi.fn(() => sqlMock),
}))

async function loadRoute() {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  vi.resetModules()
  return import('../route')
}

function sqlText(): string {
  const firstArg = sqlMock.mock.calls[0]?.[0]
  return Array.isArray(firstArg) ? firstArg.join('') : String(firstArg ?? '')
}

const staffDetailRow = {
  id: 28,
  staff_type: 'profesor',
  first_name: 'Nuria Esther',
  last_name: 'Angel Ramos',
  full_name: 'Nuria Esther Ángel Ramos',
  nif: null,
  email: 'profesoranuria@gmail.com',
  phone: '+34 677 615 684',
  position: 'Docente',
  contract_type: 'freelance',
  employment_status: 'active',
  inactive_reason: null,
  inactive_at: null,
  reactivated_at: null,
  import_review_status: 'validated',
  last_import_batch: null,
  hire_date: null,
  bio: null,
  is_active: true,
  photo_id: null,
  photo_filename: null,
  photo_url: null,
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-01T00:00:00.000Z',
  assigned_campuses: [{ id: 1, name: 'Sede Santa Cruz', city: 'Santa Cruz de Tenerife' }],
  qualified_areas: [{ id: 7, codigo: 'SCLN', nombre: 'Área Sanitaria y Clínica' }],
  certifications: [{ id: 3, title: 'Higiene Bucodental', institution: 'CEP', year: 2026 }],
  course_runs: [
    {
      id: 94,
      codigo: 'SC-2026-009',
      status: 'enrollment_open',
      startDate: '2026-11-25',
      endDate: '2027-06-02',
      courseName: 'Auxiliar de Odontología e Higiene',
      courseSlug: 'auxiliar-odontologia-higiene',
      courseImage: '/api/media/file/odontologia.jpg',
      campusName: 'Sede Santa Cruz',
      campusCity: 'Santa Cruz de Tenerife',
    },
  ],
}

describe('/api/staff/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock.mockResolvedValue([staffDetailRow])
  })

  it('returns assigned course runs and certifications for a staff member', async () => {
    const { GET } = await loadRoute()

    const response = await GET(new NextRequest('http://localhost/api/staff/28'), {
      params: Promise.resolve({ id: '28' }),
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.fullName).toBe('Nuria Esther Ángel Ramos')
    expect(json.data.certifications).toEqual(staffDetailRow.certifications)
    expect(json.data.courseRunsCount).toBe(1)
    expect(json.data.courseRuns).toHaveLength(1)
    expect(json.data.courseRuns[0]).toMatchObject({
      codigo: 'SC-2026-009',
      courseName: 'Auxiliar de Odontología e Higiene',
      campusName: 'Sede Santa Cruz',
    })
  })

  it('resolves course runs through direct instructor and instructors relation without duplicates', async () => {
    const { GET } = await loadRoute()

    await GET(new NextRequest('http://localhost/api/staff/28'), {
      params: Promise.resolve({ id: '28' }),
    })

    const query = sqlText()
    expect(query).toContain('SELECT DISTINCT ON (cr.id)')
    expect(query).toContain('cr.instructor_id = s.id')
    expect(query).toContain('crr.staff_id = s.id')
    expect(query).toContain("crr.path = 'instructors'")
  })

  it('rejects invalid staff ids before querying the database', async () => {
    const { GET } = await loadRoute()

    const response = await GET(new NextRequest('http://localhost/api/staff/not-a-number'), {
      params: Promise.resolve({ id: 'not-a-number' }),
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(sqlMock).not.toHaveBeenCalled()
  })
})
