'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { MapPin, DoorOpen, Users, BookOpen, Phone, Mail } from 'lucide-react'
import { SedeListItem } from '@payload-config/components/ui/SedeListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'

/** Sede data structure used for display */
interface Sede {
  id: string
  nombre: string
  direccion: string
  telefono: string
  email: string
  horario: string
  aulas: number
  capacidad: number
  cursosActivos: number
  profesores: number
  color: string
  borderColor: string
  imagen: string
}

/** Campus data from API response */
interface ApiCampus {
  id: string
  name?: string
  address?: string
  postal_code?: string
  city?: string
  phone?: string
  email?: string
  staff_members?: unknown[]
}

/** API response shape for campuses endpoint */
interface CampusesApiResponse {
  docs?: ApiCampus[]
}

const mockSedesData: Sede[] = [
  {
    id: 'cep-norte',
    nombre: 'CEP Norte',
    direccion: 'Calle Principal 123, 38001 Santa Cruz de Tenerife',
    telefono: '+34 922 123 456',
    email: 'cep.norte@cepcomunicacion.com',
    horario: 'Lunes a Viernes 08:00 - 21:00',
    aulas: 8,
    capacidad: 180,
    cursosActivos: 15,
    profesores: 12,
    color: 'bg-primary',
    borderColor: 'border-primary',
    imagen: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
  },
  {
    id: 'cep-santa-cruz',
    nombre: 'CEP Santa Cruz',
    direccion: 'Avenida Central 456, 38003 Santa Cruz de Tenerife',
    telefono: '+34 922 234 567',
    email: 'cep.santacruz@cepcomunicacion.com',
    horario: 'Lunes a Viernes 08:30 - 20:30',
    aulas: 6,
    capacidad: 140,
    cursosActivos: 12,
    profesores: 10,
    color: 'bg-primary',
    borderColor: 'border-primary',
    imagen: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=400&fit=crop',
  },
  {
    id: 'cep-sur',
    nombre: 'CEP Sur',
    direccion: 'Calle del Sur 789, 38007 Santa Cruz de Tenerife',
    telefono: '+34 922 345 678',
    email: 'cep.sur@cepcomunicacion.com',
    horario: 'Lunes a Viernes 09:00 - 21:00',
    aulas: 5,
    capacidad: 120,
    cursosActivos: 10,
    profesores: 8,
    color: 'bg-primary',
    borderColor: 'border-primary',
    imagen: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop',
  },
]

export default function SedesPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('sedes')
  const [sedes, setSedes] = useState<Sede[]>(mockSedesData)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/campuses?limit=100&sort=createdAt', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar las sedes')
        }

        const payload = (await response.json()) as CampusesApiResponse
        const docs: ApiCampus[] = Array.isArray(payload.docs) ? payload.docs : []
        const mapped: Sede[] = docs.map((campus: ApiCampus) => {
          const addressParts = [campus.address, campus.postal_code, campus.city].filter(Boolean)
          return {
            id: campus.id,
            nombre: campus.name ?? 'Sede',
            direccion: addressParts.join(', ') || 'Dirección pendiente',
            telefono: campus.phone ?? '—',
            email: campus.email ?? '—',
            horario: 'Lunes a Viernes 08:00 - 20:00',
            aulas: 0,
            capacidad: 0,
            cursosActivos: 0,
            profesores: Array.isArray(campus.staff_members) ? campus.staff_members.length : 0,
            color: 'bg-primary',
            borderColor: 'border-primary',
            imagen:
              'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop',
          }
        })

        if (mapped.length > 0) {
          setSedes(mapped)
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar sedes')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCampuses()
  }, [])

  const handleViewSede = (sedeId: string) => {
    router.push(`/sedes/${sedeId}`)
  }

  const handleAdd = () => {
    console.log('Crear nueva sede')
  }

  return (
    <div className="space-y-6 rounded-lg bg-muted/30 p-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando sedes...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Sedes"
        description="Gestiona centros, contacto y capacidad operativa en una sola vista."
        icon={MapPin}
        badge={<Badge variant="secondary">{sedes.length} centros</Badge>}
        actions={<Button onClick={handleAdd}>Nueva Sede</Button>}
        filters={
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Vista simplificada para operación diaria.</p>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        }
      />

      {view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sedes.map((sede) => (
            <Card
              key={sede.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleViewSede(sede.id)}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <img src={sede.imagen} alt={sede.nombre} className="h-12 w-12 rounded-md object-cover" />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{sede.nombre}</h3>
                    <p className="truncate text-sm text-muted-foreground">{sede.direccion}</p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{sede.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{sede.email}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Badge variant="outline" className="gap-1">
                    <DoorOpen className="h-3.5 w-3.5" />
                    {sede.aulas} aulas
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {sede.capacidad} capacidad
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {sede.cursosActivos} cursos
                  </Badge>
                </div>

                <Button
                  className="w-full"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    handleViewSede(sede.id)
                  }}
                >
                  Ver sede
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sedes.map((sede) => (
            <SedeListItem key={sede.id} sede={sede} onClick={() => handleViewSede(sede.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
