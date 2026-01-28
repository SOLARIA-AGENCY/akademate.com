/**
 * AKADEMATE.COM - Session Management Module
 *
 * Blueprint Reference: Section 6.1 - Autenticacion
 *
 * Manages user sessions with:
 * - Session creation and validation
 * - Refresh token rotation
 * - Device tracking
 * - Session invalidation
 */

import { sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import { generateSecureToken, hashToken } from './password'
import { generateTokenPair, verifyRefreshToken, type JWTConfig, type TokenPair } from './jwt'
import type { Role } from './rbac'

/**
 * Database transaction type alias for cleaner function signatures
 */
type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>

/**
 * Raw session row from database query
 */
interface SessionRow {
  id: string
  user_id: string
  tenant_id: number
  refresh_token_hash: string
  user_agent: string | null
  ip_address: string | null
  created_at: string | Date
  expires_at: string | Date
  last_used_at: string | Date
  revoked_at: string | Date | null
}

/**
 * Query result structure from drizzle execute
 */
interface QueryResult {
  rows?: unknown[]
  rowCount?: number | null
}

/**
 * Type guard to check if a value is a SessionRow
 */
function isSessionRow(value: unknown): value is SessionRow {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.tenant_id === 'number' &&
    typeof row.refresh_token_hash === 'string'
  )
}

/**
 * Type guard to check if result has rows property
 */
function hasRows(result: unknown): result is QueryResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'rows' in result &&
    Array.isArray((result as QueryResult).rows)
  )
}

/**
 * Extract rows from query result safely
 */
function extractRows(result: unknown[] | QueryResult): unknown[] {
  if (Array.isArray(result)) {
    return result
  }
  if (hasRows(result) && result.rows) {
    return result.rows
  }
  return []
}

/**
 * Extract first row from query result safely
 */
function extractFirstRow(result: unknown[] | QueryResult): unknown {
  const rows = extractRows(result)
  return rows[0]
}

/**
 * Extract row count from query result safely
 */
function extractRowCount(result: unknown[] | QueryResult): number {
  if (Array.isArray(result)) {
    return result.length
  }
  if (hasRowCount(result)) {
    return result.rowCount
  }
  return 0
}

/**
 * Type guard to check if result has rowCount property
 */
function hasRowCount(result: unknown): result is { rowCount: number } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'rowCount' in result &&
    typeof (result as { rowCount: unknown }).rowCount === 'number'
  )
}

/**
 * Convert a validated SessionRow to Session object
 */
function rowToSession(row: SessionRow): Session {
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
  tx: DbTransaction,
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
  const result: unknown = await tx.execute(sql`
    INSERT INTO sessions (
      id, user_id, tenant_id, refresh_token_hash,
      user_agent, ip_address, expires_at, last_used_at
    ) VALUES (
      ${sessionId}, ${userId}, ${tenantId}, ${refreshTokenHash},
      ${userAgent ?? null}, ${ipAddress ?? null}, ${expiresAt.toISOString()}, NOW()
    )
    RETURNING *
  `)

  const row = extractFirstRow(result as unknown[] | QueryResult)

  if (!isSessionRow(row)) {
    throw new Error('Failed to create session: invalid row returned')
  }

  const session = rowToSession(row)

  return { session, tokens }
}

/**
 * Refresh a session using refresh token
 * Implements refresh token rotation for security
 */
export async function refreshSession(
  tx: DbTransaction,
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
  const sessionResult: unknown = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE refresh_token_hash = ${refreshTokenHash}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
  `)

  const sessionRow = extractFirstRow(sessionResult as unknown[] | QueryResult)

  if (!isSessionRow(sessionRow)) {
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
  tx: DbTransaction,
  sessionId: string
): Promise<boolean> {
  const result: unknown = await tx.execute(sql`
    UPDATE sessions
    SET revoked_at = NOW()
    WHERE id = ${sessionId} AND revoked_at IS NULL
  `)

  const count = extractRowCount(result as unknown[] | QueryResult)
  return count > 0
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(
  tx: DbTransaction,
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  let result: unknown

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

  return extractRowCount(result as unknown[] | QueryResult)
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(
  tx: DbTransaction,
  userId: string
): Promise<Session[]> {
  const result: unknown = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE user_id = ${userId}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    ORDER BY last_used_at DESC
  `)

  const rows = extractRows(result as unknown[] | QueryResult)

  return rows
    .filter(isSessionRow)
    .map(rowToSession)
}

/**
 * Clean up expired sessions
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredSessions(
  tx: DbTransaction
): Promise<number> {
  const result: unknown = await tx.execute(sql`
    DELETE FROM sessions
    WHERE expires_at < NOW() - INTERVAL '30 days'
       OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '7 days')
  `)

  return extractRowCount(result as unknown[] | QueryResult)
}

/**
 * Validate a session exists and is active
 */
export async function validateSession(
  tx: DbTransaction,
  sessionId: string
): Promise<Session | null> {
  const result: unknown = await tx.execute(sql`
    SELECT * FROM sessions
    WHERE id = ${sessionId}
      AND revoked_at IS NULL
      AND expires_at > NOW()
  `)

  const row = extractFirstRow(result as unknown[] | QueryResult)

  if (!isSessionRow(row)) {
    return null
  }

  return rowToSession(row)
}
