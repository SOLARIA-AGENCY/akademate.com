'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Server,
  Globe,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wifi,
  WifiOff,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { HealthSparkline } from '@/components/health-sparkline'

// Types
interface ServiceResult {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latencyMs: number | null
  message: string
  uptime: number
  url: string | null
}

interface HistoryEntry {
  service_name: string
  status: string
  latency_ms: number | null
  checked_at: string
}

interface ServiceHealth {
  overall: 'operational' | 'degraded' | 'outage'
  operationalCount: number
  totalServices: number
  services: ServiceResult[]
  checkedAt: string
}

interface PageViewStats {
  hours: number
  totalViews: number
  uniqueIps: number
  topPages: { path: string; views: number; uniqueIps: number }[]
  perDay: { day: string; views: number }[]
}

interface ServerMetrics {
  cpu: number
  memory: { used: number; total: number; percent: number }
  uptime: { seconds: number; display: string }
  platform: string
  arch: string
  hostname: string
  source: 'hetzner' | 'system'
  serverInfo: {
    name: string
    ip: string
    type: string
    datacenter: string
    status: string
  } | null
  hetzner: {
    cpu: number | null
    diskRead: number | null
    diskWrite: number | null
    networkIn: number | null
    networkOut: number | null
  } | null
}

function StatusBadge({ status }: { status: 'operational' | 'degraded' | 'outage' }) {
  if (status === 'operational') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" />
        Operativo
      </span>
    )
  }
  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
        <AlertTriangle className="w-3 h-3" />
        Degradado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
      <XCircle className="w-3 h-3" />
      Fuera de servicio
    </span>
  )
}

