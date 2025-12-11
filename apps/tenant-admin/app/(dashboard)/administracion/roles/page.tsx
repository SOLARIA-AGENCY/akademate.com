'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Switch } from '@payload-config/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@payload-config/components/ui/tabs'
import {
  Shield,
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  BookOpen,
  GraduationCap,
  Building2,
  FileText,
  Megaphone,
  BarChart3,
  Settings,
  User,
  Lock,
  Unlock,
  Info,
} from 'lucide-react'

// Definición de roles del sistema
const rolesData = [
  {
    id: 'admin',
    nombre: 'Admin',
    descripcion: 'Acceso total al sistema. Puede gestionar todos los aspectos incluyendo usuarios, configuración y facturación.',
    usuarios: 2,
    color: 'bg-red-100 text-red-800',
    icon: Shield,
    editable: false,
  },
  {
    id: 'gestor',
    nombre: 'Gestor',
    descripcion: 'Gestiona contenido académico, cursos, ciclos y convocatorias. No accede a facturación ni configuración avanzada.',
    usuarios: 3,
    color: 'bg-blue-100 text-blue-800',
    icon: Users,
    editable: true,
  },
  {
    id: 'marketing',
    nombre: 'Marketing',
    descripcion: 'Acceso a campañas, leads, creatividades y analíticas. No puede modificar contenido académico.',
    usuarios: 2,
    color: 'bg-purple-100 text-purple-800',
    icon: Megaphone,
    editable: true,
  },
  {
    id: 'asesor',
    nombre: 'Asesor',
    descripcion: 'Gestiona leads asignados, matrículas y seguimiento de alumnos potenciales.',
    usuarios: 2,
    color: 'bg-amber-100 text-amber-800',
    icon: User,
    editable: true,
  },
  {
    id: 'lectura',
    nombre: 'Lectura',
    descripcion: 'Solo puede visualizar información. No puede crear, editar ni eliminar ningún registro.',
    usuarios: 1,
    color: 'bg-gray-100 text-gray-800',
    icon: Eye,
    editable: true,
  },
]

