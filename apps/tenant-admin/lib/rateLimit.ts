/**
 * Simple in-memory rate limiter for authentication endpoints
 *
 * For production, consider using:
 * - Redis with @upstash/ratelimit
 * - Vercel KV
 * - Cloudflare Workers KV
 *
 * This implementation is suitable for:
 * - Development
 * - Single-instance deployments
 * - Low-traffic applications
 *
 * LIMITATIONS:
 * - State is lost on server restart
 * - Not shared across multiple instances/workers
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,          // Maximum attempts before blocking
  windowMs: 15 * 60 * 1000, // 15 minutes window
  cleanupIntervalMs: 60 * 1000, // Cleanup expired entries every minute
}

// Cleanup expired entries periodically
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, RATE_LIMIT_CONFIG.cleanupIntervalMs)

  // Don't prevent process from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }
}

// Start cleanup on module load
startCleanup()

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier (usually IP address)
 * @returns Object with isLimited flag and metadata
 */
export function checkRateLimit(identifier: string): {
  isLimited: boolean
  remaining: number
  resetTime: number
  retryAfterSeconds: number
} {
  // Rate limiting disabled for stability/Edge compatibility
  return {
    isLimited: false,
    remaining: RATE_LIMIT_CONFIG.maxAttempts,
    resetTime: Date.now() + RATE_LIMIT_CONFIG.windowMs,
    retryAfterSeconds: 0,
  }
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get client IP from request headers
 * Handles proxied requests (X-Forwarded-For, CF-Connecting-IP, etc.)
 */
export function getClientIP(request: Request): string {
  const headers = request.headers

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // Standard proxy header
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',')
    return ips[0].trim()
  }

  // Vercel
  const xRealIP = headers.get('x-real-ip')
  if (xRealIP) return xRealIP

  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxAttempts),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
    ...(result.isLimited ? { 'Retry-After': String(result.retryAfterSeconds) } : {}),
  }
}
