import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== 'false'

function resolveRedirect(request: NextRequest): string {
  if (request.method === 'GET') {
    return request.nextUrl.searchParams.get('redirect') ?? '/dashboard'
  }

  return '/dashboard'
}

function getSafePath(redirectPath: string): string {
  return redirectPath.startsWith('/') ? redirectPath : '/dashboard'
}

function createResponse(redirectPath: string) {
  const response = new NextResponse(null, {
    status: 302,
    headers: {
      location: getSafePath(redirectPath),
    },
  })
  response.cookies.set(
    'akademate_campus_session',
    JSON.stringify({
      user: {
        id: 'dev-student-1',
        email: 'alumno@akademate.com',
        role: 'student',
        tenantId: 1,
      },
      token: `dev-campus-${Date.now()}`,
    }),
    {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    }
  )
  return response
}

export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }
  const redirectPath = resolveRedirect(request)
  return createResponse(redirectPath)
}

export async function POST(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev login is disabled' }, { status: 403 })
  }

  let redirectPath = '/dashboard'
  try {
    const form = await request.formData()
    const redirectValue = form.get('redirect')
    if (typeof redirectValue === 'string' && redirectValue.length > 0) {
      redirectPath = redirectValue
    }
  } catch {
    redirectPath = '/dashboard'
  }

  return createResponse(redirectPath)
}
