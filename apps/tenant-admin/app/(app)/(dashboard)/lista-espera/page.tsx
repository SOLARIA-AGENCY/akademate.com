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
    sede: 'Sede Norte',
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
    sede: 'Sede Norte',
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
    sede: 'Sede Santa Cruz',
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
    sede: 'Sede Santa Cruz',
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
    sede: 'Sede Norte',
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
    sede: 'Sede Sur',
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
    sede: 'Sede Norte',
    prioridad: 'media',
    estado: 'rechazado',
    fechaEntrada: '2024-11-17',
    plazasDelante: 0,
    ultimoContacto: '2024-12-04',
    notas: 'Rechazó plaza por incompatibilidad horaria.',
  },
]

const prioridadConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  alta: {
    label: 'Alta',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-950',
  },
  media: {
    label: 'Media',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
  },
  baja: {
    label: 'Baja',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
}

const estadoConfig: Record<
  string,
  {
    label: string
    color: string
    bgColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  en_lista: {
    label: 'En Lista',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    icon: Clock,
  },
  notificado: {
    label: 'Notificado',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    icon: Bell,
  },
  aceptado: {
    label: 'Aceptado',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-950',
    icon: CheckCircle2,
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: AlertCircle,
  },
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
    altaPrioridad: listaEsperaData.filter((i) => i.prioridad === 'alta' && i.estado === 'en_lista')
      .length,
  }

  return (
    <div className="space-y-6" data-oid=":z2a6yu">
      <PageHeader
        title="Lista de Espera"
        description="Gestión de alumnos en espera para cursos con plazas completas"
        icon={ListTodo}
        actions={
          <>
            <Button variant="outline" data-oid="53sf6zb">
              <Download className="mr-2 h-4 w-4" data-oid="4i5_man" />
              Exportar
            </Button>
            <Button style={{ backgroundColor: '#F2014B' }} data-oid="1nzhime">
              <Plus className="mr-2 h-4 w-4" data-oid="ovglfi1" />
              Añadir a Lista
            </Button>
          </>
        }
        data-oid="o_b65jb"
      />

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-5" data-oid=".k1vwbb">
        <Card data-oid=":ic0rhg">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="e8:g-xg"
          >
            <CardTitle className="text-sm font-medium" data-oid="2kpwg4m">
              Total en Espera
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" data-oid="8zr69af" />
          </CardHeader>
          <CardContent data-oid=":6vs.z9">
            <div className="text-2xl font-bold" data-oid="mg3hpv3">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="dj3kbh-">
              personas en cola
            </p>
          </CardContent>
        </Card>
        <Card data-oid="er9d4t7">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="73t_ek8"
          >
            <CardTitle className="text-sm font-medium" data-oid="x3i5z4u">
              Esperando Plaza
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" data-oid="pxt59_:" />
          </CardHeader>
          <CardContent data-oid="ohskkj-">
            <div className="text-2xl font-bold text-blue-600" data-oid="v4.e_jc">
              {stats.enLista}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="6:t9phj">
              activos en lista
            </p>
          </CardContent>
        </Card>
        <Card data-oid="h-2lqbp">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="q0b88rx"
          >
            <CardTitle className="text-sm font-medium" data-oid="wuzd:cb">
              Notificados
            </CardTitle>
            <Bell className="h-4 w-4 text-amber-500" data-oid="o5gwiaq" />
          </CardHeader>
          <CardContent data-oid="7kg57g6">
            <div className="text-2xl font-bold text-amber-600" data-oid="9ew9qr5">
              {stats.notificados}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="r8thyqi">
              esperando respuesta
            </p>
          </CardContent>
        </Card>
        <Card data-oid="djblo4p">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="hr.8wgd"
          >
            <CardTitle className="text-sm font-medium" data-oid="x_44bk_">
              Convertidos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" data-oid="kixare2" />
          </CardHeader>
          <CardContent data-oid="w4s.t3.">
            <div className="text-2xl font-bold text-green-600" data-oid="ihqudoq">
              {stats.aceptados}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="7uxiof6">
              a matrícula
            </p>
          </CardContent>
        </Card>
        <Card data-oid="68c2cey">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="iss4dfn"
          >
            <CardTitle className="text-sm font-medium" data-oid="asagr.u">
              Alta Prioridad
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-red-500" data-oid=".44ognf" />
          </CardHeader>
          <CardContent data-oid="1.rxc8d">
            <div className="text-2xl font-bold text-red-600" data-oid="o2r:cjl">
              {stats.altaPrioridad}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="gm48._.">
              requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card data-oid="0u79uyp">
        <CardContent className="pt-6" data-oid="0mvn09s">
          <div className="flex flex-col gap-4 md:flex-row md:items-center" data-oid="o9suy7i">
            <div className="relative flex-1" data-oid="0aaltmb">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                data-oid=".7uaf9w"
              />
              <Input
                placeholder="Buscar por nombre, email o curso..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid="3z7b7m-"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="7dgx4rv">
              <SelectTrigger className="w-full md:w-[160px]" data-oid="yu3j8f.">
                <SelectValue placeholder="Estado" data-oid="93sn777" />
              </SelectTrigger>
              <SelectContent data-oid="uk41dlm">
                <SelectItem value="todos" data-oid="1z3wl.h">
                  Todos
                </SelectItem>
                <SelectItem value="en_lista" data-oid="1bbxr.w">
                  En Lista
                </SelectItem>
                <SelectItem value="notificado" data-oid="znz2144">
                  Notificado
                </SelectItem>
                <SelectItem value="aceptado" data-oid="_xpvgfl">
                  Aceptado
                </SelectItem>
                <SelectItem value="rechazado" data-oid="dy2.e:c">
                  Rechazado
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadFilter} onValueChange={setPrioridadFilter} data-oid="s1r.oqf">
              <SelectTrigger className="w-full md:w-[160px]" data-oid=".fs52rt">
                <SelectValue placeholder="Prioridad" data-oid="p1zkq3g" />
              </SelectTrigger>
              <SelectContent data-oid="j5qs2rf">
                <SelectItem value="todas" data-oid="tueztim">
                  Todas
                </SelectItem>
                <SelectItem value="alta" data-oid="euf7x6n">
                  Alta
                </SelectItem>
                <SelectItem value="media" data-oid="6oc_pni">
                  Media
                </SelectItem>
                <SelectItem value="baja" data-oid="iitzv:a">
                  Baja
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="4o6lea0">
              <SelectTrigger className="w-full md:w-[160px]" data-oid="xh4o4t2">
                <SelectValue placeholder="Sede" data-oid="e2qqst:" />
              </SelectTrigger>
              <SelectContent data-oid=".0v:swn">
                <SelectItem value="todas" data-oid="zh40-t-">
                  Todas
                </SelectItem>
                <SelectItem value="Sede Norte" data-oid="48-1-gt">
                  Sede Norte
                </SelectItem>
                <SelectItem value="Sede Santa Cruz" data-oid="1:qx.uw">
                  Sede Santa Cruz
                </SelectItem>
                <SelectItem value="Sede Sur" data-oid="-k68-t4">
                  Sede Sur
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de lista de espera */}
      <Card data-oid="azi5ug-">
        <CardHeader data-oid=":ga6fxb">
          <CardTitle className="flex items-center gap-2" data-oid="vh64q2n">
            <ListTodo className="h-5 w-5" style={{ color: '#F2014B' }} data-oid="97xaqye" />
            Cola de Espera ({filteredLista.length})
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="ht.2qc.">
          <Table data-oid="kp7wko7">
            <TableHeader data-oid="-3ef:-6">
              <TableRow data-oid="uzh.aqg">
                <TableHead className="w-[60px]" data-oid="zapr59u">
                  #
                </TableHead>
                <TableHead data-oid="1_8hm1j">Alumno</TableHead>
                <TableHead data-oid="zpjgupt">Curso/Ciclo</TableHead>
                <TableHead data-oid="c4ymqb6">Convocatoria</TableHead>
                <TableHead data-oid="2wnxep0">Prioridad</TableHead>
                <TableHead data-oid="nggta-g">Delante</TableHead>
                <TableHead data-oid="3f3e9zc">Estado</TableHead>
                <TableHead className="text-right" data-oid="-0nl6gc">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="v.z4srb">
              {filteredLista.map((item) => {
                const prioridadInfo = prioridadConfig[item.prioridad]
                const estadoInfo = estadoConfig[item.estado]
                const StatusIcon = estadoInfo.icon
                return (
                  <TableRow key={item.id} data-oid="ims98dw">
                    <TableCell data-oid="ok51osp">
                      <div
                        className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm"
                        data-oid="3hwlj:5"
                      >
                        {item.posicion}
                      </div>
                    </TableCell>
                    <TableCell data-oid="onq6rhv">
                      <div className="flex items-center gap-3" data-oid=":fq6::r">
                        <div
                          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                          data-oid="mg53wj-"
                        >
                          <User className="h-5 w-5 text-muted-foreground" data-oid="ddxz:k:" />
                        </div>
                        <div className="flex flex-col" data-oid="tvev8qb">
                          <span className="font-medium" data-oid="gukinnx">
                            {item.alumno.nombre}
                          </span>
                          <span
                            className="text-sm text-muted-foreground flex items-center gap-1"
                            data-oid="w30yd86"
                          >
                            <Mail className="h-3 w-3" data-oid="qu399.w" />
                            {item.alumno.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-oid="s7_5_6s">
                      <div className="flex flex-col" data-oid="4h3h3f1">
                        <span className="font-medium" data-oid="2av1dt8">
                          {item.curso}
                        </span>
                        <Badge variant="outline" className="w-fit mt-1" data-oid="7r07fks">
                          {item.tipo === 'Ciclo Superior' ? (
                            <GraduationCap className="h-3 w-3 mr-1" data-oid="zts7hzp" />
                          ) : (
                            <BookOpen className="h-3 w-3 mr-1" data-oid="l-xwbvl" />
                          )}
                          {item.tipo}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell data-oid="k2lp3kw">
                      <div className="flex flex-col" data-oid="4h5-tmf">
                        <span className="font-mono text-sm" data-oid="g0ccc7a">
                          {item.convocatoria}
                        </span>
                        <span className="text-xs text-muted-foreground" data-oid="lrjvigc">
                          {item.sede}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell data-oid="7_2_q5k">
                      <Badge
                        className={`${prioridadInfo.bgColor} ${prioridadInfo.color}`}
                        data-oid="loxzcn_"
                      >
                        {item.prioridad === 'alta' && (
                          <ArrowUp className="h-3 w-3 mr-1" data-oid="k-drmc7" />
                        )}
                        {item.prioridad === 'baja' && (
                          <ArrowDown className="h-3 w-3 mr-1" data-oid="nhb-89d" />
                        )}
                        {prioridadInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell data-oid="d09b7b_">
                      <span className="font-bold text-lg" data-oid="q40i-s0">
                        {item.plazasDelante}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1" data-oid="_.izh8j">
                        personas
                      </span>
                    </TableCell>
                    <TableCell data-oid=":884hq1">
                      <Badge
                        className={`${estadoInfo.bgColor} ${estadoInfo.color} flex items-center gap-1 w-fit`}
                        data-oid="bg:eqsf"
                      >
                        <StatusIcon className="h-3 w-3" data-oid="d6doip4" />
                        {estadoInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" data-oid="ew9or93">
                      <DropdownMenu data-oid="01b42ll">
                        <DropdownMenuTrigger asChild data-oid="9ze8cw1">
                          <Button variant="ghost" size="sm" data-oid="gaxv35s">
                            <MoreHorizontal className="h-4 w-4" data-oid=".td9-en" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-oid="jd5b5xx">
                          <DropdownMenuItem data-oid="5snr0f-">
                            <Eye className="mr-2 h-4 w-4" data-oid="4rqqu_r" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid="1692jr5">
                            <Edit className="mr-2 h-4 w-4" data-oid="i50at09" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid=".:bapz_">
                            <Phone className="mr-2 h-4 w-4" data-oid="a5789ai" />
                            Llamar
                          </DropdownMenuItem>
                          <DropdownMenuItem data-oid="1brdajr">
                            <Send className="mr-2 h-4 w-4" data-oid="qvug3cq" />
                            Enviar notificación
                          </DropdownMenuItem>
                          <DropdownMenuSeparator data-oid="r6mtzx1" />
                          {item.estado === 'en_lista' && (
                            <DropdownMenuItem data-oid="iralw8l">
                              <ArrowUp className="mr-2 h-4 w-4" data-oid="8r-se11" />
                              Subir prioridad
                            </DropdownMenuItem>
                          )}
                          {item.estado === 'notificado' && (
                            <DropdownMenuItem className="text-green-600" data-oid="jf5.q0l">
                              <CheckCircle2 className="mr-2 h-4 w-4" data-oid="rzgb--e" />
                              Convertir a matrícula
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator data-oid="m-xk1f-" />
                          <DropdownMenuItem className="text-destructive" data-oid="2-9admi">
                            <Trash2 className="mr-2 h-4 w-4" data-oid="_1.ij9a" />
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
      <div className="grid gap-4 md:grid-cols-2" data-oid="-fsza4.">
        <Card data-oid="wsxsr4v">
          <CardHeader data-oid="7k9vrk4">
            <CardTitle className="text-base" data-oid="04kaony">
              Cursos con Mayor Demanda
            </CardTitle>
            <CardDescription data-oid="he_rmkp">
              Cursos con más personas en lista de espera
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="88ao7d1">
            <div className="space-y-3" data-oid="4pkb-bt">
              {[
                { curso: 'DAW - Desarrollo Aplicaciones Web', espera: 4 },
                { curso: 'Marketing Digital Avanzado', espera: 3 },
                { curso: 'Community Manager', espera: 2 },
                { curso: 'DAM - Desarrollo Apps Multiplataforma', espera: 2 },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  data-oid="ofe0fqq"
                >
                  <span className="font-medium text-sm" data-oid="hc713:3">
                    {item.curso}
                  </span>
                  <Badge variant="outline" data-oid="lxpus-9">
                    {item.espera} en espera
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="3i59pzg">
          <CardHeader data-oid=".f.9.5n">
            <CardTitle className="text-base" data-oid="u06gd2d">
              Acciones Pendientes
            </CardTitle>
            <CardDescription data-oid="0.3op8h">Tareas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent data-oid="a:zz0g.">
            <div className="space-y-3" data-oid="dykd4q3">
              <div
                className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50"
                data-oid="u:935j9"
              >
                <Bell className="h-5 w-5 text-amber-600 mt-0.5" data-oid="92gy5ub" />
                <div data-oid="qprq1wr">
                  <p className="font-medium text-amber-900" data-oid="pbggvth">
                    1 respuesta pendiente
                  </p>
                  <p className="text-sm text-amber-800" data-oid="f9ua:tu">
                    David González - esperando confirmación
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50"
                data-oid="y8rijo5"
              >
                <ArrowUp className="h-5 w-5 text-red-600 mt-0.5" data-oid="hz21yhu" />
                <div data-oid="dll2ptc">
                  <p className="font-medium text-red-900" data-oid="9.ujz6l">
                    3 alta prioridad
                  </p>
                  <p className="text-sm text-red-800" data-oid="h31d47o">
                    Requieren seguimiento urgente
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50"
                data-oid="_o1gwur"
              >
                <Send className="h-5 w-5 text-blue-600 mt-0.5" data-oid="xh2hdb2" />
                <div data-oid="4s8:adp">
                  <p className="font-medium text-blue-900" data-oid="v0gg-g1">
                    2 sin contactar
                  </p>
                  <p className="text-sm text-blue-800" data-oid="jwe_d15">
                    Sin contacto en más de 7 días
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
