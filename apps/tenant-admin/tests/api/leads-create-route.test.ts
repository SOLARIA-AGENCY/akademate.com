import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetPayloadHMR,
  mockFind,
  mockCreate,
  mockExecute,
  mockCreateTransport,
  mockSendMail,
  mockPayload,
} = vi.hoisted(() => {
  const mockFind = vi.fn()
  const mockCreate = vi.fn()
  const mockExecute = vi.fn()
  const mockGetPayloadHMR = vi.fn()
  const mockSendMail = vi.fn()
  const mockCreateTransport = vi.fn(() => ({
    sendMail: mockSendMail,
  }))

  const mockPayload = {
    find: mockFind,
    create: mockCreate,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return {
    mockGetPayloadHMR,
    mockFind,
    mockCreate,
    mockExecute,
    mockCreateTransport,
    mockSendMail,
    mockPayload,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('nodemailer', () => ({
  createTransport: mockCreateTransport,
  default: {
    createTransport: mockCreateTransport,
  },
}))

import { POST } from '@/app/api/leads/route'

describe('Leads create route tenant resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockCreate.mockResolvedValue({ id: 321 })
    mockExecute.mockResolvedValue({ rows: [] })
    mockSendMail.mockResolvedValue({ messageId: 'msg-1' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  })

  it('assigns tenant by request host domain', async () => {
    mockFind.mockImplementation(async (args: any) => {
      if (args?.where?.domain?.equals === 'cepformacion.akademate.com') {
        return { docs: [{ id: 7, name: 'CEP FORMACION', domain: 'cepformacion.akademate.com' }] }
      }
      return { docs: [] }
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepformacion.akademate.com' },
      body: JSON.stringify({
        email: 'lead@real.com',
        first_name: 'Lead Real',
        phone: '+34 612 345 678',
        source_form: 'preinscripcion_convocatoria',
        gdpr_consent: true,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        data: expect.objectContaining({ tenant: 7 }),
      }),
    )
  })

  it('returns 422 when lead_type=inscripcion does not include a valid phone', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 7, name: 'CEP FORMACION', domain: 'cepformacion.akademate.com' }] })

    const request = new NextRequest('https://cepformacion.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepformacion.akademate.com' },
      body: JSON.stringify({
        email: 'lead@invalid.com',
        first_name: 'Lead Invalid',
        lead_type: 'inscripcion',
        source_page: 'https://cepformacion.akademate.com/convocatorias/SC-2026-002',
        gdpr_consent: true,
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(422)
    expect(payload.error).toContain('Telefono obligatorio')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('falls back to tenant slug when domain is not configured', async () => {
    mockFind.mockImplementation(async (args: any) => {
      if (args?.where?.domain?.equals === 'cepfp.akademate.com') return { docs: [] }
      if (args?.where?.slug?.equals === 'cepfp') {
        return { docs: [{ id: 9, name: 'CEP FP', slug: 'cepfp' }] }
      }
      return { docs: [{ id: 1, name: 'Default Tenant' }] }
    })

    const request = new NextRequest('https://cepfp.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepfp.akademate.com' },
      body: JSON.stringify({
        email: 'slug@real.com',
        first_name: 'Slug User',
        gdpr_consent: true,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        data: expect.objectContaining({ tenant: 9 }),
      }),
    )
  })

  it('extracts fbclid from source_page and marks test leads when test_event_code is present', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 7, name: 'CEP FORMACION', domain: 'cepformacion.akademate.com' }] })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns')) {
        return {
          rows: [
            { column_name: 'source_page' },
            { column_name: 'fbclid' },
            { column_name: 'is_test' },
            { column_name: 'source_details' },
          ],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepformacion.akademate.com' },
      body: JSON.stringify({
        email: 'lead+test@real.com',
        first_name: 'Lead Test',
        phone: '+34 612 345 678',
        gdpr_consent: true,
        source_page: 'https://cepformacion.akademate.com/p/convocatorias/SC-2026-002?fbclid=FBCLID123',
        test_event_code: 'TEST123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const updateSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .find((sql) => sql.includes('UPDATE leads SET'))

    expect(updateSql).toContain("fbclid = 'FBCLID123'")
    expect(updateSql).toContain('is_test = true')
  })

  it('infers source_form/lead_type and campaign_code when request omits explicit origin fields', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 7, name: 'CEP FORMACION', domain: 'cepformacion.akademate.com' }] })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns')) {
        return {
          rows: [
            { column_name: 'source_form' },
            { column_name: 'source_page' },
            { column_name: 'lead_type' },
            { column_name: 'campaign_code' },
            { column_name: 'source_details' },
          ],
        }
      }
      return { rows: [] }
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepformacion.akademate.com' },
      body: JSON.stringify({
        email: 'lead@origin.com',
        first_name: 'Lead Origin',
        phone: '+34 612 345 678',
        gdpr_consent: true,
        source_page: 'https://cepformacion.akademate.com/p/convocatorias/sanidad-001',
        utm_campaign: 'meta-sanidad-cap',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const updateSql = mockExecute.mock.calls
      .map((call) => String(call[0]))
      .find((sql) => sql.includes('UPDATE leads SET'))

    expect(updateSql).toContain("source_form = 'preinscripcion_convocatoria'")
    expect(updateSql).toContain("lead_type = 'inscripcion'")
    expect(updateSql).toContain("campaign_code = 'meta-sanidad-cap'")
  })

  it('builds lead confirmation CTA with tenant public host and renders logo without circular distortion', async () => {
    mockFind.mockResolvedValue({ docs: [{ id: 7, name: 'CEP FORMACION', domain: 'cepformacion.akademate.com' }] })

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const request = new NextRequest('https://cepformacion.akademate.com/api/leads', {
      method: 'POST',
      headers: { host: 'cepformacion.akademate.com' },
      body: JSON.stringify({
        email: 'lead@email.com',
        first_name: 'Lead Email',
        phone: '+34 612 345 678',
        gdpr_consent: true,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    expect(mockSendMail).toHaveBeenCalledTimes(1)
    const emailPayload = mockSendMail.mock.calls[0]?.[0] as { html?: string }
    const html = emailPayload.html || ''

    expect(html).toContain('href="https://cepformacion.akademate.com"')
    expect(html).toContain('max-width:240px')
    expect(html).not.toContain('border-radius:50%')
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/email/send-welcome'),
      expect.anything(),
    )
  })
})