// Matriz de permisos
const permisosMatrix = {
  modulos: [
    { id: 'dashboard', nombre: 'Dashboard', icon: BarChart3 },
    { id: 'cursos', nombre: 'Cursos', icon: BookOpen },
    { id: 'ciclos', nombre: 'Ciclos', icon: GraduationCap },
    { id: 'sedes', nombre: 'Sedes', icon: Building2 },
    { id: 'leads', nombre: 'Leads', icon: FileText },
    { id: 'campanas', nombre: 'Campañas', icon: Megaphone },
    { id: 'analiticas', nombre: 'Analíticas', icon: BarChart3 },
    { id: 'usuarios', nombre: 'Usuarios', icon: Users },
    { id: 'configuracion', nombre: 'Configuración', icon: Settings },
  ],
  acciones: ['Ver', 'Crear', 'Editar', 'Eliminar'],
  permisos: {
    admin: {
      dashboard: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      cursos: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      ciclos: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      sedes: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      leads: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      campanas: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      analiticas: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      usuarios: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      configuracion: ['Ver', 'Crear', 'Editar', 'Eliminar'],
    },
    gestor: {
      dashboard: ['Ver'],
      cursos: ['Ver', 'Crear', 'Editar'],
      ciclos: ['Ver', 'Crear', 'Editar'],
      sedes: ['Ver'],
      leads: ['Ver'],
      campanas: [],
      analiticas: ['Ver'],
      usuarios: [],
      configuracion: [],
    },
    marketing: {
      dashboard: ['Ver'],
      cursos: ['Ver'],
      ciclos: ['Ver'],
      sedes: ['Ver'],
      leads: ['Ver', 'Crear', 'Editar'],
      campanas: ['Ver', 'Crear', 'Editar', 'Eliminar'],
      analiticas: ['Ver'],
      usuarios: [],
      configuracion: [],
    },
    asesor: {
      dashboard: ['Ver'],
      cursos: ['Ver'],
      ciclos: ['Ver'],
      sedes: ['Ver'],
      leads: ['Ver', 'Editar'],
      campanas: [],
      analiticas: [],
      usuarios: [],
      configuracion: [],
    },
    lectura: {
      dashboard: ['Ver'],
      cursos: ['Ver'],
      ciclos: ['Ver'],
      sedes: ['Ver'],
      leads: ['Ver'],
      campanas: ['Ver'],
      analiticas: ['Ver'],
      usuarios: [],
      configuracion: [],
    },
  } as Record<string, Record<string, string[]>>,
}

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState('admin')

  const selectedRoleData = rolesData.find((r) => r.id === selectedRole)
  const selectedPermisos = permisosMatrix.permisos[selectedRole] || {}

  return (
    <div className="space-y-6">
      <MockDataIndicator />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Sistema de control de acceso basado en roles (RBAC)
          </p>
        </div>
        <Button style={{ backgroundColor: '#F2014B' }}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Rol Personalizado
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900">Sistema de Permisos Granular</h4>
              <p className="text-sm text-blue-800">
                Los permisos se heredan jerárquicamente: Admin {'>'} Gestor {'>'} Marketing {'>'} Asesor {'>'} Lectura.
                Los roles del sistema no pueden eliminarse, pero puedes crear roles personalizados con permisos específicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Roles */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: '#F2014B' }} />
              Roles del Sistema
            </CardTitle>
            <CardDescription>Selecciona un rol para ver sus permisos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rolesData.map((rol) => {
              const Icon = rol.icon
              return (
                <button
                  key={rol.id}
                  onClick={() => setSelectedRole(rol.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedRole === rol.id
                      ? 'bg-primary/10 border-2'
                      : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
                  }`}
                  style={selectedRole === rol.id ? { borderColor: '#F2014B' } : undefined}
                >
                  <div className={`h-10 w-10 rounded-full ${rol.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rol.nombre}</p>
                      {!rol.editable && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rol.usuarios} usuarios</p>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Detalles del Rol */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedRoleData && (
                  <>
                    <div className={`h-12 w-12 rounded-full ${selectedRoleData.color} flex items-center justify-center`}>
                      <selectedRoleData.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{selectedRoleData.nombre}</CardTitle>
                      <CardDescription>{selectedRoleData.descripcion}</CardDescription>
                    </div>
                  </>
                )}
              </div>
              {selectedRoleData?.editable && (
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Rol
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="matriz" className="space-y-4">
              <TabsList>
                <TabsTrigger value="matriz">Matriz de Permisos</TabsTrigger>
                <TabsTrigger value="usuarios">Usuarios con este Rol</TabsTrigger>
              </TabsList>

              <TabsContent value="matriz" className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        {permisosMatrix.acciones.map((accion) => (
                          <TableHead key={accion} className="text-center w-[100px]">
                            {accion}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permisosMatrix.modulos.map((modulo) => {
                        const Icon = modulo.icon
                        const moduloPermisos = selectedPermisos[modulo.id] || []
                        return (
                          <TableRow key={modulo.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{modulo.nombre}</span>
                              </div>
                            </TableCell>
                            {permisosMatrix.acciones.map((accion) => {
                              const tienePermiso = moduloPermisos.includes(accion)
                              return (
                                <TableCell key={accion} className="text-center">
                                  {selectedRoleData?.editable ? (
                                    <Switch
                                      checked={tienePermiso}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                  ) : tienePermiso ? (
                                    <div className="flex justify-center">
                                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <Check className="h-4 w-4 text-green-600" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                        <X className="h-4 w-4 text-gray-400" />
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {selectedRoleData?.editable && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancelar Cambios</Button>
                    <Button style={{ backgroundColor: '#F2014B' }}>
                      Guardar Permisos
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="usuarios" className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Sede</TableHead>
                        <TableHead>Último Acceso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRole === 'admin' && (
                        <>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">Carlos Pérez</p>
                                  <p className="text-sm text-muted-foreground">admin@cepformacion.com</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>Todas</TableCell>
                            <TableCell className="text-muted-foreground">Hoy 10:30</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      {selectedRole === 'gestor' && (
                        <>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">María García López</p>
                                  <p className="text-sm text-muted-foreground">maria.garcia@cepformacion.com</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>CEP Norte</TableCell>
                            <TableCell className="text-muted-foreground">Hoy 09:15</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium">Pedro Sánchez López</p>
                                  <p className="text-sm text-muted-foreground">pedro.sanchez@cepformacion.com</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>CEP Norte</TableCell>
                            <TableCell className="text-muted-foreground">Hoy 08:30</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      {(selectedRole !== 'admin' && selectedRole !== 'gestor') && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {selectedRoleData?.usuarios} usuarios tienen este rol asignado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Comparativa de Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa Rápida de Roles</CardTitle>
          <CardDescription>Resumen de accesos por rol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capacidad</TableHead>
                  {rolesData.map((rol) => (
                    <TableHead key={rol.id} className="text-center">
                      <Badge className={rol.color}>{rol.nombre}</Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { cap: 'Gestionar cursos y ciclos', perms: [true, true, false, false, false] },
                  { cap: 'Gestionar leads', perms: [true, false, true, true, false] },
                  { cap: 'Crear campañas', perms: [true, false, true, false, false] },
                  { cap: 'Ver analíticas', perms: [true, true, true, false, true] },
                  { cap: 'Gestionar usuarios', perms: [true, false, false, false, false] },
                  { cap: 'Configuración del sistema', perms: [true, false, false, false, false] },
                  { cap: 'Acceso multi-sede', perms: [true, false, false, false, false] },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.cap}</TableCell>
                    {row.perms.map((perm, i) => (
                      <TableCell key={i} className="text-center">
                        {perm ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
