'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin, ArrowLeft, Edit, DoorOpen, Users,
  Loader2, Calendar, GraduationCap, Briefcase, ChevronRight, Plus, BookOpen, Clock,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: number
  staffType?: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'
  firstName?: string
  lastName?: string
  fullName?: string
  employmentStatus?: string
  isActive?: boolean
  photo?: string
  full_name?: string
  first_name?: string
  last_name?: string
  staff_type?: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico'
  email?: string
  phone?: string
  position?: string
  is_active?: boolean
}

interface Convocatoria {
  id: number
  codigo?: string
  cursoNombre?: string
  cursoTipo?: string
  campusNombre?: string
  aulaNombre?: string
  aulaCapacidad?: number
  fechaInicio?: string
  fechaFin?: string
  estado?: string
  planningStatus?: string
  trainingType?: string
  turno?: string
  plazasTotales?: number
  plazasOcupadas?: number
  profesor?: string
  responsable?: string
  status?: string
  start_date?: string
  end_date?: string
  max_students?: number
  current_enrollments?: number
  campus?: { id: number } | number
  course?: { id: number; title?: string; name?: string } | number
}

interface Classroom {
  id?: number
  code?: string
  name: string
  nombre?: string
  capacity?: number
  capacidad?: number
  floor?: string
  planta?: string | number | null
  equipment?: string[]
  recursos?: string[]
  usage_policy?: string
  enabled_shifts?: string[]
  operational_notes?: string
  active?: boolean
  activa?: boolean
}

interface CampusFull {
  id: number
  name?: string
  description?: string
  active?: boolean
  image?: { url?: string } | number | null
  city?: string
  province?: string
  address?: string
  postal_code?: string
  phone?: string
  phone2?: string
  email?: string
  web?: string
  maps_url?: string
  schedule?: { weekdays?: string; saturday?: string; sunday?: string; notes?: string }
  capacity?: number
  classrooms?: Classroom[]
  services?: string[]
  parking?: { available?: boolean; spaces?: number; free?: boolean; notes?: string }
  coordinator?: StaffMember | number | null
  staff_members?: (StaffMember | number)[]
  notes?: string
}

interface AulasApiResponse {
  success: boolean
  data?: Classroom[]
}

interface StaffApiResponse {
  success: boolean
  data?: StaffMember[]
}

