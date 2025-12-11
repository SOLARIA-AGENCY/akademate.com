'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Label } from '@payload-config/components/ui/label'
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

// Mock data
const cursosMock = [
  { id: 'c1', nombre: 'Marketing Digital Avanzado', duracion: 60, modalidad: 'Presencial' },
  { id: 'c2', nombre: 'SEO y Posicionamiento Web', duracion: 40, modalidad: 'Presencial' },
  { id: 'c3', nombre: 'Desarrollo Web Full Stack', duracion: 200, modalidad: 'Presencial' },
  { id: 'c4', nombre: 'Community Manager Profesional', duracion: 50, modalidad: 'Semipresencial' },
  { id: 'c5', nombre: 'Excel Avanzado', duracion: 30, modalidad: 'Presencial' },
]

const profesoresMock = [
  { id: 'p1', nombre: 'Juan García Martínez', especialidad: 'Marketing Digital' },
  { id: 'p2', nombre: 'María López Ruiz', especialidad: 'SEO/SEM' },
  { id: 'p3', nombre: 'Ana Ruiz Torres', especialidad: 'Desarrollo Web' },
  { id: 'p4', nombre: 'Luis Sánchez Pérez', especialidad: 'Administración' },
  { id: 'p5', nombre: 'Carmen Díaz López', especialidad: 'Diseño Gráfico' },
]

