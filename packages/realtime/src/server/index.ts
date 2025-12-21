/**
 * Server Index
 *
 * Re-exports all server-side Socket.io utilities.
 * Import from '@akademate/realtime/server'
 */

// Server factory
export {
  createSocketServer,
  setupRedisAdapter,
  type CreateSocketServerOptions,
  type RedisAdapterOptions,
} from './createServer';

// Middleware
export {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createTenantIsolationMiddleware,
  type AuthMiddlewareOptions,
  type RateLimitOptions,
  type JWTPayload,
} from './middleware';

// Handlers & Emit utilities
export {
  handleConnection,
  emitMetricsUpdate,
  emitKPIChange,
  emitActivity,
  emitSystemStatus,
  emitNotification,
  emitAlert,
  emitProgressUpdate,
  emitPointsEarned,
  emitBadgeUnlocked,
  emitLevelUp,
  type TypedServer,
  type TypedServerSocket,
  type HandlerContext,
} from './handlers';
