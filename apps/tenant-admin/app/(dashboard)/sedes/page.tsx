'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { MapPin, DoorOpen, Users, BookOpen, Phone, Mail, Clock } from 'lucide-react'
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
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
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
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
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
    color: 'bg-[#ff2014]',
    borderColor: 'border-[#ff2014]',
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
            color: 'bg-[#ff2014]',
            borderColor: 'border-[#ff2014]',
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

  const totalStats = {
    aulas: sedes.reduce((sum, s) => sum + s.aulas, 0),
    capacidad: sedes.reduce((sum, s) => sum + s.capacidad, 0),
    cursosActivos: sedes.reduce((sum, s) => sum + s.cursosActivos, 0),
    profesores: sedes.reduce((sum, s) => sum + s.profesores, 0),
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando sedes...
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Sedes"
        description={`${sedes.length} centros educativos`}
        icon={MapPin}
        showAddButton
        addButtonText="Nueva Sede"
        onAdd={handleAdd}
        filters={
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              {sedes.length} {sedes.length === 1 ? 'sede' : 'sedes'}
            </p>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        }
      />

      {/* Global Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aulas</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.aulas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.capacidad}</div>
            <p className="text-xs text-muted-foreground">estudiantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.cursosActivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.profesores}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sedes Grid o Lista */}
      {view === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sedes.map((sede) => (
            <Card
              key={sede.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${sede.borderColor}`}
              onClick={() => handleViewSede(sede.id)}
            >
            {/* Sede Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={sede.imagen}
                alt={sede.nombre}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <Badge className={`${sede.color} text-white text-xs font-bold uppercase`}>
                  {sede.nombre}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Title - Fixed height */}
              <div className="min-h-[4.5rem]">
                <h3 className="font-bold text-xl mb-1 line-clamp-1">{sede.nombre}</h3>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug line-clamp-2 min-h-[2.5rem]">{sede.direccion}</span>
                </div>
              </div>

              {/* Contact Info - Fixed height container */}
              <div className="space-y-2 text-sm min-h-[5.5rem]">
                <div className="flex items-center gap-2 text-muted-foreground h-6">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{sede.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground h-6">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{sede.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground h-6">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs truncate">{sede.horario}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="text-center p-2 bg-secondary rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{sede.aulas}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Aulas</p>
                </div>

                <div className="text-center p-2 bg-secondary rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{sede.capacidad}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Capacidad</p>
                </div>

                <div className="text-center p-2 bg-secondary rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{sede.cursosActivos}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cursos</p>
                </div>

                <div className="text-center p-2 bg-secondary rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-lg">{sede.profesores}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Profesores</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button
                className={`w-full ${sede.color} hover:opacity-90 text-white font-bold uppercase tracking-wide`}
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation()
                  handleViewSede(sede.id)
                }}
              >
                Ver Sede
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sedes.map((sede) => (
            <SedeListItem
              key={sede.id}
              sede={sede}
              onClick={() => handleViewSede(sede.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
