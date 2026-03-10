'use client'

import * as React from 'react'
import { Label } from '@payload-config/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Plus, X } from 'lucide-react'

export interface ScheduleEntry {
  day: string
  startTime: string
  endTime: string
}

interface ScheduleBuilderProps {
  value: ScheduleEntry[]
  onChange: (schedule: ScheduleEntry[]) => void
}

const DAYS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

// Generate time slots in 15-minute intervals from 08:00 to 22:00
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      slots.push(timeStr)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

export function ScheduleBuilder({ value, onChange }: ScheduleBuilderProps) {
  const [newEntry, setNewEntry] = React.useState<Partial<ScheduleEntry>>({
    day: '',
    startTime: '',
    endTime: '',
  })

  const handleAddEntry = () => {
    if (newEntry.day && newEntry.startTime && newEntry.endTime) {
      onChange([...value, newEntry as ScheduleEntry])
      setNewEntry({ day: '', startTime: '', endTime: '' })
    }
  }

  const handleRemoveEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const isValidEntry = newEntry.day && newEntry.startTime && newEntry.endTime

  return (
    <div className="space-y-4" data-oid="5_p:bw0">
      {/* Existing Schedule Entries */}
      {value.length > 0 && (
        <div className="space-y-2" data-oid="ex0:c9b">
          <Label
            className="text-xs font-semibold uppercase text-muted-foreground"
            data-oid="mhsq03_"
          >
            Horarios Configurados
          </Label>
          <div className="flex flex-wrap gap-2" data-oid="_.d2g7i">
            {value.map((entry, index) => {
              const dayLabel = DAYS.find((d) => d.value === entry.day)?.label || entry.day
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 py-1.5 px-3"
                  data-oid="f97_9_0"
                >
                  <span className="font-semibold" data-oid="tmagk_r">
                    {dayLabel}
                  </span>
                  <span className="text-xs" data-oid="l:45aoi">
                    {entry.startTime} - {entry.endTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    data-oid="_uql4ld"
                  >
                    <X className="h-3 w-3" data-oid="lf306yp" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Add New Entry Form */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30" data-oid="i_vzui:">
        <Label className="text-sm font-semibold" data-oid="b8pbpd3">
          Agregar Horario
        </Label>

        <div className="grid grid-cols-3 gap-3" data-oid="2id339q">
          <div className="space-y-2" data-oid="6g8vtqo">
            <Label htmlFor="schedule-day" className="text-xs" data-oid="p8z8:_x">
              Día
            </Label>
            <Select
              value={newEntry.day}
              onValueChange={(day) => setNewEntry({ ...newEntry, day })}
              data-oid="ef26hgk"
            >
              <SelectTrigger id="schedule-day" data-oid="s4nc:w:">
                <SelectValue placeholder="Día" data-oid="60eyrx2" />
              </SelectTrigger>
              <SelectContent data-oid="cwie0as">
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value} data-oid="p0hj9dw">
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2" data-oid="9g2ksns">
            <Label htmlFor="schedule-start" className="text-xs" data-oid="ctdmi5:">
              Hora Inicio
            </Label>
            <Select
              value={newEntry.startTime}
              onValueChange={(time) => setNewEntry({ ...newEntry, startTime: time })}
              data-oid="7s19-zo"
            >
              <SelectTrigger id="schedule-start" data-oid="cgk9mkp">
                <SelectValue placeholder="Inicio" data-oid="t0vngp1" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]" data-oid="4zf9r0_">
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time} data-oid="s3brs49">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2" data-oid="nqa8.52">
            <Label htmlFor="schedule-end" className="text-xs" data-oid="lywa2m_">
              Hora Fin
            </Label>
            <Select
              value={newEntry.endTime}
              onValueChange={(time) => setNewEntry({ ...newEntry, endTime: time })}
              data-oid="gz2c:ou"
            >
              <SelectTrigger id="schedule-end" data-oid="iakp5rd">
                <SelectValue placeholder="Fin" data-oid="m1v3o5n" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]" data-oid="2n2o_ck">
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time} data-oid="tff0n06">
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddEntry}
          disabled={!isValidEntry}
          className="w-full"
          data-oid="t0qsudr"
        >
          <Plus className="h-4 w-4 mr-2" data-oid=".qb6v5e" />
          Agregar Horario
        </Button>
      </div>
    </div>
  )
}
