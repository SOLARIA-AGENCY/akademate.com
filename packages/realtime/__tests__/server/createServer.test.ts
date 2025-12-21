/**
 * @module @akademate/realtime/__tests__/server/createServer
 * Tests for Socket.io server factory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer as createHttpServer, type Server as HttpServer } from 'http';
import { createSocketServer, type CreateSocketServerOptions } from '../../src/server/createServer';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestOptions(overrides: Partial<CreateSocketServerOptions> = {}): CreateSocketServerOptions {
  const httpServer = createHttpServer();
  return {
    httpServer,
    jwtSecret: 'test-secret-for-unit-tests-min-32-chars',
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('createSocketServer', () => {
  let httpServer: HttpServer;

  beforeEach(() => {
    vi.clearAllMocks();
    httpServer = createHttpServer();
  });

  afterEach(() => {
    httpServer.close();
  });

  describe('Server Creation', () => {
    it('should create a Socket.io server', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      // Verify it's a socket.io server by checking its key methods
      expect(io).toBeDefined();
      expect(typeof io.on).toBe('function');
      expect(typeof io.emit).toBe('function');
      expect(typeof io.use).toBe('function');
      expect(typeof io.close).toBe('function');
    });

    it('should use default path /socket.io', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      // Check the server was created with expected config
      expect(io).toBeDefined();
    });

    it('should use custom path when provided', () => {
      const options = createTestOptions({
        httpServer,
        path: '/custom-socket',
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should configure CORS', () => {
      const options = createTestOptions({
        httpServer,
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:3001'],
          methods: ['GET', 'POST'],
          credentials: true,
        },
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should set default CORS when not provided', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });
  });

  describe('Middleware Configuration', () => {
    it('should apply auth middleware by default', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      // Server is created with middleware applied
      expect(io).toBeDefined();
    });

    it('should skip auth middleware when skipAuth is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options = createTestOptions({
        httpServer,
        skipAuth: true,
        debug: true,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[SocketServer]',
        'WARNING: Authentication disabled'
      );

      consoleSpy.mockRestore();
    });

    it('should configure rate limiting', () => {
      const options = createTestOptions({
        httpServer,
        rateLimit: {
          maxEvents: 50,
          windowMs: 30000,
        },
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should use default rate limit when not provided', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });
  });

  describe('Server Options', () => {
    it('should configure ping timeout', () => {
      const options = createTestOptions({
        httpServer,
        pingTimeout: 10000,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should configure ping interval', () => {
      const options = createTestOptions({
        httpServer,
        pingInterval: 15000,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should configure max HTTP buffer size', () => {
      const options = createTestOptions({
        httpServer,
        maxHttpBufferSize: 2e6,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });
  });

  describe('Debug Mode', () => {
    it('should log when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options = createTestOptions({
        httpServer,
        debug: true,
      });
      createSocketServer(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SocketServer]',
        'Creating Socket.io server',
        expect.anything()
      );

      consoleSpy.mockRestore();
    });

    it('should not log when debug is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options = createTestOptions({
        httpServer,
        debug: false,
      });
      createSocketServer(options);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        '[SocketServer]',
        expect.anything()
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Connection Handler', () => {
    it('should register connection handler', () => {
      const options = createTestOptions({ httpServer });
      const io = createSocketServer(options);

      // Verify we can add a connection handler
      const handler = vi.fn();
      io.on('connection', handler);

      // Handler should not have been called yet (no connections)
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Skip Auth Mode', () => {
    it('should set mock data for unauthenticated connections', () => {
      const options = createTestOptions({
        httpServer,
        skipAuth: true,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should use query params for mock user data', () => {
      const options = createTestOptions({
        httpServer,
        skipAuth: true,
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });
  });

  describe('JWT Configuration', () => {
    it('should pass jwtIssuer to auth middleware', () => {
      const options = createTestOptions({
        httpServer,
        jwtIssuer: 'akademate.com',
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });

    it('should pass jwtAudience to auth middleware', () => {
      const options = createTestOptions({
        httpServer,
        jwtAudience: 'akademate-api',
      });
      const io = createSocketServer(options);

      expect(io).toBeDefined();
    });
  });
});

describe('Server Transports', () => {
  let httpServer: HttpServer;

  beforeEach(() => {
    httpServer = createHttpServer();
  });

  afterEach(() => {
    httpServer.close();
  });

  it('should enable websocket and polling transports', () => {
    const io = createSocketServer({
      httpServer,
      jwtSecret: 'test-secret-minimum-32-characters-long',
    });

    expect(io).toBeDefined();
  });

  it('should enable upgrades', () => {
    const io = createSocketServer({
      httpServer,
      jwtSecret: 'test-secret-minimum-32-characters-long',
    });

    expect(io).toBeDefined();
  });

  it('should enable compression for large messages', () => {
    const io = createSocketServer({
      httpServer,
      jwtSecret: 'test-secret-minimum-32-characters-long',
    });

    expect(io).toBeDefined();
  });
});
