'use client'

// Force dynamic rendering - bypass static generation for client-side hooks
export const dynamic = 'force-dynamic'

import * as React from 'react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Tabs, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
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
  Users,
  BookOpen,
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Printer,
  CheckCircle2,
} from 'lucide-react'

// TypeScript interfaces for planner data structures
interface Aula {
  id: string
  nombre: string
  capacidad: number
  codigo: string
  sede: string
}

interface HorarioDetallado {
  id: string
  aula_id: string
  dia: string
  hora_inicio: string
  hora_fin: string
  duracion_minutos: number
  tiene_conflicto: boolean
  color: string
  curso_nombre: string
  profesor: string
  codigo_curso: string
  convocatoria_id: string
}

// TODO: Fetch from Payload API
// import { aulasMockData, horariosDetalladosMock, type HorarioDetallado, type Aula } from '@payload-config/data/mockAulas'
const aulasMockData: Aula[] = []
const horariosDetalladosMock: HorarioDetallado[] = []

// Configuración del grid
const HORA_INICIO = 8 // 8:00
const HORA_FIN = 22 // 22:00
const PIXELS_POR_HORA = 80 // Altura de cada slot de 1 hora
const ANCHO_COLUMNA_AULA = 200 // Ancho de cada columna de aula

type VistaTipo = 'aulas' | 'profesores' | 'cursos'

