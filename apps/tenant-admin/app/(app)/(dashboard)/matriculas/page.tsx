'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  DashboardListingLayout,
  DashboardToolbar,
  ENROLLMENT_LIST_COLUMNS,
  ListingActions,
  ListingColumnBoard,
  ListingColumnCard,
  formatListingDate,
} from '@payload-config/components/akademate/dashboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  UserPlus,
  BookOpen,
  CheckCircle2,
  Download,
  Building2,
  AlertCircle,
  User,
  GraduationCap,
  Upload,
} from 'lucide-react'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'
import { BulkEnrollmentDialog } from './components/BulkEnrollmentDialog'
import { NewEnrollmentDialog } from './components/NewEnrollmentDialog'
import {
  resolveEnrollmentLifecycle,
  type EnrollmentLifecycleKey,
} from '@/app/lib/enrollment-lifecycle'

interface MatriculaRow {
  id: string
  leadId: string
  alumno: { nombre: string; email: string; telefono: string }
  curso: string
  tipo: string
  convocatoria: string
  sede: string
  estado: EnrollmentLifecycleKey
  estadoLabel: string
  estadoClass: string
  fechaSolicitud: string
  metodoPago: 'FUNDAE' | 'Privado' | 'Financiación'
  importe: number
  documentacionCompleta: boolean
}

interface MatriculaApiDoc {
  id: string | number
  status?: string
  payment_status?: string
  total_amount?: number
  amount_paid?: number
  enrolled_at?: string
  created_at?: string
  lead?: {
    id?: string | number
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    phone?: string | null
  }
  course?: {
    name?: string | null
  }
  course_run?: {
    code?: string | null
  }
  campus?: {
    name?: string | null
  }
}

const estadoFilterOptions: Array<{ value: EnrollmentLifecycleKey | 'todos'; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'pre_enrollment', label: 'Pre-matrícula' },
  { value: 'pending_payment', label: 'Pendiente de pago' },
  { value: 'enrolled', label: 'Matriculado' },
  { value: 'completed', label: 'Completada' },
  { value: 'rejected', label: 'Cancelada' },
]

const pagoConfig: Record<MatriculaRow['metodoPago'], { label: string; variant: 'info' | 'secondary' | 'success' }> = {
  FUNDAE: { label: 'FUNDAE', variant: 'info' },
  Privado: { label: 'Privado', variant: 'secondary' },
  Financiación: { label: 'Financiación', variant: 'success' },
}

function mapApiDocToMatricula(doc: MatriculaApiDoc): MatriculaRow {
  const lead = doc.lead ?? {}
  const nombre =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() ||
    lead.email ||
    `Lead #${lead.id ?? 's/n'}`
  const createdAt = doc.created_at ?? new Date().toISOString()
  const totalAmount = typeof doc.total_amount === 'number' ? doc.total_amount : 0
  const paidAmount = typeof doc.amount_paid === 'number' ? doc.amount_paid : 0
  const lifecycle = resolveEnrollmentLifecycle({
    status: doc.status,
    payment_status: doc.payment_status,
    amount_paid: paidAmount,
    total_amount: totalAmount,
    enrolled_at: doc.enrolled_at,
    created_at: createdAt,
  })
  const leadId = lead.id !== undefined && lead.id !== null ? String(lead.id) : ''
  return {
    id: String(doc.id),
    leadId,
    alumno: {
      nombre,
      email: lead.email ?? 'Sin email',
      telefono: lead.phone ?? 'Sin teléfono',
    },
    curso: doc.course?.name || 'Curso sin especificar',
    tipo: 'Curso',
    convocatoria: doc.course_run?.code || 'Sin convocatoria',
    sede: doc.campus?.name || 'Sin sede',
    estado: lifecycle.key,
    estadoLabel: lifecycle.label,
    estadoClass: lifecycle.badgeClass,
    fechaSolicitud: createdAt,
    metodoPago: 'Privado',
    importe: totalAmount,
    documentacionCompleta: lifecycle.key === 'enrolled' || lifecycle.key === 'completed',
  }
}

