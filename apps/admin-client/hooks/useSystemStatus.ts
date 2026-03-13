'use client';

/**
 * useSystemStatus Hook
 *
 * Real-time system status monitoring for admin dashboard.
 * Replaces polling with WebSocket subscription.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocketContextOptional } from '@akademate/realtime/context';
import type { SystemStatusPayload } from '@akademate/realtime';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  latency: number | null;
  uptime: number;
  lastCheck: string;
  details: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

export interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  description: string;
  affectedServices: string[];
}

export interface SystemStatusData {
  services: ServiceStatus[];
  metrics: SystemMetric[];
  incidents: Incident[];
  overallStatus: 'operational' | 'degraded' | 'outage';
  avgResponseTime: number | null;
  avgUptime: number | null;
  dataSource: 'placeholder' | 'real';
}

// ============================================================================
// MOCK DATA (fallback when no real-time connection)
// ============================================================================

const MOCK_SERVICES: ServiceStatus[] = [
  {
    name: 'API Principal',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'Base de Datos PostgreSQL',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'Redis Cache',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'Cola de Trabajos (BullMQ)',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'Almacenamiento (S3)',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'Email (SMTP)',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'WhatsApp Cloud API',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
  {
    name: 'CDN (Cloudflare)',
    status: 'unknown' as unknown as ServiceStatus['status'],
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'Sin datos de monitorización',
  },
];

const MOCK_METRICS: (SystemMetric & { monitoring: boolean })[] = [
  { name: 'CPU', value: 0, max: 100, unit: '%', status: 'healthy', monitoring: false },
  { name: 'Memoria', value: 0, max: 100, unit: '%', status: 'healthy', monitoring: false },
  { name: 'Disco', value: 0, max: 100, unit: '%', status: 'healthy', monitoring: false },
  { name: 'Conexiones DB', value: 0, max: 100, unit: '', status: 'healthy', monitoring: false },
  { name: 'Requests/min', value: 0, max: 5000, unit: '', status: 'healthy', monitoring: false },
  { name: 'Errores/hora', value: 0, max: 50, unit: '', status: 'healthy', monitoring: false },
];

const MOCK_INCIDENTS: Incident[] = [];

// ============================================================================
// HOOK
// ============================================================================

export interface UseSystemStatusOptions {
  enableRealtime?: boolean;
  autoRefreshInterval?: number; // Fallback polling interval in ms
}

export interface UseSystemStatusReturn {
  data: SystemStatusData;
  loading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
}


export function useSystemStatus(
  options: UseSystemStatusOptions = {}
): UseSystemStatusReturn {
  const { enableRealtime = true, autoRefreshInterval = 30000 } = options;

  // Get socket context (optional - returns null if not in provider)
  const socketContext = useSocketContextOptional();
  const socket = socketContext?.socket ?? null;
  const isConnected = socketContext?.isConnected ?? false;

  const [loading, _setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(() => new Date());
  const [data, setData] = useState<SystemStatusData>({
    services: MOCK_SERVICES,
    metrics: MOCK_METRICS,
    incidents: MOCK_INCIDENTS,
    overallStatus: 'operational',
    avgResponseTime: null,
    avgUptime: null,
    dataSource: 'placeholder',
  });

  // Manual refresh function
  const refresh = useCallback(() => {
    // In real implementation, this would fetch from API
    // For now, just update timestamp
    setLastUpdate(new Date());
  }, []);


  // Subscribe to real-time system status updates
  useEffect(() => {
    if (!socket || !enableRealtime) return;

    const room = 'system:status';

    // Subscribe to system status room
    socket.emit('subscribe:room', room, (success: boolean) => {
      if (success) {
        console.log('[useSystemStatus] Subscribed to real-time updates');
      }
    });

    // Map payload status to our local format
    const mapStatus = (status: 'operational' | 'degraded' | 'down' | 'maintenance'): ServiceStatus['status'] => {
      if (status === 'down') return 'outage';
      return status;
    };

    // Handle system status updates
    const handleSystemStatus = (payload: SystemStatusPayload) => {
      // Map payload to our local format
      const mappedServices: ServiceStatus[] = payload.services.map((s) => ({
        name: s.name,
        status: mapStatus(s.status),
        latency: s.latency ?? null,
        uptime: s.uptime ?? 99.9,
        lastCheck: s.lastChecked,
        details: s.details ?? '',
      }));

      // Calculate averages from services
      const avgLatency = mappedServices.reduce((sum, s) => sum + (s.latency ?? 0), 0) / mappedServices.length;
      const avgUptime = mappedServices.reduce((sum, s) => sum + s.uptime, 0) / mappedServices.length;

      setData((prev) => ({
        ...prev,
        services: mappedServices.length > 0 ? mappedServices : prev.services,
        overallStatus: mapStatus(payload.overallStatus) as 'operational' | 'degraded' | 'outage',
        avgResponseTime: avgLatency,
        avgUptime: avgUptime,
        dataSource: 'real',
      }));

      setLastUpdate(new Date());
    };

    socket.on('system:status', handleSystemStatus);

    return () => {
      socket.emit('unsubscribe:room', room);
      socket.off('system:status', handleSystemStatus);
    };
  }, [socket, enableRealtime]);

  // Fallback polling when not connected to WebSocket
  useEffect(() => {
    if (isConnected && enableRealtime) {
      // WebSocket is handling updates, no need for polling
      return;
    }

    // Fallback: poll for updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [isConnected, enableRealtime, autoRefreshInterval]);

  return {
    data,
    loading,
    isConnected,
    lastUpdate,
    refresh,
  };
}
