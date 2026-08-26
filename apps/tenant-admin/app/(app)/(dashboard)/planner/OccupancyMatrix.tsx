'use client'

import * as React from 'react'
import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { cn } from '@payload-config/lib/utils'
import { DAY_FILTERS, cardMatchesDay, type PlannerDayKey } from './planner-days'
import {
  DASHBOARD_CARD_CLASS,
  getRunStatusVisual,
  getTrainingTypeVisual,
} from '../programacion/planning-visuals'

export const PLANNER_EMPTY_AULAS_COPY =
  'Esta sede no tiene aulas. Añade al menos una para ver el planner.'

const SHIFT_KEYS = ['morning', 'afternoon', 'evening_extra'] as const

const SHIFT_LABELS: Record<(typeof SHIFT_KEYS)[number], string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening_extra: 'Tercer turno',
}

const DAY_LABELS: Record<string, string> = {
  monday: 'LUN',
  tuesday: 'MAR',
  wednesday: 'MIE',
  thursday: 'JUE',
  friday: 'VIE',
  saturday: 'SAB',
  sunday: 'DOM',
}

const DAY_ORDER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
}

export interface OccupancyCard {
  id: string
  curso: string
  tipo: string
  cursoImagen?: string | null
  sedeId: string
  horario: string
  dias: string[]
  horaInicio: string
  horaFin: string
  aulaId: string
  turno: string
  plazas: number
  estado: string
}

export interface OccupancyAula {
  id: string
  name: string
  campusId: string
  capacity: number
}

function formatSchedule(
  card: Pick<OccupancyCard, 'dias' | 'horaInicio' | 'horaFin' | 'horario'>
): string {
  const days = card.dias.map((day) => DAY_LABELS[day] ?? day.toUpperCase()).join(', ')
  const start = card.horaInicio?.slice(0, 5) ?? ''
  const end = card.horaFin?.slice(0, 5) ?? ''
  const time = start && end ? `${start}-${end}` : start || end
  return [days, time].filter(Boolean).join(' · ') || card.horario
}

function firstDayOrder(card: Pick<OccupancyCard, 'dias'>): number {
  const orders = card.dias.map((day) => DAY_ORDER[day] ?? 99)
  return orders.length > 0 ? Math.min(...orders) : 99
}

function sortCardsByWeekday<T extends Pick<OccupancyCard, 'dias' | 'horaInicio' | 'curso'>>(
  cards: T[]
): T[] {
  return [...cards].sort((a, b) => {
    const byDay = firstDayOrder(a) - firstDayOrder(b)
    if (byDay !== 0) return byDay
    const byTime = String(a.horaInicio || '').localeCompare(String(b.horaInicio || ''))
    if (byTime !== 0) return byTime
    return a.curso.localeCompare(b.curso, 'es')
  })
}

