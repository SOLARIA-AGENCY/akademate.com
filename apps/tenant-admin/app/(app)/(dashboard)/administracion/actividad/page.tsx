'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Search,
  Activity,
  Plus,
  Eye,
  Calendar,
  Download,
  User,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  Users,
  RefreshCw,
} from 'lucide-react'

// TODO: Fetch from API
const actividadData: {
  id: string
  timestamp: string
  usuario: string
  email: string
  accion: string
  descripcion: string
  modulo: string
  ip: string
  severidad: string
  detalles: Record<string, string>
}[] = []

const severidadConfig: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    icon: React.ComponentType<{ className?: string }>
    color: string
  }
> = {
  info: { label: 'Info', variant: 'secondary', icon: Info, color: 'text-blue-600' },
  success: { label: 'Éxito', variant: 'outline', icon: CheckCircle2, color: 'text-green-600' },
  warning: {
    label: 'Advertencia',
    variant: 'outline',
    icon: AlertTriangle,
    color: 'text-amber-600',
  },
  error: { label: 'Error', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
}

const accionConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  LOGIN: { icon: LogIn, color: 'text-blue-500' },
  LOGOUT: { icon: LogOut, color: 'text-gray-500' },
  CREATE: { icon: Plus, color: 'text-green-500' },
  UPDATE: { icon: Edit, color: 'text-amber-500' },
  DELETE: { icon: Trash2, color: 'text-red-500' },
  VIEW: { icon: Eye, color: 'text-blue-400' },
  BACKUP: { icon: RefreshCw, color: 'text-purple-500' },
  CONFIG_CHANGE: { icon: Settings, color: 'text-orange-500' },
  ERROR: { icon: AlertCircle, color: 'text-red-600' },
  IMPERSONATE: { icon: Users, color: 'text-amber-600' },
}

