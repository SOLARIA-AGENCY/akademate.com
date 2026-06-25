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
  CalendarDays,
  CalendarRange,
  Loader2,
  Building2,
  List,
} from 'lucide-react'
import { CampaignBadge } from '@payload-config/components/ui/CampaignBadge'
import { SegmentedToggle } from '@payload-config/components/ui/SegmentedToggle'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Convocatoria {
  id: string
  codigo: string
  curso: string
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
  profesor: string
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
}

type DraftConvocatoria = {
  courseId: string
  campusId: string
  classroomId: string
  instructorId: string
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
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
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
  courseId: '',
  campusId: '',
  classroomId: '',
  instructorId: '',
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

// ---------------------------------------------------------------------------
// Annual Gantt View
// ---------------------------------------------------------------------------

function AnnualGantt({ convocatorias, year, onConvClick }: {
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
          <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">Convocatoria</div>
          <div className="flex-1 flex">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex-1 text-center text-[10px] font-medium text-muted-foreground border-l border-border/30 first:border-l-0">
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

              const ocupacion = conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0

              return (
                <div key={conv.id} className="flex items-center group">
                  <div
                    className="w-48 shrink-0 pr-3 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => onConvClick(conv.id)}
                  >
                    <p className="text-xs font-medium truncate leading-tight">{conv.curso}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{conv.sede}
                    </p>
                  </div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    {/* Month grid lines */}
                    {MONTHS.map((_, i) => {
                      const monthStart = new Date(year, i, 1)
                      const pct = ((monthStart.getTime() - yearStart) / (1000 * 60 * 60 * 24) / yearDays) * 100
                      return <div key={i} className="absolute top-0 bottom-0 border-l border-border/20" style={{ left: `${pct}%` }} />
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
                        const todayPct = ((today.getTime() - yearStart) / (1000 * 60 * 60 * 24) / yearDays) * 100
                        return <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: `${todayPct}%` }} />
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

function MonthCalendar({ convocatorias, year, month, holidays, onConvClick }: {
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
        <CardTitle className="text-base">{MONTHS_FULL[month]} {year}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-20" />

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateKey === today
            const isHoliday = holidays[dateKey]
            const isWeekend = (i % 7) >= 5

            const dayConvs = convocatorias.filter((c) => convocatoriaOnDate(c, dateKey))

            return (
              <div
                key={dateKey}
                className={`h-20 border rounded p-0.5 overflow-hidden ${
                  isToday ? 'border-primary border-2' : 'border-border/30'
                } ${isHoliday ? 'bg-red-50 dark:bg-red-950/20' : isWeekend ? 'bg-muted/30' : 'bg-background'}`}
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : isHoliday ? 'text-red-500' : ''}`}>
                    {day}
                  </span>
                  {isHoliday && (
                    <span className="text-[8px] text-red-400 truncate ml-1" title={isHoliday}>{isHoliday}</span>
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
                    <span className="text-[8px] text-muted-foreground">+{dayConvs.length - 3} mas</span>
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

function WeekView({ convocatorias, weekStart, holidays, onConvClick }: {
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
                  <p className="text-[10px] text-muted-foreground">{WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</p>
                  <p className="text-sm font-medium">{d.getDate()}</p>
                  {holiday && <p className="text-[8px] text-red-400">{holiday}</p>}
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-px border-b border-border/20">
              <div className="text-[10px] text-muted-foreground py-2 text-right pr-2">{hour}:00</div>
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
                          <p className="opacity-80">{conv.horaInicio}-{conv.horaFin}</p>
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

function DayView({ convocatorias, date, holidays, onConvClick }: {
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
            {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </CardTitle>
          {holiday && <Badge variant="destructive" className="text-[10px]">{holiday}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-3 overflow-x-auto">
        {dayConvs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {holiday ? `Festivo: ${holiday}` : 'No hay clases programadas este dia'}
          </div>
        ) : (
          <div className="min-w-[500px]">
            <div className={`grid gap-px`} style={{ gridTemplateColumns: `60px repeat(${Math.max(columns.length, 1)}, 1fr)` }}>
              {/* Headers */}
              <div />
              {columns.map(([sede]) => (
                <div key={sede} className="text-center text-xs font-medium py-2 bg-muted/30 rounded-t">
                  <Building2 className="h-3 w-3 mx-auto mb-1" />
                  {sede}
                </div>
              ))}

              {/* Hours */}
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="text-[10px] text-muted-foreground text-right pr-2 py-3">{hour}:00</div>
                  {columns.map(([sede, convs]) => {
                    const hourConvs = convs.filter((c) => {
                      const startH = parseInt(c.horaInicio?.split(':')[0] || '0', 10)
                      const endH = parseInt(c.horaFin?.split(':')[0] || '0', 10)
                      return hour >= startH && hour < endH
                    })

                    return (
                      <div key={sede + hour} className="border-l border-t border-border/20 min-h-[40px] px-1">
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
                              <p className="opacity-80">{conv.horaInicio} — {conv.horaFin}</p>
                              <p className="opacity-70 mt-0.5">{conv.inscritos}/{conv.plazas} alumnos</p>
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
  const [view, setView] = useState<ViewMode>('anual')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [staff, setStaff] = useState<StaffOption[]>([])
  const [draft, setDraft] = useState<DraftConvocatoria>(EMPTY_DRAFT)
  const [listMessage, setListMessage] = useState<string | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = React.useCallback(async () => {
    try {
      const [convsRes, campusRes, coursesRes, classroomsRes, staffRes] = await Promise.all([
        fetch('/api/convocatorias', { cache: 'no-cache' }),
        fetch('/api/campuses?limit=50', { cache: 'no-cache' }),
        fetch('/api/cursos?includeInactive=true&includeCycles=true&limit=2000', { cache: 'no-cache' }),
        fetch('/api/aulas?active=true', { cache: 'no-cache' }),
        fetch('/api/staff?staffType=profesor&active=true', { cache: 'no-cache' }),
      ])

      if (convsRes.ok) {
        const convsData = await convsRes.json()
        const items = Array.isArray(convsData.data) ? convsData.data : []
        setConvocatorias(items.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          codigo: (c.codigo as string) || '',
          curso: (c.cursoNombre as string) || 'Curso',
          tipo: (c.cursoTipo as string) || '',
          sede: (c.campusNombre as string) || 'Sin sede',
          sedeId: String(c.campusId || ''),
          aula: (c.aulaNombre as string) || 'Sin aula',
          aulaId: String(c.aulaId || ''),
          fechaInicio: (c.fechaInicio as string) || '',
          fechaFin: (c.fechaFin as string) || '',
          horaInicio: ((c.horaInicio as string) || ((c.horario as string) || '').split(' ').pop()?.split('-')[0] || '09:00').slice(0, 5),
          horaFin: ((c.horaFin as string) || ((c.horario as string) || '').split(' ').pop()?.split('-')[1] || '14:00').slice(0, 5),
          dias: Array.isArray(c.dias) ? c.dias as string[] : [],
          plazas: (c.plazasTotales as number) || 0,
          inscritos: (c.plazasOcupadas as number) || 0,
          precio: (c.precio as number) || 0,
          matricula: c.matricula as number | undefined,
          profesor: (c.profesor as string) || 'Sin docente',
          estado: (c.estado as string) || 'draft',
          planningStatus: (c.planningStatus as string) || '',
          color: STATUS_COLORS[(c.estado as string) || 'draft'] || 'bg-primary',
        })))
      }

      if (campusRes.ok) {
        const campusData = await campusRes.json()
        const docs = Array.isArray(campusData.docs) ? campusData.docs : []
        setCampuses(docs.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          name: (c.name as string) || 'Sede',
        })))
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        const docs = Array.isArray(coursesData.data) ? coursesData.data : []
        setCourses(docs.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          name: (c.nombre as string) || (c.name as string) || (c.title as string) || 'Curso',
          tipo: (c.studyTypeLabel as string) || (c.course_type as string) || (c.tipo as string) || '',
        })))
      }

      if (classroomsRes.ok) {
        const classroomsData = await classroomsRes.json()
        const docs = Array.isArray(classroomsData.data) ? classroomsData.data : []
        setClassrooms(docs.map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: (a.nombre as string) || (a.name as string) || (a.code as string) || 'Aula',
          campusId: String(a.sedeId || a.campusId || ''),
          capacity: Number(a.capacidad || a.capacity || 0),
        })))
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        const docs = Array.isArray(staffData.data) ? staffData.data : []
        setStaff(docs.map((person: Record<string, unknown>) => {
          const campusesRaw = Array.isArray(person.campuses) ? person.campuses : []
          return {
            id: String(person.id),
            name: (person.fullName as string) || (person.full_name as string) || `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || 'Docente',
            campusIds: campusesRaw
              .map((campus) => typeof campus === 'object' && campus !== null ? String((campus as { id?: unknown }).id ?? '') : String(campus))
              .filter(Boolean),
          }
        }))
      }
    } catch { /* graceful */ }
    finally { setIsLoading(false) }
  }, [])

  // Fetch data
  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredClassrooms = useMemo(() => (
    draft.campusId ? classrooms.filter((classroom) => classroom.campusId === draft.campusId) : classrooms
  ), [classrooms, draft.campusId])

  const filteredStaff = useMemo(() => (
    draft.campusId
      ? staff.filter((person) => person.campusIds.length === 0 || person.campusIds.includes(draft.campusId))
      : staff
  ), [staff, draft.campusId])

  const updateDraft = (patch: Partial<DraftConvocatoria>) => {
    setListMessage(null)
    setDraft((current) => ({ ...current, ...patch }))
  }

  const createDraftConvocatoria = async () => {
    setListMessage(null)
    const missing = [
      ['curso/ciclo', draft.courseId],
      ['sede', draft.campusId],
      ['aula', draft.classroomId],
      ['docente', draft.instructorId],
      ['inicio', draft.startDate],
      ['fin', draft.endDate],
      ['hora inicio', draft.timeStart],
      ['hora fin', draft.timeEnd],
    ].filter(([, value]) => !value).map(([label]) => label)

    if (missing.length > 0) {
      setListMessage(`Faltan campos: ${missing.join(', ')}.`)
      return
    }

    setIsSavingDraft(true)
    try {
      const availabilityParams = new URLSearchParams({
        course: draft.courseId,
        campus: draft.campusId,
        classroom: draft.classroomId,
        instructor: draft.instructorId,
        start_date: draft.startDate,
        end_date: draft.endDate,
        schedule_time_start: draft.timeStart,
        schedule_time_end: draft.timeEnd,
        shift: draft.shift,
        max_students: draft.maxStudents,
      })
      availabilityParams.append('schedule_days', draft.day)
      const availabilityRes = await fetch(`/api/course-runs/availability?${availabilityParams.toString()}`, { cache: 'no-store' })
      const availabilityData = await availabilityRes.json()
      const blockers = availabilityData?.availability?.blockers ?? []
      if (Array.isArray(blockers) && blockers.length > 0) {
        setListMessage(blockers.map((blocker: { message?: string }) => blocker.message).filter(Boolean).join(' ') || 'La convocatoria tiene conflictos de planificación.')
        return
      }

      const createRes = await fetch('/api/convocatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: draft.courseId,
          fechaInicio: draft.startDate,
          fechaFin: draft.endDate,
          horario: [{ day: draft.day, startTime: `${draft.timeStart}:00`.replace(/:00:00$/, ':00'), endTime: `${draft.timeEnd}:00`.replace(/:00:00$/, ':00') }],
          estado: 'borrador',
          plazasTotales: Number(draft.maxStudents) || 1,
          precio: Number(draft.price) || 0,
          profesorId: draft.instructorId,
          profesorIds: [draft.instructorId],
          sedeId: draft.campusId,
          aulaId: draft.classroomId,
          trainingType: 'private',
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
      setListMessage('Convocatoria creada. Revisa la fila generada y completa publicación cuando corresponda.')
      await loadData()
    } catch (error) {
      setListMessage(error instanceof Error ? error.message : 'No se pudo crear la convocatoria.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Filtered convocatorias
  const filtered = useMemo(() => {
    if (sedeFilter === 'todas') return convocatorias
    return convocatorias.filter((c) => c.sedeId === sedeFilter)
  }, [convocatorias, sedeFilter])

  // Navigation
  const navPrev = () => {
    if (view === 'anual') setYear((y) => y - 1)
    else if (view === 'mes') {
      if (month === 0) { setMonth(11); setYear((y) => y - 1) }
      else setMonth((m) => m - 1)
    } else if (view === 'semana') setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    else setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }

  const navNext = () => {
    if (view === 'anual') setYear((y) => y + 1)
    else if (view === 'mes') {
      if (month === 11) { setMonth(0); setYear((y) => y + 1) }
      else setMonth((m) => m + 1)
    } else if (view === 'semana') setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    else setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }

  const navLabel = () => {
    if (view === 'anual') return String(year)
    if (view === 'mes') return `${MONTHS_FULL[month]} ${year}`
    if (view === 'semana') {
      const end = new Date(selectedDate)
      end.setDate(end.getDate() + 6)
      return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} — ${end.getDate()} ${MONTHS[end.getMonth()]} ${year}`
    }
    return selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
  const activas = filtered.filter((c) => c.estado === 'published' || c.estado === 'enrollment_open' || c.estado === 'in_progress').length
  const totalPlazas = filtered.reduce((s, c) => s + c.plazas, 0)
  const totalInscritos = filtered.reduce((s, c) => s + c.inscritos, 0)

  const handleConvClick = (id: string) => router.push(`/programacion/${id}`)

  const viewButtons: { key: ViewMode; label: string; icon: typeof Calendar }[] = [
    { key: 'anual', label: 'Anual', icon: CalendarRange },
    { key: 'mes', label: 'Mes', icon: CalendarDays },
    { key: 'semana', label: 'Semana', icon: Calendar },
    { key: 'dia', label: 'Dia', icon: Clock },
    { key: 'lista', label: 'Lista', icon: List },
  ]

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
            <Button variant="outline" onClick={() => setView('lista')}>
              <List className="mr-2 h-4 w-4" />
              Ver convocatorias en lista
            </Button>
            <Button onClick={() => router.push('/programacion/nueva')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Convocatoria
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
          { label: 'Ocupacion', value: totalPlazas > 0 ? `${Math.round((totalInscritos / totalPlazas) * 100)}%` : '—', icon: BarChart3 },
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
          <SegmentedToggle
            value={view}
            options={viewButtons.map(({ key, label, icon }) => ({ value: key, label, icon }))}
            onValueChange={setView}
            ariaLabel="Vista de programación"
          />

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={navPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{navLabel()}</span>
            <Button variant="ghost" size="sm" onClick={navNext}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="text-xs ml-1" onClick={navToday}>Hoy</Button>
          </div>

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
        <MonthCalendar convocatorias={filtered} year={year} month={month} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {!isLoading && view === 'semana' && (
        <WeekView convocatorias={filtered} weekStart={weekStart} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {!isLoading && view === 'dia' && (
        <DayView convocatorias={filtered} date={selectedDate} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {/* List View */}
      {!isLoading && view === 'lista' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="h-4 w-4" />
              Lista operativa de convocatorias
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vista estructurada para planificación: curso, sede, aula, docente, fechas, horario, precio y plazas. La creación valida conflictos antes de guardar.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {listMessage ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                {listMessage}
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-2 font-medium">Código</th>
                    <th className="text-left p-2 font-medium min-w-[260px]">Curso / ciclo</th>
                    <th className="text-left p-2 font-medium">Sede</th>
                    <th className="text-left p-2 font-medium">Aula</th>
                    <th className="text-left p-2 font-medium">Docente</th>
                    <th className="text-left p-2 font-medium">Inicio</th>
                    <th className="text-left p-2 font-medium">Fin</th>
                    <th className="text-left p-2 font-medium">Día</th>
                    <th className="text-left p-2 font-medium">Horario</th>
                    <th className="text-right p-2 font-medium">Precio</th>
                    <th className="text-center p-2 font-medium">Plazas</th>
                    <th className="text-center p-2 font-medium">Estado</th>
                    <th className="text-right p-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-muted/10 align-top">
                    <td className="p-2 text-xs font-semibold text-muted-foreground">Nueva</td>
                    <td className="p-2">
                      <select
                        value={draft.courseId}
                        onChange={(event) => updateDraft({ courseId: event.target.value })}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Seleccionar curso/ciclo</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>{course.name}{course.tipo ? ` · ${course.tipo}` : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={draft.campusId}
                        onChange={(event) => updateDraft({ campusId: event.target.value, classroomId: '', instructorId: '' })}
                        className="h-9 w-36 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Sede</option>
                        {campuses.map((campus) => (
                          <option key={campus.id} value={campus.id}>{campus.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={draft.classroomId}
                        onChange={(event) => {
                          const room = filteredClassrooms.find((item) => item.id === event.target.value)
                          updateDraft({ classroomId: event.target.value, maxStudents: room?.capacity ? String(room.capacity) : draft.maxStudents })
                        }}
                        className="h-9 w-36 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Aula</option>
                        {filteredClassrooms.map((classroom) => (
                          <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.capacity}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <select
                        value={draft.instructorId}
                        onChange={(event) => updateDraft({ instructorId: event.target.value })}
                        className="h-9 w-40 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Docente</option>
                        {filteredStaff.map((person) => (
                          <option key={person.id} value={person.id}>{person.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2"><input type="date" value={draft.startDate} onChange={(event) => updateDraft({ startDate: event.target.value })} className="h-9 w-32 rounded-md border border-input bg-background px-2 text-xs" /></td>
                    <td className="p-2"><input type="date" value={draft.endDate} onChange={(event) => updateDraft({ endDate: event.target.value })} className="h-9 w-32 rounded-md border border-input bg-background px-2 text-xs" /></td>
                    <td className="p-2">
                      <select value={draft.day} onChange={(event) => updateDraft({ day: event.target.value })} className="h-9 w-28 rounded-md border border-input bg-background px-2 text-xs">
                        {DAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                      </select>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <input type="time" value={draft.timeStart} onChange={(event) => updateDraft({ timeStart: event.target.value })} className="h-9 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                        <input type="time" value={draft.timeEnd} onChange={(event) => updateDraft({ timeEnd: event.target.value })} className="h-9 w-24 rounded-md border border-input bg-background px-2 text-xs" />
                      </div>
                    </td>
                    <td className="p-2"><input type="number" value={draft.price} onChange={(event) => updateDraft({ price: event.target.value })} className="h-9 w-24 rounded-md border border-input bg-background px-2 text-right text-xs" placeholder="€" /></td>
                    <td className="p-2"><input type="number" value={draft.maxStudents} onChange={(event) => updateDraft({ maxStudents: event.target.value })} className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center text-xs" /></td>
                    <td className="p-2 text-center"><Badge variant="secondary">Borrador</Badge></td>
                    <td className="p-2 text-right">
                      <Button size="sm" onClick={createDraftConvocatoria} disabled={isSavingDraft}>
                        {isSavingDraft ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                        Crear
                      </Button>
                    </td>
                  </tr>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={13} className="text-center py-8 text-muted-foreground">No hay convocatorias</td></tr>
                  ) : (
                    filtered.map((conv) => {
                      const ocupacion = conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0
                      const dateStart = conv.fechaInicio ? new Date(conv.fechaInicio).toLocaleDateString('es-ES') : '—'
                      const dateEnd = conv.fechaFin ? new Date(conv.fechaFin).toLocaleDateString('es-ES') : '—'
                      return (
                        <tr key={conv.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-2 font-mono text-xs text-muted-foreground">{conv.codigo || conv.id}</td>
                          <td className="p-2">
                            <p className="font-medium">{conv.curso}</p>
                            <p className="text-xs text-muted-foreground">{conv.tipo || 'Curso'}</p>
                          </td>
                          <td className="p-2 text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{conv.sede}</span></td>
                          <td className="p-2 text-muted-foreground">{conv.aula}</td>
                          <td className="p-2 text-muted-foreground">{conv.profesor}</td>
                          <td className="p-2 whitespace-nowrap">{dateStart}</td>
                          <td className="p-2 whitespace-nowrap">{dateEnd}</td>
                          <td className="p-2 text-muted-foreground">{conv.dias.map((day) => DAY_OPTIONS.find((item) => item.value === day)?.label ?? day).join(', ') || '—'}</td>
                          <td className="p-2 text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{conv.horaInicio}–{conv.horaFin}</span></td>
                          <td className="p-2 text-right">{conv.precio ? `${conv.precio.toLocaleString('es-ES')} €` : 'Consultar'}</td>
                          <td className="p-2 text-center">
                            <span className="font-medium">{conv.inscritos}</span>
                            <span className="text-muted-foreground">/{conv.plazas}</span>
                            <div className="mt-1 h-1 w-full rounded-full bg-muted">
                              <div className={`h-1 rounded-full ${ocupacion >= 90 ? 'bg-primary' : ocupacion >= 70 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${ocupacion}%` }} />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <Badge className={`text-[10px] text-white border-0 ${STATUS_COLORS[conv.estado] || 'bg-gray-400'}`}>
                              {STATUS_LABELS[conv.estado] || conv.estado}
                            </Badge>
                            {conv.planningStatus ? <p className="mt-1 text-[10px] text-muted-foreground">{conv.planningStatus}</p> : null}
                          </td>
                          <td className="p-2 text-right">
                            <Button variant="outline" size="sm" onClick={() => handleConvClick(conv.id)}>
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
