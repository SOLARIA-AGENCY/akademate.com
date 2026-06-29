'use client'

import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  CalendarRange,
  Loader2,
  Building2,
  List,
  Printer,
  Download,
  X,
} from 'lucide-react'
import { downloadCsv, printTable, type ExportColumn } from '@/app/lib/dashboard-export'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Convocatoria {
  id: string
  codigo: string
  curso: string
  cursoId: string
  tipo: string
  sede: string
  sedeId: string
  aula: string
  aulaId: string
  fechaInicio: string
  fechaFin: string
  horaInicio: string
  horaFin: string
  dias: string[]
  plazas: number
  inscritos: number
  precio: number
  matricula?: number
  horasPracticas?: string | null
  certificacion?: string | null
  profesor: string
  profesores: string[]
  profesorRefs: Array<{ id: string; name: string }>
  estado: string
  planningStatus?: string
  color: string
}

interface Campus {
  id: string
  name: string
}

interface CourseOption {
  id: string
  name: string
  tipo: string
  studyType: string
  areaId: string
  areaName: string
}

interface ClassroomOption {
  id: string
  name: string
  campusId: string
  capacity: number
}

interface StaffOption {
  id: string
  name: string
  campusIds: string[]
  qualifiedAreaIds: string[]
}

interface AreaOption {
  id: string
  name: string
  color?: string | null
}

type DraftConvocatoria = {
  trainingType: string
  areaId: string
  courseId: string
  campusId: string
  classroomId: string
  instructorIds: string[]
  startDate: string
  endDate: string
  day: string
  timeStart: string
  timeEnd: string
  shift: string
  maxStudents: string
  price: string
  enrollmentFee: string
}

type ViewMode = 'anual' | 'mes' | 'semana' | 'dia' | 'lista'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 - 21:00

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500',
  enrollment_open: 'bg-green-500',
  in_progress: 'bg-primary',
  draft: 'bg-gray-400',
  completed: 'bg-gray-300',
  cancelled: 'bg-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  published: 'Publicado',
  enrollment_open: 'Inscripcion abierta',
  in_progress: 'En curso',
  draft: 'Sin publicar',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const EMPTY_DRAFT: DraftConvocatoria = {
  trainingType: '',
  areaId: '',
  courseId: '',
  campusId: '',
  classroomId: '',
  instructorIds: [],
  startDate: '',
  endDate: '',
  day: 'monday',
  timeStart: '10:00',
  timeEnd: '14:00',
  shift: 'morning',
  maxStudents: '18',
  price: '',
  enrollmentFee: '150',
}

const DAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
]

const TRAINING_TYPE_OPTIONS = [
  { value: 'privados', label: 'Curso privado' },
  { value: 'ocupados', label: 'Curso para ocupados' },
  { value: 'desempleados', label: 'Curso para desempleados' },
  { value: 'teleformacion', label: 'Teleformación' },
  { value: 'ciclo', label: 'Ciclo' },
]

// Festivos Canarias 2026
const HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': 'Año Nuevo',
  '2026-01-06': 'Reyes Magos',
  '2026-02-02': 'Dia de la Candelaria',
  '2026-04-02': 'Jueves Santo',
  '2026-04-03': 'Viernes Santo',
  '2026-05-01': 'Dia del Trabajo',
  '2026-05-30': 'Dia de Canarias',
  '2026-08-15': 'Asuncion',
  '2026-10-12': 'Fiesta Nacional',
  '2026-11-01': 'Todos los Santos',
  '2026-12-06': 'Dia de la Constitucion',
  '2026-12-08': 'Inmaculada',
  '2026-12-25': 'Navidad',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function convocatoriaInMonth(conv: Convocatoria, year: number, month: number): boolean {
  const start = new Date(conv.fechaInicio)
  const end = new Date(conv.fechaFin)
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  return start <= monthEnd && end >= monthStart
}

function convocatoriaOnDate(conv: Convocatoria, dateKey: string): boolean {
  const d = new Date(dateKey)
  const start = new Date(conv.fechaInicio)
  const end = new Date(conv.fechaFin)
  if (d < start || d > end) return false
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return conv.dias.includes(dayNames[d.getDay()])
}

function formatMoney(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString('es-ES')} €`
    : 'Consultar'
}

function normalizePlanningTrainingType(course?: Pick<CourseOption, 'tipo' | 'studyType'> | null): string {
  const raw = `${course?.studyType ?? ''} ${course?.tipo ?? ''}`.toLowerCase()
  if (raw.includes('ciclo')) return 'ciclo'
  if (raw.includes('teleformacion') || raw.includes('online')) return 'teleformacion'
  if (raw.includes('ocupado')) return 'ocupados'
  if (raw.includes('desempleado') || raw.includes('fped')) return 'desempleados'
  if (raw.includes('privado') || raw.includes('private')) return 'privados'
  return ''
}

function getCourseTrainingPayloadType(course: CourseOption | undefined, fallback: string): string {
  if (course?.tipo) return course.tipo
  if (fallback === 'ciclo') return 'ciclo_medio'
  if (fallback === 'privados') return 'private'
  return fallback
}

function relationId(value: unknown): string | null {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (id != null) return String(id)
  }
  return null
}

function relationName(value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as { nombre?: unknown; name?: unknown }
    return String(record.nombre ?? record.name ?? '').trim()
  }
  return ''
}

function formatEnrollmentFee(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value.toLocaleString('es-ES')} €`
    : '—'
}

function formatTeacherNames(conv: Pick<Convocatoria, 'profesor' | 'profesores'>): string {
  return conv.profesores.length > 0 ? conv.profesores.join(', ') : conv.profesor
}

function formatLongDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(' de ', ' ')
    .replace(' de ', ' ')
}

function formatDayLabels(days: string[]): string {
  const labels = days
    .map((day) => DAY_OPTIONS.find((item) => item.value === day)?.label ?? day)
    .filter(Boolean)
  return labels.length > 0 ? labels.join(', ') : '—'
}

function formatScheduleRange(start?: string, end?: string): string {
  if (!start || !end) return '—'
  return `${start} - ${end}`
}

