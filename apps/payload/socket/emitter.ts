/**
 * Socket.io Event Emitter
 *
 * Utilities for Payload hooks to emit real-time events.
 * Events are sent to connected clients via the Socket.io server.
 */

import {
  emitMetricsUpdate,
  emitKPIChange,
  emitActivity,
  emitNotification,
  emitProgressUpdate,
  emitPointsEarned,
  emitBadgeUnlocked,
  type TypedServer,
} from '@akademate/realtime/server';
import type {
  MetricsPayload,
  ActivityPayload,
  NotificationPayload,
  ProgressPayload,
  GamificationPayload,
} from '@akademate/realtime';
import { getSocketServer } from './server';

// ============================================================================
// TYPES
// ============================================================================

export interface EmitOptions {
  /** Fallback if Socket.io not available (e.g., queue for later) */
  fallback?: 'queue' | 'log' | 'ignore';
}

// ============================================================================
// SAFE EMIT WRAPPER
// ============================================================================

function getIO(): TypedServer | null {
  const io = getSocketServer();
  if (!io) {
    console.warn('[SocketEmitter] Socket.io server not available');
  }
  return io;
}

// ============================================================================
// METRICS EMITTERS
// ============================================================================

/**
 * Emit full metrics update to tenant dashboard
 */
export function emitDashboardMetrics(
  tenantId: number,
  metrics: MetricsPayload['metrics'],
  trends?: MetricsPayload['trends']
): void {
  const io = getIO();
  if (!io) return;

  emitMetricsUpdate(io, tenantId, {
    tenantId,
    metrics,
    trends,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit single KPI change to tenant dashboard
 */
export function emitDashboardKPI(
  tenantId: number,
  key: string,
  value: number,
  previousValue: number
): void {
  const io = getIO();
  if (!io) return;

  emitKPIChange(io, tenantId, {
    tenantId,
    key,
    value,
    previousValue,
    delta: value - previousValue,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// ACTIVITY EMITTERS
// ============================================================================

/**
 * Emit new activity to tenant activity feed
 */
export function emitNewActivity(
  tenantId: number,
  activity: Omit<ActivityPayload, 'tenantId' | 'timestamp'>
): void {
  const io = getIO();
  if (!io) return;

  emitActivity(io, tenantId, {
    tenantId,
    ...activity,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// NOTIFICATION EMITTERS
// ============================================================================

/**
 * Emit push notification to specific user
 */
export function emitUserNotification(
  userId: string,
  notification: Omit<NotificationPayload, 'userId' | 'timestamp' | 'read'>
): void {
  const io = getIO();
  if (!io) return;

  emitNotification(io, userId, {
    userId,
    ...notification,
    read: false,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// LMS EMITTERS
// ============================================================================

/**
 * Emit progress update for a course
 */
export function emitCourseProgress(
  tenantId: number,
  courseId: string,
  progress: Omit<ProgressPayload, 'timestamp'>
): void {
  const io = getIO();
  if (!io) return;

  emitProgressUpdate(io, tenantId, courseId, {
    ...progress,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// GAMIFICATION EMITTERS
// ============================================================================

/**
 * Emit points earned event
 */
export function emitPoints(
  userId: string,
  data: Omit<GamificationPayload, 'timestamp'>
): void {
  const io = getIO();
  if (!io) return;

  emitPointsEarned(io, userId, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit badge unlocked event
 */
export function emitBadge(
  userId: string,
  data: Omit<GamificationPayload, 'timestamp'>
): void {
  const io = getIO();
  if (!io) return;

  emitBadgeUnlocked(io, userId, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// CONVENIENCE: CRUD ACTIVITY GENERATORS
// ============================================================================

/**
 * Emit activity for resource creation
 */
export function emitCreateActivity(
  tenantId: number,
  resource: string,
  resourceId: string,
  title: string,
  userId: string,
  userName: string
): void {
  emitNewActivity(tenantId, {
    id: `${resource}-${resourceId}-create-${Date.now()}`,
    type: 'lead_created',
    resource,
    resourceId,
    title: `Nuevo ${resource}: ${title}`,
    description: `${userName} creó ${title}`,
    userId,
    userName,
    metadata: {},
  });
}

/**
 * Emit activity for resource update
 */
export function emitUpdateActivity(
  tenantId: number,
  resource: string,
  resourceId: string,
  title: string,
  userId: string,
  userName: string,
  changes?: Record<string, unknown>
): void {
  emitNewActivity(tenantId, {
    id: `${resource}-${resourceId}-update-${Date.now()}`,
    type: 'lead_updated',
    resource,
    resourceId,
    title: `Actualizado: ${title}`,
    description: `${userName} actualizó ${title}`,
    userId,
    userName,
    metadata: { changes },
  });
}

/**
 * Emit activity for resource deletion
 */
export function emitDeleteActivity(
  tenantId: number,
  resource: string,
  resourceId: string,
  title: string,
  userId: string,
  userName: string
): void {
  emitNewActivity(tenantId, {
    id: `${resource}-${resourceId}-delete-${Date.now()}`,
    type: 'lead_deleted',
    resource,
    resourceId,
    title: `Eliminado: ${title}`,
    description: `${userName} eliminó ${title}`,
    userId,
    userName,
    metadata: {},
  });
}
