'use client'

import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@payload-config/components/ui/tooltip'
import { cn } from '@payload-config/lib/utils'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { convocatoriaNuevaHref } from '@/app/lib/form-return-to'
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
import { TimePlanner, type PlannerBlock } from './TimePlanner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { SortableTableHead } from '@payload-config/components/ui/sortable-table-head'
import { useCycleSort } from '@payload-config/hooks/useCycleSort'
import type { SortKind } from '@payload-config/lib/cycle-sort'
import { AssignEmptyButton } from '@payload-config/components/ui/assign-empty'
import { SegmentedToggle } from '@payload-config/components/ui/SegmentedToggle'
import {
  CourseFundingBadge,
} from '@payload-config/components/akademate/dashboard/CourseTaxonomyBadges'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  DirectoryAreaBadge,
  DirectoryCampusIdentity,
  DirectoryNeutralBadge,
  DirectoryStaffIcons,
  useCampusIdentityMap,
  type DirectoryStaffRef,
} from '@payload-config/components/directory/PremiumDirectoryShell'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Convocatoria {
  id: string
  curso: string
  tipo: string
  area: string
  areaColor: string | null
  modalidad: string
  sede: string
  sedeId: string
  profesor: string
  profesorRefs: DirectoryStaffRef[]
  aula: string
  fechaInicio: string
  fechaFin: string
  horaInicio: string
  horaFin: string
  dias: string[]
  plazas: number
  inscritos: number
  estado: string
  color: string
}

interface Campus {
  id: string
  name: string
}

type ViewMode = 'anual' | 'mes' | 'semana' | 'dia' | 'lista' | 'planificador'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8:00 - 21:00

