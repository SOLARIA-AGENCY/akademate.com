'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, Calendar, MapPin, Users, GraduationCap, DollarSign,
  ExternalLink, Loader2, Clock, UserPlus, BookOpen, ChevronRight, Plus,
  Download, FileText,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'outline' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default' },
  in_progress: { label: 'En curso', variant: 'default' },
  completed: { label: 'Finalizada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

function formatCurrency(v: number | undefined): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v)
}

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/api/media/file/${image.filename}`
  if (typeof image === 'string') return image
  return null
}

function getInstructorName(instructor: any): string {
  return instructor?.full_name || `${instructor?.first_name || ''} ${instructor?.last_name || ''}`.trim() || 'Docente asignado'
}

function formatDayLabel(day: string): string {
  const labels: Record<string, string> = {
    monday: 'LUN',
    tuesday: 'MAR',
    wednesday: 'MIE',
    thursday: 'JUE',
    friday: 'VIE',
    saturday: 'SAB',
    sunday: 'DOM',
  }
  return labels[day] ?? day.toUpperCase()
}

function formatRunSchedule(conv: any): string {
  const days = Array.isArray(conv.schedule_days) ? conv.schedule_days.map(formatDayLabel).join(', ') : ''
  const start = typeof conv.schedule_time_start === 'string' ? conv.schedule_time_start.slice(0, 5) : ''
  const end = typeof conv.schedule_time_end === 'string' ? conv.schedule_time_end.slice(0, 5) : ''
  const time = start && end ? `${start}-${end}` : start || end
  return [days, time].filter(Boolean).join(' · ') || 'Horario por definir'
}

function getFirstCertification(instructor: any): string | null {
  if (!Array.isArray(instructor?.certifications)) return null
  const first = instructor.certifications[0]
  return typeof first?.title === 'string' && first.title.trim() ? first.title : null
}

interface Props { params: Promise<{ id: string }> }

export default function ConvocatoriaDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [conv, setConv] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    fetch(`/api/course-runs/${id}?depth=2`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('No se pudo cargar'); return r.json() })
      .then(data => { if (mounted) setConv(data.doc ?? data) })
      .catch(err => { if (mounted) setError(err.message) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (error || !conv) return (
    <div className="space-y-6">
      <PageHeader title="Convocatoria" icon={Calendar}
        actions={<Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
      <Card><CardContent className="p-8 text-center text-muted-foreground">{error || 'No encontrada'}</CardContent></Card>
    </div>
  )

  const course = typeof conv.course === 'object' ? conv.course : null
  const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
  const campus = typeof conv.campus === 'object' ? conv.campus : null
  const instructor = typeof conv.instructor === 'object' ? conv.instructor : null
  const status = STATUS_CONFIG[conv.status] || STATUS_CONFIG.draft
  const plazas = conv.max_students || 0
  const inscritos = conv.current_enrollments || 0
  const porcentaje = plazas > 0 ? Math.round((inscritos / plazas) * 100) : 0

  // Inherited image from cycle or course
  const cycleImage = cycle ? resolveImageUrl(cycle.image) : null
  const courseImage = course ? resolveImageUrl(course.featured_image) : null
  const heroImage = cycleImage || courseImage
  const instructorImage = instructor ? resolveImageUrl(instructor.photo) : null
  const instructorName = instructor ? getInstructorName(instructor) : ''
  const instructorTitle = instructor?.position || getFirstCertification(instructor) || 'Docente'
  const runSchedule = formatRunSchedule(conv)
  const dossierPdf = course ? resolveImageUrl(course.dossier_pdf) : null

  const title = cycle?.name || course?.name || course?.title || conv.codigo
  const publicRunPath = `/p/convocatorias/${conv.codigo ?? conv.id}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={title}
        description={`Convocatoria ${conv.codigo}`}
        icon={Calendar}
        badge={<Badge variant={status.variant}>{status.label}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          <Button variant="outline" onClick={() => window.open(publicRunPath, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="mr-2 h-4 w-4" />Ver página pública
          </Button>
        </>}
      />

      {/* Hero image */}
      {heroImage && (
        <div className="rounded-lg overflow-hidden border h-48 sm:h-64">
          <img src={heroImage} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Plazas', value: `${inscritos}/${plazas}`, icon: Users },
          { label: 'Precio', value: formatCurrency(conv.price_override), icon: DollarSign },
          { label: 'Inicio', value: conv.start_date ? new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Por definir', icon: Calendar },
          { label: 'Ocupacion', value: `${porcentaje}%`, icon: GraduationCap },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plazas progress */}
      {plazas > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Ocupacion de plazas</span>
              <span>{inscritos} de {plazas} ({porcentaje}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Alumnos matriculados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Alumnos matriculados
                <Badge variant="outline">{inscritos}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline"><Plus className="mr-1.5 h-3.5 w-3.5" />Matricular</Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">No hay alumnos matriculados en esta convocatoria</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Los alumnos se matriculan desde la seccion de Matriculacion</p>
              </div>
            </CardContent>
          </Card>

          {/* Profesores asignados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Profesores asignados
              </CardTitle>
              <Button size="sm" variant="outline"><UserPlus className="mr-1.5 h-3.5 w-3.5" />Asignar</Button>
            </CardHeader>
            <CardContent>
              {instructor ? (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-4">
                    {instructorImage ? (
                      <img
                        src={instructorImage}
                        alt={instructorName}
                        className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/15"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/15">
                        <GraduationCap className="h-7 w-7 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold">{instructorName}</p>
                          <p className="text-sm text-muted-foreground">{instructorTitle}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">Docente</Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {runSchedule}
                        </span>
                        {conv.shift && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            Turno: {conv.shift === 'morning' ? 'Mañana' : conv.shift === 'afternoon' ? 'Tarde' : 'Tercer turno'}
                          </span>
                        )}
                      </div>
                      {instructor.email && <p className="mt-2 text-xs text-muted-foreground">{instructor.email}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">No hay profesores asignados</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          {conv.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{conv.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sede */}
          {campus && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Sede</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{campus.name}</p>
                {campus.address && <p className="text-muted-foreground">{campus.address}</p>}
                {campus.city && <p className="text-muted-foreground">{campus.city}{campus.postal_code ? `, ${campus.postal_code}` : ''}</p>}
                {campus.phone && <p className="text-muted-foreground">{campus.phone}</p>}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/dashboard/sedes/${campus.id}`)}>
                  Ver sede <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Fechas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Inicio</span><span className="font-medium">{conv.start_date ? new Date(conv.start_date).toLocaleDateString('es-ES') : 'Por definir'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fin</span><span className="font-medium">{conv.end_date ? new Date(conv.end_date).toLocaleDateString('es-ES') : 'Por definir'}</span></div>
              {conv.enrollment_deadline && <div className="flex justify-between"><span className="text-muted-foreground">Limite inscripcion</span><span className="font-medium">{new Date(conv.enrollment_deadline).toLocaleDateString('es-ES')}</span></div>}
            </CardContent>
          </Card>

          {/* Precios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {conv.price_override && <div className="flex justify-between"><span className="text-muted-foreground">Precio total</span><span className="text-lg font-bold text-primary">{formatCurrency(conv.price_override)}</span></div>}
              {conv.financial_aid_available && <Badge variant="outline" className="text-xs">Financiacion disponible</Badge>}
            </CardContent>
          </Card>

          {/* Ciclo / Curso */}
          {(cycle || course) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Programa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cycle && (
                  <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => router.push(`/dashboard/ciclos/${cycle.id}`)}>
                    <span className="flex items-center gap-2"><GraduationCap className="h-3 w-3" />{cycle.name}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
                {course && (
                  <Button variant="outline" size="sm" className="h-auto w-full justify-between gap-2 py-2" onClick={() => router.push(`/dashboard/cursos/${course.id}`)}>
                    <span className="flex min-w-0 items-center gap-2">
                      <BookOpen className="h-3 w-3 shrink-0" />
                      <span className="truncate text-left">{course.name || course.title}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  </Button>
                )}
                {dossierPdf && (
                  <a
                    href={dossierPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-red-600 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">Descargar programa en PDF</span>
                      <span className="block text-xs font-normal text-red-600/75">Dossier informativo del curso</span>
                    </span>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
