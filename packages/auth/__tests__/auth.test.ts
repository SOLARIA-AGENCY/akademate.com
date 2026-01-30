/**
 * AKADEMATE.COM - Auth Module Tests
 *
 * Tests for JWT, password hashing, and RBAC utilities.
 */

import { describe, expect, it } from 'vitest'
import {
  // JWT
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTenantId,
  isImpersonationToken,
  type JWTConfig,
  // Password
  hashPassword,
  verifyPassword,
  validatePassword,
  needsRehash,
  generateRandomPassword,
  generateSecureToken,
  hashToken,
  // RBAC
  RESOURCES,
  ACTIONS,
  hasPermission,
  assertPermission,
  isRoleAtLeast,
  hasRole,
  isValidRole,
  parseRoles,
  getHighestRole,
  canImpersonate,
  canImpersonateUser,
  AuthorizationError,
} from '../src'

// Test JWT config
const testJWTConfig: JWTConfig = {
  secret: 'test-secret-key-must-be-at-least-32-bytes-long',
  issuer: 'akademate-test',
  audience: 'akademate-users',
  accessTokenExpiry: 900,
  refreshTokenExpiry: 604800,
}

describe('JWT Module', () => {
  describe('generateAccessToken', () => {
    it('generates a valid access token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT format
    })

    it('sets correct token type', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const payload = decodeToken(token)
      expect(payload?.type).toBe('access')
    })
  })

  describe('generateRefreshToken', () => {
    it('generates a valid refresh token', async () => {
      const token = await generateRefreshToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const payload = decodeToken(token)
      expect(payload?.type).toBe('refresh')
    })
  })

  describe('generateTokenPair', () => {
    it('generates both access and refresh tokens', async () => {
      const result = await generateTokenPair(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.tokenType).toBe('Bearer')
      expect(result.expiresIn).toBe(900)
    })
  })

  describe('verifyAccessToken', () => {
    it('verifies a valid access token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const result = await verifyAccessToken(testJWTConfig, token)
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.payload.sub).toBe('user-123')
        expect(result.payload.tid).toBe(1)
        expect(result.payload.roles).toEqual(['admin'])
      }
    })

    it('rejects a refresh token as access token', async () => {
      const token = await generateRefreshToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const result = await verifyAccessToken(testJWTConfig, token)
      expect(result.valid).toBe(false)
    })

    it('rejects an invalid token', async () => {
      const result = await verifyAccessToken(testJWTConfig, 'invalid-token')
      expect(result.valid).toBe(false)
    })
  })

  describe('verifyRefreshToken', () => {
    it('verifies a valid refresh token', async () => {
      const token = await generateRefreshToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['student'],
      })

      const result = await verifyRefreshToken(testJWTConfig, token)
      expect(result.valid).toBe(true)
    })

    it('rejects an access token as refresh token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const result = await verifyRefreshToken(testJWTConfig, token)
      expect(result.valid).toBe(false)
    })
  })

  describe('extractTenantId', () => {
    it('extracts tenant ID from token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 42,
        roles: ['admin'],
      })

      expect(extractTenantId(token)).toBe(42)
    })

    it('returns null for invalid token', () => {
      expect(extractTenantId('invalid')).toBeNull()
    })
  })

  describe('isImpersonationToken', () => {
    it('detects impersonation token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'target-user',
        tid: 1,
        roles: ['student'],
        imp: 'admin-user',
      })

      const payload = decodeToken(token)!
      expect(isImpersonationToken(payload)).toBe(true)
    })

    it('returns false for normal token', async () => {
      const token = await generateAccessToken(testJWTConfig, {
        sub: 'user-123',
        tid: 1,
        roles: ['admin'],
      })

      const payload = decodeToken(token)!
      expect(isImpersonationToken(payload)).toBe(false)
    })
  })
})

