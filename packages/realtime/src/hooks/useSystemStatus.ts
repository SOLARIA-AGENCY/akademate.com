'use client';

/**
 * useSystemStatus Hook
 *
 * Subscribe to real-time system status updates.
 * Replaces 30-second polling with WebSocket subscription.
 */

import { useEffect, useState, useCallback } from 'react';
import type { TypedSocket } from './useSocket';
import type {
  SystemStatusPayload,
  IncidentPayload,
  ServiceStatus,
} from '../types/payloads';
import { getSystemRoom } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceInfo {
  name: string;
  status: ServiceStatus;
  latency?: number;
  uptime?: number;
  lastChecked: string;
  details?: string;
}

export interface UseSystemStatusOptions {
  /** Socket instance from useSocket */
  socket: TypedSocket | null;

  /** Initial services (from SSR or initial fetch) */
  initialServices?: ServiceInfo[];

  /** Callback when service status changes */
  onStatusChange?: (service: ServiceInfo) => void;

  /** Callback when new incident occurs */
  onIncident?: (incident: IncidentPayload) => void;
}

export interface UseSystemStatusReturn {
  /** All services status */
  services: ServiceInfo[];

  /** Overall system status */
  overallStatus: ServiceStatus;

  /** Active incidents */
  incidents: IncidentPayload[];

  /** Whether subscribed to status room */
  isSubscribed: boolean;

  /** Last update timestamp */
  lastUpdate: Date | null;

  /** Average response time across services */
  avgResponseTime: number;

  /** Average uptime across services */
  avgUptime: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSystemStatus(
  options: UseSystemStatusOptions
): UseSystemStatusReturn {
  const {
    socket,
    initialServices = [],
    onStatusChange,
    onIncident,
  } = options;

  const [services, setServices] = useState<ServiceInfo[]>(initialServices);
  const [incidents, setIncidents] = useState<IncidentPayload[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ──────────────────────────────────────────────────────────────────────────

  const overallStatus: ServiceStatus = services.every(
    (s) => s.status === 'operational'
  )
    ? 'operational'
    : services.some((s) => s.status === 'down')
      ? 'down'
      : services.some((s) => s.status === 'degraded')
        ? 'degraded'
        : 'operational';

  const avgResponseTime =
    services.length > 0
      ? Math.round(
          services.reduce((sum, s) => sum + (s.latency || 0), 0) /
            services.filter((s) => s.latency).length || 1
        )
      : 0;

  const avgUptime =
    services.length > 0
      ? services.reduce((sum, s) => sum + (s.uptime || 0), 0) / services.length
      : 100;

  // ──────────────────────────────────────────────────────────────────────────
  // Handle Status Update
  // ──────────────────────────────────────────────────────────────────────────

  const handleStatusUpdate = useCallback(
    (data: SystemStatusPayload) => {
      setServices(data.services);
      setLastUpdate(new Date(data.timestamp));

      // Find changed services and notify
      data.services.forEach((service) => {
        const prev = services.find((s) => s.name === service.name);
        if (prev && prev.status !== service.status) {
          onStatusChange?.(service);
        }
      });
    },
    [services, onStatusChange]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Handle Incident
  // ──────────────────────────────────────────────────────────────────────────

  const handleIncident = useCallback(
    (data: IncidentPayload) => {
      setIncidents((prev) => {
        // Update existing or add new
        const existing = prev.findIndex((i) => i.id === data.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [data, ...prev];
      });

      onIncident?.(data);
    },
    [onIncident]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe to Room & Events
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket?.connected) {
      setIsSubscribed(false);
      return;
    }

    const statusRoom = getSystemRoom('status');
    const incidentsRoom = getSystemRoom('incidents');

    // Subscribe to system rooms
    socket.emit('subscribe:room', statusRoom, (success: boolean) => {
      if (success) {
        socket.emit('subscribe:room', incidentsRoom);
        setIsSubscribed(true);
      }
    });

    // Listen for events
    socket.on('system:status', handleStatusUpdate);
    socket.on('system:incident', handleIncident);

    return () => {
      socket.emit('unsubscribe:room', statusRoom);
      socket.emit('unsubscribe:room', incidentsRoom);
      socket.off('system:status', handleStatusUpdate);
      socket.off('system:incident', handleIncident);
      setIsSubscribed(false);
    };
  }, [socket, handleStatusUpdate, handleIncident]);

  return {
    services,
    overallStatus,
    incidents,
    isSubscribed,
    lastUpdate,
    avgResponseTime,
    avgUptime,
  };
}
