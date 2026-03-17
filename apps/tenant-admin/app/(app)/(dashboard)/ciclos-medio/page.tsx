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
  const [ciclosData, setCiclosData] = useState<CicloMedio[]>([])
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
    stats.totalPlazas > 0 ? ((stats.plazasOcupadas / stats.totalPlazas) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6 rounded-lg bg-muted/30 p-6" data-oid=":ribgw5">
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="29bvmwy"
        >
          Cargando ciclos...
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="k4voiab"
        >
          {errorMessage}
        </div>
      )}
      <PageHeader
        title="Ciclos Formativos de Grado Medio"
        description="Gestión compacta de ciclos, plazas y modalidades."
        icon={GraduationCap}
        badge={
          <Badge variant="secondary" data-oid="v3pqq8e">
            {filteredCiclos.length} visibles
          </Badge>
        }
        actions={
          <Button onClick={handleAdd} data-oid="9tt8pjd">
            <Plus className="mr-2 h-4 w-4" data-oid="it4ei3l" />
            Nuevo Ciclo
          </Button>
        }
        filters={
          <div className="flex w-full flex-wrap items-center gap-2 text-sm" data-oid="q:8hoxo">
            <Badge variant="outline" data-oid="amtzd6p">
              {stats.total} ciclos
            </Badge>
            <Badge variant="outline" data-oid="1z:s02i">
              {stats.totalPlazas} plazas
            </Badge>
            <Badge variant="outline" data-oid="gbr6p0o">
              {stats.plazasOcupadas} ocupadas
            </Badge>
            <Badge variant="outline" data-oid="5usnhog">
              Ocupación {tasaOcupacion}%
            </Badge>
            <Badge variant="outline" data-oid="94bnau7">
              {stats.cursosActivos} cursos activos
            </Badge>
          </div>
        }
        data-oid="8w3yhk:"
      />

      <Card data-oid="y:jjkmt">
        <CardContent className="pt-6" data-oid="ermbj.a">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap" data-oid="ounfs:m">
            <div className="relative min-w-[260px] flex-1" data-oid="gua25gd">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                data-oid="meye_5z"
              />
              <Input
                placeholder="Buscar por nombre, código o familia..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
                data-oid="wgzy7rm"
              />
            </div>

            <Select value={filterFamilia} onValueChange={setFilterFamilia} data-oid="jwbwnlw">
              <SelectTrigger className="w-full min-w-[190px] md:w-[220px]" data-oid="q97f8i0">
                <SelectValue placeholder="Familia Profesional" data-oid="oqy0efk" />
              </SelectTrigger>
              <SelectContent data-oid="6q:96nb">
                <SelectItem value="all" data-oid="i-:szs6">
                  Todas las familias
                </SelectItem>
                {familias.map((familia) => (
                  <SelectItem key={familia} value={familia} data-oid="4hqobgp">
                    {familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterModalidad} onValueChange={setFilterModalidad} data-oid="_soymj1">
              <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="k6yg.8z">
                <SelectValue placeholder="Modalidad" data-oid="t37lk5u" />
              </SelectTrigger>
              <SelectContent data-oid=":8wwiq2">
                <SelectItem value="all" data-oid="9bzcb4w">
                  Todas las modalidades
                </SelectItem>
                <SelectItem value="Presencial" data-oid="gebu3:-">
                  Presencial
                </SelectItem>
                <SelectItem value="Semipresencial" data-oid="lx2zn08">
                  Semipresencial
                </SelectItem>
                <SelectItem value="Online" data-oid="rt1n2p5">
                  Online
                </SelectItem>
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
                data-oid="vj5ttm-"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-oid=".mgu4_v">
        {filteredCiclos.map((ciclo) => {
          const ocupacionPorcentaje =
            ciclo.plazas > 0 ? ((ciclo.plazas_ocupadas / ciclo.plazas) * 100).toFixed(0) : '0'

          return (
            <Card
              key={ciclo.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => handleViewCiclo(ciclo.id)}
              data-oid="3jw-ldo"
            >
              <CardContent className="space-y-4 p-5" data-oid="v855os2">
                <div className="flex items-start justify-between gap-3" data-oid="oayl92d">
                  <div className="min-w-0" data-oid="0d3zf89">
                    <h3
                      className="line-clamp-2 text-base font-semibold"
                      title={ciclo.nombre}
                      data-oid="jr-4cnc"
                    >
                      {ciclo.nombre}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground" data-oid="fitity9">
                      {ciclo.codigo}
                    </p>
                  </div>
                  <Badge variant="secondary" data-oid="phnjh66">
                    {ciclo.nivel}
                  </Badge>
                </div>

                <Badge variant="outline" className="w-fit" data-oid="ykh8-.b">
                  {ciclo.familia}
                </Badge>

                <p className="line-clamp-2 text-sm text-muted-foreground" data-oid="t4vz03k">
                  {ciclo.descripcion || 'Sin descripción disponible.'}
                </p>

                <div className="grid grid-cols-2 gap-2 border-t pt-3 text-sm" data-oid="th7fgak">
                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="6bogp4_">
                    <Clock className="h-4 w-4 shrink-0" data-oid="0c4hcj8" />
                    <span className="truncate" data-oid="0d.3:e5">
                      {ciclo.duracion}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground" data-oid="_t-h8kl">
                    <Calendar className="h-4 w-4 shrink-0" data-oid="uka2a.t" />
                    <span className="truncate" data-oid="8es9x15">
                      {ciclo.cursos_activos} {ciclo.cursos_activos === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3" data-oid="vs2ou:n">
                  <div
                    className="mb-2 flex items-center justify-between text-sm"
                    data-oid="sbu2ktu"
                  >
                    <span className="text-sm text-muted-foreground" data-oid="d6nr5pk">
                      Ocupación:
                    </span>
                    <span className="font-semibold" data-oid="a_u1vkh">
                      {ciclo.plazas_ocupadas}/{ciclo.plazas} plazas
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-secondary"
                    data-oid="86vih8w"
                  >
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${ocupacionPorcentaje}%` }}
                      data-oid="z3z_ng1"
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-muted-foreground" data-oid=".xky_lh">
                    {ocupacionPorcentaje}% ocupado
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    handleViewCiclo(ciclo.id)
                  }}
                  data-oid="2oj18ua"
                >
                  Ver Ciclo
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCiclos.length === 0 && (
        <Card data-oid="wldn0hu">
          <CardContent className="py-12 text-center" data-oid="6ltlj_0">
            <p className="text-muted-foreground" data-oid="wdo7m0m">
              No se encontraron ciclos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
