/**
 * Socket.io Server for Akademate Realtime
 *
 * Standalone Socket.io server that runs alongside Payload CMS.
 * Provides real-time events for all connected dashboards.
 *
 * Usage:
 *   npx ts-node socket/server.ts
 *   or
 *   PM2: pm2 start socket/server.ts --name akademate-socket
 *
 * Environment Variables:
 *   SOCKET_PORT - Port to listen on (default: 3009)
 *   REDIS_URL - Redis URL for horizontal scaling (optional)
 *   PAYLOAD_SECRET - JWT secret for authentication
 *   CORS_ORIGINS - Comma-separated list of allowed origins
 *   NODE_ENV - development | production
 */

import { createServer } from 'http';
import {
  createSocketServer,
  setupRedisAdapter,
  type TypedServer,
} from '@akademate/realtime/server';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.SOCKET_PORT ?? '3009', 10);
const JWT_SECRET = process.env.PAYLOAD_SECRET ?? 'development-secret-change-me';
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const REDIS_URL = process.env.REDIS_URL ?? '';

const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') ?? [
  'http://localhost:3000', // tenant-admin
  'http://localhost:3001', // admin-client
  'http://localhost:3002', // campus
  'http://localhost:3003', // payload admin
];

// ============================================================================
// SERVER INSTANCE
// ============================================================================

let io: TypedServer | null = null;

/**
 * Get the Socket.io server instance
 * Used by Payload hooks to emit events
 */
export function getSocketServer(): TypedServer | null {
  return io;
}

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  console.log('[SocketServer] Starting...');
  console.log('[SocketServer] Environment:', NODE_ENV);
  console.log('[SocketServer] Port:', PORT);
  console.log('[SocketServer] CORS Origins:', CORS_ORIGINS);
  console.log('[SocketServer] Redis:', REDIS_URL ? 'Configured' : 'Disabled');

  // Create HTTP server
  const httpServer = createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'akademate-socket',
        timestamp: new Date().toISOString(),
        connections: io?.engine?.clientsCount || 0,
      }));
      return;
    }

    // 404 for everything else
    res.writeHead(404);
    res.end('Not found');
  });

  // Create Socket.io server
  io = createSocketServer({
    httpServer,
    jwtSecret: JWT_SECRET,
    path: '/socket.io',
    cors: {
      origin: CORS_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    rateLimit: {
      maxEvents: 100,
      windowMs: 60000,
    },
    debug: NODE_ENV === 'development',
    skipAuth: NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true',
  });

  // Configure Redis adapter for horizontal scaling (if REDIS_URL is set)
  if (REDIS_URL) {
    await setupRedisAdapter(io, {
      url: REDIS_URL,
      keyPrefix: 'akademate-socket',
      requestsTimeout: 5000,
      debug: NODE_ENV === 'development',
    });
  }

  // Log connections
  io.on('connection', (socket) => {
    console.log(`[SocketServer] Client connected: ${socket.id} (tenant: ${socket.data.tenantId}, user: ${socket.data.userId})`);

    socket.on('disconnect', (reason) => {
      console.log(`[SocketServer] Client disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  // Start listening
  httpServer.listen(PORT, () => {
    console.log(`[SocketServer] ✓ Listening on port ${PORT}`);
    console.log(`[SocketServer] ✓ Health check: http://localhost:${PORT}/health`);
    console.log(`[SocketServer] ✓ Socket.io path: /socket.io`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[SocketServer] Shutting down...');
    io?.close(() => {
      console.log('[SocketServer] Socket.io closed');
      httpServer.close(() => {
        console.log('[SocketServer] HTTP server closed');
        process.exit(0);
      });
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('[SocketServer] Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// ============================================================================
// MAIN
// ============================================================================

// Only start if run directly (not imported)
if (require.main === module) {
  startServer().catch((err) => {
    console.error('[SocketServer] Failed to start:', err);
    process.exit(1);
  });
}

export { startServer };
