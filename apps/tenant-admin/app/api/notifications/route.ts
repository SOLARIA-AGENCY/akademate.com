import { NextResponse, type NextRequest } from 'next/server'
import { resolveNotificationsPrincipal } from '@/lib/server/notifications-auth'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  type NotificationRecord,
} from '@/lib/server/notifications-store'

export const dynamic = 'force-dynamic'

function normalize(notification: NotificationRecord) {
  const raw = notification.created_at ?? notification.createdAt ?? ''
  const createdAt = raw instanceof Date ? raw.toISOString() : raw
  const normalized = createdAt && !createdAt.endsWith('Z') && !createdAt.includes('+')
    ? `${createdAt}Z`
    : createdAt
  return { ...notification, createdAt: normalized }
}

export async function GET(request: NextRequest) {
  const auth = await resolveNotificationsPrincipal(request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    const result = await listNotifications(auth.payload, auth.principal.tenantId)
    return NextResponse.json({
      notifications: result.notifications.map(normalize),
      unreadCount: result.unreadCount,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await resolveNotificationsPrincipal(request)
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  try {
    const body = await request.json() as { ids?: unknown; markAllRead?: unknown }
    if (body.markAllRead === true) {
      await markAllNotificationsRead(auth.payload, auth.principal.tenantId)
      return NextResponse.json({ success: true })
    }
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: 'Notification ids are required' }, { status: 400 })
    }
    const ids = [...new Set(body.ids.map(Number))]
    if (ids.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      return NextResponse.json({ error: 'Invalid notification ids' }, { status: 400 })
    }
    const updated = await markNotificationsRead(auth.payload, auth.principal.tenantId, ids)
    if (updated.length !== ids.length) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
