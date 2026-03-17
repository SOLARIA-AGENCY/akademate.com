'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  MapPin,
  User,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  X,
} from 'lucide-react'
// TODO: Fetch from Payload API
// import { convocatoriasMockData } from '@payload-config/data/mockConvocatorias'
// import { aulasMockData } from '@payload-config/data/mockAulas'
const convocatoriasMockData: any[] = []
const aulasMockData: any[] = []
import { DisponibilidadAula } from '@payload-config/components/ui/DisponibilidadAula'

interface HorarioSemanal {
  dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado'
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

interface FormData {
  // Paso 1: Curso
  curso_id: string
  curso_nombre: string
  duracion_total: number
  modalidad: string

  // Paso 2: Recursos
  sede_id: string
  aula_id: string
  profesor_principal_id: string
  profesores_apoyo: string[]

  // Paso 3: Horario
  fecha_inicio: string
  fecha_fin: string
  horarios: HorarioSemanal[]

  // Paso 4: Capacidad
  plazas_totales: number
  estado: 'planificada' | 'abierta'
}

interface Conflicto {
  tipo: 'error' | 'warning'
  mensaje: string
  sugerencias?: string[]
}

// Data will come from API
const cursosMock: { id: string; nombre: string; duracion: number; modalidad: string }[] = []
const profesoresMock: { id: string; nombre: string; especialidad: string }[] = []
const sedesMock: { id: string; nombre: string }[] = []

export default function NuevaConvocatoriaPage() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [validando, setValidando] = useState(false)
  const [conflictos, setConflictos] = useState<Conflicto[]>([])
  const [mostrarDisponibilidad, setMostrarDisponibilidad] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    curso_id: '',
    curso_nombre: '',
    duracion_total: 0,
    modalidad: '',
    sede_id: '',
    aula_id: '',
    profesor_principal_id: '',
    profesores_apoyo: [],
    fecha_inicio: '',
    fecha_fin: '',
    horarios: [
      { dia: 'lunes', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
      { dia: 'martes', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
      { dia: 'miercoles', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
      { dia: 'jueves', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
      { dia: 'viernes', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
      { dia: 'sabado', hora_inicio: '09:00', hora_fin: '11:00', activo: false },
    ],

    plazas_totales: 0,
    estado: 'planificada',
  })

  // Validación automática cuando cambia el paso 3
  React.useEffect(() => {
    if (pasoActual === 3 && formData.aula_id && formData.profesor_principal_id) {
      validarDisponibilidad()
    }
  }, [formData.horarios, formData.aula_id, formData.profesor_principal_id])

  const validarDisponibilidad = () => {
    setValidando(true)
    const nuevosConflictos: Conflicto[] = []

    // Simular validación de aula
    const horariosActivos = formData.horarios.filter((h) => h.activo)
    if (horariosActivos.length > 0) {
      // Verificar si Aula A1 y miércoles 10:00 (conflicto mock)
      const aulaSeleccionada = aulasMockData.find((a) => a.id === formData.aula_id)
      const miercolesHorario = horariosActivos.find(
        (h) => h.dia === 'miercoles' && h.hora_inicio === '10:00'
      )

      if (aulaSeleccionada?.codigo === 'A1' && miercolesHorario) {
        nuevosConflictos.push({
          tipo: 'error',
          mensaje: 'Aula A1 ocupada miércoles 10:00-12:00 por Marketing Digital Avanzado',
          sugerencias: [
            'Cambiar horario a 14:00-16:00',
            'Seleccionar otra aula disponible',
            'Cambiar día a jueves',
          ],
        })
      }

      // Verificar profesor Juan García en múltiples sedes
      const profesorSeleccionado = profesoresMock.find(
        (p) => p.id === formData.profesor_principal_id
      )
      if (profesorSeleccionado?.nombre === 'Juan García Martínez' && formData.sede_id === 's2') {
        nuevosConflictos.push({
          tipo: 'warning',
          mensaje: 'Profesor Juan García tiene clases en Sede Norte mismo horario',
          sugerencias: ['Asignar 2 horas de margen entre sedes', 'Seleccionar otro profesor'],
        })
      }
    }

    setConflictos(nuevosConflictos)
    setValidando(false)
  }

  const calcularHorasSemanales = (): number => {
    return formData.horarios
      .filter((h) => h.activo)
      .reduce((sum, horario) => {
        const [hi, mi] = horario.hora_inicio.split(':').map(Number)
        const [hf, mf] = horario.hora_fin.split(':').map(Number)
        const minutos = hf * 60 + mf - (hi * 60 + mi)
        return sum + minutos / 60
      }, 0)
  }

  const siguientePaso = () => {
    if (pasoActual < 4) {
      setPasoActual(pasoActual + 1)
    }
  }

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1)
    }
  }

