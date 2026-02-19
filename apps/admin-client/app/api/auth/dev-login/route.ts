import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'false'

function getSafePath(redirectPath: string): string {
  return redirectPath.startsWith('/') ? redirectPath : '/dashboard'
}

function createSessionResponse(redirectPath: string) {
  const sessionData = {
    id: 'dev-ops-superadmin',
    email: 'ops@akademate.com',
    role: 'superadmin',
    name: 'Ops Superadmin',
    tenantId: 'global-ops',
    token: `dev-ops-${Date.now()}`,
  }

  const response = new NextResponse(null, {
    status: 302,
    headers: {
      location: getSafePath(redirectPath),
    },
  })

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

  return createSessionResponse(redirectPath)
}

export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  const redirectPath = request.nextUrl.searchParams.get('redirect') ?? '/dashboard'
  return createSessionResponse(redirectPath)
}
