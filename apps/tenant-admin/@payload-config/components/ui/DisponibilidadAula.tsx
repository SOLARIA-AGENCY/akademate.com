'use client'

import * as React from 'react'
import { Card } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { horariosDetalladosMock, aulasMockData } from '@payload-config/data/mockAulas'

interface DisponibilidadAulaProps {
  aulaId: string
  onClose: () => void
}

interface SlotHorario {
  dia: string
  hora: string
  ocupado: boolean
  curso?: string
  profesor?: string
  color?: string
}

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const DIAS_LABELS: { [key: string]: string } = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
}

// Generate time slots from 8:00 to 22:00 in 2-hour increments
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hora = 8; hora < 22; hora += 2) {
    slots.push(`${hora.toString().padStart(2, '0')}:00`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function DisponibilidadAula({ aulaId, onClose }: DisponibilidadAulaProps) {
  const aula = aulasMockData.find((a) => a.id === aulaId)
  const horarios = horariosDetalladosMock.filter((h) => h.aula_id === aulaId)

  if (!aula) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6">
          <p className="text-center text-muted-foreground">No se encontró el aula</p>
          <Button onClick={onClose} className="w-full mt-4">
            Cerrar
          </Button>
        </Card>
      </div>
    )
  }

  // Build occupation map
  const ocupacionMap: { [key: string]: SlotHorario } = {}

  // Initialize all slots as available
  DIAS.forEach((dia) => {
    TIME_SLOTS.forEach((hora) => {
      const key = `${dia}-${hora}`
      ocupacionMap[key] = {
        dia,
        hora,
        ocupado: false,
      }
    })
  })

  // Mark occupied slots
  horarios.forEach((horario) => {
    const [horaInicio] = horario.hora_inicio.split(':').map(Number)
    const [horaFin] = horario.hora_fin.split(':').map(Number)

    // Mark all 2-hour slots that fall within this horario
    for (let hora = 8; hora < 22; hora += 2) {
      if (hora >= horaInicio && hora < horaFin) {
        const key = `${horario.dia}-${hora.toString().padStart(2, '0')}:00`
        ocupacionMap[key] = {
          dia: horario.dia,
          hora: `${hora.toString().padStart(2, '0')}:00`,
          ocupado: true,
          curso: horario.curso_nombre,
          profesor: horario.profesor,
          color: horario.color,
        }
      }
    }
  })

  // Calculate availability stats
  const totalSlots = DIAS.length * TIME_SLOTS.length
  const ocupadosCount = Object.values(ocupacionMap).filter((s) => s.ocupado).length
  const disponiblesCount = totalSlots - ocupadosCount
  const porcentajeDisponibilidad = Math.round((disponiblesCount / totalSlots) * 100)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-5xl w-full my-8">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Disponibilidad de Aula</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-base">
                  {aula.nombre} ({aula.codigo})
                </Badge>
                <Badge variant="outline">{aula.sede}</Badge>
                <Badge variant="outline">Capacidad: {aula.capacidad}</Badge>
                <Badge
                  className={
                    porcentajeDisponibilidad >= 70
                      ? 'bg-green-500'
                      : porcentajeDisponibilidad >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                  }
                >
                  {porcentajeDisponibilidad}% Disponible
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b bg-secondary/20">
          <div className="text-center">
            <p className="text-3xl font-bold">{totalSlots}</p>
            <p className="text-sm text-muted-foreground">Total Slots</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{disponiblesCount}</p>
            <p className="text-sm text-muted-foreground">Disponibles</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{ocupadosCount}</p>
            <p className="text-sm text-muted-foreground">Ocupados</p>
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 border-b bg-secondary/10">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-500 rounded" />
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border-2 border-red-500 rounded" />
              <span className="text-sm">Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Slots de 2 horas (8:00-22:00)</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-x-auto">
          <div className="min-w-max">
            {/* Header row with time slots */}
            <div className="flex mb-2">
              <div className="w-32 shrink-0 font-semibold text-sm text-muted-foreground">
                Día / Hora
              </div>
              {TIME_SLOTS.map((hora) => (
                <div key={hora} className="w-24 text-center text-sm font-medium shrink-0">
                  {hora}
                </div>
              ))}
            </div>

            {/* Rows for each day */}
            {DIAS.map((dia) => (
              <div key={dia} className="flex mb-2">
                <div className="w-32 shrink-0 flex items-center font-medium">
                  {DIAS_LABELS[dia]}
                </div>
                {TIME_SLOTS.map((hora) => {
                  const key = `${dia}-${hora}`
                  const slot = ocupacionMap[key]

                  if (slot.ocupado) {
                    return (
                      <div
                        key={key}
                        className="w-24 h-16 mx-1 shrink-0 relative group"
                        title={`${slot.curso}\n${slot.profesor}`}
                      >
                        <div
                          className="absolute inset-0 rounded-md border-2 border-red-500 bg-red-50 cursor-pointer hover:shadow-lg transition-shadow"
                          style={{ backgroundColor: slot.color ? `${slot.color}15` : undefined }}
                        >
                          <div className="p-1 h-full flex flex-col justify-center">
                            <div className="text-xs font-semibold line-clamp-1 text-red-900">
                              {slot.curso}
                            </div>
                            <div className="text-xs line-clamp-1 text-red-700 opacity-80">
                              {slot.profesor}
                            </div>
                          </div>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <Card className="p-3 shadow-lg min-w-[200px]">
                            <p className="font-semibold text-sm">{slot.curso}</p>
                            <p className="text-xs text-muted-foreground mt-1">{slot.profesor}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Ocupado</span>
                            </div>
                          </Card>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={key}
                      className="w-24 h-16 mx-1 shrink-0 relative group cursor-pointer"
                      title="Disponible"
                    >
                      <div className="absolute inset-0 rounded-md border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-colors">
                        <div className="h-full flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600 opacity-50" />
                        </div>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <Card className="p-2 shadow-lg">
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Disponible</span>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-secondary/10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Esta vista muestra los horarios ocupados en bloques de 2 horas. Los slots en verde
              están disponibles para asignar nuevas convocatorias.
            </p>
            <Button onClick={onClose} className="bg-[#ff2014] hover:bg-[#ff2014]/90">
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
