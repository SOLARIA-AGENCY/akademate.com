'use client'

// Force dynamic rendering - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import * as React from 'react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
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
  Calendar,
  LayoutGrid,
  User,
  BookOpen,
  MapPin,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Printer,
  CheckCircle2,
} from 'lucide-react'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'
// TODO: Fetch from Payload API
// import { aulasMockData, horariosDetalladosMock, type HorarioDetallado, type Aula } from '@payload-config/data/mockAulas'
const aulasMockData: any[] = []
const horariosDetalladosMock: any[] = []
type HorarioDetallado = any
type Aula = any

// Configuración del grid
const HORA_INICIO = 8 // 8:00
const HORA_FIN = 22 // 22:00
const PIXELS_POR_HORA = 80 // Altura de cada slot de 1 hora
const ANCHO_COLUMNA_AULA = 200 // Ancho de cada columna de aula

type VistaTipo = 'aulas' | 'profesores' | 'cursos'

// Main component that uses useSearchParams
function PlannerVisualPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>('CEP Norte')
  const [vistaActual, setVistaActual] = useState<VistaTipo>('aulas')
  const [semanaActual, setSemanaActual] = useState(0) // 0 = esta semana, +1 = próxima, -1 = anterior

  // Estado para drag and drop
  const [horarios, setHorarios] = useState<HorarioDetallado[]>(horariosDetalladosMock)
  const [draggedHorario, setDraggedHorario] = useState<HorarioDetallado | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{ aulaId: string; dia: string; hora: number } | null>(null)
  const [dragValid, setDragValid] = useState<boolean>(true)

  // Filtrar aulas por sede
  const aulasFiltradas = aulasMockData.filter((aula) => aula.sede === sedeSeleccionada)

  // Filtrar horarios por sede
  const horariosFiltrados = horarios.filter((horario) => {
    const aula = aulasMockData.find((a) => a.id === horario.aula_id)
    return aula?.sede === sedeSeleccionada
  })

  // Calcular rango de fechas de la semana actual
  const getRangeSemana = () => {
    const hoy = new Date()
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1 + semanaActual * 7) // Lunes

    const finSemana = new Date(inicioSemana)
    finSemana.setDate(inicioSemana.getDate() + 5) // Sábado

    return {
      inicio: inicioSemana.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      fin: finSemana.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
    }
  }

  const rangeSemana = getRangeSemana()

  // Función para calcular posición Y basada en hora
  const calcularPosicionY = (horaInicio: string): number => {
    const [hora, minutos] = horaInicio.split(':').map(Number)
    const horasDesdeInicio = hora - HORA_INICIO
    const minutosDecimales = minutos / 60
    return (horasDesdeInicio + minutosDecimales) * PIXELS_POR_HORA
  }

  // Función para calcular altura basada en duración
  const calcularAltura = (duracionMinutos: number): number => {
    return (duracionMinutos / 60) * PIXELS_POR_HORA
  }

  // Generar array de horas
  const horas = Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => {
    const hora = HORA_INICIO + i
    return `${hora.toString().padStart(2, '0')}:00`
  })

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const diasAbreviados: { [key: string]: string } = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
  }

  // Drag and Drop Handlers
  const handleDragStart = (horario: HorarioDetallado, e: React.DragEvent) => {
    setDraggedHorario(horario)
    e.dataTransfer.effectAllowed = 'move'
    // Add visual feedback to dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedHorario(null)
    setDragOverCell(null)
    setDragValid(true)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const checkConflict = (
    aulaId: string,
    dia: string,
    horaInicio: number,
    duracionMinutos: number,
    excludeHorarioId: string
  ): boolean => {
    const horaFin = horaInicio + duracionMinutos / 60

    // Check if any horario in this aula and dia overlaps with the time range
    const hasConflict = horarios.some((h) => {
      if (h.id === excludeHorarioId) return false // Skip the dragged horario
      if (h.aula_id !== aulaId) return false
      if (h.dia !== dia) return false

      const [hHoraInicio] = h.hora_inicio.split(':').map(Number)
      const hHoraFin = hHoraInicio + h.duracion_minutos / 60

      // Check overlap: (start1 < end2) and (start2 < end1)
      return horaInicio < hHoraFin && hHoraInicio < horaFin
    })

    return hasConflict
  }

  const handleDragOver = (
    aulaId: string,
    hora: number,
    e: React.DragEvent
  ) => {
    e.preventDefault() // Allow drop
    e.dataTransfer.dropEffect = 'move'

    if (!draggedHorario) return

    // Use the original day from the dragged horario
    const dia = draggedHorario.dia

    // Check if drop would create conflict
    const wouldConflict = checkConflict(
      aulaId,
      dia,
      hora,
      draggedHorario.duracion_minutos,
      draggedHorario.id
    )

    setDragOverCell({ aulaId, dia, hora })
    setDragValid(!wouldConflict)
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
    setDragValid(true)
  }

  const handleDrop = (aulaId: string, hora: number, e: React.DragEvent) => {
    e.preventDefault()

    if (!draggedHorario) return

    // Use the original day from the dragged horario (preserve day when moving)
    const dia = draggedHorario.dia

    // Check if drop is valid
    const wouldConflict = checkConflict(
      aulaId,
      dia,
      hora,
      draggedHorario.duracion_minutos,
      draggedHorario.id
    )

    if (wouldConflict) {
      alert('⚠️ Conflicto: Esta aula ya tiene una clase en ese horario')
      return
    }

    // Update horario with new position
    const nuevaHoraInicio = `${hora.toString().padStart(2, '0')}:00`
    const horaFin = hora + draggedHorario.duracion_minutos / 60
    const nuevaHoraFin = `${Math.floor(horaFin).toString().padStart(2, '0')}:${((horaFin % 1) * 60).toString().padStart(2, '0')}`

    const updatedHorarios = horarios.map((h) =>
      h.id === draggedHorario.id
        ? {
            ...h,
            aula_id: aulaId,
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
            tiene_conflicto: false,
          }
        : h
    )

    setHorarios(updatedHorarios)
    setDraggedHorario(null)
    setDragOverCell(null)
    setDragValid(true)
  }

  return (
    <div className="h-screen flex flex-col p-4 bg-background">
      {/* Mock Data Banner */}
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente conexión con API de Programación."
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Planner Visual - {sedeSeleccionada}</h1>
            <p className="text-muted-foreground">Calendario semanal de aulas y horarios</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Navegación de Semanas */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSemanaActual(semanaActual - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 bg-muted rounded-md min-w-[200px] text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {rangeSemana.inicio} - {rangeSemana.fin}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSemanaActual(semanaActual + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanaActual(0)}
            >
              Hoy
            </Button>
          </div>

          {/* Selector de Sede */}
          <Select value={sedeSeleccionada} onValueChange={setSedeSeleccionada}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CEP Norte">CEP Norte</SelectItem>
              <SelectItem value="CEP Sur">CEP Sur</SelectItem>
              <SelectItem value="CEP Santa Cruz">CEP Santa Cruz</SelectItem>
            </SelectContent>
          </Select>

          {/* Selector de Vista */}
          <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg">
            <Button
              variant={vistaActual === 'aulas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('aulas')}
              className={vistaActual === 'aulas' ? 'bg-[#ff2014] hover:bg-[#ff2014]/90' : ''}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Aulas
            </Button>
            <Button
              variant={vistaActual === 'profesores' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('profesores')}
              disabled
            >
              <User className="h-4 w-4 mr-2" />
              Profesores
            </Button>
            <Button
              variant={vistaActual === 'cursos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('cursos')}
              disabled
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Cursos
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Panel Lateral - Leyenda */}
        <Card className="w-64 p-4 space-y-6 overflow-y-auto">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Leyenda
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#ff2014] rounded"></div>
                <span className="text-sm">En Curso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Abierta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">Planificada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-700"></div>
                <span className="text-sm">Conflicto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm">Completada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-secondary border-2 border-dashed rounded"></div>
                <span className="text-sm">Libre</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Aulas Activas</h3>
            <div className="space-y-2">
              {aulasFiltradas.map((aula) => {
                const cursosEnAula = horariosFiltrados.filter((h) => h.aula_id === aula.id)
                return (
                  <div key={aula.id} className="text-sm">
                    <div className="font-medium">{aula.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {cursosEnAula.length} clases • Cap: {aula.capacidad}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Estadísticas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Clases:</span>
                <span className="font-medium">{horariosFiltrados.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conflictos:</span>
                <span className="font-medium text-orange-500">
                  {horariosFiltrados.filter((h) => h.tiene_conflicto).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aulas:</span>
                <span className="font-medium">{aulasFiltradas.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Calendario Grid */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="min-w-max">
              {/* Header con nombres de aulas */}
              <div className="sticky top-0 z-20 bg-card border-b border-border">
                <div className="flex">
                  {/* Columna de horas */}
                  <div className="w-16 bg-muted border-r border-border flex-shrink-0 font-semibold text-center py-3">
                    Hora
                  </div>
                  {/* Columnas de aulas */}
                  {aulasFiltradas.map((aula) => (
                    <div
                      key={aula.id}
                      className="border-r border-border flex-shrink-0 p-3 bg-muted"
                      style={{ width: `${ANCHO_COLUMNA_AULA}px` }}
                    >
                      <div className="font-semibold text-sm">{aula.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        Cap: {aula.capacidad} | {aula.codigo}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid de horarios */}
              <div className="relative">
                {/* Filas de horas */}
                {horas.map((hora, index) => {
                  const horaNum = parseInt(hora.split(':')[0])

                  return (
                    <div key={hora} className="flex border-b border-border" style={{ height: `${PIXELS_POR_HORA}px` }}>
                      {/* Columna de hora */}
                      <div className="w-16 bg-muted border-r border-border flex-shrink-0 text-sm font-medium text-center py-2">
                        {hora}
                      </div>
                      {/* Columnas de aulas */}
                      {aulasFiltradas.map((aula) => {
                        const isDragOver = dragOverCell?.aulaId === aula.id &&
                                          dragOverCell?.hora === horaNum

                        return (
                          <div
                            key={`${hora}-${aula.id}`}
                            className={`border-r border-border flex-shrink-0 relative transition-colors ${
                              isDragOver
                                ? dragValid
                                  ? 'bg-green-500/20 border-2 border-green-500'
                                  : 'bg-red-500/20 border-2 border-red-500'
                                : 'bg-card'
                            }`}
                            style={{ width: `${ANCHO_COLUMNA_AULA}px` }}
                            onDragOver={(e) => handleDragOver(aula.id, horaNum, e)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(aula.id, horaNum, e)}
                          >
                            {/* Líneas de 30 minutos */}
                            <div
                              className="absolute inset-x-0 border-t border-dashed border-border/50"
                              style={{ top: `${PIXELS_POR_HORA / 2}px` }}
                            />
                            {isDragOver && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {dragValid ? (
                                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                                ) : (
                                  <AlertTriangle className="h-8 w-8 text-red-600" />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Bloques de cursos posicionados absolutamente */}
                {horariosFiltrados.map((horario) => {
                  const aulaIndex = aulasFiltradas.findIndex((a) => a.id === horario.aula_id)
                  if (aulaIndex === -1) return null

                  const posicionY = calcularPosicionY(horario.hora_inicio)
                  const altura = calcularAltura(horario.duracion_minutos)
                  const posicionX = 64 + aulaIndex * ANCHO_COLUMNA_AULA // 64px = ancho columna hora

                  const isDragging = draggedHorario?.id === horario.id

                  return (
                    <div
                      key={horario.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(horario, e)}
                      onDragEnd={handleDragEnd}
                      className={`absolute rounded-md p-2 text-white cursor-move hover:shadow-lg transition-all overflow-hidden ${
                        horario.tiene_conflicto ? 'ring-2 ring-orange-700 ring-offset-2' : ''
                      } ${isDragging ? 'opacity-50 ring-4 ring-blue-400' : ''}`}
                      style={{
                        top: `${posicionY}px`,
                        left: `${posicionX + 4}px`,
                        width: `${ANCHO_COLUMNA_AULA - 12}px`,
                        height: `${altura - 4}px`,
                        backgroundColor: horario.color,
                      }}
                      onClick={(e) => {
                        // Only navigate if not dragging
                        if (!isDragging) {
                          router.push(`/programacion/${horario.convocatoria_id}`)
                        }
                      }}
                      title="Arrastrar para cambiar horario o aula"
                    >
                      {horario.tiene_conflicto && (
                        <AlertTriangle className="absolute top-1 right-1 h-4 w-4 text-white" />
                      )}
                      <div className="text-xs font-semibold line-clamp-1">{horario.curso_nombre}</div>
                      <div className="text-xs opacity-90 line-clamp-1">{horario.profesor}</div>
                      <div className="text-xs opacity-80 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {horario.hora_inicio}-{horario.hora_fin}
                      </div>
                      {altura > 60 && (
                        <div className="text-xs opacity-80 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {horario.codigo_curso}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function PlannerVisualPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Cargando planificador...</p>
          </div>
        </div>
      }
    >
      <PlannerVisualPageContent />
    </Suspense>
  )
}
