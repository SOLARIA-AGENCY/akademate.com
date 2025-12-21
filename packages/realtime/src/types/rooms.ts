/**
 * Socket.io Room Definitions
 *
 * Rooms provide tenant isolation and feature-based event filtering.
 * All rooms are prefixed with tenant ID for multi-tenancy security.
 */

// ============================================================================
// ROOM TYPES
// ============================================================================

export type RoomType =
  | 'dashboard'
  | 'courses'
  | 'staff'
  | 'convocations'
  | 'lms'
  | 'gamification'
  | 'notifications'
  | 'system';

// ============================================================================
// ROOM HELPERS
// ============================================================================

/**
 * Build a tenant-scoped room name
 * @example getTenantRoom(1, 'dashboard') => 'tenant:1:dashboard'
 */
export function getTenantRoom(tenantId: number, type: RoomType): string {
  return `tenant:${tenantId}:${type}`;
}

/**
 * Build a user-specific room name
 * @example getUserRoom('user123', 'notifications') => 'user:user123:notifications'
 */
export function getUserRoom(userId: string, type: 'notifications' | 'alerts'): string {
  return `user:${userId}:${type}`;
}

/**
 * Build system-wide room name (no tenant isolation)
 * @example getSystemRoom('status') => 'system:status'
 */
export function getSystemRoom(type: 'status' | 'incidents'): string {
  return `system:${type}`;
}

/**
 * Parse a room name to extract its components
 */
export function parseRoom(room: string): {
  scope: 'tenant' | 'user' | 'system';
  id?: string | number;
  type: string;
} | null {
  const parts = room.split(':');

  if (parts.length < 2) return null;

  const [scope, ...rest] = parts;

  if (scope === 'tenant' && rest.length >= 2) {
    const idPart = rest[0];
    if (idPart !== undefined) {
      return {
        scope: 'tenant',
        id: parseInt(idPart, 10),
        type: rest.slice(1).join(':'),
      };
    }
  }

  if (scope === 'user' && rest.length >= 2) {
    const idPart = rest[0];
    if (idPart !== undefined) {
      return {
        scope: 'user',
        id: idPart,
        type: rest.slice(1).join(':'),
      };
    }
  }

  if (scope === 'system' && rest.length >= 1) {
    return {
      scope: 'system',
      type: rest.join(':'),
    };
  }

  return null;
}

// ============================================================================
// ROOM PERMISSIONS
// ============================================================================

/**
 * Check if a user can join a room based on their tenant and roles
 */
export function canJoinRoom(
  room: string,
  userTenantId: number,
  userId: string,
  roleOrRoles: string | string[]
): boolean {
  const parsed = parseRoom(room);

  if (!parsed) return false;

  // Normalize roles to array
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

  switch (parsed.scope) {
    case 'tenant':
      // User can only join rooms for their own tenant
      return parsed.id === userTenantId;

    case 'user':
      // User can only join their own user rooms
      return parsed.id === userId;

    case 'system':
      // System rooms require admin role
      return roles.includes('admin') || roles.includes('superadmin');

    default:
      return false;
  }
}

// ============================================================================
// PREDEFINED ROOM SETS
// ============================================================================

/**
 * Get all rooms a user should auto-join on connection
 */
export function getAutoJoinRooms(tenantId: number, userId: string, roleOrRoles: string | string[]): string[] {
  // Normalize roles to array
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

  const rooms: string[] = [
    // Tenant-scoped rooms
    getTenantRoom(tenantId, 'dashboard'),
    getTenantRoom(tenantId, 'notifications'),

    // User-specific rooms
    getUserRoom(userId, 'notifications'),
    getUserRoom(userId, 'alerts'),
  ];

  // Admin gets system rooms
  if (roles.includes('admin') || roles.includes('superadmin')) {
    rooms.push(getSystemRoom('status'));
    rooms.push(getSystemRoom('incidents'));
  }

  return rooms;
}

/**
 * Get all rooms for dashboard features
 */
export function getDashboardRooms(tenantId: number): string[] {
  return [
    getTenantRoom(tenantId, 'dashboard'),
    getTenantRoom(tenantId, 'courses'),
    getTenantRoom(tenantId, 'staff'),
    getTenantRoom(tenantId, 'convocations'),
  ];
}

/**
 * Get all rooms for LMS features
 */
export function getLMSRooms(tenantId: number): string[] {
  return [
    getTenantRoom(tenantId, 'lms'),
    getTenantRoom(tenantId, 'gamification'),
  ];
}