export default function MatriculasPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [matriculasData, setMatriculasData] = useState<MatriculaRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('todos')
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [newEnrollmentDialogOpen, setNewEnrollmentDialogOpen] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [initialLeadId, setInitialLeadId] = useState<string | null>(null)

  const loadMatriculas = useCallback(async () => {
    try {
      setLoadError(null)
      const res = await fetch('/api/matriculas?limit=500', { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudieron cargar las matriculas')

      const payload = await res.json()
      const docs = Array.isArray(payload?.docs) ? payload.docs : []
      const mapped = docs.map((doc: MatriculaApiDoc) => mapApiDocToMatricula(doc))

      setMatriculasData(mapped)
    } catch (error) {
      setMatriculasData([])
      setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las matriculas')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      await loadMatriculas()
    }

    if (!cancelled) {
      void run()
    }
    return () => {
      cancelled = true
    }
  }, [loadMatriculas])

  useEffect(() => {
    const shouldOpen = searchParams.get('nueva')
    const leadId = searchParams.get('leadId')
    if (shouldOpen === '1') {
      setInitialLeadId(leadId || null)
      setNewEnrollmentDialogOpen(true)
    }
  }, [searchParams])

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

  return (
    <DashboardListingLayout
      title="Matrículas"
      icon={GraduationCap}
      actions={
        <ListingActions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const columns: ExportColumn<MatriculaRow>[] = [
                { header: 'Alumno', getValue: (row) => row.alumno.nombre },
                { header: 'Email', getValue: (row) => row.alumno.email },
                { header: 'Curso', getValue: (row) => row.curso },
                { header: 'Sede', getValue: (row) => row.sede },
                { header: 'Estado', getValue: (row) => row.estadoLabel },
              ]
              downloadCsv(`matriculas-${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredMatriculas)
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button size="sm" onClick={() => setNewEnrollmentDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva matrícula</span>
          </Button>
        </ListingActions>
      }
      toolbar={
      <DashboardToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por alumno, email o curso..."
        filters={
          <>
            <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="x3-nl8e">
              <SelectTrigger className="w-full min-w-0" data-oid="m9hmj05">
                <SelectValue placeholder="Estado" data-oid="urh8:pw" />
              </SelectTrigger>
              <SelectContent data-oid="an1po8_">
                {estadoFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="z9wonbv">
              <SelectTrigger className="w-full min-w-0" data-oid="0tinwh0">
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
              <SelectTrigger className="w-full min-w-0" data-oid="c1nh-n_">
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
          </>
        }
      />
      }
    >
      {loadError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {filteredMatriculas.length === 0 && matriculasData.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No hay solicitudes de matrícula registradas todavía.
        </p>
      ) : filteredMatriculas.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          No hay solicitudes de matrícula registradas todavía.
        </p>
      ) : (
        <ListingColumnBoard columns={ENROLLMENT_LIST_COLUMNS}>
          {filteredMatriculas.map((matricula) => {
            const pagoInfo = pagoConfig[matricula.metodoPago]
            const openFicha = () => router.push(`/dashboard/matriculas/${matricula.id}`)
            const openEditor = () => router.push(`/dashboard/matriculas/${matricula.id}/editar`)
            return (
              <ListingColumnCard
                key={matricula.id}
                columns={ENROLLMENT_LIST_COLUMNS}
                onClick={openFicha}
                cells={[
                  <div key="alumno" className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{matricula.alumno.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">{matricula.alumno.email}</p>
                    </div>
                  </div>,
                  <div key="curso" className="min-w-0">
                    <p className="truncate text-sm font-medium">{matricula.curso}</p>
                    <p className="truncate text-xs text-muted-foreground">{matricula.sede}</p>
                  </div>,
                  <span key="fecha" className="text-sm">{formatListingDate(matricula.fechaSolicitud)}</span>,
                  <Badge key="metodo" variant={pagoInfo.variant}>{pagoInfo.label}</Badge>,
                  <span key="importe" className="text-sm font-medium">{matricula.importe.toLocaleString('es-ES')}€</span>,
                  matricula.documentacionCompleta ? (
                    <CheckCircle2 key="docs" className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle key="docs" className="h-5 w-5 text-amber-500" />
                  ),
                  <Badge key="estado" variant="static" className={matricula.estadoClass}>
                    {matricula.estadoLabel}
                  </Badge>,
                  <Button
                    key="ver"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      openEditor()
                    }}
                  >
                    Editar
                  </Button>,
                ]}
              />
            )
          })}
        </ListingColumnBoard>
      )}

      <div className="grid gap-4 md:grid-cols-3" data-oid="bm1erbb">
        <Card data-oid="jgn148x">
          <CardHeader data-oid="90hw40:">
            <CardTitle className="text-base" data-oid="azn2_j-">Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent data-oid="ux87lto">
            <div className="space-y-3" data-oid="i6mf:o4">
              {Object.entries(pagoConfig).map(([key, value]) => {
                const count = matriculasData.filter((m) => m.metodoPago === key && (m.estado === 'enrolled' || m.estado === 'completed')).length
                const total = matriculasData
                  .filter((m) => m.metodoPago === key && (m.estado === 'enrolled' || m.estado === 'completed'))
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
                  const aceptadas = matriculasData.filter((m) => m.sede === sede && (m.estado === 'enrolled' || m.estado === 'completed')).length
                  return (
                    <div key={sede} className="flex items-center justify-between p-2 rounded-lg bg-muted/50" data-oid="5j7-a2-">
                      <div className="flex items-center gap-2" data-oid="vev0x28">
                        <Building2 className="h-4 w-4 text-muted-foreground" data-oid="22ptgxk" />
                        <span className="font-medium" data-oid="eoi9lru">{sede}</span>
                      </div>
                      <div className="text-right" data-oid="busu_5h">
                        <p className="font-medium" data-oid="b3gmko6">{aceptadas}/{count}</p>
                        <p className="text-xs text-muted-foreground" data-oid="wz-1w49">matriculados</p>
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
                    .filter((m) => m.tipo === tipo && (m.estado === 'enrolled' || m.estado === 'completed'))
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
      <NewEnrollmentDialog
        open={newEnrollmentDialogOpen}
        onOpenChange={(open) => {
          setNewEnrollmentDialogOpen(open)
          if (!open) {
            setInitialLeadId(null)
            if (searchParams.get('nueva') === '1') {
              router.replace('/matriculas')
            }
          }
        }}
        initialLeadId={initialLeadId}
        onCreated={() => {
          void loadMatriculas()
        }}
      />
    </DashboardListingLayout>
  )
}
