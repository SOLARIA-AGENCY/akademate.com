'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
  Search,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  MapPin,
  Award,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { CicloListItem } from '@payload-config/components/ui/CicloListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'

interface Ciclo {
  id: string
  nombre: string
  codigo: string
  familia: string
  duracion: string
  modalidad: string
  plazas: number
  plazas_ocupadas: number
  cursos_activos: number
  nivel: 'Grado Medio' | 'Grado Superior'
  imagen: string
  competencias: string[]
  salidas_profesionales: string[]
  requisitos: string
}

const todosLosCiclosData: Ciclo[] = [
  // GRADO MEDIO
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
    competencias: [
      'Tramitar documentos y comunicaciones internas o externas',
      'Gestionar archivos físicos y digitales',
      'Realizar operaciones básicas de tesorería',
      'Utilizar aplicaciones informáticas de gestión',
    ],
    salidas_profesionales: [
      'Administrativo/a de oficina',
      'Auxiliar administrativo/a',
      'Recepcionista',
      'Empleado/a de atención al cliente',
    ],
    requisitos: 'Título de Graduado en ESO o equivalente',
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
    competencias: [
      'Instalar y configurar sistemas operativos',
      'Montar y configurar equipos microinformáticos',
      'Administrar redes locales',
      'Proporcionar soporte técnico',
    ],
    salidas_profesionales: [
      'Técnico/a de soporte informático',
      'Reparador/a de equipos informáticos',
      'Instalador/a de redes',
      'Operador/a de teleasistencia',
    ],
    requisitos: 'Título de Graduado en ESO o equivalente',
  },
  {
    id: 'cfgm-actividades-comerciales',
    nombre: 'Actividades Comerciales',
    codigo: 'COM101',
    familia: 'Comercio y Marketing',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 28,
    plazas_ocupadas: 22,
    cursos_activos: 2,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=400&fit=crop',
    competencias: [
      'Realizar operaciones de venta',
      'Gestionar stocks e inventarios',
      'Animar el punto de venta',
      'Realizar merchandising',
    ],
    salidas_profesionales: [
      'Dependiente/a de comercio',
      'Vendedor/a técnico/a',
      'Teleoperador/a',
      'Promotor/a de ventas',
    ],
    requisitos: 'Título de Graduado en ESO o equivalente',
  },
  {
    id: 'cfgm-gestion-alojamientos',
    nombre: 'Gestión de Alojamientos Turísticos',
    codigo: 'HOT201',
    familia: 'Hostelería y Turismo',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 24,
    plazas_ocupadas: 20,
    cursos_activos: 2,
    nivel: 'Grado Medio',
    imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=400&fit=crop',
    competencias: [
      'Gestionar reservas y atención al cliente',
      'Organizar servicios de recepción',
      'Coordinar servicios de pisos',
      'Controlar facturación',
    ],
    salidas_profesionales: [
      'Recepcionista de hotel',
      'Coordinador/a de alojamiento',
      'Jefe/a de reservas',
      'Gobernante/a',
    ],
    requisitos: 'Título de Graduado en ESO o equivalente',
  },
  // GRADO SUPERIOR
  {
    id: 'cfgs-desarrollo-aplicaciones-web',
    nombre: 'Desarrollo de Aplicaciones Web',
    codigo: 'IFC303',
    familia: 'Informática y Comunicaciones',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 30,
    plazas_ocupadas: 30,
    cursos_activos: 4,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    competencias: [
      'Desarrollar aplicaciones web full-stack',
      'Gestionar bases de datos relacionales y no relacionales',
      'Implementar APIs REST y GraphQL',
      'Desplegar aplicaciones en la nube',
      'Aplicar patrones de diseño y arquitecturas modernas',
    ],
    salidas_profesionales: [
      'Desarrollador/a web full-stack',
      'Programador/a frontend/backend',
      'Desarrollador/a de aplicaciones móviles',
      'Consultor/a técnico/a',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
  {
    id: 'cfgs-administracion-finanzas',
    nombre: 'Administración y Finanzas',
    codigo: 'ADG202',
    familia: 'Administración y Gestión',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 32,
    plazas_ocupadas: 29,
    cursos_activos: 3,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    competencias: [
      'Gestionar la tesorería y operaciones financieras',
      'Elaborar estados contables e informes financieros',
      'Gestionar recursos humanos',
      'Realizar auditorías internas',
      'Asesorar fiscalmente',
    ],
    salidas_profesionales: [
      'Administrativo/a financiero/a',
      'Contable',
      'Técnico/a en recursos humanos',
      'Asesor/a fiscal',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
  {
    id: 'cfgs-marketing-publicidad',
    nombre: 'Marketing y Publicidad',
    codigo: 'COM301',
    familia: 'Comercio y Marketing',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 28,
    plazas_ocupadas: 26,
    cursos_activos: 3,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=400&fit=crop',
    competencias: [
      'Elaborar planes de marketing estratégico',
      'Diseñar campañas publicitarias multicanal',
      'Gestionar marketing digital y redes sociales',
      'Realizar análisis de mercado',
      'Coordinar acciones promocionales',
    ],
    salidas_profesionales: [
      'Técnico/a de marketing',
      'Community manager',
      'Responsable de publicidad',
      'Analista de mercado',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
  {
    id: 'cfgs-diseno-edicion',
    nombre: 'Diseño y Edición de Publicaciones',
    codigo: 'IMP501',
    familia: 'Imagen y Sonido',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 20,
    plazas_ocupadas: 18,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    competencias: [
      'Diseñar publicaciones digitales e impresas',
      'Maquetar libros, revistas y catálogos',
      'Gestionar flujos de producción editorial',
      'Desarrollar identidad visual corporativa',
      'Producir contenido multimedia',
    ],
    salidas_profesionales: [
      'Diseñador/a gráfico/a editorial',
      'Maquetador/a',
      'Diseñador/a de UX/UI',
      'Productor/a gráfico/a',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
  {
    id: 'cfgs-guia-turistica',
    nombre: 'Guía, Información y Asistencias Turísticas',
    codigo: 'HOT401',
    familia: 'Hostelería y Turismo',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 25,
    plazas_ocupadas: 21,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop',
    competencias: [
      'Diseñar y operar itinerarios turísticos',
      'Gestionar servicios de información turística',
      'Coordinar grupos de viajeros',
      'Aplicar protocolo y relaciones públicas',
      'Comunicar en idiomas extranjeros',
    ],
    salidas_profesionales: [
      'Guía turístico/a',
      'Informador/a turístico/a',
      'Jefe/a de oficina de turismo',
      'Transfer',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
  {
    id: 'cfgs-produccion-audiovisuales',
    nombre: 'Producción de Audiovisuales y Espectáculos',
    codigo: 'IMS301',
    familia: 'Imagen y Sonido',
    duracion: '2000 horas (2 años)',
    modalidad: 'Presencial',
    plazas: 22,
    plazas_ocupadas: 20,
    cursos_activos: 2,
    nivel: 'Grado Superior',
    imagen: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=400&fit=crop',
    competencias: [
      'Planificar y gestionar producciones audiovisuales',
      'Coordinar equipos técnicos y artísticos',
      'Gestionar presupuestos y recursos',
      'Supervisar post-producción',
      'Comercializar productos audiovisuales',
    ],
    salidas_profesionales: [
      'Productor/a audiovisual',
      'Ayudante de producción',
      'Coordinador/a de eventos',
      'Gestor/a de proyectos multimedia',
    ],
    requisitos: 'Bachillerato, Título de Técnico o equivalente',
  },
]

export default function TodosLosCiclosPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('ciclos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [nivelFilter, setNivelFilter] = React.useState<string>('todos')
  const [familiaFilter, setFamiliaFilter] = React.useState<string>('todas')
  const [modalidadFilter, setModalidadFilter] = React.useState<string>('todas')

  // Calculate stats
  const totalCiclos = todosLosCiclosData.length
  const ciclosMedio = todosLosCiclosData.filter((c) => c.nivel === 'Grado Medio').length
  const ciclosSuperior = todosLosCiclosData.filter((c) => c.nivel === 'Grado Superior').length
  const totalPlazas = todosLosCiclosData.reduce((sum, c) => sum + c.plazas, 0)
  const totalOcupadas = todosLosCiclosData.reduce((sum, c) => sum + c.plazas_ocupadas, 0)
  const totalCursosActivos = todosLosCiclosData.reduce((sum, c) => sum + c.cursos_activos, 0)
  const ocupacionPromedio = Math.round((totalOcupadas / totalPlazas) * 100)

  // Get unique familias
  const familiasProfesionales = Array.from(new Set(todosLosCiclosData.map((c) => c.familia)))

  // Filter ciclos
  const filteredCiclos = todosLosCiclosData.filter((ciclo) => {
    const matchesSearch =
      searchTerm === '' ||
      ciclo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.familia.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesNivel = nivelFilter === 'todos' || ciclo.nivel === nivelFilter

    const matchesFamilia = familiaFilter === 'todas' || ciclo.familia === familiaFilter

    const matchesModalidad = modalidadFilter === 'todas' || ciclo.modalidad === modalidadFilter

    return matchesSearch && matchesNivel && matchesFamilia && matchesModalidad
  })

  const handleViewCiclo = (ciclo: Ciclo) => {
    if (ciclo.nivel === 'Grado Medio') {
      router.push(`/ciclos-medio#${ciclo.id}`)
    } else {
      router.push(`/ciclos-superior#${ciclo.id}`)
    }
  }

  return (
    <div className="space-y-8 p-8">
      {/* Mock Data Banner */}
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente conexión con API de Ciclos Formativos."
      />

      {/* Header */}
      <PageHeader
        title="Ciclos Formativos"
        description="Gestión completa de ciclos de Grado Medio y Grado Superior"
        icon={GraduationCap}
        showAddButton
        addButtonText="Nuevo Ciclo"
        onAdd={() => router.push('/ciclos/nuevo')}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ff2014]/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-[#ff2014]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ciclos</p>
              <p className="text-2xl font-bold">{totalCiclos}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Award className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grado Medio</p>
              <p className="text-2xl font-bold">{ciclosMedio}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Award className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grado Superior</p>
              <p className="text-2xl font-bold">{ciclosSuperior}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Plazas</p>
              <p className="text-2xl font-bold">{totalPlazas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ocupación</p>
              <p className="text-2xl font-bold">{ocupacionPromedio}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cursos Activos</p>
              <p className="text-2xl font-bold">{totalCursosActivos}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ciclos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={nivelFilter} onValueChange={setNivelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="Grado Medio">Grado Medio</SelectItem>
                <SelectItem value="Grado Superior">Grado Superior</SelectItem>
              </SelectContent>
            </Select>

            <Select value={familiaFilter} onValueChange={setFamiliaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las familias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las familias</SelectItem>
                {familiasProfesionales.map((familia) => (
                  <SelectItem key={familia} value={familia}>
                    {familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidadFilter} onValueChange={setModalidadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las modalidades</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                <SelectItem value="Telemático">Telemático</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="hidden lg:block">
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredCiclos.length} de {totalCiclos} ciclos formativos
        </p>
      </div>

      {/* Ciclos Grid o Lista */}
      {view === 'grid' ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredCiclos.map((ciclo) => {
            const ocupacionPercentage = Math.round((ciclo.plazas_ocupadas / ciclo.plazas) * 100)

            return (
              <Card
                key={ciclo.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-2 border-[#ff2014]"
                onClick={() => handleViewCiclo(ciclo)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={ciclo.imagen}
                    alt={ciclo.nombre}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge
                      className={`${
                        ciclo.nivel === 'Grado Medio' ? 'bg-blue-500' : 'bg-purple-500'
                      } text-white`}
                    >
                      {ciclo.nivel}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {ciclo.codigo}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ciclo.familia}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold line-clamp-2">{ciclo.nombre}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{ciclo.duracion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{ciclo.modalidad}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {ciclo.plazas_ocupadas}/{ciclo.plazas} plazas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{ciclo.cursos_activos} cursos</span>
                    </div>
                  </div>

                  {/* Ocupación Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ocupación</span>
                      <span className="font-semibold">{ocupacionPercentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          ocupacionPercentage >= 90
                            ? 'bg-[#ff2014]'
                            : ocupacionPercentage >= 70
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${ocupacionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-[#ff2014] hover:bg-[#ff2014]/90">
                    Ver Detalles del Ciclo
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredCiclos.map((ciclo) => {
            // Adapt local Ciclo interface to CicloPlantilla expected by CicloListItem
            const adaptedCiclo = {
              id: ciclo.id,
              nombre: ciclo.nombre,
              codigo: ciclo.codigo,
              tipo: (ciclo.nivel === 'Grado Medio' ? 'medio' : 'superior') as 'medio' | 'superior',
              familia_profesional: ciclo.familia,
              descripcion: '',
              objetivos: [],
              perfil_profesional: '',
              duracion_total_horas: parseInt(ciclo.duracion) || 2000,
              image: ciclo.imagen,
              color: '',
              cursos: Array(ciclo.cursos_activos).fill({ id: '', ciclo_plantilla_id: '', nombre: '', codigo_curso: '', horas: 0, tipo_curso: '', descripcion: '', creditos: 0, contenidos: [] }),
              total_instancias: 0,
              instancias_activas: 0,
              total_alumnos: ciclo.plazas_ocupadas,
              created_at: '',
              updated_at: '',
            }

            return (
              <CicloListItem
                key={ciclo.id}
                ciclo={adaptedCiclo}
                onClick={() => handleViewCiclo(ciclo)}
              />
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCiclos.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No se encontraron ciclos</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setNivelFilter('todos')
                setFamiliaFilter('todas')
                setModalidadFilter('todas')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
