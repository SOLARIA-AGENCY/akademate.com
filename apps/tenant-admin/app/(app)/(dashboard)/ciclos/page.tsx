'use client'

import * as React from 'react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  GraduationCap,
  Plus,
} from 'lucide-react'
import { usePlanLimits } from '@payload-config/hooks/usePlanLimits'
import {
  ACADEMIC_LISTING_GRID_CLASS,
  AcademicEntityCard,
  DirectoryAvatarCell,
  DirectoryNeutralBadge,
  PremiumDirectoryShell,
  computeCycleDirectoryKpis,
} from '@payload-config/components/akademate/dashboard'
import { useViewPreference } from '@payload-config/hooks/useViewPreference'
import { downloadCsv, type ExportColumn } from '@/app/lib/dashboard-export'

const DASHBOARD_PROGRAMS_PATH = '/dashboard/ciclos'

interface Ciclo {
  id: string
  nombre: string
  codigo: string
  familia: string
  area: string
  areaColor: string
  areaCode?: string
  duracion: string
  modalidad: string
  cursos_activos: number
  nivel: 'Grado Medio' | 'Grado Superior'
  imagen: string
  competencias: string[]
  salidas_profesionales: string[]
  requisitos: string
}

interface CycleApiItem {
  id: string
  name?: string
  slug?: string
  level?: 'grado_superior' | 'grado_medio' | 'fp_basica' | 'certificado_profesionalidad'
  image?: { url?: string; filename?: string } | string | number | null
  totalHours?: number
  modality?: string
  active?: boolean
}

interface CycleApiResponse {
  docs?: CycleApiItem[]
}

interface CourseRunApiItem {
  cycle?: { id?: string | number } | string | number | null
  start_date?: string | null
}

interface CourseAreaApiItem {
  cycleId?: string | number | null
  area?: string
  areaColor?: string
  areaCode?: string
}

const mockCiclosData: Ciclo[] = []

function formatCycleStartDate(value?: string): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseCalendarDate(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function validAreaColor(value?: string | null): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value ?? '') ? value! : '#64748B'
}

function AreaBadge({ name, color }: { name: string; color: string; href: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: validAreaColor(color) }} />
      {name}
    </Badge>
  )
}

