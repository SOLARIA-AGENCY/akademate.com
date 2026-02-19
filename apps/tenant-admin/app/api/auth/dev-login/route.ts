import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

const DEV_USER = {
  id: 'dev-admin-cep',
  email: 'admin@cep.es',
  name: 'Admin CEP DEV',
  role: 'admin',
  tenantId: '1',
}

function getSafePath(redirectPath: string): string {
  return redirectPath.startsWith('/') ? redirectPath : '/dashboard'
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
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev auth bypass disabled' }, { status: 403 })
  }

  const redirectPath = await resolveRedirectPath(request)
  const syntheticToken = `dev-bypass.${Date.now().toString(36)}`

  const response = new NextResponse(null, {
    status: 302,
    headers: {
      location: getSafePath(redirectPath),
    },
  })
  response.cookies.set('payload-token', syntheticToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  response.cookies.set('cep_session', JSON.stringify({
    user: {
      id: DEV_USER.id,
      email: DEV_USER.email,
      name: DEV_USER.name,
      role: DEV_USER.role,
      tenantId: DEV_USER.tenantId,
    },
    token: syntheticToken,
  }), {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  return response
}

export async function GET(request: NextRequest) {
  return handleDevLogin(request)
}

export async function POST(request: NextRequest) {
  return handleDevLogin(request)
}
