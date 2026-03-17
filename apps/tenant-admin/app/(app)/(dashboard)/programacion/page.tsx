'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ResultsSummaryBar } from '@payload-config/components/ui/ResultsSummaryBar'
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
  User,
  BookOpen,
  Eye,
} from 'lucide-react'

interface ConvocatoriaApiResponse {
  id: string | number
  cursoNombre?: string
  cursoTipo?: string
  profesor?:
    | string
    | {
        full_name?: string | null
        first_name?: string | null
        last_name?: string | null
      }
  campusNombre?: string
  modalidad?: string
  horario?: string
  fechaInicio?: string
  fechaFin?: string
  plazasTotales?: number
  plazasOcupadas?: number
  estado?: string
}

interface ConvocatoriasApiPayload {
  data?: ConvocatoriaApiResponse[]
}

function formatProfessorName(profesor: ConvocatoriaApiResponse['profesor']): string {
  if (typeof profesor === 'string') {
    return profesor
  }

  if (profesor && typeof profesor === 'object') {
    const fullName = profesor.full_name?.trim()
    if (fullName) {
      return fullName
    }

    const firstName = profesor.first_name?.trim() ?? ''
    const lastName = profesor.last_name?.trim() ?? ''
    const combined = `${firstName} ${lastName}`.trim()
    if (combined) {
      return combined
    }
  }

  return 'Sin asignar'
}

interface Convocatoria {
  id: string
  curso: string
  codigo_curso: string
  profesor_principal: string
  sede: string
  aula: string
  horario_resumen: string
  fecha_inicio: string
  fecha_fin: string
  plazas_totales: number
  plazas_ocupadas: number
  estado: 'planificada' | 'abierta' | 'en_curso' | 'completada' | 'cancelada'
  tiene_conflictos?: boolean
  conflictos?: string[]
}

