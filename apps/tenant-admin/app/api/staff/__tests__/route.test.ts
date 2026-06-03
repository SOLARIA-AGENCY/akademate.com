import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('postgres', () => ({
  default: vi.fn(() => vi.fn()),
}))

async function loadRoute() {
  process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'
  vi.resetModules()
  return import('../route')
}

describe('/api/staff qualified areas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMock.findByID.mockResolvedValue({
      id: 44,
      staff_type: 'profesor',
      employment_status: 'active',
      contract_type: 'full_time',
      qualified_areas: [7],
    })
    payloadMock.update.mockResolvedValue({
      id: 44,
      full_name: 'Docente Test',
    })
    payloadMock.create.mockImplementation(async ({ collection, data }: any) => {
      if (collection === 'staff') {
        return { id: 44, full_name: 'Docente Test', ...data }
      }
      return { id: 1, ...data }
    })
  })

  it('persists qualifiedAreas when updating staff', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        firstName: 'Docente',
        lastName: 'Test',
        position: 'Sanidad',
        qualifiedAreas: ['7', 9],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.update).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'staff',
      id: 44,
      data: expect.objectContaining({
        qualified_areas: [7, 9],
      }),
    }))
  })

  it('persists qualifiedAreas when creating staff', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Test',
        email: 'docente@example.com',
        position: 'Sanidad',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: ['7', 9],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'staff',
      data: expect.objectContaining({
        qualified_areas: [7, 9],
      }),
    }))
  })

  it('rejects creating a teacher without qualified areas', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'profesor',
        firstName: 'Docente',
        lastName: 'Sin Areas',
        email: 'docente@example.com',
        position: 'Sanidad',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/área habilitada/i)
    expect(payloadMock.create).not.toHaveBeenCalled()
  })

  it('rejects removing all qualified areas from an existing teacher', async () => {
    const { PUT } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff?id=44', {
      method: 'PUT',
      body: JSON.stringify({
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/área habilitada/i)
    expect(payloadMock.update).not.toHaveBeenCalled()
  })

  it('allows administrative staff without teaching areas', async () => {
    const { POST } = await loadRoute()
    const request = new NextRequest('http://localhost/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        staffType: 'administrativo',
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin@example.com',
        position: 'Administración',
        hireDate: '2026-06-01',
        assignedCampuses: [1],
        qualifiedAreas: [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        staff_type: 'administrativo',
        qualified_areas: [],
      }),
    }))
  })
})
