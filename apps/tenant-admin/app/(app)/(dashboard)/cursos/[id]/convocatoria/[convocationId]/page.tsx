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
  BookOpen,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { COURSE_TYPE_CONFIG } from '@payload-config/lib/courseTypeConfig'

// TypeScript interfaces
interface CourseTypeConfig {
  label: string
  bgColor: string
  hoverColor: string
  textColor: string
  borderColor: string
  dotColor: string
}

interface FinancingEntity {
  id: string
  nombre: string
}

interface Convocation {
  id: string
  tipo?: string
  estado: string
  modalidad: string
  nombreCurso: string
  codigoCompleto: string
  imagenPortada: string
  fechaInicio: string
  fechaFin: string
  horario: string
  duracionHoras: number
  sedeNombre: string
  aulaNombre: string
  profesorNombre: string
  plazasOcupadas: number
  plazasTotales: number
  porcentajeOcupacion: number
  precio: number
  precioConDescuento?: number
  subvencionado: string
  entidadesFinanciadoras: FinancingEntity[]
}

interface CourseTemplate {
  id: string
  nombre: string
  descripcion?: string
}

interface Student {
  id: string
  nombre: string
  email: string
  phone: string
  estado: string
}

// TODO: Fetch from Payload API
// import { instanciasData } from '@payload-config/data/mockCoursesData'
// import { plantillasCursosData } from '@payload-config/data/mockCourseTemplatesData'
const instanciasData: Convocation[] = []
const plantillasCursosData: CourseTemplate[] = []

interface ConvocationDetailPageProps {
  params: Promise<{ id: string; convocationId: string }>
}

// Mock student data
const mockStudents: Student[] = [
  {
    id: '1',
    nombre: 'María González',
    email: 'maria.g@email.com',
    phone: '+34 600 111 222',
    estado: 'confirmado',
  },
  {
    id: '2',
    nombre: 'Juan Martínez',
    email: 'juan.m@email.com',
    phone: '+34 600 222 333',
    estado: 'confirmado',
  },
  {
    id: '3',
    nombre: 'Ana López',
    email: 'ana.l@email.com',
    phone: '+34 600 333 444',
    estado: 'confirmado',
  },
  {
    id: '4',
    nombre: 'Carlos Ruiz',
    email: 'carlos.r@email.com',
    phone: '+34 600 444 555',
    estado: 'pendiente',
  },
  {
    id: '5',
    nombre: 'Laura Sánchez',
    email: 'laura.s@email.com',
    phone: '+34 600 555 666',
    estado: 'confirmado',
  },
]

