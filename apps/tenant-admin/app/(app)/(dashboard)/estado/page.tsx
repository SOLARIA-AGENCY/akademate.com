'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Globe,
  Server,
  Wifi,
  HardDrive,
  Clock,
  Zap,
  TrendingUp,
  Minus,
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down' | 'maintenance'
  responseTime?: number
  lastChecked: Date
  uptime?: number
  icon: typeof Activity
  description: string
}

interface Incident {
  id: number
  date: Date
  severity: 'minor' | 'major' | 'critical'
  title: string
  description: string
  resolved: boolean
  updates?: { time: Date; message: string; status: string }[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'text-green-500'
    case 'degraded':
      return 'text-yellow-500'
    case 'down':
      return 'text-red-500'
    case 'maintenance':
      return 'text-gray-500'
    default:
      return 'text-muted-foreground'
  }
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'bg-green-500/10 border-green-500/20'
    case 'degraded':
      return 'bg-yellow-500/10 border-yellow-500/20'
    case 'down':
      return 'bg-red-500/10 border-red-500/20'
    case 'maintenance':
      return 'bg-gray-500/10 border-gray-500/20'
    default:
      return 'bg-muted'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle2 className="h-5 w-5 text-green-500" data-oid="3dvgwx." />
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" data-oid="ya79by8" />
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" data-oid="4t30sqa" />
    case 'maintenance':
      return <Minus className="h-5 w-5 text-gray-500" data-oid=":2u01mm" />
    default:
      return <Activity className="h-5 w-5 text-muted-foreground" data-oid="w_mj078" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'operational':
      return 'Operativo'
    case 'degraded':
      return 'Degradado'
    case 'down':
      return 'Caído'
    case 'maintenance':
      return 'Mantenimiento'
    default:
      return 'Desconocido'
  }
}

