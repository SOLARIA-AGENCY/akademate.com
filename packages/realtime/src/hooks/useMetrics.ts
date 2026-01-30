'use client';

/**
 * useMetrics Hook
 *
 * Subscribe to real-time dashboard metrics updates.
 * Replaces polling/fetch with WebSocket subscription.
 */

import { useEffect, useState, useCallback } from 'react';
import type { TypedSocket } from './useSocket';
import type { MetricsPayload, KPIChangePayload } from '../types/payloads';
import { getTenantRoom } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardMetrics {
  courses: number;
  students: number;
  leads: number;
  teachers: number;
  campuses: number;
  convocations: number;
}

export interface MetricsTrends {
  courses: number;
  students: number;
  leads: number;
}

export interface UseMetricsOptions {
  /** Socket instance from useSocket */
  socket: TypedSocket | null;

  /** Tenant ID for room subscription */
  tenantId: number;

  /** Initial metrics (from SSR or initial fetch) */
  initialMetrics?: DashboardMetrics;

  /** Callback when any KPI changes */
  onKPIChange?: (data: KPIChangePayload) => void;

  /** Callback on full metrics update */
  onMetricsUpdate?: (data: MetricsPayload) => void;
}

export interface UseMetricsReturn {
  /** Current metrics */
  metrics: DashboardMetrics;

  /** Metric trends (deltas) */
  trends: MetricsTrends;

  /** Whether subscribed to metrics room */
  isSubscribed: boolean;

  /** Last update timestamp */
  lastUpdate: Date | null;

  /** Manually refresh metrics */
  refresh: () => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_METRICS: DashboardMetrics = {
  courses: 0,
  students: 0,
  leads: 0,
  teachers: 0,
  campuses: 0,
  convocations: 0,
};

const DEFAULT_TRENDS: MetricsTrends = {
  courses: 0,
  students: 0,
  leads: 0,
};

// ============================================================================
// HOOK
// ============================================================================

export function useMetrics(options: UseMetricsOptions): UseMetricsReturn {
  const {
    socket,
    tenantId,
    initialMetrics = DEFAULT_METRICS,
    onKPIChange,
    onMetricsUpdate,
  } = options;

  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [trends, setTrends] = useState<MetricsTrends>(DEFAULT_TRENDS);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // Handle Full Metrics Update
  // ──────────────────────────────────────────────────────────────────────────

  const handleMetricsUpdate = useCallback(
    (data: MetricsPayload) => {
      if (data.tenantId !== tenantId) return;

      setMetrics(data.metrics);
      if (data.trends) {
        setTrends(data.trends);
      }
      setLastUpdate(new Date(data.timestamp));
      onMetricsUpdate?.(data);
    },
    [tenantId, onMetricsUpdate]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Handle Single KPI Change
  // ──────────────────────────────────────────────────────────────────────────

  const handleKPIChange = useCallback(
    (data: KPIChangePayload) => {
      if (data.tenantId !== tenantId) return;

      setMetrics((prev) => ({
        ...prev,
        [data.key]: data.value,
      }));

      // Update trends if it's a trend-tracked KPI
      if (data.key in DEFAULT_TRENDS) {
        setTrends((prev) => ({
          ...prev,
          [data.key]: data.delta,
        }));
      }

      setLastUpdate(new Date(data.timestamp));
      onKPIChange?.(data);
    },
    [tenantId, onKPIChange]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Refresh (Manual)
  // ──────────────────────────────────────────────────────────────────────────

  const refresh = useCallback(() => {
    // Could emit a request for fresh data if needed
    // For now, the server pushes updates automatically
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

    // Subscribe to dashboard room
    socket.emit('subscribe:room', room, (success: boolean) => {
      setIsSubscribed(success);
    });

    // Listen for events
    socket.on('metrics:update', handleMetricsUpdate);
    socket.on('metrics:kpi-change', handleKPIChange);

    return () => {
      socket.emit('unsubscribe:room', room);
      socket.off('metrics:update', handleMetricsUpdate);
      socket.off('metrics:kpi-change', handleKPIChange);
      setIsSubscribed(false);
    };
  }, [socket, tenantId, handleMetricsUpdate, handleKPIChange]);

  return {
    metrics,
    trends,
    isSubscribed,
    lastUpdate,
    refresh,
  };
}
