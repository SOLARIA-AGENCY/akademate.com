'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Search, GraduationCap, Calendar, Clock } from 'lucide-react'

// TypeScript interfaces
interface CicloSuperior {
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

interface CycleApiItem {
  id: string | number
  name?: string
  slug?: string
  level?: string
  description?: string
}

interface CyclesApiResponse {
  docs?: CycleApiItem[]
}

// Datos de Ciclos Formativos de Grado Superior
const mockCiclosSuperiorData: CicloSuperior[] = [
  {
    id: 'cfgs-desarrollo-aplicaciones-web',
    nombre: 'Desarrollo de Aplicaciones Web',
    codigo: 'IFC303',
    familia: 'Informática y Comunicaciones',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 30,
    plazas_ocupadas: 30,
    cursos_activos: 3,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
    descripcion:
      'Formar especialistas en desarrollo de aplicaciones web dinámicas con tecnologías frontend y backend modernas.',
    competencias: [
      'Desarrollo frontend (HTML, CSS, JavaScript, React)',
      'Desarrollo backend (Node.js, PHP, Python)',
      'Bases de datos relacionales y NoSQL',
      'APIs RESTful y GraphQL',
      'Despliegue y DevOps',
    ],
    salidas_profesionales: [
      'Desarrollador Web Full Stack',
      'Desarrollador Frontend',
      'Desarrollador Backend',
      'Desarrollador de APIs',
      'DevOps Engineer',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgs-administracion-finanzas',
    nombre: 'Administración y Finanzas',
    codigo: 'ADG202',
    familia: 'Administración y Gestión',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 30,
    plazas_ocupadas: 27,
    cursos_activos: 3,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1554224311-beee0c7c4a98?w=800&h=400&fit=crop',
    descripcion:
      'Capacitar para organizar y ejecutar las operaciones de gestión y administración en el ámbito financiero y contable.',
    competencias: [
      'Gestión contable y financiera',
      'Gestión fiscal',
      'Gestión de recursos humanos',
      'Gestión de logística comercial',
      'Gestión de tesorería',
    ],
    salidas_profesionales: [
      'Administrativo de finanzas',
      'Contable',
      'Gestor de nóminas',
      'Controller financiero',
      'Tesorero',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgs-marketing-publicidad',
    nombre: 'Marketing y Publicidad',
    codigo: 'COM301',
    familia: 'Comercio y Marketing',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 25,
    plazas_ocupadas: 24,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=400&fit=crop',
    descripcion:
      'Formar técnicos especializados en planificación y ejecución de estrategias de marketing digital y publicidad.',
    competencias: [
      'Investigación de mercados',
      'Planificación de campañas publicitarias',
      'Marketing digital y redes sociales',
      'Diseño gráfico publicitario',
      'Gestión de eventos y promociones',
    ],
    salidas_profesionales: [
      'Técnico de marketing',
      'Especialista en marketing digital',
      'Community Manager',
      'Gestor de campañas publicitarias',
      'Coordinador de eventos',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgs-diseno-produccion-editorial',
    nombre: 'Diseño y Edición de Publicaciones Impresas y Multimedia',
    codigo: 'IMP501',
    familia: 'Artes Gráficas',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 20,
    plazas_ocupadas: 18,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=400&fit=crop',
    descripcion:
      'Capacitar en diseño y producción de publicaciones impresas y digitales con software profesional de la industria.',
    competencias: [
      'Diseño editorial y maquetación',
      'Ilustración digital',
      'Tipografía y composición',
      'Producción de publicaciones digitales',
      'Gestión de color y preimpresión',
    ],
    salidas_profesionales: [
      'Diseñador editorial',
      'Maquetador',
      'Ilustrador digital',
      'Diseñador de publicaciones digitales',
      'Especialista en preimpresión',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgs-guia-turismo',
    nombre: 'Guía, Información y Asistencias Turísticas',
    codigo: 'HOT401',
    familia: 'Hostelería y Turismo',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 25,
    plazas_ocupadas: 22,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1504150558240-0b4fd8946624?w=800&h=400&fit=crop',
    descripcion:
      'Formar guías turísticos profesionales capaces de planificar y gestionar servicios de información turística.',
    competencias: [
      'Planificación de rutas turísticas',
      'Interpretación del patrimonio',
      'Idiomas (inglés, alemán, francés)',
      'Gestión de servicios turísticos',
      'Marketing turístico',
    ],
    salidas_profesionales: [
      'Guía turístico',
      'Informador turístico',
      'Técnico de oficina de información turística',
      'Coordinador de eventos turísticos',
      'Gestor de patrimonio cultural',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
  {
    id: 'cfgs-produccion-audiovisual',
    nombre: 'Producción de Audiovisuales y Espectáculos',
    codigo: 'IMS301',
    familia: 'Imagen y Sonido',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 20,
    plazas_ocupadas: 20,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    descripcion:
      'Especializar en producción de proyectos audiovisuales y organización de espectáculos en vivo.',
    competencias: [
      'Planificación de producciones audiovisuales',
      'Gestión de equipos de rodaje',
      'Postproducción de audio y vídeo',
      'Organización de eventos en vivo',
      'Gestión de presupuestos de producción',
    ],
    salidas_profesionales: [
      'Productor audiovisual',
      'Asistente de producción',
      'Organizador de eventos',
      'Gestor de producción de espectáculos',
      'Coordinador técnico',
    ],
    requisitos: 'Bachillerato, CFGM, Prueba de acceso',
    active: true,
  },
]

export default function CiclosSuperiorPage() {
  const router = useRouter()
  const [ciclosData, setCiclosData] = useState(mockCiclosSuperiorData)
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

        const payload = (await response.json()) as CyclesApiResponse
        const docs: CycleApiItem[] = Array.isArray(payload.docs) ? payload.docs : []
        const mapped: CicloSuperior[] = docs
          .filter((cycle: CycleApiItem) => cycle.level === 'grado_superior')
          .map((cycle: CycleApiItem) => ({
            id: String(cycle.id),
            nombre: cycle.name ?? 'Ciclo sin nombre',
            codigo: cycle.slug ?? String(cycle.id),
            familia: 'Formación Profesional',
            duracion: '2000 horas (2 años)',
            modalidad: 'Presencial',
            plazas: 0,
            plazas_ocupadas: 0,
            cursos_activos: 0,
            nivel: 'Grado Superior',
            imagen:
              'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
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
    console.log('Crear nuevo ciclo superior')
  }

  const handleViewCiclo = (cicloId: string) => {
    router.push(`/ciclos-superior/${cicloId}`)
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
        title="Ciclos Formativos de Grado Superior"
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
