import type { NextRequest } from 'next/server'
import { resolveNotificationsPrincipal } from '@/lib/server/notifications-auth'
import { listNotificationsAfter } from '@/lib/server/notifications-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const NOTIFICATION_POLL_INTERVAL_MS = 3000
export const NOTIFICATION_MAX_CONSECUTIVE_ERRORS = 5

export async function GET(request: NextRequest) {
  const auth = await resolveNotificationsPrincipal(request)
  if (!auth) return Response.json({ error: 'Authentication required' }, { status: 401 })

  const encoder = new TextEncoder()
  let closed = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`))
      let lastId = 0
      let consecutiveErrors = 0

      const close = () => {
        if (closed) return
        closed = true
        if (timer) clearTimeout(timer)
        controller.close()
      }
      const poll = async () => {
        if (closed) return
        try {
          const notifications = await listNotificationsAfter(
            auth.payload,
            auth.principal.tenantId,
            lastId,
          )
          if (closed) return
          for (const notification of notifications) {
            const raw = notification.created_at ?? notification.createdAt ?? ''
            const createdAt = raw instanceof Date ? raw.toISOString() : raw
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              id: notification.id,
              type: notification.type,
              title: notification.title,
              body: notification.body,
              link: notification.link,
              createdAt: createdAt && !createdAt.endsWith('Z') && !createdAt.includes('+')
                ? `${createdAt}Z`
                : createdAt,
            })}\n\n`))
            lastId = Math.max(lastId, notification.id)
          }
          consecutiveErrors = 0
        } catch {
          if (closed) return
          consecutiveErrors += 1
          if (consecutiveErrors >= NOTIFICATION_MAX_CONSECUTIVE_ERRORS) {
            close()
            return
          }
        }
        if (!closed) timer = setTimeout(poll, NOTIFICATION_POLL_INTERVAL_MS)
      }

      request.signal.addEventListener('abort', close, { once: true })
      timer = setTimeout(poll, 0)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
