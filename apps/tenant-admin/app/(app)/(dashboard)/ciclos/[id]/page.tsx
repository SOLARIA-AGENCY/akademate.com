'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  ArrowLeft, GraduationCap, Clock, Layers, Edit, Loader2,
  Calendar, Users, ChevronRight, Plus, BookOpen, UserPlus, MapPin, FileText,
} from 'lucide-react'
import { CampaignBadge } from '@payload-config/components/ui/CampaignBadge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CycleDetail {
  id: string
  name: string
  code?: string
  level: string
  family?: string
  officialTitle?: string
  description?: string
  image?: number | string | { url?: string; filename?: string }
  capacity?: number
  totalHours?: number
  courses?: number
  modality?: string
  schedule?: string
  duration?: {
    totalHours?: number
    courses?: number
    modality?: string
    classFrequency?: string
    schedule?: string
    practiceHours?: number
  }
  pricing?: {
    enrollmentFee?: number
    monthlyFee?: number
    totalPrice?: number
    priceNotes?: string
  }
  requirements?: Array<{ text: string; type: string }>
  modules?: Array<{ name: string; courseYear: string; hours: number; type: string }>
  careerPaths?: Array<{ title: string; sector: string }>
  competencies?: Array<{ title: string; description: string }>
  totalPrice?: number
  active?: boolean
  documents?: Array<{ title: string; type?: string; file?: { url?: string } | number }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, string> = {
  basico: 'Formacion Profesional Basica',
  medio: 'Grado Medio',
  superior: 'Grado Superior',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  semipresencial: 'Semipresencial',
  online: 'Online',
  dual: 'Dual',
}

