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
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    let notifications: any[] = []
    let unreadCount = 0

    if (drizzle?.execute) {
      const result = await drizzle.execute(`SELECT id, type, title, body, link, read, created_at FROM notifications WHERE tenant_id = 1 ORDER BY created_at DESC LIMIT 50`)
      notifications = result?.rows || result || []
      const unreadResult = await drizzle.execute(`SELECT count(*) as count FROM notifications WHERE read = false AND tenant_id = 1`)
      unreadCount = parseInt((unreadResult?.rows || unreadResult)?.[0]?.count || '0', 10)
    } else if (drizzle?.query) {
      const result = await drizzle.query(`SELECT id, type, title, body, link, read, created_at FROM notifications WHERE tenant_id = 1 ORDER BY created_at DESC LIMIT 50`)
      notifications = result?.rows || []
      const unreadResult = await drizzle.query(`SELECT count(*) as count FROM notifications WHERE read = false AND tenant_id = 1`)
      unreadCount = parseInt(unreadResult?.rows?.[0]?.count || '0', 10)
    }

    // Normalize snake_case to camelCase + ensure UTC timezone
    const normalized = notifications.map((n: any) => {
      let ts = n.created_at || n.createdAt || ''
      // Append Z if no timezone info (PostgreSQL timestamp without tz)
      if (ts && typeof ts === 'string' && !ts.endsWith('Z') && !ts.includes('+')) {
        ts = ts + 'Z'
      }
      return { ...n, createdAt: ts }
    })

    return NextResponse.json({ notifications: normalized, unreadCount })
  } catch {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, markAllRead } = body

    const payload = await getPayloadHMR({ config: configPromise })
    const drizzle = (payload as any).db?.drizzle || (payload as any).db?.pool

    if (drizzle?.execute) {
      if (markAllRead) {
        await drizzle.execute(`UPDATE notifications SET read = true WHERE tenant_id = 1 AND read = false`)
      } else if (Array.isArray(ids) && ids.length > 0) {
        const idList = ids.map((id: number) => parseInt(String(id), 10)).join(',')
        await drizzle.execute(`UPDATE notifications SET read = true WHERE id IN (${idList})`)
      }
    } else if (drizzle?.query) {
      if (markAllRead) {
        await drizzle.query(`UPDATE notifications SET read = true WHERE tenant_id = 1 AND read = false`)
      } else if (Array.isArray(ids) && ids.length > 0) {
        await drizzle.query(`UPDATE notifications SET read = true WHERE id = ANY($1)`, [ids])
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
