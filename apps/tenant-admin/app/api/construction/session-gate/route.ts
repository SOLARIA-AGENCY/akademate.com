import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const session = await getAuthenticatedUserContext(request, payload)
    if (!session?.userId) {
      return NextResponse.json({ ok: false, code: 'AUTH_REQUIRED' }, { status: 401 })
    }
    return NextResponse.json({ ok: true, role: session.role ?? null })
  } catch {
    return NextResponse.json({ ok: false, code: 'SESSION_UNAVAILABLE' }, { status: 503 })
  }
}
