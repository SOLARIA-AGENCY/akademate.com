import type { NextRequest } from 'next/server'

const encoder = new TextEncoder()

function sse(data: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

export async function GET(_request: NextRequest) {
  let interval: ReturnType<typeof setInterval> | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse({ type: 'connected', timestamp: Date.now() }))

      interval = setInterval(() => {
        controller.enqueue(sse({ type: 'heartbeat', timestamp: Date.now() }))
      }, 20000)

      timeout = setTimeout(() => {
        if (interval) clearInterval(interval)
        controller.close()
      }, 120000)
    },
    cancel() {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
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
