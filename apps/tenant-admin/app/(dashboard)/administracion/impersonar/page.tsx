'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@payload-config/components/ui/alert-dialog'
import {
  Search,
  UserCog,
  Shield,
  Eye,
  LogIn,
  AlertTriangle,
  Clock,
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
  History,
  User,
  Users,
} from 'lucide-react'

// Mock data de usuarios para impersonar
const usuariosData = [
  {
    id: '1',
    nombre: 'María García López',
    email: 'maria.garcia@cepformacion.com',
    rol: 'Gestor',
    sede: 'CEP Norte',
    activo: true,
    ultimoAcceso: '2024-12-07 09:15',
    avatar: null,
  },
  {
    id: '2',
    nombre: 'Juan Martínez Ruiz',
    email: 'juan.martinez@cepformacion.com',
    rol: 'Marketing',
    sede: 'CEP Santa Cruz',
    activo: true,
    ultimoAcceso: '2024-12-06 18:30',
    avatar: null,
  },
  {
    id: '3',
    nombre: 'Ana Rodríguez Sánchez',
    email: 'ana.rodriguez@cepformacion.com',
    rol: 'Asesor',
    sede: 'CEP Norte',
    activo: true,
    ultimoAcceso: '2024-12-07 10:45',
    avatar: null,
  },
  {
    id: '4',
    nombre: 'Carlos Fernández Torres',
    email: 'carlos.fernandez@cepformacion.com',
    rol: 'Asesor',
    sede: 'CEP Sur',
    activo: false,
    ultimoAcceso: '2024-11-28 14:20',
    avatar: null,
  },
  {
    id: '5',
    nombre: 'Laura Pérez Gómez',
    email: 'laura.perez@cepformacion.com',
    rol: 'Lectura',
    sede: 'CEP Santa Cruz',
    activo: true,
    ultimoAcceso: '2024-12-05 16:00',
    avatar: null,
  },
  {
    id: '6',
    nombre: 'Pedro Sánchez López',
    email: 'pedro.sanchez@cepformacion.com',
    rol: 'Gestor',
    sede: 'CEP Norte',
    activo: true,
    ultimoAcceso: '2024-12-07 08:30',
    avatar: null,
  },
]

// Historial de impersonaciones
const historialImpersonaciones = [
  {
    id: '1',
    adminNombre: 'Admin Principal',
    usuarioImpersonado: 'María García López',
    fechaInicio: '2024-12-07 09:00',
    fechaFin: '2024-12-07 09:15',
    duracion: '15 min',
    motivo: 'Verificación de permisos de sede',
    ip: '192.168.1.100',
  },
  {
    id: '2',
    adminNombre: 'Admin Principal',
    usuarioImpersonado: 'Juan Martínez Ruiz',
    fechaInicio: '2024-12-06 14:30',
    fechaFin: '2024-12-06 14:45',
    duracion: '15 min',
    motivo: 'Soporte técnico - Error en campañas',
    ip: '192.168.1.100',
  },
  {
    id: '3',
    adminNombre: 'Admin Principal',
    usuarioImpersonado: 'Ana Rodríguez Sánchez',
    fechaInicio: '2024-12-05 11:00',
    fechaFin: '2024-12-05 11:20',
    duracion: '20 min',
    motivo: 'Verificación de vista de leads',
    ip: '192.168.1.100',
  },
  {
    id: '4',
    adminNombre: 'Admin Principal',
    usuarioImpersonado: 'Laura Pérez Gómez',
    fechaInicio: '2024-12-04 16:00',
    fechaFin: '2024-12-04 16:10',
    duracion: '10 min',
    motivo: 'Prueba de permisos de solo lectura',
    ip: '192.168.1.100',
  },
]

const rolConfig: Record<string, { color: string; bgColor: string }> = {
  Admin: { color: 'text-red-800', bgColor: 'bg-red-100' },
  Gestor: { color: 'text-blue-800', bgColor: 'bg-blue-100' },
  Marketing: { color: 'text-purple-800', bgColor: 'bg-purple-100' },
  Asesor: { color: 'text-amber-800', bgColor: 'bg-amber-100' },
  Lectura: { color: 'text-gray-800', bgColor: 'bg-gray-100' },
}

