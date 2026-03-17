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
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Switch } from '@payload-config/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import {
  Shield,
  Users,
  Plus,
  Eye,
  Edit,
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
  Info,
} from 'lucide-react'

// Definición de roles del sistema
const rolesData = [
  {
    id: 'admin',
    nombre: 'Admin',
    descripcion:
      'Acceso total al sistema. Puede gestionar todos los aspectos incluyendo usuarios, configuración y facturación.',
    usuarios: 2,
    color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    icon: Shield,
    editable: false,
  },
  {
    id: 'gestor',
    nombre: 'Gestor',
    descripcion:
      'Gestiona contenido académico, cursos, ciclos y convocatorias. No accede a facturación ni configuración avanzada.',
    usuarios: 3,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    icon: Users,
    editable: true,
  },
  {
    id: 'marketing',
    nombre: 'Marketing',
    descripcion:
      'Acceso a campañas, leads, creatividades y analíticas. No puede modificar contenido académico.',
    usuarios: 2,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    icon: Megaphone,
    editable: true,
  },
  {
    id: 'asesor',
    nombre: 'Asesor',
    descripcion: 'Gestiona leads asignados, matrículas y seguimiento de alumnos potenciales.',
    usuarios: 2,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    icon: User,
    editable: true,
  },
  {
    id: 'lectura',
    nombre: 'Lectura',
    descripcion:
      'Solo puede visualizar información. No puede crear, editar ni eliminar ningún registro.',
    usuarios: 1,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
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
  const selectedPermisos = permisosMatrix.permisos[selectedRole] ?? {}

  return (
    <div className="space-y-6" data-oid="n5jxqxx">
      <PageHeader
        title="Roles y Permisos"
        description="Sistema de control de acceso basado en roles (RBAC)"
        icon={Shield}
        actions={
          <Button style={{ backgroundColor: '#F2014B' }} data-oid="f2d2m73">
            <Plus className="mr-2 h-4 w-4" data-oid="by8iemk" />
            Crear Rol Personalizado
          </Button>
        }
        data-oid="m91h1vy"
      />

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200" data-oid="j9uuoml">
        <CardContent className="pt-6" data-oid="-x.wpll">
          <div className="flex items-start gap-4" data-oid="h.nyma9">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" data-oid="r6jjdgz" />
            <div className="space-y-1" data-oid="hoxo9wl">
              <h4 className="font-medium text-blue-900" data-oid="wtym5cx">
                Sistema de Permisos Granular
              </h4>
              <p className="text-sm text-blue-800" data-oid="p2kr4ft">
                Los permisos se heredan jerárquicamente: Admin {'>'} Gestor {'>'} Marketing {'>'}{' '}
                Asesor {'>'} Lectura. Los roles del sistema no pueden eliminarse, pero puedes crear
                roles personalizados con permisos específicos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3" data-oid="l80v0kf">
        {/* Lista de Roles */}
        <Card className="lg:col-span-1" data-oid="9ubq_ic">
          <CardHeader data-oid="ibs_k3_">
            <CardTitle className="flex items-center gap-2" data-oid="lagq_.0">
              <Shield className="h-5 w-5" style={{ color: '#F2014B' }} data-oid=":0uvj9i" />
              Roles del Sistema
            </CardTitle>
            <CardDescription data-oid="jww:n6a">
              Selecciona un rol para ver sus permisos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2" data-oid="9u_jsia">
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
                  data-oid="ga5g1oo"
                >
                  <div
                    className={`h-10 w-10 rounded-full ${rol.color} flex items-center justify-center`}
                    data-oid="rhaeeus"
                  >
                    <Icon className="h-5 w-5" data-oid="j.o2kaj" />
                  </div>
                  <div className="flex-1 min-w-0" data-oid=":3tv5:3">
                    <div className="flex items-center gap-2" data-oid="5j9.cjh">
                      <p className="font-medium" data-oid="livd59-">
                        {rol.nombre}
                      </p>
                      {!rol.editable && (
                        <Lock className="h-3 w-3 text-muted-foreground" data-oid="3z6a_w." />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground" data-oid="chu:3s:">
                      {rol.usuarios} usuarios
                    </p>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Detalles del Rol */}
        <Card className="lg:col-span-2" data-oid="yxf-btj">
          <CardHeader data-oid="gj_8sj3">
            <div className="flex items-center justify-between" data-oid="f1z1_06">
              <div className="flex items-center gap-3" data-oid="l-_np4r">
                {selectedRoleData && (
                  <>
                    <div
                      className={`h-12 w-12 rounded-full ${selectedRoleData.color} flex items-center justify-center`}
                      data-oid="qq2j-79"
                    >
                      <selectedRoleData.icon className="h-6 w-6" data-oid="5tkjtks" />
                    </div>
                    <div data-oid="y_xs-3u">
                      <CardTitle data-oid="1d4dick">{selectedRoleData.nombre}</CardTitle>
                      <CardDescription data-oid="-wcowdv">
                        {selectedRoleData.descripcion}
                      </CardDescription>
                    </div>
                  </>
                )}
              </div>
              {selectedRoleData?.editable && (
                <Button variant="outline" size="sm" data-oid="jefx21q">
                  <Edit className="mr-2 h-4 w-4" data-oid="zzl65kk" />
                  Editar Rol
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent data-oid="9kws2u.">
            <Tabs defaultValue="matriz" className="space-y-4" data-oid=".xa33-:">
              <TabsList data-oid="2w0iait">
                <TabsTrigger value="matriz" data-oid="dzu-xf2">
                  Matriz de Permisos
                </TabsTrigger>
                <TabsTrigger value="usuarios" data-oid="uptic7j">
                  Usuarios con este Rol
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matriz" className="space-y-4" data-oid="u41zjyn">
                <div className="rounded-lg border overflow-hidden" data-oid="9o3hb9w">
                  <Table data-oid="5-vbxsa">
                    <TableHeader data-oid="sgvnslu">
                      <TableRow className="bg-muted/50" data-oid="ocdn2lu">
                        <TableHead className="w-[200px]" data-oid="esg3i6l">
                          Módulo
                        </TableHead>
                        {permisosMatrix.acciones.map((accion) => (
                          <TableHead
                            key={accion}
                            className="text-center w-[100px]"
                            data-oid="hw9ssei"
                          >
                            {accion}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="ayxplbi">
                      {permisosMatrix.modulos.map((modulo) => {
                        const Icon = modulo.icon
                        const moduloPermisos = selectedPermisos[modulo.id] ?? []
                        return (
                          <TableRow key={modulo.id} data-oid="nmhj.d6">
                            <TableCell data-oid="p32sch7">
                              <div className="flex items-center gap-2" data-oid="gw6.p13">
                                <Icon
                                  className="h-4 w-4 text-muted-foreground"
                                  data-oid="7bl2pmz"
                                />
                                <span className="font-medium" data-oid="y-x40e:">
                                  {modulo.nombre}
                                </span>
                              </div>
                            </TableCell>
                            {permisosMatrix.acciones.map((accion) => {
                              const tienePermiso = moduloPermisos.includes(accion)
                              return (
                                <TableCell key={accion} className="text-center" data-oid="jdfqit0">
                                  {selectedRoleData?.editable ? (
                                    <Switch
                                      checked={tienePermiso}
                                      className="data-[state=checked]:bg-green-500"
                                      data-oid="n7ks3py"
                                    />
                                  ) : tienePermiso ? (
                                    <div className="flex justify-center" data-oid="uoc7.b1">
                                      <div
                                        className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center"
                                        data-oid="sxyc6lv"
                                      >
                                        <Check
                                          className="h-4 w-4 text-green-600"
                                          data-oid="-468.e0"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center" data-oid="t067g.:">
                                      <div
                                        className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center"
                                        data-oid="f0nxovh"
                                      >
                                        <X className="h-4 w-4 text-gray-400" data-oid="fb-n8vr" />
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
                  <div className="flex justify-end gap-2" data-oid="-wjfs4v">
                    <Button variant="outline" data-oid="ggjlxjy">
                      Cancelar Cambios
                    </Button>
                    <Button style={{ backgroundColor: '#F2014B' }} data-oid="-1-08:c">
                      Guardar Permisos
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="usuarios" className="space-y-4" data-oid="rn1t:4u">
                <div className="rounded-lg border" data-oid="0m-p1-e">
                  <Table data-oid="s.-1eo:">
                    <TableHeader data-oid="jqoyu1z">
                      <TableRow data-oid="_5l.apo">
                        <TableHead data-oid="ou5orst">Usuario</TableHead>
                        <TableHead data-oid="5oj7nio">Sede</TableHead>
                        <TableHead data-oid="awqfvhx">Último Acceso</TableHead>
                        <TableHead className="text-right" data-oid="469v.j4">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="a.voezj">
                      {selectedRole === 'admin' && (
                        <>
                          <TableRow data-oid="9mmwtn:">
                            <TableCell data-oid="4jctl5x">
                              <div className="flex items-center gap-3" data-oid="_3lyi5a">
                                <div
                                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                                  data-oid="z0-l36a"
                                >
                                  <User className="h-4 w-4" data-oid="obmr.v1" />
                                </div>
                                <div data-oid="pvy-7-k">
                                  <p className="font-medium" data-oid="b:h2ixb">
                                    Carlos Pérez
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-oid="lu5_i_o">
                                    admin@akademate.com
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-oid="u4-qx8p">Todas</TableCell>
                            <TableCell className="text-muted-foreground" data-oid="0jlejes">
                              Hoy 10:30
                            </TableCell>
                            <TableCell className="text-right" data-oid="iii_:yn">
                              <Button variant="ghost" size="sm" data-oid="9ha2dxs">
                                <Eye className="h-4 w-4" data-oid="4rsx8f1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      {selectedRole === 'gestor' && (
                        <>
                          <TableRow data-oid="o-.h3mj">
                            <TableCell data-oid="kcvglc3">
                              <div className="flex items-center gap-3" data-oid="g8qlja5">
                                <div
                                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                                  data-oid="1m9n_c9"
                                >
                                  <User className="h-4 w-4" data-oid="0-y6_x:" />
                                </div>
                                <div data-oid="0v0whb3">
                                  <p className="font-medium" data-oid="3d1lac6">
                                    María García López
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-oid="0fv_zx2">
                                    maria.garcia@akademate.com
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-oid="a0l45vv">Sede Norte</TableCell>
                            <TableCell className="text-muted-foreground" data-oid="qi7014q">
                              Hoy 09:15
                            </TableCell>
                            <TableCell className="text-right" data-oid=":zbf1gy">
                              <Button variant="ghost" size="sm" data-oid="4y2ay8d">
                                <Eye className="h-4 w-4" data-oid="hseluax" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow data-oid=":65:o1w">
                            <TableCell data-oid="h3lked9">
                              <div className="flex items-center gap-3" data-oid="qtljzp8">
                                <div
                                  className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                                  data-oid="s5b_vc0"
                                >
                                  <User className="h-4 w-4" data-oid="7s8il:-" />
                                </div>
                                <div data-oid="0-snv5.">
                                  <p className="font-medium" data-oid="n2d9e9l">
                                    Pedro Sánchez López
                                  </p>
                                  <p className="text-sm text-muted-foreground" data-oid="1jauvpz">
                                    pedro.sanchez@akademate.com
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell data-oid="h0g3t2o">Sede Norte</TableCell>
                            <TableCell className="text-muted-foreground" data-oid="15faacp">
                              Hoy 08:30
                            </TableCell>
                            <TableCell className="text-right" data-oid="0z.dtgf">
                              <Button variant="ghost" size="sm" data-oid="lzai98e">
                                <Eye className="h-4 w-4" data-oid="39s36k8" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                      {selectedRole !== 'admin' && selectedRole !== 'gestor' && (
                        <TableRow data-oid="pxxfvco">
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                            data-oid="ipmgmlv"
                          >
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
      <Card data-oid="o9y1f5k">
        <CardHeader data-oid="dswgofc">
          <CardTitle data-oid="v_9s7x8">Comparativa Rápida de Roles</CardTitle>
          <CardDescription data-oid="ir48la:">Resumen de accesos por rol</CardDescription>
        </CardHeader>
        <CardContent data-oid="2.rkl90">
          <div className="overflow-x-auto" data-oid="khlauhx">
            <Table data-oid="p_2gqjj">
              <TableHeader data-oid="72l6q3b">
                <TableRow data-oid="5bel2hu">
                  <TableHead data-oid="7c379yg">Capacidad</TableHead>
                  {rolesData.map((rol) => (
                    <TableHead key={rol.id} className="text-center" data-oid="u7e1:cu">
                      <Badge className={rol.color} data-oid="9-pooav">
                        {rol.nombre}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody data-oid="77van2a">
                {[
                  { cap: 'Gestionar cursos y ciclos', perms: [true, true, false, false, false] },
                  { cap: 'Gestionar leads', perms: [true, false, true, true, false] },
                  { cap: 'Crear campañas', perms: [true, false, true, false, false] },
                  { cap: 'Ver analíticas', perms: [true, true, true, false, true] },
                  { cap: 'Gestionar usuarios', perms: [true, false, false, false, false] },
                  { cap: 'Configuración del sistema', perms: [true, false, false, false, false] },
                  { cap: 'Acceso multi-sede', perms: [true, false, false, false, false] },
                ].map((row, idx) => (
                  <TableRow key={idx} data-oid="ep9159.">
                    <TableCell className="font-medium" data-oid="52nxmpx">
                      {row.cap}
                    </TableCell>
                    {row.perms.map((perm, i) => (
                      <TableCell key={i} className="text-center" data-oid="xr0xw50">
                        {perm ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" data-oid="rgkp7yc" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" data-oid=":qpqafl" />
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
