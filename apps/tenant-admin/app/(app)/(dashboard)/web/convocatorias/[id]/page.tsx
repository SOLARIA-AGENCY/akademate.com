'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Users,
  BookOpen,
  Loader2,
  CheckCircle2,
  ClipboardCheck,
  Briefcase,
  Layers,
  GraduationCap,
  Euro,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaObject {
  url?: string
  filename?: string
}

interface CycleData {
  id: string | number
  name?: string
  description?: string
  level?: string
  totalHours?: number
  image?: MediaObject | string | number | null
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  requirements?: Array<{ text: string; type: string }>
}

interface CourseData {
  id: string | number
  name?: string
  short_description?: string
  long_description?: unknown
  course_type?: string
  modality?: string
  featured_image?: MediaObject | string | number | null
  cycle?: CycleData | string | number | null
}

interface CampusData {
  id: string | number
  name?: string
  city?: string
  address?: string
}

interface StaffData {
  id: string | number
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

interface CourseRunData {
  id: string | number
  codigo?: string
  course?: CourseData | string | number
  campus?: CampusData | string | number | null
  instructor?: StaffData | string | number | null
  start_date?: string
  end_date?: string
  schedule_days?: string[]
  schedule_time_start?: string
  schedule_time_end?: string
  status?: string
  max_students?: number
  min_students?: number
  current_enrollments?: number
  price_override?: number | null
  financial_aid_available?: boolean
  notes?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ESTADO_MAP: Record<string, { label: string; variant: 'info' | 'success' | 'default' | 'neutral' | 'destructive' | 'outline' | 'warning' }> = {
  draft: { label: 'Borrador', variant: 'outline' },
  published: { label: 'Publicada', variant: 'info' },
  enrollment_open: { label: 'Inscripcion Abierta', variant: 'success' },
  enrollment_closed: { label: 'Inscripcion Cerrada', variant: 'warning' },
  in_progress: { label: 'En Curso', variant: 'default' },
  completed: { label: 'Completada', variant: 'neutral' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Hibrido',
  semipresencial: 'Semipresencial',
  dual: 'Dual',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miercoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sabado',
  sunday: 'Domingo',
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function resolveImageUrl(image: MediaObject | string | number | null | undefined): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (image.url) return image.url
  if (image.filename) return `/media/${image.filename}`
  return null
}

function resolveInstructorName(instructor: StaffData | string | number | null | undefined): string {
  if (!instructor) return 'Sin asignar'
  if (typeof instructor === 'string') return instructor
  if (typeof instructor === 'number') return 'Sin asignar'
  const full = instructor.full_name?.trim()
  if (full) return full
  const combined = `${instructor.first_name?.trim() ?? ''} ${instructor.last_name?.trim() ?? ''}`.trim()
  return combined || 'Sin asignar'
}

function formatSchedule(days?: string[], startTime?: string, endTime?: string): string {
  if (!days || days.length === 0) return 'Sin horario definido'
  const dayNames = days.map((d) => DAY_LABELS[d] ?? d).join(', ')
  const time = startTime && endTime ? ` - ${startTime.slice(0, 5)} a ${endTime.slice(0, 5)}` : ''
  return `${dayNames}${time}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WebConvocatoriaPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [data, setData] = useState<CourseRunData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/course-runs/${id}?depth=2`)
        if (!res.ok) {
          setError('No se pudo cargar la convocatoria')
          return
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error fetching course run:', err)
        setError('Error al cargar la convocatoria')
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [id])

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{error ?? 'Convocatoria no encontrada'}</h2>
        <p className="text-muted-foreground mb-4">
          La convocatoria con ID {id} no existe o no se pudo cargar.
        </p>
        <Button onClick={() => router.push('/web/convocatorias')} className="mt-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Convocatorias
        </Button>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Resolve nested data
  // ---------------------------------------------------------------------------
  const course = typeof data.course === 'object' && data.course !== null ? data.course as CourseData : null
  const campus = typeof data.campus === 'object' && data.campus !== null ? data.campus as CampusData : null
  const instructor = typeof data.instructor === 'object' && data.instructor !== null ? data.instructor as StaffData : null

  const cycle = course && typeof course.cycle === 'object' && course.cycle !== null ? course.cycle as CycleData : null

  const courseName = course?.name ?? cycle?.name ?? 'Curso'
  const courseDescription = course?.short_description ?? cycle?.description ?? null
  const courseModality = MODALITY_LABELS[course?.modality ?? ''] ?? course?.modality ?? ''

  const estadoConfig = ESTADO_MAP[data.status ?? 'draft'] ?? { label: data.status ?? 'Desconocido', variant: 'outline' as const }

  // Resolve image: try course featured_image first, then cycle image
  const heroUrl = resolveImageUrl(course?.featured_image as MediaObject | string | number | null) ?? resolveImageUrl(cycle?.image as MediaObject | string | number | null)

  const campusName = campus?.name ?? 'Sin sede'
  const campusCity = campus?.city ?? ''
  const instructorName = resolveInstructorName(instructor ?? data.instructor)
  const currentEnrollments = data.current_enrollments ?? 0
  const maxStudents = data.max_students ?? 0
  const occupationPct = maxStudents > 0 ? Math.round((currentEnrollments / maxStudents) * 100) : 0
  const price = data.price_override ?? 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-0">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/web/convocatorias')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a Gestion Web
        </Button>
      </div>

      {/* Preview banner */}
      <div className="mb-4 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
        Vista previa de la landing page publica de esta convocatoria. Esta es una simulacion del aspecto final.
      </div>

      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden bg-muted mb-8">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={courseName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <GraduationCap className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-primary/90 text-primary-foreground">
              {estadoConfig.label}
            </Badge>
            {courseModality && (
              <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                {courseModality}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {courseName}
          </h1>
          {data.codigo && (
            <p className="text-white/80 text-sm md:text-base">
              Convocatoria {data.codigo}
            </p>
          )}
        </div>
      </div>

      {/* ================================================================
          QUICK STATS BAR — 4 Cards
      ================================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {/* Dates */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-medium">Fechas</p>
              <p className="text-sm font-semibold truncate">{formatDate(data.start_date)}</p>
              <p className="text-xs text-muted-foreground truncate">{formatDate(data.end_date)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Campus */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-medium">Sede</p>
              <p className="text-sm font-semibold truncate">{campusName}</p>
              {campusCity && <p className="text-xs text-muted-foreground truncate">{campusCity}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Instructor */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-medium">Profesor</p>
              <p className="text-sm font-semibold truncate">{instructorName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-medium">Plazas</p>
              <p className="text-sm font-semibold">
                {currentEnrollments}/{maxStudents}
              </p>
              <p className="text-xs text-muted-foreground">{occupationPct}% ocupacion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================
          SCHEDULE
      ================================================================ */}
      {(data.schedule_days && data.schedule_days.length > 0) && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horario
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatSchedule(data.schedule_days, data.schedule_time_start, data.schedule_time_end)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          DESCRIPTION
      ================================================================ */}
      {courseDescription && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Sobre este curso
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {courseDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          MODULES (from cycle)
      ================================================================ */}
      {cycle?.modules && cycle.modules.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Plan de Estudios ({cycle.modules.length} modulos)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cycle.modules.map((mod, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {mod.courseYear}o curso - {mod.type}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0">
                    {mod.hours}h
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex justify-between text-sm font-semibold">
              <span>Total horas lectivas</span>
              <span>{cycle.modules.reduce((sum, m) => sum + (m.hours || 0), 0)}h</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          CAREER PATHS (from cycle)
      ================================================================ */}
      {cycle?.careerPaths && cycle.careerPaths.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Salidas Profesionales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cycle.careerPaths.map((cp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{cp.title}</p>
                    {cp.sector && (
                      <p className="text-xs text-muted-foreground">{cp.sector}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          REQUIREMENTS (from cycle)
      ================================================================ */}
      {cycle?.requirements && cycle.requirements.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Requisitos de Acceso
            </h2>
            <ul className="space-y-2">
              {cycle.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm">{req.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ================================================================
          PRICING CARD
      ================================================================ */}
      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6 md:p-10 text-center space-y-4">
          <Euro className="h-10 w-10 text-primary mx-auto" />
          {price > 0 ? (
            <>
              <p className="text-sm text-muted-foreground uppercase font-medium">Precio del curso</p>
              <p className="text-4xl font-bold text-primary">{price.toLocaleString('es-ES')} EUR</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground uppercase font-medium">Precio</p>
              <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-4 py-1">
                Subvencionado
              </Badge>
            </>
          )}
          {data.financial_aid_available && (
            <p className="text-sm text-muted-foreground">Becas y ayudas disponibles</p>
          )}
          <Button size="lg" className="mt-4">
            Solicitar Informacion
          </Button>
          <p className="text-xs text-muted-foreground">
            Sin compromiso. Te contactaremos para asesorarte.
          </p>
        </CardContent>
      </Card>

      {/* ================================================================
          FOOTER NOTICE
      ================================================================ */}
      <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground text-center">
        Esta es una vista previa. La pagina publica se generara cuando se active la convocatoria.
      </div>
    </div>
  )
}
