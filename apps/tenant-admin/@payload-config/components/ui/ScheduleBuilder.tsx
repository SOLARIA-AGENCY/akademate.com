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
    <div className="space-y-4">
      {/* Existing Schedule Entries */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">
            Horarios Configurados
          </Label>
          <div className="flex flex-wrap gap-2">
            {value.map((entry, index) => {
              const dayLabel = DAYS.find((d) => d.value === entry.day)?.label || entry.day
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 py-1.5 px-3"
                >
                  <span className="font-semibold">{dayLabel}</span>
                  <span className="text-xs">
                    {entry.startTime} - {entry.endTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Add New Entry Form */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <Label className="text-sm font-semibold">Agregar Horario</Label>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="schedule-day" className="text-xs">
              Día
            </Label>
            <Select value={newEntry.day} onValueChange={(day) => setNewEntry({ ...newEntry, day })}>
              <SelectTrigger id="schedule-day">
                <SelectValue placeholder="Día" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-start" className="text-xs">
              Hora Inicio
            </Label>
            <Select
              value={newEntry.startTime}
              onValueChange={(time) => setNewEntry({ ...newEntry, startTime: time })}
            >
              <SelectTrigger id="schedule-start">
                <SelectValue placeholder="Inicio" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-end" className="text-xs">
              Hora Fin
            </Label>
            <Select
              value={newEntry.endTime}
              onValueChange={(time) => setNewEntry({ ...newEntry, endTime: time })}
            >
              <SelectTrigger id="schedule-end">
                <SelectValue placeholder="Fin" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
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
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Horario
        </Button>
      </div>
    </div>
  )
}
