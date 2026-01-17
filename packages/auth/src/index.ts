/**
 * AKADEMATE.COM - Authentication & Authorization Module
 *
 * @module @akademate/auth
 *
 * Blueprint Reference: Section 6 - IAM
 *
 * Provides:
 * - JWT token management (access + refresh tokens)
 * - Password hashing (PBKDF2-SHA512)
 * - Role-based access control (RBAC)
 * - Session management
 */

// JWT utilities
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  extractTenantId,
  generateImpersonationTokens,
  isImpersonationToken,
  type TokenPayload,
  type TokenPair,
  type JWTConfig,
} from './jwt'

// Password utilities
export {
  hashPassword,
  verifyPassword,
  validatePassword,
  needsRehash,
  generateRandomPassword,
  generateSecureToken,
  hashToken,
  DEFAULT_PASSWORD_POLICY,
  type PasswordPolicy,
  type PasswordValidationResult,
} from './password'

// RBAC utilities
export {
  ROLES,
  RESOURCES,
  ACTIONS,
  hasPermission,
  assertPermission,
  getPermissions,
  isRoleAtLeast,
  hasRole,
  hasAllRoles,
  isValidRole,
  parseRoles,
  getHighestRole,
  canImpersonate,
  canImpersonateUser,
  AuthorizationError,
  type Role,
  type Resource,
  type Action,
  type Permission,
} from './rbac'

// Session management
export {
  createSession,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  getUserSessions,
  cleanupExpiredSessions,
  validateSession,
  type Session,
  type CreateSessionInput,
  type SessionResult,
} from './session'

// MFA utilities
export {
  generateTotpSecret,
  verifyTotpToken,
  type TotpSecret,
} from './mfa'