export default function ConvocationDetailPage({ params }: ConvocationDetailPageProps) {
  const router = useRouter()
  const { id, convocationId } = React.use(params)

  // Find convocation
  const convocation = instanciasData.find((c) => c.id === convocationId)
  const courseTemplate = plantillasCursosData.find((c) => c.id === id)

  if (!convocation || !courseTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" data-oid="5-68mx:">
        <Card className="w-full max-w-md" data-oid="0yzde0t">
          <CardHeader data-oid="tuavk6p">
            <CardTitle data-oid="pbe_j-5">Convocatoria no encontrada</CardTitle>
            <CardDescription data-oid=":32l4nf">
              La convocatoria con ID {convocationId} no existe
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="nilr6w.">
            <Button onClick={() => router.push('/cursos')} data-oid="3l4srf7">
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="x8zj6dk" />
              Volver a Cursos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const courseType = convocation.tipo ?? 'privados'
  const configMap = COURSE_TYPE_CONFIG as Record<string, CourseTypeConfig>
  const typeConfig: CourseTypeConfig = configMap[courseType] ?? configMap.privados

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6" data-oid="8yn2_04">
      <PageHeader
        title={convocation.nombreCurso}
        description={`${convocation.codigoCompleto} • Convocatoria`}
        icon={Calendar}
        actions={
          <div className="flex items-center gap-2" data-oid="wvaxqjr">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/cursos/${id}`)}
              data-oid=":5jxd_i"
            >
              <ArrowLeft className="h-4 w-4" data-oid="iuzxcoo" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/cursos/${id}/convocatoria/${convocationId}/editar`)}
              data-oid="33kki1v"
            >
              <Edit className="mr-2 h-4 w-4" data-oid="9aka:-d" />
              Editar Convocatoria
            </Button>
          </div>
        }
        data-oid="ej-f54:"
      />

      {/* Status Badges */}
      <Card data-oid="l7cepus">
        <CardContent className="flex items-center justify-between pt-6" data-oid="0b-5inp">
          <div className="flex items-center gap-4" data-oid="7j4heee">
            <Badge
              className={`${typeConfig.bgColor} ${typeConfig.hoverColor} text-white text-sm font-bold uppercase`}
              data-oid="u95fm44"
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
              data-oid="o88l:_7"
            >
              {convocation.estado}
            </Badge>
            <Badge variant="outline" className="text-sm uppercase" data-oid="wtnxg1d">
              {convocation.modalidad}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-oid="tdk1yn8">
        {/* LEFT SIDE: 2/3 - Main Information */}
        <div className="lg:col-span-2 space-y-6" data-oid="7.cqj.c">
          {/* Course Image */}
          <Card data-oid="x.7oui3">
            <CardContent className="p-0" data-oid="q0iwbbw">
              <div className="relative h-64 overflow-hidden rounded-t-lg" data-oid="-mmf2rg">
                <img
                  src={convocation.imagenPortada}
                  alt={convocation.nombreCurso}
                  className="w-full h-full object-cover"
                  data-oid="mavxjda"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule and Details */}
          <Card data-oid="4vnkr2f">
            <CardHeader data-oid="awwpujg">
              <CardTitle data-oid="ujt3a.4">Información de la Convocatoria</CardTitle>
              <CardDescription data-oid="1kbk2dw">Fechas, horarios y ubicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="sg.il4-">
              <div className="grid grid-cols-2 gap-4" data-oid="0.16qv-">
                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="euf7qqh">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" data-oid="4t16-l:" />
                  <div data-oid="fcid20i">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="4v3mw2h"
                    >
                      Fecha de Inicio
                    </p>
                    <p className="font-semibold" data-oid="4q_q69x">
                      {formatDate(convocation.fechaInicio)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="1r1rxrl">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-1" data-oid="ki3t.sy" />
                  <div data-oid="957xbc:">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="nrrub66"
                    >
                      Fecha de Finalización
                    </p>
                    <p className="font-semibold" data-oid="rn7y.gu">
                      {formatDate(convocation.fechaFin)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="9c3x7uq">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" data-oid="c4prjfr" />
                  <div data-oid="m16:jv8">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="6-h1-2-"
                    >
                      Horario
                    </p>
                    <p className="font-semibold text-sm" data-oid=":6d.p2p">
                      {convocation.horario}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="gkelfze">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-1" data-oid="8a37.8c" />
                  <div data-oid="c:hb7h-">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="7k_pf_7"
                    >
                      Duración
                    </p>
                    <p className="font-semibold" data-oid="o8h_d5q">
                      {convocation.duracionHoras} Horas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="evsy74n">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-1" data-oid="5d-mj06" />
                  <div data-oid="130ze:p">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="m8v0fnw"
                    >
                      Sede
                    </p>
                    <p className="font-semibold" data-oid="502xyh-">
                      {convocation.sedeNombre}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg" data-oid="m_7m01c">
                  <DoorOpen className="h-5 w-5 text-muted-foreground mt-1" data-oid="x0a.3pk" />
                  <div data-oid="h:fw..3">
                    <p
                      className="text-xs text-muted-foreground uppercase font-semibold mb-1"
                      data-oid="5.-_5jn"
                    >
                      Aula
                    </p>
                    <p className="font-semibold" data-oid="hf3f_ww">
                      {convocation.aulaNombre}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professor */}
          <Card data-oid="9kab-dr">
            <CardHeader data-oid="zx3lwr6">
              <CardTitle className="text-base" data-oid="axnmfda">
                Profesor Asignado
              </CardTitle>
            </CardHeader>
            <CardContent data-oid="hwnwuyw">
              <div className="flex items-center gap-4 p-4 border rounded-lg" data-oid="5ifqn7p">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  data-oid="6989-ij"
                >
                  <User className="h-6 w-6" data-oid="-x1qfqf" />
                </div>
                <div data-oid="2tycl.o">
                  <p className="font-semibold" data-oid="z8x2_vg">
                    {convocation.profesorNombre}
                  </p>
                  <p className="text-sm text-muted-foreground" data-oid="en9db21">
                    Profesor Principal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card data-oid="xm8x.j2">
            <CardHeader data-oid=".v8zhbh">
              <CardTitle data-oid="ng2s9kw">Alumnos Inscritos ({mockStudents.length})</CardTitle>
              <CardDescription data-oid="g_.d7:y">
                Lista de estudiantes matriculados en esta convocatoria
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="j5_upfu">
              <div className="space-y-2" data-oid="aj1azh-">
                {mockStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    data-oid="m822ol3"
                  >
                    <div className="flex items-center gap-3" data-oid="rsjw515">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
                        data-oid="h_.h095"
                      >
                        <User className="h-5 w-5" data-oid="z-r0yxl" />
                      </div>
                      <div data-oid="t.8racn">
                        <p className="font-medium" data-oid="to.:3tj">
                          {student.nombre}
                        </p>
                        <div
                          className="flex items-center gap-3 text-xs text-muted-foreground"
                          data-oid=":xo9-do"
                        >
                          <span className="flex items-center gap-1" data-oid="4veqsfq">
                            <Mail className="h-3 w-3" data-oid="0lbsfk:" />
                            {student.email}
                          </span>
                          <span className="flex items-center gap-1" data-oid=":8xqwdz">
                            <Phone className="h-3 w-3" data-oid="k4kurrv" />
                            {student.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={student.estado === 'confirmado' ? 'default' : 'secondary'}
                      className="text-xs"
                      data-oid="_gbhcas"
                    >
                      {student.estado === 'confirmado' ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" data-oid="1_60:ky" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" data-oid="x17j5rn" />
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
        <div className="lg:col-span-1 space-y-6" data-oid="ynise86">
          {/* Occupancy Stats */}
          <Card data-oid="fu0fccj">
            <CardHeader data-oid="2a3dxjv">
              <CardTitle className="text-base" data-oid="01w0dc5">
                Ocupación de Plazas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4" data-oid="1q3r-qh">
              <div data-oid="-2vbu:f">
                <div className="flex items-center justify-between mb-2" data-oid="pndxl_7">
                  <span className="text-sm text-muted-foreground" data-oid="z.13v77">
                    Plazas ocupadas
                  </span>
                  <span className="text-2xl font-bold" data-oid="ql1st56">
                    {convocation.plazasOcupadas}/{convocation.plazasTotales}
                  </span>
                </div>
                <Progress
                  value={convocation.porcentajeOcupacion}
                  className="h-3"
                  data-oid="l.7rr6e"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right" data-oid="mkq.77s">
                  {convocation.porcentajeOcupacion}% de capacidad
                </p>
              </div>

              <div className="pt-4 border-t space-y-3" data-oid="x6k-llc">
                <div className="flex items-center justify-between" data-oid="l-5upo7">
                  <span className="text-sm text-muted-foreground" data-oid="jxt:uff">
                    Plazas disponibles
                  </span>
                  <span className="text-lg font-bold text-green-600" data-oid="_y4zbkc">
                    {convocation.plazasTotales - convocation.plazasOcupadas}
                  </span>
                </div>

                <div className="flex items-center justify-between" data-oid="5wn6wt3">
                  <span className="text-sm text-muted-foreground" data-oid="q5p1onh">
                    Confirmados
                  </span>
                  <span className="text-lg font-bold" data-oid="zwvt5jp">
                    {mockStudents.filter((s) => s.estado === 'confirmado').length}
                  </span>
                </div>

                <div className="flex items-center justify-between" data-oid="f5pisy:">
                  <span className="text-sm text-muted-foreground" data-oid="qrz86dx">
                    Pendientes
                  </span>
                  <span className="text-lg font-bold text-orange-600" data-oid="czbqqbu">
                    {mockStudents.filter((s) => s.estado === 'pendiente').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Info */}
          <Card data-oid="dd-wiq2">
            <CardHeader data-oid="ewzlhrw">
              <CardTitle className="text-base" data-oid="adghxa7">
                Información de Precio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" data-oid="14l-sdz">
              <div className="flex items-center justify-between" data-oid="vyqvt5s">
                <span className="text-sm text-muted-foreground" data-oid="_pibwhf">
                  Precio del curso:
                </span>
                {convocation.precio === 0 ? (
                  <Badge
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    data-oid="_072okl"
                  >
                    100% SUBVENCIONADO
                  </Badge>
                ) : (
                  <span className={`text-xl font-bold ${typeConfig.textColor}`} data-oid="1e-h.k.">
                    {convocation.precio}€
                  </span>
                )}
              </div>

              {convocation.precioConDescuento && (
                <div className="flex items-center justify-between pt-2 border-t" data-oid="jivz11r">
                  <span className="text-sm text-muted-foreground" data-oid="sy2rs4r">
                    Precio con descuento:
                  </span>
                  <span className="text-xl font-bold text-red-600" data-oid="2:rvnoy">
                    {convocation.precioConDescuento}€
                  </span>
                </div>
              )}

              {convocation.subvencionado !== 'no' &&
                convocation.entidadesFinanciadoras.length > 0 && (
                  <div className="pt-3 border-t" data-oid="zgkdyib">
                    <p
                      className="text-xs text-muted-foreground mb-2 uppercase font-semibold"
                      data-oid="ekoqti:"
                    >
                      Financiado por:
                    </p>
                    <div className="space-y-2" data-oid="brkmy5t">
                      {convocation.entidadesFinanciadoras.map((entidad: FinancingEntity) => (
                        <div
                          key={entidad.id}
                          className="px-3 py-2 bg-secondary rounded text-sm font-medium text-center"
                          data-oid="np---u6"
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
          <Card data-oid="txz199g">
            <CardHeader data-oid="bh.w:r1">
              <CardTitle className="text-base" data-oid="rm5y5_k">
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2" data-oid="32cefr6">
              <Button variant="outline" className="w-full justify-start" data-oid=":20nxgu">
                <Users className="mr-2 h-4 w-4" data-oid=":y00u5a" />
                Gestionar Alumnos
              </Button>
              <Button variant="outline" className="w-full justify-start" data-oid="k.cllhc">
                <Mail className="mr-2 h-4 w-4" data-oid="j.wj.v2" />
                Enviar Comunicación
              </Button>
              <Button variant="outline" className="w-full justify-start" data-oid="o_4nyvs">
                <Calendar className="mr-2 h-4 w-4" data-oid="rlgtgnd" />
                Ver en Calendario
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
