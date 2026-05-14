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
import { CourseDashboardCard, CourseDashboardListItem } from '@payload-config/components/akademate/dashboard'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { fetchCoursesCatalog } from '@/app/lib/client/courses-catalog'
import {
  getPublicStudyTypeFallbackImage,
  normalizePublicStudyType,
  toDashboardStudyType,
} from '@/app/lib/website/study-types'

// Local type definition to avoid ESLint path resolution issues
type ViewMode = 'grid' | 'list'
// TODO: Import from Payload API
// import { plantillasCursosData, plantillasStats } from '@payload-config/data/mockCourseTemplatesData'

import type { PlantillaCurso } from '../../../../types'

const PRIMARY_COURSE_TYPES = ['privados', 'ocupados', 'desempleados', 'teleformacion'] as const
type DashboardCourseType = (typeof PRIMARY_COURSE_TYPES)[number]
type DashboardFilterType = 'all' | DashboardCourseType

const TYPE_DISPLAY_ORDER: DashboardCourseType[] = [
  'ocupados',
  'desempleados',
  'privados',
  'teleformacion',
]

const TYPE_ICONS: Record<DashboardCourseType, typeof Lock> = {
  privados: Lock,
  ocupados: Briefcase,
  desempleados: Building2,
  teleformacion: Monitor,
}