export default function TodosLosCiclosPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('ciclos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [nivelFilter, setNivelFilter] = React.useState<string>('todos')
  const [familiaFilter, setFamiliaFilter] = React.useState<string>('todas')
  const [modalidadFilter, setModalidadFilter] = React.useState<string>('todas')
  const [ciclosData, setCiclosData] = React.useState<Ciclo[]>(mockCiclosData)
  const [convocatoriasCountsReady, setConvocatoriasCountsReady] = React.useState(false)
  const [convocatoriasCountMap, setConvocatoriasCountMap] = React.useState<Record<string, number>>(
    {}
  )
  const [startDateMap, setStartDateMap] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const { checkLimit } = usePlanLimits()
  const canCreateCycle = checkLimit('ciclos', ciclosData.length).allowed

  const handleNuevoCiclo = () => {
    if (!canCreateCycle) return
    router.push(`${DASHBOARD_PROGRAMS_PATH}/nuevo`)
  }

  // Calculate stats
  React.useEffect(() => {
    const fetchCycles = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/cycles?limit=100&sort=order_display&depth=1', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar los ciclos')
        }

        const payload: CycleApiResponse = (await response.json()) as CycleApiResponse
        const docs: CycleApiItem[] = (Array.isArray(payload.docs) ? payload.docs : []).filter(
          (cycle) => cycle.active !== false
        )
        const areaMap: Record<string, { area: string; areaColor: string; areaCode?: string }> = {}

        try {
          const coursesRes = await fetch(
            '/api/cursos?includeInactive=true&includeCycles=true&limit=1000',
            {
              cache: 'no-cache',
            }
          )
          if (coursesRes.ok) {
            const coursesPayload = (await coursesRes.json()) as { data?: CourseAreaApiItem[] }
            const cycleCourses = Array.isArray(coursesPayload.data) ? coursesPayload.data : []
            for (const course of cycleCourses) {
              if (!course.cycleId) continue
              const key = String(course.cycleId)
              if (areaMap[key]) continue
              areaMap[key] = {
                area: course.area || 'Área por definir',
                areaColor: validAreaColor(course.areaColor),
                areaCode: course.areaCode,
              }
            }
          }
        } catch {
          // El badge de área es informativo; la lista de ciclos no debe caer si falla.
        }

        const mapped: Ciclo[] = docs.map((cycle: CycleApiItem) => {
          const level = cycle.level
          const nivelLabel: 'Grado Medio' | 'Grado Superior' = (() => {
            switch (level) {
              case 'grado_superior':
                return 'Grado Superior'
              case 'grado_medio':
              case 'fp_basica':
              case 'certificado_profesionalidad':
              case undefined:
                return 'Grado Medio'
              default: {
                const _exhaustive: never = level
                void _exhaustive
                return 'Grado Medio'
              }
            }
          })()

          // Resolve image URL from API response (depth=1 returns object)
          let imageUrl = ''
          if (cycle.image) {
            if (typeof cycle.image === 'object' && cycle.image !== null && 'url' in cycle.image) {
              imageUrl =
                (cycle.image as { url?: string; filename?: string }).url ??
                ((cycle.image as { filename?: string }).filename
                  ? `/media/${(cycle.image as { filename?: string }).filename}`
                  : '')
            } else if (typeof cycle.image === 'string') {
              imageUrl = cycle.image
            }
            // typeof cycle.image === 'number' means depth didn't expand — skip
          }

          return {
            id: cycle.id,
            nombre: cycle.name ?? 'Ciclo sin nombre',
            codigo: cycle.slug ?? cycle.id,
            familia: 'Formación Profesional',
            area: areaMap[String(cycle.id)]?.area ?? 'Área por definir',
            areaColor: areaMap[String(cycle.id)]?.areaColor ?? '#64748B',
            areaCode: areaMap[String(cycle.id)]?.areaCode,
            duracion: cycle.totalHours ? `${cycle.totalHours} horas` : '2000 horas',
            modalidad: cycle.modality ?? 'Presencial',
            cursos_activos: 0,
            nivel: nivelLabel,
            imagen: imageUrl,
            competencias: [],
            salidas_profesionales: [],
            requisitos: '',
          }
        })

        setCiclosData(mapped)

        // Fetch convocatorias (course-runs) to count per cycle
        try {
          const crRes = await fetch('/api/course-runs?depth=0&limit=500', { cache: 'no-cache' })
          if (crRes.ok) {
            const crPayload = await crRes.json()
            const crDocs: CourseRunApiItem[] = Array.isArray(crPayload.docs) ? crPayload.docs : []
            const countMap: Record<string, number> = {}
            const nextStartDateMap: Record<string, string> = {}
            for (const cr of crDocs) {
              const cycleId = typeof cr.cycle === 'object' && cr.cycle ? cr.cycle.id : cr.cycle
              if (cycleId) {
                const key = String(cycleId)
                countMap[key] = (countMap[key] || 0) + 1
                if (
                  cr.start_date &&
                  (!nextStartDateMap[key] ||
                    (parseCalendarDate(cr.start_date)?.getTime() ?? 0) <
                      (parseCalendarDate(nextStartDateMap[key])?.getTime() ?? 0))
                ) {
                  nextStartDateMap[key] = cr.start_date
                }
              }
            }
            setConvocatoriasCountMap(countMap)
            setStartDateMap(nextStartDateMap)
            setConvocatoriasCountsReady(true)
          } else {
            // 404/403/etc: keep counts unknown instead of painting fake zeros.
            setConvocatoriasCountsReady(false)
          }
        } catch {
          setConvocatoriasCountsReady(false)
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar ciclos')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCycles()
  }, [])

  const formatConvocatoriasCount = (cicloId: string | number): string => {
    if (!convocatoriasCountsReady) return '—'
    return String(convocatoriasCountMap[cicloId] || 0)
  }

  // Get unique familias
  const familiasProfesionales = Array.from(new Set(ciclosData.map((c) => c.familia)))

  // Filter ciclos
  const filteredCiclos = ciclosData.filter((ciclo) => {
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
    router.push(`${DASHBOARD_PROGRAMS_PATH}/${ciclo.id}`)
  }

  const exportColumns: ExportColumn<Ciclo>[] = [
    { header: 'Codigo', getValue: (ciclo) => ciclo.codigo },
    { header: 'Ciclo', getValue: (ciclo) => ciclo.nombre },
    { header: 'Nivel', getValue: (ciclo) => ciclo.nivel },
    { header: 'Familia', getValue: (ciclo) => ciclo.familia },
    { header: 'Area', getValue: (ciclo) => ciclo.area },
    { header: 'Duracion', getValue: (ciclo) => ciclo.duracion },
    { header: 'Modalidad', getValue: (ciclo) => ciclo.modalidad },
    { header: 'Convocatorias', getValue: (ciclo) => formatConvocatoriasCount(ciclo.id) },
    { header: 'Proximo inicio', getValue: (ciclo) => formatCycleStartDate(startDateMap[ciclo.id]) },
  ]

  const handleCsv = () =>
    downloadCsv(
      `ciclos-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredCiclos
    )

  const kpis = computeCycleDirectoryKpis(
    filteredCiclos.map((ciclo) => ({
      nivel: ciclo.nivel,
      convocatorias: convocatoriasCountsReady ? convocatoriasCountMap[ciclo.id] || 0 : 0,
    })),
  )

  return (
    <PremiumDirectoryShell
      scroll="page"
      title="Programas formativos"
      description="Ciclos y programas oficiales con familia, modalidad y convocatorias."
      icon={GraduationCap}
      entityPlural="programas"
      extraToolbar={
        <Button
          onClick={handleNuevoCiclo}
          size="sm"
          className="shrink-0"
          disabled={!canCreateCycle}
          title={canCreateCycle ? undefined : 'Límite del plan'}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </Button>
      }
      onExportCsv={handleCsv}
      kpis={kpis}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Buscar..."
      segments={[
        { id: 'todos', label: 'Todos' },
        { id: 'Grado Medio', label: 'Grado Medio' },
        { id: 'Grado Superior', label: 'Grado Superior' },
      ]}
      selectedSegment={nivelFilter}
      onSegmentChange={setNivelFilter}
      filters={[
        {
          id: 'familia',
          label: 'Familia',
          value: familiaFilter,
          onChange: setFamiliaFilter,
          options: [
            { value: 'todas', label: 'Familia: Todas' },
            ...familiasProfesionales.map((familia) => ({ value: familia, label: familia })),
          ],
        },
        {
          id: 'modalidad',
          label: 'Modalidad',
          value: modalidadFilter,
          onChange: setModalidadFilter,
          options: [
            { value: 'todas', label: 'Modalidad: Todas' },
            { value: 'Presencial', label: 'Presencial' },
            { value: 'Semipresencial', label: 'Semipresencial' },
            { value: 'Telemático', label: 'Telemático' },
          ],
        },
      ]}
      viewMode={view === 'grid' ? 'grid' : 'table'}
      onViewModeChange={(mode) => setView(mode === 'grid' ? 'grid' : 'list')}
      columns={[
        {
          id: 'programa',
          header: 'Programa',
          render: (ciclo) => (
            <DirectoryAvatarCell
              name={ciclo.nombre}
              subtitle={ciclo.codigo}
              src={ciclo.imagen}
              initials={(ciclo.nombre ?? 'P').slice(0, 2).toUpperCase()}
            />
          ),
        },
        {
          id: 'nivel',
          header: 'Nivel',
          render: (ciclo) => (
            <DirectoryNeutralBadge>
              {ciclo.nivel === 'Grado Superior' ? 'Grado superior' : 'Grado medio'}
            </DirectoryNeutralBadge>
          ),
        },
        {
          id: 'area',
          header: 'Área',
          render: (ciclo) =>
            (
              <DirectoryNeutralBadge>{ciclo.area || 'Sin área'}</DirectoryNeutralBadge>
            ),
        },
        {
          id: 'modalidad',
          header: 'Modalidad',
          render: (ciclo) => ciclo.modalidad || '—',
        },
        {
          id: 'convocatorias',
          header: 'Convocatorias',
          render: (ciclo) => formatConvocatoriasCount(ciclo.id),
        },
      ]}
      rows={filteredCiclos}
      loading={isLoading}
      error={errorMessage}
      emptyTitle="No se encontraron ciclos"
      emptyDescription={isLoading ? 'Cargando programas...' : undefined}
      onRowOpen={handleViewCiclo}
      onRowEdit={(ciclo) => router.push(`${DASHBOARD_PROGRAMS_PATH}/${ciclo.id}/editar`)}
      renderGrid={(pageRows) => (
        <div className={ACADEMIC_LISTING_GRID_CLASS} role="region" aria-label="Lista de ciclos" data-oid=":4nn89j">
          {pageRows.map((ciclo) => (
            <AcademicEntityCard
              key={ciclo.id}
              title={ciclo.nombre}
              image={ciclo.imagen}
              onClick={() => handleViewCiclo(ciclo)}
              onCtaClick={() => router.push(`${DASHBOARD_PROGRAMS_PATH}/${ciclo.id}/editar`)}
              badge={
                <Badge variant="static" className="bg-info text-info-foreground hover:bg-info">
                  {ciclo.nivel === 'Grado Superior' ? 'Grado superior' : 'Grado medio'}
                </Badge>
              }
              tiles={[
                <AreaBadge
                  key="area"
                  name={ciclo.area}
                  color={ciclo.areaColor}
                  href={`${DASHBOARD_PROGRAMS_PATH}/${ciclo.id}/editar`}
                />,
                <span key="conv" className="inline-flex items-center justify-end gap-1" title={convocatoriasCountsReady ? `${convocatoriasCountMap[ciclo.id] || 0} convocatorias` : 'Convocatorias no disponibles'}>
                  <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{formatConvocatoriasCount(ciclo.id)}</span>
                </span>,
              ]}
            />
          ))}
        </div>
      )}
    />
  )
}
