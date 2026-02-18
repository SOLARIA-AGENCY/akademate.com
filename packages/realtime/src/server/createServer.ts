/**
 * Socket.io Server Factory
 *
 * Creates and configures Socket.io server with authentication,
 * rate limiting, and tenant isolation.
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Server as HTTPSServer } from 'https';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types/events';
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createTenantIsolationMiddleware,
  type RateLimitOptions,
} from './middleware';
import { handleConnection, type TypedServer } from './handlers';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateSocketServerOptions {
  /** HTTP/HTTPS server instance */
  httpServer: HTTPServer | HTTPSServer;

  /** JWT secret for authentication */
  jwtSecret: string;

  /** JWT issuer for verification (optional) */
  jwtIssuer?: string;

  /** JWT audience for verification (optional) */
  jwtAudience?: string;

  /** Socket.io path (defaults to /socket.io) */
  path?: string;

  /** CORS configuration */
  cors?: {
    origin: string | string[] | boolean;
    methods?: string[];
    credentials?: boolean;
  };

  /** Rate limiting options */
  rateLimit?: Partial<RateLimitOptions>;

  /** Ping timeout in milliseconds */
  pingTimeout?: number;

  /** Ping interval in milliseconds */
  pingInterval?: number;

  /** Max HTTP buffer size */
  maxHttpBufferSize?: number;

  /** Enable debug logging */
  debug?: boolean;

  /** Skip authentication -- only effective when NODE_ENV=development (defense-in-depth) */
  skipAuth?: boolean;
}

// ============================================================================
// SERVER FACTORY
// ============================================================================

/**
 * Creates a configured Socket.io server
 *
 * @example
 * ```ts
 * import { createServer } from 'http';
 * import express from 'express';
 * import { createSocketServer } from '@akademate/realtime/server';
 *
 * const app = express();
 * const httpServer = createServer(app);
 *
 * const io = createSocketServer({
 *   httpServer,
 *   jwtSecret: process.env.JWT_SECRET!,
 *   cors: {
 *     origin: ['http://localhost:3000'],
 *     credentials: true,
 *   },
 * });
 *
 * // Start server
 * httpServer.listen(3001);
 * ```
 */
export function createSocketServer(options: CreateSocketServerOptions): TypedServer {
  const {
    httpServer,
    jwtSecret,
    jwtIssuer,
    jwtAudience,
    path = '/socket.io',
    cors = {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    rateLimit = {
      maxEvents: 100,
      windowMs: 60000,
    },
    pingTimeout = 20000,
    pingInterval = 25000,
    maxHttpBufferSize = 1e6, // 1MB
    debug = false,
    skipAuth = false,
  } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[SocketServer]', ...args);
    }
  };

  log('Creating Socket.io server', { path, cors: cors.origin });

  // Create Socket.io server with types
  const io: TypedServer = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    path,
    cors,
    pingTimeout,
    pingInterval,
    maxHttpBufferSize,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    perMessageDeflate: {
      threshold: 1024, // Only compress messages > 1KB
    },
    httpCompression: true,
  });

  // FIX-16: Defense-in-depth -- skipAuth can only work in development.
  // Even if a caller passes skipAuth=true, it is silently ignored in production.
  const effectiveSkipAuth = skipAuth && process.env.NODE_ENV === 'development';
  if (effectiveSkipAuth && skipAuth) {
    console.warn('[SocketServer] WARNING: skipAuth is enabled. This must NEVER happen in production.');
  }

  // Apply middleware
  if (!effectiveSkipAuth) {
    log('Applying auth middleware');
    io.use(
      createAuthMiddleware({
        jwtSecret,
        jwtIssuer,
        jwtAudience,
        debug,
      })
    );
  } else {
    log('WARNING: Authentication disabled');
    // Set mock data for unauthenticated connections
    io.use((socket, next) => {
      socket.data.userId = (socket.handshake.query.userId as string) || 'anonymous';
      socket.data.tenantId = parseInt(
        (socket.handshake.query.tenantId as string) || '1',
        10
      );
      socket.data.role = (socket.handshake.query.role as string) || 'user';
      socket.data.authenticated = false;
      next();
    });
  }

  // Rate limiting
  log('Applying rate limit middleware', rateLimit);
  io.use(
    createRateLimitMiddleware({
      maxEvents: rateLimit.maxEvents ?? 100,
      windowMs: rateLimit.windowMs ?? 60000,
      skipEvents: rateLimit.skipEvents ?? ['ping', 'pong'],
      debug,
    })
  );

  // Tenant isolation
  log('Applying tenant isolation middleware');
  io.use(createTenantIsolationMiddleware({ debug }));

  // Connection handler
  io.on('connection', (socket) => {
    handleConnection(io, socket, { debug });
  });

  log('Socket.io server created successfully');

  return io;
}

// ============================================================================
// ADAPTER SETUP (for scaling)
// ============================================================================

export interface RedisAdapterOptions {
  /** Redis URL (e.g., redis://localhost:6379) */
  url: string;

  /** Optional key prefix for Socket.io */
  keyPrefix?: string;

  /** Request timeout in ms */
  requestsTimeout?: number;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Configures Redis adapter for horizontal scaling
 *
 * This allows multiple Socket.io server instances to share state,
 * enabling horizontal scaling across multiple processes or servers.
 *
 * @example
 * ```ts
 * import { createSocketServer, setupRedisAdapter } from '@akademate/realtime/server';
 *
 * const io = createSocketServer({ httpServer, jwtSecret });
 *
 * // Enable Redis adapter for production scaling
 * if (process.env.REDIS_URL) {
 *   await setupRedisAdapter(io, {
 *     url: process.env.REDIS_URL,
 *     keyPrefix: 'akademate-socket',
 *     debug: process.env.NODE_ENV === 'development',
 *   });
 * }
 * ```
 */
export async function setupRedisAdapter(
  io: TypedServer,
  options: RedisAdapterOptions
): Promise<void> {
  const {
    url,
    keyPrefix = 'socket.io',
    requestsTimeout = 5000,
    debug = false,
  } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[RedisAdapter]', ...args);
    }
  };

  try {
    // Dynamic import to avoid requiring Redis in development
    const { createAdapter } = await import('@socket.io/redis-adapter');
    const Redis = (await import('ioredis')).default;

    log('Connecting to Redis:', url);

    // Create pub/sub clients
    const pubClient = new Redis(url, {
      keyPrefix,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          log('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    const subClient = pubClient.duplicate();

    // Connect both clients
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    log('Redis connected successfully');

    // Set up the adapter
    io.adapter(createAdapter(pubClient, subClient, {
      key: keyPrefix,
      requestsTimeout,
    }));

    log('Redis adapter configured');

    // Handle Redis errors
    pubClient.on('error', (err) => {
      console.error('[RedisAdapter] Pub client error:', err.message);
    });

    subClient.on('error', (err) => {
      console.error('[RedisAdapter] Sub client error:', err.message);
    });

    // Graceful shutdown
    const cleanup = async () => {
      log('Closing Redis connections...');
      await Promise.all([
        pubClient.quit(),
        subClient.quit(),
      ]);
      log('Redis connections closed');
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    console.log('[SocketServer] Redis adapter enabled for horizontal scaling');
  } catch (error) {
    console.error('[RedisAdapter] Failed to setup:', error);
    console.warn('[SocketServer] Falling back to in-memory adapter (single instance only)');
  }
}
