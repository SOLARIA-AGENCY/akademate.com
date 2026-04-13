'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  CalendarDays,
  BookOpen,
  User,
  AlertTriangle,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

type EnrollmentResponse = {
  success: boolean
  error?: string
  data?: {
    enrollment?: {
      id?: string
      status?: string
      enrolledAt?: string | null
      startedAt?: string | null
      completedAt?: string | null
    }
    course?: {
      id?: string
      title?: string
      slug?: string
      description?: string
    } | null
    courseRun?: {
      id?: string
      title?: string
      startDate?: string | null
      endDate?: string | null
      status?: string
    } | null
    modules?: Array<{ id?: string; title?: string; lessonsCount?: number }>
    progress?: {
      totalModules?: number
      totalLessons?: number
      completedLessons?: number
      progressPercent?: number
      status?: string
    }
  }
}

type LeadDoc = {
  id: string | number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
}

function formatDate(input?: string | null): string {
  if (!input) return '—'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status?: string): string {
  if (!status) return 'Sin estado'
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    waitlisted: 'En espera',
    cancelled: 'Cancelada',
    completed: 'Completada',
    withdrawn: 'Baja',
    enrolling: 'En matriculación',
    enrolled: 'Matriculada',
  }
  return map[status] ?? status
}

function statusVariant(status?: string): 'warning' | 'success' | 'destructive' | 'secondary' {
  if (status === 'confirmed' || status === 'completed' || status === 'enrolled') return 'success'
  if (status === 'cancelled' || status === 'withdrawn') return 'destructive'
  if (status === 'pending' || status === 'waitlisted' || status === 'enrolling') return 'warning'
  return 'secondary'
}

export default function MatriculaDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [enrollment, setEnrollment] = React.useState<EnrollmentResponse['data'] | null>(null)
  const [lead, setLead] = React.useState<LeadDoc | null>(null)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [enrollmentRes, leadRes] = await Promise.all([
        fetch(`/api/lms/enrollments/${id}`, { cache: 'no-store' }),
        fetch(`/api/leads?enrollment_id=${id}&limit=1`, { cache: 'no-store' }),
      ])

      const enrollmentPayload = (await enrollmentRes.json().catch(() => null)) as EnrollmentResponse | null
      if (!enrollmentRes.ok || !enrollmentPayload?.success || !enrollmentPayload?.data) {
        throw new Error(enrollmentPayload?.error || 'No se pudo cargar la matrícula')
      }

      let leadDoc: LeadDoc | null = null
      if (leadRes.ok) {
        const leadPayload = await leadRes.json().catch(() => null)
        const docs = Array.isArray(leadPayload?.docs) ? leadPayload.docs : []
        if (docs.length > 0) {
          leadDoc = docs[0] as LeadDoc
        }
      }

      setEnrollment(enrollmentPayload.data)
      setLead(leadDoc)
    } catch (e) {
      setEnrollment(null)
      setLead(null)
      setError(e instanceof Error ? e.message : 'No se pudo cargar la matrícula')
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !enrollment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Matrícula #${id}`}
          icon={GraduationCap}
          actions={
            <Button variant="ghost" onClick={() => router.push('/matriculas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {error ?? 'No se pudo cargar la matrícula.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName =
    lead ? `${lead.first_name ?? ''} ${lead.last_name ?? ''}`.trim() || lead.email || `Lead #${lead.id}` : `Matrícula #${id}`
  const enrollmentStatus = enrollment.enrollment?.status
  const courseTitle = enrollment.course?.title ?? 'Curso sin título'
  const courseRunTitle = enrollment.courseRun?.title ?? 'Convocatoria sin título'
  const hasCourseRun = Boolean(enrollment.courseRun?.id || enrollment.courseRun?.title)
  const progress = enrollment.progress?.progressPercent ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        description={`${courseTitle} · ${courseRunTitle}`}
        icon={GraduationCap}
        badge={<Badge variant={statusVariant(enrollmentStatus)}>{statusLabel(enrollmentStatus)}</Badge>}
        actions={
          <div className="flex gap-2">
            {lead ? (
              <Button variant="outline" onClick={() => router.push(`/inscripciones/${lead.id}`)}>
                Ver lead
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => router.push('/matriculas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resumen académico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Curso</span>
              <span className="font-medium">{courseTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Convocatoria</span>
              <span className="font-medium">{courseRunTitle}</span>
            </div>
            {!hasCourseRun ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Esta matrícula no tiene convocatoria asignada.
                </div>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado matrícula</span>
              <Badge variant={statusVariant(enrollmentStatus)}>{statusLabel(enrollmentStatus)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lecciones completadas</span>
              <span className="font-medium">
                {enrollment.progress?.completedLessons ?? 0} / {enrollment.progress?.totalLessons ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Módulos</span>
              <span className="font-medium">{enrollment.progress?.totalModules ?? enrollment.modules?.length ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contacto y fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{lead?.email ?? 'Sin email'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{lead?.phone ?? 'Sin teléfono'}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Alta
                </span>
                <span className="text-right">{formatDate(enrollment.enrollment?.enrolledAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Inicio</span>
                <span className="text-right">{formatDate(enrollment.enrollment?.startedAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Finalización</span>
                <span className="text-right">{formatDate(enrollment.enrollment?.completedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
