'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
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
  Download,
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  LogIn,
  LogOut,
  Key,
  Settings,
  FileText,
  BookOpen,
  Users,
  Shield,
  RefreshCw,
} from 'lucide-react'

// Mock data del registro de actividad
const actividadData = [
  {
    id: '1',
    timestamp: '2024-12-07 10:45:23',
    usuario: 'Carlos Pérez',
    email: 'admin@cepformacion.com',
    accion: 'LOGIN',
    descripcion: 'Inicio de sesión exitoso',
    modulo: 'Autenticación',
    ip: '192.168.1.100',
    severidad: 'info',
    detalles: { navegador: 'Chrome 120', so: 'macOS' },
  },
  {
    id: '2',
    timestamp: '2024-12-07 10:30:15',
    usuario: 'María García López',
    email: 'maria.garcia@cepformacion.com',
    accion: 'CREATE',
    descripcion: 'Nuevo curso creado: "Marketing Digital Avanzado"',
    modulo: 'Cursos',
    ip: '192.168.1.101',
    severidad: 'success',
    detalles: { cursoId: 'CRS-2024-089' },
  },
  {
    id: '3',
    timestamp: '2024-12-07 10:15:42',
    usuario: 'Juan Martínez Ruiz',
    email: 'juan.martinez@cepformacion.com',
    accion: 'UPDATE',
    descripcion: 'Lead actualizado: María González → Estado: Cualificado',
    modulo: 'Leads',
    ip: '192.168.1.102',
    severidad: 'info',
    detalles: { leadId: 'LEAD-2024-342', estadoAnterior: 'Contactado' },
  },
  {
    id: '4',
    timestamp: '2024-12-07 09:58:10',
    usuario: 'Sistema',
    email: 'system@cepformacion.com',
    accion: 'BACKUP',
    descripcion: 'Backup automático completado',
    modulo: 'Sistema',
    ip: 'localhost',
    severidad: 'success',
    detalles: { tamaño: '245 MB', duracion: '3.2s' },
  },
  {
    id: '5',
    timestamp: '2024-12-07 09:45:33',
    usuario: 'Ana Rodríguez Sánchez',
    email: 'ana.rodriguez@cepformacion.com',
    accion: 'DELETE',
    descripcion: 'Lead eliminado: ID LEAD-2024-128',
    modulo: 'Leads',
    ip: '192.168.1.103',
    severidad: 'warning',
    detalles: { motivo: 'Duplicado' },
  },
  {
    id: '6',
    timestamp: '2024-12-07 09:30:00',
    usuario: 'Carlos Pérez',
    email: 'admin@cepformacion.com',
    accion: 'CONFIG_CHANGE',
    descripcion: 'Configuración de API modificada',
    modulo: 'Configuración',
    ip: '192.168.1.100',
    severidad: 'warning',
    detalles: { campo: 'Meta Ads Webhook URL' },
  },
  {
    id: '7',
    timestamp: '2024-12-07 09:15:22',
    usuario: 'Sistema',
    email: 'system@cepformacion.com',
    accion: 'ERROR',
    descripcion: 'Error en sincronización con Mailchimp',
    modulo: 'Integraciones',
    ip: 'localhost',
    severidad: 'error',
    detalles: { error: 'API rate limit exceeded', retry: '5 min' },
  },
  {
    id: '8',
    timestamp: '2024-12-07 09:00:05',
    usuario: 'Pedro Sánchez López',
    email: 'pedro.sanchez@cepformacion.com',
    accion: 'LOGIN',
    descripcion: 'Inicio de sesión exitoso',
    modulo: 'Autenticación',
    ip: '192.168.1.104',
    severidad: 'info',
    detalles: { navegador: 'Firefox 121', so: 'Windows 11' },
  },
  {
    id: '9',
    timestamp: '2024-12-06 18:45:10',
    usuario: 'Laura Pérez Gómez',
    email: 'laura.perez@cepformacion.com',
    accion: 'VIEW',
    descripcion: 'Visualizó informe de analíticas',
    modulo: 'Analíticas',
    ip: '192.168.1.105',
    severidad: 'info',
    detalles: { informe: 'Resumen mensual diciembre' },
  },
  {
    id: '10',
    timestamp: '2024-12-06 17:30:00',
    usuario: 'Carlos Pérez',
    email: 'admin@cepformacion.com',
    accion: 'IMPERSONATE',
    descripcion: 'Impersonación iniciada: María García López',
    modulo: 'Administración',
    ip: '192.168.1.100',
    severidad: 'warning',
    detalles: { motivo: 'Verificación de permisos', duracion: '15 min' },
  },
]

const severidadConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  info: { label: 'Info', variant: 'secondary', icon: Info, color: 'text-blue-600' },
  success: { label: 'Éxito', variant: 'outline', icon: CheckCircle2, color: 'text-green-600' },
  warning: { label: 'Advertencia', variant: 'outline', icon: AlertTriangle, color: 'text-amber-600' },
  error: { label: 'Error', variant: 'destructive', icon: XCircle, color: 'text-red-600' },
}

const accionConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
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
    loginHoy: actividadData.filter((a) => a.accion === 'LOGIN' && a.timestamp.startsWith('2024-12-07')).length,
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registro de Actividad</h1>
          <p className="text-muted-foreground">
            Auditoría completa de acciones en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Rango de Fechas
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Log
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">registros de actividad</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inicios de Sesión</CardTitle>
            <LogIn className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.loginHoy}</div>
            <p className="text-xs text-muted-foreground">usuarios hoy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.advertencias}</div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errores</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errores}</div>
            <p className="text-xs text-muted-foreground">errores registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, email o descripción..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={severidadFilter} onValueChange={setSeveridadFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduloFilter} onValueChange={setModuloFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los módulos</SelectItem>
                <SelectItem value="Autenticación">Autenticación</SelectItem>
                <SelectItem value="Cursos">Cursos</SelectItem>
                <SelectItem value="Leads">Leads</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
                <SelectItem value="Configuración">Configuración</SelectItem>
                <SelectItem value="Integraciones">Integraciones</SelectItem>
                <SelectItem value="Analíticas">Analíticas</SelectItem>
                <SelectItem value="Administración">Administración</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accionFilter} onValueChange={setAccionFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="CREATE">Crear</SelectItem>
                <SelectItem value="UPDATE">Actualizar</SelectItem>
                <SelectItem value="DELETE">Eliminar</SelectItem>
                <SelectItem value="VIEW">Ver</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de actividad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" style={{ color: '#F2014B' }} />
            Log de Actividad ({filteredActividad.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Fecha/Hora</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead className="w-[100px]">Severidad</TableHead>
                <TableHead className="w-[120px]">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActividad.map((item) => {
                const severidadInfo = severidadConfig[item.severidad]
                const SeveridadIcon = severidadInfo.icon
                const accionInfo = accionConfig[item.accion]
                const AccionIcon = accionInfo?.icon || Activity
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">
                      {item.timestamp}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{item.usuario}</span>
                          <span className="text-xs text-muted-foreground">{item.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AccionIcon className={`h-4 w-4 ${accionInfo?.color || 'text-gray-500'}`} />
                        <span className="text-sm">{item.accion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.descripcion}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.modulo}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={severidadInfo.variant}
                        className={`flex items-center gap-1 w-fit ${
                          item.severidad === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
                          item.severidad === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''
                        }`}
                      >
                        <SeveridadIcon className="h-3 w-3" />
                        {severidadInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline de Actividad Reciente</CardTitle>
          <CardDescription>Últimas acciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actividadData.slice(0, 5).map((item, index) => {
              const severidadInfo = severidadConfig[item.severidad]
              const accionInfo = accionConfig[item.accion]
              const AccionIcon = accionInfo?.icon || Activity
              return (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center ${accionInfo?.color || ''}`}>
                      <AccionIcon className="h-5 w-5" />
                    </div>
                    {index < 4 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{item.descripcion}</p>
                      <span className="text-xs text-muted-foreground">{item.timestamp.split(' ')[1]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
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