export default function ProgramacionPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [sedeFilter, setSedeFilter] = useState<string>('todas')
  const [estadoFilter, setEstadoFilter] = useState<string>('todos')
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchConvocatorias = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/convocatorias', { cache: 'no-cache' })
        if (!response.ok) {
          throw new Error('No se pudieron cargar las convocatorias')
        }

        const payload = (await response.json()) as ConvocatoriasApiPayload
        const data: ConvocatoriaApiResponse[] = Array.isArray(payload.data) ? payload.data : []
        const estadoMap: Record<string, Convocatoria['estado']> = {
          draft: 'planificada',
          enrollment_open: 'abierta',
          in_progress: 'en_curso',
          completed: 'completada',
          cancelled: 'cancelada',
        }
        const mapped: Convocatoria[] = data.map((conv) => ({
          id: String(conv.id),
          curso: conv.cursoNombre ?? 'Curso',
          codigo_curso: conv.cursoTipo ?? '—',
          profesor_principal: formatProfessorName(conv.profesor),
          sede: conv.campusNombre ?? 'Sin sede',
          aula: conv.modalidad ?? 'Sin aula',
          horario_resumen: conv.horario ?? '—',
          fecha_inicio: conv.fechaInicio ?? '',
          fecha_fin: conv.fechaFin ?? '',
          plazas_totales: conv.plazasTotales ?? 0,
          plazas_ocupadas: conv.plazasOcupadas ?? 0,
          estado: estadoMap[conv.estado ?? ''] ?? 'planificada',
          tiene_conflictos: false,
          conflictos: [],
        }))

        setConvocatorias(mapped)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar convocatorias')
        setConvocatorias([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchConvocatorias()
  }, [])

  // Calcular estadísticas
  const totalConvocatorias = convocatorias.length
  const convocatoriasActivas = convocatorias.filter(
    (c) => c.estado === 'abierta' || c.estado === 'en_curso'
  ).length
  const conflictosDetectados = convocatorias.filter((c) => c.tiene_conflictos).length
  const totalPlazas = convocatorias.reduce((sum, c) => sum + c.plazas_totales, 0)
  const totalOcupadas = convocatorias.reduce((sum, c) => sum + c.plazas_ocupadas, 0)
  const tasaOcupacion = totalPlazas > 0 ? Math.round((totalOcupadas / totalPlazas) * 100) : 0

  // Filtrar convocatorias
  const convocatoriasFiltradas = convocatorias.filter((convocatoria) => {
    const matchesSearch =
      searchTerm === '' ||
      convocatoria.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convocatoria.codigo_curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convocatoria.profesor_principal.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSede = sedeFilter === 'todas' || convocatoria.sede === sedeFilter

    const matchesEstado = estadoFilter === 'todos' || convocatoria.estado === estadoFilter

    return matchesSearch && matchesSede && matchesEstado
  })

  const TIPO_BADGE: Record<
    string,
    { label: string; variant: 'info' | 'warning' | 'success' | 'outline' }
  > = {
    privado: { label: 'Privado', variant: 'info' },
    privados: { label: 'Privado', variant: 'info' },
    desempleados: { label: 'Desempleados', variant: 'warning' },
    ocupados: { label: 'Ocupados', variant: 'success' },
  }

  const getEstadoBadge = (estado: Convocatoria['estado']) => {
    switch (estado) {
      case 'planificada':
        return (
          <Badge variant="info" data-oid="0x:yabc">
            Planificada
          </Badge>
        )
      case 'abierta':
        return (
          <Badge variant="success" data-oid="xggxrjb">
            Abierta
          </Badge>
        )
      case 'en_curso':
        return (
          <Badge variant="default" data-oid="to66v86">
            En Curso
          </Badge>
        )
      case 'completada':
        return (
          <Badge variant="neutral" data-oid="1tds3gk">
            Completada
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge variant="destructive" data-oid="hnlivsm">
            Cancelada
          </Badge>
        )
    }
  }

  const sedesDisponibles = Array.from(new Set(convocatorias.map((c) => c.sede))).filter(Boolean)

  const handleNuevaConvocatoria = () => {
    router.push('/programacion/nueva')
  }

  return (
    <div className="space-y-6" data-oid="eqo4ap_">
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="bf00nne"
        >
          Cargando convocatorias...
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="zanw132"
        >
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Programación de Convocatorias"
        description="Planificación de cursos, horarios y plazas"
        icon={Calendar}
        badge={
          <div className="flex items-center gap-2" data-oid="l.8ns_y">
            <Badge variant="secondary" data-oid="exx.:r9">
              {totalConvocatorias} total
            </Badge>
            <Badge variant="outline" data-oid="hys9l6v">
              {convocatoriasActivas} activas
            </Badge>
            {conflictosDetectados > 0 && (
              <Badge variant="destructive" data-oid="9n:mfo4">
                {conflictosDetectados} conflictos
              </Badge>
            )}
          </div>
        }
        actions={
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleNuevaConvocatoria}
            data-oid="buc9liy"
          >
            <Plus className="mr-2 h-4 w-4" data-oid="trrl_9z" />
            Nueva Convocatoria
          </Button>
        }
        data-oid="1f3sbg0"
      />

      {/* Filtros */}
      <Card className="p-4" data-oid="fmuoap3">
        <div className="flex flex-wrap items-center gap-3 xl:flex-nowrap" data-oid="tx_xu07">
          <div className="relative min-w-[260px] flex-1" data-oid="6evf7f.">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              data-oid="c4f2mjb"
            />
            <Input
              placeholder="Buscar curso o profesor..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-oid=":-fayg0"
            />
          </div>

          <Select value={sedeFilter} onValueChange={setSedeFilter} data-oid="86:1d59">
            <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="cuikzj1">
              <SelectValue placeholder="Todas las sedes" data-oid=":wo0-jl" />
            </SelectTrigger>
            <SelectContent data-oid="ofs5g2-">
              <SelectItem value="todas" data-oid="sloirp0">
                Todas las sedes
              </SelectItem>
              {sedesDisponibles.map((sede) => (
                <SelectItem key={sede} value={sede} data-oid=":t98v8:">
                  {sede}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estadoFilter} onValueChange={setEstadoFilter} data-oid="qvzl8wi">
            <SelectTrigger className="w-full min-w-[180px] md:w-[210px]" data-oid="8sz6j51">
              <SelectValue placeholder="Todos los estados" data-oid="4a-3.bp" />
            </SelectTrigger>
            <SelectContent data-oid="cnvgybb">
              <SelectItem value="todos" data-oid="p.svohl">
                Todos los estados
              </SelectItem>
              <SelectItem value="planificada" data-oid="2de48hp">
                Planificada
              </SelectItem>
              <SelectItem value="abierta" data-oid="6uwf803">
                Abierta
              </SelectItem>
              <SelectItem value="en_curso" data-oid="-xlnrfa">
                En Curso
              </SelectItem>
              <SelectItem value="completada" data-oid="py..dmk">
                Completada
              </SelectItem>
              <SelectItem value="cancelada" data-oid="tu8q_01">
                Cancelada
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="xl:ml-auto"
            onClick={() => {
              setSearchTerm('')
              setSedeFilter('todas')
              setEstadoFilter('todos')
            }}
            data-oid="j7_m5kz"
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      <ResultsSummaryBar
        count={convocatoriasFiltradas.length}
        entity="convocatorias"
        extra={`Ocupación media: ${tasaOcupacion}%`}
        data-oid="4tjaxjx"
      />

      {/* Lista de Convocatorias */}
      <div className="space-y-4" data-oid="5b5q2h-">
        {convocatoriasFiltradas.map((convocatoria) => {
          const ocupacionPercentage =
            convocatoria.plazas_totales > 0
              ? Math.round((convocatoria.plazas_ocupadas / convocatoria.plazas_totales) * 100)
              : 0

          return (
            <Card
              key={convocatoria.id}
              className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                convocatoria.tiene_conflictos
                  ? 'border-2 border-orange-500'
                  : 'border-2 border-transparent'
              }`}
              onClick={() => router.push(`/programacion/${convocatoria.id}`)}
              data-oid="srkyhl."
            >
              <div className="space-y-4" data-oid="mb-0ik5">
                {/* Header del card */}
                <div className="flex items-start justify-between" data-oid="ip9cgwk">
                  <div className="space-y-2" data-oid="twfwnn9">
                    <div className="flex items-center gap-3" data-oid="fv:wb61">
                      <BookOpen className="h-5 w-5 text-primary" data-oid="fmxqw71" />
                      <h3 className="text-lg font-semibold" data-oid=":1q6iml">
                        {convocatoria.curso}
                      </h3>
                      {convocatoria.tiene_conflictos && (
                        <AlertTriangle className="h-5 w-5 text-orange-500" data-oid="-b0ola1" />
                      )}
                    </div>
                    <div className="flex items-center gap-2" data-oid="dm_ta68">
                      {(() => {
                        const tipoConfig = TIPO_BADGE[
                          convocatoria.codigo_curso?.toLowerCase() ?? ''
                        ] ?? { label: convocatoria.codigo_curso, variant: 'outline' as const }
                        return (
                          <Badge variant={tipoConfig.variant} data-oid="x38_l.q">
                            {tipoConfig.label}
                          </Badge>
                        )
                      })()}
                      {getEstadoBadge(convocatoria.estado)}
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-oid="m7sws2-">
                  <div className="flex items-center gap-2" data-oid="8:3fjbf">
                    <MapPin className="h-4 w-4 text-muted-foreground" data-oid="qa:9lhy" />
                    <div data-oid="bhz6ql9">
                      <p className="text-xs text-muted-foreground" data-oid="xjjl4r4">
                        Sede y Aula
                      </p>
                      <p className="text-sm font-medium" data-oid="lyxpkq-">
                        {convocatoria.sede} - {convocatoria.aula}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" data-oid="5qgjlxt">
                    <User className="h-4 w-4 text-muted-foreground" data-oid="vm6cgdd" />
                    <div data-oid="dyh.5h2">
                      <p className="text-xs text-muted-foreground" data-oid="5nirfms">
                        Profesor
                      </p>
                      <p className="text-sm font-medium" data-oid="7m8c:cs">
                        {convocatoria.profesor_principal}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" data-oid=":-wy8oc">
                    <Calendar className="h-4 w-4 text-muted-foreground" data-oid="tz189ej" />
                    <div data-oid="3q0witu">
                      <p className="text-xs text-muted-foreground" data-oid="p1087q3">
                        Fechas
                      </p>
                      <p className="text-sm font-medium" data-oid="8ybo99e">
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

                  <div className="flex items-center gap-2" data-oid="iflajg6">
                    <Clock className="h-4 w-4 text-muted-foreground" data-oid="a97_f0e" />
                    <div data-oid="924_czx">
                      <p className="text-xs text-muted-foreground" data-oid="jxwpdtn">
                        Horario
                      </p>
                      <p className="text-sm font-medium" data-oid="gpnk:v2">
                        {convocatoria.horario_resumen}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ocupación */}
                <div className="space-y-2" data-oid="_.lc_j7">
                  <div className="flex items-center justify-between text-sm" data-oid="9i-6wi.">
                    <div className="flex items-center gap-2" data-oid="mf5dg1i">
                      <Users className="h-4 w-4 text-muted-foreground" data-oid="_jn6qzr" />
                      <span className="text-muted-foreground" data-oid="nl9gbby">
                        Ocupación
                      </span>
                    </div>
                    <span className="font-semibold" data-oid="fczj6hp">
                      {convocatoria.plazas_ocupadas}/{convocatoria.plazas_totales} plazas (
                      {ocupacionPercentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden" data-oid="qp62box">
                    <div
                      className={`h-full transition-all ${
                        ocupacionPercentage >= 90
                          ? 'bg-primary'
                          : ocupacionPercentage >= 70
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${ocupacionPercentage}%` }}
                      data-oid="z60nyz:"
                    />
                  </div>
                </div>

                {/* Conflictos (si existen) */}
                {convocatoria.tiene_conflictos && convocatoria.conflictos && (
                  <div
                    className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                    data-oid="h8w.xtx"
                  >
                    <div className="flex items-start gap-3" data-oid="b33g0n6">
                      <AlertTriangle
                        className="h-5 w-5 text-orange-500 mt-0.5"
                        data-oid="owxoaur"
                      />
                      <div className="flex-1 space-y-2" data-oid="6q-4hz2">
                        <p className="font-semibold text-orange-900" data-oid="szmneo3">
                          ⚠️ Conflictos Detectados ({convocatoria.conflictos.length})
                        </p>
                        <ul className="space-y-1" data-oid="h4u.-9u">
                          {convocatoria.conflictos.map((conflicto, idx) => (
                            <li key={idx} className="text-sm text-orange-700" data-oid="k6e:kny">
                              • {conflicto}
                            </li>
                          ))}
                        </ul>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 border-orange-500 text-orange-700 hover:bg-orange-100"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            alert('Abrir modal de resolución de conflictos')
                          }}
                          data-oid="ele3nvx"
                        >
                          Resolver Conflictos
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t" data-oid="np6:hg3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation()
                      router.push(`/planner?convocatoria=${convocatoria.id}`)
                    }}
                    data-oid="cz1y2dc"
                  >
                    <Eye className="mr-2 h-4 w-4" data-oid="wysr5.0" />
                    Ver detalle
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {convocatoriasFiltradas.length === 0 && (
        <Card className="p-12" data-oid="ksx6-ul">
          <div className="text-center space-y-4" data-oid="pdypgrq">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" data-oid="4395dmd" />
            <div data-oid="he.i6ky">
              <h3 className="text-lg font-semibold" data-oid="po_:g_i">
                No se encontraron convocatorias
              </h3>
              <p className="text-sm text-muted-foreground mt-2" data-oid="tn0t819">
                Intenta ajustar los filtros de búsqueda o crea una nueva convocatoria
              </p>
            </div>
            <Button variant="outline" onClick={handleNuevaConvocatoria} data-oid="kxux5p9">
              <Plus className="mr-2 h-4 w-4" data-oid="mp5v-u0" />
              Nueva Convocatoria
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
