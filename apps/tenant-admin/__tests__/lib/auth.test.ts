import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getUser, isAuthenticated, logout } from '@/lib/auth'

describe('Auth Helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAuthenticated', () => {
    it('returns false when session endpoint fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
      await expect(isAuthenticated()).resolves.toBe(false)
    })

    it('returns true when authenticated session exists', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            authenticated: true,
            user: { id: 1, name: 'Test User', email: 'test@test.com', role: 'admin' },
          }),
        }),
      )
      await expect(isAuthenticated()).resolves.toBe(true)
    })
  })

  describe('getUser', () => {
    it('returns null when no session exists', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
      await expect(getUser()).resolves.toBeNull()
    })

    it('returns user when session exists', async () => {
      const user = { id: 1, name: 'Test User', email: 'test@test.com', role: 'admin' }
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ authenticated: true, user }),
        }),
      )
      await expect(getUser()).resolves.toEqual(user)
    })
  })

  describe('logout', () => {
    it('calls both logout endpoints', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchMock)

      await logout()

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/session',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      )
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      )
    })
  })
})
