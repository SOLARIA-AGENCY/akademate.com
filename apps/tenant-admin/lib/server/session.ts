import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export const SESSION_V2_COOKIE = 'akademate_session_v2'
export const LEGACY_SESSION_COOKIES = ['akademate_session', 'cep_session'] as const
export const SESSION_V2_MAX_AGE_SECONDS = 12 * 60 * 60
export const SESSION_TOKEN_VERSION = 2

const SESSION_ISSUER = 'akademate-tenant-admin'
const SESSION_AUDIENCE = 'akademate-session-v2'
const encoder = new TextEncoder()

export type VerifiedPrincipal = {
  userId: string
  tenantId: string
  roles: string[]
  sessionVersion: number
  sessionId: string
  issuedAt: number
  expiresAt: number
  impersonation?: {
    actorUserId: string
    reason: string
  }
}

export type ResolvedPrincipalIdentity = {
  tenantId: string
  roles: string[]
  sessionVersion: number
  isActive: boolean
}

type VerificationOptions = {
  now?: number
}

type PrincipalVerificationOptions = VerificationOptions & {
  resolveIdentity?: (userId: string, payload: JWTPayload) => Promise<ResolvedPrincipalIdentity | null>
  requireResolvedIdentity?: boolean
  allowMissingIdentityClaims?: boolean
}

export type VerifiedSession = {
  principal: VerifiedPrincipal
  source: 'payload-token' | 'session-v2'
  token: string
}

function requireSecret(name: string): string {
  const secret = process.env[name]?.trim()
  if (!secret) throw new Error(`${name} is required`)
  return secret
}

function currentDate(now?: number): Date | undefined {
  return now === undefined ? undefined : new Date(now * 1000)
}

function toRequiredString(value: unknown, field: string): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    throw new Error(`Invalid ${field}`)
  }
  return String(value)
}

function toPositiveInteger(value: unknown, field: string): number {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid ${field}`)
  }
  return number
}

function toTimestamp(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}`)
  }
  return value
}

function normalizeRoles(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  const roles = values
    .filter((role): role is string => typeof role === 'string')
    .map((role) => role.trim())
    .filter(Boolean)
  if (roles.length === 0) throw new Error('Invalid roles')
  return [...new Set(roles)].sort()
}

function sameRoles(left: string[], right: string[]): boolean {
  return normalizeRoles(left).join('\0') === normalizeRoles(right).join('\0')
}

function resolveTenantClaim(payload: JWTPayload): unknown {
  const tenant = payload.tenant
  if (tenant && typeof tenant === 'object' && 'id' in tenant) {
    return (tenant as { id?: unknown }).id
  }
  return payload.tenantId ?? payload.tenant_id ?? tenant
}

function resolveImpersonation(payload: JWTPayload): VerifiedPrincipal['impersonation'] {
  const nested = payload.impersonation
  if (nested && typeof nested === 'object') {
    const actorUserId = (nested as { actorUserId?: unknown }).actorUserId
    const reason = (nested as { reason?: unknown }).reason
    if (actorUserId !== undefined || reason !== undefined) {
      return {
        actorUserId: toRequiredString(actorUserId, 'impersonation.actorUserId'),
        reason: toRequiredString(reason, 'impersonation.reason'),
      }
    }
  }
  if (payload.imp !== undefined) {
    return {
      actorUserId: toRequiredString(payload.imp, 'impersonation.actorUserId'),
      reason: toRequiredString(payload.impersonation_reason, 'impersonation.reason'),
    }
  }
  return undefined
}

function principalFromPayload(
  payload: JWTPayload,
  identity: Omit<ResolvedPrincipalIdentity, 'isActive'>,
  sessionId: string,
): VerifiedPrincipal {
  const impersonation = resolveImpersonation(payload)
  return {
    userId: toRequiredString(payload.sub ?? payload.id, 'userId'),
    tenantId: toRequiredString(identity.tenantId, 'tenantId'),
    roles: normalizeRoles(identity.roles),
    sessionVersion: toPositiveInteger(identity.sessionVersion, 'sessionVersion'),
    sessionId: toRequiredString(sessionId, 'sessionId'),
    issuedAt: toTimestamp(payload.iat, 'issuedAt'),
    expiresAt: toTimestamp(payload.exp, 'expiresAt'),
    ...(impersonation ? { impersonation } : {}),
  }
}

