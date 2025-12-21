'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { MockDataBanner } from '@/components/mock-data-banner';
import { ResponseTimeChart, type ResponseTimeDataPoint } from '@/components/charts';
import { useSystemStatus, type ServiceStatus, type SystemMetric, type Incident } from '@/hooks';

export default function EstadoPage() {
  // Use the real-time system status hook
  const {
    data: { services, metrics, incidents, overallStatus },
    loading,
    isConnected,
    lastUpdate,
    refresh,
  } = useSystemStatus({ enableRealtime: true });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate response time chart data (simulated real-time updates)
  const responseTimeData = useMemo<ResponseTimeDataPoint[]>(() => {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 3600000);
      // Simulate realistic response times with some variance
      const baseApi = 45 + Math.random() * 30;
      const baseDb = 80 + Math.random() * 50;
      const baseCache = 5 + Math.random() * 10;
      // Add occasional spikes
      const spike = Math.random() > 0.9 ? Math.random() * 100 : 0;
      return {
        time: time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        api: Math.round(baseApi + spike),
        database: Math.round(baseDb + spike * 1.5),
        cache: Math.round(baseCache + spike * 0.2),
      };
    });
  }, [lastUpdate]); // Regenerate when data updates

  const operationalCount = services.filter(s => s.status === 'operational').length;

  const getStatusColor = (status: ServiceStatus['status']) => {
    const colors = {
      operational: 'bg-green-500',
      degraded: 'bg-yellow-500',
      outage: 'bg-red-500',
      maintenance: 'bg-blue-500',
    };
    return colors[status];
  };

  const getStatusLabel = (status: ServiceStatus['status']) => {
    const labels = {
      operational: 'Operativo',
      degraded: 'Degradado',
      outage: 'Fuera de servicio',
      maintenance: 'Mantenimiento',
    };
    return labels[status];
  };

  const getMetricColor = (metric: SystemMetric) => {
    const percentage = (metric.value / metric.max) * 100;
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityBadge = (severity: Incident['severity']) => {
    const styles = {
      minor: 'bg-yellow-100 text-yellow-800',
      major: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    const labels = {
      minor: 'Menor',
      major: 'Mayor',
      critical: 'Crítico',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity]}`}>
        {labels[severity]}
      </span>
    );
  };

  const getIncidentStatusBadge = (status: Incident['status']) => {
    const styles = {
      investigating: 'bg-red-100 text-red-800',
      identified: 'bg-orange-100 text-orange-800',
      monitoring: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };
    const labels = {
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

  const formatDate = (dateString: string) => {
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
                {isConnected ? 'En vivo' : 'Sin conexión'}
              </span>
            </div>
            <button
              onClick={refresh}
              className="text-xs text-primary hover:underline"
            >
              Actualizar
            </button>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Última actualización</p>
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
                      {incident.affectedServices.map((service) => (
                        <span key={service} className="px-2 py-0.5 bg-muted/50 text-foreground text-xs rounded">
                          {service}
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
              <p className="text-muted-foreground text-sm">Últimos 30 días</p>
            </div>
            <div className="p-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }, (_, i) => {
                  // Random uptime simulation
                  const uptime = Math.random() > 0.05 ? 'operational' : Math.random() > 0.5 ? 'degraded' : 'outage';
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded-sm ${getStatusColor(uptime)} opacity-80 hover:opacity-100 cursor-pointer`}
                      title={`Día ${30 - i}: ${getStatusLabel(uptime)}`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>30 días atrás</span>
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
              {isConnected ? 'Actualizando en vivo' : 'Sin conexión'}
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