export function OccupancyMatrix({
  aulas,
  cards,
  sedeFilter,
  sedeName,
}: {
  aulas: OccupancyAula[]
  cards: OccupancyCard[]
  sedeFilter: string
  sedeName?: string
}) {
  const [selectedDay, setSelectedDay] = useState<PlannerDayKey>('all')
  const visibleAulas = aulas.filter((aula) => aula.campusId === sedeFilter)
  const visibleCards = cards.filter((card) => card.sedeId === sedeFilter)
  const gridTemplateColumns = `minmax(8.5rem,10rem) repeat(${Math.max(visibleAulas.length, 1)}, minmax(16rem, 1fr))`

  if (visibleAulas.length === 0) {
    return (
      <div
        data-testid="planner-empty-aulas"
        className="flex min-h-[16rem] flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center"
      >
        <p className="max-w-md text-sm text-muted-foreground">{PLANNER_EMPTY_AULAS_COPY}</p>
      </div>
    )
  }

  return (
    <Card data-testid="planner-occupancy-matrix" className="min-h-0 flex-1 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">{sedeName ?? 'Centro'}</CardTitle>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="px-2 text-xs font-semibold text-foreground">Día de ocupación</span>
            <div
              aria-label="Seleccionar día de ocupación"
              className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap"
              role="tablist"
            >
              {DAY_FILTERS.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedDay === day.key}
                  variant={selectedDay === day.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedDay(day.key)}
                  className="h-7 px-2.5 text-xs"
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 overflow-auto p-4 pt-0">
        <div
          role="table"
          aria-label="Ocupación por turno y aula"
          data-slot="planner-matrix"
          className="min-w-0 overflow-x-auto rounded-xl border border-border bg-surface"
        >
          <div className="min-w-[760px]" style={{ minWidth: `max(760px, calc(10rem + ${visibleAulas.length} * 16rem))` }}>
            <div role="row" className="grid border-b border-border bg-muted" style={{ gridTemplateColumns }}>
              <div role="columnheader" className="sticky left-0 z-10 bg-muted px-3 py-2.5 text-xs font-semibold text-foreground">
                Turno
              </div>
              {visibleAulas.map((aula) => (
                <div
                  key={aula.id}
                  role="columnheader"
                  data-testid={`planner-room-col-${aula.id}`}
                  className="border-l border-border px-3 py-2.5"
                >
                  <span className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">{aula.name}</span>
                    <span className="text-muted-foreground">{aula.capacity} plazas</span>
                  </span>
                </div>
              ))}
            </div>
            {SHIFT_KEYS.map((shift) => (
              <div
                key={shift}
                role="row"
                data-testid={`planner-shift-row-${shift}`}
                className="grid border-b border-border last:border-b-0"
                style={{ gridTemplateColumns }}
              >
                <div
                  role="rowheader"
                  className="sticky left-0 z-10 flex items-center bg-muted px-3 py-3 text-sm font-semibold text-foreground"
                >
                  {SHIFT_LABELS[shift]}
                </div>
                {visibleAulas.map((aula) => {
                  const shiftCards = sortCardsByWeekday(
                    visibleCards.filter((card) => card.aulaId === aula.id && card.turno === shift)
                  )
                  const occupancyCards = shiftCards.filter((card) => cardMatchesDay(card, selectedDay))
                  const occupied = occupancyCards.reduce(
                    (sum, card) =>
                      sum + Math.min(card.plazas || 0, aula.capacity || card.plazas || 0),
                    0
                  )
                  const ratio =
                    aula.capacity > 0 ? Math.min(100, Math.round((occupied / aula.capacity) * 100)) : 0

                  return (
                    <div
                      key={`${aula.id}-${shift}`}
                      role="cell"
                      data-testid={`planner-cell-${aula.id}-${shift}`}
                      className="border-l border-border bg-surface p-2"
                    >
                      {occupancyCards.length === 0 ? (
                        <div className="flex min-h-[4.5rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                          Libre
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={
                                ratio >= 100
                                  ? 'h-1.5 rounded-full bg-[var(--destructive,#b91c1c)]'
                                  : 'h-1.5 rounded-full bg-[var(--brand,#0066CC)]'
                              }
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          {occupancyCards.map((card) => {
                            const trainingVisual = getTrainingTypeVisual(card.tipo)
                            const statusVisual = getRunStatusVisual(card.estado)
                            return (
                              <button
                                key={card.id}
                                type="button"
                                aria-label={`${card.curso} · ${formatSchedule(card)}`}
                                className={cn(
                                  DASHBOARD_CARD_CLASS,
                                  'flex h-auto w-full items-stretch overflow-hidden text-left',
                                )}
                                onClick={() =>
                                  window.location.assign(`/dashboard/programacion/${card.id}`)
                                }
                              >
                                {card.cursoImagen ? (
                                  <img
                                    src={card.cursoImagen}
                                    alt=""
                                    className="h-auto w-14 shrink-0 object-cover"
                                  />
                                ) : (
                                  <div className="flex w-14 shrink-0 items-center justify-center bg-background">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1 p-2">
                                  <div className="mb-1 flex flex-wrap gap-1">
                                    <Badge variant="static" className={trainingVisual.className}>
                                      {trainingVisual.label}
                                    </Badge>
                                    <Badge variant="static" className={statusVisual.className}>
                                      {statusVisual.label}
                                    </Badge>
                                  </div>
                                  <div className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                                    {card.curso}
                                  </div>
                                  <div className="mt-1 text-xs font-medium text-muted-foreground">
                                    {formatSchedule(card)}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
