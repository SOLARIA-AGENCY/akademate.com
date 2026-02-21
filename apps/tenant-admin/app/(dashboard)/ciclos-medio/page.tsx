'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Search, GraduationCap, Calendar, Clock } from 'lucide-react'

/** Represents a Ciclo Formativo de Grado Medio */
interface CicloMedio {
  id: string
  nombre: string
  codigo: string
  familia: string
  duracion: string
  modalidad: string
  plazas: number
  plazas_ocupadas: number
  cursos_activos: number
  nivel: string
  imagen: string
  descripcion: string
  competencias: string[]
  salidas_profesionales: string[]
  requisitos: string
  active: boolean
}

/** API response structure for a cycle */
interface ApiCycle {
  id: string | number
  name?: string
  slug?: string
  description?: string
  level?: string
}

/** API payload response structure */
interface ApiPayload {
  docs?: ApiCycle[]
}

// Datos de Ciclos Formativos de Grado Medio
const mockCiclosMedioData: CicloMedio[] = [
  {
    id: 'cfgm-gestion-administrativa',
    nombre: 'Gestión Administrativa',
    codigo: 'ADG201',
    familia: 'Administración y Gestión',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 30,
    plazas_ocupadas: 28,
    cursos_activos: 3,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    descripcion:
      'Formar profesionales capacitados para realizar tareas administrativas y de gestión básica en empresas públicas y privadas.',
    competencias: [
      'Gestión de documentación empresarial',
      'Atención al cliente',
      'Comunicación empresarial',
      'Operaciones de venta',
      'Operaciones auxiliares de tesorería',
    ],
    salidas_profesionales: [
      'Auxiliar Administrativo',
      'Auxiliar de oficina',
      'Auxiliar de archivo',
      'Recepcionista',
      'Telefonista',
    ],
    requisitos: 'ESO, FP Básica, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgm-sistemas-microinformaticos',
    nombre: 'Sistemas Microinformáticos y Redes',
    codigo: 'IFC301',
    familia: 'Informática y Comunicaciones',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 25,
    plazas_ocupadas: 25,
    cursos_activos: 2,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
    descripcion:
      'Formar técnicos capaces de instalar, configurar y mantener sistemas microinformáticos y redes locales.',
    competencias: [
      'Montaje y mantenimiento de equipos informáticos',
      'Instalación de sistemas operativos',
      'Configuración de redes locales',
      'Administración de sistemas',
      'Seguridad informática básica',
    ],
    salidas_profesionales: [
      'Técnico informático de soporte',
      'Técnico de redes',
      'Técnico de microinformática',
      'Técnico de sistemas',
    ],
    requisitos: 'ESO, FP Básica, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgm-actividades-comerciales',
    nombre: 'Actividades Comerciales',
    codigo: 'COM101',
    familia: 'Comercio y Marketing',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 25,
    plazas_ocupadas: 20,
    cursos_activos: 2,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    descripcion:
      'Capacitar para desarrollar actividades de venta, administración y gestión de un pequeño establecimiento comercial.',
    competencias: [
      'Técnicas de venta y atención al cliente',
      'Gestión de stock',
      'Animación del punto de venta',
      'Marketing comercial',
      'Escaparatismo y visual merchandising',
    ],
    salidas_profesionales: [
      'Dependiente de comercio',
      'Vendedor técnico',
      'Promotor de ventas',
      'Operador de contact center',
      'Teleoperador',
    ],
    requisitos: 'ESO, FP Básica, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgm-gestion-alojamientos-turisticos',
    nombre: 'Gestión de Alojamientos Turísticos',
    codigo: 'HOT201',
    familia: 'Hostelería y Turismo',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 20,
    plazas_ocupadas: 18,
    cursos_activos: 2,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
    descripcion:
      'Formar profesionales para la gestión de empresas de alojamiento turístico y servicios de recepción.',
    competencias: [
      'Gestión de reservas',
      'Atención al cliente en hoteles',
      'Organización del housekeeping',
      'Facturación y cobros',
      'Protocolo y comunicación',
    ],
    salidas_profesionales: [
      'Recepcionista de hotel',
      'Jefe de reservas',
      'Coordinador de housekeeping',
      'Gobernante/a',
      'Revenue manager junior',
    ],
    requisitos: 'ESO, FP Básica, Prueba de acceso',
    active: true,
  },
]

