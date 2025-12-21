/**
 * Socket.io Server Middleware
 *
 * Authentication and authorization middleware for Socket.io connections.
 */

import type { Socket } from 'socket.io';
import { jwtVerify } from 'jose';
import type { SocketData } from '../types/events';

// Socket.io middleware next callback error type
type MiddlewareNext = (err?: Error) => void;

// ============================================================================
// TYPES
// ============================================================================

export interface AuthMiddlewareOptions {
  /** JWT secret for token verification */
  jwtSecret: string;

  /** JWT issuer for verification (optional) */
  jwtIssuer?: string;

  /** JWT audience for verification (optional) */
  jwtAudience?: string;

  /** Enable debug logging */
  debug?: boolean;
}

export interface JWTPayload {
  sub: string;
  tenantId: number;
  role: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

/**
 * Creates authentication middleware for Socket.io
 *
 * Verifies JWT token from socket.handshake.auth.token
 * and populates socket.data with user information.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  const { jwtSecret, jwtIssuer, jwtAudience, debug = false } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[SocketAuth]', ...args);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (socket: Socket<any, any, any, SocketData>, next: MiddlewareNext) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        log('No token provided');
        return next(new Error('Authentication required'));
      }

      // Verify JWT
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, {
        issuer: jwtIssuer,
        audience: jwtAudience,
      });

      const jwtPayload = payload as unknown as JWTPayload;

      // Validate required fields
      if (!jwtPayload.sub || !jwtPayload.tenantId || !jwtPayload.role) {
        log('Invalid token payload', { sub: jwtPayload.sub, tenantId: jwtPayload.tenantId });
        return next(new Error('Invalid token'));
      }

      // Populate socket.data
      socket.data.userId = jwtPayload.sub;
      socket.data.tenantId = jwtPayload.tenantId;
      socket.data.role = jwtPayload.role;
      socket.data.authenticated = true;

      log('Authenticated', {
        userId: socket.data.userId,
        tenantId: socket.data.tenantId,
        role: socket.data.role,
      });

      next();
    } catch (error) {
      log('Auth error:', error instanceof Error ? error.message : error);
      next(new Error('Authentication failed'));
    }
  };
}

// ============================================================================
// RATE LIMIT MIDDLEWARE
// ============================================================================

export interface RateLimitOptions {
  /** Maximum events per window */
  maxEvents: number;

  /** Window duration in milliseconds */
  windowMs: number;

  /** Events to skip rate limiting */
  skipEvents?: string[];

  /** Enable debug logging */
  debug?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Creates rate limiting middleware for Socket.io
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  const { maxEvents, windowMs, skipEvents = [], debug = false } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[SocketRateLimit]', ...args);
    }
  };

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (socket: Socket, next: MiddlewareNext) => {
    // Track incoming events via onAny
    socket.onAny((event: string) => {
      if (skipEvents.includes(event)) {
        return;
      }

      const key = `${socket.id}:${event}`;
      const now = Date.now();
      const record = rateLimitStore.get(key);

      if (!record || record.resetAt < now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return;
      }

      record.count++;

      if (record.count > maxEvents) {
        log('Rate limit exceeded', { socketId: socket.id, event, count: record.count });
        socket.emit('error', { code: 'RATE_LIMIT', message: 'Rate limit exceeded' });
        socket.disconnect(true);
      }
    });

    next();
  };
}

// ============================================================================
// TENANT ISOLATION MIDDLEWARE
// ============================================================================

/**
 * Ensures socket can only join rooms for their tenant
 */
export function createTenantIsolationMiddleware(options: { debug?: boolean } = {}) {
  const { debug = false } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[TenantIsolation]', ...args);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (socket: Socket<any, any, any, SocketData>, next: MiddlewareNext) => {
    // Override the socket.join method to validate rooms
    const originalJoin = socket.join.bind(socket);

    socket.join = (rooms: string | string[]) => {
      const roomList = Array.isArray(rooms) ? rooms : [rooms];
      const tenantId = socket.data.tenantId;

      for (const room of roomList) {
        // System rooms are allowed for all authenticated users
        if (room.startsWith('system:')) {
          continue;
        }

        // Tenant rooms must match user's tenant
        if (room.startsWith('tenant:')) {
          const roomTenantId = parseInt(room.split(':')[1] || '0', 10);
          if (roomTenantId !== tenantId) {
            log('Blocked cross-tenant room join', { room, userTenantId: tenantId });
            socket.emit('error', { code: 'ACCESS_DENIED', message: 'Access denied to room' });
            return Promise.resolve();
          }
        }

        // User rooms must match user's ID
        if (room.startsWith('user:')) {
          const roomUserId = room.split(':')[1] || '';
          if (roomUserId !== socket.data.userId) {
            log('Blocked cross-user room join', { room, userId: socket.data.userId });
            socket.emit('error', { code: 'ACCESS_DENIED', message: 'Access denied to room' });
            return Promise.resolve();
          }
        }
      }

      return originalJoin(rooms);
    };

    next();
  };
}
