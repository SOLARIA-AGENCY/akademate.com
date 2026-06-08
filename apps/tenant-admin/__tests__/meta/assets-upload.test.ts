import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/meta/assets/upload/route'

const cookieGet = vi.fn()
const payloadCreate = vi.fn()

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({ create: payloadCreate })),
}))

vi.mock('@payload-config', () => ({ default: {} }))

function session(role = 'marketing') {
  return encodeURIComponent(JSON.stringify({ user: { id: 7, email: 'marketing@test.com', role } }))
}

function mockFormData(values: Record<string, unknown>) {
  return {
    get: vi.fn((key: string) => values[key] ?? null),
  } as any
}

describe('/api/meta/assets/upload', () => {
  beforeEach(() => {
    cookieGet.mockReset()
    payloadCreate.mockReset()
    payloadCreate.mockResolvedValue({ id: 123, filename: 'asset.webp', url: '/api/media/file/asset.webp', mimeType: 'image/webp', filesize: 1000 })
  })

  it('rejects unauthenticated uploads', async () => {
    cookieGet.mockReturnValue(undefined)
    const req = {
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn(async () => new FormData()),
    } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('uploads a valid image asset to media and returns media id', async () => {
    cookieGet.mockReturnValue({ value: session('marketing') })
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

    const req = {
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn(async () => form),
    } as any
    const res = await POST(req)
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.doc.id).toBe(123)
    expect(payload.doc.ratio).toBe('1:1')
    expect(payloadCreate).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media' }))
  })

  it('rejects unsupported ratios', async () => {
    cookieGet.mockReturnValue({ value: session('marketing') })
    const form = mockFormData({
      ratio: '4:5',
      file: {
      name: 'bad.png',
      type: 'image/png',
      size: 1,
      arrayBuffer: vi.fn(async () => new Uint8Array([1]).buffer),
      },
    })
    const req = {
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn(async () => form),
    } as any
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
