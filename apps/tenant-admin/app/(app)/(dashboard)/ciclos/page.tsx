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
import { Search, GraduationCap, Users, BookOpen, Clock, Calendar } from 'lucide-react'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { PlanLimitModal } from '@/components/ui/PlanLimitModal'
import { UsageBar } from '@/components/ui/UsageBar'
import { getLimit } from '@/lib/planLimits'
import { CicloListItem } from '@payload-config/components/ui/CicloListItem'
import { ViewToggle } from '@payload-config/components/ui/ViewToggle'
import { useViewPreference } from '@/hooks/useViewPreference'
import type { CicloPlantilla } from '@/types'

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
}

interface CycleApiResponse {
  docs?: CycleApiItem[]
}

const mockCiclosData: Ciclo[] = []

export default function TodosLosCiclosPage() {
  const router = useRouter()
  const [view, setView] = useViewPreference('ciclos')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [nivelFilter, setNivelFilter] = React.useState<string>('todos')
  const [familiaFilter, setFamiliaFilter] = React.useState<string>('todas')
  const [modalidadFilter, setModalidadFilter] = React.useState<string>('todas')
  const [ciclosData, setCiclosData] = React.useState<Ciclo[]>(mockCiclosData)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [limitModal, setLimitModal] = React.useState<{ open: boolean; current: number; limit: number } | null>(null)

  const { checkLimit, plan } = usePlanLimits()

  const handleNuevoCiclo = () => {
    const { allowed, limit } = checkLimit('ciclos', ciclosData.length)
    if (!allowed) {
      setLimitModal({ open: true, current: ciclosData.length, limit })
      return
    }
    router.push('/ciclos/nuevo')
  }

  // Calculate stats
  React.useEffect(() => {
    const fetchCycles = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/cycles?limit=100&sort=order_display', {
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

          return {
            id: cycle.id,
            nombre: cycle.name ?? 'Ciclo sin nombre',
            codigo: cycle.slug ?? cycle.id,
            familia: 'Formación Profesional',
            duracion: '2000 horas',
            modalidad: 'Presencial',
            plazas: 0,
            plazas_ocupadas: 0,
            cursos_activos: 0,
            nivel: nivelLabel,
            imagen:
              'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop',
            competencias: [],
            salidas_profesionales: [],
            requisitos: '',
          }
        })

        if (mapped.length > 0) {
          setCiclosData(mapped)
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
    if (ciclo.nivel === 'Grado Medio') {
      router.push(`/ciclos-medio#${ciclo.id}`)
    } else {
      router.push(`/ciclos-superior#${ciclo.id}`)
    }
  }

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
        badge={
          <Badge variant="secondary" data-oid="0h5qd3g">
            {filteredCiclos.length} visibles
          </Badge>
        }
        actions={
          <Button onClick={handleNuevoCiclo} data-oid="b-t2nxs">
            Nuevo Ciclo
          </Button>
        }
        data-oid="3mf2uf_"
      />

      <UsageBar resource="ciclos" current={ciclosData.length} limit={getLimit(plan, 'ciclos')} />

      <Card data-oid="53yqrbe">
        <CardContent className="pt-6" data-oid="lw2_c6e">
          <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap" data-oid="3s0b37y">
            <div className="relative min-w-[260px] flex-1" data-oid="yjrwj2q">
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
              <SelectTrigger className="w-full min-w-[170px] md:w-[210px]" data-oid="pi-0r.c">
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
              <SelectTrigger className="w-full min-w-[180px] md:w-[220px]" data-oid="p:13p.5">
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
              <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="zi8xj2q">
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" data-oid=":4nn89j">
          {filteredCiclos.map((ciclo) => {
            return (
              <Card
                key={ciclo.id}
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                onClick={() => handleViewCiclo(ciclo)}
                data-oid=":0o:6ca"
              >
                <div className="relative h-48 overflow-hidden bg-muted" data-oid="w45omv8">
                  <CicloImageWithFallback
                    src={ciclo.imagen}
                    alt={ciclo.nombre}
                    data-oid="aj9q1sq"
                  />
                  <div className="absolute left-4 top-4" data-oid="k5si0ro">
                    <span
                      className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-black/70 backdrop-blur-sm border border-white/20 text-white"
                      data-oid="t:ogjxr"
                    >
                      {ciclo.nivel}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5" data-oid="h8hjlvu">
                  <div data-oid="_y4z4k5">
                    <div className="flex items-center gap-2 mb-2" data-oid="gnpou1n">
                      <Badge variant="outline" className="text-xs" data-oid="7g8h7r4">
                        {ciclo.codigo}
                      </Badge>
                      <Badge variant="outline" className="text-xs" data-oid="o6vh94q">
                        {ciclo.familia}
                      </Badge>
                    </div>
                    <h3 className="line-clamp-2 text-base font-semibold" data-oid="5d1ydem">
                      {ciclo.nombre}
                    </h3>
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
                        {ciclo.modalidad}
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
                        {ciclo.cursos_activos} cursos
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
        <div className="flex flex-col gap-2" data-oid="1_bu5w6">
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
              cursos: Array.from({ length: ciclo.cursos_activos }, (_, index) => ({
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
