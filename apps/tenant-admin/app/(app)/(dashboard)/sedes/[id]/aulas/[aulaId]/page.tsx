'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  DoorOpen,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react'

interface Classroom {
  id?: number
  code?: string
  name?: string
  nombre?: string
  capacity?: number
  capacidad?: number
  enabled_shifts?: string[]
}

interface Convocatoria {
  id: number
  codigo?: string
  cursoNombre?: string
  aulaId?: number
  aulaNombre?: string
  fechaInicio?: string
  fechaFin?: string
  turno?: string
  horario?: string
  plazasTotales?: number
  plazasOcupadas?: number
  estado?: string
  planningStatus?: string
  profesor?: string
}

interface PageProps {
  params: Promise<{ id: string; aulaId: string }>
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening_extra: 'Tercer turno',
  mañana: 'Mañana',
  tarde: 'Tarde',
  tercer_turno: 'Tercer turno',
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function classroomName(classroom?: Classroom) {
  if (!classroom) return 'Aula'
  return classroom.nombre || classroom.name || classroom.code || `Aula #${classroom.id}`
}

function classroomCapacity(classroom?: Classroom) {
  return classroom?.capacidad ?? classroom?.capacity ?? 0
}

export default function ClassroomOccupancyPage({ params }: PageProps) {
  const { id, aulaId } = React.use(params)
  const router = useRouter()
  const [classroom, setClassroom] = React.useState<Classroom | null>(null)
  const [convocatorias, setConvocatorias] = React.useState<Convocatoria[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [classroomsRes, convocatoriasRes] = await Promise.all([
          fetch(`/api/aulas?campus_id=${id}&active=true`, { cache: 'no-cache' }),
          fetch(`/api/convocatorias?campusId=${id}`, { cache: 'no-cache' }),
        ])

        if (!classroomsRes.ok) throw new Error('No se pudieron cargar las aulas')
        if (!convocatoriasRes.ok) throw new Error('No se pudieron cargar las convocatorias')

        const classroomsData = await classroomsRes.json()
        const convocatoriasData = await convocatoriasRes.json()
        const classrooms = (classroomsData.data ?? classroomsData.docs ?? []) as Classroom[]
        const selectedClassroom = classrooms.find((item) => String(item.id) === aulaId)

        if (!selectedClassroom) throw new Error('Aula no encontrada')

        setClassroom(selectedClassroom)
        setConvocatorias(
          ((convocatoriasData.data ?? []) as Convocatoria[]).filter(
            (convocatoria) => String(convocatoria.aulaId) === aulaId,
          ),
        )
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [id, aulaId])

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !classroom) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/sedes/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la sede
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            {error || 'Aula no encontrada'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const capacity = classroomCapacity(classroom)
  const occupiedRuns = convocatorias.length
  const totalReservedSeats = convocatorias.reduce(
    (sum, convocatoria) => sum + (convocatoria.plazasTotales ?? capacity),
    0,
  )
  const totalEnrolled = convocatorias.reduce(
    (sum, convocatoria) => sum + (convocatoria.plazasOcupadas ?? 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-end md:justify-between">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/sedes/${id}`)}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Sede
          </button>
          <span>/</span>
          <span>Ocupación de aula</span>
        </nav>
        <div className="text-left md:text-right">
          <h1 className="text-3xl font-bold tracking-tight">{classroomName(classroom)}</h1>
          <p className="text-muted-foreground">{capacity || '—'} plazas disponibles por turno</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Capacidad', value: capacity || '—', icon: Users },
          { label: 'Convocatorias', value: occupiedRuns, icon: Calendar },
          { label: 'Plazas planificadas', value: totalReservedSeats, icon: DoorOpen },
          { label: 'Alumnos inscritos', value: totalEnrolled, icon: BookOpen },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
              <item.icon className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendario de ocupación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {convocatorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay convocatorias asignadas a esta aula.</p>
          ) : (
            <div className="space-y-3">
              {convocatorias.map((convocatoria) => {
                const seats = convocatoria.plazasTotales ?? capacity
                const enrolled = convocatoria.plazasOcupadas ?? 0
                const occupancy = seats > 0 ? Math.round((enrolled / seats) * 100) : 0
                const shift = convocatoria.turno ? (SHIFT_LABELS[convocatoria.turno] ?? convocatoria.turno) : 'Sin turno'

                return (
                  <div key={convocatoria.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{convocatoria.cursoNombre || 'Curso'}</h2>
                          <Badge variant="outline">{convocatoria.planningStatus || convocatoria.estado || 'draft'}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {convocatoria.codigo ? `${convocatoria.codigo} · ` : ''}
                          {formatDate(convocatoria.fechaInicio)} - {formatDate(convocatoria.fechaFin)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {shift}
                          </span>
                          {convocatoria.profesor ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {convocatoria.profesor}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="min-w-36 text-sm font-medium">
                        {enrolled}/{seats} plazas ({occupancy}%)
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