  const handleSubmit = () => {
    alert('Convocatoria creada con éxito (MOCK)')
    router.push('/programacion')
  }

  const pasos = [
    { numero: 1, titulo: 'Selección de Curso', icon: BookOpen },
    { numero: 2, titulo: 'Asignación de Recursos', icon: MapPin },
    { numero: 3, titulo: 'Configuración de Horario', icon: Clock },
    { numero: 4, titulo: 'Capacidad y Estado', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-oid="1kul3w5">
      <div className="max-w-6xl mx-auto space-y-6" data-oid="p7gza_z">
        <PageHeader
          title="Nueva Convocatoria"
          description="Asistente de creación paso a paso"
          icon={Calendar}
          actions={
            <Button
              variant="outline"
              onClick={() => router.push('/programacion')}
              data-oid="u-86:8h"
            >
              <X className="mr-2 h-4 w-4" data-oid="9bwnka." />
              Cancelar
            </Button>
          }
          data-oid="--m0tdo"
        />

        {/* Progress Steps */}
        <Card className="p-6" data-oid="14_p:9w">
          <div className="flex items-center justify-between" data-oid="3co_5ov">
            {pasos.map((paso, index) => {
              const Icon = paso.icon
              const isCompleted = pasoActual > paso.numero
              const isCurrent = pasoActual === paso.numero

              return (
                <React.Fragment key={paso.numero}>
                  <div className="flex flex-col items-center" data-oid="31po459">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-[#ff2014] text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                      data-oid="lsbryrj"
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" data-oid="sm5eb-2" />
                      ) : (
                        <Icon className="h-6 w-6" data-oid="2.47_1f" />
                      )}
                    </div>
                    <div className="mt-2 text-center" data-oid="8w9mc--">
                      <p
                        className={`text-sm font-medium ${isCurrent ? 'text-[#ff2014]' : 'text-gray-500'}`}
                        data-oid=":m:.i7b"
                      >
                        Paso {paso.numero}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[120px]" data-oid="hbvg1y_">
                        {paso.titulo}
                      </p>
                    </div>
                  </div>
                  {index < pasos.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      data-oid="._:4.2:"
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-8" data-oid="iz7mmd1">
          {/* PASO 1: SELECCIÓN DE CURSO */}
          {pasoActual === 1 && (
            <div className="space-y-6" data-oid="6s_98o6">
              <div data-oid="9j:m84y">
                <h2 className="text-2xl font-bold flex items-center gap-2" data-oid="a18pjlh">
                  <BookOpen className="h-6 w-6 text-[#ff2014]" data-oid=".m0o27j" />
                  Paso 1: Selección de Curso
                </h2>
                <p className="text-muted-foreground mt-2" data-oid="b-rf3ds">
                  Selecciona el curso que deseas programar
                </p>
              </div>

              <div className="space-y-4" data-oid="lhxi9vx">
                <div data-oid="h92ei1l">
                  <Label htmlFor="curso" data-oid="gxa1quj">
                    Curso *
                  </Label>
                  <Select
                    value={formData.curso_id}
                    onValueChange={(value) => {
                      const curso = cursosMock.find((c) => c.id === value)
                      if (curso) {
                        setFormData({
                          ...formData,
                          curso_id: value,
                          curso_nombre: curso.nombre,
                          duracion_total: curso.duracion,
                          modalidad: curso.modalidad,
                        })
                      }
                    }}
                    data-oid="rvmpggj"
                  >
                    <SelectTrigger id="curso" data-oid=":91t1x-">
                      <SelectValue placeholder="Seleccionar curso" data-oid="n0m0m_u" />
                    </SelectTrigger>
                    <SelectContent data-oid="k43dh3o">
                      {cursosMock.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id} data-oid="4u-9aq5">
                          {curso.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.curso_id && (
                  <Card className="p-4 bg-blue-50 border-blue-200" data-oid="03oqwjp">
                    <div className="space-y-2" data-oid="q02870g">
                      <div className="flex items-center justify-between" data-oid="7nun7.d">
                        <span className="text-sm font-medium" data-oid="1gmfqi-">
                          Duración:
                        </span>
                        <span className="text-sm" data-oid="64dw5ui">
                          {formData.duracion_total} horas
                        </span>
                      </div>
                      <div className="flex items-center justify-between" data-oid=".drgwic">
                        <span className="text-sm font-medium" data-oid="pie7:f-">
                          Modalidad:
                        </span>
                        <Badge variant="outline" data-oid="v4mirpz">
                          {formData.modalidad}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: ASIGNACIÓN DE RECURSOS */}
          {pasoActual === 2 && (
            <div className="space-y-6" data-oid="fvg7b2s">
              <div data-oid="up6hsb2">
                <h2 className="text-2xl font-bold flex items-center gap-2" data-oid="wz2fi8_">
                  <MapPin className="h-6 w-6 text-[#ff2014]" data-oid="mg_6qn1" />
                  Paso 2: Asignación de Recursos
                </h2>
                <p className="text-muted-foreground mt-2" data-oid="kbfi1k5">
                  Selecciona sede, aula y profesor
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="5qqhvit">
                <div data-oid=":okezzx">
                  <Label htmlFor="sede" data-oid="l.aq8bs">
                    Sede *
                  </Label>
                  <Select
                    value={formData.sede_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, sede_id: value, aula_id: '' })
                    }}
                    data-oid="4vsuuoz"
                  >
                    <SelectTrigger id="sede" data-oid="odpn4dx">
                      <SelectValue placeholder="Seleccionar sede" data-oid="vah3myz" />
                    </SelectTrigger>
                    <SelectContent data-oid="fk2kh13">
                      {sedesMock.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id} data-oid="r:i56d8">
                          {sede.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div data-oid="lqqh:mm">
                  <Label htmlFor="aula" data-oid="ghlqdj_">
                    Aula *
                  </Label>
                  <div className="flex gap-2" data-oid="2-kmyue">
                    <Select
                      value={formData.aula_id}
                      onValueChange={(value) => setFormData({ ...formData, aula_id: value })}
                      disabled={!formData.sede_id}
                      data-oid="hec7l1o"
                    >
                      <SelectTrigger id="aula" data-oid="yq1c_q0">
                        <SelectValue placeholder="Seleccionar aula" data-oid="hr:r4j_" />
                      </SelectTrigger>
                      <SelectContent data-oid="hp5_uc4">
                        {aulasMockData
                          .filter((aula) => {
                            const sede = sedesMock.find((s) => s.id === formData.sede_id)
                            return aula.sede === sede?.nombre
                          })
                          .map((aula) => (
                            <SelectItem key={aula.id} value={aula.id} data-oid="7l3:uol">
                              {aula.nombre} (Cap: {aula.capacidad})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Ver disponibilidad"
                      disabled={!formData.aula_id}
                      onClick={() => setMostrarDisponibilidad(true)}
                      data-oid="::eu92q"
                    >
                      <Calendar className="h-4 w-4" data-oid="uxu-tgu" />
                    </Button>
                  </div>
                </div>

                <div data-oid="c9bivl9">
                  <Label htmlFor="profesor" data-oid=":h6hosu">
                    Profesor Principal *
                  </Label>
                  <div className="flex gap-2" data-oid="rmtxn2:">
                    <Select
                      value={formData.profesor_principal_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, profesor_principal_id: value })
                      }
                      data-oid="ggiaxy."
                    >
                      <SelectTrigger id="profesor" data-oid=".2lcawj">
                        <SelectValue placeholder="Seleccionar profesor" data-oid="z1zqgqb" />
                      </SelectTrigger>
                      <SelectContent data-oid="q3apqx9">
                        {profesoresMock.map((profesor) => (
                          <SelectItem key={profesor.id} value={profesor.id} data-oid="m1gp2ff">
                            {profesor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" title="Ver agenda" data-oid="qlz0snu">
                      <Calendar className="h-4 w-4" data-oid="_:u:omz" />
                    </Button>
                  </div>
                  {formData.profesor_principal_id && (
                    <p className="text-xs text-muted-foreground mt-1" data-oid="fkznihy">
                      Especialidad:{' '}
                      {
                        profesoresMock.find((p) => p.id === formData.profesor_principal_id)
                          ?.especialidad
                      }
                    </p>
                  )}
                </div>

                <div data-oid="-n2kt-t">
                  <Label data-oid="8sja7z3">Profesores de Apoyo (Opcional)</Label>
                  <Button variant="outline" className="w-full" disabled data-oid="rkc:b48">
                    <User className="mr-2 h-4 w-4" data-oid="r183gz3" />
                    Añadir profesor de apoyo
                  </Button>
                </div>
              </div>

              {formData.aula_id && (
                <Card className="p-4 bg-green-50 border-green-200" data-oid="0n-i6j4">
                  <div className="flex items-start gap-3" data-oid="o4re5cj">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" data-oid="fzxrdh2" />
                    <div data-oid="k-db1mw">
                      <p className="font-semibold text-green-900" data-oid="cwjj9mg">
                        Recursos seleccionados
                      </p>
                      <p className="text-sm text-green-700 mt-1" data-oid="j7raoke">
                        Todos los recursos están disponibles. Continúa al siguiente paso.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* PASO 3: CONFIGURACIÓN DE HORARIO */}
          {pasoActual === 3 && (
            <div className="space-y-6" data-oid="p2:7t5:">
              <div data-oid="5-hl6au">
                <h2 className="text-2xl font-bold flex items-center gap-2" data-oid="z5rj_p4">
                  <Clock className="h-6 w-6 text-[#ff2014]" data-oid=".i4kcjk" />
                  Paso 3: Configuración de Horario
                </h2>
                <p className="text-muted-foreground mt-2" data-oid="97r3y:8">
                  Define las fechas y horario semanal
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="4g5-ob.">
                <div data-oid="hf:2jyo">
                  <Label htmlFor="fecha_inicio" data-oid="u3j9d9a">
                    Fecha de Inicio *
                  </Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    data-oid="yd9siky"
                  />
                </div>

                <div data-oid="46881-b">
                  <Label htmlFor="fecha_fin" data-oid="3bks672">
                    Fecha de Fin *
                  </Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    data-oid="z5b9skn"
                  />
                </div>
              </div>

              <div data-oid="zy7c-wi">
                <Label data-oid="a38h7hs">Horario Semanal *</Label>
                <div className="space-y-2 mt-2" data-oid="-u10w-e">
                  {formData.horarios.map((horario, index) => (
                    <Card
                      key={horario.dia}
                      className={`p-4 ${horario.activo ? 'border-[#ff2014] bg-red-50' : ''}`}
                      data-oid="_rkdbui"
                    >
                      <div className="flex items-center gap-4" data-oid="xylq-l3">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => {
                            const nuevosHorarios = [...formData.horarios]
                            nuevosHorarios[index].activo = e.target.checked
                            setFormData({ ...formData, horarios: nuevosHorarios })
                          }}
                          className="w-5 h-5 rounded border-gray-300"
                          data-oid="mw2_.e:"
                        />

                        <div
                          className="flex-1 grid grid-cols-3 gap-4 items-center"
                          data-oid="am70jav"
                        >
                          <span className="font-medium capitalize" data-oid="0kscpbp">
                            {horario.dia}
                          </span>
                          <div className="flex items-center gap-2" data-oid="9plx.02">
                            <Input
                              type="time"
                              value={horario.hora_inicio}
                              onChange={(e) => {
                                const nuevosHorarios = [...formData.horarios]
                                nuevosHorarios[index].hora_inicio = e.target.value
                                setFormData({ ...formData, horarios: nuevosHorarios })
                              }}
                              disabled={!horario.activo}
                              className="w-full"
                              data-oid="8:86uc0"
                            />

                            <span data-oid="e4yych6">-</span>
                            <Input
                              type="time"
                              value={horario.hora_fin}
                              onChange={(e) => {
                                const nuevosHorarios = [...formData.horarios]
                                nuevosHorarios[index].hora_fin = e.target.value
                                setFormData({ ...formData, horarios: nuevosHorarios })
                              }}
                              disabled={!horario.activo}
                              className="w-full"
                              data-oid="zf_rlm3"
                            />
                          </div>
                          <div className="text-sm text-muted-foreground" data-oid="bjn9e4p">
                            {horario.activo && horario.hora_inicio && horario.hora_fin ? (
                              <>
                                {(() => {
                                  const [hi, mi] = horario.hora_inicio.split(':').map(Number)
                                  const [hf, mf] = horario.hora_fin.split(':').map(Number)
                                  const minutos = hf * 60 + mf - (hi * 60 + mi)
                                  return `${minutos / 60}h`
                                })()}
                              </>
                            ) : (
                              'Sin horario'
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-blue-50 border-blue-200" data-oid="no.:h8u">
                <div className="flex items-center justify-between" data-oid="f5n5ybw">
                  <span className="font-medium" data-oid="3s3z5zo">
                    Total horas semanales:
                  </span>
                  <Badge className="bg-[#ff2014]" data-oid="x5opcxv">
                    {calcularHorasSemanales()}h
                  </Badge>
                </div>
              </Card>

              {/* Validación Automática */}
              {conflictos.length > 0 && (
                <Card className="p-4 bg-orange-50 border-orange-200" data-oid="ie76hs_">
                  <div className="space-y-3" data-oid="m4pnkhz">
                    <div className="flex items-center gap-2" data-oid="8t7-x.8">
                      <AlertCircle className="h-5 w-5 text-orange-600" data-oid="81nwczc" />
                      <p className="font-semibold text-orange-900" data-oid="o0q3nmf">
                        Conflictos Detectados ({conflictos.length})
                      </p>
                    </div>
                    {conflictos.map((conflicto, idx) => (
                      <div key={idx} className="space-y-2" data-oid="z2i281i">
                        <p className="text-sm text-orange-800" data-oid="hh-:s-u">
                          • {conflicto.mensaje}
                        </p>
                        {conflicto.sugerencias && (
                          <div className="ml-4 space-y-1" data-oid="1phnl54">
                            <p
                              className="text-xs text-orange-700 flex items-center gap-1"
                              data-oid="cp0:htw"
                            >
                              <Lightbulb className="h-3 w-3" data-oid="u7oi9mt" />
                              Sugerencias:
                            </p>
                            {conflicto.sugerencias.map((sug, sidx) => (
                              <p
                                key={sidx}
                                className="text-xs text-orange-700 ml-4"
                                data-oid="f:9jm_k"
                              >
                                - {sug}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {conflictos.length === 0 && formData.horarios.some((h) => h.activo) && (
                <Card className="p-4 bg-green-50 border-green-200" data-oid="k1prga9">
                  <div className="flex items-center gap-3" data-oid="h7e-_gl">
                    <CheckCircle2 className="h-5 w-5 text-green-600" data-oid="rl7wf0q" />
                    <div data-oid="8bxm55l">
                      <p className="font-semibold text-green-900" data-oid="wowlpwf">
                        ✅ Horario válido
                      </p>
                      <p className="text-sm text-green-700" data-oid="ylynv2k">
                        No se detectaron conflictos. Puedes continuar.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* PASO 4: CAPACIDAD Y ESTADO */}
          {pasoActual === 4 && (
            <div className="space-y-6" data-oid="_dry_av">
              <div data-oid="u6--h48">
                <h2 className="text-2xl font-bold flex items-center gap-2" data-oid="da5.9m6">
                  <Users className="h-6 w-6 text-[#ff2014]" data-oid="rz4rm38" />
                  Paso 4: Capacidad y Estado
                </h2>
                <p className="text-muted-foreground mt-2" data-oid="yz349:p">
                  Define la capacidad y estado inicial
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-oid="xmo0zvf">
                <div data-oid="s5kzsn6">
                  <Label htmlFor="plazas" data-oid="cmfl5cp">
                    Plazas Totales *
                  </Label>
                  <Input
                    id="plazas"
                    type="number"
                    min="1"
                    value={formData.plazas_totales || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, plazas_totales: parseInt(e.target.value) || 0 })
                    }
                    data-oid="r95l.ru"
                  />

                  {formData.aula_id && (
                    <p className="text-xs text-muted-foreground mt-1" data-oid="2m9k_lv">
                      Capacidad máxima del aula:{' '}
                      {aulasMockData.find((a) => a.id === formData.aula_id)?.capacidad}
                    </p>
                  )}
                </div>

                <div data-oid="pn9o7vy">
                  <Label htmlFor="estado" data-oid="tpd9ppz">
                    Estado Inicial *
                  </Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: 'planificada' | 'abierta') =>
                      setFormData({ ...formData, estado: value })
                    }
                    data-oid="u_hm67k"
                  >
                    <SelectTrigger id="estado" data-oid="av3un8-">
                      <SelectValue data-oid="vqe5w.." />
                    </SelectTrigger>
                    <SelectContent data-oid="4oo2:aq">
                      <SelectItem value="planificada" data-oid="_wr6l5-">
                        Planificada
                      </SelectItem>
                      <SelectItem value="abierta" data-oid="rbj.im:">
                        Abierta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumen Final */}
              <Card className="p-6 bg-gray-50" data-oid="2_hf-f5">
                <h3 className="font-semibold text-lg mb-4" data-oid="9nx6pd1">
                  📋 Resumen de la Convocatoria
                </h3>
                <div className="grid grid-cols-2 gap-4" data-oid="ol-vwft">
                  <div data-oid="x:oc6su">
                    <p className="text-sm text-muted-foreground" data-oid="72r16jq">
                      Curso
                    </p>
                    <p className="font-medium" data-oid="44khln:">
                      {formData.curso_nombre}
                    </p>
                  </div>
                  <div data-oid="j.sr37h">
                    <p className="text-sm text-muted-foreground" data-oid="8ug1-a5">
                      Sede y Aula
                    </p>
                    <p className="font-medium" data-oid="c7gsw3v">
                      {sedesMock.find((s) => s.id === formData.sede_id)?.nombre} -{' '}
                      {aulasMockData.find((a) => a.id === formData.aula_id)?.nombre}
                    </p>
                  </div>
                  <div data-oid="fcn89gu">
                    <p className="text-sm text-muted-foreground" data-oid="imap-ey">
                      Profesor
                    </p>
                    <p className="font-medium" data-oid="recshjy">
                      {profesoresMock.find((p) => p.id === formData.profesor_principal_id)?.nombre}
                    </p>
                  </div>
                  <div data-oid="lsdir5-">
                    <p className="text-sm text-muted-foreground" data-oid="g7pi6_9">
                      Horario
                    </p>
                    <p className="font-medium" data-oid="w.u639_">
                      {calcularHorasSemanales()}h semanales
                    </p>
                  </div>
                  <div data-oid="pzyunih">
                    <p className="text-sm text-muted-foreground" data-oid="7iylvrr">
                      Fechas
                    </p>
                    <p className="font-medium" data-oid="kk7e7l8">
                      {formData.fecha_inicio} - {formData.fecha_fin}
                    </p>
                  </div>
                  <div data-oid="v1-c7yp">
                    <p className="text-sm text-muted-foreground" data-oid="n_gb01v">
                      Capacidad
                    </p>
                    <p className="font-medium" data-oid="5xtf63v">
                      {formData.plazas_totales} plazas
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <Card className="p-6" data-oid="wuoj7yc">
          <div className="flex items-center justify-between" data-oid="wuf94d6">
            <Button
              variant="outline"
              onClick={pasoAnterior}
              disabled={pasoActual === 1}
              data-oid="paj0tr7"
            >
              <ChevronLeft className="mr-2 h-4 w-4" data-oid="mcaiwj9" />
              Anterior
            </Button>

            <p className="text-sm text-muted-foreground" data-oid="bo:a.zc">
              Paso {pasoActual} de {pasos.length}
            </p>

            {pasoActual < 4 ? (
              <Button
                onClick={siguientePaso}
                className="bg-[#ff2014] hover:bg-[#ff2014]/90"
                disabled={
                  (pasoActual === 1 && !formData.curso_id) ||
                  (pasoActual === 2 &&
                    (!formData.sede_id || !formData.aula_id || !formData.profesor_principal_id)) ||
                  (pasoActual === 3 &&
                    (!formData.fecha_inicio ||
                      !formData.fecha_fin ||
                      !formData.horarios.some((h) => h.activo)))
                }
                data-oid="s580377"
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" data-oid="9wgxjd4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-[#ff2014] hover:bg-[#ff2014]/90"
                disabled={
                  formData.plazas_totales === 0 || conflictos.some((c) => c.tipo === 'error')
                }
                data-oid="gqr28.s"
              >
                <Check className="mr-2 h-4 w-4" data-oid="vovso_8" />
                Crear Convocatoria
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Disponibilidad de Aula */}
      {mostrarDisponibilidad && formData.aula_id && (
        <DisponibilidadAula
          aulaId={formData.aula_id}
          onClose={() => setMostrarDisponibilidad(false)}
          data-oid="b0du7-p"
        />
      )}
    </div>
  )
}