// Main component that uses useSearchParams
function PlannerVisualPageContent() {
  const router = useRouter()
  const _searchParams = useSearchParams()

  const [sedeSeleccionada, setSedeSeleccionada] = useState<string>('Sede Norte')
  const [vistaActual, setVistaActual] = useState<VistaTipo>('aulas')
  const [semanaActual, setSemanaActual] = useState(0) // 0 = esta semana, +1 = próxima, -1 = anterior

  // Estado para drag and drop
  const [horarios, setHorarios] = useState<HorarioDetallado[]>(horariosDetalladosMock)
  const [draggedHorario, setDraggedHorario] = useState<HorarioDetallado | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{
    aulaId: string
    dia: string
    hora: number
  } | null>(null)
  const [dragValid, setDragValid] = useState<boolean>(true)

  const handleExport = () => {
    const rows = horariosFiltrados.map((horario) => ({
      curso: horario.curso_nombre,
      profesor: horario.profesor,
      aula: aulasMockData.find((aula) => aula.id === horario.aula_id)?.nombre ?? 'Sin aula',
      dia: horario.dia,
      inicio: horario.hora_inicio,
      fin: horario.hora_fin,
    }))

    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `planner-${sedeSeleccionada.toLowerCase().replaceAll(' ', '-')}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

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
      fin: finSemana.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
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

  const handleDragOver = (aulaId: string, hora: number, e: React.DragEvent) => {
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
    <div className="space-y-4" data-oid="7w4po0a">
      <PageHeader
        title="Planner Visual"
        description={sedeSeleccionada}
        icon={Calendar}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport} data-oid="pmc7lxs">
              <Download className="mr-2 h-4 w-4" data-oid="6j-o0sq" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} data-oid="yila8ll">
              <Printer className="mr-2 h-4 w-4" data-oid="mq3up0_" />
              Imprimir
            </Button>
          </>
        }
        filters={
          <>
            <div className="flex items-center gap-2" data-oid="biivpvj">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSemanaActual(semanaActual - 1)}
                data-oid="e3_sjoh"
              >
                <ChevronLeft className="h-4 w-4" data-oid="1czpx4k" />
              </Button>
              <div
                className="px-4 py-2 bg-muted rounded-md min-w-[200px] text-center"
                data-oid="b-3qam6"
              >
                <div className="flex items-center justify-center gap-2" data-oid="5._nez6">
                  <Calendar className="h-4 w-4 text-muted-foreground" data-oid="t:1umxc" />
                  <span className="font-semibold" data-oid="cnvu_l0">
                    {rangeSemana.inicio} - {rangeSemana.fin}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSemanaActual(semanaActual + 1)}
                data-oid="qawr7:h"
              >
                <ChevronRight className="h-4 w-4" data-oid="bykbsse" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSemanaActual(0)}
                data-oid=":yjajn3"
              >
                Hoy
              </Button>
            </div>

            <Select value={sedeSeleccionada} onValueChange={setSedeSeleccionada} data-oid=".g7a7c6">
              <SelectTrigger className="w-[200px]" data-oid="d1ke6_7">
                <SelectValue placeholder="Seleccionar sede" data-oid="_efuj.6" />
              </SelectTrigger>
              <SelectContent data-oid="lunr2w-">
                <SelectItem value="Sede Norte" data-oid="izyf:gz">
                  Sede Norte
                </SelectItem>
                <SelectItem value="Sede Sur" data-oid="vhpq2n8">
                  Sede Sur
                </SelectItem>
                <SelectItem value="Sede Santa Cruz" data-oid="4t031yl">
                  Sede Santa Cruz
                </SelectItem>
              </SelectContent>
            </Select>

            <Tabs
              value={vistaActual}
              onValueChange={(v) => setVistaActual(v as VistaTipo)}
              data-oid="7cz-kmt"
            >
              <TabsList data-oid="2:ct3l9">
                <TabsTrigger value="aulas" data-oid="swyayff">
                  <LayoutGrid className="h-4 w-4 mr-2" data-oid="ftvsxbo" />
                  Aulas
                </TabsTrigger>
                <TabsTrigger value="profesores" data-oid="qijjox:">
                  <User className="h-4 w-4 mr-2" data-oid="kfcgnpm" />
                  Profesores
                </TabsTrigger>
                <TabsTrigger value="cursos" data-oid="hl4d_-l">
                  <BookOpen className="h-4 w-4 mr-2" data-oid="l-lr:ne" />
                  Cursos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
        data-oid="va9k8ut"
      />

      {/* Main Content */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 220px)' }} data-oid="a_tqz_t">
        {vistaActual !== 'aulas' ? (
          <div className="flex-1 flex items-center justify-center" data-oid="qi4.anq">
            <EmptyState
              icon={Users}
              title="Vista en desarrollo"
              description={`La vista de ${vistaActual === 'profesores' ? 'profesores' : 'cursos'} está en fase inicial. Usa Exportar para validar los datos actuales.`}
              action={{ label: 'Exportar datos', onClick: handleExport }}
              data-oid="rvf48yw"
            />
          </div>
        ) : (
          <>
            {/* Panel Lateral - Leyenda */}
            <Card
              className="w-64 p-4 space-y-6 overflow-y-auto self-start sticky top-0"
              data-oid="fbnnspm"
            >
              <div data-oid="qnb_1lo">
                <h3 className="font-semibold mb-3 flex items-center gap-2" data-oid="i5d4mnh">
                  <Filter className="h-4 w-4" data-oid="l3i61ya" />
                  Leyenda
                </h3>
                <div className="space-y-2" data-oid="1cbruai">
                  <div className="flex items-center gap-2" data-oid="7:-8qwf">
                    <div className="w-4 h-4 bg-primary rounded" data-oid="c8n1ks0"></div>
                    <span className="text-sm" data-oid="mt7mmwb">
                      En Curso
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid="-a1cwjr">
                    <div className="w-4 h-4 bg-green-500 rounded" data-oid="dbby5sc"></div>
                    <span className="text-sm" data-oid="0ofe2ip">
                      Abierta
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid=":c_5:b2">
                    <div className="w-4 h-4 bg-blue-500 rounded" data-oid="pe:srst"></div>
                    <span className="text-sm" data-oid="p:3iv:u">
                      Planificada
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid="16c3_5c">
                    <div
                      className="w-4 h-4 bg-orange-500 rounded border-2 border-orange-700"
                      data-oid="z7xvqg."
                    ></div>
                    <span className="text-sm" data-oid="2nk8p.d">
                      Conflicto
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid="ydjz:6i">
                    <div className="w-4 h-4 bg-gray-400 rounded" data-oid="5spob5r"></div>
                    <span className="text-sm" data-oid="8ia:q43">
                      Completada
                    </span>
                  </div>
                  <div className="flex items-center gap-2" data-oid="logr6f4">
                    <div
                      className="w-4 h-4 bg-secondary border-2 border-dashed rounded"
                      data-oid="a7zvy9t"
                    ></div>
                    <span className="text-sm" data-oid="nohlsyu">
                      Libre
                    </span>
                  </div>
                </div>
              </div>

              <div data-oid="p7y9-j1">
                <h3 className="font-semibold mb-3" data-oid="0asw:d:">
                  Aulas Activas
                </h3>
                <div className="space-y-2" data-oid="2s:ob8u">
                  {aulasFiltradas.map((aula) => {
                    const cursosEnAula = horariosFiltrados.filter((h) => h.aula_id === aula.id)
                    return (
                      <div key={aula.id} className="text-sm" data-oid="sbpuam7">
                        <div className="font-medium" data-oid="_6_enr7">
                          {aula.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground" data-oid="rape3l0">
                          {cursosEnAula.length} clases • Cap: {aula.capacidad}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div data-oid="dji0hbr">
                <h3 className="font-semibold mb-3" data-oid="0sjxlkq">
                  Estadísticas
                </h3>
                <div className="space-y-2 text-sm" data-oid="73wj3-0">
                  <div className="flex justify-between" data-oid="6je:8hk">
                    <span className="text-muted-foreground" data-oid="xelek99">
                      Total Clases:
                    </span>
                    <span className="font-medium" data-oid="-o:5b3z">
                      {horariosFiltrados.length}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="3j094ja">
                    <span className="text-muted-foreground" data-oid="hocddgm">
                      Conflictos:
                    </span>
                    <span className="font-medium text-orange-500" data-oid=".esj364">
                      {horariosFiltrados.filter((h) => h.tiene_conflicto).length}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="fh1emhx">
                    <span className="text-muted-foreground" data-oid="3e5wqsh">
                      Aulas:
                    </span>
                    <span className="font-medium" data-oid="udba8ke">
                      {aulasFiltradas.length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Calendario Grid */}
            <Card
              className="flex-1 overflow-hidden flex flex-col"
              style={{ maxHeight: 'calc(100vh - 220px)' }}
              data-oid="rdb5aqz"
            >
              <div className="flex-1 overflow-auto" data-oid="czpt:p_">
                <div className="min-w-max" data-oid="ytz.uk4">
                  {/* Header con nombres de aulas */}
                  <div
                    className="sticky top-0 z-20 bg-card border-b border-border"
                    data-oid=":_no91g"
                  >
                    <div className="flex" data-oid="0r-fgkb">
                      {/* Columna de horas */}
                      <div
                        className="w-16 bg-muted border-r border-border flex-shrink-0 font-semibold text-center py-3"
                        data-oid="mmsrpjy"
                      >
                        Hora
                      </div>
                      {/* Columnas de aulas */}
                      {aulasFiltradas.map((aula) => (
                        <div
                          key={aula.id}
                          className="border-r border-border flex-shrink-0 p-3 bg-muted"
                          style={{ width: `${ANCHO_COLUMNA_AULA}px` }}
                          data-oid="8r56qwp"
                        >
                          <div className="font-semibold text-sm" data-oid="vog18pr">
                            {aula.nombre}
                          </div>
                          <div className="text-xs text-muted-foreground" data-oid="rb0_8nl">
                            Cap: {aula.capacidad} | {aula.codigo}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid de horarios */}
                  <div className="relative" data-oid="oembamk">
                    {/* Filas de horas */}
                    {horas.map((hora) => {
                      const horaNum = parseInt(hora.split(':')[0])

                      return (
                        <div
                          key={hora}
                          className="flex border-b border-border"
                          style={{ height: `${PIXELS_POR_HORA}px` }}
                          data-oid="g2n1cz_"
                        >
                          {/* Columna de hora */}
                          <div
                            className="w-16 bg-muted border-r border-border flex-shrink-0 text-sm font-medium text-center py-2"
                            data-oid="xqal9ol"
                          >
                            {hora}
                          </div>
                          {/* Columnas de aulas */}
                          {aulasFiltradas.map((aula) => {
                            const isDragOver =
                              dragOverCell?.aulaId === aula.id && dragOverCell?.hora === horaNum

                            return (
                              <div
                                key={`${hora}-${aula.id}`}
                                role="gridcell"
                                tabIndex={-1}
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
                                data-oid="wat6vmm"
                              >
                                {/* Líneas de 30 minutos */}
                                <div
                                  className="absolute inset-x-0 border-t border-dashed border-border/50"
                                  style={{ top: `${PIXELS_POR_HORA / 2}px` }}
                                  data-oid="l-y5c0m"
                                />

                                {isDragOver && (
                                  <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    data-oid="yin.iwc"
                                  >
                                    {dragValid ? (
                                      <CheckCircle2
                                        className="h-8 w-8 text-green-600"
                                        data-oid="h.ficqs"
                                      />
                                    ) : (
                                      <AlertTriangle
                                        className="h-8 w-8 text-red-600"
                                        data-oid="-qdm6of"
                                      />
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
                          role="button"
                          tabIndex={0}
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
                          onClick={() => {
                            // Only navigate if not dragging
                            if (!isDragging) {
                              router.push(`/programacion/${horario.convocatoria_id}`)
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle Enter and Space for keyboard accessibility
                            if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
                              e.preventDefault()
                              router.push(`/programacion/${horario.convocatoria_id}`)
                            }
                          }}
                          title="Arrastrar para cambiar horario o aula"
                          data-oid="xxjokca"
                        >
                          {horario.tiene_conflicto && (
                            <AlertTriangle
                              className="absolute top-1 right-1 h-4 w-4 text-white"
                              data-oid="cvphfsi"
                            />
                          )}
                          <div className="text-xs font-semibold line-clamp-1" data-oid="vobizi3">
                            {horario.curso_nombre}
                          </div>
                          <div className="text-xs opacity-90 line-clamp-1" data-oid="i1qqcsq">
                            {horario.profesor}
                          </div>
                          <div
                            className="text-xs opacity-80 flex items-center gap-1 mt-1"
                            data-oid="07m97wl"
                          >
                            <Clock className="h-3 w-3" data-oid="mewe7sl" />
                            {horario.hora_inicio}-{horario.hora_fin}
                          </div>
                          {altura > 60 && (
                            <div className="text-xs opacity-80 mt-1" data-oid="i:ztqk1">
                              <Badge variant="secondary" className="text-xs" data-oid="msj3w.6">
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
          </>
        )}
      </div>
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function PlannerVisualPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12" data-oid="7dmwkz0">
          <p className="text-muted-foreground" data-oid="vcw03:q">
            Cargando planificador...
          </p>
        </div>
      }
      data-oid="9nygyne"
    >
      <PlannerVisualPageContent data-oid="-sn070d" />
    </Suspense>
  )
}
