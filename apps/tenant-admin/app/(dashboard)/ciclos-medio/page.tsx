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

// Datos de Ciclos Formativos de Grado Medio
const ciclosMedioData = [
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

  const [searchTerm, setSearchTerm] = useState('')
  const [filterFamilia, setFilterFamilia] = useState('all')
  const [filterModalidad, setFilterModalidad] = useState('all')

  const handleAdd = () => {
    console.log('Crear nuevo ciclo medio')
  }

  const handleViewCiclo = (cicloId: string) => {
    router.push(`/ciclos-medio/${cicloId}`)
  }

  // Extraer familias únicas
  const familias = Array.from(new Set(ciclosMedioData.map((c) => c.familia)))

  const filteredCiclos = ciclosMedioData.filter((ciclo) => {
    const matchesSearch =
      ciclo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ciclo.familia.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFamilia = filterFamilia === 'all' || ciclo.familia === filterFamilia
    const matchesModalidad = filterModalidad === 'all' || ciclo.modalidad === filterModalidad

    return matchesSearch && matchesFamilia && matchesModalidad
  })

  const stats = {
    total: ciclosMedioData.length,
    activos: ciclosMedioData.filter((c) => c.active).length,
    totalPlazas: ciclosMedioData.reduce((sum, c) => sum + c.plazas, 0),
    plazasOcupadas: ciclosMedioData.reduce((sum, c) => sum + c.plazas_ocupadas, 0),
    cursosActivos: ciclosMedioData.reduce((sum, c) => sum + c.cursos_activos, 0),
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
            <h1 className="text-3xl font-bold tracking-tight">Ciclos Formativos de Grado Medio</h1>
            <p className="text-muted-foreground mt-1">
              {filteredCiclos.length} ciclos de {ciclosMedioData.length} totales
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
