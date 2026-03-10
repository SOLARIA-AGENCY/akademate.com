'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Plus,
  BookOpen,
  Target,
  FileText,
  Clock,
  Users,
  Calendar,
} from 'lucide-react'
import {
  ConvocationGeneratorModal,
  type ConvocationFormData,
} from '@payload-config/components/ui/ConvocationGeneratorModal'
import type { PlantillaCurso } from '@/types'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface CourseTemplate {
  id: number | string
  nombre: string
  area: string
  tipo: string
  imagenPortada: string
  descripcion: string
  duracionReferencia: number
  precioReferencia: number
  totalConvocatorias: number
  objetivos: string[]
  contenidos: string[]
  active: boolean
  created_at: string
  updated_at: string
  subvencionado?: boolean
  porcentajeSubvencion?: number
}

type ConvocationStatus =
  | 'enrollment_open'
  | 'draft'
  | 'published'
  | 'enrollment_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

interface Convocation {
  id: string
  estado: ConvocationStatus
  plazasTotales: number
  plazasOcupadas: number
  fechaInicio: string
  fechaFin: string
  horario: string | null
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface CourseTypeConfig {
  label: string
  bgColor: string
  hoverColor: string
  textColor: string
  borderColor: string
  dotColor: string
}

const COURSE_TYPE_CONFIG: Record<string, CourseTypeConfig> = {
  privados: {
    label: 'PRIVADO',
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-600',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-600',
  },
  ocupados: {
    label: 'OCUPADOS',
    bgColor: 'bg-green-600',
    hoverColor: 'hover:bg-green-700',
    textColor: 'text-green-600',
    borderColor: 'border-green-600',
    dotColor: 'bg-green-600',
  },
  desempleados: {
    label: 'DESEMPLEADOS',
    bgColor: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-600',
    dotColor: 'bg-blue-600',
  },
  teleformacion: {
    label: 'TELEFORMACION',
    bgColor: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-600',
    dotColor: 'bg-orange-600',
  },
  'ciclo-medio': {
    label: 'CICLO MEDIO',
    bgColor: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    dotColor: 'bg-red-500',
  },
  'ciclo-superior': {
    label: 'CICLO SUPERIOR',
    bgColor: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    textColor: 'text-red-600',
    borderColor: 'border-red-600',
    dotColor: 'bg-red-600',
  },
}

function getCourseTypeConfig(type: string): CourseTypeConfig {
  return COURSE_TYPE_CONFIG[type] ?? COURSE_TYPE_CONFIG.privados
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase())
}

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()

  // Unwrap params (Next.js 15 pattern)
  const { id } = React.use(params)

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  // Hero image fallback
  const [heroImgError, setHeroImgError] = React.useState(false)

  // Data state
  const [courseTemplate, setCourseTemplate] = React.useState<CourseTemplate | null>(null)
  const [courseConvocations, setCourseConvocations] = React.useState<Convocation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadingConvocations, setLoadingConvocations] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch course data
  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        console.log(`[CURSO_DETALLE] Cargando curso ID: ${id}`)

        const response = await fetch(`/api/cursos`, {
          cache: 'no-cache',
        })

        const result = (await response.json()) as ApiResponse<CourseTemplate[]>

        if (result.success && result.data) {
          // Find course by ID (convert to number if needed)
          const course = result.data.find(
            (c: CourseTemplate) => c.id === parseInt(id) || c.id === id
          )

          if (course) {
            setCourseTemplate(course)
            console.log(`[CURSO_DETALLE] ✅ Curso cargado:`, course.nombre)
          } else {
            setError('Curso no encontrado')
            console.log(`[CURSO_DETALLE] ❌ Curso ID ${id} no encontrado`)
          }
        } else {
          setError(result.error ?? 'Error al cargar curso')
        }
      } catch (err) {
        console.error('[CURSO_DETALLE] ❌ Error fetching course:', err)
        setError('Error de conexión al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    void fetchCourse()
  }, [id])

  // Fetch convocations for this course
  const fetchConvocations = React.useCallback(async () => {
    try {
      setLoadingConvocations(true)
      console.log(`[CONVOCATORIAS] Cargando convocatorias para curso ${id}`)

      const response = await fetch(`/api/convocatorias?courseId=${id}`, {
        cache: 'no-cache',
      })

      const result = (await response.json()) as ApiResponse<Convocation[]>

      if (result.success) {
        setCourseConvocations(result.data ?? [])
        console.log(`[CONVOCATORIAS] ✅ ${result.data?.length ?? 0} convocatorias cargadas`)
      } else {
        console.error('[CONVOCATORIAS] ❌ Error:', result.error)
      }
    } catch (err) {
      console.error('[CONVOCATORIAS] ❌ Error fetching convocations:', err)
    } finally {
      setLoadingConvocations(false)
    }
  }, [id])

  // Load convocations on mount
  React.useEffect(() => {
    if (id) {
      void fetchConvocations()
    }
  }, [id, fetchConvocations])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="e8tepo1">
        <Card className="w-full max-w-md" data-oid="t2pl7go">
          <CardContent className="py-12 text-center" data-oid="5-w_ro0">
            <p className="text-muted-foreground" data-oid="yyrlo60">
              Cargando curso...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error or not found
  if (error || !courseTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="twe5ckq">
        <Card className="w-full max-w-md" data-oid="fqy.ezt">
          <CardHeader data-oid="mqr.ajq">
            <CardTitle data-oid="8rv0wwp">Curso no encontrado</CardTitle>
            <CardDescription data-oid="z4vl5pl">
              {error ?? `El curso con ID ${id} no existe`}
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="q1m-y:i">
            <Button onClick={() => router.push('/cursos')} data-oid="qa44dxr">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="nera8_-" />
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const courseTemplateForModal: PlantillaCurso = {
    id: String(courseTemplate.id),
    nombre: courseTemplate.nombre,
    descripcion: courseTemplate.descripcion,
    imagenPortada: courseTemplate.imagenPortada,
    area: courseTemplate.area,
    tipo: courseTemplate.tipo as PlantillaCurso['tipo'],
    duracionReferencia: courseTemplate.duracionReferencia,
    precioReferencia: courseTemplate.precioReferencia,
    objetivos: courseTemplate.objetivos,
    contenidos: courseTemplate.contenidos,
    totalConvocatorias: courseTemplate.totalConvocatorias,
    active: courseTemplate.active,
    subvencionado: courseTemplate.subvencionado,
    porcentajeSubvencion: courseTemplate.porcentajeSubvencion,
    created_at: courseTemplate.created_at,
    updated_at: courseTemplate.updated_at,
  }

  const typeConfig = getCourseTypeConfig(courseTemplate.tipo ?? 'privados')

  const handleViewConvocation = (convocationId: string) => {
    router.push(`/cursos/${id}/convocatoria/${convocationId}`)
  }

  const handleCreateConvocation = async (formData: ConvocationFormData) => {
    try {
      console.log('[CONVOCATORIA] Creando convocatoria:', formData)

      const response = await fetch('/api/convocatorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: id,
          ...formData,
        }),
      })

      const result = (await response.json()) as ApiResponse<Convocation>

      if (result.success) {
        console.log('[CONVOCATORIA] ✅ Convocatoria creada:', result.data)
        setIsModalOpen(false)

        // Refresh convocations list
        await fetchConvocations()

        // TODO: Mostrar toast de éxito
        alert('✅ Convocatoria creada exitosamente')
      } else {
        console.error('[CONVOCATORIA] ❌ Error:', result.error)
        alert(`❌ Error al crear convocatoria: ${result.error}`)
      }
    } catch (createError) {
      console.error('[CONVOCATORIA] ❌ Error de red:', createError)
      alert('❌ Error de conexión al crear convocatoria')
    }
  }

  return (
    <div className="space-y-6" data-oid="2o0vkn-">
      <PageHeader
        title={toTitleCase(courseTemplate.nombre)}
        description="Detalle y gestión del curso"
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-2" data-oid="t9s2k4q">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/cursos')}
              data-oid="-1jp6hn"
            >
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="1t0za3d" />
              Volver
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/cursos/${id}/editar`)}
              data-oid="stbbm44"
            >
              <Edit className="mr-2 h-4 w-4" data-oid="8jyzcdp" />
              Editar Curso
            </Button>
            <Button onClick={() => setIsModalOpen(true)} data-oid="i_itqo7">
              <Plus className="mr-2 h-4 w-4" data-oid="oo1izbv" />
              Nueva Convocatoria
            </Button>
          </div>
        }
        data-oid="dq5zcwd"
      />

      {/* Main Content: 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="q1qtbub">
        {/* LEFT SIDE: 2/3 - Course Information */}
        <div className="lg:col-span-2 space-y-6" data-oid="iry5lp6">
          {/* Hero Image - Reduced height for better reading space */}
          <Card data-oid="p525z2h">
            <CardContent className="p-0" data-oid="kwd6d8a">
              <div
                className="relative h-56 overflow-hidden rounded-t-lg bg-muted"
                data-oid="wnurond"
              >
                {courseTemplate.imagenPortada && !heroImgError ? (
                  <img
                    src={courseTemplate.imagenPortada}
                    alt={courseTemplate.nombre}
                    className="w-full h-full object-cover"
                    onError={() => setHeroImgError(true)}
                    data-oid="2q7ft:t"
                  />
                ) : (
                  <img
                    src="/placeholder-course.svg?v=2"
                    alt={courseTemplate.nombre}
                    className="w-full h-full object-cover"
                    data-oid="nbzcwzm"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs with Course Details */}
          <Card data-oid="j-jbzo:">
            <Tabs defaultValue="info" className="w-full" data-oid="k64gvcl">
              <CardHeader data-oid="z9xsqyd">
                <TabsList className="grid w-full grid-cols-4" data-oid="7zdtaav">
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    data-oid="9x_ba6m"
                  >
                    Información
                  </TabsTrigger>
                  <TabsTrigger
                    value="objetivos"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    data-oid="__853_-"
                  >
                    Objetivos
                  </TabsTrigger>
                  <TabsTrigger
                    value="contenidos"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    data-oid="kshszxg"
                  >
                    Contenidos
                  </TabsTrigger>
                  <TabsTrigger
                    value="recursos"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    data-oid="e40wrot"
                  >
                    Recursos
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent data-oid="m14xk8k">
                {/* INFO TAB */}
                <TabsContent value="info" className="space-y-6" data-oid="niotipa">
                  <div data-oid="rluao14">
                    <h3 className="text-lg font-semibold mb-2" data-oid="aj4-kx.">
                      Descripción
                    </h3>
                    <p className="text-muted-foreground leading-relaxed" data-oid="mm4uo1o">
                      {courseTemplate.descripcion}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-oid="xrwm8ns">
                    <div
                      className="flex items-center gap-3 p-3 border rounded-lg"
                      data-oid="zdieclb"
                    >
                      <Clock className="h-5 w-5 text-muted-foreground" data-oid="6xi7:j2" />
                      <div data-oid="a2tma5m">
                        <p className="text-xs text-muted-foreground" data-oid="xcukr0f">
                          Duración
                        </p>
                        <p className="font-semibold" data-oid="wc2zdz-">
                          {courseTemplate.duracionReferencia}H
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-3 border rounded-lg" data-oid="8afnddj">
                      <p className="text-xs text-muted-foreground" data-oid="vh9lo0f">
                        Tipo
                      </p>
                      <Badge
                        className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white w-fit`}
                        data-oid="l4br7m5"
                      >
                        {typeConfig.label}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1 p-3 border rounded-lg" data-oid="yrlfygc">
                      <p className="text-xs text-muted-foreground" data-oid="cvpga-q">
                        Área temática
                      </p>
                      <p className="font-semibold" data-oid="nguk1ha">
                        {courseTemplate.area}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* OBJETIVOS TAB */}
                <TabsContent value="objetivos" className="space-y-4" data-oid="599kha:">
                  <div data-oid="y.wy8x3">
                    <h3
                      className="text-lg font-semibold mb-3 flex items-center gap-2"
                      data-oid="kjs-4-_"
                    >
                      <Target className="h-5 w-5" data-oid=":x-uooa" />
                      Objetivos del Curso
                    </h3>
                    <ul className="space-y-2" data-oid="3if2c8d">
                      {courseTemplate.objetivos?.length > 0 ? (
                        courseTemplate.objetivos.map((objetivo: string, index: number) => (
                          <li key={index} className="flex gap-3" data-oid=":.mn15h">
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold"
                              data-oid="fo7mu15"
                            >
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground" data-oid="n7g.tmt">
                              {objetivo}
                            </span>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic" data-oid="ilx7cak">
                          No hay objetivos definidos
                        </p>
                      )}
                    </ul>
                  </div>
                </TabsContent>

                {/* CONTENIDOS TAB */}
                <TabsContent value="contenidos" className="space-y-4" data-oid="hg2lww0">
                  <div data-oid="xw8bq.:">
                    <h3
                      className="text-lg font-semibold mb-3 flex items-center gap-2"
                      data-oid="c5:2frl"
                    >
                      <BookOpen className="h-5 w-5" data-oid="a3apv1g" />
                      Contenidos del Programa
                    </h3>
                    <ul className="space-y-2" data-oid="5mheqm4">
                      {courseTemplate.contenidos?.length > 0 ? (
                        courseTemplate.contenidos.map((contenido: string, index: number) => (
                          <li
                            key={index}
                            className="flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                            data-oid="5rji03n"
                          >
                            <span
                              className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold"
                              data-oid="icz4p31"
                            >
                              {index + 1}
                            </span>
                            <span data-oid="yxovfo9">{contenido}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic" data-oid="4u2xnfz">
                          No hay contenidos definidos
                        </p>
                      )}
                    </ul>
                  </div>
                </TabsContent>

                {/* RECURSOS TAB */}
                <TabsContent value="recursos" className="space-y-4" data-oid="tdbo6vg">
                  <div data-oid=".c23ia8">
                    <h3
                      className="text-lg font-semibold mb-3 flex items-center gap-2"
                      data-oid="6gv.2ev"
                    >
                      <FileText className="h-5 w-5" data-oid="cg_-ytu" />
                      Recursos Disponibles
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4" data-oid="r8zr02x">
                      Aquí se mostrarán los PDFs, documentos y materiales del curso
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/cursos/${id}/editar`)}
                      data-oid="frixw7r"
                    >
                      <Plus className="mr-2 h-4 w-4" data-oid="ylu.i0:" />
                      Gestionar recursos
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Convocations List */}
        <div className="lg:col-span-1 space-y-6" data-oid="ig6.o8.">
          <Card data-oid="3pohlap">
            <CardHeader data-oid="7bubi62">
              <CardTitle className="text-base flex items-center justify-between" data-oid="bqp9y0c">
                <span data-oid="bbxixz0">Convocatorias Generadas</span>
                <Badge variant="secondary" data-oid="gc9stm0">
                  {courseConvocations.length}
                </Badge>
              </CardTitle>
              <CardDescription data-oid="5xjgy.l">
                Instancias programadas de este curso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="okwtmel">
              {loadingConvocations ? (
                <div className="text-center py-8" data-oid="9i5enph">
                  <p className="text-sm text-muted-foreground" data-oid="4nhhifl">
                    Cargando convocatorias...
                  </p>
                </div>
              ) : courseConvocations.length === 0 ? (
                <div className="text-center py-8" data-oid="glxyupa">
                  <Calendar
                    className="h-12 w-12 text-muted-foreground mx-auto mb-3"
                    data-oid="zsl6ex1"
                  />
                  <p className="text-sm text-muted-foreground mb-4" data-oid="6c.wnpq">
                    No hay convocatorias programadas
                  </p>
                  <Button size="sm" onClick={() => setIsModalOpen(true)} data-oid="xc2ozuc">
                    <Plus className="mr-2 h-3 w-3" data-oid="t6me0xs" />
                    Nueva Convocatoria
                  </Button>
                </div>
              ) : (
                <div className="space-y-4" data-oid="3mh3o3-">
                  {courseConvocations.map((convocation: Convocation) => {
                    // Calculate occupation percentage
                    const ocupacion =
                      convocation.plazasTotales > 0
                        ? Math.round((convocation.plazasOcupadas / convocation.plazasTotales) * 100)
                        : 0

                    // Map status to Spanish
                    const statusLabels: Record<ConvocationStatus, string> = {
                      enrollment_open: 'Inscripción Abierta',
                      draft: 'Borrador',
                      published: 'Publicada',
                      enrollment_closed: 'Inscripción Cerrada',
                      in_progress: 'En Progreso',
                      completed: 'Completada',
                      cancelled: 'Cancelada',
                    }

                    return (
                      <Card
                        key={convocation.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleViewConvocation(convocation.id)}
                        data-oid="b7ivp2_"
                      >
                        <CardContent className="p-4 space-y-2" data-oid="3lvaz3f">
                          <div className="flex items-start justify-between" data-oid="a5dp9xv">
                            <Badge
                              variant={
                                convocation.estado === 'enrollment_open'
                                  ? 'default'
                                  : convocation.estado === 'draft'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                              data-oid="x6r9lrr"
                            >
                              {statusLabels[convocation.estado]}
                            </Badge>
                            <span className="text-xs text-muted-foreground" data-oid=".ocj296">
                              {ocupacion}% ocupado
                            </span>
                          </div>

                          <div className="space-y-1" data-oid="ll5zoa.">
                            <div className="flex items-center gap-2 text-xs" data-oid="idx:32c">
                              <Calendar
                                className="h-3 w-3 text-muted-foreground"
                                data-oid="21s931t"
                              />
                              <span data-oid="eefcipl">
                                {new Date(convocation.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                                {new Date(convocation.fechaFin).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs" data-oid="v94rs8t">
                              <Clock className="h-3 w-3 text-muted-foreground" data-oid="jg6qjr." />
                              <span data-oid="z8gz4_l">
                                {convocation.horario ?? 'Sin horario definido'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs" data-oid="ynrq2rs">
                              <Users className="h-3 w-3 text-muted-foreground" data-oid="0p32gbu" />
                              <span data-oid="g1ps1.j">
                                {convocation.plazasOcupadas}/{convocation.plazasTotales} plazas
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convocation Generator Modal */}
      <ConvocationGeneratorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        courseTemplate={courseTemplateForModal}
        onSubmit={handleCreateConvocation}
        data-oid="zxu4k.t"
      />
    </div>
  )
}
