'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { ArrowLeft, BookOpen, Calendar, Download, FileText, GraduationCap, Loader2, MapPin, Printer, Users } from 'lucide-react'

type MediaRef = number | string | { url?: string | null; filename?: string | null } | null | undefined

interface CourseRun {
  id: string | number
  codigo?: string
  status?: string
  course?: any
  cycle?: any
  campus?: any
  classroom?: any
  instructor?: any
  start_date?: string
  end_date?: string
  schedule_days?: string[]
  schedule_time_start?: string
  schedule_time_end?: string
  shift?: string
  max_students?: number
  current_enrollments?: number
  price_override?: number | null
  price_snapshot?: number | null
  enrollment_fee_snapshot?: number | null
  notes?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  enrollment_open: 'Inscripción abierta',
  enrollment_closed: 'Inscripción cerrada',
  in_progress: 'En curso',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

function resolveMediaUrl(media: MediaRef): string | null {
  if (!media) return null
  if (typeof media === 'number') return null
  if (typeof media === 'string') return media
  if (media.url) return media.url
  if (media.filename) return `/api/media/file/${media.filename}`
  return null
}

function resolveDocument(cycle: any): { title: string; url: string } | null {
  if (!Array.isArray(cycle?.documents)) return null
  for (const doc of cycle.documents) {
    const url = resolveMediaUrl(doc?.file)
    if (url) return { title: doc?.title || 'Documento del ciclo', url }
  }
  return null
}

function formatCurrency(value?: number | null): string {
  if (value == null || value <= 0) return 'Consultar'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(value?: string): string {
  if (!value) return 'Por definir'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Por definir'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function formatTime(value?: string): string {
  return typeof value === 'string' && value.length >= 5 ? value.slice(0, 5) : ''
}

function formatSchedule(run: CourseRun): string {
  const days = Array.isArray(run.schedule_days) ? run.schedule_days.map((day) => DAY_LABELS[day] ?? day).join(', ') : ''
  const start = formatTime(run.schedule_time_start)
  const end = formatTime(run.schedule_time_end)
  const time = start && end ? `${start} - ${end}` : start || end
  return [days, time].filter(Boolean).join(' · ') || 'Horario por definir'
}

function relationName(value: any, fallback: string): string {
  if (value && typeof value === 'object') return value.name || value.full_name || value.title || value.code || fallback
  return fallback
}

function instructorName(value: any): string {
  if (!value || typeof value !== 'object') return 'Sin docente asignado'
  return value.full_name || `${value.first_name || ''} ${value.last_name || ''}`.trim() || 'Docente asignado'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-3"><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">{children}</CardContent>
    </Card>
  )
}

function DataCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

interface Props { params: Promise<{ id: string }> }

export default function ConvocatoriaFichaPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)
  const [run, setRun] = React.useState<CourseRun | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    fetch(`/api/course-runs/${id}?depth=2`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar la convocatoria')
        return res.json()
      })
      .then((data) => { if (mounted) setRun(data.doc ?? data) })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Error al cargar la ficha') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  if (error || !run) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/programacion/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" />Volver a convocatoria</Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">{error || 'No encontrada'}</CardContent></Card>
      </div>
    )
  }

  const course = typeof run.course === 'object' ? run.course : null
  const cycle = typeof run.cycle === 'object' ? run.cycle : null
  const title = cycle?.name || course?.name || course?.title || run.codigo || 'Convocatoria'
  const heroImage = resolveMediaUrl(cycle?.image) || resolveMediaUrl(course?.featured_image)
  const coursePdf = resolveMediaUrl(course?.dossier_pdf)
  const cycleDoc = resolveDocument(cycle)
  const pdfUrl = coursePdf || cycleDoc?.url || null
  const pdfTitle = coursePdf ? 'Dossier del curso' : cycleDoc?.title || 'Documento del programa'
  const totalSeats = run.max_students ?? 0
  const occupiedSeats = run.current_enrollments ?? 0
  const availableSeats = Math.max(totalSeats - occupiedSeats, 0)
  const price = run.price_override ?? run.price_snapshot

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white !important; }
          .dashboard-sidebar, header, nav, .run-ficha-actions, .dashboard-footer { display: none !important; }
          main { overflow: visible !important; }
        }
      `}</style>

      <div className="run-ficha-actions flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/programacion/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver a convocatoria
        </Button>
        <div className="flex flex-wrap gap-2">
          {course && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/cursos/${course.id}/ficha`)}>
              <BookOpen className="mr-2 h-4 w-4" />Ver curso
            </Button>
          )}
          {cycle && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/ciclos/${cycle.id}/ficha`)}>
              <GraduationCap className="mr-2 h-4 w-4" />Ver ciclo
            </Button>
          )}
          {pdfUrl && (
            <Button asChild variant="outline">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />Descargar PDF
              </a>
            </Button>
          )}
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir convocatoria</Button>
        </div>
      </div>

      <article className="space-y-6">
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Ficha interna de convocatoria</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{run.codigo || `Convocatoria ${run.id}`}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-[#f2014b] text-white hover:bg-[#d80143]">{STATUS_LABELS[run.status || ''] || run.status || 'Sin estado'}</Badge>
                <Badge variant="outline">{cycle ? 'Ciclo formativo' : 'Curso'}</Badge>
                <Badge variant="outline">{relationName(run.campus, 'Sin sede')}</Badge>
              </div>
            </div>
            {heroImage ? (
              <img src={heroImage} alt={title} className="h-72 w-full object-cover lg:h-full" />
            ) : (
              <div className="flex h-72 items-center justify-center bg-muted text-muted-foreground">
                <Calendar className="mr-2 h-5 w-5" />Sin imagen de convocatoria
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DataCard label="Inicio" value={formatDate(run.start_date)} />
          <DataCard label="Fin" value={formatDate(run.end_date)} />
          <DataCard label="Plazas disponibles" value={`${availableSeats} de ${totalSeats}`} />
          <DataCard label="Precio" value={formatCurrency(price)} />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <div className="space-y-6">
            <Section title="Datos operativos">
              <div className="grid gap-3 md:grid-cols-2">
                <p><strong className="text-foreground">Sede:</strong> {relationName(run.campus, 'Sin sede asignada')}</p>
                <p><strong className="text-foreground">Aula:</strong> {relationName(run.classroom, 'Sin aula asignada')}</p>
                <p><strong className="text-foreground">Horario:</strong> {formatSchedule(run)}</p>
                <p><strong className="text-foreground">Turno:</strong> {run.shift || 'Por definir'}</p>
                <p><strong className="text-foreground">Matrícula / reserva:</strong> {formatCurrency(run.enrollment_fee_snapshot)}</p>
                <p><strong className="text-foreground">Estado:</strong> {STATUS_LABELS[run.status || ''] || run.status || 'Sin estado'}</p>
              </div>
            </Section>

            <Section title="Programa asociado">
              <div className="space-y-3">
                <p><strong className="text-foreground">{cycle ? 'Ciclo' : 'Curso'}:</strong> {title}</p>
                {course?.short_description && <p>{course.short_description}</p>}
                {cycle?.description && <p>{cycle.description}</p>}
              </div>
            </Section>

            <Section title="Profesores asignados">
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{instructorName(run.instructor)}</p>
                  <p className="text-xs">{run.instructor?.position || 'Docente'}</p>
                </div>
              </div>
            </Section>

            <Section title="Notas de convocatoria">
              {run.notes || 'No hay notas adicionales registradas para esta convocatoria.'}
            </Section>
          </div>

          <aside className="space-y-6">
            <Section title="Ocupación">
              <div className="space-y-3">
                <p><strong className="text-foreground">Plazas totales:</strong> {totalSeats}</p>
                <p><strong className="text-foreground">Matriculados:</strong> {occupiedSeats}</p>
                <p><strong className="text-foreground">Disponibles:</strong> {availableSeats}</p>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-[#f2014b]" style={{ width: `${totalSeats > 0 ? Math.min((occupiedSeats / totalSeats) * 100, 100) : 0}%` }} />
                </div>
              </div>
            </Section>

            <Section title="PDF del programa">
              {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 font-semibold text-red-700 transition hover:bg-red-100">
                  <FileText className="h-7 w-7 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{pdfTitle}</span>
                    <span className="block text-xs font-normal">Descargar PDF</span>
                  </span>
                  <Download className="h-4 w-4 shrink-0" />
                </a>
              ) : 'PDF del programa no disponible todavía.'}
            </Section>

            <Section title="Ubicación">
              <div className="space-y-3">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" />{relationName(run.campus, 'Sin sede asignada')}</p>
                <p>{run.campus?.address || 'Dirección no especificada.'}</p>
                <p>{run.campus?.city || ''}</p>
              </div>
            </Section>

            <Section title="Resumen de alumnos">
              <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{occupiedSeats} alumnos matriculados</p>
            </Section>
          </aside>
        </div>
      </article>
    </div>
  )
}