describe('Password Module', () => {
  describe('hashPassword / verifyPassword', () => {
    it('hashes and verifies password correctly', async () => {
      const password = 'MySecureP@ss123'
      const hash = await hashPassword(password)

      expect(hash).toContain('$pbkdf2-sha512$')
      expect(await verifyPassword(password, hash)).toBe(true)
    })

    it('rejects incorrect password', async () => {
      const hash = await hashPassword('correct-password')
      expect(await verifyPassword('wrong-password', hash)).toBe(false)
    })

    it('generates unique hashes for same password', async () => {
      const password = 'SamePassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Different salts
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('validatePassword', () => {
    it('accepts valid password', () => {
      const result = validatePassword('MyPassword123')
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects short password', () => {
      const result = validatePassword('Ab1')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters')
    })

    it('rejects password without uppercase', () => {
      const result = validatePassword('password123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('rejects password without lowercase', () => {
      const result = validatePassword('PASSWORD123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('rejects password without numbers', () => {
      const result = validatePassword('PasswordOnly')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })
  })

  describe('needsRehash', () => {
    it('returns false for current iteration count', async () => {
      const hash = await hashPassword('test')
      expect(needsRehash(hash)).toBe(false)
    })

    it('returns true for unknown format', () => {
      expect(needsRehash('invalid-hash')).toBe(true)
    })
  })

  describe('generateRandomPassword', () => {
    it('generates password of correct length', () => {
      const password = generateRandomPassword(16)
      expect(password.length).toBe(16)
    })

    it('generates unique passwords', () => {
      const p1 = generateRandomPassword()
      const p2 = generateRandomPassword()
      expect(p1).not.toBe(p2)
    })
  })

  describe('generateSecureToken', () => {
    it('generates URL-safe token', () => {
      const token = generateSecureToken()
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('generates tokens of expected length', () => {
      // 32 bytes -> ~43 base64url characters
      const token = generateSecureToken(32)
      expect(token.length).toBeGreaterThan(40)
    })
  })

  describe('hashToken', () => {
    it('hashes token consistently', () => {
      const token = 'test-token'
      const hash1 = hashToken(token)
      const hash2 = hashToken(token)
      expect(hash1).toBe(hash2)
    })
  })
})

describe('RBAC Module', () => {
  describe('hasPermission', () => {
    it('superadmin has all permissions', () => {
      expect(hasPermission(['superadmin'], RESOURCES.TENANTS, ACTIONS.DELETE)).toBe(true)
      expect(hasPermission(['superadmin'], RESOURCES.USERS, ACTIONS.IMPERSONATE)).toBe(true)
    })

    it('admin has tenant management permissions', () => {
      expect(hasPermission(['admin'], RESOURCES.COURSES, ACTIONS.CREATE)).toBe(true)
      expect(hasPermission(['admin'], RESOURCES.USERS, ACTIONS.IMPERSONATE)).toBe(true)
    })

    it('student has limited permissions', () => {
      expect(hasPermission(['student'], RESOURCES.COURSES, ACTIONS.READ)).toBe(true)
      expect(hasPermission(['student'], RESOURCES.COURSES, ACTIONS.CREATE)).toBe(false)
      expect(hasPermission(['student'], RESOURCES.SUBMISSIONS, ACTIONS.CREATE)).toBe(true)
    })

    it('checks multiple roles', () => {
      expect(hasPermission(['student', 'instructor'], RESOURCES.GRADES, ACTIONS.CREATE)).toBe(true)
    })
  })

  describe('assertPermission', () => {
    it('does not throw when permission exists', () => {
      expect(() => {
        assertPermission(['admin'], RESOURCES.COURSES, ACTIONS.CREATE)
      }).not.toThrow()
    })

    it('throws AuthorizationError when permission denied', () => {
      expect(() => {
        assertPermission(['student'], RESOURCES.COURSES, ACTIONS.DELETE)
      }).toThrow(AuthorizationError)
    })
  })

  describe('isRoleAtLeast', () => {
    it('correctly compares role hierarchy', () => {
      expect(isRoleAtLeast('admin', 'student')).toBe(true)
      expect(isRoleAtLeast('admin', 'admin')).toBe(true)
      expect(isRoleAtLeast('student', 'admin')).toBe(false)
      expect(isRoleAtLeast('superadmin', 'admin')).toBe(true)
    })
  })

  describe('hasRole', () => {
    it('checks if user has any required role', () => {
      expect(hasRole(['student', 'instructor'], ['admin', 'instructor'])).toBe(true)
      expect(hasRole(['student'], ['admin', 'instructor'])).toBe(false)
    })
  })

  describe('getHighestRole', () => {
    it('returns highest privileged role', () => {
      expect(getHighestRole(['student', 'instructor', 'admin'])).toBe('admin')
      expect(getHighestRole(['student'])).toBe('student')
      expect(getHighestRole([])).toBeNull()
    })
  })

  describe('isValidRole', () => {
    it('validates role strings', () => {
      expect(isValidRole('admin')).toBe(true)
      expect(isValidRole('superadmin')).toBe(true)
      expect(isValidRole('invalid')).toBe(false)
    })
  })

  describe('parseRoles', () => {
    it('parses valid roles from array', () => {
      const roles = parseRoles(['admin', 'invalid', 'student'])
      expect(roles).toEqual(['admin', 'student'])
    })

    it('returns empty array for invalid input', () => {
      expect(parseRoles(null)).toEqual([])
      expect(parseRoles('string')).toEqual([])
    })
  })

  describe('canImpersonate', () => {
    it('admin and superadmin can impersonate', () => {
      expect(canImpersonate(['superadmin'])).toBe(true)
      expect(canImpersonate(['admin'])).toBe(true)
      expect(canImpersonate(['gestor'])).toBe(false)
      expect(canImpersonate(['student'])).toBe(false)
    })
  })

  describe('canImpersonateUser', () => {
    it('cannot impersonate yourself', () => {
      expect(canImpersonateUser(['admin'], ['student'], 'user-1', 'user-1')).toBe(false)
    })

    it('admin cannot impersonate other admins', () => {
      expect(canImpersonateUser(['admin'], ['admin'], 'admin-1', 'admin-2')).toBe(false)
    })

    it('superadmin can impersonate anyone', () => {
      expect(canImpersonateUser(['superadmin'], ['admin'], 'super-1', 'admin-1')).toBe(true)
    })

    it('admin can impersonate students', () => {
      expect(canImpersonateUser(['admin'], ['student'], 'admin-1', 'student-1')).toBe(true)
    })
  })
})