function formatSessionHours(start?: string, end?: string): string {
  if (!start || !end) return '—'
  const [startHour = '0', startMinute = '0'] = start.split(':')
  const [endHour = '0', endMinute = '0'] = end.split(':')
  const startTotal = Number(startHour) * 60 + Number(startMinute)
  const endTotal = Number(endHour) * 60 + Number(endMinute)
  const diff = endTotal - startTotal
  if (!Number.isFinite(diff) || diff <= 0) return '—'
  const hours = diff / 60
  return Number.isInteger(hours)
    ? `${hours} h`
    : `${hours.toLocaleString('es-ES', { maximumFractionDigits: 1 })} h`
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Annual Gantt View
// ---------------------------------------------------------------------------

function AnnualGantt({
  convocatorias,
  year,
  onConvClick,
}: {
  convocatorias: Convocatoria[]
  year: number
  onConvClick: (id: string) => void
}) {
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year, 11, 31).getTime()
  const yearDays = (yearEnd - yearStart) / (1000 * 60 * 60 * 24)

  return (
    <Card>
      <CardContent className="p-4 overflow-x-auto">
        {/* Month headers */}
        <div className="flex border-b pb-2 mb-3 min-w-[900px]">
          <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">
            Convocatoria
          </div>
          <div className="flex-1 flex">
            {MONTHS.map((m, i) => (
              <div
                key={m}
                className="flex-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border/30 first:border-l-0"
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Convocatoria bars */}
        {convocatorias.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No hay convocatorias para {year}
          </div>
        ) : (
          <div className="space-y-2 min-w-[900px]">
            {convocatorias.map((conv) => {
              const start = new Date(conv.fechaInicio)
              const end = new Date(conv.fechaFin)
              const barStart = Math.max(0, (start.getTime() - yearStart) / (1000 * 60 * 60 * 24))
              const barEnd = Math.min(yearDays, (end.getTime() - yearStart) / (1000 * 60 * 60 * 24))
              const leftPct = (barStart / yearDays) * 100
              const widthPct = ((barEnd - barStart) / yearDays) * 100

              const ocupacion =
                conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0

              return (
                <div key={conv.id} className="flex items-center group">
                  <div
                    className="w-48 shrink-0 pr-3 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onConvClick(conv.id)}
                  >
                    <p className="text-xs font-medium truncate leading-tight">{conv.curso}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {conv.sede}
                    </p>
                  </div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {/* Month grid lines */}
                    {MONTHS.map((_, i) => {
                      const monthStart = new Date(year, i, 1)
                      const pct =
                        ((monthStart.getTime() - yearStart) / (1000 * 60 * 60 * 24) / yearDays) *
                        100
                      return (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-border/20"
                          style={{ left: `${pct}%` }}
                        />
                      )
                    })}
                    {/* Bar */}
                    <div
                      className={`absolute top-1 bottom-1 rounded cursor-pointer transition-opacity group-hover:opacity-90 ${STATUS_COLORS[conv.estado] || 'bg-primary'}`}
                      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%` }}
                      onClick={() => onConvClick(conv.id)}
                      title={`${conv.curso}\n${conv.sede}\n${new Date(conv.fechaInicio).toLocaleDateString('es-ES')} — ${new Date(conv.fechaFin).toLocaleDateString('es-ES')}\n${conv.inscritos}/${conv.plazas} plazas (${ocupacion}%)`}
                    >
                      <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-medium truncate">
                        {conv.curso}
                      </span>
                    </div>
                    {/* Today marker */}
                    {(() => {
                      const today = new Date()
                      if (today.getFullYear() === year) {
                        const todayPct =
                          ((today.getTime() - yearStart) / (1000 * 60 * 60 * 24) / yearDays) * 100
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                            style={{ left: `${todayPct}%` }}
                          />
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Holiday markers */}
        <div className="mt-4 pt-3 border-t min-w-[900px]">
          <div className="flex items-center">
            <div className="w-48 shrink-0 text-[10px] text-muted-foreground">Festivos</div>
            <div className="flex-1 relative h-4">
              {Object.entries(HOLIDAYS_2026).map(([date, name]) => {
                const d = new Date(date)
                if (d.getFullYear() !== year) return null
                const pct = ((d.getTime() - yearStart) / (1000 * 60 * 60 * 24) / yearDays) * 100
                return (
                  <div
                    key={date}
                    className="absolute top-0 bottom-0 w-1 bg-red-300 rounded-full"
                    style={{ left: `${pct}%` }}
                    title={`${name} — ${d.toLocaleDateString('es-ES')}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Month Calendar View
// ---------------------------------------------------------------------------

function MonthCalendar({
  convocatorias,
  year,
  month,
  holidays,
  onConvClick,
}: {
  convocatorias: Convocatoria[]
  year: number
  month: number
  holidays: Record<string, string>
  onConvClick: (id: string) => void
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = formatDateKey(new Date())

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {MONTHS_FULL[month]} {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-20" />

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateKey === today
            const isHoliday = holidays[dateKey]
            const isWeekend = i % 7 >= 5

            const dayConvs = convocatorias.filter((c) => convocatoriaOnDate(c, dateKey))

            return (
              <div
                key={dateKey}
                className={`h-20 border rounded p-0.5 overflow-hidden ${
                  isToday ? 'border-primary border-2' : 'border-border/30'
                } ${isHoliday ? 'bg-red-50 dark:bg-red-950/20' : isWeekend ? 'bg-muted/30' : 'bg-background'}`}
              >
                <div className="flex items-center justify-between px-1">
                  <span
                    className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : isHoliday ? 'text-red-500' : ''}`}
                  >
                    {day}
                  </span>
                  {isHoliday && (
                    <span className="text-[8px] text-red-400 truncate ml-1" title={isHoliday}>
                      {isHoliday}
                    </span>
                  )}
                </div>
                <div className="space-y-px mt-0.5">
                  {dayConvs.slice(0, 3).map((conv) => (
                    <div
                      key={conv.id}
                      className={`text-[8px] text-white rounded px-1 py-px truncate cursor-pointer hover:opacity-80 ${STATUS_COLORS[conv.estado] || 'bg-primary'}`}
                      onClick={() => onConvClick(conv.id)}
                      title={`${conv.curso} — ${conv.horaInicio}-${conv.horaFin}`}
                    >
                      {conv.curso}
                    </div>
                  ))}
                  {dayConvs.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">
                      +{dayConvs.length - 3} mas
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

function WeekView({
  convocatorias,
  weekStart,
  holidays,
  onConvClick,
}: {
  convocatorias: Convocatoria[]
  weekStart: Date
  holidays: Record<string, string>
  onConvClick: (id: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <Card>
      <CardContent className="p-3 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px border-b pb-2 mb-1">
            <div />
            {days.map((d) => {
              const key = formatDateKey(d)
              const isToday = key === formatDateKey(new Date())
              const holiday = holidays[key]
              return (
                <div key={key} className={`text-center ${isToday ? 'text-primary font-bold' : ''}`}>
                  <p className="text-[10px] text-muted-foreground">
                    {WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </p>
                  <p className="text-sm font-medium">{d.getDate()}</p>
                  {holiday && <p className="text-[8px] text-red-400">{holiday}</p>}
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] gap-px border-b border-border/20"
            >
              <div className="text-[10px] text-muted-foreground py-2 text-right pr-2">
                {hour}:00
              </div>
              {days.map((d) => {
                const key = formatDateKey(d)
                const isHoliday = !!holidays[key]
                const hourConvs = convocatorias.filter((c) => {
                  if (!convocatoriaOnDate(c, key)) return false
                  const startH = parseInt(c.horaInicio?.split(':')[0] || '0', 10)
                  const endH = parseInt(c.horaFin?.split(':')[0] || '0', 10)
                  return hour >= startH && hour < endH
                })

                return (
                  <div
                    key={key + hour}
                    className={`min-h-[32px] border-l border-border/20 px-0.5 ${isHoliday ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
                  >
                    {hourConvs.map((conv) => {
                      const startH = parseInt(conv.horaInicio?.split(':')[0] || '0', 10)
                      if (hour !== startH) return null // Only render at start hour
                      const endH = parseInt(conv.horaFin?.split(':')[0] || '0', 10)
                      const span = endH - startH

                      return (
                        <div
                          key={conv.id}
                          className={`text-[9px] text-white rounded px-1 py-0.5 cursor-pointer hover:opacity-80 ${STATUS_COLORS[conv.estado] || 'bg-primary'}`}
                          style={{ minHeight: `${span * 32}px` }}
                          onClick={() => onConvClick(conv.id)}
                        >
                          <p className="font-medium truncate">{conv.curso}</p>
                          <p className="opacity-80">
                            {conv.horaInicio}-{conv.horaFin}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Day View (Classroom columns)
// ---------------------------------------------------------------------------

function DayView({
  convocatorias,
  date,
  holidays,
  onConvClick,
}: {
  convocatorias: Convocatoria[]
  date: Date
  holidays: Record<string, string>
  onConvClick: (id: string) => void
}) {
  const dateKey = formatDateKey(date)
  const holiday = holidays[dateKey]
  const dayConvs = convocatorias.filter((c) => convocatoriaOnDate(c, dateKey))

  // Group by sede for column display
  const bySedeMap = new Map<string, Convocatoria[]>()
  for (const c of dayConvs) {
    const key = c.sede || 'Sin sede'
    if (!bySedeMap.has(key)) bySedeMap.set(key, [])
    bySedeMap.get(key)!.push(c)
  }
  const columns = Array.from(bySedeMap.entries())

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {date.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </CardTitle>
          {holiday && (
            <Badge variant="destructive" className="text-[10px]">
              {holiday}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 overflow-x-auto">
        {dayConvs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {holiday ? `Festivo: ${holiday}` : 'No hay clases programadas este dia'}
          </div>
        ) : (
          <div className="min-w-[500px]">
            <div
              className={`grid gap-px`}
              style={{ gridTemplateColumns: `60px repeat(${Math.max(columns.length, 1)}, 1fr)` }}
            >
              {/* Headers */}
              <div />
              {columns.map(([sede]) => (
                <div
                  key={sede}
                  className="text-center text-xs font-medium py-2 bg-muted/30 rounded-t"
                >
                  <Building2 className="h-3 w-3 mx-auto mb-1" />
                  {sede}
                </div>
              ))}

              {/* Hours */}
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="text-[10px] text-muted-foreground text-right pr-2 py-3">
                    {hour}:00
                  </div>
                  {columns.map(([sede, convs]) => {
                    const hourConvs = convs.filter((c) => {
                      const startH = parseInt(c.horaInicio?.split(':')[0] || '0', 10)
                      const endH = parseInt(c.horaFin?.split(':')[0] || '0', 10)
                      return hour >= startH && hour < endH
                    })

                    return (
                      <div
                        key={sede + hour}
                        className="border-l border-t border-border/20 min-h-[40px] px-1"
                      >
                        {hourConvs.map((conv) => {
                          const startH = parseInt(conv.horaInicio?.split(':')[0] || '0', 10)
                          if (hour !== startH) return null
                          const endH = parseInt(conv.horaFin?.split(':')[0] || '0', 10)
                          return (
                            <div
                              key={conv.id}
                              className={`text-[9px] text-white rounded p-1.5 cursor-pointer hover:opacity-80 ${STATUS_COLORS[conv.estado] || 'bg-primary'}`}
                              style={{ minHeight: `${(endH - startH) * 40}px` }}
                              onClick={() => onConvClick(conv.id)}
                            >
                              <p className="font-semibold">{conv.curso}</p>
                              <p className="opacity-80">
                                {conv.horaInicio} — {conv.horaFin}
                              </p>
                              <p className="opacity-70 mt-0.5">
                                {conv.inscritos}/{conv.plazas} alumnos
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ProgramacionPage() {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('lista')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [areas, setAreas] = useState<AreaOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [staff, setStaff] = useState<StaffOption[]>([])
  const [draft, setDraft] = useState<DraftConvocatoria>(EMPTY_DRAFT)
  const [showDraftCreator, setShowDraftCreator] = useState(false)
  const [showInstructorPicker, setShowInstructorPicker] = useState(false)
  const [listMessage, setListMessage] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = React.useCallback(async () => {
    try {
      const [convsRes, campusRes, coursesRes, areasRes, classroomsRes, staffRes] = await Promise.all([
        fetch('/api/convocatorias', { cache: 'no-cache' }),
        fetch('/api/campuses?limit=50', { cache: 'no-cache' }),
        fetch('/api/cursos?includeInactive=true&includeCycles=true&limit=2000', {
          cache: 'no-cache',
        }),
        fetch('/api/areas-formativas', { cache: 'no-cache' }),
        fetch('/api/aulas?active=true', { cache: 'no-cache' }),
        fetch('/api/staff?staffType=profesor&active=true', { cache: 'no-cache' }),
      ])

      if (convsRes.ok) {
        const convsData = await convsRes.json()
        const items = Array.isArray(convsData.data) ? convsData.data : []
        setConvocatorias(
          items.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            codigo: (c.codigo as string) || '',
            curso: (c.cursoNombre as string) || 'Curso',
            cursoId: String(c.cursoId || ''),
            tipo: (c.cursoTipo as string) || '',
            sede: (c.campusNombre as string) || 'Sin sede',
            sedeId: String(c.campusId || ''),
            aula: (c.aulaNombre as string) || 'Sin aula',
            aulaId: String(c.aulaId || ''),
            fechaInicio: (c.fechaInicio as string) || '',
            fechaFin: (c.fechaFin as string) || '',
            horaInicio: (
              (c.horaInicio as string) ||
              ((c.horario as string) || '').split(' ').pop()?.split('-')[0] ||
              '09:00'
            ).slice(0, 5),
            horaFin: (
              (c.horaFin as string) ||
              ((c.horario as string) || '').split(' ').pop()?.split('-')[1] ||
              '14:00'
            ).slice(0, 5),
            dias: Array.isArray(c.dias) ? (c.dias as string[]) : [],
            plazas: (c.plazasTotales as number) || 0,
            inscritos: (c.plazasOcupadas as number) || 0,
            precio: (c.precio as number) || 0,
            matricula: c.matricula as number | undefined,
            horasPracticas: (c.horasPracticas as string | null) || null,
            certificacion: (c.certificacion as string | null) || null,
            profesor: (c.profesor as string) || 'Sin docente',
            profesores: Array.isArray(c.profesores)
              ? (c.profesores as string[]).filter(Boolean)
              : [],
            profesorRefs: Array.isArray(c.profesorRefs)
              ? (c.profesorRefs as Array<{ id?: string | number; name?: string }>)
                  .map((person) => ({ id: String(person.id || ''), name: String(person.name || '') }))
                  .filter((person) => person.id && person.name)
              : [],
            estado: (c.estado as string) || 'draft',
            planningStatus: (c.planningStatus as string) || '',
            color: STATUS_COLORS[(c.estado as string) || 'draft'] || 'bg-primary',
          }))
        )
      }

      if (campusRes.ok) {
        const campusData = await campusRes.json()
        const docs = Array.isArray(campusData.docs) ? campusData.docs : []
        setCampuses(
          docs.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            name: (c.name as string) || 'Sede',
          }))
        )
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const docs = Array.isArray(coursesData.data) ? coursesData.data : []
        setCourses(
          docs.map((c: Record<string, unknown>) => {
            const areaId =
              String(c.areaId ?? '') ||
              relationId(c.area_formativa) ||
              String(c.area_formativa_id ?? '')
            const areaName =
              (c.area as string) ||
              relationName(c.area_formativa) ||
              (c.areaName as string) ||
              'Sin área'
            const tipo = (c.course_type as string) || (c.tipo as string) || ''
            const studyType = (c.studyType as string) || ''
            return {
              id: String(c.id),
              name: (c.nombre as string) || (c.name as string) || (c.title as string) || 'Curso',
              tipo,
              studyType,
              areaId,
              areaName,
            }
          })
        )
      }

      if (areasRes.ok) {
        const areasData = await areasRes.json()
        const docs = Array.isArray(areasData.data) ? areasData.data : []
        setAreas(
          docs
            .filter((area: Record<string, unknown>) => area.active !== false && area.activo !== false)
            .map((area: Record<string, unknown>) => ({
              id: String(area.id),
              name: (area.nombre as string) || (area.name as string) || 'Área',
              color: (area.color as string) || null,
            }))
        )
      }

      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json()
        const docs = Array.isArray(classroomsData.data) ? classroomsData.data : []
        setClassrooms(
          docs.map((a: Record<string, unknown>) => ({
            id: String(a.id),
            name: (a.nombre as string) || (a.name as string) || (a.code as string) || 'Aula',
            campusId: String(a.sedeId || a.campusId || ''),
            capacity: Number(a.capacidad || a.capacity || 0),
          }))
        )
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        const docs = Array.isArray(staffData.data) ? staffData.data : []
        setStaff(
          docs.map((person: Record<string, unknown>) => {
            const campusesRaw = Array.isArray(person.campuses) ? person.campuses : []
            return {
              id: String(person.id),
              name:
                (person.fullName as string) ||
                (person.full_name as string) ||
                `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() ||
                'Docente',
              campusIds: campusesRaw
                .map((campus) =>
                  typeof campus === 'object' && campus !== null
                    ? String((campus as { id?: unknown }).id ?? '')
                    : String(campus)
                )
                .filter(Boolean),
              qualifiedAreaIds: (
                Array.isArray(person.qualifiedAreas)
                  ? person.qualifiedAreas
                  : Array.isArray(person.qualified_areas)
                    ? person.qualified_areas
                    : []
              )
                .map((area) => relationId(area))
                .filter((areaId): areaId is string => Boolean(areaId)),
            }
          })
        )
      }
    } catch {
      /* graceful */
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data
  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredClassrooms = useMemo(
    () =>
      draft.campusId
        ? classrooms.filter((classroom) => classroom.campusId === draft.campusId)
        : classrooms,
    [classrooms, draft.campusId]
  )

  const derivedAreas = useMemo(() => {
    if (areas.length > 0) return areas
    const byId = new Map<string, AreaOption>()
    courses.forEach((course) => {
      if (!course.areaId) return
      byId.set(course.areaId, { id: course.areaId, name: course.areaName })
    })
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [areas, courses])

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesType = draft.trainingType
          ? normalizePlanningTrainingType(course) === draft.trainingType
          : true
        const matchesArea = draft.areaId ? course.areaId === draft.areaId : true
        return matchesType && matchesArea
      }),
    [courses, draft.areaId, draft.trainingType]
  )

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === draft.courseId),
    [courses, draft.courseId]
  )

  const filteredStaff = useMemo(
    () =>
      staff.filter((person) => {
        const matchesCampus = draft.campusId
          ? person.campusIds.length === 0 || person.campusIds.includes(draft.campusId)
          : true
        const matchesArea = draft.areaId
          ? person.qualifiedAreaIds.some((areaId) => areaId === draft.areaId)
          : true
        return matchesCampus && matchesArea
      }),
    [staff, draft.areaId, draft.campusId]
  )

  const selectedInstructors = useMemo(
    () => staff.filter((person) => draft.instructorIds.includes(person.id)),
    [draft.instructorIds, staff]
  )

  const updateDraft = (patch: Partial<DraftConvocatoria>) => {
    setListMessage(null)
    setDraft((current) => ({ ...current, ...patch }))
  }

  const createDraftConvocatoria = async () => {
    setListMessage(null)
    const missing = [
      ['tipo', draft.trainingType],
      ['área', draft.areaId],
      ['curso/ciclo', draft.courseId],
      ['sede', draft.campusId],
      ['aula', draft.classroomId],
      ['docente', draft.instructorIds.length > 0 ? draft.instructorIds.join(',') : ''],
      ['inicio', draft.startDate],
      ['fin', draft.endDate],
      ['hora inicio', draft.timeStart],
      ['hora fin', draft.timeEnd],
    ]
      .filter(([, value]) => !value)
      .map(([label]) => label)

    if (missing.length > 0) {
      setListMessage(`Faltan campos: ${missing.join(', ')}.`)
      return
    }

    if (!filteredCourses.some((course) => course.id === draft.courseId)) {
      setListMessage('El curso seleccionado no pertenece al tipo y área elegidos.')
      return
    }

    if (draft.instructorIds.some((id) => !filteredStaff.some((person) => person.id === id))) {
      setListMessage('Hay docentes seleccionados que no pertenecen al área o sede elegida.')
      return
    }

    setIsSavingDraft(true)
    try {
      const availabilityParams = new URLSearchParams({
        course: draft.courseId,
        campus: draft.campusId,
        classroom: draft.classroomId,
        instructor: draft.instructorIds[0] ?? '',
        start_date: draft.startDate,
        end_date: draft.endDate,
        schedule_time_start: draft.timeStart,
        schedule_time_end: draft.timeEnd,
        shift: draft.shift,
        max_students: draft.maxStudents,
      })
      availabilityParams.append('schedule_days', draft.day)
      draft.instructorIds.forEach((id) => availabilityParams.append('instructors', id))
      const availabilityRes = await fetch(
        `/api/course-runs/availability?${availabilityParams.toString()}`,
        { cache: 'no-store' }
      )
      const availabilityData = await availabilityRes.json()
      const blockers = availabilityData?.availability?.blockers ?? []
      if (Array.isArray(blockers) && blockers.length > 0) {
        setListMessage(
          blockers
            .map((blocker: { message?: string }) => blocker.message)
            .filter(Boolean)
            .join(' ') || 'La convocatoria tiene conflictos de planificación.'
        )
        return
      }

      const createRes = await fetch('/api/convocatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: draft.courseId,
          fechaInicio: draft.startDate,
          fechaFin: draft.endDate,
          horario: [
            {
              day: draft.day,
              startTime: `${draft.timeStart}:00`.replace(/:00:00$/, ':00'),
              endTime: `${draft.timeEnd}:00`.replace(/:00:00$/, ':00'),
            },
          ],
          estado: 'borrador',
          plazasTotales: Number(draft.maxStudents) || 1,
          precio: Number(draft.price) || 0,
          profesorId: draft.instructorIds[0] ?? '',
          profesorIds: draft.instructorIds,
          sedeId: draft.campusId,
          aulaId: draft.classroomId,
          trainingType: getCourseTrainingPayloadType(selectedCourse, draft.trainingType),
          planningStatus: 'draft',
          turno: draft.shift,
          matricula: Number(draft.enrollmentFee) || 0,
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok || createData?.success === false) {
        setListMessage(createData?.error || 'No se pudo crear la convocatoria.')
        return
      }
      setDraft(EMPTY_DRAFT)
      setShowDraftCreator(false)
      setListMessage(
        'Convocatoria creada. Revisa la fila generada y completa publicación cuando corresponda.'
      )
      await loadData()
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'No se pudo crear la convocatoria.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Filtered convocatorias
  const filtered = useMemo(() => {
    const operational = convocatorias.filter((c) => c.estado !== 'draft')
    if (sedeFilter === 'todas') return operational
    return operational.filter((c) => c.sedeId === sedeFilter)
  }, [convocatorias, sedeFilter])

  const exportColumns: ExportColumn<Convocatoria>[] = [
    { header: 'Codigo', getValue: (conv) => conv.codigo || conv.id },
    { header: 'Curso / ciclo', getValue: (conv) => conv.curso },
    { header: 'Tipo', getValue: (conv) => conv.tipo },
    { header: 'Sede', getValue: (conv) => conv.sede },
    { header: 'Aula', getValue: (conv) => conv.aula },
    { header: 'Docentes', getValue: (conv) => formatTeacherNames(conv) },
    { header: 'Inicio', getValue: (conv) => formatLongDate(conv.fechaInicio) },
    { header: 'Fin', getValue: (conv) => formatLongDate(conv.fechaFin) },
    { header: 'Dia', getValue: (conv) => formatDayLabels(conv.dias) },
    { header: 'Horario', getValue: (conv) => formatScheduleRange(conv.horaInicio, conv.horaFin) },
    { header: 'Horas practicas', getValue: (conv) => conv.horasPracticas || '—' },
    { header: 'Certificacion', getValue: (conv) => conv.certificacion || '—' },
    { header: 'Matricula', getValue: (conv) => formatEnrollmentFee(conv.matricula) },
    { header: 'Precio', getValue: (conv) => formatMoney(conv.precio) },
    { header: 'Plazas', getValue: (conv) => conv.plazas },
    { header: 'Inscritos', getValue: (conv) => conv.inscritos },
    { header: 'Estado', getValue: (conv) => STATUS_LABELS[conv.estado] || conv.estado },
  ]

  const handlePrintList = () => {
    const generatedAt = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
    const headers = exportColumns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')
    const rows = filtered
      .map(
        (conv) =>
          `<tr>${exportColumns
            .map((column) => `<td>${escapeHtml(column.getValue(conv) || '—')}</td>`)
            .join('')}</tr>`
      )
      .join('')
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      printTable('Programación Académica', exportColumns, filtered)
      return
    }

    doc.open()
    doc.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Programación Académica</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Inter, Arial, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-bottom: 3px solid #f2014b; padding-bottom: 14px; margin-bottom: 18px; }
    img { width: 168px; height: auto; object-fit: contain; }
    h1 { margin: 0; font-size: 24px; line-height: 1.1; letter-spacing: -0.03em; }
    .meta { margin-top: 6px; color: #64748b; font-size: 11px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 9px; }
    th { background: #fff1f4; color: #111827; border-bottom: 1px solid #f2014b; padding: 7px 5px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: .04em; }
    td { border-bottom: 1px solid #e5e7eb; padding: 6px 5px; vertical-align: top; overflow-wrap: anywhere; }
    th:nth-child(2), td:nth-child(2) { width: 18%; font-weight: 800; }
    th:nth-child(6), td:nth-child(6) { width: 12%; }
    th:nth-child(7), td:nth-child(7), th:nth-child(8), td:nth-child(8) { width: 8%; }
    th:nth-child(9), td:nth-child(9), th:nth-child(10), td:nth-child(10), th:nth-child(11), td:nth-child(11), th:nth-child(12), td:nth-child(12) { width: 6%; }
    footer { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #64748b; font-size: 10px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Programación Académica</h1>
      <div class="meta">${escapeHtml(filtered.length)} convocatorias visibles · Generado el ${escapeHtml(generatedAt)}</div>
    </div>
    <img src="/logos/cep-formacion-logo-rectangular.png" alt="CEP Formación" />
  </header>
  <table>
    <thead><tr>${headers}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <footer>
    <span>CEP Formación · Listado operativo de convocatorias</span>
    <span>Documento interno generado desde Akademate</span>
  </footer>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
      setTimeout(function () { window.parent.document.body.removeChild(window.frameElement); }, 500);
    };
  </script>
</body>
</html>`)
    doc.close()
  }

  const handleDownloadCsv = () =>
    downloadCsv(
      `convocatorias-${new Date().toISOString().slice(0, 10)}.csv`,
      exportColumns,
      filtered
    )

  // Navigation
  const navPrev = () => {
    if (view === 'anual') setYear((y) => y - 1)
    else if (view === 'mes') {
      if (month === 0) {
        setMonth(11)
        setYear((y) => y - 1)
      } else setMonth((m) => m - 1)
    } else if (view === 'semana')
      setSelectedDate((d) => {
        const n = new Date(d)
        n.setDate(n.getDate() - 7)
        return n
      })
    else
      setSelectedDate((d) => {
        const n = new Date(d)
        n.setDate(n.getDate() - 1)
        return n
      })
  }

  const navNext = () => {
    if (view === 'anual') setYear((y) => y + 1)
    else if (view === 'mes') {
      if (month === 11) {
        setMonth(0)
        setYear((y) => y + 1)
      } else setMonth((m) => m + 1)
    } else if (view === 'semana')
      setSelectedDate((d) => {
        const n = new Date(d)
        n.setDate(n.getDate() + 7)
        return n
      })
    else
      setSelectedDate((d) => {
        const n = new Date(d)
        n.setDate(n.getDate() + 1)
        return n
      })
  }

  const navLabel = () => {
    if (view === 'anual') return String(year)
    if (view === 'mes') return `${MONTHS_FULL[month]} ${year}`
    if (view === 'semana') {
      const end = new Date(selectedDate)
      end.setDate(end.getDate() + 6)
      return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${year}`
    }
    return selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const navToday = () => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelectedDate(now)
  }

  // Week start (Monday)
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [selectedDate])

  // Stats
  const totalConvs = filtered.length
  const activas = filtered.filter(
    (c) => c.estado === 'published' || c.estado === 'enrollment_open' || c.estado === 'in_progress'
  ).length
  const totalPlazas = filtered.reduce((s, c) => s + c.plazas, 0)
  const totalInscritos = filtered.reduce((s, c) => s + c.inscritos, 0)

  const handleConvClick = (id: string) => router.push(`/programacion/${id}`)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Programacion Academica"
        description="Calendario de convocatorias, horarios y ocupacion"
        icon={Calendar}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="default">{activas} activas</Badge>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={view === 'lista' ? 'default' : 'outline'} onClick={() => setView('lista')}>
              <List className="mr-2 h-4 w-4" />
              Vista de lista
            </Button>
            <Button variant={view === 'anual' ? 'default' : 'outline'} onClick={() => setView('anual')}>
              <CalendarRange className="mr-2 h-4 w-4" />
              Cronograma
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Convocatorias', value: totalConvs, icon: GraduationCap },
          { label: 'Activas', value: activas, icon: Calendar },
          { label: 'Plazas totales', value: totalPlazas, icon: Users },
          {
            label: 'Ocupacion',
            value: totalPlazas > 0 ? `${Math.round((totalInscritos / totalPlazas) * 100)}%` : '—',
            icon: BarChart3,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
              <Icon className="h-4 w-4 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls bar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          {view !== 'lista' ? (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={navPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">{navLabel()}</span>
              <Button variant="ghost" size="sm" onClick={navNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-xs ml-1" onClick={navToday}>
                Hoy
              </Button>
            </div>
          ) : null}

          {/* Sede filter */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              variant={sedeFilter === 'todas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSedeFilter('todas')}
              className="h-7 px-2.5 text-xs"
            >
              Todas
            </Button>
            {campuses.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant={sedeFilter === c.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSedeFilter(c.id)}
                className="h-7 px-2.5 text-xs"
              >
                {c.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Calendar views */}
      {!isLoading && view === 'anual' && (
        <AnnualGantt convocatorias={filtered} year={year} onConvClick={handleConvClick} />
      )}

      {!isLoading && view === 'mes' && (
        <MonthCalendar
          convocatorias={filtered}
          year={year}
          month={month}
          holidays={HOLIDAYS_2026}
          onConvClick={handleConvClick}
        />
      )}

      {!isLoading && view === 'semana' && (
        <WeekView
          convocatorias={filtered}
          weekStart={weekStart}
          holidays={HOLIDAYS_2026}
          onConvClick={handleConvClick}
        />
      )}

      {!isLoading && view === 'dia' && (
        <DayView
          convocatorias={filtered}
          date={selectedDate}
          holidays={HOLIDAYS_2026}
          onConvClick={handleConvClick}
        />
      )}

      {/* List View */}
      {!isLoading && view === 'lista' && (
        <Card>
          <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="h-4 w-4" />
              Lista operativa de convocatorias
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handlePrintList}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadCsv}>
                <Download className="h-4 w-4" />
                Descargar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {listMessage ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                {listMessage}
              </div>
            ) : null}
            {!showDraftCreator ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-center sm:w-auto"
                onClick={() => setShowDraftCreator(true)}
              >
                <Plus className="h-4 w-4" />
                Crear convocatoria
              </Button>
            ) : (
              <div className="rounded-xl border bg-muted/10 p-3">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Plus className="h-4 w-4 text-primary" />
                    Nueva convocatoria
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDraftCreator(false)
                      setDraft(EMPTY_DRAFT)
                      setListMessage(null)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Tipo de formación
                    <select
                      value={draft.trainingType}
                      onChange={(event) =>
                        updateDraft({
                          trainingType: event.target.value,
                          areaId: '',
                          courseId: '',
                          instructorIds: [],
                        })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Tipo</option>
                      {TRAINING_TYPE_OPTIONS.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Área
                    <select
                      value={draft.areaId}
                      onChange={(event) =>
                        updateDraft({
                          areaId: event.target.value,
                          courseId: '',
                          instructorIds: [],
                        })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      disabled={!draft.trainingType}
                    >
                      <option value="">
                        {draft.trainingType ? 'Seleccionar área' : 'Selecciona tipo'}
                      </option>
                      {derivedAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2 xl:col-span-1">
                    Curso / ciclo
                    <select
                      value={draft.courseId}
                      onChange={(event) => updateDraft({ courseId: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      disabled={!draft.trainingType || !draft.areaId}
                    >
                      <option value="">
                        {draft.areaId ? 'Seleccionar curso/ciclo' : 'Selecciona área'}
                      </option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                          {course.areaName ? ` · ${course.areaName}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Sede
                    <select
                      value={draft.campusId}
                      onChange={(event) =>
                        updateDraft({
                          campusId: event.target.value,
                          classroomId: '',
                          instructorIds: [],
                        })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Sede</option>
                      {campuses.map((campus) => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Aula
                    <select
                      value={draft.classroomId}
                      onChange={(event) => {
                        const room = filteredClassrooms.find(
                          (item) => item.id === event.target.value
                        )
                        updateDraft({
                          classroomId: event.target.value,
                          maxStudents: room?.capacity ? String(room.capacity) : draft.maxStudents,
                        })
                      }}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Aula</option>
                      {filteredClassrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} · {classroom.capacity}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="relative grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2 xl:col-span-1">
                    Docentes
                    <button
                      type="button"
                      className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1 text-left text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!draft.areaId}
                      onClick={() => setShowInstructorPicker((current) => !current)}
                    >
                      <span className="truncate">
                        {selectedInstructors.length > 0
                          ? `${selectedInstructors.length} docente${selectedInstructors.length === 1 ? '' : 's'}`
                          : draft.areaId
                            ? 'Seleccionar docentes'
                            : 'Selecciona área'}
                      </span>
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    {selectedInstructors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedInstructors.map((person) => (
                          <Badge
                            key={person.id}
                            variant="secondary"
                            className="max-w-full gap-1 truncate bg-primary/10 text-primary"
                          >
                            <span className="truncate">{person.name}</span>
                            <button
                              type="button"
                              aria-label={`Quitar ${person.name}`}
                              onClick={() =>
                                updateDraft({
                                  instructorIds: draft.instructorIds.filter((id) => id !== person.id),
                                })
                              }
                              className="rounded-full hover:bg-primary/10"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {showInstructorPicker ? (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-lg">
                        {filteredStaff.length === 0 ? (
                          <div className="px-2 py-2 text-xs text-muted-foreground">
                            No hay docentes activos para esta área y sede.
                          </div>
                        ) : (
                          filteredStaff.map((person) => {
                            const selected = draft.instructorIds.includes(person.id)
                            return (
                              <button
                                key={person.id}
                                type="button"
                                className={`flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-primary/10 ${
                                  selected ? 'bg-primary/10 text-primary' : ''
                                }`}
                                onClick={() =>
                                  updateDraft({
                                    instructorIds: selected
                                      ? draft.instructorIds.filter((id) => id !== person.id)
                                      : [...draft.instructorIds, person.id],
                                  })
                                }
                              >
                                <span className="truncate">{person.name}</span>
                                {selected ? <span className="text-[10px] font-semibold">Seleccionado</span> : null}
                              </button>
                            )
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Inicio
                    <input
                      type="date"
                      value={draft.startDate}
                      onChange={(event) => updateDraft({ startDate: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Fin
                    <input
                      type="date"
                      value={draft.endDate}
                      onChange={(event) => updateDraft({ endDate: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Día
                    <select
                      value={draft.day}
                      onChange={(event) => updateDraft({ day: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {DAY_OPTIONS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      Inicio hora
                      <input
                        type="time"
                        value={draft.timeStart}
                        onChange={(event) => updateDraft({ timeStart: event.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      Fin hora
                      <input
                        type="time"
                        value={draft.timeEnd}
                        onChange={(event) => updateDraft({ timeEnd: event.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      />
                    </label>
                  </div>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Matrícula
                    <input
                      type="number"
                      value={draft.enrollmentFee}
                      onChange={(event) => updateDraft({ enrollmentFee: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-right text-xs"
                      placeholder="€"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Precio
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(event) => updateDraft({ price: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-right text-xs"
                      placeholder="€"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Plazas
                    <input
                      type="number"
                      value={draft.maxStudents}
                      onChange={(event) => updateDraft({ maxStudents: event.target.value })}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-center text-xs"
                    />
                  </label>
                  <div className="flex items-end md:col-span-2 xl:col-span-1">
                    <Button
                      size="sm"
                      className="h-9 w-full"
                      onClick={createDraftConvocatoria}
                      disabled={isSavingDraft}
                    >
                      {isSavingDraft ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3 w-3" />
                      )}
                      Crear
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden 2xl:block">
              <table className="w-full table-fixed text-[11px]">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-[11%] p-2 text-left font-medium">Convocatoria</th>
                    <th className="w-[6%] p-2 text-left font-medium">Sede</th>
                    <th className="w-[6%] p-2 text-left font-medium">Aula</th>
                    <th className="w-[8%] p-2 text-left font-medium">Docentes</th>
                    <th className="w-[7%] p-2 text-left font-medium">Inicio</th>
                    <th className="w-[7%] p-2 text-left font-medium">Fin</th>
                    <th className="w-[5%] p-2 text-left font-medium">Día</th>
                    <th className="w-[6%] p-2 text-left font-medium">Horario</th>
                    <th className="w-[6%] p-2 text-left font-medium">Prácticas</th>
                    <th className="w-[7%] p-2 text-left font-medium">Certificación</th>
                    <th className="w-[5%] p-2 text-right font-medium">Matrícula</th>
                    <th className="w-[5%] p-2 text-right font-medium">Precio</th>
                    <th className="w-[4%] p-2 text-center font-medium">Plazas</th>
                    <th className="w-[10%] p-2 text-center font-medium">Estado</th>
                    <th className="w-[4%] p-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-8 text-center text-muted-foreground">
                        No hay convocatorias publicadas
                      </td>
                    </tr>
                  ) : (
                    filtered.map((conv) => {
                      const ocupacion =
                        conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0
                      const dateStart = conv.fechaInicio
                        ? formatLongDate(conv.fechaInicio)
                        : '—'
                      const dateEnd = conv.fechaFin
                        ? formatLongDate(conv.fechaFin)
                        : '—'
                      const dayLabels = formatDayLabels(conv.dias)
                      const scheduleRange = formatScheduleRange(conv.horaInicio, conv.horaFin)
                      const practiceHours = conv.horasPracticas || '—'
                      const certification = conv.certificacion || '—'
                      return (
                        <tr key={conv.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="min-w-0 p-2">
                            <button
                              type="button"
                              onClick={() => handleConvClick(conv.id)}
                              className="block w-full text-left font-semibold leading-tight text-foreground underline-offset-2 hover:text-primary hover:underline"
                            >
                              {conv.curso}
                            </button>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {conv.codigo || conv.id}
                            </p>
                            <p className="text-xs text-muted-foreground">{conv.tipo || 'Curso'}</p>
                          </td>
                          <td className="min-w-0 p-2">
                            <button
                              type="button"
                              onClick={() => conv.sedeId && router.push(`/dashboard/sedes/${conv.sedeId}`)}
                              className="flex min-w-0 items-center gap-1 text-left font-semibold text-foreground underline-offset-2 hover:text-primary hover:underline disabled:pointer-events-none disabled:opacity-70"
                              disabled={!conv.sedeId}
                            >
                              <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                              <span className="break-words">{conv.sede}</span>
                            </button>
                          </td>
                          <td className="min-w-0 p-2">
                            <p className="break-words font-semibold text-foreground">{conv.aula}</p>
                          </td>
                          <td className="min-w-0 p-2">
                            <div className="space-y-1">
                              {conv.profesorRefs.length > 0 ? (
                                conv.profesorRefs.map((person) => (
                                  <button
                                    key={person.id}
                                    type="button"
                                    onClick={() => router.push(`/dashboard/profesores/${person.id}`)}
                                    className="block text-left font-semibold leading-tight text-foreground underline-offset-2 hover:text-primary hover:underline"
                                  >
                                    {person.name}
                                  </button>
                                ))
                              ) : (
                                <span className="font-semibold text-foreground">
                                  {formatTeacherNames(conv)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {dateStart}
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {dateEnd}
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {dayLabels}
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {scheduleRange}
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {practiceHours}
                          </td>
                          <td className="p-2 font-semibold leading-tight text-foreground">
                            {certification}
                          </td>
                          <td className="p-2 text-right font-semibold text-foreground">
                            {formatEnrollmentFee(conv.matricula)}
                          </td>
                          <td className="p-2 text-right">
                            {formatMoney(conv.precio)}
                          </td>
                          <td className="p-2 text-center">
                            <span className="font-medium">{conv.inscritos}</span>
                            <span className="text-muted-foreground">/{conv.plazas}</span>
                            <div className="mt-1 h-1 w-full rounded-full bg-muted">
                              <div
                                className={`h-1 rounded-full ${ocupacion >= 90 ? 'bg-primary' : ocupacion >= 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${ocupacion}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <Badge
                              className="w-full max-w-full justify-center whitespace-nowrap rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold leading-none text-green-700 shadow-none"
                            >
                              {conv.estado === 'enrollment_open'
                                ? 'Matrícula abierta'
                                : STATUS_LABELS[conv.estado] || conv.estado}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvClick(conv.id)}
                              className="h-7 px-2 text-[10px]"
                            >
                              Editar
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 2xl:hidden">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No hay convocatorias publicadas
                </div>
              ) : (
                filtered.map((conv) => {
                  const ocupacion =
                    conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0
                  const dateStart = conv.fechaInicio
                    ? formatLongDate(conv.fechaInicio)
                    : '—'
                  const dateEnd = conv.fechaFin
                    ? formatLongDate(conv.fechaFin)
                    : '—'
                  const dayLabels = formatDayLabels(conv.dias)
                  const scheduleRange = formatScheduleRange(conv.horaInicio, conv.horaFin)
                  const practiceHours = conv.horasPracticas || '—'
                  const certification = conv.certificacion || '—'
                  return (
                    <div key={conv.id} className="rounded-xl border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{conv.curso}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {conv.codigo || conv.id}
                          </p>
                        </div>
                        <Badge
                          className={`shrink-0 whitespace-nowrap text-[10px] text-white border-0 ${STATUS_COLORS[conv.estado] || 'bg-gray-400'}`}
                        >
                          {STATUS_LABELS[conv.estado] || conv.estado}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span className="flex min-w-0 items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate font-medium text-foreground">{conv.sede}</span>
                        </span>
                        <span className="truncate font-medium text-foreground">
                          Aula: {conv.aula}
                        </span>
                        <span className="truncate font-medium text-foreground">
                          Docentes: {formatTeacherNames(conv)}
                        </span>
                        <span>
                          Inicio: {dateStart}
                        </span>
                        <span>
                          Fin: {dateEnd}
                        </span>
                        <span>
                          Día: {dayLabels}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scheduleRange}
                        </span>
                        <span>
                          Prácticas: {practiceHours}
                        </span>
                        <span>
                          Certificación: {certification}
                        </span>
                        <span>
                          Matrícula: {formatEnrollmentFee(conv.matricula)}
                        </span>
                        <span>
                          Precio: {formatMoney(conv.precio)}
                        </span>
                        <span>
                          {conv.inscritos}/{conv.plazas} plazas ({ocupacion}%)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => handleConvClick(conv.id)}
                      >
                        Editar
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground px-1">
        <span className="font-medium">Leyenda:</span>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_COLORS[key]}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-0.5 bg-red-500 rounded" />
          Hoy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-300" />
          Festivo
        </span>
      </div>
    </div>
  )
}
