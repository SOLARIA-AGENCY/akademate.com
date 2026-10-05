import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import {
  SESSION_V2_COOKIE,
  SESSION_V2_MAX_AGE_SECONDS,
  signSessionV2,
  verifyPayloadToken,
  type VerifiedPrincipal,
} from '@/lib/server/session'
import { identityFromPayloadUser, type PrincipalUser } from '@/lib/server/payload-principal'
import {
  AUTH_COOKIE_NAMES,
  clearCookieVariants,
  resolveAuthCookieOptions,
} from '@/lib/server/auth-cookies'

export const dynamic = 'force-dynamic'

function getSafePath(redirectPath: string): string {
  return redirectPath.startsWith('/') && !redirectPath.startsWith('//')
    ? redirectPath
    : '/dashboard'
}

async function resolveRedirectPath(request: NextRequest): Promise<string> {
  if (request.method === 'GET') {
    return request.nextUrl.searchParams.get('redirect') ?? '/dashboard'
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { redirect?: string }
      return body.redirect ?? '/dashboard'
    }
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const redirect = formData.get('redirect')
      return typeof redirect === 'string' && redirect.length > 0 ? redirect : '/dashboard'
    }
  } catch {
    return '/dashboard'
  }

  return '/dashboard'
}

async function handleDevLogin(request: NextRequest) {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.ALLOW_DEV_AUTO_LOGIN !== 'true'
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const redirectPath = await resolveRedirectPath(request)
  const email = process.env.PAYLOAD_SUPERADMIN_EMAIL?.trim()
  const password = process.env.PAYLOAD_SUPERADMIN_PASSWORD
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Development credentials are not configured' },
      { status: 500 },
    )
  }
  const payload: Payload = await getPayload({ config })
  const result = await payload.login({
    collection: 'users',
    data: { email, password },
  })
  const loginResult =
    result.user && result.token
      ? { user: result.user as unknown as Record<string, unknown>, token: result.token }
      : undefined

  if (!loginResult) {
    return NextResponse.json(
      {
        error: 'Unable to create development session',
        details: 'No valid dev credentials found for Payload users login.',
      },
      { status: 500 },
    )
  }

  const response = new NextResponse(null, {
    status: 302,
    headers: {
      location: getSafePath(redirectPath),
    },
  })
  const identity = identityFromPayloadUser(loginResult.user as PrincipalUser)
  const sourcePrincipal = await verifyPayloadToken(loginResult.token, {
    resolveIdentity: async () => identity,
    requireResolvedIdentity: true,
    allowMissingIdentityClaims: true,
  })
  const now = Math.floor(Date.now() / 1000)
  const principal: VerifiedPrincipal = {
    userId: sourcePrincipal.userId,
    tenantId: sourcePrincipal.tenantId,
    roles: sourcePrincipal.roles,
    sessionVersion: sourcePrincipal.sessionVersion,
    sessionId: crypto.randomUUID(),
    issuedAt: now,
    expiresAt: now + SESSION_V2_MAX_AGE_SECONDS,
  }
  const options = resolveAuthCookieOptions(request, SESSION_V2_MAX_AGE_SECONDS)
  clearCookieVariants(response.cookies, AUTH_COOKIE_NAMES, request)
  response.cookies.set('payload-token', loginResult.token, options)
  response.cookies.set(SESSION_V2_COOKIE, await signSessionV2(principal, { now }), options)

  return response
}

export async function GET(request: NextRequest) {
  return handleDevLogin(request)
}

export async function POST(request: NextRequest) {
  return handleDevLogin(request)
}
