import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetPayloadHMR, mockFind, mockCreate, mockExecute, mockPayload } = vi.hoisted(() => {
  const mockFind = vi.fn()
  const mockCreate = vi.fn()
  const mockExecute = vi.fn()
  const mockGetPayloadHMR = vi.fn()

  const mockPayload = {
    find: mockFind,
    create: mockCreate,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return { mockGetPayloadHMR, mockFind, mockCreate, mockExecute, mockPayload }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { POST } from '@/app/api/leads/route'

describe('Leads create route tenant resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockCreate.mockResolvedValue({ id: 321 })
    mockExecute.mockResolvedValue({ rows: [] })
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
})

