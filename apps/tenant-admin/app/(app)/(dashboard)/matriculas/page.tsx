'use client'

import { type ComponentType, useEffect, useMemo, useState } from 'react'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'
import {
  Search,
  UserPlus,
  Mail,
  BookOpen,
  Eye,
  Edit,
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
  Upload,
} from 'lucide-react'
import { BulkEnrollmentDialog } from './components/BulkEnrollmentDialog'

interface LeadRow {
  id: string | number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  lead_type?: string | null
  source_form?: string | null
  source_page?: string | null
  status?: string | null
  campaign_code?: string | null
  enrollment_id?: string | number | null
  created_at?: string | null
  createdAt?: string | null
}

interface MatriculaRow {
  id: string
  alumno: { nombre: string; email: string; telefono: string }
  curso: string
  tipo: string
  convocatoria: string
  sede: string
  estado: 'pendiente' | 'aceptada' | 'rechazada'
  fechaSolicitud: string
  metodoPago: 'FUNDAE' | 'Privado' | 'Financiación'
  importe: number
  documentacionCompleta: boolean
}

const estadoConfig: Record<
  MatriculaRow['estado'],
  {
    label: string
    variant: 'warning' | 'success' | 'destructive'
    icon: ComponentType<{ className?: string }>
  }
> = {
  pendiente: { label: 'Pendiente', variant: 'warning', icon: Clock },
  aceptada: { label: 'Aceptada', variant: 'success', icon: CheckCircle2 },
  rechazada: { label: 'Rechazada', variant: 'destructive', icon: XCircle },
}

const pagoConfig: Record<MatriculaRow['metodoPago'], { label: string; variant: 'info' | 'secondary' | 'success' }> = {
  FUNDAE: { label: 'FUNDAE', variant: 'info' },
  Privado: { label: 'Privado', variant: 'secondary' },
  Financiación: { label: 'Financiación', variant: 'success' },
}

function resolveEstado(status?: string | null): MatriculaRow['estado'] {
  if (status === 'enrolled') return 'aceptada'
  if (status === 'discarded' || status === 'not_interested' || status === 'unreachable') return 'rechazada'
  return 'pendiente'
}

function mapLeadToMatricula(lead: LeadRow): MatriculaRow | null {
  const hasEnrollment = Boolean(lead.enrollment_id)
  const status = lead.status ?? ''
  if (!hasEnrollment && status !== 'enrolling' && status !== 'enrolled') return null

  const nombre = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email || `Lead #${lead.id}`
  const estado = resolveEstado(status)
  const createdAt = lead.created_at ?? lead.createdAt ?? new Date().toISOString()

  return {
    id: String(lead.enrollment_id ?? lead.id),
    alumno: {
      nombre,
      email: lead.email ?? 'Sin email',
      telefono: lead.phone ?? 'Sin telefono',
    },
    curso: lead.source_form || lead.campaign_code || 'Curso sin especificar',
    tipo: lead.lead_type === 'inscripcion' ? 'Ciclo Superior' : 'Curso',
    convocatoria: lead.campaign_code || 'Sin convocatoria',
    sede: lead.source_page || 'Campus principal',
    estado,
    fechaSolicitud: createdAt,
    metodoPago: 'Privado',
    importe: 0,
    documentacionCompleta: estado === 'aceptada',
  }
}

