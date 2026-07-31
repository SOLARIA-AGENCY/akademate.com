// @vitest-environment node

import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.stubEnv('CONTACT_MAILER_URL', 'https://mailer.example.workers.dev')
  vi.stubEnv('CONTACT_MAILER_TOKEN', 'test-mailer-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('public waitlist endpoint', () => {
  it('emails a validated request without exposing the destination', async () => {
    const upstream = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'lead-1' }), { status: 201 }))
    vi.stubGlobal('fetch', upstream)

    const response = await POST(request({ email: 'learner@example.com', privacy_policy_accepted: true, website: '' }))
    expect(response.status).toBe(200)
    const notification = JSON.parse(upstream.mock.calls.at(0)![1].body as string)
    expect(notification).toMatchObject({
      kind: 'waitlist',
      replyTo: 'learner@example.com',
      subject: '[Akademate] New early-access request',
    })
    expect(notification).not.toHaveProperty('to')
    expect(await response.text()).not.toContain('test-mailer-token')
  })

  it('fails closed without a mail credential', async () => {
    vi.stubEnv('CONTACT_MAILER_TOKEN', '')
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request({ email: 'learner@example.com', privacy_policy_accepted: true, website: '' }))
    expect(response.status).toBe(502)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('silently accepts honeypot submissions without sending', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request({ email: 'bot@example.com', privacy_policy_accepted: true, website: 'https://spam.invalid' }))
    expect(response.status).toBe(202)
    expect(upstream).not.toHaveBeenCalled()
  })
})