function MetricBar({ value, label }: { value: number; label: string }) {
  const color =
    value < 60 ? 'bg-green-500' : value < 80 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function EstadoPage() {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null)
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null)
  const [healthHistory, setHealthHistory] = useState<Record<string, HistoryEntry[]>>({})
  const [pageViews, setPageViews] = useState<PageViewStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [fetchError, setFetchError] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [metricsRes, healthRes, historyRes, pageViewsRes] = await Promise.all([
        fetch('/api/ops/server-metrics'),
        fetch('/api/ops/service-health'),
        fetch('/api/ops/service-health/history?limit=20'),
        fetch('/api/ops/page-views?hours=24'),
      ])
      const [metricsData, healthData, historyData, pageViewsData] = await Promise.all([
        metricsRes.ok ? metricsRes.json() : null,
        healthRes.ok ? healthRes.json() : null,
        historyRes.ok ? historyRes.json() : null,
        pageViewsRes.ok ? pageViewsRes.json() : null,
      ])
      if (metricsData) setServerMetrics(metricsData)
      if (healthData) setServiceHealth(healthData)
      if (historyData?.history) setHealthHistory(historyData.history)
      if (pageViewsData) setPageViews(pageViewsData)
      setLastFetch(new Date())
      setFetchError(false)
    } catch {
      setFetchError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // Connected = last fetch was less than 2 minutes ago and no error
  const isConnected =
    lastFetch !== null &&
    !fetchError &&
    Date.now() - lastFetch.getTime() < 2 * 60 * 1000

  const overallStatus = serviceHealth?.overall ?? 'operational'
  const operationalCount = serviceHealth?.operationalCount ?? 0
  const totalServices = serviceHealth?.totalServices ?? 0

  const overallBg =
    overallStatus === 'operational'
      ? 'bg-green-500/10 border-green-500/30'
      : overallStatus === 'degraded'
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-red-500/10 border-red-500/30'

  const overallTextColor =
    overallStatus === 'operational'
      ? 'text-green-400'
      : overallStatus === 'degraded'
      ? 'text-yellow-400'
      : 'text-red-400'

  const overallDotColor =
    overallStatus === 'operational'
      ? 'bg-green-500'
      : overallStatus === 'degraded'
      ? 'bg-yellow-500'
      : 'bg-red-500'

  const overallLabel =
    overallStatus === 'operational'
      ? 'Todos los sistemas operativos'
      : overallStatus === 'degraded'
      ? 'Algunos sistemas degradados'
      : 'Interrupciones detectadas'

  const serverInfo = serverMetrics?.serverInfo ?? null

  const formatDate = (d: Date) =>
    d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estado del Sistema"
        description="Monitorea el estado de todos los servicios de la plataforma"
      />

      {/* A) Banner superior */}
      <div className={`p-4 sm:p-6 rounded-xl border ${overallBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full flex-shrink-0 ${overallDotColor} animate-pulse`} />
            <div>
              <h2 className={`text-base sm:text-xl font-bold ${overallTextColor}`}>
                {overallLabel}
              </h2>
              <p className="text-muted-foreground text-sm">
                {serviceHealth
                  ? `${operationalCount}/${totalServices} servicios operativos`
                  : 'Cargando...'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'En vivo' : 'Sin conexion'}
              </span>
            </div>
            <button
              onClick={() => fetchAll()}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            {lastFetch && (
              <div>
                <p className="text-muted-foreground text-xs">Ultima actualización</p>
                <p className="text-foreground text-xs sm:text-sm">{formatDate(lastFetch)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* B) Tarjeta Servidor Hetzner */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Servidor Hetzner</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nombre</p>
            {serverInfo ? (
              <p className="text-sm font-medium text-foreground">{serverInfo.name}</p>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-24" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">IP Publica</p>
            {serverInfo ? (
              <p className="text-sm font-medium text-foreground font-mono">{serverInfo.ip}</p>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-24" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo</p>
            {serverInfo ? (
              <p className="text-sm font-medium text-foreground uppercase">{serverInfo.type}</p>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-16" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Datacenter</p>
            {serverInfo ? (
              <p className="text-sm font-medium text-foreground uppercase">{serverInfo.datacenter}</p>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-16" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Estado</p>
            {serverInfo ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                serverInfo.status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {serverInfo.status === 'running' ? 'Activo' : serverInfo.status}
              </span>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-16" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Uptime</p>
            {serverMetrics ? (
              <p className="text-sm font-medium text-foreground">{serverMetrics.uptime.display}</p>
            ) : (
              <div className="animate-pulse bg-muted rounded h-4 w-20" />
            )}
          </div>
        </div>
      </div>

      {/* C) Grid de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">CPU</p>
          {serverMetrics ? (
            <>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-2xl font-bold text-foreground">{serverMetrics.cpu}</span>
                <span className="text-muted-foreground text-sm mb-1">%</span>
              </div>
              <MetricBar value={serverMetrics.cpu} label="" />
            </>
          ) : (
            <div className="animate-pulse bg-muted rounded h-8 w-16" />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Memoria RAM</p>
          {serverMetrics ? (
            <>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-2xl font-bold text-foreground">{serverMetrics.memory.percent}</span>
                <span className="text-muted-foreground text-sm mb-1">%</span>
              </div>
              <MetricBar value={serverMetrics.memory.percent} label="" />
              <p className="text-xs text-muted-foreground mt-1">
                {serverMetrics.memory.used} / {serverMetrics.memory.total} MB
              </p>
            </>
          ) : (
            <div className="animate-pulse bg-muted rounded h-8 w-16" />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Uptime Servidor</p>
          {serverMetrics ? (
            <>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-xl font-bold text-foreground">{serverMetrics.uptime.display}</span>
              </div>
              <div className="h-2 bg-green-500/30 rounded-full">
                <div className="h-full bg-green-500 rounded-full w-full" />
              </div>
            </>
          ) : (
            <div className="animate-pulse bg-muted rounded h-8 w-24" />
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs mb-2">Fuente de datos</p>
          {serverMetrics ? (
            <>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-sm font-medium text-foreground">
                  {serverMetrics.source === 'hetzner' ? 'Hetzner API' : 'Sistema'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Actualiza cada 30s</p>
            </>
          ) : (
            <div className="animate-pulse bg-muted rounded h-8 w-24" />
          )}
        </div>
      </div>

      {/* D) Estado de Servicios */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-muted/30 flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Estado de Servicios</h3>
        </div>
        <div className="divide-y divide-muted/20">
          {serviceHealth ? (
            serviceHealth.services.map((service) => {
              const history = healthHistory[service.name] ?? []
              const sparkData = history
                .filter((h) => h.latency_ms !== null)
                .map((h) => ({ latency: h.latency_ms as number }))
              const sparkColor =
                service.status === 'operational'
                  ? '#22c55e'
                  : service.status === 'degraded'
                  ? '#eab308'
                  : '#ef4444'

              return (
                <div
                  key={service.name}
                  className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        service.status === 'operational'
                          ? 'bg-green-500 animate-pulse'
                          : service.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-foreground font-medium truncate">{service.name}</p>
                      {service.url && (
                        <p className="text-muted-foreground text-xs font-mono truncate">{service.url}</p>
                      )}
                      <p className="text-muted-foreground text-sm truncate">{service.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 pl-5 sm:pl-0">
                    {sparkData.length >= 2 && (
                      <div className="hidden sm:block">
                        <HealthSparkline data={sparkData} color={sparkColor} />
                      </div>
                    )}
                    {service.latencyMs !== null && (
                      <div className="text-right">
                        <p className="text-muted-foreground text-xs">Latencia</p>
                        <p
                          className={`text-sm font-medium ${
                            service.latencyMs < 100
                              ? 'text-green-400'
                              : service.latencyMs < 500
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {service.latencyMs}ms
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Uptime</p>
                      <p
                        className={`text-sm font-medium ${
                          service.uptime >= 99.9
                            ? 'text-green-400'
                            : service.uptime >= 99
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {service.uptime}%
                      </p>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                </div>
              )
            })
          ) : (
            // Skeleton loading
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 sm:p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse bg-muted rounded-full w-2.5 h-2.5" />
                  <div className="space-y-1">
                    <div className="animate-pulse bg-muted rounded h-4 w-32" />
                    <div className="animate-pulse bg-muted rounded h-3 w-20" />
                  </div>
                </div>
                <div className="animate-pulse bg-muted rounded h-6 w-20" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* D.5) Visitas a páginas web */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-muted/30 flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Visitas a paginas web</h3>
          <span className="text-xs text-muted-foreground ml-auto">Ultimas 24h</span>
        </div>
        <div className="p-4">
          {pageViews ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total visitas</p>
                  <p className="text-2xl font-bold text-foreground">{pageViews.totalViews.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IPs unicas</p>
                  <p className="text-2xl font-bold text-foreground">{pageViews.uniqueIps.toLocaleString()}</p>
                </div>
              </div>
              {pageViews.topPages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-muted/30">
                        <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4">Pagina</th>
                        <th className="text-right text-xs text-muted-foreground font-medium py-2 px-4">Visitas</th>
                        <th className="text-right text-xs text-muted-foreground font-medium py-2 pl-4">IPs unicas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageViews.topPages.slice(0, 5).map((page) => (
                        <tr key={page.path} className="border-b border-muted/10">
                          <td className="py-2 pr-4 font-mono text-xs text-foreground truncate max-w-[300px]">{page.path}</td>
                          <td className="py-2 px-4 text-right text-foreground">{page.views.toLocaleString()}</td>
                          <td className="py-2 pl-4 text-right text-muted-foreground">{page.uniqueIps.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos de visitas aun</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="animate-pulse bg-muted rounded h-8 w-24" />
              <div className="animate-pulse bg-muted rounded h-4 w-full" />
              <div className="animate-pulse bg-muted rounded h-4 w-3/4" />
            </div>
          )}
        </div>
      </div>

      {/* E) Uptime Kuma — Dashboard completo (todos los monitores) */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-muted/30">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Uptime Kuma — Monitores</h3>
          </div>
          <a
            href="https://status.akademate.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Abrir dashboard completo
          </a>
        </div>
        <iframe
          src="https://status.akademate.com/dashboard"
          width="100%"
          height="600"
          style={{ border: 'none' }}
          className="bg-background"
          title="Uptime Kuma — Dashboard completo"
        />
      </div>

      {/* F) Incidentes */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-muted/30">
          <h3 className="text-lg font-semibold text-foreground">Incidentes Recientes</h3>
        </div>
        <div className="p-4">
          <p className="text-muted-foreground text-sm">Sin incidentes activos</p>
        </div>
      </div>
    </div>
  )
}
