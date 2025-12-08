'use client';

import { useState, useEffect } from 'react';

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

const mockServices: ServiceStatus[] = [
  {
    name: 'API Principal',
    status: 'operational',
    latency: 45,
    uptime: 99.98,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Todas las operaciones funcionando correctamente',
  },
  {
    name: 'Base de Datos PostgreSQL',
    status: 'operational',
    latency: 12,
    uptime: 99.99,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Conexiones activas: 45/100',
  },
  {
    name: 'Redis Cache',
    status: 'operational',
    latency: 2,
    uptime: 99.99,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Memoria usada: 256MB/1GB',
  },
  {
    name: 'Cola de Trabajos (BullMQ)',
    status: 'operational',
    latency: 8,
    uptime: 99.95,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Jobs en cola: 12, Procesados hoy: 1,234',
  },
  {
    name: 'Almacenamiento (S3)',
    status: 'operational',
    latency: 89,
    uptime: 99.99,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Espacio usado: 45.2 GB',
  },
  {
    name: 'Email (SMTP)',
    status: 'degraded',
    latency: 1200,
    uptime: 98.5,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Latencia elevada - proveedor con retrasos',
  },
  {
    name: 'WhatsApp Cloud API',
    status: 'operational',
    latency: 156,
    uptime: 99.9,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Mensajes enviados hoy: 234',
  },
  {
    name: 'CDN (Cloudflare)',
    status: 'operational',
    latency: 15,
    uptime: 99.99,
    lastCheck: '2025-12-07T14:45:00',
    details: 'Cache hit ratio: 94%',
  },
];

const mockMetrics: SystemMetric[] = [
  { name: 'CPU', value: 42, max: 100, unit: '%', status: 'healthy' },
  { name: 'Memoria', value: 68, max: 100, unit: '%', status: 'healthy' },
  { name: 'Disco', value: 45, max: 100, unit: '%', status: 'healthy' },
  { name: 'Conexiones DB', value: 45, max: 100, unit: '', status: 'healthy' },
  { name: 'Requests/min', value: 1250, max: 5000, unit: '', status: 'healthy' },
  { name: 'Errores/hora', value: 3, max: 50, unit: '', status: 'healthy' },
];

const mockIncidents: Incident[] = [
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
  {
    id: 'INC-002',
    title: 'Mantenimiento programado - Actualización de base de datos',
    status: 'resolved',
    severity: 'minor',
    createdAt: '2025-12-05T02:00:00',
    updatedAt: '2025-12-05T03:30:00',
    description: 'Actualización exitosa de PostgreSQL 16.9 a 16.10. Sin interrupciones reportadas.',
    affectedServices: ['Base de Datos PostgreSQL'],
  },
];

export default function EstadoPage() {
  const [services] = useState<ServiceStatus[]>(mockServices);
  const [metrics] = useState<SystemMetric[]>(mockMetrics);
  const [incidents] = useState<Incident[]>(mockIncidents);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date().toISOString());
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const operationalCount = services.filter(s => s.status === 'operational').length;
  const overallStatus = operationalCount === services.length
    ? 'operational'
    : operationalCount >= services.length - 1
      ? 'degraded'
      : 'outage';

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
      {/* Mock Data Indicator */}
      <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-amber-500 text-sm font-medium">Mock Data - Desarrollo</span>
      </div>

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
              <p className="text-slate-400 text-sm">
                {operationalCount}/{services.length} servicios operativos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-actualizar
            </label>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Última actualización</p>
              <p className="text-slate-300 text-sm">{formatDate(lastUpdate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs mb-2">{metric.name}</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-white">{metric.value}</span>
              {metric.unit && <span className="text-slate-400 text-sm mb-1">{metric.unit}</span>}
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
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
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Estado de Servicios</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {services.map((service) => (
                <div key={service.name} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}></div>
                    <div>
                      <p className="text-white font-medium">{service.name}</p>
                      <p className="text-slate-400 text-sm">{service.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {service.latency !== null && (
                      <div className="text-right">
                        <p className="text-slate-500 text-xs">Latencia</p>
                        <p className={`text-sm font-medium ${
                          service.latency < 100 ? 'text-green-400' :
                          service.latency < 500 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {service.latency}ms
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">Uptime</p>
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
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Incidentes Recientes</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {incidents.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-400">Sin incidentes activos</p>
                </div>
              ) : (
                incidents.map((incident) => (
                  <div key={incident.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getIncidentStatusBadge(incident.status)}
                      {getSeverityBadge(incident.severity)}
                    </div>
                    <h4 className="text-white font-medium mb-1">{incident.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Inicio: {formatDate(incident.createdAt)}</span>
                      <span>Actualizado: {formatDate(incident.updatedAt)}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {incident.affectedServices.map((service) => (
                        <span key={service} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 mt-6">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Historial de Disponibilidad</h3>
              <p className="text-slate-400 text-sm">Últimos 30 días</p>
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
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>30 días atrás</span>
                <span>Hoy</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-slate-400">Operativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="text-slate-400">Degradado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-slate-400">Fuera de servicio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Times Chart Placeholder */}
      <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tiempos de Respuesta (24h)</h3>
        <div className="h-48 flex items-center justify-center bg-slate-750 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-slate-400">Gráfico de tiempos de respuesta</p>
            <p className="text-slate-500 text-sm">Próximamente con Recharts</p>
          </div>
        </div>
      </div>
    </>
  );
}
