/**
 * AKADEMATE.COM - JWT Authentication Module
 *
 * Blueprint Reference: Section 6.1 - Autenticación
 *
 * Implements JWT-based authentication with:
 * - Access tokens (short-lived, 15min)
 * - Refresh tokens (long-lived, 7d)
 * - Secure signing with jose library
 *
 * SECURITY: Tokens include tenant_id claim for RLS integration.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

/**
 * JWT Token payload structure
 */
export interface TokenPayload extends JWTPayload {
  /** User ID */
  sub: string
  /** Tenant ID (for RLS context) */
  tid: number
  /** User roles within tenant */
  roles: string[]
  /** Token type: 'access' | 'refresh' */
  type: 'access' | 'refresh'
  /** Impersonated by (admin user ID, if impersonating) */
  imp?: string
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

/**
 * JWT configuration
 */
export interface JWTConfig {
  /** Secret key for signing (min 32 bytes) */
  secret: string
  /** Issuer claim */
  issuer: string
  /** Audience claim */
  audience: string
  /** Access token expiration in seconds (default: 900 = 15min) */
  accessTokenExpiry?: number
  /** Refresh token expiration in seconds (default: 604800 = 7d) */
  refreshTokenExpiry?: number
}

const DEFAULT_ACCESS_EXPIRY = 900 // 15 minutes
const DEFAULT_REFRESH_EXPIRY = 604800 // 7 days

/**
 * Create a secret key from string
 */
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/**
 * Generate an access token
 */
export async function generateAccessToken(
  config: JWTConfig,
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  const secret = getSecretKey(config.secret)
  const expiry = config.accessTokenExpiry ?? DEFAULT_ACCESS_EXPIRY

  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(`${expiry}s`)
    .sign(secret)
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(
  config: JWTConfig,
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  const secret = getSecretKey(config.secret)
  const expiry = config.refreshTokenExpiry ?? DEFAULT_REFRESH_EXPIRY

  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(`${expiry}s`)
    .sign(secret)
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  config: JWTConfig,
  payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>
): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(config, payload),
    generateRefreshToken(config, payload),
  ])

  return {
    accessToken,
    refreshToken,
    expiresIn: config.accessTokenExpiry ?? DEFAULT_ACCESS_EXPIRY,
    tokenType: 'Bearer',
  }
}

/**
 * Verify and decode a token
 */
export async function verifyToken(
  config: JWTConfig,
  token: string
): Promise<{ valid: true; payload: TokenPayload } | { valid: false; error: string }> {
  const secret = getSecretKey(config.secret)

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: config.issuer,
      audience: config.audience,
    })

    return {
      valid: true,
      payload: payload as TokenPayload,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed'
    return {
      valid: false,
      error: message,
    }
  }
}

/**
 * Verify an access token specifically
 */
export async function verifyAccessToken(
  config: JWTConfig,
  token: string
): Promise<{ valid: true; payload: TokenPayload } | { valid: false; error: string }> {
  const result = await verifyToken(config, token)

  if (!result.valid) {
    return result
  }

  if (result.payload.type !== 'access') {
    return {
      valid: false,
      error: 'Invalid token type: expected access token',
    }
  }

  return result
}

/**
 * Verify a refresh token specifically
 */
export async function verifyRefreshToken(
  config: JWTConfig,
  token: string
): Promise<{ valid: true; payload: TokenPayload } | { valid: false; error: string }> {
  const result = await verifyToken(config, token)

  if (!result.valid) {
    return result
  }

  if (result.payload.type !== 'refresh') {
    return {
      valid: false,
      error: 'Invalid token type: expected refresh token',
    }
  }

  return result
}

/**
 * Decode a token without verification (for debugging/logging)
 * WARNING: Do not trust the payload without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payloadPart = parts[1] ?? ''
    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf-8')
    )
    return payload as TokenPayload
  } catch {
    return null
  }
}

/**
 * Check if token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}

/**
 * Extract tenant ID from token (for RLS context)
 * Returns null if token is invalid or missing tid claim
 */
export function extractTenantId(token: string): number | null {
  const payload = decodeToken(token)
  return payload?.tid ?? null
}

/**
 * Create impersonation token
 * Admin can impersonate another user while maintaining audit trail
 */
export async function generateImpersonationTokens(
  config: JWTConfig,
  adminUserId: string,
  targetPayload: Omit<TokenPayload, 'type' | 'iat' | 'exp' | 'imp'>
): Promise<TokenPair> {
  return generateTokenPair(config, {
    ...targetPayload,
    imp: adminUserId, // Track who is impersonating
  })
}

/**
 * Check if token is from impersonation session
 */
export function isImpersonationToken(payload: TokenPayload): boolean {
  return payload.imp !== undefined
}
