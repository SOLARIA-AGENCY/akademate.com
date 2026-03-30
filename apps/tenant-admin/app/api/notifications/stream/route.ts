import { NextRequest } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/notifications/stream
 * Server-Sent Events (SSE) endpoint for real-time notifications.
 * Browser connects and keeps connection open. Server pushes events.
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`))

      let lastId = 0

      // Poll for new notifications every 3 seconds
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return }

        try {
          const payload = await getPayloadHMR({ config: configPromise })
          const db = (payload as any).db

          const result = await db.execute({
            raw: `SELECT id, type, title, body, link, created_at
                  FROM notifications
                  WHERE id > ${lastId} AND read = false AND tenant_id = 1
                  ORDER BY id ASC LIMIT 10`,
          })

          const rows = result?.rows || []
          for (const row of rows) {
            const event = {
              id: row.id,
              type: row.type,
              title: row.title,
              body: row.body,
              link: row.link,
              createdAt: row.created_at,
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            lastId = Math.max(lastId, row.id)
          }
        } catch {
          // DB error — skip this poll
        }
      }, 3000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
