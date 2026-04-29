import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockUnsafe } = vi.hoisted(() => {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  return {
    mockUnsafe: vi.fn(),
  }
})

vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    unsafe: mockUnsafe,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

import { GET } from '@/app/api/staff/route'

const row = {
  id: 1,
  staff_type: 'profesor',
  first_name: 'Docente',
  last_name: 'CEP',
  full_name: 'Docente CEP',
  email: 'docente@example.com',
  phone: null,
  position: 'Profesor',
  contract_type: 'full_time',
  employment_status: 'active',
  hire_date: null,
  bio: null,
  data_quality_status: 'complete',
  source: null,
  alias_names: null,
  detected_courses: null,
  is_active: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  photo_filename: null,
  campuses: [],
  course_runs: [],
}

describe('Staff route filters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnsafe.mockResolvedValue([row])
  })

  it('groups profesores with academico and never returns administrativos for professor views', async () => {
    const response = await GET(new NextRequest('http://localhost/api/staff?type=profesor&limit=100'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("s.staff_type IN ('profesor', 'academico')"),
      [],
    )
  })

  it('groups administrativos with jefatura_administracion', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/staff?type=administrativo&limit=100'),
    )

    expect(response.status).toBe(200)
    expect(mockUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("s.staff_type IN ('administrativo', 'jefatura_administracion')"),
      [],
    )
  })

  it('supports Payload-style staff_type query params used by legacy UI widgets', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/staff?where[staff_type][equals]=profesor&limit=100'),
    )

    expect(response.status).toBe(200)
    expect(mockUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("s.staff_type IN ('profesor', 'academico')"),
      [],
    )
  })

  it('rejects unknown staff type filters instead of returning mixed staff', async () => {
    const response = await GET(new NextRequest('http://localhost/api/staff?type=unknown'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.success).toBe(false)
    expect(mockUnsafe).not.toHaveBeenCalled()
  })
})
