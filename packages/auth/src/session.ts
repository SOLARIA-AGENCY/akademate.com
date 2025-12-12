/**
 * AKADEMATE.COM - Session Management Module
 *
 * Blueprint Reference: Section 6.1 - Autenticación
 *
 * Manages user sessions with:
 * - Session creation and validation
 * - Refresh token rotation
 * - Device tracking
 * - Session invalidation
 */

import { sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { generateSecureToken, hashToken } from './password'
import { generateTokenPair, verifyRefreshToken, type JWTConfig, type TokenPair, type TokenPayload } from './jwt'
import type { Role } from './rbac'

/**
 * Session data structure
 */
export interface Session {
  id: string
  userId: string
  tenantId: number
  refreshTokenHash: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date
  expiresAt: Date
  lastUsedAt: Date
  revokedAt: Date | null
}

/**
 * Create session input
 */
export interface CreateSessionInput {
  userId: string
  tenantId: number
  roles: Role[]
  userAgent?: string
  ipAddress?: string
}

/**
 * Session creation result
 */
export interface SessionResult {
  session: Session
  tokens: TokenPair
}

/**
 * Create a new session and generate tokens
 */
export async function createSession(
  tx: PgTransaction<any, any, any>,
  jwtConfig: JWTConfig,
  input: CreateSessionInput
): Promise<SessionResult> {
  const { userId, tenantId, roles, userAgent, ipAddress } = input

  // Generate tokens
  const tokens = await generateTokenPair(jwtConfig, {
    sub: userId,
    tid: tenantId,
    roles,
  })

  // Hash the refresh token for storage
  const refreshTokenHash = hashToken(tokens.refreshToken)

  // Calculate expiry (7 days from now)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Generate session ID
  const sessionId = generateSecureToken(16)

  // Insert session into database
  const result = await tx.execute(sql`
    INSERT INTO sessions (
      id, user_id, tenant_id, refresh_token_hash,
      user_agent, ip_address, expires_at, last_used_at
    ) VALUES (
      ${sessionId}, ${userId}, ${tenantId}, ${refreshTokenHash},
      ${userAgent ?? null}, ${ipAddress ?? null}, ${expiresAt.toISOString()}, NOW()
    )
    RETURNING *
  `)

  const row = Array.isArray(result) ? result[0] : result.rows?.[0]

  const session: Session = {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    lastUsedAt: new Date(row.last_used_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  }

  return { session, tokens }
}

/**
 * Refresh a session using refresh token
 * Implements refresh token rotation for security
 */
export async function refreshSession(
  tx: PgTransaction<any, any, any>,
  jwtConfig: JWTConfig,
  refreshToken: string,
  ipAddress?: string
): Promise<SessionResult | { error: string }> {
  // Verify the refresh token
  const tokenResult = await verifyRefreshToken(jwtConfig, refreshToken)
  if (!tokenResult.valid) {
    return { error: tokenResult.error }
  }

  const { payload } = tokenResult
  const refreshTokenHash = hashToken(refreshToken)

  // Find the session with this refresh token
  const sessionResult = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE refresh_token_hash = ${refreshTokenHash}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `)

  const sessionRow = Array.isArray(sessionResult) ? sessionResult[0] : sessionResult.rows?.[0]

  if (!sessionRow) {
    // Token reuse detected - possible token theft
    // Revoke all sessions for this user as security measure
    await tx.execute(sql`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE user_id = ${payload.sub}
    `)

    return { error: 'Session not found or expired. All sessions have been revoked for security.' }
  }

  // Generate new token pair (rotation)
  const newTokens = await generateTokenPair(jwtConfig, {
    sub: payload.sub,
    tid: payload.tid,
    roles: payload.roles,
    imp: payload.imp, // Preserve impersonation if present
  })

  const newRefreshTokenHash = hashToken(newTokens.refreshToken)
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Update session with new refresh token
  await tx.execute(sql`
    UPDATE sessions
    SET refresh_token_hash = ${newRefreshTokenHash},
        expires_at = ${newExpiresAt.toISOString()},
        last_used_at = NOW(),
        ip_address = COALESCE(${ipAddress ?? null}, ip_address)
    WHERE id = ${sessionRow.id}
  `)

  const session: Session = {
    id: sessionRow.id,
    userId: sessionRow.user_id,
    tenantId: sessionRow.tenant_id,
    refreshTokenHash: newRefreshTokenHash,
    userAgent: sessionRow.user_agent,
    ipAddress: ipAddress ?? sessionRow.ip_address,
    createdAt: new Date(sessionRow.created_at),
    expiresAt: newExpiresAt,
    lastUsedAt: new Date(),
    revokedAt: null,
  }

  return { session, tokens: newTokens }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  tx: PgTransaction<any, any, any>,
  sessionId: string
): Promise<boolean> {
  const result = await tx.execute(sql`
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE id = ${sessionId} AND revoked_at IS NULL
  `)

  const count = Array.isArray(result) ? result.length : result.rowCount
  return count > 0
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(
  tx: PgTransaction<any, any, any>,
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  let result

  if (exceptSessionId) {
    result = await tx.execute(sql`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId}
        AND revoked_at IS NULL
        AND id != ${exceptSessionId}
    `)
  } else {
    result = await tx.execute(sql`
      UPDATE sessions
      SET revoked_at = NOW()
      WHERE user_id = ${userId} AND revoked_at IS NULL
    `)
  }

  return Array.isArray(result) ? result.length : (result.rowCount ?? 0)
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  tx: PgTransaction<any, any, any>,
  userId: string
): Promise<Session[]> {
  const result = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE user_id = ${userId}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    ORDER BY last_used_at DESC
  `)

  const rows = Array.isArray(result) ? result : (result.rows ?? [])

  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    lastUsedAt: new Date(row.last_used_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  }))
}

/**
 * Clean up expired sessions
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredSessions(
  tx: PgTransaction<any, any, any>
): Promise<number> {
  const result = await tx.execute(sql`
    DELETE FROM sessions
    WHERE expires_at < NOW() - INTERVAL '30 days'
       OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')
  `)

  return Array.isArray(result) ? result.length : (result.rowCount ?? 0)
}

/**
 * Validate a session exists and is active
 */
export async function validateSession(
  tx: PgTransaction<any, any, any>,
  sessionId: string
): Promise<Session | null> {
  const result = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE id = ${sessionId}
      AND revoked_at IS NULL
      AND expires_at > NOW()
  `)

  const row = Array.isArray(result) ? result[0] : result.rows?.[0]

  if (!row) {
    return null
  }

  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    refreshTokenHash: row.refresh_token_hash,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    lastUsedAt: new Date(row.last_used_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  }
}
