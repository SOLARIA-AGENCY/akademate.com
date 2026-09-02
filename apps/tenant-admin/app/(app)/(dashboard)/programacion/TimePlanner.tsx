'use client'

import { MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@payload-config/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@payload-config/components/ui/empty'
import { cn } from '@payload-config/lib/utils'
function formatCalendarDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('es-ES', options ?? { day: 'numeric', month: 'short' })
}

function getTrainingGanttBarClass(type?: string | null, modality?: string | null): string {
  const mode = `${modality ?? ''} ${type ?? ''}`.toLowerCase()
  if (mode.includes('teleform') || mode.includes('online') || mode.includes('demand')) return 'bg-amber-500'
  if (mode.includes('ciclo')) return 'bg-violet-600'
  if (mode.includes('ocupado')) return 'bg-emerald-600'
  if (mode.includes('desemple')) return 'bg-blue-600'
  if (mode.includes('priv')) return 'bg-red-600'
  return 'bg-slate-500'
}

const HOURS = Array.from({ length: 14 }, (_, index) => index + 8)
const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

export type PlannerBlock = {
  id: string
  sourceId: string
  title: string
  dayKey: string
  startHour: number
  endHour: number
  timeLabel: string
  campus: string
  classroom?: string
  teacher?: string
  fundingType?: string | null
  modality?: string | null
  source: 'convocatoria' | 'continua'
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TimePlanner({
  blocks,
  weekStart,
  holidays,
  onOpen,
}: {
  blocks: PlannerBlock[]
  weekStart: Date
  holidays: Record<string, string>
  onOpen: (block: PlannerBlock) => void
}) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })

  const hasBlocks = blocks.length > 0

  return (
    <Card className="overflow-hidden" data-slot="time-planner">
      <CardHeader className="p-4 pb-2">
        <h2 className="text-section font-semibold">Planificador semanal</h2>
        <p className="text-micro text-muted-foreground">
          Franjas horarias de convocatorias y formación continua. El Planner Visual agrupa por aula;
          esta vista agrupa por tiempo.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {!hasBlocks ? (
          <Empty className="min-h-[16rem] border-0">
            <EmptyHeader>
              <EmptyTitle>Sin sesiones esta semana</EmptyTitle>
              <EmptyDescription>
                Cuando una convocatoria tenga horario, ocupará su franja. La formación continua
                aparecerá aquí si tiene clase en vivo.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="min-w-[56rem]">
            <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/40">
              <div />
              {days.map((date, index) => {
                const key = formatDateKey(date)
                return (
                  <div key={key} className="border-l border-border/60 px-2 py-2 text-center">
                    <p className="text-[10px] font-medium text-muted-foreground">{WEEKDAYS[index]}</p>
                    <p className="text-sm font-semibold">{date.getDate()}</p>
                    {holidays[key] ? (
                      <p className="truncate text-[10px] text-amber-700">{holidays[key]}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-border/50"
              >
                <div className="px-2 py-2 text-right text-[10px] text-muted-foreground">{hour}:00</div>
                {days.map((date) => {
                  const key = formatDateKey(date)
                  const cellBlocks = blocks.filter(
                    (block) => block.dayKey === key && hour >= block.startHour && hour < block.endHour,
                  )
                  return (
                    <div
                      key={key + hour}
                      className={cn(
                        'min-h-12 border-l border-border/50 p-0.5',
                        holidays[key] && 'bg-muted/40',
                      )}
                    >
                      {cellBlocks.map((block) => {
                        if (hour !== block.startHour) return null
                        const span = Math.max(block.endHour - block.startHour, 1)
                        return (
                          <button
                            key={block.id}
                            type="button"
                            className={cn(
                              'w-full rounded-md px-1.5 py-1 text-left text-[11px] text-white',
                              getTrainingGanttBarClass(block.fundingType, block.modality),
                            )}
                            style={{ minHeight: `${span * 3}rem` }}
                            onClick={() => onOpen(block)}
                          >
                            <span className="block truncate font-semibold">{block.title}</span>
                            <span className="block truncate opacity-90">{block.timeLabel}</span>
                            <span className="flex items-center gap-1 truncate opacity-80">
                              <MapPin className="h-3 w-3" />
                              {block.classroom || block.campus || '—'}
                            </span>
                            {block.teacher ? (
                              <span className="block truncate opacity-80">{block.teacher}</span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function plannerDayKey(date: Date): string {
  return formatDateKey(date)
}

export function formatPlannerWeekLabel(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return `${formatCalendarDate(plannerDayKey(weekStart), { day: 'numeric', month: 'short' })} — ${formatCalendarDate(plannerDayKey(end), { day: 'numeric', month: 'short' })}`
}
