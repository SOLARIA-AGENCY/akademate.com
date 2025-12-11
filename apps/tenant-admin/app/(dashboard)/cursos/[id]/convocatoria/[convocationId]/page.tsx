'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Progress } from '@payload-config/components/ui/progress'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  MapPin,
  DoorOpen,
  User,
  Users,
  Euro,
  BookOpen,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
// TODO: Fetch from Payload API
// import { instanciasData } from '@payload-config/data/mockCoursesData'
// import { plantillasCursosData } from '@payload-config/data/mockCourseTemplatesData'
const instanciasData: any[] = []
const plantillasCursosData: any[] = []
import { COURSE_TYPE_CONFIG, getCourseTypeConfig, type CourseTypeKey } from '@payload-config/lib/courseTypeConfig'

interface ConvocationDetailPageProps {
  params: Promise<{ id: string; convocationId: string }>
}

// Mock student data
const mockStudents = [
  { id: '1', nombre: 'María González', email: 'maria.g@email.com', phone: '+34 600 111 222', estado: 'confirmado' },
  { id: '2', nombre: 'Juan Martínez', email: 'juan.m@email.com', phone: '+34 600 222 333', estado: 'confirmado' },
  { id: '3', nombre: 'Ana López', email: 'ana.l@email.com', phone: '+34 600 333 444', estado: 'confirmado' },
  { id: '4', nombre: 'Carlos Ruiz', email: 'carlos.r@email.com', phone: '+34 600 444 555', estado: 'pendiente' },
  { id: '5', nombre: 'Laura Sánchez', email: 'laura.s@email.com', phone: '+34 600 555 666', estado: 'confirmado' },
]

export default function ConvocationDetailPage({ params }: ConvocationDetailPageProps) {
  const router = useRouter()
  const { id, convocationId } = React.use(params)

  // Find convocation
  const convocation = instanciasData.find((c) => c.id === convocationId)
  const courseTemplate = plantillasCursosData.find((c) => c.id === id)

  if (!convocation || !courseTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convocatoria no encontrada</CardTitle>
            <CardDescription>La convocatoria con ID {convocationId} no existe</CardDescription>
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

  const typeConfig = getCourseTypeConfig((convocation.tipo || 'privados') as CourseTypeKey)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/cursos/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{convocation.nombreCurso}</h1>
            <p className="text-muted-foreground">
              {convocation.codigoCompleto} • Convocatoria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/cursos/${id}/convocatoria/${convocationId}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Convocatoria
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <Badge
              className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-sm font-bold uppercase`}
            >
              {typeConfig.label}
            </Badge>
            <Badge
              variant={
                convocation.estado === 'abierta'
                  ? 'default'
                  : convocation.estado === 'planificada'
                    ? 'secondary'
                    : 'outline'
              }
              className="text-sm font-bold uppercase"
            >
              {convocation.estado}
            </Badge>
            <Badge variant="outline" className="text-sm uppercase">
              {convocation.modalidad}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE: 2/3 - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Image */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img
                  src={convocation.imagenPortada}
                  alt={convocation.nombreCurso}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule and Details */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Convocatoria</CardTitle>
              <CardDescription>Fechas, horarios y ubicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Fecha de Inicio</p>
                    <p className="font-semibold">{formatDate(convocation.fechaInicio)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Fecha de Finalización</p>
                    <p className="font-semibold">{formatDate(convocation.fechaFin)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Horario</p>
                    <p className="font-semibold text-sm">{convocation.horario}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Duración</p>
                    <p className="font-semibold">{convocation.duracionHoras} Horas</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Sede</p>
                    <p className="font-semibold">{convocation.sedeNombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <DoorOpen className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Aula</p>
                    <p className="font-semibold">{convocation.aulaNombre}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profesor Asignado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{convocation.profesorNombre}</p>
                  <p className="text-sm text-muted-foreground">Profesor Principal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>Alumnos Inscritos ({mockStudents.length})</CardTitle>
              <CardDescription>
                Lista de estudiantes matriculados en esta convocatoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{student.nombre}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={student.estado === 'confirmado' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {student.estado === 'confirmado' ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {student.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: 1/3 - Stats and Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Occupancy Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ocupación de Plazas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Plazas ocupadas</span>
                  <span className="text-2xl font-bold">
                    {convocation.plazasOcupadas}/{convocation.plazasTotales}
                  </span>
                </div>
                <Progress value={convocation.porcentajeOcupacion} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {convocation.porcentajeOcupacion}% de capacidad
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plazas disponibles</span>
                  <span className="text-lg font-bold text-green-600">
                    {convocation.plazasTotales - convocation.plazasOcupadas}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmados</span>
                  <span className="text-lg font-bold">
                    {mockStudents.filter((s) => s.estado === 'confirmado').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pendientes</span>
                  <span className="text-lg font-bold text-orange-600">
                    {mockStudents.filter((s) => s.estado === 'pendiente').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de Precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Precio del curso:</span>
                {convocation.precio === 0 ? (
                  <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold">
                    100% SUBVENCIONADO
                  </Badge>
                ) : (
                  <span className={`text-xl font-bold ${typeConfig.textColor}`}>
                    {convocation.precio}€
                  </span>
                )}
              </div>

              {convocation.precioConDescuento && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Precio con descuento:</span>
                  <span className="text-xl font-bold text-red-600">
                    {convocation.precioConDescuento}€
                  </span>
                </div>
              )}

              {convocation.subvencionado !== 'no' && convocation.entidadesFinanciadoras.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">
                    Financiado por:
                  </p>
                  <div className="space-y-2">
                    {convocation.entidadesFinanciadoras.map((entidad: any) => (
                      <div
                        key={entidad.id}
                        className="px-3 py-2 bg-secondary rounded text-sm font-medium text-center"
                      >
                        {entidad.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Alumnos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Comunicación
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Ver en Calendario
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
