/**
 * @module @akademate/realtime/__tests__/types/rooms
 * Tests for room utilities and permissions
 */

import { describe, it, expect } from 'vitest';
import {
  getTenantRoom,
  getUserRoom,
  getSystemRoom,
  parseRoom,
  canJoinRoom,
  getAutoJoinRooms,
  getDashboardRooms,
  getLMSRooms,
} from '../../src/types/rooms';

describe('Room Helpers', () => {
  describe('getTenantRoom', () => {
    it('should build tenant-scoped room name', () => {
      expect(getTenantRoom(1, 'dashboard')).toBe('tenant:1:dashboard');
      expect(getTenantRoom(42, 'courses')).toBe('tenant:42:courses');
      expect(getTenantRoom(100, 'gamification')).toBe('tenant:100:gamification');
    });

    it('should handle all room types', () => {
      const types = ['dashboard', 'courses', 'staff', 'convocations', 'lms', 'gamification', 'notifications', 'system'] as const;
      types.forEach((type) => {
        const room = getTenantRoom(1, type);
        expect(room).toBe(`tenant:1:${type}`);
      });
    });
  });

  describe('getUserRoom', () => {
    it('should build user-specific room name', () => {
      expect(getUserRoom('user-123', 'notifications')).toBe('user:user-123:notifications');
      expect(getUserRoom('abc-def', 'alerts')).toBe('user:abc-def:alerts');
    });

    it('should handle UUID-style user IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(getUserRoom(uuid, 'notifications')).toBe(`user:${uuid}:notifications`);
    });
  });

  describe('getSystemRoom', () => {
    it('should build system-wide room name', () => {
      expect(getSystemRoom('status')).toBe('system:status');
      expect(getSystemRoom('incidents')).toBe('system:incidents');
    });
  });
});

describe('parseRoom', () => {
  describe('tenant rooms', () => {
    it('should parse tenant rooms correctly', () => {
      const result = parseRoom('tenant:1:dashboard');
      expect(result).toEqual({
        scope: 'tenant',
        id: 1,
        type: 'dashboard',
      });
    });

    it('should parse tenant rooms with complex types', () => {
      const result = parseRoom('tenant:42:course:123');
      expect(result).toEqual({
        scope: 'tenant',
        id: 42,
        type: 'course:123',
      });
    });

    it('should handle large tenant IDs', () => {
      const result = parseRoom('tenant:999999:lms');
      expect(result).toEqual({
        scope: 'tenant',
        id: 999999,
        type: 'lms',
      });
    });
  });

  describe('user rooms', () => {
    it('should parse user rooms correctly', () => {
      const result = parseRoom('user:user-123:notifications');
      expect(result).toEqual({
        scope: 'user',
        id: 'user-123',
        type: 'notifications',
      });
    });

    it('should parse user rooms with UUID IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = parseRoom(`user:${uuid}:alerts`);
      expect(result).toEqual({
        scope: 'user',
        id: uuid,
        type: 'alerts',
      });
    });
  });

  describe('system rooms', () => {
    it('should parse system rooms correctly', () => {
      const result = parseRoom('system:status');
      expect(result).toEqual({
        scope: 'system',
        type: 'status',
      });
    });

    it('should parse system rooms with complex types', () => {
      const result = parseRoom('system:status:health');
      expect(result).toEqual({
        scope: 'system',
        type: 'status:health',
      });
    });
  });

  describe('invalid rooms', () => {
    it('should return null for empty string', () => {
      expect(parseRoom('')).toBeNull();
    });

    it('should return null for single part', () => {
      expect(parseRoom('tenant')).toBeNull();
    });

    it('should return null for unknown scope', () => {
      expect(parseRoom('unknown:1:room')).toBeNull();
    });

    it('should return null for malformed tenant room', () => {
      expect(parseRoom('tenant:')).toBeNull();
    });
  });
});

