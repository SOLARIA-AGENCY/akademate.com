'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Plus,
  BookOpen,
  Target,
  FileText,
  Euro,
  Clock,
  Users,
  Calendar,
  MapPin,
  GraduationCap,
} from 'lucide-react'
import { COURSE_TYPE_CONFIG, getCourseTypeConfig, type CourseTypeKey } from '@payload-config/lib/courseTypeConfig'
import { ConvocationCard } from '@payload-config/components/ui/ConvocationCard'
import {
  ConvocationGeneratorModal,
  type ConvocationFormData,
} from '@payload-config/components/ui/ConvocationGeneratorModal'

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()

  // Unwrap params (Next.js 15 pattern)
  const { id } = React.use(params)

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  // Data state
  const [courseTemplate, setCourseTemplate] = React.useState<any>(null)
  const [courseConvocations, setCourseConvocations] = React.useState<any[]>([])
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

        const result = await response.json()

        if (result.success) {
          // Find course by ID (convert to number if needed)
          const course = result.data.find((c: any) => c.id === parseInt(id) || c.id === id)

          if (course) {
            setCourseTemplate(course)
            console.log(`[CURSO_DETALLE] ✅ Curso cargado:`, course.nombre)
          } else {
            setError('Curso no encontrado')
            console.log(`[CURSO_DETALLE] ❌ Curso ID ${id} no encontrado`)
          }
        } else {
          setError(result.error || 'Error al cargar curso')
        }
      } catch (err) {
        console.error('[CURSO_DETALLE] ❌ Error fetching course:', err)
        setError('Error de conexión al cargar el curso')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [id])

  // Fetch convocations for this course
  const fetchConvocations = React.useCallback(async () => {
    try {
      setLoadingConvocations(true)
      console.log(`[CONVOCATORIAS] Cargando convocatorias para curso ${id}`)

      const response = await fetch(`/api/convocatorias?courseId=${id}`, {
        cache: 'no-cache',
      })

      const result = await response.json()

      if (result.success) {
        setCourseConvocations(result.data || [])
        console.log(`[CONVOCATORIAS] ✅ ${result.data?.length || 0} convocatorias cargadas`)
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
      fetchConvocations()
    }
  }, [id, fetchConvocations])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Cargando curso...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error or not found
  if (error || !courseTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Curso no encontrado</CardTitle>
            <CardDescription>
              {error || `El curso con ID ${id} no existe`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/cursos')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const typeConfig = getCourseTypeConfig((courseTemplate.tipo || 'privados') as CourseTypeKey)

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

      const result = await response.json()

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
    } catch (error) {
      console.error('[CONVOCATORIA] ❌ Error de red:', error)
      alert('❌ Error de conexión al crear convocatoria')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/cursos')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{courseTemplate.nombre}</h1>
              <p className="text-muted-foreground">
                {courseTemplate.area} • Detalle de la plantilla del curso
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/cursos/${id}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Curso
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Convocatoria
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-6">
            <Badge
              className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-sm font-bold uppercase`}
            >
              {typeConfig.label}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Área:</span>
              <Badge variant="outline">{courseTemplate.area}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Convocatorias:</span>
              <Badge variant="secondary">{courseTemplate.totalConvocatorias} activas</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE: 2/3 - Course Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero Image - Reduced height for better reading space */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img
                  src={courseTemplate.imagenPortada}
                  alt={courseTemplate.nombre}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs with Course Details */}
          <Card>
            <Tabs defaultValue="info" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                  <TabsTrigger value="contenidos">Contenidos</TabsTrigger>
                  <TabsTrigger value="recursos">Recursos</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* INFO TAB */}
                <TabsContent value="info" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {courseTemplate.descripcion}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Duración</p>
                        <p className="font-semibold">{courseTemplate.duracionReferencia}H</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Euro className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="font-semibold">
                          {courseTemplate.precioReferencia && courseTemplate.precioReferencia > 0
                            ? `${courseTemplate.precioReferencia}€`
                            : 'SUBVENCIONADO'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Área</p>
                        <p className="font-semibold text-xs">{courseTemplate.area}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* OBJETIVOS TAB */}
                <TabsContent value="objetivos" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objetivos del Curso
                    </h3>
                    <ul className="space-y-2">
                      {courseTemplate.objetivos?.length > 0 ? (
                        courseTemplate.objetivos.map((objetivo, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground">{objetivo}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No hay objetivos definidos</p>
                      )}
                    </ul>
                  </div>
                </TabsContent>

                {/* CONTENIDOS TAB */}
                <TabsContent value="contenidos" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Contenidos del Programa
                    </h3>
                    <ul className="space-y-2">
                      {courseTemplate.contenidos?.length > 0 ? (
                        courseTemplate.contenidos.map((contenido, index) => (
                          <li key={index} className="flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                          <span>{contenido}</span>
                        </li>
                      ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No hay contenidos definidos</p>
                      )}
                    </ul>
                  </div>
                </TabsContent>

                {/* RECURSOS TAB */}
                <TabsContent value="recursos" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Recursos Disponibles
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Aquí se mostrarán los PDFs, documentos y materiales del curso
                    </p>
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Recurso
                    </Button>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Convocations List */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Convocatorias Generadas</span>
                <Badge variant="secondary">{courseConvocations.length}</Badge>
              </CardTitle>
              <CardDescription>
                Instancias programadas de este curso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConvocations ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Cargando convocatorias...</p>
                </div>
              ) : courseConvocations.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No hay convocatorias programadas
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Nueva Convocatoria
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseConvocations.map((convocation) => {
                    // Calculate occupation percentage
                    const ocupacion = convocation.plazasTotales > 0
                      ? Math.round((convocation.plazasOcupadas / convocation.plazasTotales) * 100)
                      : 0

                    // Map status to Spanish
                    const statusLabels: Record<string, string> = {
                      'enrollment_open': 'Inscripción Abierta',
                      'draft': 'Borrador',
                      'published': 'Publicada',
                      'enrollment_closed': 'Inscripción Cerrada',
                      'in_progress': 'En Progreso',
                      'completed': 'Completada',
                      'cancelled': 'Cancelada',
                    }

                    return (
                      <Card
                        key={convocation.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleViewConvocation(convocation.id)}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <Badge
                              variant={
                                convocation.estado === 'enrollment_open'
                                  ? 'default'
                                  : convocation.estado === 'draft'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                            >
                              {statusLabels[convocation.estado] || convocation.estado}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ocupacion}% ocupado
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {new Date(convocation.fechaInicio).toLocaleDateString('es-ES')} - {new Date(convocation.fechaFin).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{convocation.horario || 'Sin horario definido'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span>
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
        courseTemplate={courseTemplate}
        onSubmit={handleCreateConvocation}
      />
    </div>
  )
}
