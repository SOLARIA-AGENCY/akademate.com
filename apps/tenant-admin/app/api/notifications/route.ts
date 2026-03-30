import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications — List recent notifications
 * PATCH /api/notifications — Mark notifications as read
 */

export async function GET() {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const db = (payload as any).db

    const result = await db.execute({
      raw: `SELECT id, type, title, body, link, read, created_at
            FROM notifications
            WHERE tenant_id = 1
            ORDER BY created_at DESC
            LIMIT 50`,
    })

    const unreadResult = await db.execute({
      raw: `SELECT count(*) as count FROM notifications WHERE read = false AND tenant_id = 1`,
    })

    return NextResponse.json({
      notifications: result?.rows || [],
      unreadCount: parseInt(unreadResult?.rows?.[0]?.count || '0', 10),
    })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, markAllRead } = body

    const payload = await getPayloadHMR({ config: configPromise })
    const db = (payload as any).db

    if (markAllRead) {
      await db.execute({ raw: `UPDATE notifications SET read = true WHERE tenant_id = 1 AND read = false` })
    } else if (Array.isArray(ids) && ids.length > 0) {
      const idList = ids.map((id: number) => parseInt(String(id), 10)).join(',')
      await db.execute({ raw: `UPDATE notifications SET read = true WHERE id IN (${idList})` })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
