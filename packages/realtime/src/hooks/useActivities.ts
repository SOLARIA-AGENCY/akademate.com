'use client';

/**
 * useActivities Hook
 *
 * Subscribe to real-time activity feed updates.
 * Provides live feed of recent activities without polling.
 */

import { useEffect, useState, useCallback } from 'react';
import type { TypedSocket } from './useSocket';
import type { ActivityPayload, ActivityType } from '../types/payloads';
import { getTenantRoom } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export interface UseActivitiesOptions {
  /** Socket instance from useSocket */
  socket: TypedSocket | null;

  /** Tenant ID for room subscription */
  tenantId: number;

  /** Maximum activities to keep in memory */
  maxActivities?: number;

  /** Initial activities (from SSR or initial fetch) */
  initialActivities?: ActivityPayload[];

  /** Filter by activity types */
  filterTypes?: ActivityType[];

  /** Callback when new activity arrives */
  onNewActivity?: (activity: ActivityPayload) => void;
}

export interface UseActivitiesReturn {
  /** Recent activities (newest first) */
  activities: ActivityPayload[];

  /** Whether subscribed to activities room */
  isSubscribed: boolean;

  /** Clear all activities */
  clear: () => void;

  /** Total activities received this session */
  totalReceived: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useActivities(options: UseActivitiesOptions): UseActivitiesReturn {
  const {
    socket,
    tenantId,
    maxActivities = 50,
    initialActivities = [],
    filterTypes,
    onNewActivity,
  } = options;

  const [activities, setActivities] = useState<ActivityPayload[]>(initialActivities);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [totalReceived, setTotalReceived] = useState(0);

  // ──────────────────────────────────────────────────────────────────────────
  // Handle New Activity
  // ──────────────────────────────────────────────────────────────────────────

  const handleNewActivity = useCallback(
    (data: ActivityPayload) => {
      if (data.tenantId !== tenantId) return;

      // Filter by type if specified
      if (filterTypes && !filterTypes.includes(data.type)) {
        return;
      }

      setActivities((prev) => {
        // Add to beginning, limit to maxActivities
        const updated = [data, ...prev].slice(0, maxActivities);
        return updated;
      });

      setTotalReceived((prev) => prev + 1);
      onNewActivity?.(data);
    },
    [tenantId, filterTypes, maxActivities, onNewActivity]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Clear Activities
  // ──────────────────────────────────────────────────────────────────────────

  const clear = useCallback(() => {
    setActivities([]);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe to Room & Events
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket?.connected || !tenantId) {
       
      setIsSubscribed(false);
      return;
    }

    const room = getTenantRoom(tenantId, 'dashboard');

    // Subscribe to dashboard room (activities are part of dashboard)
    socket.emit('subscribe:room', room, (success: boolean) => {
      setIsSubscribed(success);
    });

    // Listen for new activities
    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
      setIsSubscribed(false);
    };
  }, [socket, tenantId, handleNewActivity]);

  return {
    activities,
    isSubscribed,
    clear,
    totalReceived,
  };
}
