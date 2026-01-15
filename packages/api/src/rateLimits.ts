/**
 * @module @akademate/api/rateLimits
 * Rate limit configurations for authentication endpoints
 *
 * Security Requirements (P1-002):
 * - Login: 5 attempts per 15 minutes
 * - Register: 3 attempts per hour
 * - Reset Password: 3 attempts per hour
 */

export interface RateLimitEndpointConfig {
  maxAttempts: number
  windowMs: number
  description: string
}

export const RateLimitConfig = {
  auth: {
    login: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      description: 'Login attempts (5 per 15 minutes)',
    } as RateLimitEndpointConfig,

    register: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
      description: 'Registration attempts (3 per hour)',
    } as RateLimitEndpointConfig,

    resetPassword: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
      description: 'Password reset attempts (3 per hour)',
    } as RateLimitEndpointConfig,

    verifyEmail: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
      description: 'Email verification attempts (5 per 15 minutes)',
    } as RateLimitEndpointConfig,
  } as const,

  api: {
    general: {
      maxAttempts: 100,
      windowMs: 60 * 1000,
      description: 'General API calls (100 per minute)',
    } as RateLimitEndpointConfig,

    upload: {
      maxAttempts: 10,
      windowMs: 60 * 60 * 1000,
      description: 'File uploads (10 per hour)',
    } as RateLimitEndpointConfig,

    search: {
      maxAttempts: 60,
      windowMs: 60 * 1000,
      description: 'Search queries (60 per minute)',
    } as RateLimitEndpointConfig,
  } as const,

  public: {
    contact: {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000,
      description: 'Contact form submissions (5 per hour)',
    } as RateLimitEndpointConfig,

    newsletter: {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000,
      description: 'Newsletter subscriptions (3 per hour)',
    } as RateLimitEndpointConfig,
  } as const,

  webhooks: {
    stripe: {
      maxAttempts: 1000,
      windowMs: 60 * 1000,
      description: 'Stripe webhook events (1000 per minute)',
    } as RateLimitEndpointConfig,

    custom: {
      maxAttempts: 500,
      windowMs: 60 * 1000,
      description: 'Custom webhook events (500 per minute)',
    } as RateLimitEndpointConfig,
  } as const,
} as const

export type RateLimitEndpoint =
  | keyof typeof RateLimitConfig.auth
  | keyof typeof RateLimitConfig.api
  | keyof typeof RateLimitConfig.public
  | keyof typeof RateLimitConfig.webhooks

export type RateLimitCategory = 'auth' | 'api' | 'public' | 'webhooks'

/**
 * Get rate limit configuration for a specific endpoint
 */
export function getRateLimitConfig(
  category: RateLimitCategory,
  endpoint: string
): RateLimitEndpointConfig {
  const categoryConfig = RateLimitConfig[category] as Record<string, RateLimitEndpointConfig>

  if (endpoint in categoryConfig) {
    return categoryConfig[endpoint]!
  }

  return RateLimitConfig.api.general
}

/**
 * Format rate limit info for error messages
 */
export function formatRateLimitInfo(config: RateLimitEndpointConfig): string {
  const windowMinutes = Math.ceil(config.windowMs / (60 * 1000))
  return `${config.description} (${config.maxAttempts} per ${windowMinutes} min)`
}
