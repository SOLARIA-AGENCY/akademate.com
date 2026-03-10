import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
import { Badge } from '@payload-config/components/ui/badge'

const meta = {
  title: 'Akademate/Calendario',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Vista Diaria
export const Daily: Story = {
  render: () => {
    const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`)
    const events = [
      { hour: 9, duration: 2, title: 'React Avanzado', aula: 'Aula 3', color: 'bg-blue-500' },
      { hour: 12, duration: 1, title: 'Tutoría individual', aula: 'Sala B', color: 'bg-emerald-500' },
      { hour: 15, duration: 3, title: 'Diseño UX/UI', aula: 'Lab Diseño', color: 'bg-violet-500' },
    ]
    return (
      <div className="border rounded-lg overflow-hidden max-w-xl">
        <div className="bg-muted/30 border-b px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">Lunes, 15 de Marzo 2026</span>
          <Badge variant="outline">Hoy</Badge>
        </div>
        <div className="divide-y">
          {hours.map((hour, i) => {
            const event = events.find((e) => e.hour === 8 + i)
            return (
              <div key={hour} className="flex min-h-12">
                <div className="w-16 px-3 py-2 text-xs text-muted-foreground shrink-0 font-mono">
                  {hour}
                </div>
                <div className="flex-1 py-1 px-2 relative">
                  {event && (
                    <div
                      className={`${event.color} text-white rounded-md px-2 py-1 text-xs`}
                      style={{ height: `${event.duration * 48}px` }}
                    >
                      <p className="font-semibold">{event.title}</p>
                      <p className="opacity-80">{event.aula}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}

// Vista Semanal
export const Weekly: Story = {
  render: () => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
    const loads = [6, 4, 8, 3, 7]
    const max = 10
    return (
      <div className="border rounded-lg overflow-hidden max-w-lg">
        <div className="bg-muted/30 border-b px-4 py-3">
          <span className="font-semibold text-sm">Semana del 9 al 13 de Marzo</span>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-3 h-40">
            {days.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">{loads[i]}h</span>
                <div className="w-full rounded-t-md bg-primary/20 relative" style={{ height: `${(loads[i] / max) * 120}px` }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-md bg-primary"
                    style={{ height: `${(loads[i] / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
            <span>Total semana: {loads.reduce((a, b) => a + b, 0)}h</span>
            <span>Máximo diario: {max}h</span>
          </div>
        </div>
      </div>
    )
  },
}

// Vista Mensual
export const Monthly: Story = {
  render: () => {
    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    const days = Array.from({ length: 35 }, (_, i) => {
      const day = i - 5 // offset para marzo
      const hasEvent = [3, 7, 10, 12, 15, 17, 20, 24, 27].includes(day)
      const isToday = day === 15
      return { day, hasEvent, isToday }
    })
    return (
      <div className="border rounded-lg overflow-hidden max-w-sm">
        <div className="bg-muted/30 border-b px-4 py-3">
          <span className="font-semibold text-sm">Marzo 2026</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(({ day, hasEvent, isToday }, i) => (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center rounded-md text-xs relative
                  ${day < 1 || day > 31 ? 'text-muted-foreground/30' : 'hover:bg-muted/50 cursor-pointer'}
                  ${isToday ? 'bg-primary text-primary-foreground font-bold hover:bg-primary' : ''}
                `}
              >
                {day >= 1 && day <= 31 ? day : ''}
                {hasEvent && !isToday && (
                  <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
}

// Vista Anual (Heatmap)
export const Yearly: Story = {
  render: () => {
    const quarters = [
      { label: 'Q1', months: ['Ene', 'Feb', 'Mar'], campaigns: 12 },
      { label: 'Q2', months: ['Abr', 'May', 'Jun'], campaigns: 18 },
      { label: 'Q3', months: ['Jul', 'Ago', 'Sep'], campaigns: 8 },
      { label: 'Q4', months: ['Oct', 'Nov', 'Dic'], campaigns: 15 },
    ]
    const intensities = [
      [3, 5, 8], [6, 7, 5], [2, 1, 5], [6, 5, 4],
    ]
    return (
      <div className="border rounded-lg overflow-hidden max-w-2xl">
        <div className="bg-muted/30 border-b px-4 py-3 flex justify-between items-center">
          <span className="font-semibold text-sm">Actividad 2026</span>
          <span className="text-xs text-muted-foreground">53 campañas académicas</span>
        </div>
        <div className="p-4 grid grid-cols-4 gap-4">
          {quarters.map(({ label, months, campaigns }, qi) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{label}</span>
                <Badge variant="outline" className="text-xs h-5">{campaigns}</Badge>
              </div>
              <div className="grid grid-rows-3 gap-1">
                {months.map((month, mi) => {
                  const intensity = intensities[qi][mi]
                  const opacity = intensity / 8
                  return (
                    <div
                      key={month}
                      className="rounded h-6 flex items-center px-2"
                      style={{ background: `rgba(var(--primary) / ${opacity})`, backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                      title={`${month}: ${intensity} clases`}
                    >
                      <span className={`text-xs ${intensity > 4 ? 'text-primary-foreground' : 'text-foreground'} font-medium`}>
                        {month}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Intensidad:</span>
          {[0.1, 0.3, 0.6, 0.9].map((o) => (
            <div
              key={o}
              className="h-3 w-6 rounded"
              style={{ backgroundColor: `hsl(var(--primary) / ${o})` }}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">Menor → Mayor</span>
        </div>
      </div>
    )
  },
}

// Selector de vistas con Tabs
export const ViewSelector: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="daily">Día</TabsTrigger>
          <TabsTrigger value="weekly">Semana</TabsTrigger>
          <TabsTrigger value="monthly">Mes</TabsTrigger>
          <TabsTrigger value="yearly">Año</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <p className="text-sm text-muted-foreground p-4">Vista diaria — ver story "Daily"</p>
        </TabsContent>
        <TabsContent value="weekly">
          <p className="text-sm text-muted-foreground p-4">Vista semanal — ver story "Weekly"</p>
        </TabsContent>
        <TabsContent value="monthly">
          <p className="text-sm text-muted-foreground p-4">Vista mensual — ver story "Monthly"</p>
        </TabsContent>
        <TabsContent value="yearly">
          <p className="text-sm text-muted-foreground p-4">Vista anual — ver story "Yearly"</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
}
