'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { MockDataBanner } from '@/components/mock-data-banner';
import { ResponseTimeChart, type ResponseTimeDataPoint } from '@/components/charts';
import { useSystemStatus } from '@/hooks';

// Type definitions for the system status data
interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  latency: number | null;
  uptime: number;
  lastCheck: string;
  details: string;
}

interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updatedAt: string;
  description: string;
  affectedServices: string[];
}

// Type definitions for lookup objects
type StatusColorMap = Record<ServiceStatus['status'], string>;
type StatusLabelMap = Record<ServiceStatus['status'], string>;
type SeverityStyleMap = Record<Incident['severity'], string>;
type SeverityLabelMap = Record<Incident['severity'], string>;
type IncidentStatusStyleMap = Record<Incident['status'], string>;
type IncidentStatusLabelMap = Record<Incident['status'], string>;

// Seeded random number generator for stable values
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Interface for hook return to ensure type safety
interface SystemStatusHookResult {
  data: {
    services: ServiceStatus[];
    metrics: SystemMetric[];
    incidents: Incident[];
    overallStatus: ServiceStatus['status'];
  };
  isConnected: boolean;
  lastUpdate: Date | null;
  refresh: () => void;
}

export default function EstadoPage() {
  // Use the real-time system status hook with explicit type cast
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Hook types from @akademate/realtime not fully resolved
  const hookResult = useSystemStatus({ enableRealtime: true }) as unknown as SystemStatusHookResult;

  // Extract data with proper typing
  const { services, metrics, incidents, overallStatus } = hookResult.data;
  const { isConnected, lastUpdate, refresh } = hookResult;

  // Generate response time chart data with stable seeded random values
  const responseTimeData = useMemo<ResponseTimeDataPoint[]>(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 3600000);
      const seed = i * 1000;
      // Simulate realistic response times with seeded variance
      const baseApi = 45 + seededRandom(seed + 1) * 30;
      const baseDb = 80 + seededRandom(seed + 2) * 50;
      const baseCache = 5 + seededRandom(seed + 3) * 10;
      // Add occasional spikes with seeded random
      const spike = seededRandom(seed + 4) > 0.9 ? seededRandom(seed + 5) * 100 : 0;
      return {
        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        api: Math.round(baseApi + spike),
        database: Math.round(baseDb + spike * 1.5),
        cache: Math.round(baseCache + spike * 0.2),
      };
    });
  }, []);

  // Generate uptime history with stable seeded values
  const uptimeHistory = useMemo<ServiceStatus['status'][]>(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const seed = i * 100;
      const random1 = seededRandom(seed);
      const random2 = seededRandom(seed + 1);
      return random1 > 0.05 ? 'operational' : random2 > 0.5 ? 'degraded' : 'outage';
    });
  }, []);

  const operationalCount = services.filter((s) => s.status === 'operational').length;

  const getStatusColor = (status: ServiceStatus['status']): string => {
    const colors: StatusColorMap = {
      operational: 'bg-green-500',
      degraded: 'bg-yellow-500',
      outage: 'bg-red-500',
      maintenance: 'bg-blue-500',
    };
    return colors[status];
  };

  const getStatusLabel = (status: ServiceStatus['status']): string => {
    const labels: StatusLabelMap = {
      operational: 'Operativo',
      degraded: 'Degradado',
      outage: 'Fuera de servicio',
      maintenance: 'Mantenimiento',
    };
    return labels[status];
  };

  const getMetricColor = (metric: SystemMetric): string => {
    const percentage = (metric.value / metric.max) * 100;
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityBadge = (severity: Incident['severity']): React.ReactNode => {
    const styles: SeverityStyleMap = {
      minor: 'bg-yellow-100 text-yellow-800',
      major: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    const labels: SeverityLabelMap = {
      minor: 'Menor',
      major: 'Mayor',
      critical: 'Critico',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  const getIncidentStatusBadge = (status: Incident['status']): React.ReactNode => {
    const styles: IncidentStatusStyleMap = {
      investigating: 'bg-red-100 text-red-800',
      identified: 'bg-orange-100 text-orange-800',
      monitoring: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };
    const labels: IncidentStatusLabelMap = {
      investigating: 'Investigando',
      identified: 'Identificado',
      monitoring: 'Monitoreando',
      resolved: 'Resuelto',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <PageHeader
        title="Estado del Sistema"
        description="Monitorea el estado de todos los servicios de la plataforma"
      >
        <MockDataBanner />
      </PageHeader>

      {/* Overall Status Banner */}
      <div className={`mb-6 p-6 rounded-xl border ${
        overallStatus === 'operational'
          ? 'bg-green-500/10 border-green-500/30'
          : overallStatus === 'degraded'
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(overallStatus)} animate-pulse`}></div>
            <div>
              <h2 className={`text-xl font-bold ${
                overallStatus === 'operational' ? 'text-green-400' :
                overallStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {overallStatus === 'operational' ? 'Todos los sistemas operativos' :
                 overallStatus === 'degraded' ? 'Algunos sistemas degradados' : 'Interrupciones detectadas'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {operationalCount}/{services.length} servicios operativos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'En vivo' : 'Sin conexion'}
              </span>
            </div>
            <button
              onClick={refresh}
              className="text-xs text-primary hover:underline"
            >
              Actualizar
            </button>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Ultima actualizacion</p>
              <p className="text-foreground text-sm">{lastUpdate ? formatDate(lastUpdate.toISOString()) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="glass-panel p-4 rounded-xl border border-muted/30">
            <p className="text-muted-foreground text-xs mb-2">{metric.name}</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-foreground">{metric.value}</span>
              {metric.unit && <span className="text-muted-foreground text-sm mb-1">{metric.unit}</span>}
            </div>
            <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${getMetricColor(metric)} transition-all`}
                style={{ width: `${(metric.value / metric.max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl border border-muted/30">
            <div className="p-4 border-b border-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Estado de Servicios</h3>
            </div>
            <div className="divide-y divide-muted/20">
              {services.map((service) => (
                <div key={service.name} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                    <div>
                      <p className="text-foreground font-medium">{service.name}</p>
                      <p className="text-muted-foreground text-sm">{service.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {service.latency !== null && (
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Latencia</p>
                        <p className={`text-sm font-medium ${
                          service.latency < 100 ? 'text-green-400' :
                          service.latency < 500 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {service.latency}ms
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Uptime</p>
                      <p className={`text-sm font-medium ${
                        service.uptime >= 99.9 ? 'text-green-400' :
                        service.uptime >= 99 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {service.uptime}%
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      service.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                      service.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                      service.status === 'outage' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div>
          <div className="glass-panel rounded-xl border border-muted/30">
            <div className="p-4 border-b border-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Incidentes Recientes</h3>
            </div>
            <div className="divide-y divide-muted/20">
              {incidents.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-muted-foreground">Sin incidentes activos</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getIncidentStatusBadge(incident.status)}
                      {getSeverityBadge(incident.severity)}
                    </div>
                    <h4 className="text-foreground font-medium mb-1">{incident.title}</h4>
                    <p className="text-muted-foreground text-sm mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Inicio: {formatDate(incident.createdAt)}</span>
                      <span>Actualizado: {formatDate(incident.updatedAt)}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {incident.affectedServices.map((serviceName) => (
                        <span key={serviceName} className="px-2 py-0.5 bg-muted/50 text-foreground text-xs rounded">
                          {serviceName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Uptime History */}
          <div className="glass-panel rounded-xl border border-muted/30 mt-6">
            <div className="p-4 border-b border-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Historial de Disponibilidad</h3>
              <p className="text-muted-foreground text-sm">Ultimos 30 dias</p>
            </div>
            <div className="p-4">
              <div className="flex gap-0.5">
                {uptimeHistory.map((uptimeStatus, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-sm ${getStatusColor(uptimeStatus)} opacity-80 hover:opacity-100 cursor-pointer`}
                    title={`Dia ${30 - i}: ${getStatusLabel(uptimeStatus)}`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>30 dias atras</span>
                <span>Hoy</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-muted-foreground">Operativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="text-muted-foreground">Degradado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-muted-foreground">Fuera de servicio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Times Chart */}
      <div className="mt-6 glass-panel rounded-xl border border-muted/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Tiempos de Respuesta (24h)</h3>
            <p className="text-muted-foreground text-sm">Latencia promedio por servicio</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Actualizando en vivo' : 'Sin conexion'}
            </span>
          </div>
        </div>
        <ResponseTimeChart
          data={responseTimeData}
          height={220}
          showLegend={true}
          thresholdMs={200}
        />
      </div>
    </>
  );
}
