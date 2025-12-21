/**
 * @module @akademate/realtime/__tests__/server/middleware
 * Tests for Socket.io middleware (auth, rate limiting, tenant isolation)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAuthMiddleware,
  createRateLimitMiddleware,
  createTenantIsolationMiddleware,
} from '../../src/server/middleware';

// Mock jose for JWT verification
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

// ============================================================================
// MOCKS
// ============================================================================

let socketIdCounter = 0;

function createMockSocket(overrides: Partial<{
  id: string;
  handshake: {
    auth: { token?: string };
    query: Record<string, string>;
  };
  data: Record<string, unknown>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
  onAny: ReturnType<typeof vi.fn>;
}> = {}) {
  // Use unique socket ID for each mock to avoid rate limit store collisions
  socketIdCounter++;
  return {
    id: overrides.id ?? `socket-${socketIdCounter}-${Date.now()}`,
    handshake: {
      auth: { token: undefined },
      query: {},
      ...overrides.handshake,
    },
    data: {},
    emit: vi.fn(),
    disconnect: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    onAny: vi.fn(),
    ...overrides,
  };
}

// ============================================================================
// AUTH MIDDLEWARE TESTS
// ============================================================================

describe('createAuthMiddleware', () => {
  const jwtSecret = 'test-secret-key-for-testing-minimum-32-chars';

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset jose mock
    const { jwtVerify } = await import('jose');
    vi.mocked(jwtVerify).mockReset();
  });

  it('should create middleware function', () => {
    const middleware = createAuthMiddleware({ jwtSecret });
    expect(typeof middleware).toBe('function');
  });

  it('should reject connection without token', async () => {
    const middleware = createAuthMiddleware({ jwtSecret });
    const socket = createMockSocket();
    const next = vi.fn();

    await middleware(socket as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Authentication required');
  });

  it('should reject connection with invalid token', async () => {
    const { jwtVerify } = await import('jose');
    vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid signature'));

    const middleware = createAuthMiddleware({ jwtSecret });
    const socket = createMockSocket({
      handshake: { auth: { token: 'invalid-token' }, query: {} },
    });
    const next = vi.fn();

    await middleware(socket as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Authentication failed');
  });

  it('should accept connection with valid token', async () => {
    const { jwtVerify } = await import('jose');
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: 'user-123',
        tenantId: 1,
        role: 'admin',
        email: 'test@example.com',
      },
      protectedHeader: { alg: 'HS256' },
    } as never);

    const middleware = createAuthMiddleware({ jwtSecret });
    const socket = createMockSocket({
      handshake: { auth: { token: 'valid-token' }, query: {} },
    });
    const next = vi.fn();

    await middleware(socket as never, next);

    expect(next).toHaveBeenCalledWith(); // No error
    expect(socket.data.userId).toBe('user-123');
    expect(socket.data.tenantId).toBe(1);
    expect(socket.data.role).toBe('admin');
    expect(socket.data.authenticated).toBe(true);
  });

  it('should reject token with missing required fields', async () => {
    const { jwtVerify } = await import('jose');
    vi.mocked(jwtVerify).mockResolvedValue({
      payload: {
        sub: 'user-123',
        role: 'admin',
        // Missing tenantId
      },
      protectedHeader: { alg: 'HS256' },
    } as never);

    const middleware = createAuthMiddleware({ jwtSecret });
    const socket = createMockSocket({
      handshake: { auth: { token: 'token-without-tenant' }, query: {} },
    });
    const next = vi.fn();

    await middleware(socket as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Invalid token');
  });

  it('should verify issuer when configured', async () => {
    const { jwtVerify } = await import('jose');
    vi.mocked(jwtVerify).mockRejectedValue(new Error('Issuer mismatch'));

    const middleware = createAuthMiddleware({
      jwtSecret,
      jwtIssuer: 'akademate.com',
    });

    const socket = createMockSocket({
      handshake: { auth: { token: 'token-wrong-issuer' }, query: {} },
    });
    const next = vi.fn();

    await middleware(socket as never, next);

    // Should fail because issuer doesn't match
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(jwtVerify).toHaveBeenCalledWith(
      'token-wrong-issuer',
      expect.anything(),
      expect.objectContaining({ issuer: 'akademate.com' })
    );
  });

  it('should enable debug logging when configured', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createAuthMiddleware({ jwtSecret, debug: true });

    const socket = createMockSocket();
    const next = vi.fn();

    await middleware(socket as never, next);

    expect(consoleSpy).toHaveBeenCalledWith('[SocketAuth]', 'No token provided');
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// RATE LIMIT MIDDLEWARE TESTS
// ============================================================================

describe('createRateLimitMiddleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create middleware function', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 10,
      windowMs: 1000,
    });
    expect(typeof middleware).toBe('function');
  });

  it('should register onAny handler and call next', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 10,
      windowMs: 1000,
    });
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    expect(socket.onAny).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(); // No error
  });

  it('should allow events under rate limit', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 5,
      windowMs: 60000,
    });
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    // Get the onAny handler
    const onAnyHandler = socket.onAny.mock.calls[0][0];

    // Emit 5 events (at limit)
    for (let i = 0; i < 5; i++) {
      onAnyHandler('test-event');
    }

    expect(socket.emit).not.toHaveBeenCalledWith('error', expect.anything());
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('should block events over rate limit', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 3,
      windowMs: 60000,
    });
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    const onAnyHandler = socket.onAny.mock.calls[0][0];

    // Emit 4 events (over limit)
    for (let i = 0; i < 4; i++) {
      onAnyHandler('test-event');
    }

    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
    });
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('should skip specified events from rate limiting', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 2,
      windowMs: 60000,
      skipEvents: ['ping', 'pong'],
    });
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    const onAnyHandler = socket.onAny.mock.calls[0][0];

    // Emit many ping events (should not be rate limited)
    for (let i = 0; i < 100; i++) {
      onAnyHandler('ping');
    }

    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('should reset rate limit after window expires', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 2,
      windowMs: 1000,
    });
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    const onAnyHandler = socket.onAny.mock.calls[0][0];

    // Emit 2 events (at limit)
    onAnyHandler('event-a');
    onAnyHandler('event-a');

    // Should not have disconnected yet
    expect(socket.disconnect).not.toHaveBeenCalled();

    // Advance time past window
    vi.advanceTimersByTime(1500);

    // Clear mock to reset call history
    socket.emit.mockClear();
    socket.disconnect.mockClear();

    // Now emit again - should be allowed since window reset
    onAnyHandler('event-a');

    // Should still not disconnect (we're at 1 event in new window)
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('should track events per socket and event type independently', () => {
    const middleware = createRateLimitMiddleware({
      maxEvents: 3,
      windowMs: 60000,
    });
    // Use unique socket ID for this test
    const socket = createMockSocket();
    const next = vi.fn();

    middleware(socket as never, next);

    const onAnyHandler = socket.onAny.mock.calls[0][0];

    // Emit events of different types - each type has its own counter
    // With maxEvents=3, we can do 3 of each without triggering limit
    onAnyHandler('event-type-a');
    onAnyHandler('event-type-a');
    onAnyHandler('event-type-b');
    onAnyHandler('event-type-b');

    // Should not disconnect since each event type has its own limit
    expect(socket.disconnect).not.toHaveBeenCalled();
  });
});

// ============================================================================
// TENANT ISOLATION MIDDLEWARE TESTS
// ============================================================================

describe('createTenantIsolationMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create middleware function', () => {
    const middleware = createTenantIsolationMiddleware();
    expect(typeof middleware).toBe('function');
  });

  it('should call next without error', () => {
    const middleware = createTenantIsolationMiddleware();
    const socket = createMockSocket();
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should allow joining own tenant rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('tenant:1:dashboard');

    expect(originalJoin).toHaveBeenCalledWith('tenant:1:dashboard');
  });

  it('should block joining other tenant rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('tenant:2:dashboard');

    expect(originalJoin).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'ACCESS_DENIED',
      message: 'Access denied to room',
    });
  });

  it('should allow joining own user rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('user:user-123:notifications');

    expect(originalJoin).toHaveBeenCalledWith('user:user-123:notifications');
  });

  it('should block joining other user rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('user:other-user:notifications');

    expect(originalJoin).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('error', {
      code: 'ACCESS_DENIED',
      message: 'Access denied to room',
    });
  });

  it('should allow joining system rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('system:status');

    expect(originalJoin).toHaveBeenCalledWith('system:status');
  });

  it('should handle array of rooms', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    // Mix of allowed rooms
    await socket.join(['tenant:1:dashboard', 'user:user-123:notifications']);

    expect(originalJoin).toHaveBeenCalled();
  });

  it('should block if any room in array is denied', async () => {
    const middleware = createTenantIsolationMiddleware();
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    // Mix with denied room
    await socket.join(['tenant:1:dashboard', 'tenant:2:dashboard']);

    expect(originalJoin).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith('error', expect.anything());
  });

  it('should enable debug logging when configured', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createTenantIsolationMiddleware({ debug: true });
    const originalJoin = vi.fn().mockResolvedValue(undefined);
    const socket = createMockSocket({ join: originalJoin });
    socket.data = { tenantId: 1, userId: 'user-123' };
    const next = vi.fn();

    middleware(socket as never, next);

    await socket.join('tenant:2:dashboard');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[TenantIsolation]',
      'Blocked cross-tenant room join',
      expect.anything()
    );
    consoleSpy.mockRestore();
  });
});