function formatCurrency(value: number | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function resolveImageUrl(image: CycleDetail['image']): string | null {
  if (!image) return null
  if (typeof image === 'number') return null
  if (typeof image === 'string') return image
  if (typeof image === 'object') {
    if (image.url) return image.url
    if (image.filename) return `/media/${image.filename}`
  }
  return null
}

function formatSchoolYears(courses?: number, modality?: string): string | null {
  if (!courses || courses <= 0) return null
  if (courses === 2 && modality === 'dual') return '2 Cursos Escolares (Dual)'
  if (courses === 3) return '3 Cursos Escolares'
  if (courses === 1) return '1 Curso Escolar'
  return `${courses} Cursos Escolares`
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

export default function CicloDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [cycle, setCycle] = React.useState<CycleDetail | null>(null)
  const [convocatorias, setConvocatorias] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // Load cycle
        const res = await fetch(`/api/cycles/${id}?depth=1`, { cache: 'no-store' })
        if (!res.ok) throw new Error('No se pudo cargar el ciclo')
        const data = await res.json()
        if (mounted) setCycle(data.doc ?? data)

        // Load convocatorias: fetch all and filter by cycle_id client-side
        try {
          const convsRes = await fetch(`/api/course-runs?depth=1&limit=100`, { cache: 'no-store' })
          if (convsRes.ok) {
            const convsData = await convsRes.json()
            const allConvs = convsData.docs || []
            // Filter: convocatorias where cycle matches this cycle ID
            const cycleConvs = allConvs.filter((c: any) => {
              const cycleRef = c.cycle
              const cycleId = typeof cycleRef === 'object' && cycleRef ? cycleRef.id : cycleRef
              return String(cycleId) === String(id)
            })
            if (mounted) setConvocatorias(cycleConvs)
          }
        } catch { /* convocatorias are optional */ }
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
  if (error || !cycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ciclo" description="Detalle de ciclo" icon={GraduationCap}
          actions={<Button variant="ghost" onClick={() => router.push('/dashboard/ciclos')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar el ciclo</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived
  const modules = Array.isArray(cycle.modules) ? cycle.modules : []
  const requirements = Array.isArray(cycle.requirements) ? cycle.requirements : []
  const competencies = Array.isArray(cycle.competencies) ? cycle.competencies : []
  const careerPaths = Array.isArray(cycle.careerPaths) ? cycle.careerPaths : []
  const imageUrl = resolveImageUrl(cycle.image)
  const schoolYearsLabel = formatSchoolYears(
    cycle.duration?.courses || cycle.courses,
    cycle.duration?.modality || cycle.modality,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={cycle.name}
        description={cycle.code ?? ''}
        icon={GraduationCap}
        badge={<Badge variant="default">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/dashboard/ciclos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Ciclos
          </Button>
          <Button onClick={() => router.push(`/dashboard/ciclos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />Editar
          </Button>
        </>}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Modulos', value: modules.length, icon: Layers },
          { label: 'Horas totales', value: cycle.duration?.totalHours || cycle.totalHours || 0, icon: Clock },
          { label: 'Convocatorias', value: convocatorias.length, icon: Calendar },
          { label: 'Alumnos', value: 0, icon: Users },
          { label: 'Plazas', value: cycle.capacity || 0, icon: GraduationCap },
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
                <Badge variant="outline">{convocatorias.length}</Badge>
              </CardTitle>
              <Button size="sm" onClick={() => router.push(`/programacion/nueva?ciclo=${id}`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Crear convocatoria
              </Button>
            </CardHeader>
            <CardContent>
              {convocatorias.length === 0 ? (
              <EmptyState
                message="No hay convocatorias de este ciclo"
                hint="Las convocatorias se crean desde Programacion"
              />
              ) : (
                <div className="space-y-3">
                  {convocatorias.map((conv: any) => {
                    const campusName = typeof conv.campus === 'object' && conv.campus ? conv.campus.name : null
                    const statusLabels: Record<string, string> = {
                      enrollment_open: 'Inscripcion abierta', published: 'Publicada',
                      in_progress: 'En curso', completed: 'Finalizada', cancelled: 'Cancelada',
                    }
                    const statusColors: Record<string, string> = {
                      enrollment_open: 'border-l-green-500', published: 'border-l-primary',
                      in_progress: 'border-l-amber-500', completed: 'border-l-gray-400', cancelled: 'border-l-red-500',
                    }
                    const plazas = conv.max_students || 0
                    const inscritos = conv.current_enrollments || 0
                    const porcentaje = plazas > 0 ? Math.round((inscritos / plazas) * 100) : 0
                    return (
                      <div
                        key={conv.id}
                        className={`rounded-lg border border-l-4 ${statusColors[conv.status] || 'border-l-gray-300'} hover:shadow-md transition-all cursor-pointer overflow-hidden`}
                        onClick={() => router.push(`/programacion/${conv.id}`)}
                      >
                        <div className="flex">
                          {/* Foto heredada del ciclo */}
                          {imageUrl && (
                            <div className="hidden sm:block w-28 h-full shrink-0">
                              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{conv.codigo}</span>
                                <Badge variant={conv.status === 'enrollment_open' ? 'default' : 'secondary'} className="text-[10px]">
                                  {statusLabels[conv.status] || conv.status}
                                </Badge>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                              {campusName && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{campusName}</span>}
                              {conv.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(conv.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                              {conv.price_override && <span className="font-medium">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(conv.price_override)}</span>}
                            </div>
                            {plazas > 0 && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Plazas</span>
                                  <span className="font-medium">{inscritos}/{plazas} ({porcentaje}%)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                                </div>
                              </div>
                            )}
                            {/* Marketing campaign badge */}
                            <div className="mt-2">
                              <CampaignBadge status="none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
              <EmptyState message="No hay profesores asignados a este ciclo" />
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
              <EmptyState message="No hay alumnos matriculados en este ciclo" />
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR (1/3) */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacion del Ciclo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Image */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={cycle.name}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}

              {/* Level */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nivel</span>
                <Badge variant="default">{LEVEL_LABELS[cycle.level] ?? cycle.level}</Badge>
              </div>

              {/* Family */}
              {cycle.family && <InfoRow label="Familia">{cycle.family}</InfoRow>}

              {/* Official title */}
              {cycle.officialTitle && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Titulo oficial</span>
                  <span className="text-xs">{cycle.officialTitle}</span>
                </div>
              )}

              {/* Duration */}
              {/* Duration */}
              {(cycle.duration?.totalHours || cycle.totalHours || cycle.duration?.courses || cycle.courses) && (
                <InfoRow label="Duracion">
                  {[
                    (cycle.duration?.totalHours || cycle.totalHours) ? `${cycle.duration?.totalHours || cycle.totalHours}h` : null,
                    schoolYearsLabel,
                  ].filter(Boolean).join(' / ')}
                </InfoRow>
              )}

              {/* Modality */}
              {(cycle.duration?.modality || cycle.modality) && (
                <InfoRow label="Modalidad">
                  {MODALITY_LABELS[cycle.duration?.modality || cycle.modality || ''] ?? (cycle.duration?.modality || cycle.modality)}
                </InfoRow>
              )}

              {/* Schedule */}
              {(cycle.duration?.schedule || cycle.schedule) && <InfoRow label="Horario">{cycle.duration?.schedule || cycle.schedule}</InfoRow>}

              {/* Practice hours */}
              {cycle.duration?.practiceHours && <InfoRow label="Practicas">{cycle.duration.practiceHours}h</InfoRow>}

              {/* Price */}
              {(cycle.pricing?.totalPrice || cycle.totalPrice) != null && (
                <InfoRow label="Precio total">
                  <span className="text-primary font-semibold">{formatCurrency(cycle.pricing?.totalPrice || cycle.totalPrice)}</span>
                </InfoRow>
              )}

              {/* Counts */}
              <InfoRow label="Modulos">{modules.length} modulos</InfoRow>
              <InfoRow label="Requisito de acceso">{requirements.length}</InfoRow>
              <InfoRow label="Competencias">{competencies.length} competencias</InfoRow>
              <InfoRow label="Salidas">{careerPaths.length} salidas profesionales</InfoRow>

              {/* Divider */}
              <div className="border-t border-border pt-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => router.push(`/dashboard/ciclos/${id}/detalle`)}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Ver Ciclo
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* PDF Documents */}
              {Array.isArray(cycle.documents) && cycle.documents.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  {cycle.documents.map((doc: any, i: number) => {
                    const fileUrl = typeof doc.file === 'object' ? doc.file?.url : null
                    if (!fileUrl) return null
                    return (
                      <a key={i} href={fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <FileText className="h-4 w-4" />
                        {doc.title || 'Documento'}
                      </a>
                    )
                  })}
                </div>
              )}

              {/* Description */}
              {cycle.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {cycle.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
