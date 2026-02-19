import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const isDevLoginEnabled =
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

const DEV_USER = {
  email: 'admin@cep.es',
  password: 'Admin1234!',
  name: 'Admin CEP DEV',
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

async function ensureDevUserAndLogin() {
  const payload = await getPayload({ config })

  try {
    return await payload.login({
      collection: 'users',
      data: {
        email: DEV_USER.email,
        password: DEV_USER.password,
      },
    })
  } catch {
    const existingUser = await payload.find({
      collection: 'users',
      where: { email: { equals: DEV_USER.email } },
      limit: 1,
      overrideAccess: true,
      depth: 0,
    })

    if (existingUser.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: DEV_USER.email,
          password: DEV_USER.password,
          name: DEV_USER.name,
          role: 'admin',
          tenant: 1,
        },
        overrideAccess: true,
      })
    }

    return payload.login({
      collection: 'users',
      data: {
        email: DEV_USER.email,
        password: DEV_USER.password,
      },
    })
  }
}

async function handleDevLogin(request: NextRequest) {
  if (!isDevLoginEnabled) {
    return NextResponse.json({ error: 'Dev auth bypass disabled' }, { status: 403 })
  }

  const redirectPath = await resolveRedirectPath(request)
  const loginResult = await ensureDevUserAndLogin()
  const user = loginResult.user as {
    id: string | number
    email: string
    name?: string
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

  response.cookies.set('cep_session', JSON.stringify({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? DEV_USER.name,
      role: 'admin',
    },
    token: loginResult.token,
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