// Main component that uses useSearchParams
function CursosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo')
  const selectedTypeFromUrl = normalizePublicStudyType(tipo)

  // View preference (eslint path alias resolution workaround)

  const viewPreference = useViewPreference('cursos') as [ViewMode, (view: ViewMode) => void]
  const view = viewPreference[0]
  const setView = viewPreference[1]

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<DashboardFilterType>(
    selectedTypeFromUrl ?? 'all'
  )
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
    setFilterType(selectedTypeFromUrl ?? 'all')
  }, [selectedTypeFromUrl])

  // Cargar cursos desde API con retry logic
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        setLoading(true)
        const result = await fetchCoursesCatalog<PlantillaCurso>({
          includeInactive: true,
          timeoutMs: 15000,
          retries: 2,
        })
        setCursos(result.courses)
        setError(null)
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error.message || 'Error de conexión al cargar cursos')
      } finally {
        setLoading(false)
      }
    }

    void fetchCursos()
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
    router.push('/dashboard/cursos/nuevo')
  }

  const handleViewCourse = (course: PlantillaCurso) => {
    router.push(`/dashboard/cursos/${course.id}`)
  }

  const goToTypePage = (type: DashboardCourseType) => {
    router.push(`/dashboard/cursos?tipo=${encodeURIComponent(type)}`)
  }

  const goToTypeLanding = () => {
    router.push('/dashboard/cursos')
  }

  const getCourseType = (course: PlantillaCurso): DashboardCourseType =>
    toDashboardStudyType((course as PlantillaCurso & { studyType?: string }).studyType ?? course.tipo)

  // Filtrado base (sin tipo) para construir cards dinámicas por categoría
  const baseFilteredCourses = cursos.filter((course) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      course.nombre.toLowerCase().includes(searchLower) ||
      (course.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
      (course.area?.toLowerCase().includes(searchLower) ?? false)
    const matchesArea = filterArea === 'all' || course.area === filterArea

    return matchesSearch && matchesArea
  })

  const typeCounts = TYPE_DISPLAY_ORDER.reduce<Record<DashboardCourseType, number>>(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {
      privados: 0,
      ocupados: 0,
      desempleados: 0,
      teleformacion: 0,
    }
  )

  baseFilteredCourses.forEach((course) => {
    const type = getCourseType(course)
    typeCounts[type] += 1
  })

  // Filtrado final (incluye tipo)
  const filteredCourses = baseFilteredCourses.filter((course) => {
    if (filterType === 'all') return true
    return getCourseType(course) === filterType
  })

  const visibleTypes =
    filterType === 'all' ? TYPE_DISPLAY_ORDER.filter((type) => typeCounts[type] > 0) : [filterType]

  const groupedCourses = visibleTypes.map((type) => ({
    type,
    courses: filteredCourses.filter((course) => getCourseType(course) === type),
  }))

  const isTypeLandingPage = !selectedTypeFromUrl

  // Configure header based on filter
  const tiposConfig: Record<DashboardCourseType, {
    title: string
    description: string
    icon: typeof Lock
    color: string
    bgColor: string
  }> = {
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
      description: 'Cursos 100% online con matrícula permanente e inicio flexible',
      icon: Monitor,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
  }

  const config = filterType !== 'all' ? tiposConfig[filterType] : undefined
  const Icon = config?.icon ?? List

  return (
    <div className="space-y-6" data-oid="bkc0c9v">
      <PageHeader
        title={isTypeLandingPage ? 'Tipos de Cursos' : (config?.title ?? 'Catálogo de Cursos')}
        description={
          isTypeLandingPage
            ? 'Selecciona un tipo para ver su catálogo de cursos.'
            : (config?.description ?? 'Gestiona y organiza tu oferta formativa.')
        }
        icon={Icon}
        iconBgColor={config?.bgColor ?? 'bg-primary/10'}
        iconColor={config?.color ?? 'text-primary'}
        badge={
          <Badge variant="secondary" data-oid="m2mems3">
            {isTypeLandingPage ? `${PRIMARY_COURSE_TYPES.length} categorías` : `${filteredCourses.length} cursos`}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {!isTypeLandingPage && (
              <Button variant="outline" onClick={goToTypeLanding}>
                Ver tipos
              </Button>
            )}
            <Button onClick={handleAdd} data-oid="dn:ljue">
              <Plus className="h-4 w-4" data-oid="mp04.p1" />
              Nuevo Curso
            </Button>
          </div>
        }
        data-oid="-ia7n0u"
      />

      <UsageBar resource="cursos" current={cursos.length} limit={getLimit(plan, 'cursos')} />

      {/* Landing de tipos de curso */}
      {!loading && !error && isTypeLandingPage && (
        <div className="grid gap-6 md:grid-cols-2">
          {PRIMARY_COURSE_TYPES.map((type) => {
            const style = COURSE_TYPE_CONFIG[type]
            const IconByType = TYPE_ICONS[type]
            const typeImage = getPublicStudyTypeFallbackImage(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => goToTypePage(type)}
                className="text-left h-full"
              >
                <Card className="h-full overflow-hidden border transition-all hover:shadow-md hover:border-primary">
                  <div className="relative h-44">
                    <img src={typeImage} alt={style.label} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-white ${style.bgColor}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="absolute right-4 top-4 rounded-full bg-white/90 p-2">
                      <IconByType className={`h-4 w-4 ${style.textColor}`} />
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-3xl font-bold">{typeCounts[type]}</p>
                    <p className="text-sm text-muted-foreground">cursos disponibles</p>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Filtros - Estandarizados para todas las vistas */}
      {!isTypeLandingPage && <Card className="bg-card" data-oid="0gd1z6-">
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
                  setFilterArea('all')
                }}
                data-oid="fb8q3px"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>}

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
      {!loading && !error && !isTypeLandingPage && groupedCourses.length > 0 && (
        <div className="space-y-8">
          {groupedCourses.map((group) => {
            if (group.courses.length === 0) return null
            const style = COURSE_TYPE_CONFIG[group.type]
            return (
              <section key={group.type} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${style.dotColor}`} />
                    <h2 className="text-lg font-semibold">{tiposConfig[group.type]?.title ?? style.label}</h2>
                  </div>
                  <Badge variant="secondary">{group.courses.length}</Badge>
                </div>

                {view === 'grid' ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2" data-oid="3kr--1i">
                    {group.courses.map((course) => (
                      <CourseDashboardCard
                        key={course.id}
                        course={{
                          ...course,
                          tipo: getCourseType(course),
                        }}
                        onClick={() => handleViewCourse(course)}
                        data-oid="jicucw1"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4" data-oid="9hy8e7h">
                    {group.courses.map((course) => (
                      <CourseDashboardListItem
                        key={course.id}
                        course={{
                          ...course,
                          tipo: getCourseType(course),
                        }}
                        onClick={() => handleViewCourse(course)}
                        data-oid="_gjcoji"
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
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
