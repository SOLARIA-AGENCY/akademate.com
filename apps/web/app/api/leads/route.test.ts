// @vitest-environment node

import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

beforeEach(() => {
  vi.stubEnv('CONTACT_MAILER_URL', 'https://mailer.example.workers.dev')
  vi.stubEnv('CONTACT_MAILER_TOKEN', 'test-mailer-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

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
    const upstream = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'lead-1' }), { status: 201 }))
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request(validLead))
    expect(response.status).toBe(200)
    const notification = JSON.parse(upstream.mock.calls.at(0)![1].body as string)
    expect(upstream.mock.calls.at(0)![0]).toBe('https://mailer.example.workers.dev')
    expect(notification).toMatchObject({
      kind: 'contact',
      replyTo: 'ada@example.com',
      subject: '[Akademate] Demo request',
    })
    const notificationHeaders = upstream.mock.calls.at(0)![1].headers as Record<string, string>
    expect(notificationHeaders.Authorization).toBe('Bearer test-mailer-token')
    expect(notification).not.toHaveProperty('to')
    const forwarded = JSON.parse(upstream.mock.calls.at(1)![1].body as string)
    expect(forwarded).toMatchObject({ source: 'akademate_public_contact', gdpr_consent: true, privacy_policy_accepted: true })
    expect(forwarded).not.toHaveProperty('website')
    expect(await response.text()).not.toContain('test-mailer-token')
  })

  it('fails closed without private mail configuration and never calls a provider', async () => {
    vi.stubEnv('CONTACT_MAILER_TOKEN', '')
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request(validLead))
    expect(response.status).toBe(502)
    expect(upstream).not.toHaveBeenCalled()
    expect(await response.text()).not.toContain('test-mailer-token')
  })

  it('returns a generic error when mail delivery fails without leaking provider details', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('account details', { status: 403 }))
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request(validLead))
    expect(response.status).toBe(502)
    const body = await response.text()
    expect(body).toContain('No se pudo enviar la solicitud')
    expect(body).not.toMatch(/account details|test-mailer-token|workers\.dev/i)
  })

  it('keeps successful email delivery even when optional CMS persistence fails', async () => {
    const upstream = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email-1' }), { status: 200 }))
      .mockRejectedValueOnce(new Error('CMS unavailable'))
    vi.stubGlobal('fetch', upstream)
    const response = await POST(request(validLead))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })
})
