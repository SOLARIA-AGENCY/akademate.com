'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
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
   
  const hookResult = useSystemStatus({ enableRealtime: true }) as unknown as SystemStatusHookResult;

  // Extract data with proper typing
  const { services, incidents, overallStatus } = hookResult.data;
  const { isConnected, lastUpdate, refresh } = hookResult;


  const [serverMetrics, setServerMetrics] = useState<{
    cpu: number
    memory: { percent: number; used: number; total: number }
    uptime: { display: string }
    source: string
  } | null>(null)

  useEffect(() => {
    const fetchMetrics = () => {
      fetch('/api/ops/server-metrics')
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setServerMetrics(data) })
        .catch(() => {})
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

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
      />

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">CPU</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-foreground">
              {serverMetrics ? serverMetrics.cpu : '—'}
            </span>
            {serverMetrics && <span className="text-muted-foreground text-sm mb-1">%</span>}
          </div>
          <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                serverMetrics && serverMetrics.cpu < 60 ? 'bg-green-500' :
                serverMetrics && serverMetrics.cpu < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: serverMetrics ? `${serverMetrics.cpu}%` : '0%' }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Memoria</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-foreground">
              {serverMetrics ? serverMetrics.memory.percent : '—'}
            </span>
            {serverMetrics && <span className="text-muted-foreground text-sm mb-1">%</span>}
          </div>
          <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                serverMetrics && serverMetrics.memory.percent < 60 ? 'bg-green-500' :
                serverMetrics && serverMetrics.memory.percent < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: serverMetrics ? `${serverMetrics.memory.percent}%` : '0%' }}
            />
          </div>
          {serverMetrics && (
            <p className="text-xs text-muted-foreground mt-1">
              {serverMetrics.memory.used} / {serverMetrics.memory.total} MB
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Uptime Servidor</p>
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-foreground">
              {serverMetrics ? serverMetrics.uptime.display : '—'}
            </span>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-green-500/30 rounded-full">
              <div className="h-full bg-green-500 rounded-full w-full" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Fuente de datos</p>
          <div className="flex items-end gap-1">
            <span className="text-sm font-medium text-foreground">
              {serverMetrics ? (serverMetrics.source === 'hetzner' ? 'Hetzner API' : 'Sistema') : '—'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {serverMetrics ? 'Actualiza cada 30s' : 'Sin datos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Status */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl rounded-xl border border-muted/30">
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
          <div className="bg-card border border-border rounded-xl rounded-xl border border-muted/30">
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
          <div className="bg-card border border-border rounded-xl rounded-xl border border-muted/30 mt-6">
            <div className="p-4 border-b border-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Historial de Disponibilidad</h3>
              <p className="text-muted-foreground text-sm">Ultimos 30 dias</p>
            </div>
            <div className="p-4">
              <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                <p className="text-sm">Historial de uptime no disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Times Chart */}
      <div className="mt-6 bg-card border border-border rounded-xl rounded-xl border border-muted/30 p-6">
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
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <p className="text-sm">Datos de tiempo de respuesta no disponibles</p>
          <p className="text-xs mt-1">Configura un sistema de monitorización para ver métricas en tiempo real</p>
        </div>
      </div>
    </>
  );
}
