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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@payload-config/components/ui/dialog'
import { Label } from '@payload-config/components/ui/label'
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  Shield,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
  UserPlus,
  Download,
  Upload,
  Lock,
  Unlock,
  History,
  User,
} from 'lucide-react'

// Mock data de usuarios
const usuariosData = [
  {
    id: '1',
    nombre: 'Carlos Pérez',
    email: 'admin@cepformacion.com',
    telefono: '+34 612 345 001',
    rol: 'Admin',
    sede: 'Todas',
    activo: true,
    verificado: true,
    dosFactor: true,
    ultimoAcceso: '2024-12-07 10:30',
    fechaCreacion: '2024-01-15',
  },
  {
    id: '2',
    nombre: 'María García López',
    email: 'maria.garcia@cepformacion.com',
    telefono: '+34 612 345 002',
    rol: 'Gestor',
    sede: 'CEP Norte',
    activo: true,
    verificado: true,
    dosFactor: true,
    ultimoAcceso: '2024-12-07 09:15',
    fechaCreacion: '2024-03-20',
  },
  {
    id: '3',
    nombre: 'Juan Martínez Ruiz',
    email: 'juan.martinez@cepformacion.com',
    telefono: '+34 612 345 003',
    rol: 'Marketing',
    sede: 'CEP Santa Cruz',
    activo: true,
    verificado: true,
    dosFactor: false,
    ultimoAcceso: '2024-12-06 18:30',
    fechaCreacion: '2024-05-10',
  },
  {
    id: '4',
    nombre: 'Ana Rodríguez Sánchez',
    email: 'ana.rodriguez@cepformacion.com',
    telefono: '+34 612 345 004',
    rol: 'Asesor',
    sede: 'CEP Norte',
    activo: true,
    verificado: true,
    dosFactor: false,
    ultimoAcceso: '2024-12-07 10:45',
    fechaCreacion: '2024-06-01',
  },
  {
    id: '5',
    nombre: 'Carlos Fernández Torres',
    email: 'carlos.fernandez@cepformacion.com',
    telefono: '+34 612 345 005',
    rol: 'Asesor',
    sede: 'CEP Sur',
    activo: false,
    verificado: true,
    dosFactor: false,
    ultimoAcceso: '2024-11-28 14:20',
    fechaCreacion: '2024-04-15',
  },
  {
    id: '6',
    nombre: 'Laura Pérez Gómez',
    email: 'laura.perez@cepformacion.com',
    telefono: '+34 612 345 006',
    rol: 'Lectura',
    sede: 'CEP Santa Cruz',
    activo: true,
    verificado: false,
    dosFactor: false,
    ultimoAcceso: '2024-12-05 16:00',
    fechaCreacion: '2024-11-20',
  },
  {
    id: '7',
    nombre: 'Pedro Sánchez López',
    email: 'pedro.sanchez@cepformacion.com',
    telefono: '+34 612 345 007',
    rol: 'Gestor',
    sede: 'CEP Norte',
    activo: true,
    verificado: true,
    dosFactor: true,
    ultimoAcceso: '2024-12-07 08:30',
    fechaCreacion: '2024-02-10',
  },
  {
    id: '8',
    nombre: 'Elena Torres Ruiz',
    email: 'elena.torres@cepformacion.com',
    telefono: '+34 612 345 008',
    rol: 'Marketing',
    sede: 'Todas',
    activo: true,
    verificado: true,
    dosFactor: true,
    ultimoAcceso: '2024-12-06 17:45',
    fechaCreacion: '2024-07-01',
  },
]

const rolConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  Admin: { color: 'text-red-800', bgColor: 'bg-red-100', icon: <Shield className="h-3 w-3" /> },
  Gestor: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: <Users className="h-3 w-3" /> },
  Marketing: { color: 'text-purple-800', bgColor: 'bg-purple-100', icon: <Users className="h-3 w-3" /> },
  Asesor: { color: 'text-amber-800', bgColor: 'bg-amber-100', icon: <User className="h-3 w-3" /> },
  Lectura: { color: 'text-gray-800', bgColor: 'bg-gray-100', icon: <Eye className="h-3 w-3" /> },
}

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredUsuarios = usuariosData.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRol = rolFilter === 'todos' || usuario.rol === rolFilter
    const matchesSede = sedeFilter === 'todas' || usuario.sede === sedeFilter || usuario.sede === 'Todas'
    const matchesEstado =
      estadoFilter === 'todos' ||
      (estadoFilter === 'activo' && usuario.activo) ||
      (estadoFilter === 'inactivo' && !usuario.activo)
    return matchesSearch && matchesRol && matchesSede && matchesEstado
  })

  const estadisticas = {
    total: usuariosData.length,
    activos: usuariosData.filter((u) => u.activo).length,
    con2FA: usuariosData.filter((u) => u.dosFactor).length,
    pendientesVerificacion: usuariosData.filter((u) => !u.verificado).length,
  }

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios y control de acceso
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#F2014B' }}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Añade un nuevo usuario al sistema. Se enviará un email de verificación automáticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre completo</Label>
                    <Input id="nombre" placeholder="Nombre Apellidos" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="usuario@academia.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="asesor">Asesor</SelectItem>
                        <SelectItem value="lectura">Lectura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sede">Sede</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las sedes</SelectItem>
                        <SelectItem value="norte">CEP Norte</SelectItem>
                        <SelectItem value="santacruz">CEP Santa Cruz</SelectItem>
                        <SelectItem value="sur">CEP Sur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input id="telefono" placeholder="+34 600 000 000" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setDialogOpen(false)} style={{ backgroundColor: '#F2014B' }}>
                  Crear Usuario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-xs text-muted-foreground">en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
            <p className="text-xs text-muted-foreground">con acceso habilitado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con 2FA</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estadisticas.con2FA}</div>
            <p className="text-xs text-muted-foreground">autenticación doble</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{estadisticas.pendientesVerificacion}</div>
            <p className="text-xs text-muted-foreground">sin verificar email</p>
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
                <SelectItem value="Admin">Admin</SelectItem>
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
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: '#F2014B' }} />
            Listado de Usuarios ({filteredUsuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                      <Badge className={`${config.bgColor} ${config.color} hover:${config.bgColor} flex items-center gap-1 w-fit`}>
                        {config.icon}
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
                      {usuario.dosFactor ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <Lock className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Unlock className="h-3 w-3 mr-1" />
                          No
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="mr-2 h-4 w-4" />
                            Resetear contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="mr-2 h-4 w-4" />
                            Ver actividad
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {usuario.activo ? (
                            <DropdownMenuItem className="text-amber-600">
                              <XCircle className="mr-2 h-4 w-4" />
                              Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Activar
                            </DropdownMenuItem>
                          )}
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

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(rolConfig).map(([rol, config]) => {
              const count = usuariosData.filter((u) => u.rol === rol).length
              return (
                <div key={rol} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-medium">{rol}</p>
                    <p className="text-sm text-muted-foreground">{count} usuarios</p>
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
