// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/auth/impersonate-redirect/route'

describe('disabled impersonation token redirect', () => {
  it('always returns 404 and never accepts a token URL', async () => {
    const response = await GET(
      new Request('https://tenant.akademate.com/api/auth/impersonate-redirect?token=secret.jwt'),
    )

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })
})
