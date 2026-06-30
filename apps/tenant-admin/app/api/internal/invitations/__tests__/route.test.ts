import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, queryFirstMock, queryRowsMock, sendMailMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    create: vi.fn(),
  },
  queryFirstMock: vi.fn(),
  queryRowsMock: vi.fn(),
  sendMailMock: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => payloadMock),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('@/@payload-config/lib/db', () => ({
  queryFirst: queryFirstMock,
  queryRows: queryRowsMock,
}))

vi.mock('../../../../../src/lib/email/transporter', () => ({
  sendMail: sendMailMock,
}))

async function loadInvitationsRoute() {
  vi.resetModules()
  return import('../route')
}

async function loadVerifyRoute() {
  vi.resetModules()
  return import('../verify/route')
}

async function loadAcceptRoute() {
  vi.resetModules()
  return import('../accept/route')
}

describe('/api/internal/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMock.find.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'tenants') {
        return {
          docs: [{
            id: 1,
            name: 'CEP FORMACION',
            domain: 'cepformacion.akademate.com',
            branding_primary_color: '#F2014B',
            branding_logo_url: '/cep-logo.png',
          }],
        }
      }
      if (collection === 'users') return { docs: [] }
      return { docs: [] }
    })
    payloadMock.create.mockResolvedValue({ id: 7 })
    queryFirstMock.mockResolvedValue(undefined)
    queryRowsMock.mockResolvedValue([])
    sendMailMock.mockResolvedValue({ success: true, messageId: 'mail-1' })
  })

  it('creates an invitation with the shared db helpers and sends the email', async () => {
    const { POST } = await loadInvitationsRoute()

    const response = await POST(new NextRequest('http://localhost/api/internal/invitations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Colaborador Test',
        email: 'Info@CursosTenerife.es',
        role: 'gestor',
      }),
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(queryFirstMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM user_invitations'),
      ['info@cursostenerife.es'],
    )
    expect(queryFirstMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO user_invitations'),
      expect.arrayContaining(['info@cursostenerife.es', 'Colaborador Test', 'gestor']),
    )
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'info@cursostenerife.es',
      subject: expect.stringContaining('CEP FORMACION'),
    }))
  })

  it('rejects an existing pending invitation before sending email', async () => {
    queryFirstMock.mockResolvedValueOnce({ id: 99 })
    const { POST } = await loadInvitationsRoute()

    const response = await POST(new NextRequest('http://localhost/api/internal/invitations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Colaborador Test',
        email: 'info@cursostenerife.es',
        role: 'gestor',
      }),
    }))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toMatch(/pendiente/i)
    expect(sendMailMock).not.toHaveBeenCalled()
  })

  it('verifies a valid pending invitation token', async () => {
    queryFirstMock.mockResolvedValueOnce({
      id: 1,
      email: 'info@cursostenerife.es',
      name: 'Colaborador Test',
      role: 'gestor',
      status: 'pending',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    })
    const { GET } = await loadVerifyRoute()

    const response = await GET(new NextRequest(`http://localhost/api/internal/invitations/verify?token=${'a'.repeat(64)}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual(expect.objectContaining({
      email: 'info@cursostenerife.es',
      role: 'gestor',
    }))
  })

  it('accepts an invitation and creates the Payload user', async () => {
    queryFirstMock.mockResolvedValueOnce({
      id: 1,
      email: 'info@cursostenerife.es',
      name: 'Colaborador Test',
      role: 'gestor',
      status: 'pending',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      tenant_id: 1,
    })
    const { POST } = await loadAcceptRoute()

    const response = await POST(new NextRequest('http://localhost/api/internal/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({
        token: 'a'.repeat(64),
        password: 'password-segura',
      }),
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      data: expect.objectContaining({
        email: 'info@cursostenerife.es',
        role: 'gestor',
      }),
    }))
    expect(queryFirstMock).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'accepted'"),
      [1],
    )
  })
})
