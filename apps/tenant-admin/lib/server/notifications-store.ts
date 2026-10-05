import { sql } from '@payloadcms/db-postgres'

export type NotificationRecord = {
  id: number
  type: string
  title: string
  body?: string | null
  link?: string | null
  read?: boolean
  created_at?: string | Date | null
  createdAt?: string | Date | null
}

type SqlResult = { rows?: unknown[] } | unknown[]
type NotificationPayload = { db?: { drizzle?: { execute(query: unknown): Promise<SqlResult> } } }

function database(payload: NotificationPayload) {
  const db = payload.db?.drizzle
  if (!db) throw new Error('Notification database unavailable')
  return db
}

function rows(result: SqlResult): unknown[] {
  return Array.isArray(result) ? result : result.rows ?? []
}

export async function listNotifications(payload: NotificationPayload, tenantId: string) {
  const db = database(payload)
  const result = await db.execute(sql`
    SELECT id, type, title, body, link, read, created_at
    FROM notifications
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at DESC
    LIMIT 50
  `)
  const countResult = await db.execute(sql`
    SELECT count(*)::integer AS count
    FROM notifications
    WHERE tenant_id = ${tenantId} AND read = false
  `)
  const countRow = rows(countResult)[0] as { count?: number | string } | undefined
  return {
    notifications: rows(result) as NotificationRecord[],
    unreadCount: Number(countRow?.count ?? 0),
  }
}

export async function listNotificationsAfter(
  payload: NotificationPayload,
  tenantId: string,
  lastId: number,
): Promise<NotificationRecord[]> {
  const result = await database(payload).execute(sql`
    SELECT id, type, title, body, link, created_at
    FROM notifications
    WHERE tenant_id = ${tenantId} AND id > ${lastId} AND read = false
    ORDER BY id ASC
    LIMIT 10
  `)
  return rows(result) as NotificationRecord[]
}

export async function markAllNotificationsRead(payload: NotificationPayload, tenantId: string) {
  await database(payload).execute(sql`
    UPDATE notifications SET read = true
    WHERE tenant_id = ${tenantId} AND read = false
  `)
}

export async function markNotificationsRead(
  payload: NotificationPayload,
  tenantId: string,
  ids: number[],
): Promise<number[]> {
  const result = await database(payload).execute(sql`
    UPDATE notifications SET read = true
    WHERE tenant_id = ${tenantId} AND id = ANY(${ids}::integer[])
      AND (
        SELECT count(*) FROM notifications
        WHERE tenant_id = ${tenantId} AND id = ANY(${ids}::integer[])
      ) = ${ids.length}
    RETURNING id
  `)
  return rows(result).map((row) => Number((row as { id: unknown }).id))
}