export default function ImpersonarPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [selectedUser, setSelectedUser] = useState<typeof usuariosData[0] | null>(null)

  const filteredUsuarios = usuariosData.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRol = rolFilter === 'todos' || usuario.rol === rolFilter
    const matchesSede = sedeFilter === 'todas' || usuario.sede === sedeFilter
    return matchesSearch && matchesRol && matchesSede
  })

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impersonar Usuario</h1>
          <p className="text-muted-foreground">
            Accede al sistema como otro usuario para soporte y verificación
          </p>
        </div>
      </div>

      {/* Warning Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-amber-900">Advertencia de Seguridad</h4>
              <p className="text-sm text-amber-800">
                La impersonación permite acceder al sistema con los permisos de otro usuario.
                Esta funcionalidad está diseñada exclusivamente para:
              </p>
              <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                <li>Soporte técnico y resolución de incidencias</li>
                <li>Verificación de permisos y configuraciones</li>
                <li>Pruebas de funcionalidad desde diferentes roles</li>
              </ul>
              <p className="text-sm text-amber-800 font-medium">
                Todas las acciones realizadas durante la impersonación quedan registradas
                en el log de auditoría con el identificador del administrador original.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usuariosData.filter((u) => u.activo).length}
            </div>
            <p className="text-xs text-muted-foreground">de {usuariosData.length} totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impersonaciones Hoy</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">sesiones de soporte</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 min</div>
            <p className="text-xs text-muted-foreground">por sesión</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">impersonaciones totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" style={{ color: '#F2014B' }} />
            Seleccionar Usuario
          </CardTitle>
          <CardDescription>
            Busca y selecciona el usuario que deseas impersonar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={rolFilter} onValueChange={setRolFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Asesor">Asesor</SelectItem>
                <SelectItem value="Lectura">Lectura</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sedes</SelectItem>
                <SelectItem value="CEP Norte">CEP Norte</SelectItem>
                <SelectItem value="CEP Santa Cruz">CEP Santa Cruz</SelectItem>
                <SelectItem value="CEP Sur">CEP Sur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de usuarios */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => {
                const config = rolConfig[usuario.rol]
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{usuario.nombre}</span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${config.bgColor} ${config.color} hover:${config.bgColor}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {usuario.sede}
                      </span>
                    </TableCell>
                    <TableCell>
                      {usuario.activo ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {usuario.ultimoAcceso}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!usuario.activo}
                            onClick={() => setSelectedUser(usuario)}
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Impersonar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              Confirmar Impersonación
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-4">
                                <p>
                                  Vas a acceder al sistema como <strong>{usuario.nombre}</strong> ({usuario.rol}).
                                </p>
                                <div className="bg-muted p-4 rounded-lg space-y-2">
                                  <p className="text-sm font-medium">Durante la impersonación:</p>
                                  <ul className="text-sm list-disc list-inside space-y-1">
                                    <li>Tendrás los mismos permisos que este usuario</li>
                                    <li>Todas tus acciones quedarán registradas</li>
                                    <li>El usuario original NO será notificado</li>
                                    <li>Podrás finalizar la sesión en cualquier momento</li>
                                  </ul>
                                </div>
                                <Input placeholder="Motivo de la impersonación (obligatorio)" />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="text-white"
                              style={{ backgroundColor: '#F2014B' }}
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Iniciar Impersonación
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historial de impersonaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" style={{ color: '#F2014B' }} />
            Historial de Impersonaciones
          </CardTitle>
          <CardDescription>
            Registro de todas las sesiones de impersonación realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Usuario Impersonado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historialImpersonaciones.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="font-medium">{registro.adminNombre}</TableCell>
                  <TableCell>{registro.usuarioImpersonado}</TableCell>
                  <TableCell className="text-sm">{registro.fechaInicio}</TableCell>
                  <TableCell className="text-sm">{registro.fechaFin}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{registro.duracion}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={registro.motivo}>
                    {registro.motivo}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{registro.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