const STATUS_COLORS: Record<string, string> = {
  enrollment_open: 'bg-green-500',
  in_progress: 'bg-blue-500',
  draft: 'bg-gray-400',
  completed: 'bg-gray-300',
  cancelled: 'bg-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  enrollment_open: 'Inscripcion abierta',
  in_progress: 'En curso',
  draft: 'Borrador',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const PROGRAMACION_SORT_KINDS = {
  curso: 'text',
  tipo: 'text',
  sede: 'text',
  docente: 'number',
  aula: 'text',
  fechas: 'date',
  plazas: 'number',
  estado: 'text',
} as const satisfies Record<string, SortKind>

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

function AnnualGantt({ convocatorias, year, campusImages, onConvClick }: {
  convocatorias: Convocatoria[]
  year: number
  campusImages?: Record<string, string>
  onConvClick: (id: string) => void
}) {
  const spanStart = new Date(year, 0, 1).getTime()
  const spanEnd = new Date(year + 1, 11, 31).getTime()
  const spanDays = (spanEnd - spanStart) / (1000 * 60 * 60 * 24)
  const today = new Date()
  const inSpan = today.getFullYear() === year || today.getFullYear() === year + 1
  const todayPct = inSpan
    ? ((today.getTime() - spanStart) / (1000 * 60 * 60 * 24) / spanDays) * 100
    : null

  return (
    <Card className="flex h-full min-h-[32rem] min-h-0 flex-col overflow-hidden" data-slot="annual-gantt">
      <CardHeader className="shrink-0 p-4 pb-3">
        <CardTitle className="text-base">Cronograma {year}–{year + 1}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {convocatorias.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No hay convocatorias para {year}
          </div>
        ) : (
          <div data-slot="annual-gantt-scroll" className="min-h-0 flex-1 overflow-auto overscroll-contain">
            <div className="min-w-[110rem]">
              <div className="sticky top-0 z-40 flex border-b border-border bg-muted">
                <div className="sticky left-0 z-30 w-[14rem] shrink-0 bg-muted px-4 py-2 text-xs font-semibold">Convocatoria</div>
                <div className="sticky left-[14rem] z-30 w-[10rem] shrink-0 border-r border-border bg-muted px-3 py-2 text-xs font-semibold">Sede</div>
                <div className="relative min-h-10 min-w-0 flex-1">
                  <div className="flex h-full">
                    {Array.from({ length: 24 }, (_, index) => {
                      const monthYear = year + Math.floor(index / 12)
                      const month = index % 12
                      return (
                        <div
                          key={`${monthYear}-${month}`}
                          className="relative min-w-[4.5rem] flex-1 border-l border-border/60 py-2 text-center text-[10px] font-medium text-muted-foreground"
                        >
                          <span className="block">{MONTHS[month]}</span>
                          {month === 0 ? <span className="block text-[9px] tabular-nums">{monthYear}</span> : null}
                        </div>
                      )
                    })}
                  </div>
                  {todayPct != null ? (
                    <div className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-primary" style={{ left: `${todayPct}%` }} />
                  ) : null}
                </div>
              </div>
              {convocatorias.map((conv) => {
                const start = new Date(conv.fechaInicio)
                const end = new Date(conv.fechaFin)
                const leftPct = Math.max(0, ((start.getTime() - spanStart) / (1000 * 60 * 60 * 24) / spanDays) * 100)
                const rightPct = Math.min(100, ((end.getTime() - spanStart) / (1000 * 60 * 60 * 24) / spanDays) * 100)
                const widthPct = Math.max(rightPct - leftPct, 0.5)
                return (
                  <div key={conv.id} className="flex border-b border-border/70">
                    <button
                      type="button"
                      className="sticky left-0 z-20 flex w-[14rem] shrink-0 items-center bg-card px-4 py-2.5 text-left text-xs font-medium"
                      onClick={() => onConvClick(conv.id)}
                    >
                      <span className="truncate">{conv.curso}</span>
                    </button>
                    <div className="sticky left-[14rem] z-20 flex w-[10rem] shrink-0 items-center border-r border-border bg-card px-3 py-2.5">
                      {conv.sede ? (
                        <DirectoryCampusIdentity
                          name={conv.sede}
                          imageUrl={campusImages?.[conv.sede]}
                          href={conv.sedeId ? `/dashboard/sedes/${conv.sedeId}` : undefined}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="relative h-12 min-w-0 flex-1">
                      {Array.from({ length: 24 }, (_, index) => (
                        <div
                          key={index}
                          className="absolute top-0 bottom-0 border-l border-border/20"
                          style={{ left: `${(index / 24) * 100}%` }}
                        />
                      ))}
                      {todayPct != null ? (
                        <div className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-primary" style={{ left: `${todayPct}%` }} />
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          'absolute top-2 bottom-2 z-10 truncate rounded-md px-2 text-left text-[10px] font-medium text-white',
                          STATUS_COLORS[conv.estado] || 'bg-primary',
                        )}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        onClick={() => onConvClick(conv.id)}
                        title={`${conv.curso} · ${conv.sede}`}
                      >
                        {conv.curso}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="shrink-0 border-t bg-card px-4 py-2.5" data-slot="annual-gantt-legend">
        <ul className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-green-500" />Inscripción abierta</li>
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-500" />En curso</li>
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gray-400" />Borrador</li>
          <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-400" />Cancelada</li>
        </ul>
      </CardFooter>
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
  const campusImages = useCampusIdentityMap()
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('anual')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sedeFilter, setSedeFilter] = useState('todas')
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { state: sortState, toggle: toggleSort, reset: resetSort, sortRows } = useCycleSort(PROGRAMACION_SORT_KINDS)

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const [convsRes, campusRes] = await Promise.all([
          fetch('/api/convocatorias', { cache: 'no-cache' }),
          fetch('/api/campuses?limit=50', { cache: 'no-cache' }),
        ])

        if (convsRes.ok) {
          const convsData = await convsRes.json()
          const items = Array.isArray(convsData.data) ? convsData.data : []
          setConvocatorias(items.map((c: Record<string, unknown>) => {
            const profesor = c.profesor
            let profesorName = ''
            if (typeof profesor === 'string') profesorName = profesor
            else if (profesor && typeof profesor === 'object') {
              const record = profesor as { full_name?: string; first_name?: string; last_name?: string }
              profesorName = record.full_name?.trim()
                || `${record.first_name?.trim() ?? ''} ${record.last_name?.trim() ?? ''}`.trim()
            }
            const rawRefs = Array.isArray(c.profesorRefs) ? c.profesorRefs : []
            const profesorRefs: DirectoryStaffRef[] = rawRefs
              .map((ref) => {
                if (!ref || typeof ref !== 'object') return null
                const record = ref as { id?: unknown; name?: unknown; photo?: unknown; src?: unknown }
                const name = typeof record.name === 'string' ? record.name.trim() : ''
                if (!name) return null
                const photo =
                  typeof record.photo === 'string'
                    ? record.photo
                    : typeof record.src === 'string'
                      ? record.src
                      : null
                return {
                  id: record.id == null ? null : String(record.id),
                  name,
                  photo,
                }
              })
              .filter(Boolean) as DirectoryStaffRef[]
            if (profesorRefs.length === 0 && profesorName && profesorName !== 'Sin asignar') {
              profesorRefs.push({ id: null, name: profesorName })
            }
            return {
            id: String(c.id),
            curso: (c.cursoNombre as string) || 'Curso',
            tipo: (c.cursoTipo as string) || '',
            area: (c.cursoArea as string) || '',
            areaColor: typeof c.cursoAreaColor === 'string' ? c.cursoAreaColor : null,
            modalidad: (c.modalidad as string) || '',
            sede: (c.campusNombre as string) || '',
            sedeId: String(c.campusId || ''),
            profesor: profesorName,
            profesorRefs,
            aula: (c.aulaNombre as string) || '',
            fechaInicio: (c.fechaInicio as string) || '',
            fechaFin: (c.fechaFin as string) || '',
            horaInicio: ((c.horario as string) || '').split(' ').pop()?.split('-')[0] || '09:00',
            horaFin: ((c.horario as string) || '').split(' ').pop()?.split('-')[1] || '14:00',
            dias: ((c.horario as string) || '').split(' ')[0]?.split(',').map((d: string) => d.trim().toLowerCase()) || ['monday', 'tuesday', 'wednesday'],
            plazas: (c.plazasTotales as number) || 0,
            inscritos: (c.plazasOcupadas as number) || 0,
            estado: (c.estado as string) || 'draft',
            color: STATUS_COLORS[(c.estado as string) || 'draft'] || 'bg-primary',
          }}))
        }

        if (campusRes.ok) {
          const campusData = await campusRes.json()
          const docs = Array.isArray(campusData.docs) ? campusData.docs : []
          setCampuses(docs.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            name: (c.name as string) || 'Sede',
          })))
        }
      } catch { /* graceful */ }
      finally { setIsLoading(false) }
    }
    void load()
  }, [])

  // Filtered convocatorias
  const filtered = useMemo(() => {
    if (sedeFilter === 'todas') return convocatorias
    return convocatorias.filter((c) => c.sedeId === sedeFilter)
  }, [convocatorias, sedeFilter])

  useEffect(() => {
    resetSort()
  }, [sedeFilter, resetSort])

  const listed = useMemo(
    () =>
      sortRows(filtered, (conv, column) => {
        switch (column) {
          case 'curso':
            return conv.curso
          case 'tipo':
            return conv.tipo
          case 'sede':
            return conv.sede
          case 'docente':
            return conv.profesorRefs.length > 0 ? conv.profesorRefs.length : conv.profesor ? 1 : 0
          case 'aula':
            return conv.aula
          case 'fechas':
            return conv.fechaInicio
          case 'plazas':
            return conv.plazas > 0 ? conv.inscritos / conv.plazas : conv.inscritos
          case 'estado':
            return STATUS_LABELS[conv.estado] ?? conv.estado
          default: {
            const _never: never = column
            return _never
          }
        }
      }),
    [filtered, sortRows],
  )

  // Navigation
  const navPrev = () => {
    if (view === 'anual') setYear((y) => y - 1)
    else if (view === 'mes') {
      if (month === 0) { setMonth(11); setYear((y) => y - 1) }
      else setMonth((m) => m - 1)
    } else if (view === 'semana' || view === 'planificador') setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    else setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }

  const navNext = () => {
    if (view === 'anual') setYear((y) => y + 1)
    else if (view === 'mes') {
      if (month === 11) { setMonth(0); setYear((y) => y + 1) }
      else setMonth((m) => m + 1)
    } else if (view === 'semana' || view === 'planificador') setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    else setSelectedDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }

  const navLabel = () => {
    if (view === 'anual') return String(year)
    if (view === 'mes') return `${MONTHS_FULL[month]} ${year}`
    if (view === 'semana' || view === 'planificador') {
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
  const activas = filtered.filter((c) => c.estado === 'enrollment_open' || c.estado === 'in_progress').length
  const totalPlazas = filtered.reduce((s, c) => s + c.plazas, 0)
  const totalInscritos = filtered.reduce((s, c) => s + c.inscritos, 0)

  const handleConvClick = (id: string) => router.push(`/programacion/${id}`)

  const viewButtons: { key: ViewMode; label: string; icon: typeof Calendar }[] = [
    { key: 'anual', label: 'Anual', icon: CalendarRange },
    { key: 'mes', label: 'Mes', icon: CalendarDays },
    { key: 'semana', label: 'Semana', icon: Calendar },
    { key: 'dia', label: 'Dia', icon: Clock },
    { key: 'lista', label: 'Lista', icon: List },
    { key: 'planificador', label: 'Planificador', icon: Clock },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Programacion Academica"
        description="Calendario de convocatorias, horarios y ocupacion"
        icon={Calendar}
        badge={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{totalConvs} convocatorias</Badge>
            <Badge variant="default">{activas} activas</Badge>
          </div>
        }
        actions={
          <Button onClick={() => router.push(convocatoriaNuevaHref('/programacion'))}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Convocatoria
          </Button>
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

      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
        <SegmentedToggle
          ariaLabel="Vista de programacion"
          value={view}
          onValueChange={(value) => setView(value as ViewMode)}
          options={viewButtons.map(({ key, label }) => ({ value: key, label }))}
        />
        <div className="flex min-w-0 flex-wrap items-center gap-2 xl:ml-auto">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={navPrev}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-0 max-w-[180px] truncate text-center text-sm font-medium sm:max-w-none sm:min-w-[140px]">{navLabel()}</span>
            <Button variant="ghost" size="sm" onClick={navNext}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={navToday}>Hoy</Button>
          </div>
          <Select value={sedeFilter} onValueChange={setSedeFilter}>
            <SelectTrigger className="h-10 w-full min-w-0 bg-background sm:w-[210px]">
              <SelectValue placeholder="Sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Calendar views */}
      {!isLoading && view === 'anual' && (
        <div className="min-h-[32rem] flex-1 overflow-hidden">
          <AnnualGantt
            convocatorias={filtered}
            year={year}
            campusImages={campusImages}
            onConvClick={handleConvClick}
          />
        </div>
      )}

      {!isLoading && view === 'mes' && (
        <MonthCalendar convocatorias={filtered} year={year} month={month} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {!isLoading && view === 'semana' && (
        <WeekView convocatorias={filtered} weekStart={weekStart} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {!isLoading && view === 'planificador' && (
        <TimePlanner
          blocks={filtered.flatMap((conv) => {
            const days = Array.from({ length: 7 }, (_, index) => {
              const date = new Date(weekStart)
              date.setDate(weekStart.getDate() + index)
              return date
            })
            const blocks: PlannerBlock[] = []
            for (const date of days) {
              const dayKey = formatDateKey(date)
              if (!convocatoriaOnDate(conv, dayKey)) continue
              const startHour = Number.parseInt(String(conv.horaInicio ?? '0').split(':')[0] || '0', 10)
              const endHour = Number.parseInt(String(conv.horaFin ?? '0').split(':')[0] || '0', 10)
              blocks.push({
                id: `${conv.id}-${dayKey}`,
                sourceId: conv.id,
                title: conv.curso,
                dayKey,
                startHour,
                endHour: endHour > startHour ? endHour : startHour + 1,
                timeLabel: `${conv.horaInicio}-${conv.horaFin}`,
                campus: conv.sede,
                classroom: conv.aula,
                teacher: conv.profesor,
                fundingType: conv.tipo,
                source: 'convocatoria',
              })
            }
            return blocks
          })}
          weekStart={weekStart}
          holidays={HOLIDAYS_2026}
          onOpen={(block) => handleConvClick(block.sourceId)}
        />
      )}

      {!isLoading && view === 'dia' && (
        <DayView convocatorias={filtered} date={selectedDate} holidays={HOLIDAYS_2026} onConvClick={handleConvClick} />
      )}

      {/* List View */}
      {!isLoading && view === 'lista' && (
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <SortableTableHead className="w-[26%]" label="Curso / ciclo" column="curso" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="hidden min-w-0 w-[14%] md:table-cell" label="Tipo" column="tipo" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="hidden min-w-0 w-[12%] sm:table-cell" label="Sede" column="sede" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="hidden w-[12%] lg:table-cell" label="Docente" column="docente" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="hidden w-[7%] xl:table-cell" label="Aula" column="aula" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="hidden w-[8%] xl:table-cell" label="Fechas" column="fechas" sort={sortState} onToggle={toggleSort} />
                  <SortableTableHead className="w-[8%] text-center" label="Plazas" column="plazas" sort={sortState} onToggle={toggleSort} align="center" />
                  <SortableTableHead className="w-[13%] text-center" label="Estado" column="estado" sort={sortState} onToggle={toggleSort} align="center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No hay convocatorias
                    </TableCell>
                  </TableRow>
                ) : (
                  listed.map((conv) => {
                    const ocupacion = conv.plazas > 0 ? Math.round((conv.inscritos / conv.plazas) * 100) : 0
                    const fechasLabel = [
                      conv.fechaInicio
                        ? new Date(conv.fechaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                        : null,
                      conv.fechaFin
                        ? new Date(conv.fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                        : null,
                    ].filter(Boolean).join(' - ')
                    return (
                      <TableRow
                        key={conv.id}
                        className="cursor-pointer"
                        onClick={() => handleConvClick(conv.id)}
                      >
                        <TableCell className="min-w-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <EntityThumb alt={conv.curso} fallback="page" size="sm" />
                            <div className="min-w-0">
                              <p className="min-w-0 whitespace-normal font-medium" title={conv.curso}>{conv.curso}</p>
                              {conv.area ? (
                                <div className="mt-1">
                                  <DirectoryAreaBadge label={conv.area} color={conv.areaColor} />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden min-w-0 md:table-cell">
                          <CourseFundingBadge courseType={conv.tipo} className="max-w-full truncate" />
                        </TableCell>
                        <TableCell className="hidden min-w-0 sm:table-cell">
                          <div className="flex shrink-0 justify-end sm:justify-start">
                            <DirectoryCampusIdentity
                              name={conv.sede}
                              imageUrl={conv.sede ? campusImages[conv.sede] : undefined}
                              href={conv.sedeId ? `/dashboard/sedes/${conv.sedeId}` : undefined}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="hidden min-w-0 lg:table-cell">
                          {conv.profesorRefs.length > 0 ? (
                            <DirectoryStaffIcons staff={conv.profesorRefs} />
                          ) : (
                            <AssignEmptyButton href={`/programacion/${conv.id}`} label="Asignar docente" />
                          )}
                        </TableCell>
                        <TableCell className="hidden min-w-0 xl:table-cell">
                          {conv.aula ? (
                            <DirectoryNeutralBadge>{conv.aula}</DirectoryNeutralBadge>
                          ) : (
                            <AssignEmptyButton href={`/programacion/${conv.id}`} label="Asignar aula" />
                          )}
                        </TableCell>
                        <TableCell className="hidden min-w-0 xl:table-cell">
                          <span className="block truncate text-muted-foreground" title={fechasLabel}>
                            {fechasLabel || 'Pendiente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center whitespace-normal">
                          <span className="inline-flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">{conv.inscritos}</span>
                            <span className="text-muted-foreground">/{conv.plazas}</span>
                          </span>
                          <div className="mt-1 h-1 w-full rounded-full bg-muted">
                            <div className={`h-1 rounded-full ${ocupacion >= 90 ? 'bg-primary' : ocupacion >= 70 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${ocupacion}%` }} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-normal">
                          <Badge className={`max-w-full truncate text-[10px] text-white border-0 ${STATUS_COLORS[conv.estado] || 'bg-gray-400'}`}>
                            {STATUS_LABELS[conv.estado] || conv.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
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
