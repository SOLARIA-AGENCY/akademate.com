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
    email: 'maria.garcia@akademate.com',
    rol: 'Gestor',
    sede: 'Sede Norte',
    activo: true,
    ultimoAcceso: '2024-12-07 09:15',
    avatar: null,
  },
  {
    id: '2',
    nombre: 'Juan Martínez Ruiz',
    email: 'juan.martinez@akademate.com',
    rol: 'Marketing',
    sede: 'Sede Santa Cruz',
    activo: true,
    ultimoAcceso: '2024-12-06 18:30',
    avatar: null,
  },
  {
    id: '3',
    nombre: 'Ana Rodríguez Sánchez',
    email: 'ana.rodriguez@akademate.com',
    rol: 'Asesor',
    sede: 'Sede Norte',
    activo: true,
    ultimoAcceso: '2024-12-07 10:45',
    avatar: null,
  },
  {
    id: '4',
    nombre: 'Carlos Fernández Torres',
    email: 'carlos.fernandez@akademate.com',
    rol: 'Asesor',
    sede: 'Sede Sur',
    activo: false,
    ultimoAcceso: '2024-11-28 14:20',
    avatar: null,
  },
  {
    id: '5',
    nombre: 'Laura Pérez Gómez',
    email: 'laura.perez@akademate.com',
    rol: 'Lectura',
    sede: 'Sede Santa Cruz',
    activo: true,
    ultimoAcceso: '2024-12-05 16:00',
    avatar: null,
  },
  {
    id: '6',
    nombre: 'Pedro Sánchez López',
    email: 'pedro.sanchez@akademate.com',
    rol: 'Gestor',
    sede: 'Sede Norte',
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
  Admin: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950' },
  Gestor: { color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-950' },
  Marketing: {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
  },
  Asesor: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
  },
  Lectura: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' },
}

