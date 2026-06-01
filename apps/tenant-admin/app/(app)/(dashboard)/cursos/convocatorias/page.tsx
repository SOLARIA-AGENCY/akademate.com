'use client'

export const dynamic = 'force-dynamic'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Edit,
  Eye,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Progress } from '@payload-config/components/ui/progress'
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
  DashboardBreadcrumb,
  DashboardEntityHeader,
  DashboardListingShell,
  DashboardToolbar,
  DashboardViewToggle,
} from '@payload-config/components/akademate/dashboard'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@payload-config/components/akademate/dashboard/Panels'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { getCourseRunEnrollmentStatusInfo } from '@/app/lib/course-run-enrollment-status'
import {
  getPublicStudyTypeFallbackImage,
  normalizePublicStudyType,
  toDashboardStudyType,
  type PublicStudyType,
} from '@/app/lib/website/study-types'
import { cn } from '@payload-config/lib/utils'

type ViewMode = 'grid' | 'list'
type CourseGroup = 'privados' | 'sce'
type CourseRunStatus =
  | 'draft'
  | 'planned'
  | 'published'
  | 'enrollment_open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'enrollment_closed'
  | string

interface Convocatoria {
  id: number | string
  codigo?: string | null
  cursoId?: number | string | null
  cursoNombre?: string | null
  cursoTipo?: string | null
  cursoImagen?: string | null
  campusNombre?: string | null
  aulaNombre?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  dias?: string[] | null
  horaInicio?: string | null
  horaFin?: string | null
  horario?: string | null
  estado?: CourseRunStatus | null
  enrollmentStatus?: string | null
  enrollmentDeadline?: string | null
  planningStatus?: string | null
  trainingType?: string | null
  turno?: string | null
  plazasTotales?: number | null
  plazasOcupadas?: number | null
  precio?: number | null
  profesor?: string | null
  modalidad?: string | null
  campaignStatus?: string | null
}

const COURSE_TYPES: PublicStudyType[] = ['privados', 'ocupados', 'desempleados', 'teleformacion']
const GROUP_TYPES: Record<CourseGroup, PublicStudyType[]> = {
  privados: ['privados', 'teleformacion'],
  sce: ['ocupados', 'desempleados', 'teleformacion'],
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  planned: 'Planificada',
  published: 'Publicada',
  enrollment_open: 'Inscripción abierta',
  enrollment_closed: 'Inscripción cerrada',
  in_progress: 'En curso',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening_extra: 'Tarde/noche',
  online: 'Online',
}

