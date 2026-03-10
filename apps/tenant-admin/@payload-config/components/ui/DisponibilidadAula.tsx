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
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        data-oid="azoq.r."
      >
        <Card className="max-w-md w-full p-6" data-oid="-be0_-r">
          <p className="text-center text-muted-foreground" data-oid="2pbrasb">
            No se encontró el aula
          </p>
          <Button onClick={onClose} className="w-full mt-4" data-oid="8-2ps6x">
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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      data-oid="qw64i7d"
    >
      <Card className="max-w-5xl w-full my-8" data-oid="4szjuh7">
        {/* Header */}
        <div className="border-b p-6" data-oid="zbk71l3">
          <div className="flex items-start justify-between" data-oid="z2toc_k">
            <div className="space-y-2" data-oid="xadi1iu">
              <h2 className="text-2xl font-bold" data-oid="emyoy9r">
                Disponibilidad de Aula
              </h2>
              <div className="flex items-center gap-3 flex-wrap" data-oid="lz5in7n">
                <Badge variant="outline" className="text-base" data-oid="-4yxozl">
                  {aula.nombre} ({aula.codigo})
                </Badge>
                <Badge variant="outline" data-oid="qihcdfl">
                  {aula.sede}
                </Badge>
                <Badge variant="outline" data-oid="sew8lep">
                  Capacidad: {aula.capacidad}
                </Badge>
                <Badge
                  className={
                    porcentajeDisponibilidad >= 70
                      ? 'bg-green-500'
                      : porcentajeDisponibilidad >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                  }
                  data-oid="0fe8bm:"
                >
                  {porcentajeDisponibilidad}% Disponible
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-oid="yzdova3">
              <X className="h-5 w-5" data-oid="fn0dkv8" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b bg-secondary/20" data-oid="vp:4yks">
          <div className="text-center" data-oid="p3qgqcp">
            <p className="text-3xl font-bold" data-oid="6l45cgu">
              {totalSlots}
            </p>
            <p className="text-sm text-muted-foreground" data-oid="zu01uko">
              Total Slots
            </p>
          </div>
          <div className="text-center" data-oid="17sfvae">
            <p className="text-3xl font-bold text-green-600" data-oid="2e48alk">
              {disponiblesCount}
            </p>
            <p className="text-sm text-muted-foreground" data-oid="tvj4elp">
              Disponibles
            </p>
          </div>
          <div className="text-center" data-oid="iuejfwv">
            <p className="text-3xl font-bold text-red-600" data-oid="ow6kx5x">
              {ocupadosCount}
            </p>
            <p className="text-sm text-muted-foreground" data-oid="k.j9.pw">
              Ocupados
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="p-6 border-b bg-secondary/10" data-oid="9mgt:si">
          <div className="flex items-center gap-6 flex-wrap" data-oid="tv90z1j">
            <div className="flex items-center gap-2" data-oid="a6t.q7p">
              <div
                className="w-6 h-6 bg-green-100 border-2 border-green-500 rounded"
                data-oid="3cq6nvw"
              />

              <span className="text-sm" data-oid="fwr:aht">
                Disponible
              </span>
            </div>
            <div className="flex items-center gap-2" data-oid="lg2me5-">
              <div
                className="w-6 h-6 bg-red-100 border-2 border-red-500 rounded"
                data-oid="fw0eov7"
              />

              <span className="text-sm" data-oid="uwjwjj6">
                Ocupado
              </span>
            </div>
            <div className="flex items-center gap-2" data-oid=":yjsdqu">
              <Clock className="h-5 w-5 text-muted-foreground" data-oid="sr1jm8j" />
              <span className="text-sm" data-oid="px30ua2">
                Slots de 2 horas (8:00-22:00)
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-x-auto" data-oid="lo-n5dj">
          <div className="min-w-max" data-oid="a8x-ghb">
            {/* Header row with time slots */}
            <div className="flex mb-2" data-oid="viyit3i">
              <div
                className="w-32 shrink-0 font-semibold text-sm text-muted-foreground"
                data-oid="7j2h16v"
              >
                Día / Hora
              </div>
              {TIME_SLOTS.map((hora) => (
                <div
                  key={hora}
                  className="w-24 text-center text-sm font-medium shrink-0"
                  data-oid="k19dgx_"
                >
                  {hora}
                </div>
              ))}
            </div>

            {/* Rows for each day */}
            {DIAS.map((dia) => (
              <div key={dia} className="flex mb-2" data-oid="2ug:bhs">
                <div className="w-32 shrink-0 flex items-center font-medium" data-oid="24ae41c">
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
                        data-oid="w88rfr6"
                      >
                        <div
                          className="absolute inset-0 rounded-md border-2 border-red-500 bg-red-50 cursor-pointer hover:shadow-lg transition-shadow"
                          style={{ backgroundColor: slot.color ? `${slot.color}15` : undefined }}
                          data-oid="vzne93v"
                        >
                          <div
                            className="p-1 h-full flex flex-col justify-center"
                            data-oid="9h326qo"
                          >
                            <div
                              className="text-xs font-semibold line-clamp-1 text-red-900"
                              data-oid="ocy0dq4"
                            >
                              {slot.curso}
                            </div>
                            <div
                              className="text-xs line-clamp-1 text-red-700 opacity-80"
                              data-oid="t5k:kai"
                            >
                              {slot.profesor}
                            </div>
                          </div>
                        </div>

                        {/* Tooltip on hover */}
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10"
                          data-oid="vev6d36"
                        >
                          <Card className="p-3 shadow-lg min-w-[200px]" data-oid=":_ezzns">
                            <p className="font-semibold text-sm" data-oid="-a59kjv">
                              {slot.curso}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1" data-oid="oe5k67d">
                              {slot.profesor}
                            </p>
                            <div
                              className="flex items-center gap-1 mt-2 text-xs text-red-600"
                              data-oid="4h:xozc"
                            >
                              <AlertCircle className="h-3 w-3" data-oid=":i167._" />
                              <span data-oid="37hmtkb">Ocupado</span>
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
                      data-oid="i48haqd"
                    >
                      <div
                        className="absolute inset-0 rounded-md border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-colors"
                        data-oid="tba5t6."
                      >
                        <div className="h-full flex items-center justify-center" data-oid="8bxek6q">
                          <CheckCircle2
                            className="h-5 w-5 text-green-600 opacity-50"
                            data-oid="2kebn5i"
                          />
                        </div>
                      </div>

                      {/* Tooltip on hover */}
                      <div
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10"
                        data-oid="91atkwk"
                      >
                        <Card className="p-2 shadow-lg" data-oid="mu57mss">
                          <div
                            className="flex items-center gap-1 text-xs text-green-600"
                            data-oid="_lc0-pb"
                          >
                            <CheckCircle2 className="h-3 w-3" data-oid="51qtd71" />
                            <span data-oid="9ov0grb">Disponible</span>
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
        <div className="border-t p-6 bg-secondary/10" data-oid="xb0821k">
          <div className="flex items-center justify-between" data-oid="9o:a-11">
            <p className="text-sm text-muted-foreground" data-oid="fxo9_m-">
              Esta vista muestra los horarios ocupados en bloques de 2 horas. Los slots en verde
              están disponibles para asignar nuevas convocatorias.
            </p>
            <Button
              onClick={onClose}
              className="bg-[#ff2014] hover:bg-[#ff2014]/90"
              data-oid="_38l7y4"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