export default function MatriculasPage() {
  const [matriculasData, setMatriculasData] = useState<MatriculaRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadMatriculas = async () => {
      try {
        setLoadError(null)
        const res = await fetch('/api/leads?limit=500', { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudieron cargar las matriculas')

        const payload = await res.json()
        const docs = Array.isArray(payload?.docs) ? payload.docs : []
        const mapped = docs.map(mapLeadToMatricula).filter(Boolean) as MatriculaRow[]

        if (!cancelled) setMatriculasData(mapped)
      } catch (error) {
        if (!cancelled) {
          setMatriculasData([])
          setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las matriculas')
        }
      }
    }

    void loadMatriculas()
    return () => {
      cancelled = true
    }
  }, [])

  const availableSedes = useMemo(
    () => Array.from(new Set(matriculasData.map((m) => m.sede))).sort(),
    [matriculasData],
  )
  const availableTipos = useMemo(
    () => Array.from(new Set(matriculasData.map((m) => m.tipo))).sort(),
    [matriculasData],
  )

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
    ingresosTotales: matriculasData
      .filter((m) => m.estado === 'aceptada')
      .reduce((sum, m) => sum + m.importe, 0),
  }

  return (
    <div className="space-y-6" data-oid="k_ex1sq">
      <PageHeader
        title="Matrículas"
        description="Gestión de solicitudes de matrícula y seguimiento de inscripciones"
        icon={GraduationCap}
        actions={
          <>
            <Button variant="outline" data-oid="lca.h7w">
              <Download className="mr-2 h-4 w-4" data-oid="9l3qgn3" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)} data-oid="ms7ytpn">
              <Upload className="mr-2 h-4 w-4" data-oid="p-dgxs_" />
              Importar CSV
            </Button>
            <Button data-oid="pdb:h9a">
              <UserPlus className="mr-2 h-4 w-4" data-oid="tnx7zku" />
              Nueva Matrícula
            </Button>
          </>
        }
        data-oid="yh2eoy0"
      />

      {loadError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5" data-oid="ejt5ycz">
        <Card data-oid=".8g7trd">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="j5.u9l:">
            <CardTitle className="text-sm font-medium" data-oid="0xsj-pw">
              Total Solicitudes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" data-oid="w91koq9" />
          </CardHeader>
          <CardContent data-oid="ia2t1qg">
            <div className="text-2xl font-bold" data-oid="ijrsb8o">
              {stats.total}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="ho2m.jw">
              este periodo
            </p>
          </CardContent>
        </Card>
        <Card data-oid="yrd0bz.">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="bx.nqbb">
            <CardTitle className="text-sm font-medium" data-oid="_bm5bth">
              Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" data-oid="nlasco7" />
          </CardHeader>
          <CardContent data-oid="9e58:_o">
            <div className="text-2xl font-bold text-amber-600" data-oid="p2s0hk3">
              {stats.pendientes}
            </div>
            <p className="text-xs text-muted-foreground" data-oid=":ygp.ot">
              requieren revisión
            </p>
          </CardContent>
        </Card>
        <Card data-oid=":x5-guh">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="h0cszhe">
            <CardTitle className="text-sm font-medium" data-oid="3hi4hrh">
              Aceptadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" data-oid="ye4v7z3" />
          </CardHeader>
          <CardContent data-oid="1rfdgtv">
            <div className="text-2xl font-bold text-green-600" data-oid=".b:0pgm">
              {stats.aceptadas}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="f5ih93o">
              matrículas confirmadas
            </p>
          </CardContent>
        </Card>
        <Card data-oid="m.rrs:f">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="8t378vu">
            <CardTitle className="text-sm font-medium" data-oid="5nlz4qv">
              Rechazadas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" data-oid="t452oh5" />
          </CardHeader>
          <CardContent data-oid=":0_0mmo">
            <div className="text-2xl font-bold text-red-600" data-oid="t0vv69p">
              {stats.rechazadas}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="cfizeii">
              no aprobadas
            </p>
          </CardContent>
        </Card>
        <Card data-oid="dz1enrt">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" data-oid="3qlhiv5">
            <CardTitle className="text-sm font-medium" data-oid="kzw-rs-">
              Ingresos
            </CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" data-oid="i0vrcc6" />
          </CardHeader>
          <CardContent data-oid="tn4i3.:">
            <div className="text-2xl font-bold text-emerald-600" data-oid="epco1-8">
              {stats.ingresosTotales.toLocaleString('es-ES')}€
            </div>
            <p className="text-xs text-muted-foreground" data-oid="ymcjfyd">
              matrículas aceptadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-oid="qko4890">
        <CardContent className="pt-6" data-oid="b_896h2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center" data-oid="0x2jtdq">
            <div className="relative flex-1" data-oid="1f3e2fe">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" data-oid="bfl21uf" />
              <Input
                placeholder="Buscar por alumno, email o curso..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-oid=":j-tg-b"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="x3-nl8e">
              <SelectTrigger className="w-full md:w-[160px]" data-oid="m9hmj05">
                <SelectValue placeholder="Estado" data-oid="urh8:pw" />
              </SelectTrigger>
              <SelectContent data-oid="an1po8_">
                <SelectItem value="todos" data-oid="y-ch1va">Todos</SelectItem>
                <SelectItem value="pendiente" data-oid="lprx_nk">Pendiente</SelectItem>
                <SelectItem value="aceptada" data-oid="t.xoom8">Aceptada</SelectItem>
                <SelectItem value="rechazada" data-oid="u5c9sje">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="z9wonbv">
              <SelectTrigger className="w-full md:w-[160px]" data-oid="0tinwh0">
                <SelectValue placeholder="Sede" data-oid="his:0on" />
              </SelectTrigger>
              <SelectContent data-oid="-cfif5g">
                <SelectItem value="todas" data-oid="8ygxa:d">Todas</SelectItem>
                {availableSedes.map((sede) => (
                  <SelectItem key={sede} value={sede}>
                    {sede}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter} data-oid=":drcmad">
              <SelectTrigger className="w-full md:w-[160px]" data-oid="c1nh-n_">
                <SelectValue placeholder="Tipo" data-oid="d00bplo" />
              </SelectTrigger>
              <SelectContent data-oid="8vrrfbr">
                <SelectItem value="todos" data-oid="3yifq0m">Todos</SelectItem>
                {availableTipos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="ge4hmtc">
        <CardHeader data-oid=":o4gr.2">
          <CardTitle className="flex items-center gap-2" data-oid="9a.1an2">
            <UserPlus className="h-5 w-5" style={{ color: '#F2014B' }} data-oid="p7ak3tz" />
            Solicitudes de Matrícula ({filteredMatriculas.length})
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="l5mvol.">
          <div className="overflow-x-auto" data-oid="qo_5bq_">
            <Table data-oid="apef6_7">
              <TableHeader data-oid="x9u39g-">
                <TableRow data-oid="5ids49c">
                  <TableHead data-oid="wkqw1:p">Alumno</TableHead>
                  <TableHead data-oid="utey5m_">Curso/Ciclo</TableHead>
                  <TableHead data-oid="c:w7bc3">Convocatoria</TableHead>
                  <TableHead data-oid="vu6crcy">Método Pago</TableHead>
                  <TableHead data-oid="5ju8thj">Importe</TableHead>
                  <TableHead data-oid=".7e26z3">Docs</TableHead>
                  <TableHead data-oid="i.a4cpc">Estado</TableHead>
                  <TableHead className="text-right" data-oid=":d8z4l-">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-oid="3.6egpk">
                {filteredMatriculas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No hay solicitudes de matrícula registradas todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatriculas.map((matricula) => {
                    const config = estadoConfig[matricula.estado]
                    const StatusIcon = config.icon
                    const pagoInfo = pagoConfig[matricula.metodoPago]
                    return (
                      <TableRow key={matricula.id} data-oid="hletcut">
                        <TableCell data-oid="3pbv4e9">
                          <div className="flex items-center gap-3" data-oid="xtl8rjq">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center" data-oid="27ot_lu">
                              <User className="h-5 w-5 text-muted-foreground" data-oid="uqxbk:4" />
                            </div>
                            <div className="flex flex-col" data-oid="xv3ol80">
                              <span className="font-medium" data-oid=":v4c1y.">{matricula.alumno.nombre}</span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1" data-oid="hozwx9d">
                                <Mail className="h-3 w-3" data-oid="wjf29f5" />
                                {matricula.alumno.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-oid="2l.wae1">
                          <div className="flex flex-col" data-oid="ilewjov">
                            <span className="font-medium" data-oid="l2hx68x">{matricula.curso}</span>
                            <Badge variant="outline" className="w-fit mt-1" data-oid="3wcy0:d">
                              {matricula.tipo === 'Ciclo Superior' ? (
                                <GraduationCap className="h-3 w-3 mr-1" data-oid="xj-fgsx" />
                              ) : (
                                <BookOpen className="h-3 w-3 mr-1" data-oid="b7qr77e" />
                              )}
                              {matricula.tipo}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell data-oid="--.v28i">
                          <div className="flex flex-col" data-oid="yreijz_">
                            <span className="font-mono text-sm" data-oid="ubwot00">{matricula.convocatoria}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1" data-oid="-_egdnm">
                              <Building2 className="h-3 w-3" data-oid="28ew7pu" />
                              {matricula.sede}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-oid="od55rfa">
                          <Badge variant={pagoInfo.variant} data-oid="dq.ptg8">{pagoInfo.label}</Badge>
                        </TableCell>
                        <TableCell data-oid="w_m2stw">
                          <span className="font-medium" data-oid="it0cxkw">{matricula.importe.toLocaleString('es-ES')}€</span>
                        </TableCell>
                        <TableCell data-oid="d68d:p5">
                          {matricula.documentacionCompleta ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" data-oid="hvp4cil" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500" data-oid="sfzt5m:" />
                          )}
                        </TableCell>
                        <TableCell data-oid="bt5ohj_">
                          <Badge variant={config.variant} className="flex items-center gap-1 w-fit" data-oid="8njhayj">
                            <StatusIcon className="h-3 w-3" data-oid="fo676js" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" data-oid="l9p6-53">
                          <DropdownMenu data-oid="v_1u3ud">
                            <DropdownMenuTrigger asChild data-oid=":ze3ykc">
                              <Button variant="ghost" size="sm" data-oid="0_k8nm-">
                                <MoreHorizontal className="h-4 w-4" data-oid="d88dwbx" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-oid="36cp-ex">
                              <DropdownMenuItem data-oid="3q2x-ff">
                                <Eye className="mr-2 h-4 w-4" data-oid="nmiu9dd" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem data-oid="h5n1kgr">
                                <Edit className="mr-2 h-4 w-4" data-oid="52z3miu" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator data-oid="kzkznsi" />
                              <DropdownMenuItem className="text-destructive" data-oid="r_cj48z">
                                <XCircle className="mr-2 h-4 w-4" data-oid="-0uftlk" />
                                Marcar rechazada
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3" data-oid="bm1erbb">
        <Card data-oid="jgn148x">
          <CardHeader data-oid="90hw40:">
            <CardTitle className="text-base" data-oid="azn2_j-">Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent data-oid="ux87lto">
            <div className="space-y-3" data-oid="i6mf:o4">
              {Object.entries(pagoConfig).map(([key, value]) => {
                const count = matriculasData.filter((m) => m.metodoPago === key && m.estado === 'aceptada').length
                const total = matriculasData
                  .filter((m) => m.metodoPago === key && m.estado === 'aceptada')
                  .reduce((sum, m) => sum + m.importe, 0)

                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-oid="25.04fi">
                    <Badge variant={value.variant} data-oid="--c:3w.">{value.label}</Badge>
                    <div className="text-right" data-oid="9vn4ov6">
                      <p className="font-medium" data-oid="2y6ygc-">{total.toLocaleString('es-ES')}€</p>
                      <p className="text-xs text-muted-foreground" data-oid="hrmf8uc">{count} matrículas</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="42j8yg2">
          <CardHeader data-oid="lwj6h0u">
            <CardTitle className="text-base" data-oid="7wt1bfz">Por Sede</CardTitle>
          </CardHeader>
          <CardContent data-oid="464vrno">
            <div className="space-y-3" data-oid="zkhmeij">
              {availableSedes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos de sede.</p>
              ) : (
                availableSedes.map((sede) => {
                  const count = matriculasData.filter((m) => m.sede === sede).length
                  const aceptadas = matriculasData.filter((m) => m.sede === sede && m.estado === 'aceptada').length
                  return (
                    <div key={sede} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-oid="5j7-a2-">
                      <div className="flex items-center gap-2" data-oid="vev0x28">
                        <Building2 className="h-4 w-4 text-muted-foreground" data-oid="22ptgxk" />
                        <span className="font-medium" data-oid="eoi9lru">{sede}</span>
                      </div>
                      <div className="text-right" data-oid="busu_5h">
                        <p className="font-medium" data-oid="b3gmko6">{aceptadas}/{count}</p>
                        <p className="text-xs text-muted-foreground" data-oid="wz-1w49">aceptadas</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="igih7:k">
          <CardHeader data-oid="-7evfm-">
            <CardTitle className="text-base" data-oid="9a_qpls">Por Tipo de Formación</CardTitle>
          </CardHeader>
          <CardContent data-oid="yelcf6-">
            <div className="space-y-3" data-oid="z2h9c:j">
              {availableTipos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos de tipo.</p>
              ) : (
                availableTipos.map((tipo) => {
                  const count = matriculasData.filter((m) => m.tipo === tipo).length
                  const total = matriculasData
                    .filter((m) => m.tipo === tipo && m.estado === 'aceptada')
                    .reduce((sum, m) => sum + m.importe, 0)
                  return (
                    <div key={tipo} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-oid="sropgc1">
                      <div className="flex items-center gap-2" data-oid="5d:.c1h">
                        {tipo === 'Ciclo Superior' ? (
                          <GraduationCap className="h-4 w-4 text-muted-foreground" data-oid="zhu1tg:" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-muted-foreground" data-oid="m0l1:0-" />
                        )}
                        <span className="font-medium" data-oid="yo2h1x.">{tipo}</span>
                      </div>
                      <div className="text-right" data-oid="gtm:.-p">
                        <p className="font-medium" data-oid="sug37r9">{total.toLocaleString('es-ES')}€</p>
                        <p className="text-xs text-muted-foreground" data-oid="6o6zu-9">{count} solicitudes</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BulkEnrollmentDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onComplete={() => {
          console.log('Bulk enrollment completed')
        }}
        data-oid="ltoz810"
      />
    </div>
  )
}