function formatDate(value?: string | null): string {
  if (!value) return 'Pendiente'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pendiente'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatPrice(value?: number | null): string {
  if (typeof value !== 'number' || value <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function normalizeCourseRunType(run: Convocatoria): PublicStudyType {
  const trainingType = String(run.trainingType ?? '').toLowerCase()
  if (trainingType === 'fped') {
    const cursoTipo = normalizePublicStudyType(run.cursoTipo)
    return cursoTipo ?? 'desempleados'
  }
  if (trainingType === 'private') return toDashboardStudyType(run.cursoTipo)
  return toDashboardStudyType(run.cursoTipo ?? run.modalidad ?? null)
}

function getStatusLabel(status?: string | null): string {
  if (!status) return 'Sin estado'
  return STATUS_LABELS[status] ?? status.replaceAll('_', ' ')
}

function getStatusClass(status?: string | null): string {
  const normalized = String(status ?? '').toLowerCase()
  if (['published', 'enrollment_open', 'in_progress'].includes(normalized)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (['cancelled', 'completed', 'enrollment_closed'].includes(normalized)) {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function getEnrollmentClass(status?: string | null): string {
  const normalized = String(status ?? '').toLowerCase()
  if (['open', 'always_open'].includes(normalized)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (normalized === 'scheduled') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-100 text-slate-600'
}

function getWarnings(run: Convocatoria): string[] {
  const warnings: string[] = []
  if (!run.aulaNombre || run.aulaNombre === 'Sin aula') warnings.push('Sin aula asignada')
  if (!run.profesor || run.profesor === 'Sin asignar') warnings.push('Sin docente confirmado')
  if (!run.fechaInicio || !run.fechaFin) warnings.push('Fechas pendientes')
  if (!run.enrollmentStatus) warnings.push('Matrícula no configurada')
  return warnings
}

function occupation(run: Convocatoria): { used: number; total: number; percent: number } {
  const total = Number(run.plazasTotales ?? 0)
  const used = Number(run.plazasOcupadas ?? 0)
  const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
  return { used, total, percent }
}

function ConvocatoriaTypeBadge({ type }: { type: PublicStudyType }) {
  const config = COURSE_TYPE_CONFIG[type]
  return (
    <Badge className={cn('rounded-full text-[11px] font-bold text-white', config.bgColor)}>
      {config.label}
    </Badge>
  )
}

function ConvocatoriaCard({ run }: { run: Convocatoria }) {
  const type = normalizeCourseRunType(run)
  const enrollment = getCourseRunEnrollmentStatusInfo({ enrollment_status: run.enrollmentStatus, status: run.estado })
  const warnings = getWarnings(run)
  const capacity = occupation(run)
  const image = run.cursoImagen || getPublicStudyTypeFallbackImage(type)

  return (
    <Card className="h-full overflow-hidden border-border/80 shadow-sm transition hover:border-primary/50 hover:shadow-md">
      <div className="grid h-full min-h-[300px] grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative min-h-48 overflow-hidden bg-muted md:min-h-full">
          <img src={image} alt={run.cursoNombre ?? 'Convocatoria'} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <ConvocatoriaTypeBadge type={type} />
            <Badge className={cn('rounded-full text-[11px] font-bold', getStatusClass(run.estado))}>
              {getStatusLabel(run.estado)}
            </Badge>
          </div>
        </div>

        <CardContent className="flex min-w-0 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {run.codigo || `Convocatoria ${run.id}`}
              </p>
              <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-foreground">
                {run.cursoNombre || 'Curso sin nombre'}
              </h3>
            </div>
            <Badge className={cn('rounded-full text-[11px] font-bold', getEnrollmentClass(run.enrollmentStatus))}>
              {enrollment.label}
            </Badge>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <InfoLine icon={MapPin} label="Sede" value={`${run.campusNombre || 'Sin sede'} · ${run.aulaNombre || 'Sin aula'}`} />
            <InfoLine icon={CalendarDays} label="Fechas" value={`${formatDate(run.fechaInicio)} - ${formatDate(run.fechaFin)}`} />
            <InfoLine icon={Clock} label="Horario" value={run.horario || 'Horario pendiente'} />
            <InfoLine icon={GraduationCap} label="Docente" value={run.profesor || 'Sin docente confirmado'} />
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-foreground">Plazas</span>
              <span className="text-muted-foreground">
                {capacity.used}/{capacity.total || 0} · {capacity.percent}%
              </span>
            </div>
            <Progress value={capacity.percent} className="mt-2 h-2" />
          </div>

          {warnings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <Badge key={warning} variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {warning}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm">
              <span className="font-semibold text-muted-foreground">Precio:</span>{' '}
              <span className="font-bold text-foreground">{formatPrice(run.precio)}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {run.cursoId ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/cursos/${run.cursoId}`}>Ver curso</Link>
                </Button>
              ) : null}
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
                <Link href={`/dashboard/programacion/${run.id}`}>Ver convocatoria</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[18px_84px_minmax(0,1fr)] items-start gap-2 rounded-lg bg-muted/35 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-semibold text-foreground">{value}</span>
    </div>
  )
}

function ConvocatoriasTable({ runs }: { runs: Convocatoria[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso / código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Sede / aula</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Plazas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              const type = normalizeCourseRunType(run)
              const enrollment = getCourseRunEnrollmentStatusInfo({ enrollment_status: run.enrollmentStatus, status: run.estado })
              const capacity = occupation(run)
              return (
                <TableRow key={run.id}>
                  <TableCell className="max-w-[280px]">
                    <p className="truncate font-semibold">{run.cursoNombre || 'Curso sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{run.codigo || `Convocatoria ${run.id}`}</p>
                  </TableCell>
                  <TableCell><ConvocatoriaTypeBadge type={type} /></TableCell>
                  <TableCell>
                    <p className="font-medium">{run.campusNombre || 'Sin sede'}</p>
                    <p className="text-xs text-muted-foreground">{run.aulaNombre || 'Sin aula'}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(run.fechaInicio)}<br />
                    <span className="text-xs text-muted-foreground">{formatDate(run.fechaFin)}</span>
                  </TableCell>
                  <TableCell className="max-w-[180px]">{run.horario || 'Pendiente'}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{run.profesor || 'Sin docente'}</TableCell>
                  <TableCell>
                    <Badge className={cn('rounded-full text-[11px] font-bold', getEnrollmentClass(run.enrollmentStatus))}>
                      {enrollment.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[110px]">
                    <p className="text-sm font-medium">{capacity.used}/{capacity.total || 0}</p>
                    <Progress value={capacity.percent} className="mt-1 h-1.5" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon" variant="outline" title="Ver convocatoria">
                        <Link href={`/dashboard/programacion/${run.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button asChild size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90" title="Editar convocatoria">
                        <Link href={`/dashboard/programacion/${run.id}`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ConvocatoriasContent() {
  const searchParams = useSearchParams()
  const groupParam = searchParams.get('grupo')
  const selectedGroup: CourseGroup | null = groupParam === 'privados' || groupParam === 'sce' ? groupParam : null
  const selectedType = normalizePublicStudyType(searchParams.get('tipo'))
  const [runs, setRuns] = React.useState<Convocatoria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<PublicStudyType | 'all'>(selectedType ?? 'all')
  const [campusFilter, setCampusFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [enrollmentFilter, setEnrollmentFilter] = React.useState('all')
  const [shiftFilter, setShiftFilter] = React.useState('all')
  const [view, setView] = React.useState<ViewMode>('grid')

  React.useEffect(() => {
    setTypeFilter(selectedType ?? 'all')
  }, [selectedType])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/convocatorias', { cache: 'no-store' })
        const json = (await res.json()) as { success?: boolean; data?: Convocatoria[]; error?: string }
        if (!res.ok || json.success === false) throw new Error(json.error || 'No se pudieron cargar las convocatorias')
        if (!cancelled) {
          setRuns(Array.isArray(json.data) ? json.data : [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar convocatorias')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const groupTypes = selectedGroup ? GROUP_TYPES[selectedGroup] : COURSE_TYPES
  const availableCampuses = React.useMemo(
    () => Array.from(new Set(runs.map((run) => run.campusNombre || 'Sin sede'))).sort((a, b) => a.localeCompare(b)),
    [runs]
  )

  const filteredRuns = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return runs.filter((run) => {
      const runType = normalizeCourseRunType(run)
      if (!groupTypes.includes(runType)) return false
      if (typeFilter !== 'all' && runType !== typeFilter) return false
      if (campusFilter !== 'all' && (run.campusNombre || 'Sin sede') !== campusFilter) return false
      if (statusFilter !== 'all' && String(run.estado ?? '') !== statusFilter) return false
      if (enrollmentFilter !== 'all' && String(run.enrollmentStatus ?? '') !== enrollmentFilter) return false
      if (shiftFilter !== 'all' && String(run.turno ?? '') !== shiftFilter) return false
      if (!normalizedSearch) return true
      const haystack = [
        run.cursoNombre,
        run.codigo,
        run.profesor,
        run.aulaNombre,
        run.campusNombre,
        run.horario,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [runs, groupTypes, typeFilter, campusFilter, statusFilter, enrollmentFilter, shiftFilter, search])

  const groupedByCampus = React.useMemo(() => {
    const map = new Map<string, Convocatoria[]>()
    for (const run of filteredRuns) {
      const campus = run.campusNombre || 'Sin sede'
      const current = map.get(campus) ?? []
      current.push(run)
      map.set(campus, current)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredRuns])

  const title = selectedType
    ? `Convocatorias de ${COURSE_TYPE_CONFIG[selectedType].label.toLowerCase()}`
    : selectedGroup === 'privados'
      ? 'Convocatorias de cursos privados'
      : selectedGroup === 'sce'
        ? 'Convocatorias Servicio Canario de Empleo'
        : 'Convocatorias de cursos'

  return (
    <DashboardListingShell
      header={
        <>
          <DashboardBreadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Cursos', href: '/dashboard/cursos' },
              { label: 'Convocatorias' },
            ]}
          />
          <DashboardEntityHeader
            title={title}
            description="Consulta convocatorias en formato operativo por sede, tipo de curso, matrícula, plazas, docente y horario."
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/programacion">Ver calendario</Link>
                </Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
                  <Link href="/dashboard/programacion/nueva"><Plus className="h-4 w-4" />Nueva convocatoria</Link>
                </Button>
              </div>
            }
          />
        </>
      }
      toolbar={
        <DashboardToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por curso, código, docente, aula o sede..."
          filters={
            <>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as PublicStudyType | 'all')}>
                <SelectTrigger className="w-full min-w-[170px] md:w-[190px]">
                  <SelectValue placeholder="Tipo de curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {groupTypes.map((type) => (
                    <SelectItem key={type} value={type}>{COURSE_TYPE_CONFIG[type].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger className="w-full min-w-[170px] md:w-[190px]">
                  <SelectValue placeholder="Sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {availableCampuses.map((campus) => (
                    <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full min-w-[170px] md:w-[190px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="enrollment_open">Inscripción abierta</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="completed">Finalizada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={enrollmentFilter} onValueChange={setEnrollmentFilter}>
                <SelectTrigger className="w-full min-w-[170px] md:w-[210px]">
                  <SelectValue placeholder="Matrícula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las matrículas</SelectItem>
                  <SelectItem value="open">Matrícula abierta</SelectItem>
                  <SelectItem value="closed">Matrícula cerrada</SelectItem>
                  <SelectItem value="scheduled">Matrícula programada</SelectItem>
                  <SelectItem value="always_open">Matrícula permanente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger className="w-full min-w-[150px] md:w-[170px]">
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los turnos</SelectItem>
                  <SelectItem value="morning">Mañana</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="evening_extra">Tarde/noche</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          actions={
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearch('')
                setTypeFilter(selectedType ?? 'all')
                setCampusFilter('all')
                setStatusFilter('all')
                setEnrollmentFilter('all')
                setShiftFilter('all')
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Limpiar
            </Button>
          }
          viewToggle={<DashboardViewToggle view={view} onViewChange={(next) => setView(next as ViewMode)} />}
        />
      }
    >
      {loading ? <LoadingPanel label="Cargando convocatorias..." /> : null}
      {error && !loading ? <ErrorPanel description={error} /> : null}
      {!loading && !error && filteredRuns.length === 0 ? (
        <EmptyPanel
          title="No hay convocatorias con estos filtros"
          description="Ajusta los filtros o crea una nueva convocatoria desde Programación."
          action={<Button asChild><Link href="/dashboard/programacion/nueva">Nueva convocatoria</Link></Button>}
        />
      ) : null}
      {!loading && !error && filteredRuns.length > 0 ? (
        <div className="space-y-8">
          {groupedByCampus.map(([campus, campusRuns]) => {
            const runsByType = COURSE_TYPES
              .map((type) => ({
                type,
                runs: campusRuns.filter((run) => normalizeCourseRunType(run) === type),
              }))
              .filter((group) => group.runs.length > 0)

            return (
              <section key={campus} className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <MapPin className="h-5 w-5 text-primary" />
                        {campus}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{campusRuns.length} convocatorias</p>
                    </div>
                    <Badge variant="outline">{view === 'grid' ? 'Cards' : 'Lista'}</Badge>
                  </CardHeader>
                </Card>

                {view === 'list' ? (
                  <ConvocatoriasTable runs={campusRuns} />
                ) : (
                  <div className="space-y-6">
                    {runsByType.map((typeGroup) => (
                      <div key={`${campus}-${typeGroup.type}`} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2.5 w-2.5 rounded-full', COURSE_TYPE_CONFIG[typeGroup.type].dotColor)} />
                          <h3 className="font-semibold">{COURSE_TYPE_CONFIG[typeGroup.type].label}</h3>
                          <Badge variant="secondary">{typeGroup.runs.length}</Badge>
                        </div>
                        <div className="grid gap-5 xl:grid-cols-2">
                          {typeGroup.runs.map((run) => (
                            <ConvocatoriaCard key={run.id} run={run} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : null}
    </DashboardListingShell>
  )
}

export default function CursoConvocatoriasPage() {
  return (
    <React.Suspense fallback={<LoadingPanel label="Preparando vista de convocatorias..." />}>
      <ConvocatoriasContent />
    </React.Suspense>
  )
}
