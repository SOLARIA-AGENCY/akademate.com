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
  ListTodo,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Download,
  ArrowUp,
  ArrowDown,
  Bell,
  Send,
  User,
  GraduationCap,
  AlertCircle,
  UserCheck,
} from 'lucide-react'

// Mock data de lista de espera
const listaEsperaData = [
  {
    id: '1',
    posicion: 1,
    alumno: {
      nombre: 'Sofía Martínez Pérez',
      email: 'sofia.martinez@email.com',
      telefono: '+34 612 345 101',
    },
    curso: 'DAW - Desarrollo Aplicaciones Web',
    tipo: 'Ciclo Superior',
    convocatoria: 'SEPT-2025-NORTE',
    sede: 'CEP Norte',
    prioridad: 'alta',
    estado: 'en_lista',
    fechaEntrada: '2024-11-15',
    plazasDelante: 0,
    ultimoContacto: '2024-12-05',
    notas: 'Muy interesada. Disponibilidad inmediata.',
  },
  {
    id: '2',
    posicion: 2,
    alumno: {
      nombre: 'David González Ruiz',
      email: 'david.gonzalez@email.com',
      telefono: '+34 612 345 102',
    },
    curso: 'Marketing Digital Avanzado',
    tipo: 'Curso',
    convocatoria: 'ENE-2026-NORTE',
    sede: 'CEP Norte',
    prioridad: 'media',
    estado: 'notificado',
    fechaEntrada: '2024-11-18',
    plazasDelante: 1,
    ultimoContacto: '2024-12-06',
    notas: 'Notificado de plaza disponible. Esperando confirmación.',
  },
  {
    id: '3',
    posicion: 3,
    alumno: {
      nombre: 'Isabel Fernández López',
      email: 'isabel.fernandez@email.com',
      telefono: '+34 612 345 103',
    },
    curso: 'Community Manager',
    tipo: 'Curso',
    convocatoria: 'FEB-2026-SCTF',
    sede: 'CEP Santa Cruz',
    prioridad: 'alta',
    estado: 'en_lista',
    fechaEntrada: '2024-11-20',
    plazasDelante: 2,
    ultimoContacto: '2024-12-01',
    notas: 'Exalumna. Prioridad por fidelización.',
  },
  {
    id: '4',
    posicion: 4,
    alumno: {
      nombre: 'Miguel Ángel Sánchez',
      email: 'miguel.sanchez@email.com',
      telefono: '+34 612 345 104',
    },
    curso: 'DAM - Desarrollo Aplicaciones Multiplataforma',
    tipo: 'Ciclo Superior',
    convocatoria: 'SEPT-2025-SCTF',
    sede: 'CEP Santa Cruz',
    prioridad: 'baja',
    estado: 'en_lista',
    fechaEntrada: '2024-11-22',
    plazasDelante: 5,
    ultimoContacto: null,
    notas: 'Opción secundaria. También interesado en DAW.',
  },
  {
    id: '5',
    posicion: 5,
    alumno: {
      nombre: 'Carmen Rodríguez Torres',
      email: 'carmen.rodriguez@email.com',
      telefono: '+34 612 345 105',
    },
    curso: 'Diseño UX/UI',
    tipo: 'Curso',
    convocatoria: 'MAR-2026-NORTE',
    sede: 'CEP Norte',
    prioridad: 'media',
    estado: 'aceptado',
    fechaEntrada: '2024-11-16',
    plazasDelante: 0,
    ultimoContacto: '2024-12-07',
    notas: 'Plaza asignada. Proceso de matrícula iniciado.',
  },
  {
    id: '6',
    posicion: 6,
    alumno: {
      nombre: 'Roberto Díaz Martín',
      email: 'roberto.diaz@email.com',
      telefono: '+34 612 345 106',
    },
    curso: 'Ciberseguridad',
    tipo: 'Curso',
    convocatoria: 'ENE-2026-SUR',
    sede: 'CEP Sur',
    prioridad: 'alta',
    estado: 'en_lista',
    fechaEntrada: '2024-11-19',
    plazasDelante: 3,
    ultimoContacto: '2024-11-25',
    notas: 'Urgente por requisitos laborales.',
  },
  {
    id: '7',
    posicion: 7,
    alumno: {
      nombre: 'Patricia Ruiz García',
      email: 'patricia.ruiz@email.com',
      telefono: '+34 612 345 107',
    },
    curso: 'Big Data y Business Intelligence',
    tipo: 'Curso',
    convocatoria: 'FEB-2026-NORTE',
    sede: 'CEP Norte',
    prioridad: 'media',
    estado: 'rechazado',
    fechaEntrada: '2024-11-17',
    plazasDelante: 0,
    ultimoContacto: '2024-12-04',
    notas: 'Rechazó plaza por incompatibilidad horaria.',
  },
]

const prioridadConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  alta: { label: 'Alta', color: 'text-red-800', bgColor: 'bg-red-100' },
  media: { label: 'Media', color: 'text-amber-800', bgColor: 'bg-amber-100' },
  baja: { label: 'Baja', color: 'text-gray-800', bgColor: 'bg-gray-100' },
}

const estadoConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  en_lista: { label: 'En Lista', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: Clock },
  notificado: { label: 'Notificado', color: 'text-amber-800', bgColor: 'bg-amber-100', icon: Bell },
  aceptado: { label: 'Aceptado', color: 'text-green-800', bgColor: 'bg-green-100', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: 'text-gray-800', bgColor: 'bg-gray-100', icon: AlertCircle },
}

export default function ListaEsperaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [prioridadFilter, setPrioridadFilter] = useState('todas')
  const [sedeFilter, setSedeFilter] = useState('todas')

  const filteredLista = listaEsperaData.filter((item) => {
    const matchesSearch =
      item.alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alumno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.curso.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = estadoFilter === 'todos' || item.estado === estadoFilter
    const matchesPrioridad = prioridadFilter === 'todas' || item.prioridad === prioridadFilter
    const matchesSede = sedeFilter === 'todas' || item.sede === sedeFilter
    return matchesSearch && matchesEstado && matchesPrioridad && matchesSede
  })

  const stats = {
    total: listaEsperaData.length,
    enLista: listaEsperaData.filter((i) => i.estado === 'en_lista').length,
    notificados: listaEsperaData.filter((i) => i.estado === 'notificado').length,
    aceptados: listaEsperaData.filter((i) => i.estado === 'aceptado').length,
    altaPrioridad: listaEsperaData.filter((i) => i.prioridad === 'alta' && i.estado === 'en_lista').length,
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista de Espera</h1>
          <p className="text-muted-foreground">
            Gestión de alumnos en espera para cursos con plazas completas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button style={{ backgroundColor: '#F2014B' }}>
            <Plus className="mr-2 h-4 w-4" />
            Añadir a Lista
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total en Espera</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">personas en cola</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esperando Plaza</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enLista}</div>
            <p className="text-xs text-muted-foreground">activos en lista</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificados</CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.notificados}</div>
            <p className="text-xs text-muted-foreground">esperando respuesta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aceptados}</div>
            <p className="text-xs text-muted-foreground">a matrícula</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridad</CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.altaPrioridad}</div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
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
                placeholder="Buscar por nombre, email o curso..."
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
                <SelectItem value="en_lista">En Lista</SelectItem>
                <SelectItem value="notificado">Notificado</SelectItem>
                <SelectItem value="aceptado">Aceptado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lista de espera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" style={{ color: '#F2014B' }} />
            Cola de Espera ({filteredLista.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Curso/Ciclo</TableHead>
                <TableHead>Convocatoria</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Delante</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLista.map((item) => {
                const prioridadInfo = prioridadConfig[item.prioridad]
                const estadoInfo = estadoConfig[item.estado]
                const StatusIcon = estadoInfo.icon
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {item.posicion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.alumno.nombre}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {item.alumno.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.curso}</span>
                        <Badge variant="outline" className="w-fit mt-1">
                          {item.tipo === 'Ciclo Superior' ? (
                            <GraduationCap className="h-3 w-3 mr-1" />
                          ) : (
                            <BookOpen className="h-3 w-3 mr-1" />
                          )}
                          {item.tipo}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{item.convocatoria}</span>
                        <span className="text-xs text-muted-foreground">{item.sede}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${prioridadInfo.bgColor} ${prioridadInfo.color}`}>
                        {item.prioridad === 'alta' && <ArrowUp className="h-3 w-3 mr-1" />}
                        {item.prioridad === 'baja' && <ArrowDown className="h-3 w-3 mr-1" />}
                        {prioridadInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">{item.plazasDelante}</span>
                      <span className="text-xs text-muted-foreground ml-1">personas</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${estadoInfo.bgColor} ${estadoInfo.color} flex items-center gap-1 w-fit`}>
                        <StatusIcon className="h-3 w-3" />
                        {estadoInfo.label}
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
                            <Phone className="mr-2 h-4 w-4" />
                            Llamar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar notificación
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.estado === 'en_lista' && (
                            <DropdownMenuItem>
                              <ArrowUp className="mr-2 h-4 w-4" />
                              Subir prioridad
                            </DropdownMenuItem>
                          )}
                          {item.estado === 'notificado' && (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Convertir a matrícula
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar de lista
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

      {/* Resúmenes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cursos con Mayor Demanda</CardTitle>
            <CardDescription>Cursos con más personas en lista de espera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { curso: 'DAW - Desarrollo Aplicaciones Web', espera: 4 },
                { curso: 'Marketing Digital Avanzado', espera: 3 },
                { curso: 'Community Manager', espera: 2 },
                { curso: 'DAM - Desarrollo Apps Multiplataforma', espera: 2 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="font-medium text-sm">{item.curso}</span>
                  <Badge variant="outline">{item.espera} en espera</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones Pendientes</CardTitle>
            <CardDescription>Tareas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">1 respuesta pendiente</p>
                  <p className="text-sm text-amber-800">David González - esperando confirmación</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                <ArrowUp className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">3 alta prioridad</p>
                  <p className="text-sm text-red-800">Requieren seguimiento urgente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
                <Send className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">2 sin contactar</p>
                  <p className="text-sm text-blue-800">Sin contacto en más de 7 días</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
