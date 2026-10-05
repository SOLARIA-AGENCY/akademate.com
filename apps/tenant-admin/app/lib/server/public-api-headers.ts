import { randomUUID } from 'crypto'

export function correlationIdFrom(request: Request): string {
  return request.headers.get('x-correlation-id')?.trim() || randomUUID()
}

export function jsonHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  if (!headers.has('x-content-type-options')) headers.set('x-content-type-options', 'nosniff')
  return headers
}
