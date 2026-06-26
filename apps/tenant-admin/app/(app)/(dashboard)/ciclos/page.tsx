'use client'

import * as React from 'react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Input } from '@payload-config/components/ui/input'
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
import {
  Search,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Calendar,
  Plus,
  Printer,
  Download,
} from 'lucide-react'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanLimitModal } from '@/components/ui/PlanLimitModal'
import { UsageBar } from '@/components/ui/UsageBar'
import { getLimit } from '@/lib/planLimits'
import { CicloListItem } from '@payload-config/components/ui/CicloListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@/hooks/useViewPreference'
import type { CicloPlantilla } from '@/types'
import { downloadCsv, printTable, type ExportColumn } from '@/app/lib/dashboard-export'

function CicloImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = React.useState(false)
  if (!src || hasError) {
    return (
      <img
        src="/placeholder-course.svg?v=2"
        alt={alt}
        className="w-full h-full object-cover"
        data-oid="u6p303e"
      />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
      onError={() => setHasError(true)}
      data-oid="1r.am3p"
    />
  )
}

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
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCycleLevelLabel(value: string): string {
  return value.toUpperCase()
}

function validAreaColor(value?: string | null): string {
  return /^#[0-9A-Fa-f]{6}$/.test(value ?? '') ? value! : '#64748B'
}