describe('canJoinRoom', () => {
  const userId = 'user-123';
  const tenantId = 1;

  describe('tenant rooms', () => {
    it('should allow user to join their own tenant room', () => {
      expect(canJoinRoom('tenant:1:dashboard', tenantId, userId, 'user')).toBe(true);
    });

    it('should deny user from joining other tenant rooms', () => {
      expect(canJoinRoom('tenant:2:dashboard', tenantId, userId, 'user')).toBe(false);
    });

    it('should allow any role to join their tenant room', () => {
      expect(canJoinRoom('tenant:1:lms', tenantId, userId, 'student')).toBe(true);
      expect(canJoinRoom('tenant:1:lms', tenantId, userId, 'instructor')).toBe(true);
      expect(canJoinRoom('tenant:1:lms', tenantId, userId, 'admin')).toBe(true);
    });
  });

  describe('user rooms', () => {
    it('should allow user to join their own user room', () => {
      expect(canJoinRoom('user:user-123:notifications', tenantId, userId, 'user')).toBe(true);
    });

    it('should deny user from joining other user rooms', () => {
      expect(canJoinRoom('user:other-user:notifications', tenantId, userId, 'user')).toBe(false);
    });

    it('should deny admin from joining other user rooms', () => {
      // Even admins can't join other user's personal rooms
      expect(canJoinRoom('user:other-user:notifications', tenantId, userId, 'admin')).toBe(false);
    });
  });

  describe('system rooms', () => {
    it('should allow admin to join system rooms', () => {
      expect(canJoinRoom('system:status', tenantId, userId, 'admin')).toBe(true);
    });

    it('should allow superadmin to join system rooms', () => {
      expect(canJoinRoom('system:status', tenantId, userId, 'superadmin')).toBe(true);
    });

    it('should deny regular user from joining system rooms', () => {
      expect(canJoinRoom('system:status', tenantId, userId, 'user')).toBe(false);
    });

    it('should deny student from joining system rooms', () => {
      expect(canJoinRoom('system:incidents', tenantId, userId, 'student')).toBe(false);
    });
  });

  describe('role arrays', () => {
    it('should accept array of roles', () => {
      expect(canJoinRoom('system:status', tenantId, userId, ['user', 'admin'])).toBe(true);
    });

    it('should deny if no matching role in array', () => {
      expect(canJoinRoom('system:status', tenantId, userId, ['user', 'student'])).toBe(false);
    });
  });

  describe('invalid rooms', () => {
    it('should deny access to unparseable rooms', () => {
      expect(canJoinRoom('invalid', tenantId, userId, 'admin')).toBe(false);
    });
  });
});

describe('Predefined Room Sets', () => {
  describe('getAutoJoinRooms', () => {
    const tenantId = 1;
    const userId = 'user-123';

    it('should return basic rooms for regular user', () => {
      const rooms = getAutoJoinRooms(tenantId, userId, 'user');

      expect(rooms).toContain('tenant:1:dashboard');
      expect(rooms).toContain('tenant:1:notifications');
      expect(rooms).toContain('user:user-123:notifications');
      expect(rooms).toContain('user:user-123:alerts');
    });

    it('should not include system rooms for regular user', () => {
      const rooms = getAutoJoinRooms(tenantId, userId, 'user');

      expect(rooms).not.toContain('system:status');
      expect(rooms).not.toContain('system:incidents');
    });

    it('should include system rooms for admin', () => {
      const rooms = getAutoJoinRooms(tenantId, userId, 'admin');

      expect(rooms).toContain('system:status');
      expect(rooms).toContain('system:incidents');
    });

    it('should include system rooms for superadmin', () => {
      const rooms = getAutoJoinRooms(tenantId, userId, 'superadmin');

      expect(rooms).toContain('system:status');
      expect(rooms).toContain('system:incidents');
    });

    it('should handle role arrays', () => {
      const rooms = getAutoJoinRooms(tenantId, userId, ['user', 'admin']);

      expect(rooms).toContain('system:status');
      expect(rooms).toContain('system:incidents');
    });
  });

  describe('getDashboardRooms', () => {
    it('should return all dashboard-related rooms', () => {
      const rooms = getDashboardRooms(1);

      expect(rooms).toContain('tenant:1:dashboard');
      expect(rooms).toContain('tenant:1:courses');
      expect(rooms).toContain('tenant:1:staff');
      expect(rooms).toContain('tenant:1:convocations');
      expect(rooms).toHaveLength(4);
    });

    it('should use correct tenant ID', () => {
      const rooms = getDashboardRooms(42);

      rooms.forEach((room) => {
        expect(room).toMatch(/^tenant:42:/);
      });
    });
  });

  describe('getLMSRooms', () => {
    it('should return LMS-related rooms', () => {
      const rooms = getLMSRooms(1);

      expect(rooms).toContain('tenant:1:lms');
      expect(rooms).toContain('tenant:1:gamification');
      expect(rooms).toHaveLength(2);
    });

    it('should use correct tenant ID', () => {
      const rooms = getLMSRooms(99);

      expect(rooms).toContain('tenant:99:lms');
      expect(rooms).toContain('tenant:99:gamification');
    });
  });
});
