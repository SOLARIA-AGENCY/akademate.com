'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'
import { getCalendarDateParts } from '@/app/lib/calendar-date'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

export type CampusCalendarRun = {
  id: string | number
  title: string
  start?: string | Date | null
  end?: string | Date | null
  status?: string
}

function toUtcDay(value: string | Date | null | undefined): number | null {
  const parts = getCalendarDateParts(value)
  if (!parts) return null
  return Date.UTC(parts.year, parts.month - 1, parts.day)
}

function runsOnDay(run: CampusCalendarRun, dayUtc: number): boolean {
  const start = toUtcDay(run.start)
  if (start == null) return false
  const end = toUtcDay(run.end) ?? start
  return dayUtc >= start && dayUtc <= end
}

export function CampusCourseCalendar({
  runs,
  onSelectRun,
  title = 'Calendario de cursos',
}: {
  runs: readonly CampusCalendarRun[]
  onSelectRun?: (id: string | number) => void
  title?: string
}) {
  const today = React.useMemo(() => new Date(), [])
  const [cursor, setCursor] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: startOffset + daysInMonth }, (_, index) => {
    if (index < startOffset) return null
    return index - startOffset + 1
  })
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden" data-slot="campus-course-calendar">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 py-2.5">
        <CardTitle className="text-sm font-semibold capitalize">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-28 text-center text-xs font-medium capitalize">{monthLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pb-3">
        <div className="grid shrink-0 grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
          {cells.map((day, index) => {
            if (day == null) {
              return <div key={`empty-${index}`} className="min-h-0 rounded-md bg-muted/30" />
            }
            const dayUtc = Date.UTC(year, month, day)
            const matches = runs.filter((run) => runsOnDay(run, dayUtc))
            const isToday =
              day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div
                key={day}
                className={cn(
                  'flex min-h-0 flex-col overflow-hidden rounded-md border px-1 py-0.5',
                  isToday ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/40',
                )}
              >
                <span className="text-[10px] font-semibold text-foreground">{day}</span>
                <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {matches.slice(0, 2).map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      title={run.title}
                      onClick={() => onSelectRun?.(run.id)}
                      className="truncate rounded bg-primary/15 px-0.5 text-left text-[9px] font-medium text-primary"
                    >
                      {run.title}
                    </button>
                  ))}
                  {matches.length > 2 ? (
                    <span className="text-[9px] text-muted-foreground">+{matches.length - 2}</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
