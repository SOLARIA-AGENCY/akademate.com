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
  avgResponseTime: number;
  avgUptime: number;
}

// ============================================================================
// MOCK DATA (fallback when no real-time connection)
// ============================================================================

const MOCK_SERVICES: ServiceStatus[] = [
  {
    name: 'API Principal',
    status: 'operational',
    latency: 45,
    uptime: 99.98,
    lastCheck: new Date().toISOString(),
    details: 'Todas las operaciones funcionando correctamente',
  },
  {
    name: 'Base de Datos PostgreSQL',
    status: 'operational',
    latency: 12,
    uptime: 99.99,
    lastCheck: new Date().toISOString(),
    details: 'Conexiones activas: 45/100',
  },
  {
    name: 'Redis Cache',
    status: 'operational',
    latency: 2,
    uptime: 99.99,
    lastCheck: new Date().toISOString(),
    details: 'Memoria usada: 256MB/1GB',
  },
  {
    name: 'Cola de Trabajos (BullMQ)',
    status: 'operational',
    latency: 8,
    uptime: 99.95,
    lastCheck: new Date().toISOString(),
    details: 'Jobs en cola: 12, Procesados hoy: 1,234',
  },
  {
    name: 'Almacenamiento (S3)',
    status: 'operational',
    latency: 89,
    uptime: 99.99,
    lastCheck: new Date().toISOString(),
    details: 'Espacio usado: 45.2 GB',
  },
  {
    name: 'Email (SMTP)',
    status: 'degraded',
    latency: 1200,
    uptime: 98.5,
    lastCheck: new Date().toISOString(),
    details: 'Latencia elevada - proveedor con retrasos',
  },
  {
    name: 'WhatsApp Cloud API',
    status: 'operational',
    latency: 156,
    uptime: 99.9,
    lastCheck: new Date().toISOString(),
    details: 'Mensajes enviados hoy: 234',
  },
  {
    name: 'CDN (Cloudflare)',
    status: 'operational',
    latency: 15,
    uptime: 99.99,
    lastCheck: new Date().toISOString(),
    details: 'Cache hit ratio: 94%',
  },
];

const MOCK_METRICS: SystemMetric[] = [
  { name: 'CPU', value: 42, max: 100, unit: '%', status: 'healthy' },
  { name: 'Memoria', value: 68, max: 100, unit: '%', status: 'healthy' },
  { name: 'Disco', value: 45, max: 100, unit: '%', status: 'healthy' },
  { name: 'Conexiones DB', value: 45, max: 100, unit: '', status: 'healthy' },
  { name: 'Requests/min', value: 1250, max: 5000, unit: '', status: 'healthy' },
  { name: 'Errores/hora', value: 3, max: 50, unit: '', status: 'healthy' },
];

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-003',
    title: 'Latencia elevada en servicio de email',
    status: 'monitoring',
    severity: 'minor',
    createdAt: '2025-12-07T12:30:00',
    updatedAt: '2025-12-07T14:00:00',
    description: 'El proveedor de email está experimentando retrasos en la entrega. Estamos monitoreando la situación.',
    affectedServices: ['Email (SMTP)'],
  },
];

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

function calculateOverallStatus(services: ServiceStatus[]): 'operational' | 'degraded' | 'outage' {
  const operationalCount = services.filter((s) => s.status === 'operational').length;
  if (operationalCount === services.length) return 'operational';
  if (operationalCount >= services.length - 1) return 'degraded';
  return 'outage';
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
    overallStatus: calculateOverallStatus(MOCK_SERVICES),
    avgResponseTime: 190,
    avgUptime: 99.5,
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
