import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  SESSION_V2_COOKIE,
  verifyAvailableSession,
  signSessionV2,
  type VerifiedPrincipal,
} from '@/lib/server/session'
import {
  createPayloadIdentityResolver,
  identityFromPayloadUser,
  type PrincipalUser,
} from '@/lib/server/payload-principal'
import {
  AUTH_COOKIE_NAMES,
  clearCookieVariants,
  resolveAuthCookieOptions,
} from '@/lib/server/auth-cookies'
import { resolveClientIp } from '@/lib/server/request-metadata'
import { enforceSensitiveRateLimit, sensitiveRateLimitResponse } from '@/lib/server/rate-limit'

export const dynamic = 'force-dynamic'

const IMPERSONATION_TTL_SECONDS = 15 * 60
const ALLOWED_ACTOR_ROLES = new Set(['superadmin', 'admin'])

export async function POST(request: Request) {
  if (process.env.IMPERSONATION_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found', code: 'IMPERSONATION_DISABLED' }, { status: 404 })
  }

  try {
    const cookieStore = await cookies()
    const payloadToken = cookieStore.get('payload-token')?.value
    const sessionV2 = cookieStore.get(SESSION_V2_COOKIE)?.value
    if (!payloadToken && !sessionV2) {
      return NextResponse.json({ error: 'No autenticado', code: 'AUTH_REQUIRED' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const actorUsers = new Map<string, PrincipalUser>()
    const verified = await verifyAvailableSession(
      { payloadToken, sessionV2 },
      {
        resolveIdentity: createPayloadIdentityResolver(payload, actorUsers),
        requireResolvedIdentity: true,
      },
    )
    if (!verified) {
      return NextResponse.json(
        { error: 'La sesión ya no es válida', code: 'SESSION_INVALIDATED' },
        { status: 401 },
      )
    }

    const actor = verified.principal
    const rateLimit = await enforceSensitiveRateLimit(request, {
      action: 'impersonation', tenantId: actor.tenantId, principalId: actor.userId,
    })
    if (!rateLimit.allowed) return sensitiveRateLimitResponse(rateLimit)
    if (actor.impersonation) {
      return NextResponse.json(
        { error: 'No se permite encadenar impersonaciones', code: 'IMPERSONATION_CHAIN_FORBIDDEN' },
        { status: 403 },
      )
    }
    if (!actor.roles.some((role) => ALLOWED_ACTOR_ROLES.has(role))) {
      return NextResponse.json(
        { error: 'Acceso denegado', code: 'IMPERSONATION_ROLE_FORBIDDEN' },
        { status: 403 },
      )
    }
    const actorRole = actor.roles.find(
      (role): role is 'superadmin' | 'admin' => role === 'superadmin' || role === 'admin',
    )
    const actorUserId = Number(actor.userId)
    const actorEmail = actorUsers.get(actor.userId)?.email?.trim()
    if (!actorRole || !actorEmail || !Number.isSafeInteger(actorUserId) || actorUserId <= 0) {
      return NextResponse.json(
        { error: 'Principal administrativo inválido', code: 'INVALID_ADMIN_PRINCIPAL' },
        { status: 403 },
      )
    }

    const body = (await request.json()) as { userId?: unknown; reason?: unknown; motivo?: unknown }
    const userId =
      typeof body.userId === 'string' || typeof body.userId === 'number'
        ? String(body.userId).trim()
        : ''
    const rawReason = body.reason ?? body.motivo
    const reason = typeof rawReason === 'string' ? rawReason.trim() : ''
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    if (reason.length < 8 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Motivo requerido (8-500 caracteres)', code: 'IMPERSONATION_REASON_REQUIRED' },
        { status: 400 },
      )
    }
    if (userId === actor.userId) {
      return NextResponse.json(
        { error: 'No puede impersonarse a sí mismo', code: 'IMPERSONATION_SELF_FORBIDDEN' },
        { status: 403 },
      )
    }

    const target = (await payload.findByID({
      collection: 'users', id: userId, depth: 0, overrideAccess: true,
    })) as PrincipalUser | null
    const targetIdentity = identityFromPayloadUser(target)
    if (!target || !targetIdentity || !targetIdentity.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 404 })
    }

    const targetRole = targetIdentity.roles[0]
    const actorIsSuperadmin = actor.roles.includes('superadmin')
    if (!actorIsSuperadmin && actor.tenantId !== targetIdentity.tenantId) {
      return NextResponse.json(
        { error: 'Acceso denegado para otro tenant', code: 'CROSS_TENANT_FORBIDDEN' },
        { status: 403 },
      )
    }
    if (!actorIsSuperadmin && ['admin', 'superadmin'].includes(targetRole)) {
      return NextResponse.json(
        { error: 'Un admin de tenant no puede impersonar administradores' },
        { status: 403 },
      )
    }

    const secret = process.env.PAYLOAD_SECRET?.trim()
    if (!secret) {
      return NextResponse.json({ error: 'Configuración de servidor incorrecta' }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = now + IMPERSONATION_TTL_SECONDS
    const sessionId = crypto.randomUUID()
    const impersonation = { actorUserId: actor.userId, reason }
    const token = await new SignJWT({
      id: String(target.id),
      email: target.email ?? undefined,
      collection: 'users',
      tenant: targetIdentity.tenantId,
      role: targetRole,
      roles: targetIdentity.roles,
      session_version: targetIdentity.sessionVersion,
      imp: actor.userId,
      impersonation_reason: reason,
      impersonation,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setJti(sessionId)
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(new TextEncoder().encode(secret))

    const targetPrincipal: VerifiedPrincipal = {
      userId: String(target.id),
      tenantId: targetIdentity.tenantId,
      roles: targetIdentity.roles,
      sessionVersion: targetIdentity.sessionVersion,
      sessionId,
      issuedAt: now,
      expiresAt,
      impersonation,
    }
    const v2Token = await signSessionV2(targetPrincipal, { now })
    const ip = resolveClientIp(request)

    await payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      data: {
        action: 'permission_change',
        collection_name: 'users',
        document_id: String(target.id),
        user_id: actorUserId,
        user_email: actorEmail,
        user_role: actorRole,
        ip_address: ip.address,
        user_agent: request.headers.get('user-agent') ?? undefined,
        status: 'success',
        metadata: {
          event: 'impersonation_start',
          actorUserId: actor.userId,
          targetUserId: String(target.id),
          targetEmail: target.email ?? null,
          tenantId: targetIdentity.tenantId,
          reason,
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          actorSessionId: actor.sessionId,
          ipSource: ip.source,
        },
      },
    })

    clearCookieVariants(cookieStore, AUTH_COOKIE_NAMES, request)
    const options = resolveAuthCookieOptions(request, IMPERSONATION_TTL_SECONDS)
    cookieStore.set('payload-token', token, options)
    cookieStore.set(SESSION_V2_COOKIE, v2Token, options)

    return NextResponse.json({ success: true, redirect: '/admin' }, { headers: rateLimit.headers })
  } catch (error) {
    console.error('[/api/auth/impersonate] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
