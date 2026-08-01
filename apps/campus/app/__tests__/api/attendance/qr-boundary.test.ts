import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET, POST } from '../../../api/attendance/qr-checkin/route'

function postRequest() {
  return new NextRequest('http://localhost:3105/api/attendance/qr-checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'attacker-controlled-session',
      courseRunId: 'attacker-controlled-course',
      userId: 'attacker-controlled-user',
      enrollmentId: 'attacker-controlled-enrollment',
      timestamp: new Date().toISOString(),
      signature: 'attacker-controlled-signature',
    }),
  })
}

describe('Campus QR attendance boundary', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('fails closed before using client-provided identity or calling a data plane', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(postRequest())
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(body).toMatchObject({
      success: false,
      code: 'ATTENDANCE_NOT_CONFIGURED',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not expose an unauthenticated instructor QR generator', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3105/api/attendance/qr-checkin?sessionId=1&courseRunId=1')
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.code).toBe('ATTENDANCE_NOT_CONFIGURED')
  })
})
