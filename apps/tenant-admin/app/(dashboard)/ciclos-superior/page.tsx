'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Search, GraduationCap, Calendar, Users, BookOpen, Clock, Award } from 'lucide-react'

// Datos de Ciclos Formativos de Grado Superior
const ciclosSuperiorData = [
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

  const [searchTerm, setSearchTerm] = useState('')
  const [filterFamilia, setFilterFamilia] = useState('all')
  const [filterModalidad, setFilterModalidad] = useState('all')

  const handleAdd = () => {
    console.log('Crear nuevo ciclo superior')
  }

  const handleViewCiclo = (cicloId: string) => {
    router.push(`/ciclos-superior/${cicloId}`)
  }

  // Extraer familias únicas
  const familias = Array.from(new Set(ciclosSuperiorData.map((c) => c.familia)))

  const filteredCiclos = ciclosSuperiorData.filter((ciclo) => {
    const matchesSearch =
      ciclo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.familia.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFamilia = filterFamilia === 'all' || ciclo.familia === filterFamilia
    const matchesModalidad = filterModalidad === 'all' || ciclo.modalidad === filterModalidad

    return matchesSearch && matchesFamilia && matchesModalidad
  })

  const stats = {
    total: ciclosSuperiorData.length,
    activos: ciclosSuperiorData.filter((c) => c.active).length,
    totalPlazas: ciclosSuperiorData.reduce((sum, c) => sum + c.plazas, 0),
    plazasOcupadas: ciclosSuperiorData.reduce((sum, c) => sum + c.plazas_ocupadas, 0),
    cursosActivos: ciclosSuperiorData.reduce((sum, c) => sum + c.cursos_activos, 0),
  }

  const tasaOcupacion = ((stats.plazasOcupadas / stats.totalPlazas) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ciclos Formativos de Grado Superior</h1>
            <p className="text-muted-foreground mt-1">
              {filteredCiclos.length} ciclos de {ciclosSuperiorData.length} totales
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ciclo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ciclos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciclos Activos</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plazas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlazas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plazas Ocupadas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.plazasOcupadas}</div>
            <p className="text-xs text-muted-foreground">Ocupación: {tasaOcupacion}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cursosActivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o familia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterFamilia} onValueChange={setFilterFamilia}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Modalidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las modalidades</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchTerm || filterFamilia !== 'all' || filterModalidad !== 'all') && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterFamilia('all')
                  setFilterModalidad('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Ciclos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCiclos.map((ciclo) => {
          const ocupacionPorcentaje = ((ciclo.plazas_ocupadas / ciclo.plazas) * 100).toFixed(0)

          return (
            <Card
              key={ciclo.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-[#ff2014]"
              onClick={() => handleViewCiclo(ciclo.id)}
            >
              {/* Imagen del ciclo */}
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={ciclo.imagen}
                  alt={ciclo.nombre}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-[#ff2014] hover:bg-[#ff2014]/90 text-white text-xs font-bold uppercase tracking-wide shadow-md">
                    {ciclo.nivel}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs font-bold">
                    {ciclo.codigo}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-3">
                {/* Familia Badge */}
                <Badge variant="outline" className="w-fit text-xs">
                  {ciclo.familia}
                </Badge>

                {/* Título */}
                <div className="min-h-[3.5rem]">
                  <h3 className="font-bold text-lg leading-7 uppercase line-clamp-2" title={ciclo.nombre}>
                    {ciclo.nombre}
                  </h3>
                </div>

                {/* Descripción */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {ciclo.descripcion}
                </p>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs">{ciclo.duracion}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm flex-shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-xs whitespace-nowrap">
                      {ciclo.cursos_activos} {ciclo.cursos_activos === 1 ? 'curso' : 'cursos'}
                    </span>
                  </div>
                </div>

                {/* Ocupación */}
                <div className="py-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Ocupación:</span>
                    <span className="text-sm font-bold">
                      {ciclo.plazas_ocupadas}/{ciclo.plazas} plazas
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#ff2014] h-full transition-all duration-300"
                      style={{ width: `${ocupacionPorcentaje}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">{ocupacionPorcentaje}% ocupado</p>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full bg-[#ff2014] hover:bg-[#ff2014]/90 text-white font-bold uppercase tracking-wide shadow-md transition-all duration-300 mt-auto"
                  onClick={(e) => {
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