function identityFromClaims(payload: JWTPayload): Omit<ResolvedPrincipalIdentity, 'isActive'> {
  return {
    tenantId: toRequiredString(resolveTenantClaim(payload), 'tenantId'),
    roles: normalizeRoles(payload.roles ?? payload.role),
    sessionVersion: toPositiveInteger(payload.session_version, 'sessionVersion'),
  }
}

function validateLifetime(principal: VerifiedPrincipal): void {
  if (principal.expiresAt <= principal.issuedAt) {
    throw new Error('Session expiration must be after issuance')
  }
  if (principal.expiresAt - principal.issuedAt > SESSION_V2_MAX_AGE_SECONDS) {
    throw new Error('Session lifetime cannot exceed 12 hours')
  }
}

function assertCurrentIdentity(
  principal: VerifiedPrincipal,
  resolved: ResolvedPrincipalIdentity | null,
): VerifiedPrincipal {
  if (!resolved || !resolved.isActive) throw new Error('Session user is missing or inactive')
  if (
    principal.tenantId !== resolved.tenantId ||
    principal.sessionVersion !== resolved.sessionVersion ||
    !sameRoles(principal.roles, resolved.roles)
  ) {
    throw new Error('Session principal no longer matches persisted identity')
  }
  return principal
}

async function tokenFingerprint(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return `payload-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32)}`
}

export async function signSessionV2(
  principal: VerifiedPrincipal,
  options: VerificationOptions = {},
): Promise<string> {
  const now = options.now ?? Math.floor(Date.now() / 1000)
  const normalized: VerifiedPrincipal = {
    userId: toRequiredString(principal.userId, 'userId'),
    tenantId: toRequiredString(principal.tenantId, 'tenantId'),
    roles: normalizeRoles(principal.roles),
    sessionVersion: toPositiveInteger(principal.sessionVersion, 'sessionVersion'),
    sessionId: toRequiredString(principal.sessionId, 'sessionId'),
    issuedAt: toTimestamp(principal.issuedAt, 'issuedAt'),
    expiresAt: toTimestamp(principal.expiresAt, 'expiresAt'),
    ...(principal.impersonation
      ? {
          impersonation: {
            actorUserId: toRequiredString(principal.impersonation.actorUserId, 'actorUserId'),
            reason: toRequiredString(principal.impersonation.reason, 'reason'),
          },
        }
      : {}),
  }
  validateLifetime(normalized)
  if (normalized.issuedAt > now + 30) throw new Error('Session issuance is in the future')

  return new SignJWT({
    tenant_id: normalized.tenantId,
    roles: normalized.roles,
    token_version: SESSION_TOKEN_VERSION,
    session_version: normalized.sessionVersion,
    ...(normalized.impersonation ? { impersonation: normalized.impersonation } : {}),
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'akademate_session_v2' })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setSubject(normalized.userId)
    .setJti(normalized.sessionId)
    .setIssuedAt(normalized.issuedAt)
    .setExpirationTime(normalized.expiresAt)
    .sign(encoder.encode(requireSecret('SESSION_SIGNING_SECRET_CURRENT')))
}

