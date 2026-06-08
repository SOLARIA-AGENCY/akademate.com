import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/meta/assets/upload/route'

const payloadCreate = vi.fn()
const resolveMetaRequestContext = vi.fn()

vi.mock('../../app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: (...args: unknown[]) => resolveMetaRequestContext(...args),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({ create: payloadCreate })),
}))

vi.mock('@payload-config', () => ({ default: {} }))

function mockFormData(values: Record<string, unknown>) {
  return {
    get: vi.fn((key: string) => values[key] ?? null),
  } as any
}

function mockRequest(form: any = new FormData()) {
  return {
    nextUrl: new URL('https://cepformacion.akademate.com/api/meta/assets/upload'),
    headers: new Headers({ 'content-type': 'multipart/form-data' }),
    formData: vi.fn(async () => form),
  } as any
}

describe('/api/meta/assets/upload', () => {
  beforeEach(() => {
    payloadCreate.mockReset()
    resolveMetaRequestContext.mockReset()
    resolveMetaRequestContext.mockResolvedValue({ authenticated: true, userId: 7, tenantId: '2' })
    payloadCreate.mockResolvedValue({ id: 123, filename: 'asset.webp', url: '/api/media/file/asset.webp', mimeType: 'image/webp', filesize: 1000 })
  })

  it('rejects unauthenticated uploads', async () => {
    resolveMetaRequestContext.mockResolvedValue({ authenticated: false, userId: null, tenantId: '2' })
    const res = await POST(mockRequest())
    expect(res.status).toBe(401)
  })

  it('uploads a valid image asset to media and returns media id', async () => {
    const file = {
      name: 'higiene.png',
      type: 'image/png',
      size: 3,
      arrayBuffer: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
    }
    const form = mockFormData({
      ratio: '1:1',
      convocatoriaId: '2',
      courseName: 'Higiene Bucodental',
      file,
    })

    const res = await POST(mockRequest(form))
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.doc.id).toBe(123)
    expect(payload.doc.ratio).toBe('1:1')
    expect(payloadCreate).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media' }))
  })

  it('rejects unsupported ratios', async () => {
    const form = mockFormData({
      ratio: '4:5',
      file: {
        name: 'bad.png',
        type: 'image/png',
        size: 1,
        arrayBuffer: vi.fn(async () => new Uint8Array([1]).buffer),
      },
    })
    const res = await POST(mockRequest(form))
    expect(res.status).toBe(400)
  })
})