export default function ActividadPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [severidadFilter, setSeveridadFilter] = useState('todas')
  const [moduloFilter, setModuloFilter] = useState('todos')
  const [accionFilter, setAccionFilter] = useState('todas')

  const filteredActividad = actividadData.filter((item) => {
    const matchesSearch =
      item.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeveridad = severidadFilter === 'todas' || item.severidad === severidadFilter
    const matchesModulo = moduloFilter === 'todos' || item.modulo === moduloFilter
    const matchesAccion = accionFilter === 'todas' || item.accion === accionFilter
    return matchesSearch && matchesSeveridad && matchesModulo && matchesAccion
  })

  // Estadísticas
  const stats = {
    total: actividadData.length,
    errores: actividadData.filter((a) => a.severidad === 'error').length,
    advertencias: actividadData.filter((a) => a.severidad === 'warning').length,
    loginHoy: actividadData.filter(
      (a) => a.accion === 'LOGIN' && a.timestamp.startsWith('2024-12-07')
    ).length,
  }

  return (
    <div className="space-y-6" data-oid=".3kb-:g">
      <PageHeader
        title="Registro de Actividad"
        description="Auditoría completa de acciones en el sistema"
        icon={Activity}
        actions={
          <div className="flex gap-2" data-oid=".x8zc13">
            <Button variant="outline" data-oid="aodm41v">
              <Calendar className="mr-2 h-4 w-4" data-oid="z5_rrkk" />
              Rango de Fechas
            </Button>
            <Button variant="outline" data-oid="evgco9:">
              <Download className="mr-2 h-4 w-4" data-oid="1dfomhw" />
              Exportar Log
            </Button>
          </div>
        }
        data-oid="sufh9ct"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="1i_twyz">
        <Card data-oid="k.n6jgo">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="_-f1_fn"
          >
            <CardTitle className="text-sm font-medium" data-oid="ceeanl6">
              Eventos Hoy
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" data-oid="_j_cr3t" />
          </CardHeader>
          <CardContent data-oid="g12_82c">
            <div className="text-2xl font-bold" data-oid="28k7n05">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="1at213w">
              registros de actividad
            </p>
          </CardContent>
        </Card>
        <Card data-oid="segomsq">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="tkfjag5"
          >
            <CardTitle className="text-sm font-medium" data-oid="500kuih">
              Inicios de Sesión
            </CardTitle>
            <LogIn className="h-4 w-4 text-blue-500" data-oid="tmo_v47" />
          </CardHeader>
          <CardContent data-oid="t7a:b61">
            <div className="text-2xl font-bold text-blue-600" data-oid="5t3425m">
              {stats.loginHoy}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="1d-0582">
              usuarios hoy
            </p>
          </CardContent>
        </Card>
        <Card data-oid="wsgna.5">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="u::p9n:"
          >
            <CardTitle className="text-sm font-medium" data-oid="-hf8kc6">
              Advertencias
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" data-oid="9vimsub" />
          </CardHeader>
          <CardContent data-oid="m_s4-j3">
            <div className="text-2xl font-bold text-amber-600" data-oid="fagbeme">
              {stats.advertencias}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="-zhp4il">
              requieren atención
            </p>
          </CardContent>
        </Card>
        <Card data-oid="etb0_or">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="9x9vbjo"
          >
            <CardTitle className="text-sm font-medium" data-oid="2wc6:vw">
              Errores
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" data-oid="47t0qrv" />
          </CardHeader>
          <CardContent data-oid="1dnc7l4">
            <div className="text-2xl font-bold text-red-600" data-oid="7cknb69">
              {stats.errores}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="pdxwmvu">
              errores registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card data-oid="ca--9-8">
        <CardContent className="pt-6" data-oid="0nug2vp">
          <div className="flex flex-col gap-4 md:flex-row md:items-center" data-oid="2vn5qk.">
            <div className="relative flex-1" data-oid="3m0_:yt">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                data-oid="1e-emqs"
              />
              <Input
                placeholder="Buscar por usuario, email o descripción..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid="qron-50"
              />
            </div>
            <Select value={severidadFilter} onValueChange={setSeveridadFilter} data-oid="7lbu6lo">
              <SelectTrigger className="w-full md:w-[150px]" data-oid="c:_n_s:">
                <SelectValue placeholder="Severidad" data-oid="c1tapdf" />
              </SelectTrigger>
              <SelectContent data-oid="g6791n8">
                <SelectItem value="todas" data-oid="4mjcs64">
                  Todas
                </SelectItem>
                <SelectItem value="info" data-oid="c9-4uek">
                  Info
                </SelectItem>
                <SelectItem value="success" data-oid=":sc1ndy">
                  Éxito
                </SelectItem>
                <SelectItem value="warning" data-oid="6:nz67z">
                  Advertencia
                </SelectItem>
                <SelectItem value="error" data-oid="7tnhg1-">
                  Error
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduloFilter} onValueChange={setModuloFilter} data-oid="f-2_.8z">
              <SelectTrigger className="w-full md:w-[180px]" data-oid="kksfehu">
                <SelectValue placeholder="Módulo" data-oid="jgoe1v3" />
              </SelectTrigger>
              <SelectContent data-oid="6dqw_wy">
                <SelectItem value="todos" data-oid="0dh6548">
                  Todos los módulos
                </SelectItem>
                <SelectItem value="Autenticación" data-oid="98ji.dm">
                  Autenticación
                </SelectItem>
                <SelectItem value="Cursos" data-oid="b7l63tx">
                  Cursos
                </SelectItem>
                <SelectItem value="Leads" data-oid="k2z.m0:">
                  Leads
                </SelectItem>
                <SelectItem value="Sistema" data-oid="2jgd590">
                  Sistema
                </SelectItem>
                <SelectItem value="Configuración" data-oid="z2xkf65">
                  Configuración
                </SelectItem>
                <SelectItem value="Integraciones" data-oid="bhh6ril">
                  Integraciones
                </SelectItem>
                <SelectItem value="Analíticas" data-oid="zlmhcao">
                  Analíticas
                </SelectItem>
                <SelectItem value="Administración" data-oid="bj-fifx">
                  Administración
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={accionFilter} onValueChange={setAccionFilter} data-oid="_2honxc">
              <SelectTrigger className="w-full md:w-[150px]" data-oid="fo-je15">
                <SelectValue placeholder="Acción" data-oid="sw7_cqr" />
              </SelectTrigger>
              <SelectContent data-oid="f6_dogs">
                <SelectItem value="todas" data-oid="p6wd2-c">
                  Todas
                </SelectItem>
                <SelectItem value="LOGIN" data-oid="x.1gx2z">
                  Login
                </SelectItem>
                <SelectItem value="CREATE" data-oid="kqtlqt2">
                  Crear
                </SelectItem>
                <SelectItem value="UPDATE" data-oid="d70qfp2">
                  Actualizar
                </SelectItem>
                <SelectItem value="DELETE" data-oid="p16y29i">
                  Eliminar
                </SelectItem>
                <SelectItem value="VIEW" data-oid="utl3eov">
                  Ver
                </SelectItem>
                <SelectItem value="ERROR" data-oid="n:35gaq">
                  Error
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de actividad */}
      <Card data-oid="xl0ipic">
        <CardHeader data-oid="q5snfwa">
          <CardTitle className="flex items-center gap-2" data-oid="1vbo61e">
            <Activity className="h-5 w-5" style={{ color: '#F2014B' }} data-oid="jab0kwn" />
            Log de Actividad ({filteredActividad.length})
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="eo6f.l-">
          <Table data-oid="7x372os">
            <TableHeader data-oid="kcl-2a9">
              <TableRow data-oid="kqw1_.h">
                <TableHead className="w-[180px]" data-oid="pm7byxw">
                  Fecha/Hora
                </TableHead>
                <TableHead data-oid="r4jp_4:">Usuario</TableHead>
                <TableHead className="w-[100px]" data-oid="o8eb2px">
                  Acción
                </TableHead>
                <TableHead data-oid="hwzb06z">Descripción</TableHead>
                <TableHead data-oid="9d-.r9t">Módulo</TableHead>
                <TableHead className="w-[100px]" data-oid="cljrewn">
                  Severidad
                </TableHead>
                <TableHead className="w-[120px]" data-oid="i8.r7ml">
                  IP
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="e_vtgqu">
              {filteredActividad.map((item) => {
                const severidadInfo = severidadConfig[item.severidad]
                const SeveridadIcon = severidadInfo.icon
                const accionInfo = accionConfig[item.accion]
                const AccionIcon = accionInfo?.icon ?? Activity
                return (
                  <TableRow key={item.id} data-oid="rozq8mg">
                    <TableCell className="font-mono text-sm" data-oid="hh4sg26">
                      {item.timestamp}
                    </TableCell>
                    <TableCell data-oid="98i3se3">
                      <div className="flex items-center gap-2" data-oid=".fs.sg4">
                        <div
                          className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                          data-oid="003fh03"
                        >
                          <User className="h-4 w-4 text-muted-foreground" data-oid="eeigb8i" />
                        </div>
                        <div className="flex flex-col" data-oid="ql_-8fc">
                          <span className="font-medium text-sm" data-oid="glmowme">
                            {item.usuario}
                          </span>
                          <span className="text-xs text-muted-foreground" data-oid="yca2:w5">
                            {item.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-oid="f9lzl-1">
                      <div className="flex items-center gap-1" data-oid="jquo734">
                        <AccionIcon
                          className={`h-4 w-4 ${accionInfo?.color ?? 'text-gray-500'}`}
                          data-oid="-am:_9q"
                        />
                        <span className="text-sm" data-oid="kb2mb.u">
                          {item.accion}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell data-oid="jn1-v41">
                      <span className="text-sm" data-oid="y9vn5l2">
                        {item.descripcion}
                      </span>
                    </TableCell>
                    <TableCell data-oid=":whu82b">
                      <Badge variant="outline" data-oid="kqf0z8:">
                        {item.modulo}
                      </Badge>
                    </TableCell>
                    <TableCell data-oid=".aghesr">
                      <Badge
                        variant={severidadInfo.variant}
                        className={`flex items-center gap-1 w-fit ${
                          item.severidad === 'success'
                            ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
                            : item.severidad === 'warning'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                              : ''
                        }`}
                        data-oid=".z31e5y"
                      >
                        <SeveridadIcon className="h-3 w-3" data-oid="4lu9w0m" />
                        {severidadInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      data-oid="maatcgg"
                    >
                      {item.ip}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline reciente */}
      <Card data-oid=":ukjx:m">
        <CardHeader data-oid="8cn6_zr">
          <CardTitle className="text-base" data-oid="al6-dc_">
            Timeline de Actividad Reciente
          </CardTitle>
          <CardDescription data-oid="4sba5io">Últimas acciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent data-oid="5ga9g08">
          <div className="space-y-4" data-oid="gnood79">
            {actividadData.slice(0, 5).map((item, index) => {
              const accionInfo = accionConfig[item.accion]
              const AccionIcon = accionInfo?.icon ?? Activity
              return (
                <div key={item.id} className="flex items-start gap-4" data-oid="xdu0pek">
                  <div className="relative" data-oid="3b:ange">
                    <div
                      className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${accionInfo?.color ?? ''}`}
                      data-oid="auk8mkf"
                    >
                      <AccionIcon className="h-5 w-5" data-oid="jybskhc" />
                    </div>
                    {index < 4 && (
                      <div
                        className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-muted"
                        data-oid="fw6wxwc"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1" data-oid="yh4u9bq">
                    <div className="flex items-center justify-between" data-oid="f3lh2m9">
                      <p className="font-medium text-sm" data-oid="z2cxjov">
                        {item.descripcion}
                      </p>
                      <span className="text-xs text-muted-foreground" data-oid="k_2tq-3">
                        {item.timestamp.split(' ')[1]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-oid="xr7_19g">
                      por {item.usuario} en {item.modulo}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
