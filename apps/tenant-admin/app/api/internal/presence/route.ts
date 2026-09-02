import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const auth = await getAuthenticatedUserContext(request, payload)
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    await payload.update({
      collection: 'users',
      id: auth.userId,
      data: { last_seen_at: new Date().toISOString() },
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
