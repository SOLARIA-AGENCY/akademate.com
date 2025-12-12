import { isAuthenticated, getUser, logout } from '@/lib/auth'

describe('Auth Helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isAuthenticated', () => {
    it('returns false when no token exists', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('returns true when token exists', () => {
      localStorage.setItem('cep_auth_token', 'test_token')
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('getUser', () => {
    it('returns null when no user data exists', () => {
      expect(getUser()).toBeNull()
    })

    it('returns user object when data exists', () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        role: 'Admin'
      }
      localStorage.setItem('cep_user', JSON.stringify(mockUser))
      
      expect(getUser()).toEqual(mockUser)
    })

    it('returns null when user data is invalid JSON', () => {
      localStorage.setItem('cep_user', 'invalid json')
      expect(getUser()).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears auth token and user data', () => {
      localStorage.setItem('cep_auth_token', 'test_token')
      localStorage.setItem('cep_user', '{}')
      
      logout()
      
      expect(localStorage.getItem('cep_auth_token')).toBeNull()
      expect(localStorage.getItem('cep_user')).toBeNull()
    })
  })
})
