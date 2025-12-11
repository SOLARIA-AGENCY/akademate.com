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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@payload-config/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  Building2,
  CreditCard,
  AlertCircle,
  User,
  GraduationCap,
} from 'lucide-react'

// Mock data de matrículas
const matriculasData = [
  {
    id: '1',
    alumno: {
      nombre: 'María García López',
      email: 'maria.garcia@email.com',
      telefono: '+34 612 345 001',
    },
    curso: 'Marketing Digital Avanzado',
    tipo: 'Curso',
    convocatoria: 'ENE-2026-NORTE',
    sede: 'CEP Norte',
    estado: 'aceptada',
    fechaSolicitud: '2024-11-20',
    fechaAprobacion: '2024-11-22',
    metodoPago: 'FUNDAE',
    importe: 1200,
    documentacionCompleta: true,
    observaciones: 'Documentación completa. Beca FUNDAE aprobada.',
  },
  {
    id: '2',
    alumno: {
      nombre: 'Juan Martínez Ruiz',
      email: 'juan.martinez@email.com',
      telefono: '+34 612 345 002',
    },
    curso: 'Desarrollo Web Full Stack',
    tipo: 'Curso',
    convocatoria: 'FEB-2026-SCTF',
    sede: 'CEP Santa Cruz',
    estado: 'pendiente',
    fechaSolicitud: '2024-11-22',
    fechaAprobacion: null,
    metodoPago: 'Privado',
    importe: 1500,
    documentacionCompleta: false,
    observaciones: 'Falta certificado académico y foto carnet.',
  },
  {
    id: '3',
    alumno: {
      nombre: 'Ana Rodríguez Sánchez',
      email: 'ana.rodriguez@email.com',
      telefono: '+34 612 345 003',
    },
    curso: 'DAW - Desarrollo Aplicaciones Web',
    tipo: 'Ciclo Superior',
    convocatoria: 'SEPT-2025-NORTE',
    sede: 'CEP Norte',
    estado: 'aceptada',
    fechaSolicitud: '2024-11-19',
    fechaAprobacion: '2024-11-20',
    metodoPago: 'Financiación',
    importe: 3600,
    documentacionCompleta: true,
    observaciones: 'Pago fraccionado en 12 cuotas.',
  },
  {
    id: '4',
    alumno: {
      nombre: 'Carlos Fernández Torres',
      email: 'carlos.fernandez@email.com',
      telefono: '+34 612 345 004',
    },
    curso: 'SEO y Posicionamiento Web',
    tipo: 'Curso',
    convocatoria: 'DIC-2025-SUR',
    sede: 'CEP Sur',
    estado: 'rechazada',
    fechaSolicitud: '2024-11-18',
    fechaAprobacion: null,
    metodoPago: 'Privado',
    importe: 800,
    documentacionCompleta: true,
    observaciones: 'Plazas completas. Ofrecido lista de espera.',
  },
  {
    id: '5',
    alumno: {
      nombre: 'Laura Pérez Gómez',
      email: 'laura.perez@email.com',
      telefono: '+34 612 345 005',
    },
    curso: 'DAM - Desarrollo Aplicaciones Multiplataforma',
    tipo: 'Ciclo Superior',
    convocatoria: 'SEPT-2025-SCTF',
    sede: 'CEP Santa Cruz',
    estado: 'pendiente',
    fechaSolicitud: '2024-11-23',
    fechaAprobacion: null,
    metodoPago: 'FUNDAE',
    importe: 3600,
    documentacionCompleta: true,
    observaciones: 'Pendiente aprobación de la beca.',
  },
  {
    id: '6',
    alumno: {
      nombre: 'Pedro Sánchez López',
      email: 'pedro.sanchez@email.com',
      telefono: '+34 612 345 006',
    },
    curso: 'Community Manager',
    tipo: 'Curso',
    convocatoria: 'ENE-2026-NORTE',
    sede: 'CEP Norte',
    estado: 'aceptada',
    fechaSolicitud: '2024-11-21',
    fechaAprobacion: '2024-11-23',
    metodoPago: 'Privado',
    importe: 900,
    documentacionCompleta: true,
    observaciones: 'Pago completo recibido.',
  },
  {
    id: '7',
    alumno: {
      nombre: 'Elena Torres Ruiz',
      email: 'elena.torres@email.com',
      telefono: '+34 612 345 007',
    },
    curso: 'ASIR - Administración Sistemas Informáticos',
    tipo: 'Ciclo Superior',
    convocatoria: 'SEPT-2025-SUR',
    sede: 'CEP Sur',
    estado: 'aceptada',
    fechaSolicitud: '2024-11-17',
    fechaAprobacion: '2024-11-19',
    metodoPago: 'Financiación',
    importe: 3600,
    documentacionCompleta: true,
    observaciones: 'Financiación aprobada. Primera cuota pagada.',
  },
]

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-800', bgColor: 'bg-amber-100', icon: Clock },
  aceptada: { label: 'Aceptada', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle2 },
  rechazada: { label: 'Rechazada', color: 'text-red-800', bgColor: 'bg-red-100', icon: XCircle },
}

