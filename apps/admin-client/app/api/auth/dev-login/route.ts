import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'false'

function buildRedirectUrl(request: NextRequest, redirectPath: string): URL {
  const safePath = redirectPath.startsWith('/') ? redirectPath : '/dashboard'
  return new URL(safePath, request.url)
}

function createSessionResponse(request: NextRequest, redirectPath: string) {
  const sessionData = {
    id: 'dev-ops-superadmin',
    email: 'ops@akademate.com',
    role: 'superadmin',
    name: 'Ops Superadmin',
    tenantId: 'global-ops',
    token: `dev-ops-${Date.now()}`,
  }

  const response = NextResponse.redirect(buildRedirectUrl(request, redirectPath), 302)

  response.cookies.set('akademate_admin_session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}

export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  let redirectPath = '/dashboard'
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { redirect?: string }
      if (body.redirect) redirectPath = body.redirect
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const redirectValue = form.get('redirect')
      if (typeof redirectValue === 'string' && redirectValue.length > 0) {
        redirectPath = redirectValue
      }
    }
  } catch {
    redirectPath = '/dashboard'
  }

  return createSessionResponse(request, redirectPath)
}

export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  const redirectPath = request.nextUrl.searchParams.get('redirect') ?? '/dashboard'
  return createSessionResponse(request, redirectPath)
}
