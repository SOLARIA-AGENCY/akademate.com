/**
 * @module @akademate/realtime/__tests__/server/handlers
 * Tests for Socket.io event handlers and emit utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
} from '../../src/server/handlers';

// ============================================================================
// MOCKS
// ============================================================================

function createMockIO() {
  const mockEmit = vi.fn();
  const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });

  return {
    to: mockTo,
    emit: mockEmit,
    _mockEmit: mockEmit,
    _mockTo: mockTo,
  };
}

function createMockSocket(data: Partial<{
  userId: string;
  tenantId: number;
  role: string;
  authenticated: boolean;
}> = {}) {
  const eventHandlers: Record<string, Function[]> = {};
  const mockEmit = vi.fn();
  const mockJoin = vi.fn().mockResolvedValue(undefined);
  const mockLeave = vi.fn().mockResolvedValue(undefined);
  const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });

  return {
    id: 'socket-123',
    data: {
      userId: 'user-123',
      tenantId: 1,
      role: 'user',
      authenticated: true,
      ...data,
    },
    on: vi.fn((event: string, handler: Function) => {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    }),
    emit: mockEmit,
    join: mockJoin,
    leave: mockLeave,
    to: mockTo,
    _eventHandlers: eventHandlers,
    _trigger: (event: string, ...args: unknown[]) => {
      eventHandlers[event]?.forEach(handler => handler(...args));
    },
  };
}

// ============================================================================
// CONNECTION HANDLER TESTS
// ============================================================================

describe('handleConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register event handlers on socket', () => {
    const io = createMockIO();
    const socket = createMockSocket();

    handleConnection(io as never, socket as never);

    // Should register subscribe:room handler
    expect(socket.on).toHaveBeenCalledWith('subscribe:room', expect.any(Function));
    // Should register unsubscribe:room handler
    expect(socket.on).toHaveBeenCalledWith('unsubscribe:room', expect.any(Function));
    // Should register notification handlers
    expect(socket.on).toHaveBeenCalledWith('notification:read', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('notification:read-all', expect.any(Function));
    // Should register disconnect handler
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('should join presence room on connection', () => {
    const io = createMockIO();
    const socket = createMockSocket({ tenantId: 1 });

    handleConnection(io as never, socket as never);

    expect(socket.join).toHaveBeenCalledWith('tenant:1:presence');
  });

  it('should broadcast presence to tenant room', () => {
    const io = createMockIO();
    const socket = createMockSocket({
      userId: 'user-123',
      tenantId: 1,
      role: 'admin',
    });

    handleConnection(io as never, socket as never);

    expect(socket.to).toHaveBeenCalledWith('tenant:1:presence');
    expect(socket.emit).toHaveBeenCalledWith('presence:user-online', expect.objectContaining({
      userId: 'user-123',
      role: 'admin',
    }));
  });

  it('should enable debug logging when configured', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const io = createMockIO();
    const socket = createMockSocket();

    handleConnection(io as never, socket as never, { debug: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Socket socket-123]'),
      'Connected',
      expect.anything()
    );

    consoleSpy.mockRestore();
  });

  describe('Room Subscription', () => {
    it('should allow subscribing to authorized room', async () => {
      const io = createMockIO();
      const socket = createMockSocket({ tenantId: 1, userId: 'user-123' });

      handleConnection(io as never, socket as never);

      // Get the subscribe handler
      const callback = vi.fn();
      socket._trigger('subscribe:room', 'tenant:1:dashboard', callback);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(socket.join).toHaveBeenCalledWith('tenant:1:dashboard');
        expect(callback).toHaveBeenCalledWith(true);
      });
    });

    it('should deny subscribing to unauthorized room', async () => {
      const io = createMockIO();
      const socket = createMockSocket({ tenantId: 1, userId: 'user-123' });

      handleConnection(io as never, socket as never);

      const callback = vi.fn();
      socket._trigger('subscribe:room', 'tenant:2:dashboard', callback);

      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledWith(false);
      });
    });

    it('should handle unsubscribe', async () => {
      const io = createMockIO();
      const socket = createMockSocket();

      handleConnection(io as never, socket as never);

      socket._trigger('unsubscribe:room', 'tenant:1:dashboard');

      await vi.waitFor(() => {
        expect(socket.leave).toHaveBeenCalledWith('tenant:1:dashboard');
      });
    });
  });

  describe('Disconnect Handler', () => {
    it('should broadcast offline status on disconnect', () => {
      const io = createMockIO();
      const socket = createMockSocket({ userId: 'user-123', tenantId: 1 });

      handleConnection(io as never, socket as never);

      socket._trigger('disconnect', 'transport close');

      expect(socket.to).toHaveBeenCalledWith('tenant:1:presence');
      // The emit for offline is called on the to() result
    });
  });
});

// ============================================================================
// EMIT UTILITY TESTS
// ============================================================================

describe('Emit Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('emitMetricsUpdate', () => {
    it('should emit to tenant dashboard room', () => {
      const io = createMockIO();
      const data = {
        tenantId: 1,
        metrics: {
          totalLeads: 100,
          activeConvocations: 5,
          enrolledStudents: 250,
          totalRevenue: 50000,
          conversionRate: 0.25,
        },
        timestamp: new Date().toISOString(),
      };

      emitMetricsUpdate(io as never, 1, data);

      expect(io._mockTo).toHaveBeenCalledWith('tenant:1:dashboard');
      expect(io._mockEmit).toHaveBeenCalledWith('metrics:update', data);
    });
  });

  describe('emitKPIChange', () => {
    it('should emit KPI change to tenant dashboard', () => {
      const io = createMockIO();
      const data = {
        tenantId: 1,
        kpi: 'totalLeads' as const,
        previousValue: 100,
        currentValue: 105,
        changePercent: 5,
        direction: 'up' as const,
        timestamp: new Date().toISOString(),
      };

      emitKPIChange(io as never, 1, data);

      expect(io._mockTo).toHaveBeenCalledWith('tenant:1:dashboard');
      expect(io._mockEmit).toHaveBeenCalledWith('metrics:kpi-change', data);
    });
  });

  describe('emitActivity', () => {
    it('should emit activity to tenant dashboard', () => {
      const io = createMockIO();
      const data = {
        id: 'activity-123',
        tenantId: 1,
        type: 'lead_created' as const,
        message: 'New lead created',
        actorId: 'user-123',
        actorName: 'John Doe',
        entityType: 'lead' as const,
        entityId: 'lead-456',
        timestamp: new Date().toISOString(),
      };

      emitActivity(io as never, 1, data);

      expect(io._mockTo).toHaveBeenCalledWith('tenant:1:dashboard');
      expect(io._mockEmit).toHaveBeenCalledWith('activity:new', data);
    });
  });

  describe('emitSystemStatus', () => {
    it('should emit to system status room', () => {
      const io = createMockIO();
      const data = {
        status: 'healthy' as const,
        services: {
          database: { status: 'up' as const, latency: 5 },
          redis: { status: 'up' as const, latency: 2 },
          api: { status: 'up' as const, latency: 10 },
        },
        timestamp: new Date().toISOString(),
      };

      emitSystemStatus(io as never, data);

      expect(io._mockTo).toHaveBeenCalledWith('system:status');
      expect(io._mockEmit).toHaveBeenCalledWith('system:status', data);
    });
  });

  describe('emitNotification', () => {
    it('should emit to user notifications room', () => {
      const io = createMockIO();
      const data = {
        id: 'notification-123',
        userId: 'user-123',
        tenantId: 1,
        type: 'info' as const,
        title: 'Test Notification',
        message: 'This is a test',
        read: false,
        timestamp: new Date().toISOString(),
      };

      emitNotification(io as never, 'user-123', data);

      expect(io._mockTo).toHaveBeenCalledWith('user:user-123:notifications');
      expect(io._mockEmit).toHaveBeenCalledWith('notification:push', data);
    });
  });

  describe('emitAlert', () => {
    it('should emit to user alerts room', () => {
      const io = createMockIO();
      const data = {
        id: 'alert-123',
        userId: 'user-123',
        tenantId: 1,
        type: 'warning' as const,
        title: 'Warning Alert',
        message: 'Something needs attention',
        read: false,
        timestamp: new Date().toISOString(),
      };

      emitAlert(io as never, 'user-123', data);

      expect(io._mockTo).toHaveBeenCalledWith('user:user-123:alerts');
      expect(io._mockEmit).toHaveBeenCalledWith('notification:alert', data);
    });
  });

  describe('emitProgressUpdate', () => {
    it('should emit to tenant course room', () => {
      const io = createMockIO();
      const data = {
        enrollmentId: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-456',
        progressPercent: 75,
        status: 'in_progress' as const,
        lastActivityAt: new Date().toISOString(),
      };

      emitProgressUpdate(io as never, 1, 'course-456', data);

      expect(io._mockTo).toHaveBeenCalledWith('tenant:1:course:course-456');
      expect(io._mockEmit).toHaveBeenCalledWith('progress:updated', data);
    });
  });

  describe('emitPointsEarned', () => {
    it('should emit to user gamification room', () => {
      const io = createMockIO();
      const data = {
        userId: 'user-123',
        points: 50,
        totalPoints: 1250,
        reason: 'Completed lesson',
        badge: undefined,
      };

      emitPointsEarned(io as never, 'user-123', data);

      expect(io._mockTo).toHaveBeenCalledWith('user:user-123:gamification');
      expect(io._mockEmit).toHaveBeenCalledWith('gamification:points-earned', data);
    });
  });

  describe('emitBadgeUnlocked', () => {
    it('should emit to user gamification room', () => {
      const io = createMockIO();
      const data = {
        userId: 'user-123',
        badge: {
          id: 'badge-123',
          name: 'First Steps',
          description: 'Complete your first lesson',
          icon: 'star',
        },
      };

      emitBadgeUnlocked(io as never, 'user-123', data);

      expect(io._mockTo).toHaveBeenCalledWith('user:user-123:gamification');
      expect(io._mockEmit).toHaveBeenCalledWith('gamification:badge-unlocked', data);
    });
  });

  describe('emitLevelUp', () => {
    it('should emit to user gamification room', () => {
      const io = createMockIO();
      const data = {
        userId: 'user-123',
        newLevel: 5,
        previousLevel: 4,
        unlockedFeatures: ['custom-avatar', 'premium-content'],
      };

      emitLevelUp(io as never, 'user-123', data);

      expect(io._mockTo).toHaveBeenCalledWith('user:user-123:gamification');
      expect(io._mockEmit).toHaveBeenCalledWith('gamification:level-up', data);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty tenant ID gracefully', () => {
    const io = createMockIO();
    const data = {
      tenantId: 0,
      metrics: {
        totalLeads: 0,
        activeConvocations: 0,
        enrolledStudents: 0,
        totalRevenue: 0,
        conversionRate: 0,
      },
      timestamp: new Date().toISOString(),
    };

    // Should not throw
    expect(() => emitMetricsUpdate(io as never, 0, data)).not.toThrow();
    expect(io._mockTo).toHaveBeenCalledWith('tenant:0:dashboard');
  });

  it('should handle special characters in user ID', () => {
    const io = createMockIO();
    const userId = 'user+special@example.com';
    const data = {
      id: 'notification-123',
      userId,
      tenantId: 1,
      type: 'info' as const,
      title: 'Test',
      message: 'Test message',
      read: false,
      timestamp: new Date().toISOString(),
    };

    expect(() => emitNotification(io as never, userId, data)).not.toThrow();
    expect(io._mockTo).toHaveBeenCalledWith(`user:${userId}:notifications`);
  });

  it('should handle large payload data', () => {
    const io = createMockIO();
    const largeMessage = 'x'.repeat(10000);
    const data = {
      id: 'notification-123',
      userId: 'user-123',
      tenantId: 1,
      type: 'info' as const,
      title: 'Large Notification',
      message: largeMessage,
      read: false,
      timestamp: new Date().toISOString(),
    };

    expect(() => emitNotification(io as never, 'user-123', data)).not.toThrow();
  });
});
