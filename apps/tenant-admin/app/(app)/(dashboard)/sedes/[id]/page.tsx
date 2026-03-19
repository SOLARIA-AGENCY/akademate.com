'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin, Phone, Mail, ArrowLeft, Edit, Clock, DoorOpen, Users,
  BookOpen, Building2, Globe, Car, Loader2, Calendar, GraduationCap,
  UserCheck, Briefcase, CheckCircle2, XCircle, ChevronRight, Image as ImageIcon,
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

const SERVICE_LABELS: Record<string, string> = {
  wifi: 'WiFi gratuito', parking: 'Aparcamiento', cafeteria: 'Cafeteria',
  library: 'Biblioteca', accessibility: 'Acceso movilidad reducida',
  elevator: 'Ascensor', study_room: 'Sala de estudio', lockers: 'Taquillas',
  public_transport: 'Transporte publico', front_desk: 'Secretaria', break_area: 'Zona descanso',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: 'Proyector', digital_board: 'Pizarra digital', whiteboard: 'Pizarra blanca',
  wifi: 'WiFi', computers: 'Ordenadores', ac: 'A/C', av_system: 'Audio/Video',
  lab: 'Laboratorio', workshop: 'Taller',
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'outline' },
  enrollment_open: { label: 'Inscripcion abierta', variant: 'default' },
  in_progress: { label: 'En curso', variant: 'default' },
  completed: { label: 'Finalizada', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

  // Resolve staff members
  const staffList: StaffMember[] = Array.isArray(sede.staff_members)
    ? sede.staff_members.filter((s): s is StaffMember => typeof s === 'object' && s !== null)
    : []
  const profesores = staffList.filter(s => s.staff_type === 'profesor')
  const administrativos = staffList.filter(s => s.staff_type === 'administrativo')

  // Classrooms
  const classrooms = Array.isArray(sede.classrooms) ? sede.classrooms : []
  const activeClassrooms = classrooms.filter(c => c.active !== false)
  const totalCapacity = sede.capacity || activeClassrooms.reduce((sum, c) => sum + (c.capacity || 0), 0)

  // Services
  const services = Array.isArray(sede.services) ? sede.services : []

  // Coordinator
  const coordinator = typeof sede.coordinator === 'object' && sede.coordinator !== null ? sede.coordinator : null

  // Image
  const imageUrl = typeof sede.image === 'object' && sede.image !== null ? sede.image.url : null

  // Address
  const fullAddress = [sede.address, sede.postal_code, sede.city].filter(Boolean).join(', ')

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
          <Button variant="ghost" onClick={() => router.push('/sedes')}><ArrowLeft className="mr-2 h-4 w-4" />Sedes</Button>
          <Button onClick={() => router.push(`/sedes/${id}/editar`)}><Edit className="mr-2 h-4 w-4" />Editar</Button>
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

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Info + Image */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image + Description */}
          {(imageUrl || sede.description) && (
            <Card>
              <CardContent className="p-0">
                {imageUrl && (
                  <img src={imageUrl} alt={sede.name || 'Sede'} className="w-full h-48 object-cover rounded-t-lg" />
                )}
                {sede.description && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{sede.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Convocatorias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Convocatorias en esta sede
              </CardTitle>
              <Badge variant="outline">{convocatorias.length}</Badge>
            </CardHeader>
            <CardContent>
              {convocatorias.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay convocatorias asignadas a esta sede</p>
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
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={() => router.push(`/programacion`)}>
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Profesores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profesores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay profesores asignados</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {profesores.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre'}</p>
                        {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                        {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                      </div>
                      <Badge variant={p.is_active !== false ? 'default' : 'secondary'} className="text-[10px] ml-auto shrink-0">
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Personal Administrativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {administrativos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay personal administrativo asignado</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {administrativos.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre'}</p>
                        {p.position && <p className="text-xs text-muted-foreground truncate">{p.position}</p>}
                        {p.email && <p className="text-xs text-muted-foreground truncate">{p.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Sidebar info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Informacion de Contacto</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {fullAddress && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{fullAddress}</span>
                </div>
              )}
              {sede.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{sede.phone}</span>
                </div>
              )}
              {sede.phone2 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{sede.phone2}</span>
                </div>
              )}
              {sede.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{sede.email}</span>
                </div>
              )}
              {sede.web && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0" />
                  <a href={sede.web} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{sede.web}</a>
                </div>
              )}
              {sede.maps_url && (
                <a href={sede.maps_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                  <MapPin className="h-3 w-3" /> Ver en Google Maps
                </a>
              )}
            </CardContent>
          </Card>

          {/* Coordinator */}
          {coordinator && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Coordinador</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{coordinator.full_name || `${coordinator.first_name || ''} ${coordinator.last_name || ''}`.trim()}</p>
                    {coordinator.email && <p className="text-xs text-muted-foreground">{coordinator.email}</p>}
                    {coordinator.phone && <p className="text-xs text-muted-foreground">{coordinator.phone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          {sede.schedule && (sede.schedule.weekdays || sede.schedule.saturday || sede.schedule.sunday) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Horarios</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {sede.schedule.weekdays && <div className="flex justify-between"><span className="text-muted-foreground">L-V</span><span>{sede.schedule.weekdays}</span></div>}
                {sede.schedule.saturday && <div className="flex justify-between"><span className="text-muted-foreground">Sabado</span><span>{sede.schedule.saturday}</span></div>}
                {sede.schedule.sunday && <div className="flex justify-between"><span className="text-muted-foreground">Domingo</span><span>{sede.schedule.sunday}</span></div>}
                {sede.schedule.notes && <p className="text-xs text-muted-foreground pt-1">{sede.schedule.notes}</p>}
              </CardContent>
            </Card>
          )}

          {/* Classrooms */}
          {activeClassrooms.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><DoorOpen className="h-4 w-4" />Aulas ({activeClassrooms.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeClassrooms.map((room, i) => (
                  <div key={i} className="rounded border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.name}</span>
                      {room.capacity && <Badge variant="outline" className="text-[10px]">{room.capacity} plazas</Badge>}
                    </div>
                    {room.floor && <p className="text-xs text-muted-foreground">{room.floor}</p>}
                    {room.equipment && room.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.equipment.map(eq => (
                          <Badge key={eq} variant="secondary" className="text-[9px]">{EQUIPMENT_LABELS[eq] || eq}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {services.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Servicios</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {services.map(s => (
                    <Badge key={s} variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      {SERVICE_LABELS[s] || s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parking */}
          {sede.parking?.available && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Car className="h-4 w-4" />Aparcamiento</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {sede.parking.spaces && <p>{sede.parking.spaces} plazas</p>}
                <p className="text-muted-foreground">{sede.parking.free ? 'Gratuito' : 'De pago'}</p>
                {sede.parking.notes && <p className="text-xs text-muted-foreground">{sede.parking.notes}</p>}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {sede.notes && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sede.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
