'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Edit,
  Clock,
  DoorOpen,
  Users,
  BookOpen,
  Building2,
} from 'lucide-react'

interface ApiCampus {
  id: string
  name?: string
  city?: string
  address?: string
  postal_code?: string
  phone?: string
  email?: string
  metadata?: Record<string, unknown>
  staff_members?: unknown[]
}

interface SedeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export default function SedeDetailPage({ params }: SedeDetailPageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const [sede, setSede] = React.useState<ApiCampus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const fetchSede = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch(`/api/campuses/${id}`, { cache: 'no-store' })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('La sede solicitada no existe.')
          }
          throw new Error('No se pudo cargar la sede.')
        }

        const payload = (await response.json()) as ApiCampus
        if (isMounted) {
          setSede(payload)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al cargar la sede.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchSede()

    return () => {
      isMounted = false
    }
  }, [id])

  const metadata = (sede?.metadata ?? {}) as Record<string, unknown>
  const aulas = toNumber(metadata.aulas)
  const capacidad = toNumber(metadata.capacidad)
  const cursosActivos = toNumber(metadata.cursosActivos)
  const profesores = Array.isArray(sede?.staff_members) ? sede.staff_members.length : toNumber(metadata.profesores)
  const horario = typeof metadata.horario === 'string' ? metadata.horario : 'Lunes a Viernes 08:00 - 20:00'
  const descripcion =
    typeof metadata.descripcion === 'string'
      ? metadata.descripcion
      : 'Sede activa en el ecosistema AKADEMATE. Los datos operativos se sincronizan desde el módulo de campus.'

  const fullAddress = [sede?.address, sede?.postal_code, sede?.city].filter(Boolean).join(', ') || 'Dirección pendiente'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando sede...
        </div>
      </div>
    )
  }

  if (errorMessage || !sede) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sede"
          description="Detalle de sede"
          icon={MapPin}
          actions={
            <Button variant="ghost" onClick={() => router.push('/sedes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Sedes
            </Button>
          }
        />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-base font-medium">No se pudo cargar la sede</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? 'Sede no encontrada.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={sede.name ?? 'Sede'}
        description="Detalle de sede conectado a datos reales de Campus"
        icon={MapPin}
        badge={<Badge variant="secondary">ID {sede.id}</Badge>}
        actions={
          <>
            <Button variant="ghost" onClick={() => router.push('/sedes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Sedes
            </Button>
            <Button onClick={() => router.push(`/sedes/${id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Sede
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aulas</span>
              <DoorOpen className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{aulas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capacidad</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{capacidad}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cursos Activos</span>
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{cursosActivos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profesores</span>
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{profesores}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4" />
              <span>{fullAddress}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Phone className="mt-0.5 h-4 w-4" />
              <span>{sede.phone ?? 'Teléfono pendiente'}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4" />
              <span>{sede.email ?? 'Email pendiente'}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4" />
              <span>{horario}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{descripcion}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
