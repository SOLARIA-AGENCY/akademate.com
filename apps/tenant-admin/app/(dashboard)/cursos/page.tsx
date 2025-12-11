'use client'

// Force dynamic rendering - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Plus, Search, Lock, Briefcase, Building2, Monitor, List, BookOpen } from 'lucide-react'
import { CourseTemplateCard } from '@payload-config/components/ui/CourseTemplateCard'
import { CourseListItem } from '@payload-config/components/ui/CourseListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
// TODO: Import from Payload API
// import { plantillasCursosData, plantillasStats } from '@payload-config/data/mockCourseTemplatesData'

// Main component that uses useSearchParams
function CursosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo')

  // View preference
  const [view, setView] = useViewPreference('cursos')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState(tipo || 'all')
  const [filterArea, setFilterArea] = useState('all')
  const [filterSede, setFilterSede] = useState('all')

  // State para cursos y carga
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar filterType con searchParams
  useEffect(() => {
    if (tipo) {
      setFilterType(tipo)
    }
  }, [tipo])

  // Cargar cursos desde API con retry logic
  useEffect(() => {
    const fetchCursosWithRetry = async (retries = 2) => {
      console.log(`[CURSOS] Iniciando fetch de cursos (intentos restantes: ${retries})`)
      try {
        setLoading(true)

        // Timeout de 15 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort(new Error('Timeout de 15 segundos alcanzado'))
        }, 15000)

        const startTime = Date.now()
        const response = await fetch('/api/cursos', {
          signal: controller.signal,
          cache: 'no-cache', // Forzar fresh data en primera carga
        })
        clearTimeout(timeoutId)
        const elapsed = Date.now() - startTime
        console.log(`[CURSOS] Respuesta recibida en ${elapsed}ms`)

        const result = await response.json()
        console.log(`[CURSOS] Datos recibidos:`, {
          success: result.success,
          total: result.total,
          count: result.data?.length,
        })

        if (result.success) {
          // La API ya retorna los datos en el formato correcto
          setCursos(result.data)
          setError(null)
          console.log(`[CURSOS] ✅ ${result.data.length} cursos cargados exitosamente`)
        } else {
          console.error('[CURSOS] ❌ Error en respuesta:', result.error)
          setError(result.error || 'Error al cargar cursos')
        }
      } catch (err: any) {
        console.error('[CURSOS] ❌ Error fetching courses:', err)

        // Retry en caso de timeout o error de red
        if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
          console.log(`[CURSOS] 🔄 Reintentando... (${retries} intentos restantes)`)
          setTimeout(() => fetchCursosWithRetry(retries - 1), 1000)
          return
        }

        setError(
          err.name === 'AbortError'
            ? 'Tiempo de espera agotado. El servidor está tardando demasiado.'
            : 'Error de conexión al cargar cursos'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchCursosWithRetry()
  }, [])

  // Calcular estadísticas según el contexto (tipo de curso seleccionado)
  const cursosStats = (() => {
    const tipoNormalizado = tipo === 'privados' ? 'privado' : tipo

    if (!tipo || tipo === 'all') {
      // Vista global: todos los cursos
      return {
        total: cursos.length,
        privados: cursos.filter((c) => c.tipo === 'privado').length,
        ocupados: cursos.filter((c) => c.tipo === 'ocupados').length,
        desempleados: cursos.filter((c) => c.tipo === 'desempleados').length,
        teleformacion: cursos.filter((c) => c.tipo === 'teleformacion').length,
      }
    } else {
      // Vistas específicas: TODAS muestran los mismos 4 campos
      // Total Cursos | Convocatorias | Alumnos | Plazas Disponibles
      const cursosFiltrados = cursos.filter((c) => c.tipo === tipoNormalizado)
      return {
        total: cursosFiltrados.length,
        convocatorias: 0, // TODO: Fetch from /api/convocatorias
        alumnos: 0, // TODO: Count from enrollments
        plazasDisponibles: 0, // TODO: Calculate from convocations (max_students - current_enrollments)
      }
    }
  })()

  const handleAdd = () => {
    // Redirigir a la página de creación de curso
    router.push('/cursos/nuevo')
  }

  const handleViewCourse = (course: any) => {
    router.push(`/cursos/${course.id}`)
  }

  // Filtrado de cursos
  const filteredCourses = cursos.filter((course) => {
    const matchesSearch =
      course.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.descripcion && course.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.area && course.area.toLowerCase().includes(searchTerm.toLowerCase()))

    // Normalizar tipos para el filtro (privados → privado)
    const normalizedFilterType = filterType === 'privados' ? 'privado' : filterType
    const matchesType = filterType === 'all' || course.tipo === normalizedFilterType
    const matchesArea = filterArea === 'all' || course.area === filterArea

    return matchesSearch && matchesType && matchesArea
  })

  // Configure header based on filter
  const tiposConfig = {
    privados: {
      title: 'Cursos Privados',
      description: 'Cursos de formación privada para empresas y particulares',
      icon: Lock,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
    ocupados: {
      title: 'Cursos Ocupados',
      description: 'Formación para trabajadores ocupados con financiación FUNDAE',
      icon: Briefcase,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    desempleados: {
      title: 'Cursos Desempleados',
      description: 'Formación gratuita para personas en situación de desempleo',
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    teleformacion: {
      title: 'Cursos Teleformación',
      description: 'Cursos 100% online con certificación oficial',
      icon: Monitor,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  }

  const config = tipo && tiposConfig[tipo as keyof typeof tiposConfig]
  const Icon = config?.icon || List

  return (
    <div className="space-y-6 bg-muted/30 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${config?.bgColor || 'bg-primary/10'}`}
          >
            <Icon className={`h-6 w-6 ${config?.color || 'text-primary'}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {config?.title || 'Catálogo de Cursos'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {config?.description ||
                `${filteredCourses.length} cursos de ${cursos.length} totales`}
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Curso
        </Button>
      </div>

      {/* Filtros - Estandarizados para todas las vistas */}
      <Card className="bg-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Filtros principales */}
            <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* BÚSQUEDA: Siempre visible */}
              <div className="relative md:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, descripción o área..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>

              {/* SELECTOR DE TIPO: Solo en vista global */}
              {(!tipo || tipo === 'all') && (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos los cursos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    <SelectItem value="privados">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600" />
                        Privados
                      </div>
                    </SelectItem>
                    <SelectItem value="teleformacion">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-600" />
                        Teleformación
                      </div>
                    </SelectItem>
                    <SelectItem value="ocupados">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        Ocupados
                      </div>
                    </SelectItem>
                    <SelectItem value="desempleados">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        Desempleados
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* FILTRO POR ÁREA: Siempre visible */}
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
                  <SelectItem value="Desarrollo Web">Desarrollo Web</SelectItem>
                  <SelectItem value="Diseño Gráfico">Diseño Gráfico</SelectItem>
                  <SelectItem value="Audiovisual">Audiovisual</SelectItem>
                  <SelectItem value="Gestión Empresarial">Gestión Empresarial</SelectItem>
                </SelectContent>
              </Select>

              {/* FILTRO POR SEDE: Siempre visible EXCEPTO en Teleformación */}
              {tipo !== 'teleformacion' && (
                <Select value={filterSede} onValueChange={setFilterSede}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las sedes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    <SelectItem value="1">CEP Norte</SelectItem>
                    <SelectItem value="2">CEP Santa Cruz</SelectItem>
                    <SelectItem value="3">CEP Sur</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* View Toggle */}
            <div className="hidden lg:block">
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>

          {(searchTerm || filterType !== 'all' || filterArea !== 'all' || filterSede !== 'all') && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterArea('all')
                  setFilterSede('all')
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats - Estadísticas estandarizadas */}
      {!loading && !error && (
        <Card className="bg-card">
          <CardContent className="py-3">
            {/* VISTA GLOBAL: Todos los cursos - Breakdown por tipo */}
            {(!tipo || tipo === 'all') && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Privados:</span>
                  <span className="text-lg font-bold text-red-600">{cursosStats.privados}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Ocupados:</span>
                  <span className="text-lg font-bold text-green-600">{cursosStats.ocupados}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Desempleados:</span>
                  <span className="text-lg font-bold text-blue-600">{cursosStats.desempleados}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Teleformación:</span>
                  <span className="text-lg font-bold text-orange-600">{cursosStats.teleformacion}</span>
                </div>
              </div>
            )}

            {/* VISTAS ESPECÍFICAS: 4 campos uniformes para todos los tipos */}
            {tipo && tipo !== 'all' && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">TOTAL CURSOS:</span>
                  <span className="text-lg font-bold text-gray-900">{cursosStats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">CONVOCATORIAS:</span>
                  <span className="text-lg font-bold text-blue-600">{cursosStats.convocatorias}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">ALUMNOS:</span>
                  <span className="text-lg font-bold text-green-600">{cursosStats.alumnos}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">PLAZAS DISPONIBLES:</span>
                  <span className="text-lg font-bold text-orange-600">{cursosStats.plazasDisponibles}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando cursos...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">❌ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Grid o Lista de Cursos */}
      {!loading && !error && view === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseTemplateCard
              key={course.id}
              template={course}
              onClick={() => handleViewCourse(course)}
            />
          ))}
        </div>
      )}

      {!loading && !error && view === 'list' && (
        <div className="flex flex-col gap-4">
          {filteredCourses.map((course) => (
            <CourseListItem
              key={course.id}
              course={course}
              onClick={() => handleViewCourse(course)}
            />
          ))}
        </div>
      )}

      {/* Si no hay resultados */}
      {!loading && !error && filteredCourses.length === 0 && (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron cursos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function CursosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 bg-muted/30 p-6 rounded-lg">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cargando cursos...</p>
          </div>
        </div>
      }
    >
      <CursosPageContent />
    </Suspense>
  )
}
