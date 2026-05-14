'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, BookOpen, Clock, Edit, Loader2,
  Calendar, Euro, ExternalLink, Globe2, Mail, Phone, Monitor, Plus, Printer, MapPin, Users,
  Download, FileText, X,
} from 'lucide-react'
import { CampaignBadge } from '@payload-config/components/ui/CampaignBadge'
import type { CampaignState } from '@payload-config/components/ui/CampaignBadge'

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
  dossier_pdf?: number | string | { url?: string; filename?: string }
  duration_hours?: number
  base_price?: number
  landing_target_audience?: string
  landing_access_requirements?: string
  landing_outcomes?: string
  landing_objectives?: Array<{ text?: string }>
  landing_program_blocks?: Array<{ title?: string; body?: string; items?: Array<{ text?: string }> }>
  landing_faqs?: Array<{ question?: string; answer?: string }>
  codigo?: string
  tenant?: number | { id: number }
  createdAt?: string
  updatedAt?: string
}

interface ConvocatoriaSummary {
  id: string | number
  codigo?: string
  cursoNombre?: string
  cursoImagen?: string | null
  cursoTipo?: string
  campusNombre?: string
  aulaNombre?: string
  fechaInicio?: string
  fechaFin?: string
  horario?: string
  estado?: string
  turno?: string
  plazasTotales?: number
  plazasOcupadas?: number
  precio?: number
  matricula?: number
  modalidad?: string
  campaignId?: string | null
  campaignStatus?: CampaignState
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
  teleformacion: 'Teleformacion',
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  privados: 'Privado',
  privado: 'Privado',
  ocupados: 'Ocupados',
  desempleados: 'Desempleados',
  teleformacion: 'Teleformacion',
  ciclo_medio: 'Ciclo medio',
  ciclo_superior: 'Ciclo superior',
}

const RUN_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  pending_validation: 'Pendiente de validar',
  validated: 'Validada',
  published: 'Publicada',
  enrollment_open: 'Matricula abierta',
  in_progress: 'En curso',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
  archived: 'Archivada',
}

const PUBLIC_BASE_URL = 'https://cepformacion.akademate.com'
const CONTACT_PHONE = '+34 922 533 533'
const CONTACT_EMAIL = 'info@cepformacion.com'
const CEP_LOGO_URL = '/logos/cep-formacion-logo.png'

function resolveImageUrl(image: CourseDetail['featured_image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object') {
    if (image.url) return image.url
    if (image.filename) return `/api/media/file/${image.filename}`
  }
  return null
}

function resolveMediaUrl(media: CourseDetail['featured_image']): string | null {
  return resolveImageUrl(media)
}

function textList(items?: Array<{ text?: string }>): string[] {
  return (items ?? []).map((item) => item.text?.trim()).filter((value): value is string => Boolean(value))
}

function resolveAreaName(area: CourseDetail['area_formativa']): string | null {
  if (!area) return null
  if (typeof area === 'number') return null
  return area.name ?? null
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

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return 'Fechas por definir'
  if (!end || start === end) return formatDate(start)
  return `${formatDate(start)} - ${formatDate(end)}`
}

function normalizeCourseType(value?: string): string {
  if (!value) return 'Sin tipo'
  return COURSE_TYPE_LABELS[value] ?? value
}