interface ConvocatoriasApiResponse {
  success: boolean
  data?: Convocatoria[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'outline' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default' },
  in_progress: { label: 'En curso', variant: 'default' },
  completed: { label: 'Finalizada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
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

export default function SedeDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [sede, setSede] = React.useState<CampusFull | null>(null)
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([])
  const [profesores, setProfesores] = React.useState<StaffMember[]>([])
  const [administrativos, setAdministrativos] = React.useState<StaffMember[]>([])
  const [convocatorias, setConvocatorias] = React.useState<Convocatoria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [sedeRes, aulasRes, profesoresRes, administrativosRes, convsRes] = await Promise.all([
          fetch(`/api/campuses/${id}?depth=1`, { cache: 'no-store' }),
          fetch(`/api/aulas?campus_id=${id}&active=true`, { cache: 'no-store' }),
          fetch(`/api/staff?type=profesor&campus=${id}&limit=200`, { cache: 'no-store' }),
          fetch(`/api/staff?type=administrativo&campus=${id}&limit=200`, { cache: 'no-store' }),
          fetch(`/api/convocatorias?campusId=${id}`, { cache: 'no-store' }),
        ])

        if (!sedeRes.ok) throw new Error('No se pudo cargar la sede')
        const sedeData = await sedeRes.json()
        if (mounted) setSede(sedeData)

        if (aulasRes.ok) {
          const aulasData = (await aulasRes.json()) as AulasApiResponse
          if (mounted) setClassrooms(aulasData.data ?? [])
        }

        if (profesoresRes.ok) {
          const staffData = (await profesoresRes.json()) as StaffApiResponse
          if (mounted) setProfesores(staffData.data ?? [])
        }

        if (administrativosRes.ok) {
          const staffData = (await administrativosRes.json()) as StaffApiResponse
          if (mounted) setAdministrativos(staffData.data ?? [])
        }

        if (convsRes.ok) {
          const convsData = (await convsRes.json()) as ConvocatoriasApiResponse
          if (mounted) setConvocatorias(convsData.data ?? [])
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
  if (error || !sede) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sede" description="Detalle de sede" icon={MapPin}
          actions={<Button variant="ghost" onClick={() => router.push('/dashboard/sedes')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar la sede</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived data
  const activeClassrooms = classrooms.filter(c => c.active !== false && c.activa !== false)
  const totalCapacity = sede.capacity || activeClassrooms.reduce((sum, c) => sum + (c.capacity || c.capacidad || 0), 0)

  const services = Array.isArray(sede.services) ? sede.services : []
  const coordinator = typeof sede.coordinator === 'object' && sede.coordinator !== null ? sede.coordinator : null
  const imageUrl = typeof sede.image === 'object' && sede.image !== null ? sede.image.url : null
  const fullAddress = [sede.address, sede.postal_code, sede.city].filter(Boolean).join(', ')

  function staffName(p: StaffMember): string {
    return p.fullName || p.full_name || `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim() || 'Sin nombre'
  }

  function staffInitials(p: StaffMember): string {
    const name = staffName(p)
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0]?.[0] || '?').toUpperCase()
  }

  function isStaffActive(p: StaffMember): boolean {
    return p.isActive ?? p.is_active ?? p.employmentStatus !== 'inactive'
  }

  function classroomName(c: Classroom): string {
    return c.nombre || c.name || c.code || 'Aula'
  }

  function classroomCapacity(c: Classroom): number {
    return c.capacidad || c.capacity || 0
  }

  function formatDate(date?: string): string | null {
    if (!date) return null
    return new Date(date).toLocaleDateString('es-ES')
  }

  function trainingTypeLabel(type?: string) {
    if (type === 'cycle') return 'Ciclo'
    if (type === 'fped') return 'FPED'
    if (type === 'private') return 'Privado'
    return type || 'Sin tipo'
  }

  function shiftLabel(shift?: string) {
    if (shift === 'morning') return 'Mañana'
    if (shift === 'afternoon') return 'Tarde'
    if (shift === 'evening_extra') return 'Tercer turno'
    return shift || 'Turno pendiente'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={sede.name || 'Sede'}
        description={sede.city || ''}
        icon={MapPin}
        badge={
          <Badge variant={sede.active !== false ? 'default' : 'secondary'}>
            {sede.active !== false ? 'Activa' : 'Inactiva'}
          </Badge>
        }
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/dashboard/sedes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Sedes
          </Button>
          <Button onClick={() => router.push(`/dashboard/sedes/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />Editar
          </Button>
        </>}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Aulas', value: activeClassrooms.length, icon: DoorOpen },
          { label: 'Capacidad', value: totalCapacity, icon: Users },
          { label: 'Convocatorias', value: convocatorias.length, icon: Calendar },
          { label: 'Profesores', value: profesores.length, icon: GraduationCap },
          { label: 'Administrativos', value: administrativos.length, icon: Briefcase },
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
          {/* Aulas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-primary" />
                Aulas
                <Badge variant="outline">{activeClassrooms.length}</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/sedes/${id}/editar`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Gestionar aulas
              </Button>
            </CardHeader>
            <CardContent>
              {activeClassrooms.length === 0 ? (
                <EmptyState
                  message="No hay aulas configuradas en esta sede"
                  hint="Las aulas se gestionan desde la ficha de sede"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeClassrooms.map((classroom) => (
                    <button
                      key={classroom.id ?? classroomName(classroom)}
                      type="button"
                      onClick={() => router.push(`/dashboard/sedes/${id}/aulas/${classroom.id}`)}
                      className="rounded-lg border p-4 text-left transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <DoorOpen className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{classroomName(classroom)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {classroomCapacity(classroom) || '—'} plazas
                          </p>
                        </div>
                      </div>
                      {classroom.enabled_shifts && classroom.enabled_shifts.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {classroom.enabled_shifts.map((shift) => (
                            <Badge key={shift} variant="outline" className="text-[10px]">
                              {shiftLabel(shift)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {classroom.operational_notes ? (
                        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                          {classroom.operational_notes}
                        </p>
                      ) : null}
                    </button>
                  ))}
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
            </CardHeader>
            <CardContent>
              {convocatorias.length === 0 ? (
                <EmptyState
                  message="No hay convocatorias asignadas a esta sede"
                  hint="Las convocatorias se crean desde Programacion"
                />
              ) : (
                <div className="space-y-2">
                  {convocatorias.map((conv) => {
                    const courseName = conv.cursoNombre || (typeof conv.course === 'object' && conv.course !== null
                      ? (conv.course.title || conv.course.name || `Curso #${conv.course.id}`)
                      : `Curso #${conv.course}`)
                    const statusKey = conv.estado || conv.status || conv.planningStatus || 'draft'
                    const status = STATUS_LABELS[statusKey] || STATUS_LABELS.draft
                    const startDate = formatDate(conv.fechaInicio || conv.start_date)
                    const endDate = formatDate(conv.fechaFin || conv.end_date)
                    const maxStudents = conv.plazasTotales ?? conv.max_students
                    const currentStudents = conv.plazasOcupadas ?? conv.current_enrollments ?? 0
                    return (
                      <div key={conv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm truncate">{courseName}</span>
                            <Badge variant={status.variant} className="text-[10px] shrink-0">{status.label}</Badge>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {trainingTypeLabel(conv.trainingType)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.codigo && <span className="font-mono">{conv.codigo} · </span>}
                            {startDate}
                            {endDate && ` — ${endDate}`}
                            {maxStudents && ` · ${currentStudents}/${maxStudents} plazas`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.aulaNombre || 'Sin aula'} · {shiftLabel(conv.turno)}
                            {conv.profesor && ` · ${conv.profesor}`}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => router.push('/programacion')}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
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
                <GraduationCap className="h-4 w-4 text-primary" />
                Profesores
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Asignar profesor
              </Button>
            </CardHeader>
            <CardContent>
              {profesores.length === 0 ? (
                <EmptyState message="No hay profesores asignados a esta sede" />
              ) : (
                <div className="space-y-2">
                  {profesores.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                        {staffInitials(p)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{staffName(p)}</p>
                        {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                        {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                      </div>
                      <Badge variant={isStaffActive(p) ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {isStaffActive(p) ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Administrativo */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Personal Administrativo
              </CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Asignar personal
              </Button>
            </CardHeader>
            <CardContent>
              {administrativos.length === 0 ? (
                <EmptyState message="No hay personal administrativo asignado a esta sede" />
              ) : (
                <div className="space-y-2">
                  {administrativos.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                        {staffInitials(p)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{staffName(p)}</p>
                        {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                        {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                      </div>
                      <Badge variant={isStaffActive(p) ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {isStaffActive(p) ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR (1/3) */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacion de la Sede</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Image */}
              {imageUrl ? (
                <img src={imageUrl} alt={sede.name || 'Sede'} className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div
                  className="w-full h-40 rounded-lg bg-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors border-2 border-dashed border-border"
                  onClick={() => router.push(`/dashboard/sedes/${id}/editar`)}
                >
                  <MapPin className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">Click para subir imagen</span>
                </div>
              )}

              {/* Address */}
              {fullAddress && <InfoRow label="Direccion">{fullAddress}</InfoRow>}

              {/* City & Province */}
              {sede.province && <InfoRow label="Provincia">{sede.province}</InfoRow>}

              {/* Phone(s) */}
              {sede.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Telefono</span>
                  <a href={`tel:${sede.phone}`} className="font-medium text-primary hover:underline">{sede.phone}</a>
                </div>
              )}
              {sede.phone2 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Telefono 2</span>
                  <a href={`tel:${sede.phone2}`} className="font-medium text-primary hover:underline">{sede.phone2}</a>
                </div>
              )}

              {/* Email */}
              {sede.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <a href={`mailto:${sede.email}`} className="font-medium text-primary hover:underline truncate max-w-[60%]">{sede.email}</a>
                </div>
              )}

              {/* Web */}
              {sede.web && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Web</span>
                  <a href={sede.web} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate max-w-[60%]">
                    {sede.web.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {/* Google Maps */}
              {sede.maps_url && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mapa</span>
                  <a href={sede.maps_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline text-xs">
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* Coordinator */}
              {coordinator && (
                <InfoRow label="Coordinador/a">
                  {coordinator.full_name || `${coordinator.first_name || ''} ${coordinator.last_name || ''}`.trim()}
                </InfoRow>
              )}

              {/* Schedule summary */}
              {sede.schedule?.weekdays && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />L-V</span>
                  <span className="font-medium">{sede.schedule.weekdays}</span>
                </div>
              )}

              {/* Counts */}
              <InfoRow label="Aulas">{activeClassrooms.length} aulas</InfoRow>
              <InfoRow label="Servicios">{services.length} servicios</InfoRow>

              {/* Ver ficha completa button */}
              <div className="border-t border-border pt-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => router.push(`/dashboard/sedes/${id}/detalle`)}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Ver Sede
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              {sede.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {sede.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
