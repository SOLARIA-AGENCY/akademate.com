import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PAYLOAD_URL =
  process.env.PAYLOAD_CMS_URL?.trim() ||
  process.env.NEXT_PUBLIC_PAYLOAD_URL?.trim() ||
  'http://localhost:3003'

interface SessionCookie {
  token?: string
}

async function getPayloadToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('akademate_admin_session')?.value
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as SessionCookie
    return session.token ?? null
  } catch {
    return null
  }
}

async function payloadCount(token: string, collection: string): Promise<number> {
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/${collection}?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return 0
    const data = await res.json()
    return typeof data?.totalDocs === 'number' ? data.totalDocs : 0
  } catch {
    return 0
  }
}

export async function GET() {
  const token = await getPayloadToken()

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const [tenantsTotal, usersTotal, coursesTotal, enrollmentsTotal] = await Promise.all([
    payloadCount(token, 'tenants'),
    payloadCount(token, 'users'),
    payloadCount(token, 'courses'),
    payloadCount(token, 'enrollments'),
  ])

  // Active tenants count
  let activeTenantsTotal = 0
  try {
    const res = await fetch(`${PAYLOAD_URL}/api/tenants?limit=1&where[active][equals]=true`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      activeTenantsTotal = typeof data?.totalDocs === 'number' ? data.totalDocs : 0
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    tenants: {
      total: tenantsTotal,
      active: activeTenantsTotal,
      trial: tenantsTotal - activeTenantsTotal,
    },
    users: { total: usersTotal },
    courses: { total: coursesTotal },
    enrollments: { total: enrollmentsTotal },
  })
}
