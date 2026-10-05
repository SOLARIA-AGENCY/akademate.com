// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import {
  AUTH_COOKIE_NAMES,
  clearCookieVariants,
  resolveAuthCookieOptions,
} from '@/lib/server/auth-cookies'

describe('auth cookie symmetry', () => {
  it('uses the request host for the shared domain unless proxy headers are trusted', () => {
    delete process.env.TRUST_PROXY_HEADERS
    const request = new Request('https://tenant.akademate.com/api/auth/session', {
      headers: {
        host: 'tenant.akademate.com',
        'x-forwarded-host': 'attacker.example',
      },
    })

    expect(resolveAuthCookieOptions(request, 900)).toMatchObject({
      domain: '.akademate.com',
      maxAge: 900,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
  })

  it('clears host-only and shared-domain variants for every auth cookie', () => {
    const store = { delete: vi.fn() }
    const request = new Request('https://tenant.akademate.com/api/auth/logout', {
      headers: { host: 'tenant.akademate.com' },
    })

    clearCookieVariants(store, AUTH_COOKIE_NAMES, request)

    for (const name of AUTH_COOKIE_NAMES) {
      expect(store.delete).toHaveBeenCalledWith(name)
      expect(store.delete).toHaveBeenCalledWith({
        name,
        path: '/',
        domain: '.akademate.com',
      })
    }
  })
})
