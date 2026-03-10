import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from '@payload-config/components/ui/badge'
import { Separator } from '@payload-config/components/ui/separator'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

const meta = {
  title: 'Patrones/Stepper Patterns',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Pattern 1: Segmented (horizontal numerado)
export const Segmented: Story = {
  render: () => {
    const steps = ['Datos básicos', 'Contenidos', 'Fechas', 'Confirmación']
    const current = 2
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Segmented · Paso {current + 1} de {steps.length}</p>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    i < current
                      ? 'bg-primary border-primary text-primary-foreground'
                      : i === current
                      ? 'border-primary text-primary bg-background'
                      : 'border-muted-foreground/30 text-muted-foreground bg-background'
                  }`}
                >
                  {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 whitespace-nowrap ${i === current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-2 ${i < current ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
}

// Pattern 2: Icon Progress
export const IconProgress: Story = {
  render: () => {
    const steps = [
      { label: 'Solicitud', icon: '📝', done: true },
      { label: 'Revisión', icon: '🔍', done: true },
      { label: 'Aprobación', icon: '✅', done: false, active: true },
      { label: 'Matrícula', icon: '📋', done: false },
      { label: 'Inicio', icon: '🎓', done: false },
    ]
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Icon Progress · Proceso de admisión</p>
        <div className="flex items-start gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-lg border-2 ${
                    step.done
                      ? 'bg-primary/10 border-primary'
                      : step.active
                      ? 'bg-background border-primary shadow-sm shadow-primary/20'
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-xs mt-1.5 text-center ${step.active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 ${step.done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  },
}

// Pattern 3: Numbered Line
export const NumberedLine: Story = {
  render: () => {
    const steps = ['Información personal', 'Documentación requerida', 'Pago o beca', 'Confirmación']
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Numbered Line · Matrícula</p>
        <nav className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-1 flex-1">
              <Badge
                variant={i === 1 ? 'default' : i < 1 ? 'success' : 'outline'}
                className="h-6 min-w-6 rounded-full justify-center font-bold"
              >
                {i < 1 ? '✓' : i + 1}
              </Badge>
              <span className={`text-xs hidden sm:block ${i === 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {step}
              </span>
              {i < steps.length - 1 && <Separator className="flex-1 min-w-4 mx-1" />}
            </div>
          ))}
        </nav>
      </div>
    )
  },
}

// Pattern 4: Status Timeline
export const StatusTimeline: Story = {
  render: () => {
    const events = [
      { date: '01 Mar 2026', label: 'Matrícula abierta', status: 'done', desc: 'Apertura de inscripciones' },
      { date: '15 Mar 2026', label: 'Inicio del curso', status: 'done', desc: 'Primera clase presencial' },
      { date: '15 Abr 2026', label: 'Evaluación parcial', status: 'current', desc: 'Prueba de progreso' },
      { date: '30 May 2026', label: 'Evaluación final', status: 'pending', desc: 'Examen de certificación' },
      { date: '15 Jun 2026', label: 'Certificados', status: 'pending', desc: 'Emisión de diplomas' },
    ]
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Status Timeline · Hitos del curso</p>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {events.map((ev) => (
            <div key={ev.label} className="relative mb-5 last:mb-0">
              <div
                className={`absolute -left-4 mt-0.5 h-4 w-4 rounded-full border-2 ${
                  ev.status === 'done'
                    ? 'bg-primary border-primary'
                    : ev.status === 'current'
                    ? 'bg-background border-primary'
                    : 'bg-background border-muted-foreground/30'
                }`}
              />
              <div className="flex items-start gap-3">
                <div>
                  <p className={`text-sm font-medium ${ev.status === 'pending' ? 'text-muted-foreground' : ''}`}>
                    {ev.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.date} · {ev.desc}</p>
                </div>
                {ev.status === 'current' && (
                  <Badge variant="default" className="text-xs h-5">En curso</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}

// Pattern 5: Minimal Dot
export const MinimalDot: Story = {
  render: () => {
    const steps = 5
    const current = 3
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Minimal Dot · Paso {current} de {steps}</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: steps }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i + 1 < current
                  ? 'h-2 w-2 bg-primary/60'
                  : i + 1 === current
                  ? 'h-3 w-3 bg-primary'
                  : 'h-2 w-2 bg-muted-foreground/20'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">{current}/{steps}</span>
        </div>
      </div>
    )
  },
}

export const AllPatterns: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="space-y-12 max-w-3xl">
      <div className="p-6 border rounded-lg space-y-1">
        <h3 className="font-semibold text-sm mb-4">1. Segmented</h3>
        {/* inline content */}
        <p className="text-xs text-muted-foreground">Ver story individual para el render completo.</p>
      </div>
    </div>
  ),
}
