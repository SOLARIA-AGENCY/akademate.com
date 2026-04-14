'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin,
  ArrowLeft,
  Edit,
  Loader2,
  Building2,
  Car,
  Clock,
  Users,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  DoorOpen,
  Wrench,
  StickyNote,
  UserCheck,
  Image as ImageIcon,
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
// Constants
// ---------------------------------------------------------------------------

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: 'Proyector',
  digital_board: 'Pizarra digital',
  whiteboard: 'Pizarra blanca',
  wifi: 'WiFi',
  computers: 'Ordenadores',
  ac: 'A/C',
  av_system: 'Audio/Video',
  lab: 'Laboratorio',
  workshop: 'Taller',
}

const SERVICE_LABELS: Record<string, string> = {
  wifi: 'WiFi gratuito',
  parking: 'Aparcamiento',
  cafeteria: 'Cafeteria',
  library: 'Biblioteca',
  accessibility: 'Acceso movilidad reducida',
  elevator: 'Ascensor',
  study_room: 'Sala de estudio',
  lockers: 'Taquillas',
  public_transport: 'Transporte publico',
  front_desk: 'Secretaria',
  break_area: 'Zona descanso',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function staffName(s: StaffMember): string {
  if (s.full_name) return s.full_name
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || `Staff #${s.id}`
}

function isStaffObject(v: StaffMember | number): v is StaffMember {
  return typeof v === 'object' && v !== null
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground italic">{text}</p>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface DetalleSedePageProps {
  params: Promise<{ id: string }>
}

export default function DetalleSedePageWrapper(props: DetalleSedePageProps) {
  const { id } = React.use(props.params)
  return <DetalleSedePage id={id} />
}

function DetalleSedePage({ id }: { id: string }) {
  const router = useRouter()
  const [sede, setSede] = React.useState<CampusFull | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campuses/${id}?depth=1`, { cache: 'no-cache' })
        if (!res.ok) throw new Error('No se pudo cargar la sede')
        const data = await res.json()
        setSede(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !sede) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Error" icon={MapPin}
          actions={<Button variant="outline" onClick={() => router.push('/dashboard/sedes')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>}
        />
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            {error || 'Sede no encontrada'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const imageUrl =
    sede.image && typeof sede.image === 'object' && sede.image.url ? sede.image.url : null

  const classrooms = sede.classrooms ?? []
  const services = sede.services ?? []
  const staffMembers = (sede.staff_members ?? []).filter(isStaffObject)
  const profesores = staffMembers.filter((s) => s.staff_type === 'profesor')
  const administrativos = staffMembers.filter((s) => s.staff_type === 'administrativo')
  const coordinator =
    sede.coordinator && typeof sede.coordinator === 'object' ? sede.coordinator : null
  const schedule = sede.schedule ?? {}
  const parking = sede.parking ?? {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={sede.name ?? 'Sede'}
        description={[sede.city, sede.province].filter(Boolean).join(', ') || undefined}
        icon={MapPin}
        badge={<Badge variant={sede.active !== false ? 'default' : 'secondary'}>{sede.active !== false ? 'Activa' : 'Inactiva'}</Badge>}
        actions={<>
          <Button variant="ghost" onClick={() => router.push('/dashboard/sedes')}><ArrowLeft className="mr-2 h-4 w-4" />Sedes</Button>
          <Button onClick={() => router.push(`/dashboard/sedes/${id}/editar`)}><Edit className="mr-2 h-4 w-4" />Editar Sede</Button>
        </>}
      />

      {/* Hero image */}
      {imageUrl && (
        <div className="rounded-lg overflow-hidden border">
          <img
            src={imageUrl}
            alt={sede.name ?? 'Sede'}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Informacion General */}
      <SectionCard title="Informacion General" icon={Building2}>
        <div className="divide-y divide-border">
          <InfoRow label="Nombre">{sede.name ?? '—'}</InfoRow>
          {sede.description && <InfoRow label="Descripcion">{sede.description}</InfoRow>}
          <InfoRow label="Ciudad">{sede.city ?? '—'}</InfoRow>
          {sede.province && <InfoRow label="Provincia">{sede.province}</InfoRow>}
          <InfoRow label="Direccion">{sede.address ?? '—'}</InfoRow>
          {sede.postal_code && <InfoRow label="Codigo postal">{sede.postal_code}</InfoRow>}
          {sede.phone && (
            <InfoRow label="Telefono">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {sede.phone}
              </span>
            </InfoRow>
          )}
          {sede.phone2 && (
            <InfoRow label="Telefono 2">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {sede.phone2}
              </span>
            </InfoRow>
          )}
          {sede.email && (
            <InfoRow label="Email">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {sede.email}
              </span>
            </InfoRow>
          )}
          {sede.web && (
            <InfoRow label="Web">
              <a
                href={sede.web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline flex items-center gap-1"
              >
                <Globe className="h-3.5 w-3.5" />
                {sede.web}
              </a>
            </InfoRow>
          )}
          {sede.maps_url && (
            <InfoRow label="Ubicacion">
              <a
                href={sede.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver en Google Maps
              </a>
            </InfoRow>
          )}
        </div>
      </SectionCard>

      {/* Horarios */}
      <SectionCard title="Horarios" icon={Clock}>
        {!schedule.weekdays && !schedule.saturday && !schedule.sunday && !schedule.notes ? (
          <EmptyNote text="No hay horarios definidos." />
        ) : (
          <div className="divide-y divide-border">
            {schedule.weekdays && <InfoRow label="Lunes a Viernes">{schedule.weekdays}</InfoRow>}
            {schedule.saturday && <InfoRow label="Sabado">{schedule.saturday}</InfoRow>}
            {schedule.sunday && <InfoRow label="Domingo">{schedule.sunday}</InfoRow>}
            {schedule.notes && <InfoRow label="Notas">{schedule.notes}</InfoRow>}
          </div>
        )}
      </SectionCard>

      {/* Aulas */}
      <SectionCard title="Aulas" icon={DoorOpen}>
        {classrooms.length === 0 ? (
          <EmptyNote text="No hay aulas registradas." />
        ) : (
          <div className="space-y-3">
            {classrooms.map((c, i) => (
              <div
                key={i}
                className="rounded-md border p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.name}</span>
                  <Badge variant={c.active !== false ? 'default' : 'secondary'} className="text-xs">
                    {c.active !== false ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {c.capacity != null && <span>Capacidad: {c.capacity}</span>}
                  {c.floor && <span>Planta: {c.floor}</span>}
                </div>
                {c.equipment && c.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.equipment.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-xs">
                        {EQUIPMENT_LABELS[eq] ?? eq}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Servicios */}
      <SectionCard title="Servicios" icon={Wrench}>
        {services.length === 0 ? (
          <EmptyNote text="No hay servicios registrados." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((svc) => (
              <Badge key={svc} variant="outline">
                {SERVICE_LABELS[svc] ?? svc}
              </Badge>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Aparcamiento */}
      <SectionCard title="Aparcamiento" icon={Car}>
        {parking.available == null && !parking.notes ? (
          <EmptyNote text="Sin informacion de aparcamiento." />
        ) : (
          <div className="divide-y divide-border">
            <InfoRow label="Disponible">
              {parking.available ? 'Si' : 'No'}
            </InfoRow>
            {parking.spaces != null && (
              <InfoRow label="Plazas">{parking.spaces}</InfoRow>
            )}
            {parking.available && (
              <InfoRow label="Gratuito">{parking.free ? 'Si' : 'No'}</InfoRow>
            )}
            {parking.notes && <InfoRow label="Notas">{parking.notes}</InfoRow>}
          </div>
        )}
      </SectionCard>

      {/* Personal Asignado */}
      <SectionCard title="Personal Asignado" icon={Users}>
        {staffMembers.length === 0 ? (
          <EmptyNote text="No hay personal asignado." />
        ) : (
          <div className="space-y-4">
            {profesores.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Profesores ({profesores.length})</h4>
                <div className="space-y-2">
                  {profesores.map((s) => (
                    <StaffRow key={s.id} staff={s} />
                  ))}
                </div>
              </div>
            )}
            {administrativos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Administrativos ({administrativos.length})
                </h4>
                <div className="space-y-2">
                  {administrativos.map((s) => (
                    <StaffRow key={s.id} staff={s} />
                  ))}
                </div>
              </div>
            )}
            {/* Staff without type */}
            {staffMembers.filter((s) => !s.staff_type).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Otro personal</h4>
                <div className="space-y-2">
                  {staffMembers
                    .filter((s) => !s.staff_type)
                    .map((s) => (
                      <StaffRow key={s.id} staff={s} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Coordinador */}
      {coordinator && (
        <SectionCard title="Coordinador" icon={UserCheck}>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">{staffName(coordinator)}</span>
            {coordinator.position && (
              <span className="text-xs text-muted-foreground">{coordinator.position}</span>
            )}
            {coordinator.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {coordinator.email}
              </span>
            )}
            {coordinator.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {coordinator.phone}
              </span>
            )}
          </div>
        </SectionCard>
      )}

      {/* Notas internas */}
      {sede.notes && (
        <SectionCard title="Notas internas" icon={StickyNote}>
          <p className="text-sm whitespace-pre-wrap">{sede.notes}</p>
        </SectionCard>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Staff Row component
// ---------------------------------------------------------------------------

function StaffRow({ staff }: { staff: StaffMember }) {
  return (
    <div className="rounded-md border px-3 py-2 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{staffName(staff)}</span>
        {staff.position && (
          <span className="text-xs text-muted-foreground">{staff.position}</span>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {staff.email && (
          <span className="text-xs text-muted-foreground">{staff.email}</span>
        )}
      </div>
    </div>
  )
}
