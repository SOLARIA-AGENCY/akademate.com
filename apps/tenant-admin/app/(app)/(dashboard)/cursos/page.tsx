'use client'

// Force dynamic rendering - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense, type ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Plus, Search, Lock, Briefcase, Building2, Monitor, List } from 'lucide-react'
import { usePlanLimits } from '@payload-config/hooks/usePlanLimits'
import { PlanLimitModal } from '@payload-config/components/ui/PlanLimitModal'
import { UsageBar } from '@payload-config/components/ui/UsageBar'
import { getLimit } from '@payload-config/lib/planLimits'
import { CourseTemplateCard } from '@payload-config/components/ui/CourseTemplateCard'
import { CourseListItem } from '@payload-config/components/ui/CourseListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'

// Local type definition to avoid ESLint path resolution issues
type ViewMode = 'grid' | 'list'
// TODO: Import from Payload API
// import { plantillasCursosData, plantillasStats } from '@payload-config/data/mockCourseTemplatesData'

import type { PlantillaCurso } from '../../../types'

// TypeScript interfaces
interface ApiResponse {
  success: boolean
  data: PlantillaCurso[]
  total?: number
  error?: string
}

// Main component that uses useSearchParams
function CursosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo')

  // View preference (eslint path alias resolution workaround)

  const viewPreference = useViewPreference('cursos') as [ViewMode, (view: ViewMode) => void]
  const view = viewPreference[0]
  const setView = viewPreference[1]

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState(tipo ?? 'all')
  const [filterArea, setFilterArea] = useState('all')

  // State para cursos y carga
  const [cursos, setCursos] = useState<PlantillaCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<{ id: number; nombre: string }[]>([])
  const [limitModal, setLimitModal] = useState<{ open: boolean; current: number; limit: number } | null>(null)

  const { checkLimit, plan } = usePlanLimits()

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

        const result = (await response.json()) as ApiResponse
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
          setError(result.error ?? 'Error al cargar cursos')
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        console.error('[CURSOS] ❌ Error fetching courses:', error)

        // Retry en caso de timeout o error de red
        if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
          console.log(`[CURSOS] 🔄 Reintentando... (${retries} intentos restantes)`)
          setTimeout(() => fetchCursosWithRetry(retries - 1), 1000)
          return
        }

        setError(
          error.name === 'AbortError'
            ? 'Tiempo de espera agotado. El servidor está tardando demasiado.'
            : 'Error de conexión al cargar cursos'
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchCursosWithRetry()
  }, [])

  // Cargar áreas formativas desde API
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas-formativas')
        const result = (await response.json()) as {
          success: boolean
          data: { id: number; nombre: string }[]
        }
        if (result.success) setAreas(result.data)
      } catch {
        // Silenciar error — el filtro simplemente no mostrará opciones
      }
    }
    void fetchAreas()
  }, [])

  const handleAdd = () => {
    const { allowed, limit } = checkLimit('cursos', cursos.length)
    if (!allowed) {
      setLimitModal({ open: true, current: cursos.length, limit })
      return
    }
    router.push('/cursos/nuevo')
  }

  const handleViewCourse = (course: PlantillaCurso) => {
    router.push(`/cursos/${course.id}`)
  }

  // Filtrado de cursos
  const filteredCourses = cursos.filter((course) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      course.nombre.toLowerCase().includes(searchLower) ||
      (course.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
      (course.area?.toLowerCase().includes(searchLower) ?? false)

    const matchesType = filterType === 'all' || course.tipo === filterType
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

  const config = tipo ? tiposConfig[tipo as keyof typeof tiposConfig] : undefined
  const Icon = config?.icon ?? List

  return (
    <div className="space-y-6" data-oid="bkc0c9v">
      <PageHeader
        title={config?.title ?? 'Catálogo de Cursos'}
        description={config?.description ?? 'Gestiona y organiza tu oferta formativa.'}
        icon={Icon}
        iconBgColor={config?.bgColor ?? 'bg-primary/10'}
        iconColor={config?.color ?? 'text-primary'}
        badge={
          <Badge variant="secondary" data-oid="m2mems3">
            {filteredCourses.length} cursos
          </Badge>
        }
        actions={
          <Button onClick={handleAdd} data-oid="dn:ljue">
            <Plus className="h-4 w-4" data-oid="mp04.p1" />
            Nuevo Curso
          </Button>
        }
        data-oid="-ia7n0u"
      />

      <UsageBar resource="cursos" current={cursos.length} limit={getLimit(plan, 'cursos')} />

      {/* Filtros - Estandarizados para todas las vistas */}
      <Card className="bg-card" data-oid="0gd1z6-">
        <CardContent className="pt-6" data-oid=".w7czcl">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap" data-oid="ohwi565">
            <div className="min-w-[260px] flex-1" data-oid="gnnziad">
              {/* BÚSQUEDA: Siempre visible */}
              <div className="relative" data-oid="k6ryv0w">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  data-oid="decf-bv"
                />
                <Input
                  placeholder="Buscar por nombre o área..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                  data-oid="o8f_d28"
                />
              </div>
            </div>

            {/* SELECTOR DE TIPO: Solo en vista global */}
            {(!tipo || tipo === 'all') && (
              <Select value={filterType} onValueChange={setFilterType} data-oid="hngfo9s">
                <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="7_zgf3v">
                  <SelectValue placeholder="Todos los cursos" data-oid="-smqua7" />
                </SelectTrigger>
                <SelectContent data-oid="duje1hp">
                  <SelectItem value="all" data-oid="37_0.zn">
                    Todos los cursos
                  </SelectItem>
                  <SelectItem value="privados" data-oid="vqwrue-">
                    Privados
                  </SelectItem>
                  <SelectItem value="teleformacion" data-oid="_6z43vb">
                    Teleformación
                  </SelectItem>
                  <SelectItem value="ocupados" data-oid="ad6ithf">
                    Ocupados
                  </SelectItem>
                  <SelectItem value="desempleados" data-oid="k5.5pq1">
                    Desempleados
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* FILTRO POR ÁREA */}
            <Select value={filterArea} onValueChange={setFilterArea} data-oid="i0ek:n_">
              <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="zwfzshz">
                <SelectValue placeholder="Todas las áreas" data-oid="_p-h3ai" />
              </SelectTrigger>
              <SelectContent data-oid="g6_9ait">
                <SelectItem value="all" data-oid="evmmpxb">
                  Todas las áreas
                </SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.nombre} data-oid="s0ssimh">
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="hidden xl:block xl:ml-auto" data-oid="w_7hauj">
              <ViewToggle view={view} onViewChange={setView} data-oid="g1tt1yo" />
            </div>
          </div>

          {(searchTerm || filterType !== 'all' || filterArea !== 'all') && (
            <div className="flex items-center gap-4 mt-4" data-oid="wwhwrwt">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setFilterArea('all')
                }}
                data-oid="fb8q3px"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="bg-card" data-oid="u9ao1.7">
          <CardContent className="py-12 text-center" data-oid=":uk:9ee">
            <p className="text-muted-foreground" data-oid="-4__-gu">
              Cargando cursos...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="bg-card" data-oid=".lf8l71">
          <CardContent className="py-12 text-center" data-oid="9rn5h-n">
            <p className="text-destructive" data-oid="v3t1r_z">
              ❌ {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid o Lista de Cursos */}
      {!loading && !error && view === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-oid="3kr--1i">
          {filteredCourses.map((course) => (
            <CourseTemplateCard
              key={course.id}
              template={course}
              onClick={() => handleViewCourse(course)}
              data-oid="jicucw1"
            />
          ))}
        </div>
      )}

      {!loading && !error && view === 'list' && (
        <div className="flex flex-col gap-4" data-oid="9hy8e7h">
          {filteredCourses.map((course) => (
            <CourseListItem
              key={course.id}
              course={course}
              onClick={() => handleViewCourse(course)}
              data-oid="_gjcoji"
            />
          ))}
        </div>
      )}

      {/* Si no hay resultados */}
      {!loading && !error && filteredCourses.length === 0 && (
        <Card className="bg-card" data-oid="uggraeq">
          <CardContent className="py-12 text-center" data-oid="5u44f9g">
            <p className="text-muted-foreground" data-oid="9vttv6h">
              No se encontraron cursos que coincidan con los filtros seleccionados.
            </p>
          </CardContent>
        </Card>
      )}

      {limitModal && (
        <PlanLimitModal
          open={limitModal.open}
          onClose={() => setLimitModal(null)}
          resource="cursos"
          current={limitModal.current}
          limit={limitModal.limit}
          plan={plan}
        />
      )}
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function CursosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6" data-oid="rhi_4_9">
          <div className="flex items-center justify-center py-12" data-oid="v0ewz97">
            <p className="text-muted-foreground" data-oid="547tq7.">
              Cargando cursos...
            </p>
          </div>
        </div>
      }
      data-oid="q-0o:pp"
    >
      <CursosPageContent data-oid="8mc-:c9" />
    </Suspense>
  )
}
