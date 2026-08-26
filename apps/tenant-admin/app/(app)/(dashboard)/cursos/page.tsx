'use client'

// Force dynamic rendering - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@payload-config/components/ui/button'
import { BookOpen, CalendarDays } from 'lucide-react'

import { usePlanLimits } from '@payload-config/hooks/usePlanLimits'
import {
  ACADEMIC_LISTING_GRID_CLASS,
  AcademicEntityCard,
  DirectoryAvatarCell,
  DirectoryNeutralBadge,
  DirectoryStatusPill,
  PremiumDirectoryShell,
  computeCourseDirectoryKpis,
  resolveCatalogActiveStatus,
  staffStatusVisual,
} from '@payload-config/components/akademate/dashboard'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'
import { fetchCoursesCatalog } from '@/app/lib/client/courses-catalog'
import { normalizePublicStudyType, toDashboardStudyType } from '@/app/lib/website/study-types'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'

type ViewMode = 'grid' | 'list'

import type { PlantillaCurso } from '../../../../types'

const PRIMARY_COURSE_TYPES = ['privados', 'ocupados', 'desempleados', 'teleformacion'] as const
type DashboardCourseType = (typeof PRIMARY_COURSE_TYPES)[number]
type DashboardFilterType = 'all' | DashboardCourseType
type DashboardActiveFilter = 'all' | 'activo' | 'inactivo'
type CourseGroup = 'privados' | 'sce'

const TYPE_DISPLAY_ORDER: DashboardCourseType[] = [
  'ocupados',
  'desempleados',
  'privados',
  'teleformacion',
]

function CursosPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo')
  const groupParam = searchParams.get('grupo')
  const selectedTypeFromUrl = normalizePublicStudyType(tipo)
  const selectedGroup: CourseGroup | null =
    groupParam === 'privados' || groupParam === 'sce' ? groupParam : null

  const viewPreference = useViewPreference('cursos') as [ViewMode, (view: ViewMode) => void]
  const view = viewPreference[0]
  const setView = viewPreference[1]

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<DashboardFilterType>(selectedTypeFromUrl ?? 'all')
  const [filterArea, setFilterArea] = useState('all')
  const [filterStatus, setFilterStatus] = useState<DashboardActiveFilter>('all')

  const [cursos, setCursos] = useState<PlantillaCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areas, setAreas] = useState<{ id: number; nombre: string }[]>([])
  const { checkLimit } = usePlanLimits()

  useEffect(() => {
    setFilterType(selectedTypeFromUrl ?? 'all')
  }, [selectedTypeFromUrl])

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
        const caught = err instanceof Error ? err : new Error('Unknown error')
        setError(caught.message || 'No se pudieron cargar los cursos. Recarga e inténtalo de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    void fetchCursos()
  }, [])

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

  const canCreateCourse = checkLimit('cursos', cursos.length).allowed

  const handleAdd = () => {
    if (!canCreateCourse) return
    router.push('/dashboard/cursos/nuevo')
  }

  const handleViewCourse = (course: PlantillaCurso) => {
    router.push(`/dashboard/cursos/${course.id}`)
  }

  const getCourseType = (course: PlantillaCurso): DashboardCourseType =>
    toDashboardStudyType(
      (course as PlantillaCurso & { studyType?: string }).studyType ?? course.tipo
    )

  const filteredCourses = cursos.filter((course) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      course.nombre.toLowerCase().includes(searchLower) ||
      (course.descripcion?.toLowerCase().includes(searchLower) ?? false) ||
      (course.area?.toLowerCase().includes(searchLower) ?? false)
    const matchesArea = filterArea === 'all' || course.area === filterArea
    const matchesType = filterType === 'all' || getCourseType(course) === filterType
    const matchesStatus =
      filterStatus === 'all' || resolveCatalogActiveStatus(course.active) === filterStatus

    return matchesSearch && matchesArea && matchesType && matchesStatus
  })

  const exportColumns: ExportColumn<PlantillaCurso>[] = [
    { header: 'Codigo', getValue: (course) => course.id },
    { header: 'Curso', getValue: (course) => course.nombre },
    { header: 'Tipo', getValue: (course) => COURSE_TYPE_CONFIG[getCourseType(course)]?.label },
    { header: 'Área', getValue: (course) => course.area || 'Sin área' },
    { header: 'Horas', getValue: (course) => course.duracionReferencia },
    {
      header: 'Precio referencia',
      getValue: (course) => course.precioReferencia ?? 'Consultar',
    },
    { header: 'Convocatorias', getValue: (course) => course.totalConvocatorias ?? 0 },
    { header: 'Estado', getValue: (course) => (course.active ? 'Activo' : 'Inactivo') },
  ]

  const handleCsv = () =>
    downloadCsv(
      `cursos-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredCourses
    )

  const kpis = computeCourseDirectoryKpis(filteredCourses)
  const courseRows = filteredCourses.map((course) => ({ ...course, id: String(course.id) }))

  return (
    <PremiumDirectoryShell
      scroll="page"
      title="Cursos"
      description="Catálogo de plantillas formativas, áreas y convocatorias asociadas."
      icon={BookOpen}
      entityPlural="cursos"
      createLabel={canCreateCourse ? 'Nuevo' : undefined}
      onCreate={canCreateCourse ? handleAdd : undefined}
      onExportCsv={handleCsv}
      kpis={kpis}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar..."
      extraToolbar={
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link
            href={
              selectedTypeFromUrl
                ? `/dashboard/cursos/convocatorias?tipo=${encodeURIComponent(selectedTypeFromUrl)}`
                : selectedGroup
                  ? `/dashboard/cursos/convocatorias?grupo=${encodeURIComponent(selectedGroup)}`
                  : '/dashboard/cursos/convocatorias'
            }
          >
            <CalendarDays className="h-4 w-4" />
            Convocatorias
          </Link>
        </Button>
      }
      segments={[
        { id: 'all', label: 'Todos' },
        { id: 'activo', label: 'Activos' },
        { id: 'inactivo', label: 'Inactivos' },
      ]}
      selectedSegment={filterStatus}
      onSegmentChange={(value) => setFilterStatus(value as DashboardActiveFilter)}
      filters={[
        {
          id: 'tipo',
          label: 'Tipo',
          value: filterType,
          onChange: (value) => setFilterType(value as DashboardFilterType),
          options: [
            { value: 'all', label: 'Tipo: Todos' },
            ...TYPE_DISPLAY_ORDER.map((type) => ({
              value: type,
              label: COURSE_TYPE_CONFIG[type]?.label ?? type,
            })),
          ],
        },
        {
          id: 'area',
          label: 'Área',
          value: filterArea,
          onChange: setFilterArea,
          options: [
            { value: 'all', label: 'Área: Todas' },
            ...areas.map((area) => ({ value: area.nombre, label: area.nombre })),
          ],
        },
      ]}
      viewMode={view === 'grid' ? 'grid' : 'table'}
      onViewModeChange={(mode) => setView(mode === 'grid' ? 'grid' : 'list')}
      columns={[
        {
          id: 'formacion',
          header: 'Formación',
          render: (course) => (
            <DirectoryAvatarCell
              name={course.nombre}
              subtitle={COURSE_TYPE_CONFIG[getCourseType(course)]?.label}
              src={course.imagenPortada}
              initials={(course.nombre ?? 'C').slice(0, 2).toUpperCase()}
            />
          ),
        },
        {
          id: 'area',
          header: 'Área',
          render: (course) => (
              <DirectoryNeutralBadge>{course.area || 'Sin área'}</DirectoryNeutralBadge>
            ),
        },
        {
          id: 'horas',
          header: 'Horas',
          render: (course) => `${course.duracionReferencia ?? 0}h`,
        },
        {
          id: 'convocatorias',
          header: 'Convocatorias',
          render: (course) => String(course.totalConvocatorias ?? 0),
        },
        {
          id: 'estado',
          header: 'Estado',
          render: (course) => {
            const status = resolveCatalogActiveStatus(course.active)
            const visual = staffStatusVisual(status)
            return <DirectoryStatusPill label={visual.label} pillClass={visual.pillClass} dotClass={visual.dotClass} />
          },
        },
      ]}
      rows={courseRows}
      loading={loading}
      error={error}
      emptyTitle="No se encontraron cursos"
      onRowOpen={(course) => handleViewCourse(course)}
      onRowEdit={(course) => router.push(`/dashboard/cursos/${course.id}/editar`)}
      renderGrid={(pageRows) => (
        <div className={ACADEMIC_LISTING_GRID_CLASS} role="region" aria-label="Lista de cursos">
          {pageRows.map((course) => (
            <AcademicEntityCard
              key={course.id}
              title={course.nombre}
              subtitle={COURSE_TYPE_CONFIG[getCourseType(course)]?.label}
              fallbackImage={course.imagenPortada || undefined}
              onClick={() => handleViewCourse(course)}
              onCtaClick={() => router.push(`/dashboard/cursos/${course.id}/editar`)}
            />
          ))}
        </div>
      )}
    />
  )
}

export default function CursosPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3" data-oid="rhi_4_9">
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
