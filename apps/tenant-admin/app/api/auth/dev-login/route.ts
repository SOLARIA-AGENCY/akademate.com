import { NextRequest, NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

const DEV_CREDENTIAL_CANDIDATES = [
  {
    email: process.env.PAYLOAD_SUPERADMIN_EMAIL ?? 'superadmin@cepcomunicacion.com',
    password: process.env.PAYLOAD_SUPERADMIN_PASSWORD ?? 'Dev12345!',
  },
  {
    email: 'admin@cep.es',
    password: 'Admin1234!',
  },
]

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
  const payload: Payload = await getPayload({ config })

  let loginResult:
    | {
        user: Record<string, unknown>
        token: string
      }
    | undefined

  for (const candidate of DEV_CREDENTIAL_CANDIDATES) {
    try {
      const result = await payload.login({
        collection: 'users',
        data: {
          email: candidate.email,
          password: candidate.password,
        },
      })

      if (result.user && result.token) {
        loginResult = { user: result.user as unknown as Record<string, unknown>, token: result.token }
        break
      }
    } catch {
      // Try next candidate
    }
  }

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
  response.cookies.set('payload-token', loginResult.token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  response.cookies.set(
    'cep_session',
    JSON.stringify({
      user: {
        id: String(loginResult.user.id ?? ''),
        email: String(loginResult.user.email ?? ''),
        name: String(loginResult.user.name ?? ''),
        role: String(loginResult.user.role ?? ''),
        tenantId: String(loginResult.user.tenant_id ?? loginResult.user.tenantId ?? '1'),
      },
      token: loginResult.token,
    }),
    {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    },
  )

  return response
}

export async function GET(request: NextRequest) {
  return handleDevLogin(request)
}

export async function POST(request: NextRequest) {
  return handleDevLogin(request)
}