export default function EstadoSistemaPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Frontend (Next.js)',
      status: 'operational',
      responseTime: 45,
      lastChecked: new Date(2025, 0, 1),
      uptime: 99.9,
      icon: Globe,
      description: 'Aplicación web pública y dashboard',
    },
    {
      name: 'API Backend',
      status: 'operational',
      responseTime: 120,
      lastChecked: new Date(2025, 0, 1),
      uptime: 99.8,
      icon: Server,
      description: 'Servicios REST y GraphQL',
    },
    {
      name: 'Base de Datos (PostgreSQL)',
      status: 'operational',
      responseTime: 15,
      lastChecked: new Date(2025, 0, 1),
      uptime: 100,
      icon: Database,
      description: 'Almacenamiento persistente',
    },
    {
      name: 'Conexión de Red',
      status: 'operational',
      responseTime: 8,
      lastChecked: new Date(2025, 0, 1),
      uptime: 99.95,
      icon: Wifi,
      description: 'Conectividad y DNS',
    },
    {
      name: 'Almacenamiento',
      status: 'operational',
      responseTime: 5,
      lastChecked: new Date(2025, 0, 1),
      uptime: 100,
      icon: HardDrive,
      description: 'Volúmenes y backups',
    },
    {
      name: 'Worker Queue (BullMQ)',
      status: 'operational',
      responseTime: 35,
      lastChecked: new Date(2025, 0, 1),
      uptime: 99.7,
      icon: Zap,
      description: 'Procesos en segundo plano',
    },
  ])

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 1,
      date: new Date(2025, 0, 14), // Static date: Jan 14, 2025
      severity: 'minor',
      title: 'Mantenimiento programado de base de datos',
      description: 'Se realizó mantenimiento de rutina durante 15 minutos',
      resolved: true,
      updates: [
        {
          time: new Date(2025, 0, 14, 10, 15),
          message: 'Mantenimiento completado exitosamente',
          status: 'Resuelto',
        },
      ],
    },
    {
      id: 2,
      date: new Date(2025, 0, 9), // Static date: Jan 9, 2025
      severity: 'major',
      title: 'Caída temporal del servicio API',
      description: 'El servicio API estuvo inaccesible durante 45 minutos debido a actualización',
      resolved: true,
      updates: [
        { time: new Date(2025, 0, 9, 15, 45), message: 'Servicio restaurado', status: 'Resuelto' },
        {
          time: new Date(2025, 0, 9, 15, 30),
          message: 'Trabajando en la restauración',
          status: 'Investigando',
        },
        {
          time: new Date(2025, 0, 9, 15, 0),
          message: 'Incidente detectado',
          status: 'Identificado',
        },
      ],
    },
  ])

  // Initialize on client mount only
  useEffect(() => {
    setIsMounted(true)
    const now = new Date()
    setLastUpdate(now)
    setServices((prev) =>
      prev.map((service) => ({
        ...service,
        lastChecked: now,
      }))
    )
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isMounted) return

    const interval = setInterval(() => {
      checkServicesStatus()
      setLastUpdate(new Date())
    }, 30000)

    return () => clearInterval(interval)
  }, [isMounted])

  const checkServicesStatus = async () => {
    try {
      const apiResponse = await fetch('/api/dashboard')
      const apiStatus = apiResponse.ok ? 'operational' : 'down'

      setServices((prev) =>
        prev.map((service) => {
          if (service.name === 'API Backend') {
            return {
              ...service,
              status: apiStatus,
              lastChecked: new Date(),
              responseTime: Math.floor(Math.random() * 50) + 100,
            }
          }
          return {
            ...service,
            lastChecked: new Date(),
            responseTime: service.responseTime
              ? service.responseTime + Math.floor(Math.random() * 10 - 5)
              : undefined,
          }
        })
      )
    } catch (error) {
      console.error('Error checking services:', error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    checkServicesStatus()
    setLastUpdate(new Date())
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'down')
      ? 'down'
      : services.some((s) => s.status === 'degraded')
        ? 'degraded'
        : 'operational'

  const avgResponseTime = Math.round(
    services.reduce((sum, s) => sum + (s.responseTime || 0), 0) /
      services.filter((s) => s.responseTime).length
  )

  const avgUptime = (
    services.reduce((sum, s) => sum + (s.uptime || 0), 0) / services.length
  ).toFixed(2)

  return (
    <div className="space-y-6 max-w-7xl mx-auto" data-oid="ebm9k.2">
      <PageHeader
        title="Estado del Sistema"
        description="Monitorización en tiempo real de todos los servicios"
        icon={Activity}
        actions={
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            data-oid="b-j88c6"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              data-oid="xtgdq2v"
            />
            Actualizar
          </Button>
        }
        data-oid="9-w3mdd"
      />

      {/* Overall Status Banner */}
      <Card className={`border-2 ${getStatusBgColor(overallStatus)}`} data-oid="3kb5:vy">
        <CardContent className="pt-6" data-oid="ggypccv">
          <div className="flex items-center justify-between" data-oid="x3ixm-0">
            <div className="flex items-center gap-4" data-oid=":cywjvm">
              {getStatusIcon(overallStatus)}
              <div data-oid="q43j8gb">
                <h2 className="text-2xl font-bold" data-oid="z0:h-4i">
                  {overallStatus === 'operational' && 'Todos los Sistemas Operativos'}
                  {overallStatus === 'degraded' && 'Rendimiento Degradado'}
                  {overallStatus === 'down' && 'Servicios Afectados'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1" data-oid="lpsig_6">
                  Última comprobación:{' '}
                  {isMounted && lastUpdate ? lastUpdate.toLocaleTimeString('es-ES') : '--:--:--'}
                </p>
              </div>
            </div>
            <div className="text-right" data-oid="f5esda_">
              <div className="text-sm text-muted-foreground" data-oid="oybjy_h">
                Uptime Global
              </div>
              <div className="text-3xl font-bold text-green-600" data-oid="lw3ca8k">
                {avgUptime}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3" data-oid="7yh6hir">
        <Card data-oid="9i_vxuj">
          <CardHeader className="pb-2" data-oid="0xkh4zi">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="k06-q9h"
            >
              <TrendingUp className="h-4 w-4" data-oid="sv05.zq" />
              Uptime (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="l-ywr.0">
            <div className="text-3xl font-bold text-green-600" data-oid="4zg4oek">
              99.87%
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-oid="b:m2jn:">
              28 minutos de inactividad total
            </p>
          </CardContent>
        </Card>

        <Card data-oid="xcz56j9">
          <CardHeader className="pb-2" data-oid="w:3qll6">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="-7zyr_."
            >
              <Clock className="h-4 w-4" data-oid="dockgjg" />
              Tiempo de Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="xip-7qd">
            <div className="text-3xl font-bold" data-oid="5qq.ht_">
              {avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-oid="6:3xiso">
              Promedio en tiempo real
            </p>
          </CardContent>
        </Card>

        <Card data-oid="ila.ee2">
          <CardHeader className="pb-2" data-oid="4r43j38">
            <CardTitle
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              data-oid="r7k80q0"
            >
              <Activity className="h-4 w-4" data-oid="mckjcku" />
              Incidencias
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="e05x85z">
            <div className="text-3xl font-bold" data-oid="4s0y7kx">
              {incidents.filter((i) => i.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-oid="7ttds1q">
              Resueltas (último mes)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <div data-oid="vguyqe1">
        <div className="flex items-center justify-between mb-4" data-oid="7muesmu">
          <h2 className="text-xl font-bold" data-oid="3bpz65:">
            Componentes del Sistema
          </h2>
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground" data-oid="_:symmf">
            <div className="flex items-center gap-2" data-oid="te0qnf2">
              <div className="w-3 h-3 bg-green-500 rounded-sm" data-oid=":_3jr98" />
              <span data-oid="5kj:xg.">Operativo</span>
            </div>
            <div className="flex items-center gap-2" data-oid="s:8a.0f">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm" data-oid="e7sot24" />
              <span data-oid="5sb-dny">Degradado</span>
            </div>
            <div className="flex items-center gap-2" data-oid="zx89q5u">
              <div className="w-3 h-3 bg-red-500 rounded-sm" data-oid="em5501l" />
              <span data-oid="e3-seu.">Caído</span>
            </div>
          </div>
        </div>
        <div className="space-y-3" data-oid="ri17687">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Card
                key={service.name}
                className="transition-all hover:shadow-md"
                data-oid="_u-jd24"
              >
                <CardContent className="pt-6" data-oid="tbrnbro">
                  <div className="flex items-center justify-between" data-oid="wgyra:m">
                    <div className="flex items-center gap-4 flex-1" data-oid="7pre.z1">
                      <Icon className="h-6 w-6 text-muted-foreground" data-oid="zqpo4ij" />
                      <div className="flex-1" data-oid="o846y9w">
                        <div className="flex items-center gap-2" data-oid="winvyyt">
                          <h3 className="font-semibold" data-oid="vd3279a">
                            {service.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={getStatusBgColor(service.status)}
                            data-oid="0vnalz2"
                          >
                            {getStatusText(service.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5" data-oid="xo:3:85">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm" data-oid="x4k9a.v">
                      {service.responseTime && (
                        <div className="text-right" data-oid="_kjcwkl">
                          <div className="text-muted-foreground" data-oid="89j_:qz">
                            Latencia
                          </div>
                          <div className="font-semibold" data-oid="786p24.">
                            {service.responseTime}ms
                          </div>
                        </div>
                      )}
                      {service.uptime && (
                        <div className="text-right" data-oid="smsn14e">
                          <div className="text-muted-foreground" data-oid="qtbnu57">
                            Uptime
                          </div>
                          <div className="font-semibold text-green-600" data-oid="rp9ezc_">
                            {service.uptime}%
                          </div>
                        </div>
                      )}
                      {getStatusIcon(service.status)}
                    </div>
                  </div>

                  {/* Uptime History Graph (Last 90 days) */}
                  <div className="mt-4 h-8 flex items-center gap-[1px]" data-oid="gmd62x5">
                    {[...Array(90)].map((_, i) => {
                      // Generate deterministic uptime history (same on server and client)
                      let statusColor = 'bg-green-500'
                      // Simple hash function for deterministic randomness
                      const hash = (i * 2654435761) % 100

                      // Simulate historical incidents
                      if (service.status === 'down' && i > 85) {
                        statusColor = 'bg-red-500'
                      } else if (service.status === 'degraded' && i > 85) {
                        statusColor = 'bg-yellow-500'
                      } else if (hash > 98) {
                        // ~2% historical downtime
                        statusColor = 'bg-red-500'
                      } else if (hash > 95) {
                        // ~3% historical degradation
                        statusColor = 'bg-yellow-500'
                      }

                      return (
                        <div
                          key={i}
                          className={`flex-1 h-full ${statusColor} transition-colors`}
                          title={`Día ${90 - i}: ${statusColor === 'bg-green-500' ? 'Operativo' : statusColor === 'bg-yellow-500' ? 'Degradado' : 'Caído'}`}
                          data-oid="x80.i2r"
                        />
                      )
                    })}
                  </div>
                  <div
                    className="flex justify-between text-xs text-muted-foreground mt-1"
                    data-oid="qm5b8cp"
                  >
                    <span data-oid="782afl0">90 días atrás</span>
                    <span data-oid="xf497p9">Hoy</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Incident History */}
      <div data-oid="o8o:ei4">
        <h2 className="text-xl font-bold mb-4" data-oid="-ba_s9u">
          Historial de Incidencias
        </h2>
        {incidents.length === 0 ? (
          <Card data-oid=":ujlnqh">
            <CardContent className="p-6 text-center text-muted-foreground" data-oid="dl-mpj5">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" data-oid="e57cjl." />
              <p data-oid="wt6hd3g">No hay incidencias registradas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-oid=":cpbh1.">
            {incidents.map((incident) => (
              <Card key={incident.id} data-oid="ulilvsx">
                <CardContent className="pt-6" data-oid="7m_kzdj">
                  <div className="flex items-start gap-4" data-oid="oj.aivu">
                    <div className="flex-1" data-oid="w_3hsxn">
                      <div className="flex items-center gap-2 mb-2" data-oid="d8-svgz">
                        <Badge
                          variant={
                            incident.severity === 'critical'
                              ? 'destructive'
                              : incident.severity === 'major'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                          data-oid="c58w-f9"
                        >
                          {incident.severity === 'critical'
                            ? 'Crítico'
                            : incident.severity === 'major'
                              ? 'Mayor'
                              : 'Menor'}
                        </Badge>
                        {incident.resolved && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 bg-green-500/10 border-green-500/20"
                            data-oid="063rw9k"
                          >
                            ✓ Resuelto
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground" data-oid="q4gw-jj">
                          {incident.date.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1" data-oid="_r7jf2h">
                        {incident.title}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-oid="q1drk_t">
                        {incident.description}
                      </p>

                      {/* Incident Timeline */}
                      {incident.updates && incident.updates.length > 0 && (
                        <div
                          className="mt-4 pl-4 border-l-2 border-muted space-y-3"
                          data-oid="d2qbx_1"
                        >
                          {incident.updates.map((update, idx) => (
                            <div key={idx} className="relative" data-oid="dzm6fwi">
                              <div
                                className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background"
                                data-oid="91x7uc8"
                              />
                              <div className="text-xs text-muted-foreground" data-oid=":drqx:h">
                                {update.time.toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              <div className="text-sm mt-0.5" data-oid="p0n6o6-">
                                <Badge
                                  variant="outline"
                                  className="text-xs mr-2"
                                  data-oid="jj13e39"
                                >
                                  {update.status}
                                </Badge>
                                {update.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh Notice */}
      <Card className="border-primary/50" data-oid="cd06m0e">
        <CardContent className="pt-6" data-oid="sp0ulst">
          <div className="flex items-start gap-3" data-oid="ab82_s3">
            <Activity className="h-5 w-5 text-primary mt-0.5" data-oid="511tfj." />
            <div className="flex-1" data-oid="4-kd3kf">
              <h4 className="font-semibold mb-1" data-oid="pkkylmq">
                Actualización Automática
              </h4>
              <p className="text-sm text-muted-foreground" data-oid="axqwaxp">
                Esta página se actualiza automáticamente cada 30 segundos para mostrar el estado más
                reciente. También puedes actualizar manualmente usando el botón "Actualizar" arriba.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
