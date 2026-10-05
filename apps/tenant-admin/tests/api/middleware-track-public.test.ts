import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('Middleware public tracking route', () => {
  it('allows anonymous POST requests to /api/track', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/api/track', {
      method: 'POST',
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
  })
})
