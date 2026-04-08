'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocketContextOptional } from '@akademate/realtime/context';
import type { SystemStatusPayload } from '@akademate/realtime';

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
  dataSource: 'degraded' | 'real';
}

interface ServiceHealthApiResponse {
  overall: 'operational' | 'degraded' | 'outage';
  services: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    latencyMs: number | null;
    uptime: number;
    message: string;
  }>;
  checkedAt: string;
}

interface ServerMetricsApiResponse {
  cpu?: number;
  memory?: { percent?: number };
  uptime?: { seconds?: number };
}

const DEGRADED_SERVICES: ServiceStatus[] = [
  {
    name: 'Monitoreo de servicios',
    status: 'degraded',
    latency: null,
    uptime: 0,
    lastCheck: new Date().toISOString(),
    details: 'No hay datos en tiempo real disponibles',
  },
];

const DEGRADED_METRICS: SystemMetric[] = [
  { name: 'CPU', value: 0, max: 100, unit: '%', status: 'warning' },
  { name: 'Memoria', value: 0, max: 100, unit: '%', status: 'warning' },
  { name: 'Uptime', value: 0, max: 100, unit: 'h', status: 'healthy' },
];

function mapServiceStatus(
  status: 'operational' | 'degraded' | 'down' | 'maintenance' | 'outage'
): ServiceStatus['status'] {
  if (status === 'down') return 'outage';
  return status;
}

function metricStatus(value: number, warnFrom: number, criticalFrom: number): SystemMetric['status'] {
  if (value >= criticalFrom) return 'critical';
  if (value >= warnFrom) return 'warning';
  return 'healthy';
}

function mapApiData(
  health: ServiceHealthApiResponse | null,
  metrics: ServerMetricsApiResponse | null,
): SystemStatusData {
  if (!health) {
    return {
      services: DEGRADED_SERVICES,
      metrics: DEGRADED_METRICS,
      incidents: [],
      overallStatus: 'degraded',
      avgResponseTime: null,
      avgUptime: null,
      dataSource: 'degraded',
    };
  }

  const mappedServices: ServiceStatus[] = health.services.map((service) => ({
    name: service.name,
    status: mapServiceStatus(service.status),
    latency: service.latencyMs,
    uptime: service.uptime ?? 0,
    lastCheck: health.checkedAt,
    details: service.message ?? '',
  }));

  const latencyValues = mappedServices.map((service) => service.latency).filter((value): value is number => value !== null);
  const avgResponseTime = latencyValues.length > 0
    ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
    : null;
  const avgUptime = mappedServices.length > 0
    ? Number((mappedServices.reduce((sum, service) => sum + service.uptime, 0) / mappedServices.length).toFixed(2))
    : null;

  const cpuValue = Math.round(metrics?.cpu ?? 0);
  const memoryValue = Math.round(metrics?.memory?.percent ?? 0);
  const uptimeHours = Math.max(0, Math.round((metrics?.uptime?.seconds ?? 0) / 3600));

  return {
    services: mappedServices.length > 0 ? mappedServices : DEGRADED_SERVICES,
    metrics: [
      { name: 'CPU', value: cpuValue, max: 100, unit: '%', status: metricStatus(cpuValue, 70, 85) },
      { name: 'Memoria', value: memoryValue, max: 100, unit: '%', status: metricStatus(memoryValue, 75, 90) },
      { name: 'Uptime', value: uptimeHours, max: Math.max(24, uptimeHours), unit: 'h', status: 'healthy' },
    ],
    incidents: [],
    overallStatus: health.overall,
    avgResponseTime,
    avgUptime,
    dataSource: 'real',
  };
}

export interface UseSystemStatusOptions {
  enableRealtime?: boolean;
  autoRefreshInterval?: number;
}

export interface UseSystemStatusReturn {
  data: SystemStatusData;
  loading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useSystemStatus(options: UseSystemStatusOptions = {}): UseSystemStatusReturn {
  const { enableRealtime = true, autoRefreshInterval = 30000 } = options;
  const socketContext = useSocketContextOptional();
  const socket = socketContext?.socket ?? null;
  const isConnected = socketContext?.isConnected ?? false;

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [data, setData] = useState<SystemStatusData>({
    services: DEGRADED_SERVICES,
    metrics: DEGRADED_METRICS,
    incidents: [],
    overallStatus: 'degraded',
    avgResponseTime: null,
    avgUptime: null,
    dataSource: 'degraded',
  });

  const fetchStatusFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const [healthRes, metricsRes] = await Promise.all([
        fetch('/api/ops/service-health', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/ops/server-metrics', { cache: 'no-store', credentials: 'include' }),
      ]);

      const [healthData, metricsData] = await Promise.all([
        healthRes.ok ? (healthRes.json() as Promise<ServiceHealthApiResponse>) : Promise.resolve(null),
        metricsRes.ok ? (metricsRes.json() as Promise<ServerMetricsApiResponse>) : Promise.resolve(null),
      ]);

      setData(mapApiData(healthData, metricsData));
    } catch {
      setData((prev) => ({
        ...prev,
        dataSource: 'degraded',
        overallStatus: 'degraded',
        services: prev.services.length > 0 ? prev.services : DEGRADED_SERVICES,
      }));
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchStatusFromApi();
  }, [fetchStatusFromApi]);

  useEffect(() => {
    void fetchStatusFromApi();
  }, [fetchStatusFromApi]);

  useEffect(() => {
    if (!socket || !enableRealtime) return;

    const room = 'system:status';
    socket.emit('subscribe:room', room);

    const handleSystemStatus = (payload: SystemStatusPayload) => {
      const mappedServices: ServiceStatus[] = payload.services.map((service) => ({
        name: service.name,
        status: mapServiceStatus(service.status),
        latency: service.latency ?? null,
        uptime: service.uptime ?? 0,
        lastCheck: service.lastChecked,
        details: service.details ?? '',
      }));

      const latencyValues = mappedServices.map((service) => service.latency).filter((value): value is number => value !== null);
      const avgResponseTime = latencyValues.length > 0
        ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
        : null;
      const avgUptime = mappedServices.length > 0
        ? Number((mappedServices.reduce((sum, service) => sum + service.uptime, 0) / mappedServices.length).toFixed(2))
        : null;

      setData((prev) => ({
        ...prev,
        services: mappedServices.length > 0 ? mappedServices : prev.services,
        overallStatus: mapServiceStatus(payload.overallStatus) as 'operational' | 'degraded' | 'outage',
        avgResponseTime,
        avgUptime,
        dataSource: 'real',
      }));
      setLastUpdate(new Date());
      setLoading(false);
    };

    socket.on('system:status', handleSystemStatus);

    return () => {
      socket.emit('unsubscribe:room', room);
      socket.off('system:status', handleSystemStatus);
    };
  }, [socket, enableRealtime]);

  useEffect(() => {
    if (isConnected && enableRealtime) {
      return;
    }

    const interval = setInterval(() => {
      void fetchStatusFromApi();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchStatusFromApi, isConnected, enableRealtime]);

  return {
    data,
    loading,
    isConnected,
    lastUpdate,
    refresh,
  };
}
