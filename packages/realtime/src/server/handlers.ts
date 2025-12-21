/**
 * Socket.io Event Handlers
 *
 * Server-side handlers for client events and room management.
 */

import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types/events';
import { canJoinRoom, parseRoom } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServerSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export interface HandlerContext {
  io: TypedServer;
  socket: TypedServerSocket;
  debug?: boolean;
}

// ============================================================================
// CONNECTION HANDLER
// ============================================================================

/**
 * Handle new socket connections
 */
export function handleConnection(
  io: TypedServer,
  socket: TypedServerSocket,
  options: { debug?: boolean } = {}
) {
  const { debug = false } = options;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log(`[Socket ${socket.id}]`, ...args);
    }
  };

  log('Connected', {
    userId: socket.data.userId,
    tenantId: socket.data.tenantId,
    role: socket.data.role,
  });

  // Register event handlers
  handleRoomSubscription({ io, socket, debug });
  handleNotificationEvents({ io, socket, debug });
  handlePresenceEvents({ io, socket, debug });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    log('Disconnected:', reason);
  });
}

// ============================================================================
// ROOM SUBSCRIPTION HANDLER
// ============================================================================

function handleRoomSubscription(ctx: HandlerContext) {
  const { socket, debug } = ctx;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log(`[Socket ${socket.id}]`, ...args);
    }
  };

  socket.on('subscribe:room', async (room, callback) => {
    const canJoin = canJoinRoom(
      room,
      socket.data.tenantId,
      socket.data.userId,
      socket.data.role
    );

    if (!canJoin) {
      log('Room join denied:', room);
      callback?.(false);
      return;
    }

    await socket.join(room);
    log('Joined room:', room);
    callback?.(true);
  });

  socket.on('unsubscribe:room', async (room) => {
    await socket.leave(room);
    log('Left room:', room);
  });
}

// ============================================================================
// NOTIFICATION EVENTS HANDLER
// ============================================================================

function handleNotificationEvents(ctx: HandlerContext) {
  const { socket, debug } = ctx;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log(`[Socket ${socket.id}]`, ...args);
    }
  };

  socket.on('notification:read', (notificationId) => {
    log('Notification read:', notificationId);
    // TODO: Persist to database
    // This would be integrated with Payload CMS hooks
  });

  socket.on('notification:read-all', () => {
    log('All notifications marked as read');
    // TODO: Persist to database
  });
}

// ============================================================================
// PRESENCE EVENTS HANDLER
// ============================================================================

function handlePresenceEvents(ctx: HandlerContext) {
  const { io, socket, debug } = ctx;

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log(`[Socket ${socket.id}]`, ...args);
    }
  };

  // Broadcast presence to tenant room on connect
  const tenantRoom = `tenant:${socket.data.tenantId}:presence`;

  socket.join(tenantRoom);

  // Notify others of user presence
  socket.to(tenantRoom).emit('presence:user-online', {
    userId: socket.data.userId,
    role: socket.data.role,
    timestamp: new Date().toISOString(),
  });

  // Handle user going offline
  socket.on('disconnect', () => {
    socket.to(tenantRoom).emit('presence:user-offline', {
      userId: socket.data.userId,
      timestamp: new Date().toISOString(),
    });
  });
}

// ============================================================================
// EMIT UTILITIES
// ============================================================================

/**
 * Emit metrics update to a tenant's dashboard room
 */
export function emitMetricsUpdate(
  io: TypedServer,
  tenantId: number,
  data: ServerToClientEvents['metrics:update'] extends (data: infer D) => void ? D : never
) {
  io.to(`tenant:${tenantId}:dashboard`).emit('metrics:update', data);
}

/**
 * Emit KPI change to a tenant's dashboard room
 */
export function emitKPIChange(
  io: TypedServer,
  tenantId: number,
  data: ServerToClientEvents['metrics:kpi-change'] extends (data: infer D) => void ? D : never
) {
  io.to(`tenant:${tenantId}:dashboard`).emit('metrics:kpi-change', data);
}

/**
 * Emit activity to a tenant's activity feed
 */
export function emitActivity(
  io: TypedServer,
  tenantId: number,
  data: ServerToClientEvents['activity:new'] extends (data: infer D) => void ? D : never
) {
  io.to(`tenant:${tenantId}:dashboard`).emit('activity:new', data);
}

/**
 * Emit system status update to all status subscribers
 */
export function emitSystemStatus(
  io: TypedServer,
  data: ServerToClientEvents['system:status'] extends (data: infer D) => void ? D : never
) {
  io.to('system:status').emit('system:status', data);
}

/**
 * Emit notification to a specific user
 */
export function emitNotification(
  io: TypedServer,
  userId: string,
  data: ServerToClientEvents['notification:push'] extends (data: infer D) => void ? D : never
) {
  io.to(`user:${userId}:notifications`).emit('notification:push', data);
}

/**
 * Emit alert to a specific user
 */
export function emitAlert(
  io: TypedServer,
  userId: string,
  data: ServerToClientEvents['notification:alert'] extends (data: infer D) => void ? D : never
) {
  io.to(`user:${userId}:alerts`).emit('notification:alert', data);
}

/**
 * Emit course progress update
 */
export function emitProgressUpdate(
  io: TypedServer,
  tenantId: number,
  courseId: string,
  data: ServerToClientEvents['progress:updated'] extends (data: infer D) => void ? D : never
) {
  io.to(`tenant:${tenantId}:course:${courseId}`).emit('progress:updated', data);
}

/**
 * Emit gamification points earned event
 */
export function emitPointsEarned(
  io: TypedServer,
  userId: string,
  data: ServerToClientEvents['gamification:points-earned'] extends (data: infer D) => void ? D : never
) {
  io.to(`user:${userId}:gamification`).emit('gamification:points-earned', data);
}

/**
 * Emit gamification badge unlocked event
 */
export function emitBadgeUnlocked(
  io: TypedServer,
  userId: string,
  data: ServerToClientEvents['gamification:badge-unlocked'] extends (data: infer D) => void ? D : never
) {
  io.to(`user:${userId}:gamification`).emit('gamification:badge-unlocked', data);
}

/**
 * Emit gamification level up event
 */
export function emitLevelUp(
  io: TypedServer,
  userId: string,
  data: ServerToClientEvents['gamification:level-up'] extends (data: infer D) => void ? D : never
) {
  io.to(`user:${userId}:gamification`).emit('gamification:level-up', data);
}
