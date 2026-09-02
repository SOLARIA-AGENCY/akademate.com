'use client'

import * as React from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Badge } from '@payload-config/components/ui/badge'
import { OcupacionBadge } from '@payload-config/components/ui/OcupacionBadge'
import { useRouter } from 'next/navigation'
import { GraduationCap, Users, BookOpen, Clock, Calendar, Plus } from 'lucide-react'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanLimitModal } from '@/components/ui/PlanLimitModal'
import { UsageBar } from '@/components/ui/UsageBar'
import { getLimit } from '@/lib/planLimits'
import { CicloListItem } from '@payload-config/components/ui/CicloListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { SegmentedToggle } from '@payload-config/components/ui/SegmentedToggle'
import { ListingKpiStrip } from '@payload-config/components/ui/listing-kpi'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import { useViewPreference } from '@/hooks/useViewPreference'
import {
  ListingSearch,
  PremiumDirectoryShell,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import type { CicloPlantilla } from '@/types'
import { resolvePayloadMediaSrc } from '@/app/lib/payload-media-url'
import { SortableListHeader } from '@payload-config/components/ui/sortable-table-head'
import { useCycleSort } from '@payload-config/hooks/useCycleSort'
import type { SortKind } from '@payload-config/lib/cycle-sort'

const CICLOS_SORT_KINDS = {
  nombre: 'text',
  modalidad: 'text',
  horas: 'number',
  convocatorias: 'number',
  sede: 'text',
  nivel: 'text',
} as const satisfies Record<string, SortKind>

function CicloImageWithFallback({ src, alt }: { src: string; alt: string }) {
  return <EntityThumb src={src} alt={alt} fallback="cycle" size="md" />
}

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

interface CycleApiItem {
  id: string
  name?: string
  slug?: string
  level?: 'grado_superior' | 'grado_medio' | 'fp_basica' | 'certificado_profesionalidad'
  image?: { url?: string; filename?: string } | string | number | null
  totalHours?: number
  modality?: string
}

interface CycleApiResponse {
  docs?: CycleApiItem[]
}

const mockCiclosData: Ciclo[] = []

function formatCycleStartDate(value?: string): string {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCycleLevelLabel(value: string): string {
  if (value === 'Grado Superior') return 'Ciclo superior'
  if (value === 'Grado Medio') return 'Ciclo medio'
  return value
}

export default function TodosLosCiclosPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('ciclos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [nivelFilter, setNivelFilter] = React.useState<string>('todos')
  const [familiaFilter, setFamiliaFilter] = React.useState<string>('todas')
  const [modalidadFilter, setModalidadFilter] = React.useState<string>('todas')
  const [ciclosData, setCiclosData] = React.useState<Ciclo[]>(mockCiclosData)
  const [convocatoriasCountMap, setConvocatoriasCountMap] = React.useState<Record<string, number>>({})
  const [activeConvocatoriasMap, setActiveConvocatoriasMap] = React.useState<Record<string, number>>({})
  const [sedeNamesMap, setSedeNamesMap] = React.useState<Record<string, string[]>>({})
  const [startDateMap, setStartDateMap] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [limitModal, setLimitModal] = React.useState<{ open: boolean; current: number; limit: number } | null>(null)
  const { state: sortState, toggle: toggleSort, reset: resetSort, sortRows } = useCycleSort(CICLOS_SORT_KINDS)

  const { checkLimit, plan } = usePlanLimits()

  const handleNuevoCiclo = () => {
    const { allowed, limit } = checkLimit('ciclos', ciclosData.length)
    if (!allowed) {
      setLimitModal({ open: true, current: ciclosData.length, limit })
      return
    }
    router.push('/dashboard/ciclos/nuevo')
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
        const docs: CycleApiItem[] = Array.isArray(payload.docs) ? payload.docs : []
        const mapped: Ciclo[] = docs.map((cycle: CycleApiItem) => {
          const level = cycle.level
          const nivelLabel: 'Grado Medio' | 'Grado Superior' = (() => {
            switch (level) {
              case 'grado_superior':
                return 'Grado Superior'
              case 'grado_medio':
                return 'Grado Medio'
              case 'fp_basica':
                return 'Grado Medio'
              case 'certificado_profesionalidad':
                return 'Grado Medio'
              default:
                return 'Grado Medio'
            }
          })()

          // Resolve image URL from API response (depth=1 returns object)
          let imageUrl = ''
          if (cycle.image) {
            if (typeof cycle.image === 'object' && cycle.image !== null) {
              imageUrl = resolvePayloadMediaSrc(cycle.image) ?? ''
            } else if (typeof cycle.image === 'string') {
              imageUrl = resolvePayloadMediaSrc(cycle.image) ?? ''
            }
          }

          return {
            id: cycle.id,
            nombre: cycle.name ?? 'Ciclo sin nombre',
            codigo: cycle.slug ?? cycle.id,
            familia: 'Formación Profesional',
            duracion: cycle.totalHours ? `${cycle.totalHours} horas` : '2000 horas',
            modalidad: cycle.modality ?? 'Presencial',
            plazas: 0,
            plazas_ocupadas: 0,
            cursos_activos: 0,
            nivel: nivelLabel,
            imagen: imageUrl,
            competencias: [],
            salidas_profesionales: [],
            requisitos: '',
          }
        })

        if (mapped.length > 0) {
          setCiclosData(mapped)
        }

        // Fetch convocatorias to count per cycle and resolve campus names
        try {
          const crRes = await fetch('/api/convocatorias?limit=500', { cache: 'no-cache' })
          if (crRes.ok) {
            const crPayload = await crRes.json() as {
              data?: Array<{
                cicloId?: string | number | null
                cycleId?: string | number | null
                campusNombre?: string | null
                estado?: string | null
                fechaInicio?: string | null
              }>
            }
            const crDocs = Array.isArray(crPayload.data) ? crPayload.data : []
            const countMap: Record<string, number> = {}
            const activeMap: Record<string, number> = {}
            const nextStartDateMap: Record<string, string> = {}
            const nextSedeMap: Record<string, string[]> = {}
            for (const cr of crDocs) {
              const cycleId = cr.cicloId ?? cr.cycleId
              if (cycleId) {
                const key = String(cycleId)
                countMap[key] = (countMap[key] || 0) + 1
                const status = String(cr.estado ?? '').toLowerCase()
                if (status === 'enrollment_open' || status === 'in_progress' || status === 'published') {
                  activeMap[key] = (activeMap[key] || 0) + 1
                }
                const campusName = typeof cr.campusNombre === 'string' ? cr.campusNombre.trim() : ''
                if (campusName && !/^sin sede$/i.test(campusName)) {
                  const names = nextSedeMap[key] ?? []
                  if (!names.includes(campusName)) names.push(campusName)
                  nextSedeMap[key] = names
                }
                if (cr.fechaInicio && (!nextStartDateMap[key] || new Date(cr.fechaInicio) < new Date(nextStartDateMap[key]))) {
                  nextStartDateMap[key] = cr.fechaInicio
                }
              }
            }
            setConvocatoriasCountMap(countMap)
            setActiveConvocatoriasMap(activeMap)
            setSedeNamesMap(nextSedeMap)
            setStartDateMap(nextStartDateMap)
          }
        } catch { /* convocatorias count is optional */ }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar ciclos')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCycles()
  }, [])

  // Get unique familias
  const familiasProfesionales = Array.from(new Set(ciclosData.map((c) => c.familia)))

  // Filter ciclos
  const filteredCiclos = sortRows(
    ciclosData.filter((ciclo) => {
      const matchesSearch =
        searchTerm === '' ||
        ciclo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ciclo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ciclo.familia.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesNivel = nivelFilter === 'todos' || ciclo.nivel === nivelFilter
      const matchesFamilia = familiaFilter === 'todas' || ciclo.familia === familiaFilter
      const matchesModalidad = modalidadFilter === 'todas' || ciclo.modalidad === modalidadFilter

      return matchesSearch && matchesNivel && matchesFamilia && matchesModalidad
    }),
    (ciclo, column) => {
      switch (column) {
        case 'nombre':
          return ciclo.nombre
        case 'modalidad':
          return ciclo.modalidad
        case 'horas':
          return Number.parseInt(ciclo.duracion, 10) || ciclo.plazas
        case 'convocatorias':
          return activeConvocatoriasMap[ciclo.id] || 0
        case 'sede':
          return (sedeNamesMap[ciclo.id] ?? []).join(', ')
        case 'nivel':
          return formatCycleLevelLabel(ciclo.nivel)
        default: {
          const _never: never = column
          return _never
        }
      }
    },
  )

  React.useEffect(() => {
    resetSort()
  }, [searchTerm, nivelFilter, familiaFilter, modalidadFilter, resetSort])

  const handleViewCiclo = (ciclo: Ciclo) => {
    router.push(`/dashboard/ciclos/${ciclo.id}`)
  }

  const totalPlazas = ciclosData.reduce((sum, ciclo) => sum + (ciclo.plazas || 0), 0)
  const totalOcupadas = ciclosData.reduce((sum, ciclo) => sum + (ciclo.plazas_ocupadas || 0), 0)
  const totalConvocatorias = Object.values(convocatoriasCountMap).reduce((sum, count) => sum + count, 0)
  const ocupacionLabel = totalPlazas > 0 ? `${Math.round((totalOcupadas / totalPlazas) * 100)}%` : '0%'

  return (
    <div className="space-y-6" data-oid="6:b:ajh">
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="5lsp0x."
        >
          Cargando ciclos...
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="cgpy245"
        >
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Ciclos formativos"
        icon={GraduationCap}
        actions={
          <Button onClick={handleNuevoCiclo} data-oid="b-t2nxs">
            <Plus className="h-4 w-4" />
            Nuevo Ciclo
          </Button>
        }
        data-oid="3mf2uf_"
      />

      <ListingKpiStrip
        items={[
          { label: 'Ciclos', value: ciclosData.length },
          { label: 'Convocatorias', value: totalConvocatorias },
          { label: 'Plazas', value: totalPlazas },
          { label: 'Ocupación', value: ocupacionLabel },
        ]}
      />

      <UsageBar resource="ciclos" current={ciclosData.length} limit={getLimit(plan, 'ciclos')} />

      <PremiumDirectoryShell
        search={
          <ListingSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar ciclos..."
          />
        }
        segments={
          <SegmentedToggle
            ariaLabel="Nivel"
            value={nivelFilter}
            onValueChange={setNivelFilter}
            options={[
              { value: 'todos', label: 'Todas', count: ciclosData.length },
              {
                value: 'Grado Medio',
                label: 'Medio',
                count: ciclosData.filter((ciclo) => ciclo.nivel === 'Grado Medio').length,
              },
              {
                value: 'Grado Superior',
                label: 'Superior',
                count: ciclosData.filter((ciclo) => ciclo.nivel === 'Grado Superior').length,
              },
            ]}
          />
        }
        filters={
          <>
            <Select value={familiaFilter} onValueChange={setFamiliaFilter}>
              <SelectTrigger className="h-10 w-full min-w-0 bg-background md:w-[220px]">
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
              <SelectTrigger className="h-10 w-full min-w-0 bg-background md:w-[210px]">
                <SelectValue placeholder="Todas las modalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las modalidades</SelectItem>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                <SelectItem value="Telemático">Telemático</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        view={<ViewToggle view={view} onViewChange={setView} />}
      />

      <SortableListHeader
        sort={sortState}
        onToggle={toggleSort}
        trailingClassName="h-8 w-[4.5rem] shrink-0"
        columns={[
          { id: 'nombre', label: 'Programa', className: 'flex-1' },
          { id: 'modalidad', label: 'Modalidad', className: 'hidden w-28 sm:block' },
          { id: 'horas', label: 'Horas', className: 'hidden w-20 md:block' },
          { id: 'convocatorias', label: 'Convocatoria', className: 'hidden w-28 lg:block' },
          { id: 'sede', label: 'Sede(s)', className: 'hidden max-w-[12rem] xl:block' },
          { id: 'nivel', label: 'Nivel', className: 'hidden w-[140px] lg:block' },
        ]}
      />

      {/* Ciclos Grid o Lista */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-oid=":4nn89j">
          {filteredCiclos.map((ciclo) => {
            return (
              <Card
                key={ciclo.id}
                className="cursor-pointer overflow-hidden"
                onClick={() => handleViewCiclo(ciclo)}
                data-oid=":0o:6ca"
              >
                <CardContent className="flex items-start gap-4 p-5">
                  <CicloImageWithFallback src={ciclo.imagen} alt={ciclo.nombre} />
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-semibold" data-oid="5d1ydem">
                        {ciclo.nombre}
                      </h3>
                      <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
                        {formatCycleLevelLabel(ciclo.nivel)}
                      </Badge>
                    </div>

                  <div className="grid grid-cols-2 gap-3 text-sm" data-oid="3f71-jd">
                    <div className="flex items-center gap-2" data-oid="ow16bo-">
                      <Clock className="h-4 w-4 text-muted-foreground" data-oid="hyt1r7o" />
                      <span className="text-muted-foreground" data-oid="a-dsvyr">
                        {ciclo.duracion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" data-oid="d.zcful">
                      <Calendar className="h-4 w-4 text-muted-foreground" data-oid="emzpq8s" />
                      <span className="text-muted-foreground" data-oid="ezbruhl">
                        {formatCycleStartDate(startDateMap[ciclo.id])}
                      </span>
                    </div>
                    <div className="flex items-center gap-2" data-oid="sbi.hss">
                      <Users className="h-4 w-4 text-muted-foreground" data-oid="sl7:rmi" />
                      <OcupacionBadge
                        plazasOcupadas={ciclo.plazas_ocupadas}
                        plazasTotal={ciclo.plazas}
                        showBar={true}
                        data-oid="8in6pi9"
                      />
                    </div>
                    <div className="flex items-center gap-2" data-oid="kca:zxv">
                      <BookOpen className="h-4 w-4 text-muted-foreground" data-oid="ppeqt-2" />
                      <span className="text-muted-foreground" data-oid="iufe18:">
                        {ciclo.modalidad} · {activeConvocatoriasMap[ciclo.id] || 0} convocatorias activas
                      </span>
                    </div>
                    {(sedeNamesMap[ciclo.id] ?? []).length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {(sedeNamesMap[ciclo.id] ?? []).join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <Button variant="outline" className="w-full" data-oid="-a8i1t0">
                    Ver ciclo
                  </Button>
                </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full" data-oid="1_bu5w6">
          {filteredCiclos.map((ciclo) => {
            // Adapt local Ciclo interface to CicloPlantilla expected by CicloListItem
            const adaptedCiclo: CicloPlantilla = {
              id: ciclo.id,
              nombre: ciclo.nombre,
              codigo: ciclo.codigo,
              tipo: ciclo.nivel === 'Grado Medio' ? 'medio' : 'superior',
              familia_profesional: ciclo.familia,
              descripcion: '',
              objetivos: [],
              perfil_profesional: '',
              duracion_total_horas: parseInt(ciclo.duracion) || 2000,
              image: ciclo.imagen,
              color: '',
              cursos: Array.from({ length: convocatoriasCountMap[ciclo.id] || 0 }, (_, index) => ({
                id: `curso-${ciclo.id}-${index}`,
                ciclo_plantilla_id: ciclo.id,
                nombre: `Curso ${index + 1}`,
                codigo: `CUR-${index + 1}`,
                descripcion: '',
                duracion_horas: 0,
                orden: index + 1,
                objetivos: [],
                contenidos: [],
              })),
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
                modalidad={ciclo.modalidad}
                duracionLabel={ciclo.duracion}
                convocatoriasActivas={activeConvocatoriasMap[ciclo.id] || 0}
                sedes={sedeNamesMap[ciclo.id] ?? []}
                onClick={() => handleViewCiclo(ciclo)}
                data-oid=".f03sp4"
              />
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredCiclos.length === 0 && (
        <Card data-oid="6-p1b-0">
          <CardContent className="space-y-4 py-12 text-center" data-oid="z52psj1">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground" data-oid="x:2y::h" />
            <div data-oid="ou218kn">
              <h3 className="text-lg font-semibold" data-oid="h_di84_">
                No se encontraron ciclos
              </h3>
              <p className="text-sm text-muted-foreground mt-2" data-oid="4t_dlbk">
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
              data-oid="4kcbc8a"
            >
              Limpiar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {limitModal && (
        <PlanLimitModal
          open={limitModal.open}
          onClose={() => setLimitModal(null)}
          resource="ciclos"
          current={limitModal.current}
          limit={limitModal.limit}
          plan={plan}
        />
      )}
    </div>
  )
}
