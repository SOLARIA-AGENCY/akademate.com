import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const DEV_EMAIL = 'admin@akademate.com'
const DEV_PASSWORD = 'Admin1234!'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden outside development' }, { status: 403 })
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: DEV_EMAIL } },
    limit: 1,
    overrideAccess: true,
    depth: 0,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        name: 'Akademate Dev Admin',
        roles: [{ role: 'superadmin' }],
      },
      overrideAccess: true,
    })
  }

  const redirectPath = request.nextUrl.searchParams.get('redirect')
  if (redirectPath) {
    const safePath = redirectPath.startsWith('/') ? redirectPath : '/admin'
    return new NextResponse(null, {
      status: 302,
      headers: {
        location: safePath,
      },
    })
  }

  return NextResponse.json({
    success: true,
    created: existing.totalDocs === 0,
    credentials: {
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    },
  })
}