const pagoConfig: Record<string, { label: string; color: string }> = {
  FUNDAE: { label: 'FUNDAE', color: 'text-blue-700 bg-blue-50' },
  Privado: { label: 'Privado', color: 'text-purple-700 bg-purple-50' },
  Financiación: { label: 'Financiación', color: 'text-emerald-700 bg-emerald-50' },
}

export default function MatriculasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [tipoFilter, setTipoFilter] = useState('todos')

  const filteredMatriculas = matriculasData.filter((m) => {
    const matchesSearch =
      m.alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.alumno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.curso.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = estadoFilter === 'todos' || m.estado === estadoFilter
    const matchesSede = sedeFilter === 'todas' || m.sede === sedeFilter
    const matchesTipo = tipoFilter === 'todos' || m.tipo === tipoFilter
    return matchesSearch && matchesEstado && matchesSede && matchesTipo
  })

  const stats = {
    total: matriculasData.length,
    pendientes: matriculasData.filter((m) => m.estado === 'pendiente').length,
    aceptadas: matriculasData.filter((m) => m.estado === 'aceptada').length,
    rechazadas: matriculasData.filter((m) => m.estado === 'rechazada').length,
    ingresosTotales: matriculasData.filter((m) => m.estado === 'aceptada').reduce((sum, m) => sum + m.importe, 0),
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matrículas</h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de matrícula y seguimiento de inscripciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button style={{ backgroundColor: '#F2014B' }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nueva Matrícula
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">este periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
            <p className="text-xs text-muted-foreground">requieren revisión</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aceptadas}</div>
            <p className="text-xs text-muted-foreground">matrículas confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazadas}</div>
            <p className="text-xs text-muted-foreground">no aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.ingresosTotales.toLocaleString('es-ES')}€
            </div>
            <p className="text-xs text-muted-foreground">matrículas aceptadas</p>
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
                placeholder="Buscar por alumno, email o curso..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aceptada">Aceptada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="CEP Norte">CEP Norte</SelectItem>
                <SelectItem value="CEP Santa Cruz">CEP Santa Cruz</SelectItem>
                <SelectItem value="CEP Sur">CEP Sur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Curso">Cursos</SelectItem>
                <SelectItem value="Ciclo Superior">Ciclos Superiores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de matrículas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" style={{ color: '#F2014B' }} />
            Solicitudes de Matrícula ({filteredMatriculas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Curso/Ciclo</TableHead>
                <TableHead>Convocatoria</TableHead>
                <TableHead>Método Pago</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatriculas.map((matricula) => {
                const config = estadoConfig[matricula.estado]
                const StatusIcon = config.icon
                const pagoInfo = pagoConfig[matricula.metodoPago]
                return (
                  <TableRow key={matricula.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{matricula.alumno.nombre}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {matricula.alumno.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{matricula.curso}</span>
                        <Badge variant="outline" className="w-fit mt-1">
                          {matricula.tipo === 'Ciclo Superior' ? (
                            <GraduationCap className="h-3 w-3 mr-1" />
                          ) : (
                            <BookOpen className="h-3 w-3 mr-1" />
                          )}
                          {matricula.tipo}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{matricula.convocatoria}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {matricula.sede}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={pagoInfo.color}>{pagoInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{matricula.importe.toLocaleString('es-ES')}€</span>
                    </TableCell>
                    <TableCell>
                      {matricula.documentacionCompleta ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${config.bgColor} ${config.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver documentación
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {matricula.estado === 'pendiente' && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Aprobar matrícula
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Rechazar matrícula
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumen por método de pago */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(pagoConfig).map(([key, value]) => {
                const count = matriculasData.filter((m) => m.metodoPago === key && m.estado === 'aceptada').length
                const total = matriculasData.filter((m) => m.metodoPago === key && m.estado === 'aceptada').reduce((sum, m) => sum + m.importe, 0)
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Badge className={value.color}>{value.label}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{total.toLocaleString('es-ES')}€</p>
                      <p className="text-xs text-muted-foreground">{count} matrículas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Sede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['CEP Norte', 'CEP Santa Cruz', 'CEP Sur'].map((sede) => {
                const count = matriculasData.filter((m) => m.sede === sede).length
                const aceptadas = matriculasData.filter((m) => m.sede === sede && m.estado === 'aceptada').length
                return (
                  <div key={sede} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{sede}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{aceptadas}/{count}</p>
                      <p className="text-xs text-muted-foreground">aceptadas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Tipo de Formación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Curso', 'Ciclo Superior'].map((tipo) => {
                const count = matriculasData.filter((m) => m.tipo === tipo).length
                const total = matriculasData.filter((m) => m.tipo === tipo && m.estado === 'aceptada').reduce((sum, m) => sum + m.importe, 0)
                return (
                  <div key={tipo} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      {tipo === 'Ciclo Superior' ? (
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{tipo}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{total.toLocaleString('es-ES')}€</p>
                      <p className="text-xs text-muted-foreground">{count} solicitudes</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