export async function verifySessionV2(
  token: string,
  options: VerificationOptions = {},
): Promise<VerifiedPrincipal> {
  const secrets = [
    requireSecret('SESSION_SIGNING_SECRET_CURRENT'),
    process.env.SESSION_SIGNING_SECRET_PREVIOUS?.trim(),
  ].filter((secret): secret is string => Boolean(secret))
  let lastError: unknown
  for (const secret of secrets) {
    try {
      const { payload, protectedHeader } = await jwtVerify(token, encoder.encode(secret), {
        algorithms: ['HS256'],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
        currentDate: currentDate(options.now),
        requiredClaims: ['sub', 'jti', 'iat', 'exp'],
      })
      if (protectedHeader.typ !== 'akademate_session_v2') throw new Error('Invalid token type')
      if (payload.token_version !== SESSION_TOKEN_VERSION) throw new Error('Unsupported token version')
      const principal = principalFromPayload(
        payload,
        identityFromClaims(payload),
        toRequiredString(payload.jti, 'sessionId'),
      )
      validateLifetime(principal)
      return principal
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Invalid session token')
}

export async function verifyPayloadToken(
  token: string,
  options: PrincipalVerificationOptions = {},
): Promise<VerifiedPrincipal> {
  const { payload, protectedHeader } = await jwtVerify(
    token,
    encoder.encode(requireSecret('PAYLOAD_SECRET')),
    {
      algorithms: ['HS256'],
      currentDate: currentDate(options.now),
      requiredClaims: ['iat', 'exp'],
    },
  )
  if (protectedHeader.typ !== 'JWT') throw new Error('Invalid Payload token type')
  if (payload.collection !== 'users') throw new Error('Payload token is not for users')

  const userId = toRequiredString(payload.sub ?? payload.id, 'userId')
  let signedIdentity: Omit<ResolvedPrincipalIdentity, 'isActive'> | null = null
  try {
    signedIdentity = identityFromClaims(payload)
  } catch {
    if (!options.allowMissingIdentityClaims) throw new Error('Payload identity claims are missing')
  }

  const resolved = options.resolveIdentity
    ? await options.resolveIdentity(userId, payload)
    : null
  if (options.requireResolvedIdentity) {
    if (!resolved || !resolved.isActive) throw new Error('Session user is missing or inactive')
    if (
      signedIdentity &&
      (signedIdentity.tenantId !== resolved.tenantId ||
        signedIdentity.sessionVersion !== resolved.sessionVersion ||
        !sameRoles(signedIdentity.roles, resolved.roles))
    ) {
      throw new Error('Payload token claims no longer match persisted identity')
    }
  }

  const identity = resolved ?? signedIdentity
  if (!identity || ('isActive' in identity && !identity.isActive)) {
    throw new Error('Payload identity could not be resolved')
  }
  const sessionId =
    typeof payload.jti === 'string' && payload.jti.trim()
      ? payload.jti
      : typeof payload.sid === 'string' && payload.sid.trim()
        ? payload.sid
        : await tokenFingerprint(token)
  return principalFromPayload(payload, identity, sessionId)
}

export async function verifyAvailableSession(
  cookies: { payloadToken?: string | null; sessionV2?: string | null },
  options: PrincipalVerificationOptions = {},
): Promise<VerifiedSession | null> {
  if (cookies.payloadToken) {
    try {
      return {
        principal: await verifyPayloadToken(cookies.payloadToken, options),
        source: 'payload-token',
        token: cookies.payloadToken,
      }
    } catch {
      // A separately valid v2 cookie can remain usable after a Payload token expires.
    }
  }
  if (cookies.sessionV2) {
    try {
      const principal = await verifySessionV2(cookies.sessionV2, options)
      if (options.requireResolvedIdentity) {
        if (!options.resolveIdentity) throw new Error('Persisted identity resolver is required')
        assertCurrentIdentity(
          principal,
          await options.resolveIdentity(principal.userId, {}),
        )
      }
      return { principal, source: 'session-v2', token: cookies.sessionV2 }
    } catch {
      return null
    }
  }
  return null
}

export function extractLegacyPayloadToken(rawSession: string): string | null {
  const candidates = [rawSession]
  try {
    const decoded = decodeURIComponent(rawSession)
    if (decoded !== rawSession) candidates.push(decoded)
  } catch {
    return null
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>
      const token = [parsed.token, parsed.socketToken, parsed.payloadToken, parsed.jwt].find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      )
      if (typeof token === 'string') return token.trim()
    } catch {
      // Malformed legacy data is never authentication.
    }
  }
  return null
}