const sedesMock = [
  { id: 's1', nombre: 'CEP Norte' },
  { id: 's2', nombre: 'CEP Sur' },
  { id: 's3', nombre: 'CEP Santa Cruz' },
]

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
      const miercolesHorario = horariosActivos.find((h) => h.dia === 'miercoles' && h.hora_inicio === '10:00')

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
      const profesorSeleccionado = profesoresMock.find((p) => p.id === formData.profesor_principal_id)
      if (profesorSeleccionado?.nombre === 'Juan García Martínez' && formData.sede_id === 's2') {
        nuevosConflictos.push({
          tipo: 'warning',
          mensaje: 'Profesor Juan García tiene clases en CEP Norte mismo horario',
          sugerencias: [
            'Asignar 2 horas de margen entre sedes',
            'Seleccionar otro profesor',
          ],
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nueva Convocatoria</h1>
            <p className="text-muted-foreground mt-1">
              Asistente de creación paso a paso
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/programacion')}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </div>

        {/* Progress Steps */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            {pasos.map((paso, index) => {
              const Icon = paso.icon
              const isCompleted = pasoActual > paso.numero
              const isCurrent = pasoActual === paso.numero

              return (
                <React.Fragment key={paso.numero}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-[#ff2014] text-white'
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-[#ff2014]' : 'text-gray-500'}`}>
                        Paso {paso.numero}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[120px]">
                        {paso.titulo}
                      </p>
                    </div>
                  </div>
                  {index < pasos.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </Card>

        {/* Step Content */}
        <Card className="p-8">
          {/* PASO 1: SELECCIÓN DE CURSO */}
          {pasoActual === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#ff2014]" />
                  Paso 1: Selección de Curso
                </h2>
                <p className="text-muted-foreground mt-2">
                  Selecciona el curso que deseas programar
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="curso">Curso *</Label>
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
                  >
                    <SelectTrigger id="curso">
                      <SelectValue placeholder="Seleccionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursosMock.map((curso) => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.curso_id && (
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Duración:</span>
                        <span className="text-sm">{formData.duracion_total} horas</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modalidad:</span>
                        <Badge variant="outline">{formData.modalidad}</Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: ASIGNACIÓN DE RECURSOS */}
          {pasoActual === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-[#ff2014]" />
                  Paso 2: Asignación de Recursos
                </h2>
                <p className="text-muted-foreground mt-2">
                  Selecciona sede, aula y profesor
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sede">Sede *</Label>
                  <Select
                    value={formData.sede_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, sede_id: value, aula_id: '' })
                    }}
                  >
                    <SelectTrigger id="sede">
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedesMock.map((sede) => (
                        <SelectItem key={sede.id} value={sede.id}>
                          {sede.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="aula">Aula *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.aula_id}
                      onValueChange={(value) => setFormData({ ...formData, aula_id: value })}
                      disabled={!formData.sede_id}
                    >
                      <SelectTrigger id="aula">
                        <SelectValue placeholder="Seleccionar aula" />
                      </SelectTrigger>
                      <SelectContent>
                        {aulasMockData
                          .filter((aula) => {
                            const sede = sedesMock.find((s) => s.id === formData.sede_id)
                            return aula.sede === sede?.nombre
                          })
                          .map((aula) => (
                            <SelectItem key={aula.id} value={aula.id}>
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
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="profesor">Profesor Principal *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.profesor_principal_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, profesor_principal_id: value })
                      }
                    >
                      <SelectTrigger id="profesor">
                        <SelectValue placeholder="Seleccionar profesor" />
                      </SelectTrigger>
                      <SelectContent>
                        {profesoresMock.map((profesor) => (
                          <SelectItem key={profesor.id} value={profesor.id}>
                            {profesor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" title="Ver agenda">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.profesor_principal_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Especialidad:{' '}
                      {profesoresMock.find((p) => p.id === formData.profesor_principal_id)?.especialidad}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Profesores de Apoyo (Opcional)</Label>
                  <Button variant="outline" className="w-full" disabled>
                    <User className="mr-2 h-4 w-4" />
                    Añadir profesor de apoyo
                  </Button>
                </div>
              </div>

              {formData.aula_id && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Recursos seleccionados</p>
                      <p className="text-sm text-green-700 mt-1">
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#ff2014]" />
                  Paso 3: Configuración de Horario
                </h2>
                <p className="text-muted-foreground mt-2">
                  Define las fechas y horario semanal
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Horario Semanal *</Label>
                <div className="space-y-2 mt-2">
                  {formData.horarios.map((horario, index) => (
                    <Card
                      key={horario.dia}
                      className={`p-4 ${horario.activo ? 'border-[#ff2014] bg-red-50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={horario.activo}
                          onChange={(e) => {
                            const nuevosHorarios = [...formData.horarios]
                            nuevosHorarios[index].activo = e.target.checked
                            setFormData({ ...formData, horarios: nuevosHorarios })
                          }}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                          <span className="font-medium capitalize">{horario.dia}</span>
                          <div className="flex items-center gap-2">
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
                            />
                            <span>-</span>
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
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
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

              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total horas semanales:</span>
                  <Badge className="bg-[#ff2014]">{calcularHorasSemanales()}h</Badge>
                </div>
              </Card>

              {/* Validación Automática */}
              {conflictos.length > 0 && (
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <p className="font-semibold text-orange-900">
                        Conflictos Detectados ({conflictos.length})
                      </p>
                    </div>
                    {conflictos.map((conflicto, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className="text-sm text-orange-800">• {conflicto.mensaje}</p>
                        {conflicto.sugerencias && (
                          <div className="ml-4 space-y-1">
                            <p className="text-xs text-orange-700 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Sugerencias:
                            </p>
                            {conflicto.sugerencias.map((sug, sidx) => (
                              <p key={sidx} className="text-xs text-orange-700 ml-4">
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
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">✅ Horario válido</p>
                      <p className="text-sm text-green-700">
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-[#ff2014]" />
                  Paso 4: Capacidad y Estado
                </h2>
                <p className="text-muted-foreground mt-2">
                  Define la capacidad y estado inicial
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="plazas">Plazas Totales *</Label>
                  <Input
                    id="plazas"
                    type="number"
                    min="1"
                    value={formData.plazas_totales || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, plazas_totales: parseInt(e.target.value) || 0 })
                    }
                  />
                  {formData.aula_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Capacidad máxima del aula:{' '}
                      {aulasMockData.find((a) => a.id === formData.aula_id)?.capacidad}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estado">Estado Inicial *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value: 'planificada' | 'abierta') =>
                      setFormData({ ...formData, estado: value })
                    }
                  >
                    <SelectTrigger id="estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planificada">Planificada</SelectItem>
                      <SelectItem value="abierta">Abierta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumen Final */}
              <Card className="p-6 bg-gray-50">
                <h3 className="font-semibold text-lg mb-4">📋 Resumen de la Convocatoria</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Curso</p>
                    <p className="font-medium">{formData.curso_nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sede y Aula</p>
                    <p className="font-medium">
                      {sedesMock.find((s) => s.id === formData.sede_id)?.nombre} -{' '}
                      {aulasMockData.find((a) => a.id === formData.aula_id)?.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profesor</p>
                    <p className="font-medium">
                      {profesoresMock.find((p) => p.id === formData.profesor_principal_id)?.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horario</p>
                    <p className="font-medium">{calcularHorasSemanales()}h semanales</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fechas</p>
                    <p className="font-medium">
                      {formData.fecha_inicio} - {formData.fecha_fin}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidad</p>
                    <p className="font-medium">{formData.plazas_totales} plazas</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={pasoAnterior}
              disabled={pasoActual === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <p className="text-sm text-muted-foreground">
              Paso {pasoActual} de {pasos.length}
            </p>

            {pasoActual < 4 ? (
              <Button
                onClick={siguientePaso}
                className="bg-[#ff2014] hover:bg-[#ff2014]/90"
                disabled={
                  (pasoActual === 1 && !formData.curso_id) ||
                  (pasoActual === 2 && (!formData.sede_id || !formData.aula_id || !formData.profesor_principal_id)) ||
                  (pasoActual === 3 && (!formData.fecha_inicio || !formData.fecha_fin || !formData.horarios.some((h) => h.activo)))
                }
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-[#ff2014] hover:bg-[#ff2014]/90"
                disabled={formData.plazas_totales === 0 || conflictos.some((c) => c.tipo === 'error')}
              >
                <Check className="mr-2 h-4 w-4" />
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
        />
      )}
    </div>
  )
}
