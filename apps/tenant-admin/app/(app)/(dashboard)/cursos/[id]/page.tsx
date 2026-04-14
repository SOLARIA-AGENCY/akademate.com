'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, BookOpen, Clock, Edit, Loader2,
  Calendar, Users, ChevronRight, Plus, UserPlus,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseDetail {
  id: string | number
  name?: string
  slug?: string
  short_description?: string
  status?: 'draft' | 'published' | 'archived'
  active?: boolean
  modality?: string
  course_type?: string
  area?: string
  area_formativa?: { id: number; name: string } | number | null
  featured_image?: number | string | { url?: string; filename?: string }
  duration_hours?: number
  base_price?: number
  codigo?: string
  tenant?: number | { id: number }
  createdAt?: string
  updatedAt?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicado', variant: 'default' },
  archived: { label: 'Archivado', variant: 'destructive' },
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Hibrido',
}

function resolveImageUrl(image: CourseDetail['featured_image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object') {
    if (image.url) return image.url
    if (image.filename) return `/media/${image.filename}`
  }
  return null
}

function resolveAreaName(area: CourseDetail['area_formativa']): string | null {
  if (!area) return null
  if (typeof area === 'number') return null
  return area.name ?? null
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {hint && <p className="text-xs text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar Info Row
// ---------------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{children}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props { params: Promise<{ id: string }> }

export default function CursoDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [course, setCourse] = React.useState<CourseDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${id}?depth=1`, { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar el curso')
        const data = await res.json()
        if (mounted) setCourse(data.doc ?? data)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [id])

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error
  if (error || !course) {
    return (
      <div className="space-y-6">
        <PageHeader title="Curso" description="Detalle de curso" icon={BookOpen}
          actions={<Button variant="ghost" onClick={() => router.push('/dashboard/cursos')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar el curso</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived
  const imageUrl = resolveImageUrl(course.featured_image)
  const areaName = resolveAreaName(course.area_formativa)
  const statusInfo = STATUS_LABELS[course.active === false ? 'archived' : (course.status ?? 'draft')]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={course.name ?? 'Sin nombre'}
        description={course.codigo ?? ''}
        icon={BookOpen}
        badge={statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/dashboard/cursos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Cursos
          </Button>
          <Button onClick={() => router.push(`/dashboard/cursos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />Editar
          </Button>
        </>}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Horas', value: course.duration_hours || 0, icon: Clock },
          { label: 'Convocatorias', value: 0, icon: Calendar },
          { label: 'Alumnos', value: 0, icon: Users },
          { label: 'Plazas', value: 0, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Convocatorias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Convocatorias
                <Badge variant="outline">0</Badge>
              </CardTitle>
              <Button size="sm" onClick={() => router.push(`/programacion/nueva?curso=${id}`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Crear convocatoria
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                message="No hay convocatorias de este curso"
                hint="Las convocatorias se crean desde Programacion"
              />
            </CardContent>
          </Card>

          {/* Profesores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                Profesores
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Asignar profesor
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState message="No hay profesores asignados a este curso" />
            </CardContent>
          </Card>

          {/* Alumnos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Alumnos matriculados
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Matricular alumno
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState message="No hay alumnos matriculados en este curso" />
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR (1/3) */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacion del Curso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Image */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={course.name ?? 'Curso'}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}

              {/* Status */}
              {statusInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              )}

              {/* Area formativa */}
              {areaName && <InfoRow label="Area formativa">{areaName}</InfoRow>}

              {/* Area tematica */}
              {course.area && <InfoRow label="Area tematica">{course.area}</InfoRow>}

              {/* Modality */}
              {course.modality && (
                <InfoRow label="Modalidad">
                  {MODALITY_LABELS[course.modality] ?? course.modality}
                </InfoRow>
              )}

              {/* Duration */}
              {course.duration_hours && (
                <InfoRow label="Duracion">{course.duration_hours}h</InfoRow>
              )}

              {/* Price */}
              {course.base_price != null && course.base_price > 0 && (
                <InfoRow label="Precio base">
                  <span className="text-primary font-semibold">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(course.base_price)}
                  </span>
                </InfoRow>
              )}

              {/* Course type */}
              {course.course_type && <InfoRow label="Tipo">{course.course_type}</InfoRow>}

              {/* Divider + Ver ficha completa */}
              <div className="border-t border-border pt-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => router.push(`/dashboard/cursos/${id}/editar`)}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Ver ficha completa
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              {course.short_description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {course.short_description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
