import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../app/api/leads/route'

function request(body: unknown) {
  return new NextRequest('http://localhost:3006/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => vi.restoreAllMocks())

describe('lead consent boundary', () => {
  it.each([
    {},
    { gdpr_consent: false, privacy_policy_accepted: true, privacy_policy_version: '2026-07-29' },
    { gdpr_consent: 'true', privacy_policy_accepted: true, privacy_policy_version: '2026-07-29' },
    { gdpr_consent: true, privacy_policy_accepted: true },
  ])('rejects invalid consent without contacting CMS: %j', async (body) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const response = await POST(request({ email: 'person@example.test', ...body }))
    expect(response.status).toBe(400)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('normalizes and forwards only allowlisted fields after explicit consent', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ id: 'lead-1' }), { status: 201 }))
    const response = await POST(
      request({
        first_name: 'Ada',
        last_name: 'Lovelace',
        email: ' ada@example.test ',
        message: 'Demo',
        gdpr_consent: true,
        privacy_policy_accepted: true,
        privacy_policy_version: '2026-07-29',
        tenantId: 'must-not-forward',
        role: 'admin',
      })
    )
    expect(response.status).toBe(200)
    const forwarded = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body))
    expect(forwarded).not.toHaveProperty('tenantId')
    expect(forwarded).not.toHaveProperty('role')
    expect(forwarded.privacy_policy_version).toBe('2026-07-29')
  })

  it('fails closed when the CMS is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    const response = await POST(
      request({
        email: 'person@example.test',
        gdpr_consent: true,
        privacy_policy_accepted: true,
        privacy_policy_version: '2026-07-29',
      })
    )
    expect(response.status).toBe(500)
  })
})
