'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  BookOpen,
  TrendingUp,
} from 'lucide-react'
// TODO: Fetch from Payload API
// import { convocatoriasMockData, type Convocatoria } from '@payload-config/data/mockConvocatorias'
const convocatoriasMockData: any[] = []
type Convocatoria = any

export default function ProgramacionPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [sedeFilter, setSedeFilter] = useState<string>('todas')
  const [estadoFilter, setEstadoFilter] = useState<string>('todos')

  // Calcular estadísticas
  const totalConvocatorias = convocatoriasMockData.length
  const convocatoriasActivas = convocatoriasMockData.filter(
    (c) => c.estado === 'abierta' || c.estado === 'en_curso'
  ).length
  const conflictosDetectados = convocatoriasMockData.filter((c) => c.tiene_conflictos).length
  const tasaOcupacion = Math.round(
    (convocatoriasMockData.reduce((sum, c) => sum + c.plazas_ocupadas, 0) /
      convocatoriasMockData.reduce((sum, c) => sum + c.plazas_totales, 0)) *
      100
  )

  // Filtrar convocatorias
  const convocatoriasFiltradas = convocatoriasMockData.filter((convocatoria) => {
    const matchesSearch =
      searchTerm === '' ||
      convocatoria.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convocatoria.codigo_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convocatoria.profesor_principal.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSede = sedeFilter === 'todas' || convocatoria.sede === sedeFilter

    const matchesEstado = estadoFilter === 'todos' || convocatoria.estado === estadoFilter

    return matchesSearch && matchesSede && matchesEstado
  })

  const getEstadoBadge = (estado: Convocatoria['estado']) => {
    switch (estado) {
      case 'planificada':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planificada</Badge>
      case 'abierta':
        return <Badge className="bg-green-500 text-white">Abierta</Badge>
      case 'en_curso':
        return <Badge className="bg-[#ff2014] text-white">En Curso</Badge>
      case 'completada':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Completada</Badge>
      case 'cancelada':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelada</Badge>
    }
  }

  const handleNuevaConvocatoria = () => {
    router.push('/programacion/nueva')
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Programación de Convocatorias</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona horarios, aulas y profesores sin conflictos
          </p>
        </div>
        <Button
          className="bg-[#ff2014] hover:bg-[#ff2014]/90"
          onClick={handleNuevaConvocatoria}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Convocatoria
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ff2014]/10 rounded-lg">
              <Calendar className="h-6 w-6 text-[#ff2014]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Convocatorias</p>
              <p className="text-2xl font-bold">{totalConvocatorias}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold">{convocatoriasActivas}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Con Conflictos</p>
              <p className="text-2xl font-bold">{conflictosDetectados}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ocupación</p>
              <p className="text-2xl font-bold">{tasaOcupacion}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar curso, código o profesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sedeFilter} onValueChange={setSedeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las sedes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              <SelectItem value="CEP Norte">CEP Norte</SelectItem>
              <SelectItem value="CEP Sur">CEP Sur</SelectItem>
              <SelectItem value="CEP Santa Cruz">CEP Santa Cruz</SelectItem>
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="planificada">Planificada</SelectItem>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="en_curso">En Curso</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setSedeFilter('todas')
              setEstadoFilter('todos')
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {convocatoriasFiltradas.length} de {totalConvocatorias} convocatorias
        </p>
      </div>

      {/* Lista de Convocatorias */}
      <div className="space-y-4">
        {convocatoriasFiltradas.map((convocatoria) => {
          const ocupacionPercentage = Math.round(
            (convocatoria.plazas_ocupadas / convocatoria.plazas_totales) * 100
          )

          return (
            <Card
              key={convocatoria.id}
              className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                convocatoria.tiene_conflictos ? 'border-2 border-orange-500' : 'border-2 border-transparent'
              }`}
              onClick={() => router.push(`/programacion/${convocatoria.id}`)}
            >
              <div className="space-y-4">
                {/* Header del card */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-[#ff2014]" />
                      <h3 className="text-xl font-bold">{convocatoria.curso}</h3>
                      {convocatoria.tiene_conflictos && (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{convocatoria.codigo_curso}</Badge>
                      {getEstadoBadge(convocatoria.estado)}
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sede y Aula</p>
                      <p className="text-sm font-medium">
                        {convocatoria.sede} - {convocatoria.aula}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Profesor</p>
                      <p className="text-sm font-medium">{convocatoria.profesor_principal}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horario</p>
                      <p className="text-sm font-medium">{convocatoria.horario_resumen}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fechas</p>
                      <p className="text-sm font-medium">
                        {new Date(convocatoria.fecha_inicio).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        -{' '}
                        {new Date(convocatoria.fecha_fin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ocupación */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ocupación</span>
                    </div>
                    <span className="font-semibold">
                      {convocatoria.plazas_ocupadas}/{convocatoria.plazas_totales} plazas (
                      {ocupacionPercentage}%)
                    </span>
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

                {/* Conflictos (si existen) */}
                {convocatoria.tiene_conflictos && convocatoria.conflictos && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-orange-900">
                          ⚠️ Conflictos Detectados ({convocatoria.conflictos.length})
                        </p>
                        <ul className="space-y-1">
                          {convocatoria.conflictos.map((conflicto, idx) => (
                            <li key={idx} className="text-sm text-orange-700">
                              • {conflicto}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 border-orange-500 text-orange-700 hover:bg-orange-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            alert('Abrir modal de resolución de conflictos')
                          }}
                        >
                          Resolver Conflictos
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/planner?convocatoria=${convocatoria.id}`)
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver en Calendario
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/programacion/${convocatoria.id}/editar`)
                    }}
                  >
                    Editar Horario
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/alumnos?convocatoria=${convocatoria.id}`)
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Ver Estudiantes
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {convocatoriasFiltradas.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No se encontraron convocatorias</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Intenta ajustar los filtros de búsqueda o crea una nueva convocatoria
              </p>
            </div>
            <Button variant="outline" onClick={handleNuevaConvocatoria}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Convocatoria
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
