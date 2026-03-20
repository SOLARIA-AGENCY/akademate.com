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
  full_name?: string
  first_name?: string
  last_name?: string
  staff_type?: 'profesor' | 'administrativo'
  email?: string
  phone?: string
  position?: string
  is_active?: boolean
  photo?: { url?: string } | number | null
}

interface Convocatoria {
  id: number
  codigo?: string
  status?: string
  start_date?: string
  end_date?: string
  max_students?: number
  current_enrollments?: number
  campus?: { id: number } | number
  course?: { id: number; title?: string; name?: string } | number
}

interface Classroom {
  name: string
  capacity?: number
  floor?: string
  equipment?: string[]
  active?: boolean
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
  const [convocatorias, setConvocatorias] = React.useState<Convocatoria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [sedeRes, convsRes] = await Promise.all([
          fetch(`/api/campuses/${id}?depth=1`, { cache: 'no-store' }),
          fetch(`/api/course-runs?where[campus][equals]=${id}&depth=1&limit=50&sort=-start_date`, { cache: 'no-store' }),
        ])

        if (!sedeRes.ok) throw new Error('No se pudo cargar la sede')
        const sedeData = await sedeRes.json()
        if (mounted) setSede(sedeData)

        if (convsRes.ok) {
          const convsData = await convsRes.json()
          if (mounted) setConvocatorias(convsData.docs || [])
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
          actions={<Button variant="ghost" onClick={() => router.push('/sedes')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>} />
        <Card><CardContent className="p-8 text-center">
          <p className="font-medium">No se pudo cargar la sede</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent></Card>
      </div>
    )
  }

  // Derived data
  const staffList: StaffMember[] = Array.isArray(sede.staff_members)
    ? sede.staff_members.filter((s): s is StaffMember => typeof s === 'object' && s !== null)
    : []
  const profesores = staffList.filter(s => s.staff_type === 'profesor')
  const administrativos = staffList.filter(s => s.staff_type === 'administrativo')

  const classrooms = Array.isArray(sede.classrooms) ? sede.classrooms : []
  const activeClassrooms = classrooms.filter(c => c.active !== false)
  const totalCapacity = sede.capacity || activeClassrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)

  const services = Array.isArray(sede.services) ? sede.services : []
  const coordinator = typeof sede.coordinator === 'object' && sede.coordinator !== null ? sede.coordinator : null
  const imageUrl = typeof sede.image === 'object' && sede.image !== null ? sede.image.url : null
  const fullAddress = [sede.address, sede.postal_code, sede.city].filter(Boolean).join(', ')

  function staffName(p: StaffMember): string {
    return p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre'
  }

  function staffInitials(p: StaffMember): string {
    const name = staffName(p)
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0]?.[0] || '?').toUpperCase()
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
          <Button variant="ghost" onClick={() => router.push('/sedes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />Sedes
          </Button>
          <Button onClick={() => router.push(`/sedes/${id}/editar`)}>
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
          {/* Convocatorias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Convocatorias
                <Badge variant="outline">{convocatorias.length}</Badge>
              </CardTitle>
              <Button size="sm" onClick={() => router.push(`/programacion/nueva?sede=${id}`)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Crear convocatoria
              </Button>
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
                    const courseName = typeof conv.course === 'object' && conv.course !== null
                      ? (conv.course.title || conv.course.name || `Curso #${conv.course.id}`)
                      : `Curso #${conv.course}`
                    const status = STATUS_LABELS[conv.status || 'draft'] || STATUS_LABELS.draft
                    return (
                      <div key={conv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{courseName}</span>
                            <Badge variant={status.variant} className="text-[10px] shrink-0">{status.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conv.codigo && <span className="font-mono">{conv.codigo} · </span>}
                            {conv.start_date && new Date(conv.start_date).toLocaleDateString('es-ES')}
                            {conv.end_date && ` — ${new Date(conv.end_date).toLocaleDateString('es-ES')}`}
                            {conv.max_students && ` · ${conv.current_enrollments || 0}/${conv.max_students} plazas`}
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
                      <Badge variant={p.is_active !== false ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {p.is_active !== false ? 'Activo' : 'Inactivo'}
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
                      <Badge variant={p.is_active !== false ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                        {p.is_active !== false ? 'Activo' : 'Inactivo'}
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
              {imageUrl && (
                <img src={imageUrl} alt={sede.name || 'Sede'} className="w-full h-40 object-cover rounded-lg" />
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
                  onClick={() => router.push(`/sedes/${id}/detalle`)}
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
