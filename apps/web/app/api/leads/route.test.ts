// @vitest-environment node

import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const validLead = {
  first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phone: '', subject: 'demo',
  message: 'Necesito evaluar una implantación para dos sedes.', privacy_policy_accepted: true,
  marketing_consent: false, website: '', utm: {},
}

function request(body: unknown, headers?: Record<string, string>) {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('public lead endpoint', () => {
  it('fails closed without explicit privacy consent', async () => {
    const response = await POST(request({ ...validLead, privacy_policy_accepted: false }))
    expect(response.status).toBe(400)
  })

  it('does not call upstream for honeypot submissions', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request({ ...validLead, website: 'https://spam.invalid' }))
    expect(response.status).toBe(202)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects unlisted fields instead of forwarding arbitrary input', async () => {
    const response = await POST(request({ ...validLead, role: 'superadmin' }))
    expect(response.status).toBe(400)
  })

  it('normalizes the allowed payload before forwarding', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'lead-1' }), { status: 201 }))
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request(validLead))
    expect(response.status).toBe(200)
    const forwarded = JSON.parse(upstream.mock.calls.at(0)![1].body as string)
    expect(forwarded).toMatchObject({ source: 'akademate_public_contact', gdpr_consent: true, privacy_policy_accepted: true })
    expect(forwarded).not.toHaveProperty('website')
  })
})
