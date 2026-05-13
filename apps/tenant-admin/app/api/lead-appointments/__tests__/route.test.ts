import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { PATCH, DELETE } from '../[id]/route'

const { executeMock, authMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  authMock: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    db: {
      drizzle: {
        execute: executeMock,
      },
    },
  })),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('../../leads/_lib/auth', () => ({
  getAuthenticatedUserContext: authMock,
}))

const tenantId = 17
const userId = 31

const commercialUser = { id: userId, role: 'asesor', name: 'Asesor CEP', email: 'asesor@cep.test' }
const lead = {
  id: 44,
  first_name: 'María',
  last_name: 'Pérez',
  email: 'maria@example.com',
  phone: '600000000',
  status: 'new',
}
const appointment = {
  id: 7,
  tenant_id: tenantId,
  lead_id: lead.id,
  created_by_user_id: userId,
  assigned_to_user_id: userId,
  title: 'Cita con María Pérez',
  appointment_type: 'call',
  reason: 'follow_up',
  status: 'pending',
  starts_at: '2026-05-13T10:00:00.000Z',
  ends_at: '2026-05-13T10:30:00.000Z',
  duration_minutes: 30,
  notes: 'Confirmar interés',
  outcome_notes: null,
  created_at: '2026-05-12T10:00:00.000Z',
  updated_at: '2026-05-12T10:00:00.000Z',
  cancelled_at: null,
  lead_first_name: lead.first_name,
  lead_last_name: lead.last_name,
  lead_email: lead.email,
  lead_phone: lead.phone,
  lead_status: lead.status,
  assigned_to_name: commercialUser.name,
  assigned_to_email: commercialUser.email,
  created_by_name: commercialUser.name,
  created_by_email: commercialUser.email,
}

function rows(rows: unknown[]) {
  return { rows }
}

function installSqlRouter() {
  executeMock.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM users') && sql.includes('role, name, email') && sql.includes(`id = ${userId}`)) {
      return rows([commercialUser])
    }
    if (sql.includes('information_schema.tables') && sql.includes('lead_appointments')) {
      return rows([{ '?column?': 1 }])
    }
    if (sql.includes('FROM leads') && sql.includes(`id = ${lead.id}`)) {
      return rows([lead])
    }
    if (sql.includes('FROM users') && sql.includes(`id = ${userId}`) && sql.includes("role IN")) {
      return rows([commercialUser])
    }
    if (sql.includes('INSERT INTO lead_appointments')) {
      return rows([appointment])
    }
    if (sql.includes('FROM lead_appointments la') && sql.includes(`la.id = ${appointment.id}`)) {
      return rows([appointment])
    }
    if (sql.includes('FROM lead_appointments la')) {
      return rows([appointment])
    }
    if (sql.includes('FROM users') && sql.includes('ORDER BY COALESCE')) {
      return rows([commercialUser])
    }
    if (sql.includes('information_schema.tables') && sql.includes('lead_interactions')) {
      return rows([{ '?column?': 1 }])
    }
    if (sql.includes('INSERT INTO lead_interactions')) {
      return rows([{ id: 99 }])
    }
    if (sql.includes('information_schema.columns')) {
      return rows([{ '?column?': 1 }])
    }
    if (sql.includes('UPDATE leads')) {
      return rows([])
    }
    if (sql.includes('UPDATE lead_appointments')) {
      return rows([])
    }
    return rows([])
  })
}

describe('/api/lead-appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId, tenantId })
    installSqlRouter()
  })

  it('rejects unauthenticated users before exposing calendar data', async () => {
    authMock.mockResolvedValue(null)
    const response = await GET(new NextRequest('http://localhost/api/lead-appointments'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('No autenticado')
  })

  it('rejects lectura role for calendar access', async () => {
    executeMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM users') && sql.includes('role, name, email')) return rows([{ ...commercialUser, role: 'lectura' }])
      return rows([])
    })

    const response = await GET(new NextRequest('http://localhost/api/lead-appointments'))
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('No autorizado')
  })

  it('lists appointments filtered by tenant and date range and can include commercial users', async () => {
    const response = await GET(new NextRequest('http://localhost/api/lead-appointments?from=2026-05-01T00:00:00.000Z&to=2026-06-01T00:00:00.000Z&includeUsers=1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.appointments).toHaveLength(1)
    expect(data.appointments[0]).toMatchObject({
      id: appointment.id,
      lead_id: lead.id,
      lead: { first_name: lead.first_name, email: lead.email },
      assigned_to: { id: userId, name: commercialUser.name },
    })
    expect(data.users).toEqual([expect.objectContaining({ id: userId, role: 'asesor' })])
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining(`la.tenant_id = ${tenantId}`))
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining("la.starts_at >= '2026-05-01T00:00:00.000Z'"))
  })

  it('creates an appointment, defaults assignment to creator, records interaction and updates next action', async () => {
    const response = await POST(new NextRequest('http://localhost/api/lead-appointments', {
      method: 'POST',
      body: JSON.stringify({
        lead_id: lead.id,
        starts_at: appointment.starts_at,
        duration_minutes: 30,
        appointment_type: 'call',
        reason: 'follow_up',
        notes: 'Confirmar interés',
      }),
    }))
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.appointment.id).toBe(appointment.id)
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO lead_appointments'))
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO lead_interactions'))
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining('UPDATE leads SET'))
  })

  it('blocks appointment creation for leads outside tenant scope', async () => {
    executeMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM users') && sql.includes('role, name, email')) return rows([commercialUser])
      if (sql.includes('information_schema.tables') && sql.includes('lead_appointments')) return rows([{ '?column?': 1 }])
      if (sql.includes('FROM leads') && sql.includes(`id = ${lead.id}`)) return rows([])
      return rows([])
    })

    const response = await POST(new NextRequest('http://localhost/api/lead-appointments', {
      method: 'POST',
      body: JSON.stringify({ lead_id: lead.id, starts_at: appointment.starts_at }),
    }))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Lead no encontrado')
  })

  it('patches appointment status and writes status_changed interaction', async () => {
    const response = await PATCH(new NextRequest(`http://localhost/api/lead-appointments/${appointment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed', outcome_notes: 'Matricula preparada' }),
    }), { params: Promise.resolve({ id: String(appointment.id) }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.appointment.id).toBe(appointment.id)
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining("status = 'completed'"))
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining("'status_changed'"))
  })

  it('cancels appointments logically instead of deleting rows', async () => {
    const response = await DELETE(new NextRequest(`http://localhost/api/lead-appointments/${appointment.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ outcome_notes: 'Lead pide llamar otro día' }),
    }), { params: Promise.resolve({ id: String(appointment.id) }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(executeMock).toHaveBeenCalledWith(expect.stringContaining("SET status = 'cancelled'"))
    expect(executeMock).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM lead_appointments'))
  })
})
