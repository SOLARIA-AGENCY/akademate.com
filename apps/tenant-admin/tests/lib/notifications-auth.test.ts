import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getPayloadMock = vi.fn()
const verifyMock = vi.fn()
const resolverMock = vi.fn()

vi.mock('payload', () => ({ getPayload: getPayloadMock }))
vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))
vi.mock('@/lib/server/session', () => ({ verifyAvailableSession: verifyMock }))
vi.mock('@/lib/server/payload-principal', () => ({
  createPayloadIdentityResolver: () => resolverMock,
}))

describe('notifications authenticated principal resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPayloadMock.mockResolvedValue({ findByID: vi.fn() })
  })

  it('requires current persisted identity resolution for every token class', async () => {
    const { resolveNotificationsPrincipal } = await import('@/lib/server/notifications-auth')
    verifyMock.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/notifications', {
      headers: { cookie: 'payload-token=signed; akademate_session_v2=v2' },
    })
    expect(await resolveNotificationsPrincipal(request)).toBeNull()
    expect(verifyMock).toHaveBeenCalledWith(
      { payloadToken: 'signed', sessionV2: 'v2' },
      { resolveIdentity: resolverMock, requireResolvedIdentity: true },
    )
  })
})
