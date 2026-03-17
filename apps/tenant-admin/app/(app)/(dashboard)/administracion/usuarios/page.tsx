'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
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
  Search,
  Users,
  Mail,
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

// TODO: Fetch from API
const usuariosData: {
  id: string
  nombre: string
  email: string
  telefono: string
  rol: string
  sede: string
  activo: boolean
  verificado: boolean
  dosFactor: boolean
  ultimoAcceso: string
  fechaCreacion: string
}[] = []

const rolConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  Admin: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950',
    icon: <Shield className="h-3 w-3" data-oid="4u9vff9" />,
  },
  Gestor: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    icon: <Users className="h-3 w-3" data-oid="6gipt.i" />,
  },
  Marketing: {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    icon: <Users className="h-3 w-3" data-oid="o3neq_7" />,
  },
  Asesor: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    icon: <User className="h-3 w-3" data-oid="iqlwfue" />,
  },
  Lectura: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: <Eye className="h-3 w-3" data-oid="o0c9j7s" />,
  },
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
    const matchesSede =
      sedeFilter === 'todas' || usuario.sede === sedeFilter || usuario.sede === 'Todas'
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
    <div className="space-y-6" data-oid="8-wjh0.">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios y control de acceso"
        icon={Users}
        actions={
          <div className="flex gap-2" data-oid="xxov.8b">
            <Button variant="outline" data-oid=".tl_hbl">
              <Upload className="mr-2 h-4 w-4" data-oid="tfz0_hx" />
              Importar
            </Button>
            <Button variant="outline" data-oid="o5g34sm">
              <Download className="mr-2 h-4 w-4" data-oid="pwe5q8p" />
              Exportar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen} data-oid="q.34lt5">
              <DialogTrigger asChild data-oid="x9jum2-">
                <Button style={{ backgroundColor: '#F2014B' }} data-oid="jlr3.kd">
                  <UserPlus className="mr-2 h-4 w-4" data-oid="2n:.63f" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" data-oid="0ktbxn.">
                <DialogHeader data-oid="-l7v85m">
                  <DialogTitle data-oid="3hptxrw">Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription data-oid=".-v_cqt">
                    Añade un nuevo usuario al sistema. Se enviará un email de verificación
                    automáticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4" data-oid="xbiqhup">
                  <div className="grid grid-cols-2 gap-4" data-oid="55yrsms">
                    <div className="space-y-2" data-oid="vbo4bzx">
                      <Label htmlFor="nombre" data-oid="nl15qz6">
                        Nombre completo
                      </Label>
                      <Input id="nombre" placeholder="Nombre Apellidos" data-oid="zy34ei2" />
                    </div>
                    <div className="space-y-2" data-oid="lz0xvme">
                      <Label htmlFor="email" data-oid="1loedc:">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@academia.com"
                        data-oid="-ux7g9x"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4" data-oid="9h-ovu2">
                    <div className="space-y-2" data-oid="v3opjev">
                      <Label htmlFor="rol" data-oid="5wg7teg">
                        Rol
                      </Label>
                      <Select data-oid="c.vfnn5">
                        <SelectTrigger data-oid="tdgui2l">
                          <SelectValue placeholder="Seleccionar rol" data-oid="fjortee" />
                        </SelectTrigger>
                        <SelectContent data-oid="r5viksh">
                          <SelectItem value="gestor" data-oid="1tl_vh.">
                            Gestor
                          </SelectItem>
                          <SelectItem value="marketing" data-oid="_eg9ksx">
                            Marketing
                          </SelectItem>
                          <SelectItem value="asesor" data-oid="2:k6usa">
                            Asesor
                          </SelectItem>
                          <SelectItem value="lectura" data-oid="cty:cbh">
                            Lectura
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2" data-oid="h0dpvv-">
                      <Label htmlFor="sede" data-oid="8d4p124">
                        Sede
                      </Label>
                      <Select data-oid="xa_s5f0">
                        <SelectTrigger data-oid="oz3mb4t">
                          <SelectValue placeholder="Seleccionar sede" data-oid="39.:71_" />
                        </SelectTrigger>
                        <SelectContent data-oid="s82n8nw">
                          <SelectItem value="todas" data-oid="uy0tae7">
                            Todas las sedes
                          </SelectItem>
                          <SelectItem value="norte" data-oid="2l0n.l8">
                            Sede Norte
                          </SelectItem>
                          <SelectItem value="santacruz" data-oid="rbhth0s">
                            Sede Santa Cruz
                          </SelectItem>
                          <SelectItem value="sur" data-oid="epozcl0">
                            Sede Sur
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2" data-oid=":w2lzmr">
                    <Label htmlFor="telefono" data-oid="i-:ys:j">
                      Teléfono (opcional)
                    </Label>
                    <Input id="telefono" placeholder="+34 600 000 000" data-oid="eaunhth" />
                  </div>
                </div>
                <DialogFooter data-oid="ixoqg6e">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} data-oid="nsw3rc3">
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => setDialogOpen(false)}
                    style={{ backgroundColor: '#F2014B' }}
                    data-oid="co090dm"
                  >
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
        data-oid="pb8_3jy"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4" data-oid="h2ynq.2">
        <Card data-oid="vgzayky">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="v4185:a"
          >
            <CardTitle className="text-sm font-medium" data-oid="1by.og8">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" data-oid="4a1pm:u" />
          </CardHeader>
          <CardContent data-oid="8mqqqxz">
            <div className="text-2xl font-bold" data-oid="vy10roi">
              {estadisticas.total}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="-vzjzs5">
              en el sistema
            </p>
          </CardContent>
        </Card>
        <Card data-oid="y089txe">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="7lhq47b"
          >
            <CardTitle className="text-sm font-medium" data-oid="_bqhfvd">
              Usuarios Activos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" data-oid="i_3glii" />
          </CardHeader>
          <CardContent data-oid="q_isex3">
            <div className="text-2xl font-bold text-green-600" data-oid="x_:j9dd">
              {estadisticas.activos}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="mrg.9v.">
              con acceso habilitado
            </p>
          </CardContent>
        </Card>
        <Card data-oid="a8hs8ck">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="oo0.2s."
          >
            <CardTitle className="text-sm font-medium" data-oid="e0dh_u5">
              Con 2FA
            </CardTitle>
            <Key className="h-4 w-4 text-blue-500" data-oid="i4jl4oa" />
          </CardHeader>
          <CardContent data-oid="ue37a8r">
            <div className="text-2xl font-bold text-blue-600" data-oid="k::lz_2">
              {estadisticas.con2FA}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="b0i39ub">
              autenticación doble
            </p>
          </CardContent>
        </Card>
        <Card data-oid="hddxq40">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="xq.2-rz"
          >
            <CardTitle className="text-sm font-medium" data-oid="aniiyck">
              Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" data-oid="l7h:yo_" />
          </CardHeader>
          <CardContent data-oid="xq4o3ax">
            <div className="text-2xl font-bold text-amber-600" data-oid="led5tu_">
              {estadisticas.pendientesVerificacion}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="mvyt1lj">
              sin verificar email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card data-oid=":qjbzp8">
        <CardContent className="pt-6" data-oid="g3s9vyu">
          <div className="flex flex-col gap-4 md:flex-row md:items-center" data-oid="dkjemx.">
            <div className="relative flex-1" data-oid="lkb_x56">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                data-oid="..ik.dc"
              />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid="comjynt"
              />
            </div>
            <Select value={rolFilter} onValueChange={setRolFilter} data-oid=":mnz_j0">
              <SelectTrigger className="w-full md:w-[180px]" data-oid="ll2vjt9">
                <SelectValue placeholder="Rol" data-oid="m6sc:xf" />
              </SelectTrigger>
              <SelectContent data-oid=".3z_l1j">
                <SelectItem value="todos" data-oid="wnmm2i.">
                  Todos los roles
                </SelectItem>
                <SelectItem value="Admin" data-oid="b21v2fd">
                  Admin
                </SelectItem>
                <SelectItem value="Gestor" data-oid="qte6vup">
                  Gestor
                </SelectItem>
                <SelectItem value="Marketing" data-oid="ck3b8.m">
                  Marketing
                </SelectItem>
                <SelectItem value="Asesor" data-oid="9:v8lyr">
                  Asesor
                </SelectItem>
                <SelectItem value="Lectura" data-oid="nf2k_0f">
                  Lectura
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="tww-f0f">
              <SelectTrigger className="w-full md:w-[180px]" data-oid="26bt0c2">
                <SelectValue placeholder="Sede" data-oid="x3cin80" />
              </SelectTrigger>
              <SelectContent data-oid="7.62p0l">
                <SelectItem value="todas" data-oid="0:4b8_1">
                  Todas las sedes
                </SelectItem>
                <SelectItem value="Sede Norte" data-oid=":2.sly5">
                  Sede Norte
                </SelectItem>
                <SelectItem value="Sede Santa Cruz" data-oid="911:er:">
                  Sede Santa Cruz
                </SelectItem>
                <SelectItem value="Sede Sur" data-oid="sr8-4w5">
                  Sede Sur
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="m.q38w4">
              <SelectTrigger className="w-full md:w-[150px]" data-oid="6zyhhte">
                <SelectValue placeholder="Estado" data-oid="go_w3br" />
              </SelectTrigger>
              <SelectContent data-oid=":tghuuy">
                <SelectItem value="todos" data-oid="v_ps6:u">
                  Todos
                </SelectItem>
                <SelectItem value="activo" data-oid="ux-baao">
                  Activos
                </SelectItem>
                <SelectItem value="inactivo" data-oid="qb6ay7e">
                  Inactivos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card data-oid="69s81s9">
        <CardHeader data-oid="4.wosj1">
          <CardTitle className="flex items-center gap-2" data-oid="tra4k0.">
            <Users className="h-5 w-5" style={{ color: '#F2014B' }} data-oid=".2_gtn2" />
            Listado de Usuarios ({filteredUsuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="0lv:n2v">
          <Table data-oid="koucze-">
            <TableHeader data-oid="4-4hrfa">
              <TableRow data-oid="cqzvz2k">
                <TableHead data-oid="hnx1f39">Usuario</TableHead>
                <TableHead data-oid="c229eiq">Rol</TableHead>
                <TableHead data-oid="3l8ad7k">Sede</TableHead>
                <TableHead data-oid="hs64k59">Estado</TableHead>
                <TableHead data-oid=":u7bea3">2FA</TableHead>
                <TableHead data-oid="qrkf5w9">Último Acceso</TableHead>
                <TableHead className="text-right" data-oid="iugrshq">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="u5hql77">
              {filteredUsuarios.map((usuario) => {
                const config = rolConfig[usuario.rol]
                return (
                  <TableRow key={usuario.id} data-oid="stp4jsr">
                    <TableCell data-oid="vgx-ijn">
                      <div className="flex items-center gap-3" data-oid="cbrakgs">
                        <div
                          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                          data-oid="5vtu0wb"
                        >
                          <User className="h-5 w-5 text-muted-foreground" data-oid="w:p2cli" />
                        </div>
                        <div className="flex flex-col" data-oid="p20hww2">
                          <span className="font-medium" data-oid="zswm3t0">
                            {usuario.nombre}
                          </span>
                          <span
                            className="text-sm text-muted-foreground flex items-center gap-1"
                            data-oid="e7z4uvy"
                          >
                            <Mail className="h-3 w-3" data-oid="4uzt2de" />
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-oid="kd3h5bi">
                      <Badge
                        className={`${config.bgColor} ${config.color} hover:${config.bgColor} flex items-center gap-1 w-fit`}
                        data-oid="9tr66p2"
                      >
                        {config.icon}
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell data-oid="arcuhch">
                      <span className="flex items-center gap-1" data-oid="k3:ax_.">
                        <Building2 className="h-4 w-4 text-muted-foreground" data-oid="y5vo1bb" />
                        {usuario.sede}
                      </span>
                    </TableCell>
                    <TableCell data-oid="l5kdfs8">
                      {usuario.activo ? (
                        <Badge
                          className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-300"
                          data-oid="c144aqi"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" data-oid="x2k._v9" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" data-oid="vqm__jk">
                          <XCircle className="h-3 w-3 mr-1" data-oid="uu84x_h" />
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell data-oid="yrui6ib">
                      {usuario.dosFactor ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-300"
                          data-oid="z15gzan"
                        >
                          <Lock className="h-3 w-3 mr-1" data-oid="kx-qfez" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                          data-oid="p5j4ofy"
                        >
                          <Unlock className="h-3 w-3 mr-1" data-oid="4_k9l71" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell data-oid="2v3q-i_">
                      <span
                        className="flex items-center gap-1 text-sm text-muted-foreground"
                        data-oid="3d3rf2s"
                      >
                        <Clock className="h-3 w-3" data-oid="fqii-nn" />
                        {usuario.ultimoAcceso}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" data-oid="b:q-.1t">
                      <DropdownMenu data-oid="69y8tc0">
                        <DropdownMenuTrigger asChild data-oid="1xq6h2d">
                          <Button variant="ghost" size="sm" data-oid="asc0fy4">
                            <MoreHorizontal className="h-4 w-4" data-oid="8h1u9-i" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-oid="k.zgcwn">
                          <DropdownMenuItem data-oid="353wl28">
                            <Eye className="mr-2 h-4 w-4" data-oid="9ot2b5a" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid="-swad:l">
                            <Edit className="mr-2 h-4 w-4" data-oid="8cnzc3w" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid="9j29a0w">
                            <Key className="mr-2 h-4 w-4" data-oid="sdwmp1s" />
                            Resetear contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid="spur_tn">
                            <History className="mr-2 h-4 w-4" data-oid="3tx95nf" />
                            Ver actividad
                          </DropdownMenuItem>
                          <DropdownMenuSeparator data-oid="931ri2_" />
                          {usuario.activo ? (
                            <DropdownMenuItem className="text-amber-600" data-oid="yv32k1s">
                              <XCircle className="mr-2 h-4 w-4" data-oid="gz5cxb4" />
                              Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600" data-oid="uq9nj2h">
                              <CheckCircle2 className="mr-2 h-4 w-4" data-oid="8onrn43" />
                              Activar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" data-oid="g2if011">
                            <Trash2 className="mr-2 h-4 w-4" data-oid="ljj4lkl" />
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
      <Card data-oid="kzkgam9">
        <CardHeader data-oid="1m9uarr">
          <CardTitle className="text-base" data-oid="7mgpy12">
            Distribución por Rol
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="bcgc:.0">
          <div className="grid gap-4 md:grid-cols-5" data-oid="c.57wke">
            {Object.entries(rolConfig).map(([rol, config]) => {
              const count = usuariosData.filter((u) => u.rol === rol).length
              return (
                <div
                  key={rol}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  data-oid="b9zp5e8"
                >
                  <div
                    className={`h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center`}
                    data-oid="oi_yp6z"
                  >
                    {config.icon}
                  </div>
                  <div data-oid="fcfk0qv">
                    <p className="font-medium" data-oid="i_xcfnr">
                      {rol}
                    </p>
                    <p className="text-sm text-muted-foreground" data-oid="2.oobaw">
                      {count} usuarios
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