export default function ImpersonarPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [rolFilter, setRolFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [_selectedUser, _setSelectedUser] = useState<(typeof usuariosData)[0] | null>(null)

  const filteredUsuarios = usuariosData.filter((usuario) => {
    const matchesSearch =
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRol = rolFilter === 'todos' || usuario.rol === rolFilter
    const matchesSede = sedeFilter === 'todas' || usuario.sede === sedeFilter
    return matchesSearch && matchesRol && matchesSede
  })

  return (
    <div className="space-y-6" data-oid="rbw:ci_">
      <PageHeader
        title="Impersonar Usuario"
        description="Accede al sistema como otro usuario para soporte y verificación"
        icon={Users}
        data-oid="vstos:r"
      />

      {/* Warning Card */}
      <Card className="border-amber-200 bg-amber-50" data-oid="0eiuv_:">
        <CardContent className="pt-6" data-oid="-c2.p3k">
          <div className="flex items-start gap-4" data-oid="3.uv2sc">
            <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" data-oid="rwbc_bm" />
            <div className="space-y-2" data-oid="-2klf8a">
              <h4 className="font-medium text-amber-900" data-oid="k7w8kfh">
                Advertencia de Seguridad
              </h4>
              <p className="text-sm text-amber-800" data-oid="8wbx:fi">
                La impersonación permite acceder al sistema con los permisos de otro usuario. Esta
                funcionalidad está diseñada exclusivamente para:
              </p>
              <ul
                className="text-sm text-amber-800 list-disc list-inside space-y-1"
                data-oid="4mmd46l"
              >
                <li data-oid="jn0yb3m">Soporte técnico y resolución de incidencias</li>
                <li data-oid="itl84-p">Verificación de permisos y configuraciones</li>
                <li data-oid="jxwhvt5">Pruebas de funcionalidad desde diferentes roles</li>
              </ul>
              <p className="text-sm text-amber-800 font-medium" data-oid="hroets0">
                Todas las acciones realizadas durante la impersonación quedan registradas en el log
                de auditoría con el identificador del administrador original.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="sn19x:-">
        <Card data-oid="lid0obr">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="uxln5eq"
          >
            <CardTitle className="text-sm font-medium" data-oid="6:fospa">
              Usuarios Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" data-oid="5wtk9x6" />
          </CardHeader>
          <CardContent data-oid="u0my7ic">
            <div className="text-2xl font-bold" data-oid="rt4njod">
              {usuariosData.filter((u) => u.activo).length}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="7_luyp_">
              de {usuariosData.length} totales
            </p>
          </CardContent>
        </Card>
        <Card data-oid="6q_obe4">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="ue9-0q3"
          >
            <CardTitle className="text-sm font-medium" data-oid="scjucsu">
              Impersonaciones Hoy
            </CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" data-oid="r7t.9c2" />
          </CardHeader>
          <CardContent data-oid="urq7g0b">
            <div className="text-2xl font-bold" data-oid="if9fa8x">
              2
            </div>
            <p className="text-xs text-muted-foreground" data-oid="-fx-:z1">
              sesiones de soporte
            </p>
          </CardContent>
        </Card>
        <Card data-oid="_6zr2-_">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="b-lzg3a"
          >
            <CardTitle className="text-sm font-medium" data-oid="0mk357z">
              Tiempo Promedio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" data-oid="4j:dh2q" />
          </CardHeader>
          <CardContent data-oid="p-4kaz6">
            <div className="text-2xl font-bold" data-oid="9o6doav">
              15 min
            </div>
            <p className="text-xs text-muted-foreground" data-oid="06vc54e">
              por sesión
            </p>
          </CardContent>
        </Card>
        <Card data-oid="l.hn0w_">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="-a0xwvf"
          >
            <CardTitle className="text-sm font-medium" data-oid="slubf8f">
              Este Mes
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" data-oid="c8lm7ki" />
          </CardHeader>
          <CardContent data-oid="5:dyfv-">
            <div className="text-2xl font-bold" data-oid="8e6p.fk">
              12
            </div>
            <p className="text-xs text-muted-foreground" data-oid="8j6fblv">
              impersonaciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y lista de usuarios */}
      <Card data-oid="slz1g.e">
        <CardHeader data-oid="ov3.xgg">
          <CardTitle className="flex items-center gap-2" data-oid="q7nbduv">
            <UserCog className="h-5 w-5" style={{ color: '#F2014B' }} data-oid="7u.9w6t" />
            Seleccionar Usuario
          </CardTitle>
          <CardDescription data-oid="-y1fd9.">
            Busca y selecciona el usuario que deseas impersonar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4" data-oid=".2phvur">
          {/* Filtros */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center" data-oid="vnmvdvv">
            <div className="relative flex-1" data-oid="wjc0lx5">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                data-oid="zq:vqd_"
              />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid="084y3qb"
              />
            </div>
            <Select value={rolFilter} onValueChange={setRolFilter} data-oid="f098:cd">
              <SelectTrigger className="w-full md:w-[180px]" data-oid="7gqtmy0">
                <SelectValue placeholder="Rol" data-oid="_pbe-8x" />
              </SelectTrigger>
              <SelectContent data-oid="g.j528p">
                <SelectItem value="todos" data-oid="jy-w860">
                  Todos los roles
                </SelectItem>
                <SelectItem value="Gestor" data-oid="6_ct-fm">
                  Gestor
                </SelectItem>
                <SelectItem value="Marketing" data-oid="rkcuk0s">
                  Marketing
                </SelectItem>
                <SelectItem value="Asesor" data-oid="06d6qkn">
                  Asesor
                </SelectItem>
                <SelectItem value="Lectura" data-oid="zbtn.iy">
                  Lectura
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid=":6x1r6x">
              <SelectTrigger className="w-full md:w-[180px]" data-oid="2qk8nl-">
                <SelectValue placeholder="Sede" data-oid="vrsgmp." />
              </SelectTrigger>
              <SelectContent data-oid="99m8sfs">
                <SelectItem value="todas" data-oid="k_zr14l">
                  Todas las sedes
                </SelectItem>
                <SelectItem value="Sede Norte" data-oid="epn-2j:">
                  Sede Norte
                </SelectItem>
                <SelectItem value="Sede Santa Cruz" data-oid="iiuqujy">
                  Sede Santa Cruz
                </SelectItem>
                <SelectItem value="Sede Sur" data-oid=":1y70fs">
                  Sede Sur
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla de usuarios */}
          <Table data-oid="ws1ck1g">
            <TableHeader data-oid="ro363u2">
              <TableRow data-oid="k0qikb.">
                <TableHead data-oid="p:tl:09">Usuario</TableHead>
                <TableHead data-oid="eghwggv">Rol</TableHead>
                <TableHead data-oid="11hpb-:">Sede</TableHead>
                <TableHead data-oid="o56b1lt">Estado</TableHead>
                <TableHead data-oid="mq_.j5o">Último Acceso</TableHead>
                <TableHead className="text-right" data-oid="dc2d49n">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="7.rd.g5">
              {filteredUsuarios.map((usuario) => {
                const config = rolConfig[usuario.rol]
                return (
                  <TableRow key={usuario.id} data-oid="yir68-7">
                    <TableCell data-oid="g2a:tb4">
                      <div className="flex items-center gap-3" data-oid="7ff..6b">
                        <div
                          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                          data-oid="_7.62e8"
                        >
                          <User className="h-5 w-5 text-muted-foreground" data-oid="0y_hkzz" />
                        </div>
                        <div className="flex flex-col" data-oid="vrhg7dj">
                          <span className="font-medium" data-oid="9578nu4">
                            {usuario.nombre}
                          </span>
                          <span
                            className="text-sm text-muted-foreground flex items-center gap-1"
                            data-oid="rxc41l2"
                          >
                            <Mail className="h-3 w-3" data-oid="w:7kys1" />
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-oid="j98o7cw">
                      <Badge
                        className={`${config.bgColor} ${config.color} hover:${config.bgColor}`}
                        data-oid="0ow1-r1"
                      >
                        <Shield className="h-3 w-3 mr-1" data-oid="9e2a8-2" />
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell data-oid="kjvhguc">
                      <span className="flex items-center gap-1" data-oid="ykwvb1e">
                        <Building2 className="h-4 w-4 text-muted-foreground" data-oid="-nt5mb6" />
                        {usuario.sede}
                      </span>
                    </TableCell>
                    <TableCell data-oid="-_dp1q3">
                      {usuario.activo ? (
                        <Badge
                          className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                          data-oid="oeu-uuz"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" data-oid="739dn2-" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-oid="hz7scyc">
                          <XCircle className="h-3 w-3 mr-1" data-oid="1fdsx0o" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell data-oid="g79n4m1">
                      <span
                        className="flex items-center gap-1 text-sm text-muted-foreground"
                        data-oid="ov6xvmb"
                      >
                        <Clock className="h-3 w-3" data-oid="cvs-ioy" />
                        {usuario.ultimoAcceso}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" data-oid="_9k7gtn">
                      <AlertDialog data-oid="3:h6.:_">
                        <AlertDialogTrigger asChild data-oid="yi3sawn">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!usuario.activo}
                            onClick={() => _setSelectedUser(usuario)}
                            data-oid="5pk:uvh"
                          >
                            <LogIn className="h-4 w-4 mr-2" data-oid="q78mv7f" />
                            Impersonar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent data-oid="ii6p_je">
                          <AlertDialogHeader data-oid="bcgpbuo">
                            <AlertDialogTitle
                              className="flex items-center gap-2"
                              data-oid="65filg2"
                            >
                              <AlertTriangle
                                className="h-5 w-5 text-amber-500"
                                data-oid="9elxa2-"
                              />
                              Confirmar Impersonación
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild data-oid="3nxomfd">
                              <div className="space-y-4" data-oid="vdg9x1a">
                                <p data-oid="u.ekybw">
                                  Vas a acceder al sistema como{' '}
                                  <strong data-oid="ioz_tca">{usuario.nombre}</strong> (
                                  {usuario.rol}).
                                </p>
                                <div
                                  className="bg-muted p-4 rounded-lg space-y-2"
                                  data-oid="3s2j4ez"
                                >
                                  <p className="text-sm font-medium" data-oid="dk7r4_b">
                                    Durante la impersonación:
                                  </p>
                                  <ul
                                    className="text-sm list-disc list-inside space-y-1"
                                    data-oid="erdu3go"
                                  >
                                    <li data-oid="3l2hdnj">
                                      Tendrás los mismos permisos que este usuario
                                    </li>
                                    <li data-oid="l3.7mdj">
                                      Todas tus acciones quedarán registradas
                                    </li>
                                    <li data-oid="44.8xx:">
                                      El usuario original NO será notificado
                                    </li>
                                    <li data-oid="cop.09d">
                                      Podrás finalizar la sesión en cualquier momento
                                    </li>
                                  </ul>
                                </div>
                                <Input
                                  placeholder="Motivo de la impersonación (obligatorio)"
                                  data-oid="05sytjh"
                                />
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter data-oid="y1rpry:">
                            <AlertDialogCancel data-oid="4ry__0x">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="text-white"
                              style={{ backgroundColor: '#F2014B' }}
                              data-oid=":2dgexx"
                            >
                              <LogIn className="h-4 w-4 mr-2" data-oid="163lipl" />
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
      <Card data-oid="k9e:bii">
        <CardHeader data-oid="4w5r4mn">
          <CardTitle className="flex items-center gap-2" data-oid="9h9fgjj">
            <History className="h-5 w-5" style={{ color: '#F2014B' }} data-oid="mji_7ot" />
            Historial de Impersonaciones
          </CardTitle>
          <CardDescription data-oid="kbb2h1x">
            Registro de todas las sesiones de impersonación realizadas
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="bxzw24x">
          <Table data-oid="xh-iq02">
            <TableHeader data-oid="v:0yfxm">
              <TableRow data-oid="u9u7dbl">
                <TableHead data-oid="c6lgv1-">Admin</TableHead>
                <TableHead data-oid="pn_59w_">Usuario Impersonado</TableHead>
                <TableHead data-oid="rnzqbna">Inicio</TableHead>
                <TableHead data-oid="fqenn8n">Fin</TableHead>
                <TableHead data-oid="v-srjv.">Duración</TableHead>
                <TableHead data-oid="ph1j-g-">Motivo</TableHead>
                <TableHead data-oid="-2z4_k4">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="s4c-5f3">
              {historialImpersonaciones.map((registro) => (
                <TableRow key={registro.id} data-oid="7yfiv9o">
                  <TableCell className="font-medium" data-oid="5--p5iu">
                    {registro.adminNombre}
                  </TableCell>
                  <TableCell data-oid="aw-3its">{registro.usuarioImpersonado}</TableCell>
                  <TableCell className="text-sm" data-oid="x.vm9fu">
                    {registro.fechaInicio}
                  </TableCell>
                  <TableCell className="text-sm" data-oid="0rw-du_">
                    {registro.fechaFin}
                  </TableCell>
                  <TableCell data-oid="vh1cigu">
                    <Badge variant="outline" data-oid="c4mgy6w">
                      {registro.duracion}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={registro.motivo}
                    data-oid="-bj4_.e"
                  >
                    {registro.motivo}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" data-oid="cd.b3:_">
                    {registro.ip}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