function AreaBadge({ name, color }: { name: string; color: string }) {
  return (
    <Badge variant="outline" className="gap-1.5 border-border bg-background text-[11px]">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: validAreaColor(color) }} />
      {name || 'Área por definir'}
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
  const [convocatoriasCountMap, setConvocatoriasCountMap] = React.useState<Record<string, number>>(
    {}
  )
  const [startDateMap, setStartDateMap] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [limitModal, setLimitModal] = React.useState<{
    open: boolean
    current: number
    limit: number
  } | null>(null)

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
                    new Date(cr.start_date) < new Date(nextStartDateMap[key]))
                ) {
                  nextStartDateMap[key] = cr.start_date
                }
              }
            }
            setConvocatoriasCountMap(countMap)
            setStartDateMap(nextStartDateMap)
          }
        } catch {
          /* convocatorias count is optional */
        }
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
    router.push(`/dashboard/ciclos/${ciclo.id}`)
  }

  const exportColumns: ExportColumn<Ciclo>[] = [
    { header: 'Codigo', getValue: (ciclo) => ciclo.codigo },
    { header: 'Ciclo', getValue: (ciclo) => ciclo.nombre },
    { header: 'Nivel', getValue: (ciclo) => ciclo.nivel },
    { header: 'Familia', getValue: (ciclo) => ciclo.familia },
    { header: 'Area', getValue: (ciclo) => ciclo.area },
    { header: 'Duracion', getValue: (ciclo) => ciclo.duracion },
    { header: 'Modalidad', getValue: (ciclo) => ciclo.modalidad },
    { header: 'Convocatorias', getValue: (ciclo) => convocatoriasCountMap[ciclo.id] || 0 },
    { header: 'Proximo inicio', getValue: (ciclo) => formatCycleStartDate(startDateMap[ciclo.id]) },
  ]

  const handlePrint = () => printTable('Ciclos Formativos', exportColumns, filteredCiclos)
  const handleCsv = () =>
    downloadCsv(
      `ciclos-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filteredCiclos
    )

  const totalConvocatorias = ciclosData.reduce(
    (sum, ciclo) => sum + (convocatoriasCountMap[ciclo.id] || 0),
    0
  )
  const stats = [
    { label: 'Total ciclos', value: ciclosData.length, icon: GraduationCap },
    {
      label: 'Grado Superior',
      value: ciclosData.filter((ciclo) => ciclo.nivel === 'Grado Superior').length,
      icon: BookOpen,
    },
    {
      label: 'Grado Medio',
      value: ciclosData.filter((ciclo) => ciclo.nivel === 'Grado Medio').length,
      icon: Users,
    },
    { label: 'Convocatorias', value: totalConvocatorias, icon: Calendar },
  ]

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
        title="Ciclos Formativos"
        description="Gestión unificada de ciclos de grado medio y superior."
        icon={GraduationCap}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button type="button" variant="outline" onClick={handleCsv}>
              <Download className="h-4 w-4" />
              Descargar CSV
            </Button>
            <Button onClick={handleNuevoCiclo} data-oid="b-t2nxs">
              <Plus className="h-4 w-4" />
              Nuevo Ciclo
            </Button>
          </div>
        }
        data-oid="3mf2uf_"
      />

      <UsageBar resource="ciclos" current={ciclosData.length} limit={getLimit(plan, 'ciclos')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-3">
              <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
              <Icon className="h-4 w-4 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card data-oid="53yqrbe">
        <CardContent className="pt-6" data-oid="lw2_c6e">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap" data-oid="3s0b37y">
            <div className="relative min-w-0 flex-1" data-oid="yjrwj2q">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                data-oid="_:q8q:p"
              />
              <Input
                placeholder="Buscar ciclos..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
                data-oid="04h2w4u"
              />
            </div>

            <Select value={nivelFilter} onValueChange={setNivelFilter} data-oid="blzx:fd">
              <SelectTrigger className="w-full min-w-0 md:w-[210px]" data-oid="pi-0r.c">
                <SelectValue placeholder="Todos los niveles" data-oid="hd:j28v" />
              </SelectTrigger>
              <SelectContent data-oid="igtax0_">
                <SelectItem value="todos" data-oid="ey2v6a_">
                  Todos los niveles
                </SelectItem>
                <SelectItem value="Grado Medio" data-oid="yw124d9">
                  Grado Medio
                </SelectItem>
                <SelectItem value="Grado Superior" data-oid="k0e::_c">
                  Grado Superior
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={familiaFilter} onValueChange={setFamiliaFilter} data-oid="c5ha4_7">
              <SelectTrigger className="w-full min-w-0 md:w-[220px]" data-oid="p:13p.5">
                <SelectValue placeholder="Todas las familias" data-oid="exi7wr:" />
              </SelectTrigger>
              <SelectContent data-oid="9:1vgmq">
                <SelectItem value="todas" data-oid="52xr:un">
                  Todas las familias
                </SelectItem>
                {familiasProfesionales.map((familia) => (
                  <SelectItem key={familia} value={familia} data-oid="6ahpvi.">
                    {familia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modalidadFilter} onValueChange={setModalidadFilter} data-oid=":5r4u9g">
              <SelectTrigger className="w-full min-w-0 md:w-[210px]" data-oid="zi8xj2q">
                <SelectValue placeholder="Todas las modalidades" data-oid=":09f_6q" />
              </SelectTrigger>
              <SelectContent data-oid="ixi74or">
                <SelectItem value="todas" data-oid="g9iyos8">
                  Todas las modalidades
                </SelectItem>
                <SelectItem value="Presencial" data-oid="a9v5sra">
                  Presencial
                </SelectItem>
                <SelectItem value="Semipresencial" data-oid="qfts69s">
                  Semipresencial
                </SelectItem>
                <SelectItem value="Telemático" data-oid="r8-1al8">
                  Telemático
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden xl:block xl:ml-auto" data-oid="3yrq3qi">
              <ViewToggle view={view} onViewChange={setView} data-oid="hbmlqvq" />
            </div>

            {(searchTerm ||
              nivelFilter !== 'todos' ||
              familiaFilter !== 'todas' ||
              modalidadFilter !== 'todas') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setNivelFilter('todos')
                  setFamiliaFilter('todas')
                  setModalidadFilter('todas')
                }}
                data-oid="cu2brtn"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ciclos Grid o Lista */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-oid=":4nn89j">
          {filteredCiclos.map((ciclo) => {
            return (
              <Card
                key={ciclo.id}
                className="relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => handleViewCiclo(ciclo)}
                data-oid=":0o:6ca"
              >
                <div
                  aria-hidden="true"
                  data-cycle-area-accent
                  className="absolute inset-y-0 right-0 z-10 w-1.5"
                  style={{ backgroundColor: validAreaColor(ciclo.areaColor) }}
                />
                <div className="relative h-56 overflow-hidden bg-muted" data-oid="w45omv8">
                  <CicloImageWithFallback
                    src={ciclo.imagen}
                    alt={ciclo.nombre}
                    data-oid="aj9q1sq"
                  />
                  <div className="absolute left-4 top-4" data-oid="k5si0ro">
                    <Badge
                      className="border-[#f2014b]/50 bg-[#f2014b] text-xs font-semibold text-white shadow-sm hover:bg-[#d80143]"
                      data-oid="t:ogjxr"
                    >
                      {formatCycleLevelLabel(ciclo.nivel)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 p-5" data-oid="h8hjlvu">
                  <div data-oid="_y4z4k5">
                    <h3 className="line-clamp-2 text-base font-semibold" data-oid="5d1ydem">
                      {ciclo.nombre}
                    </h3>
                    <div className="mt-2">
                      <AreaBadge name={ciclo.area} color={ciclo.areaColor} />
                    </div>
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
                        {convocatoriasCountMap[ciclo.id] || 0} convocatorias
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" data-oid="-a8i1t0">
                    Ver ciclo
                  </Button>
                </div>
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
              area: ciclo.area,
              areaColor: ciclo.areaColor,
              areaCode: ciclo.areaCode,
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