function normalizeCampaignStatus(value?: string): CampaignState {
  return value && ['active', 'paused', 'draft', 'completed', 'archived'].includes(value)
    ? value as CampaignState
    : 'none'
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
  const [convocatorias, setConvocatorias] = React.useState<ConvocatoriaSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [fullSheetOpen, setFullSheetOpen] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/courses/${id}?depth=1`, { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar el curso')
        const data = await res.json()
        if (mounted) setCourse(data.doc ?? data)
        const convocatoriasRes = await fetch(`/api/convocatorias?courseId=${id}`, { cache: 'no-store' })
        if (convocatoriasRes.ok) {
          const convocatoriasData = await convocatoriasRes.json() as { data?: ConvocatoriaSummary[] }
          if (mounted) setConvocatorias(convocatoriasData.data ?? [])
        }
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
  const publicCourseUrl = `${PUBLIC_BASE_URL}/p/cursos/${course.slug ?? course.id}`
  const publicCoursePath = `/p/cursos/${course.slug ?? course.id}`
  const publicCourseAvailable = Boolean(course.slug || course.id) && course.active !== false
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicCourseUrl)}`
  const activeRuns = convocatorias.filter((conv) => !['cancelled', 'archived', 'completed'].includes(conv.estado ?? ''))
  const isTeleformacion = course.course_type === 'teleformacion' || course.modality === 'teleformacion'
  const dossierUrl = resolveMediaUrl(course.dossier_pdf)
  const objectives = textList(course.landing_objectives)
  const programBlocks = course.landing_program_blocks ?? []
  const requirements = course.landing_access_requirements?.trim()
  const outcomes = course.landing_outcomes?.trim()

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #course-print-sheet,
          #course-print-sheet * {
            visibility: visible;
          }

          #course-print-sheet {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            background: white;
            color: #111827;
          }

          .course-screen-only {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="course-screen-only">
        <PageHeader
        title={course.name ?? 'Sin nombre'}
        description={course.codigo ?? ''}
        icon={BookOpen}
        badge={statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/dashboard/cursos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Cursos
          </Button>
          <Button
            variant="outline"
            disabled={!publicCourseAvailable}
            onClick={() => window.open(publicCoursePath, '_blank', 'noopener,noreferrer')}
            title={publicCourseAvailable ? 'Abrir página pública del curso' : 'Página pública no disponible'}
          >
            <ExternalLink className="mr-2 h-4 w-4" />Ver página pública
          </Button>
          <Button onClick={() => router.push(`/dashboard/cursos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />Editar
          </Button>
          <Button variant="outline" onClick={() => setFullSheetOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />Ficha completa
          </Button>
        </>}
        />
      </div>

      {/* KPI Cards */}
      <div className="course-screen-only grid gap-4 grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Horas', value: course.duration_hours || 0, icon: Clock },
          { label: 'Convocatorias', value: convocatorias.length, icon: Calendar },
          { label: 'Precio base', value: formatCurrency(course.base_price), icon: Euro },
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
      <div className="course-screen-only grid gap-6 lg:grid-cols-3">
        {/* MAIN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Ficha informativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {course.short_description ? (
                <p className="leading-relaxed text-muted-foreground">{course.short_description}</p>
              ) : (
                <EmptyState message="Este curso no tiene descripcion informativa cargada" />
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Tipo">{normalizeCourseType(course.course_type)}</InfoRow>
                <InfoRow label="Modalidad">{course.modality ? (MODALITY_LABELS[course.modality] ?? course.modality) : 'Por definir'}</InfoRow>
                <InfoRow label="Area">{areaName ?? course.area ?? 'Por definir'}</InfoRow>
                <InfoRow label="Precio">{formatCurrency(course.base_price)}</InfoRow>
              </div>
              {isTeleformacion && (
                <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                  <div>
                    <p className="font-semibold">Teleformación con inicio flexible</p>
                    <p className="mt-1 text-orange-900/80">
                      Comunicación pública: 100% online, desde casa, matrícula abierta permanente y avance a ritmo del alumno.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Convocatorias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Convocatorias
                <Badge variant="outline">{convocatorias.length}</Badge>
              </CardTitle>
              <Button size="sm" onClick={() => router.push(`/dashboard/programacion/nueva?curso=${id}`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Crear convocatoria
              </Button>
            </CardHeader>
            <CardContent>
              {convocatorias.length === 0 ? (
                <EmptyState
                  message="No hay convocatorias de este curso"
                  hint="Las convocatorias se crean desde Programacion"
                />
              ) : (
                <div className="space-y-3">
                  {convocatorias.map((conv) => {
                    const ocupadas = conv.plazasOcupadas ?? 0
                    const total = conv.plazasTotales ?? 0
                    const ocupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0
                    const runImage = conv.cursoImagen || imageUrl
                    const statusLabel = RUN_STATUS_LABELS[conv.estado ?? ''] ?? conv.estado ?? 'Sin estado'
                    return (
                    <button
                      key={conv.id}
                      type="button"
                      className="block w-full overflow-hidden rounded-lg border text-left transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => router.push(`/dashboard/programacion/${conv.id}`)}
                    >
                      <div className="flex items-stretch">
                        {runImage ? (
                          <img src={runImage} alt="" className="hidden min-h-40 w-44 shrink-0 object-cover sm:block" />
                        ) : (
                          <div className="hidden min-h-40 w-44 shrink-0 items-center justify-center bg-muted sm:flex">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-bold uppercase leading-tight">
                                {conv.cursoNombre || course.name || 'Curso'}
                              </p>
                              <p className="mt-1 font-mono text-xs text-muted-foreground">
                                {conv.codigo ?? `Convocatoria ${conv.id}`}
                              </p>
                            </div>
                            <Badge variant={conv.estado === 'enrollment_open' ? 'default' : 'secondary'} className="shrink-0">
                              {statusLabel}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {conv.campusNombre ?? 'Sede por definir'} · {conv.aulaNombre ?? 'Aula por definir'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateRange(conv.fechaInicio, conv.fechaFin)}
                            </span>
                            <span className="font-medium">{formatCurrency(conv.precio)}</span>
                          </div>
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                Plazas
                              </span>
                              <span className="font-medium">{ocupadas}/{total} ({ocupacion}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(ocupacion, 100)}%` }} />
                            </div>
                          </div>
                          <div className="mt-3">
                            <CampaignBadge
                              status={normalizeCampaignStatus(conv.campaignStatus)}
                              campaignId={conv.campaignId}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  )})}
                </div>
              )}
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
              {course.course_type && <InfoRow label="Tipo">{normalizeCourseType(course.course_type)}</InfoRow>}

              {/* Print sheet */}
              <div className="border-t border-border pt-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setFullSheetOpen(true)}
                >
                  <span className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimir ficha del curso
                  </span>
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

      {fullSheetOpen && (
        <div className="course-screen-only fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-background shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ficha completa del curso</p>
                <h2 className="mt-1 text-2xl font-bold">{course.name ?? 'Curso sin nombre'}</h2>
                <p className="text-sm text-muted-foreground">{course.codigo ?? `Curso ${course.id}`}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {dossierUrl ? (
                  <Button asChild variant="outline">
                    <a href={dossierUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />Descargar PDF
                    </a>
                  </Button>
                ) : null}
                <Button onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />Imprimir ficha
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setFullSheetOpen(false)} aria-label="Cerrar ficha completa">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.8fr]">
              <div className="space-y-6">
                <section className="rounded-xl border p-5">
                  <h3 className="text-lg font-semibold">Presentación</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {course.short_description || 'Información detallada pendiente de validación por CEP Formación.'}
                  </p>
                </section>

                <section className="rounded-xl border p-5">
                  <h3 className="text-lg font-semibold">Objetivos</h3>
                  {objectives.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {objectives.map((objective) => <li key={objective}>{objective}</li>)}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Objetivos pendientes de completar.</p>
                  )}
                </section>

                <section className="rounded-xl border p-5">
                  <h3 className="text-lg font-semibold">Contenidos / programa</h3>
                  {programBlocks.length > 0 ? (
                    <div className="mt-3 space-y-4">
                      {programBlocks.map((block, index) => (
                        <div key={`${block.title ?? 'bloque'}-${index}`} className="rounded-lg bg-muted/40 p-4">
                          <p className="font-semibold">{block.title || `Bloque ${index + 1}`}</p>
                          {block.body && <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>}
                          {block.items?.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                              {block.items.map((item, itemIndex) => item.text ? <li key={`${item.text}-${itemIndex}`}>{item.text}</li> : null)}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Programa pendiente de completar.</p>
                  )}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-5">
                    <h3 className="text-lg font-semibold">Requisitos</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{requirements || 'Requisitos no especificados todavía.'}</p>
                  </div>
                  <div className="rounded-xl border p-5">
                    <h3 className="text-lg font-semibold">Salidas profesionales</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{outcomes || 'Salidas profesionales pendientes de completar.'}</p>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                {imageUrl ? (
                  <img src={imageUrl} alt={course.name ?? 'Curso'} className="h-56 w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">Sin imagen de portada</div>
                )}
                <div className="rounded-xl border p-5 text-sm">
                  <div className="space-y-3">
                    <InfoRow label="Tipo">{normalizeCourseType(course.course_type)}</InfoRow>
                    <InfoRow label="Modalidad">{course.modality ? (MODALITY_LABELS[course.modality] ?? course.modality) : 'Por definir'}</InfoRow>
                    <InfoRow label="Área">{areaName ?? course.area ?? 'Por definir'}</InfoRow>
                    <InfoRow label="Duración">{course.duration_hours ? `${course.duration_hours} horas` : 'Por definir'}</InfoRow>
                    <InfoRow label="Precio">{formatCurrency(course.base_price)}</InfoRow>
                  </div>
                </div>
                <div className="rounded-xl border p-5">
                  <h3 className="font-semibold">PDF del programa</h3>
                  {dossierUrl ? (
                    <a href={dossierUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-700 transition hover:bg-red-100">
                      <FileText className="h-5 w-5" />
                      <span className="flex-1">Descargar dossier</span>
                      <Download className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">PDF del programa no disponible todavía.</p>
                  )}
                </div>
                <div className="rounded-xl border p-5">
                  <h3 className="font-semibold">Convocatorias asociadas</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    {activeRuns.length > 0 ? activeRuns.map((conv) => (
                      <button key={conv.id} type="button" className="w-full rounded-lg border p-3 text-left transition hover:bg-muted" onClick={() => router.push(`/dashboard/programacion/${conv.id}`)}>
                        <span className="block font-medium">{conv.codigo ?? `Convocatoria ${conv.id}`}</span>
                        <span className="block text-xs text-muted-foreground">{formatDateRange(conv.fechaInicio, conv.fechaFin)} · {conv.campusNombre ?? 'Sede por definir'}</span>
                      </button>
                    )) : <p className="text-sm text-muted-foreground">No hay convocatorias activas en este momento.</p>}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <section id="course-print-sheet" className="hidden p-6 text-[12px]">
        <div className="flex items-center justify-between border-b-4 border-red-600 pb-4">
          <img src={CEP_LOGO_URL} alt="CEP Formacion" className="h-14 w-auto object-contain" />
          <div className="text-right">
            <p className="text-xl font-bold uppercase tracking-wide">Ficha informativa de curso</p>
            <p className="text-sm text-gray-600">{course.codigo ?? `Curso ${course.id}`}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1.55fr_0.9fr] gap-5">
          <div>
            <p className="text-xs font-semibold uppercase text-red-700">{normalizeCourseType(course.course_type)}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">{course.name ?? 'Curso sin nombre'}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {course.short_description || 'Información detallada disponible próximamente.'}
            </p>
          </div>
          {imageUrl ? (
            <img src={imageUrl} alt={course.name ?? 'Curso'} className="h-44 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
              Imagen de portada pendiente
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-gray-500">Modalidad</p>
            <p className="mt-1 font-semibold">{course.modality ? (MODALITY_LABELS[course.modality] ?? course.modality) : 'Por definir'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-gray-500">Duracion</p>
            <p className="mt-1 font-semibold">{course.duration_hours ? `${course.duration_hours} horas` : 'Por definir'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-gray-500">Area</p>
            <p className="mt-1 font-semibold">{areaName ?? course.area ?? 'Por definir'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] uppercase text-gray-500">Precio base</p>
            <p className="mt-1 font-semibold">{formatCurrency(course.base_price)}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <h2 className="text-base font-bold">Objetivos</h2>
            {objectives.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {objectives.slice(0, 8).map((objective) => <li key={objective}>{objective}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-gray-600">Objetivos disponibles próximamente.</p>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <h2 className="text-base font-bold">Requisitos y salidas</h2>
            <p className="mt-2"><strong>Requisitos:</strong> {requirements || 'A consultar con admisiones.'}</p>
            <p className="mt-2"><strong>Salidas:</strong> {outcomes || 'A consultar con orientación académica.'}</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border p-3">
          <h2 className="text-base font-bold">Contenidos / programa</h2>
          {programBlocks.length > 0 ? (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {programBlocks.slice(0, 6).map((block, index) => (
                <div key={`${block.title ?? 'bloque'}-${index}`}>
                  <p className="font-semibold">{block.title || `Bloque ${index + 1}`}</p>
                  {block.body && <p className="text-gray-700">{block.body}</p>}
                  {block.items?.length ? (
                    <ul className="mt-1 list-disc pl-4 text-gray-700">
                      {block.items.slice(0, 5).map((item, itemIndex) => item.text ? <li key={`${item.text}-${itemIndex}`}>{item.text}</li> : null)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-gray-600">Programa disponible próximamente.</p>
          )}
          <p className="mt-3 text-sm"><strong>PDF:</strong> {dossierUrl ? 'Dossier disponible para descarga desde la ficha digital.' : 'PDF del programa no disponible todavía.'}</p>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Convocatorias</h2>
            <p className="text-xs text-gray-500">{activeRuns.length} convocatoria(s) activa(s) o planificada(s)</p>
          </div>
          {activeRuns.length === 0 ? (
            <div className="mt-2 rounded-lg border p-4 text-gray-600">
              No hay convocatorias activas en este momento. Consulte disponibilidad en recepcion o en la web.
            </div>
          ) : (
            <div className="mt-2 overflow-hidden rounded-lg border">
              <table className="w-full border-collapse text-left">
                <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                  <tr>
                    <th className="p-2">Codigo</th>
                    <th className="p-2">Sede / aula</th>
                    <th className="p-2">Fechas</th>
                    <th className="p-2">Horario</th>
                    <th className="p-2">Plazas</th>
                    <th className="p-2">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRuns.slice(0, 4).map((conv) => (
                    <tr key={conv.id} className="border-t">
                      <td className="p-2 font-semibold">{conv.codigo ?? conv.id}</td>
                      <td className="p-2">{conv.campusNombre ?? 'Sede por definir'} / {conv.aulaNombre ?? 'Aula por definir'}</td>
                      <td className="p-2">{formatDateRange(conv.fechaInicio, conv.fechaFin)}</td>
                      <td className="p-2">{conv.horario?.trim() || conv.turno || 'Por definir'}</td>
                      <td className="p-2">{conv.plazasOcupadas ?? 0}/{conv.plazasTotales ?? 0}</td>
                      <td className="p-2">{formatCurrency(conv.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-5 border-t pt-4">
          <div>
            <h2 className="text-lg font-bold">Contacto</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-red-700" />{CONTACT_PHONE}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-red-700" />{CONTACT_EMAIL}</p>
              <p className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-red-700" />cepformacion.akademate.com</p>
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-gray-500">
              Documento informativo. Las fechas, plazas, precios y condiciones pueden estar sujetos a cambios hasta la formalizacion de la matricula.
            </p>
          </div>
          <div className="text-center">
            <img src={qrUrl} alt="QR web del curso" className="h-28 w-28" />
            <p className="mt-1 text-[10px] text-gray-500">Ver curso en la web</p>
          </div>
        </div>
      </section>
    </div>
  )
}