export default function CiclosMedioPage() {
  const router = useRouter()
  const [ciclosData, setCiclosData] = useState(mockCiclosMedioData)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterFamilia, setFilterFamilia] = useState('all')
  const [filterModalidad, setFilterModalidad] = useState('all')

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/cycles?limit=100&sort=order_display', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar los ciclos')
        }

        const payload = (await response.json()) as ApiPayload
        const docs: ApiCycle[] = Array.isArray(payload.docs) ? payload.docs : []
        const mapped: CicloMedio[] = docs
          .filter((cycle: ApiCycle) => cycle.level === 'grado_medio')
          .map((cycle: ApiCycle) => ({
            id: String(cycle.id),
            nombre: cycle.name ?? 'Ciclo sin nombre',
            codigo: cycle.slug ?? String(cycle.id),
            familia: 'Formación Profesional',
            duracion: '2000 horas (2 años)',
            modalidad: 'Presencial',
            plazas: 0,
            plazas_ocupadas: 0,
            cursos_activos: 0,
            nivel: 'Grado Medio',
            imagen:
              'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
            descripcion: cycle.description ?? '',
            competencias: [],
            salidas_profesionales: [],
            requisitos: '',
            active: true,
          }))

        if (mapped.length > 0) {
          setCiclosData(mapped)
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar ciclos')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCycles()
  }, [])

  const handleAdd = () => {
    console.log('Crear nuevo ciclo medio')
  }

  const handleViewCiclo = (cicloId: string) => {
    router.push(`/ciclos-medio/${cicloId}`)
  }

  // Extraer familias únicas
  const familias = Array.from(new Set(ciclosData.map((c) => c.familia)))

  const filteredCiclos = ciclosData.filter((ciclo) => {
    const matchesSearch =
      ciclo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.familia.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFamilia = filterFamilia === 'all' || ciclo.familia === filterFamilia
    const matchesModalidad = filterModalidad === 'all' || ciclo.modalidad === filterModalidad

    return matchesSearch && matchesFamilia && matchesModalidad
  })

  const stats = {
    total: ciclosData.length,
    totalPlazas: ciclosData.reduce((sum, c) => sum + c.plazas, 0),
    plazasOcupadas: ciclosData.reduce((sum, c) => sum + c.plazas_ocupadas, 0),
    cursosActivos: ciclosData.reduce((sum, c) => sum + c.cursos_activos, 0),
  }

  const tasaOcupacion =
    stats.totalPlazas > 0
      ? ((stats.plazasOcupadas / stats.totalPlazas) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-6 rounded-lg bg-muted/30 p-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando ciclos...
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}
      <PageHeader
        title="Ciclos Formativos de Grado Medio"
        description="Gestión compacta de ciclos, plazas y modalidades."
        icon={GraduationCap}
        badge={<Badge variant="secondary">{filteredCiclos.length} visibles</Badge>}
        actions={(
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ciclo
          </Button>
        )}
        filters={(
          <div className="flex w-full flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline">{stats.total} ciclos</Badge>
            <Badge variant="outline">{stats.totalPlazas} plazas</Badge>
            <Badge variant="outline">{stats.plazasOcupadas} ocupadas</Badge>
            <Badge variant="outline">Ocupación {tasaOcupacion}%</Badge>
            <Badge variant="outline">{stats.cursosActivos} cursos activos</Badge>
          </div>
        )}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o familia..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
              />
            </div>

            <Select value={filterFamilia} onValueChange={setFilterFamilia}>
              <SelectTrigger className="w-full min-w-[190px] md:w-[220px]">
                <SelectValue placeholder="Familia Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las familias</SelectItem>
                {familias.map((familia) => (
                  <SelectItem key={familia} value={familia}>
                    {familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterModalidad} onValueChange={setFilterModalidad}>
              <SelectTrigger className="w-full min-w-[180px] md:w-[210px]">
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las modalidades</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || filterFamilia !== 'all' || filterModalidad !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterFamilia('all')
                  setFilterModalidad('all')
                }}
                className="xl:ml-auto"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCiclos.map((ciclo) => {
          const ocupacionPorcentaje =
            ciclo.plazas > 0 ? ((ciclo.plazas_ocupadas / ciclo.plazas) * 100).toFixed(0) : '0'

          return (
            <Card
              key={ciclo.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleViewCiclo(ciclo.id)}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold" title={ciclo.nombre}>
                      {ciclo.nombre}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{ciclo.codigo}</p>
                  </div>
                  <Badge variant="secondary">{ciclo.nivel}</Badge>
                </div>

                <Badge variant="outline" className="w-fit">
                  {ciclo.familia}
                </Badge>

                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {ciclo.descripcion || 'Sin descripción disponible.'}
                </p>

                <div className="grid grid-cols-2 gap-2 border-t pt-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ciclo.duracion}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {ciclo.cursos_activos} {ciclo.cursos_activos === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-sm text-muted-foreground">Ocupación:</span>
                    <span className="font-semibold">
                      {ciclo.plazas_ocupadas}/{ciclo.plazas} plazas
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${ocupacionPorcentaje}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-muted-foreground">{ocupacionPorcentaje}% ocupado</p>
                </div>

                <Button
                  className="w-full"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    handleViewCiclo(ciclo.id)
                  }}
                >
                  Ver Ciclo
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCiclos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron ciclos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
