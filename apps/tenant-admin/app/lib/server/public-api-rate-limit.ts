type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60

export function consumePublicCatalogRateLimit(keyId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const current = buckets.get(keyId)
  if (!current || current.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + WINDOW_MS }
    buckets.set(keyId, fresh)
    return { allowed: true, remaining: MAX_PER_WINDOW - 1, resetAt: fresh.resetAt }
  }
  if (current.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }
  current.count += 1
  return { allowed: true, remaining: MAX_PER_WINDOW - current.count, resetAt: current.resetAt }
}
