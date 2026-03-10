import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { BookOpen, Calendar, Users, Award, TrendingUp, TrendingDown } from 'lucide-react'

// KpiCard es un patrón compuesto (no un componente standalone).
// Estas stories documentan el patrón estándar para tarjetas KPI en Akademate.

const meta = {
  title: 'Akademate/KpiCard',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  subtitle?: string
}

function KpiCard({ icon: Icon, label, value, delta, subtitle }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {delta && (
          <div className="mt-4 flex items-center gap-1.5">
            {delta.positive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={`text-xs font-medium ${delta.positive ? 'text-emerald-600' : 'text-destructive'}`}
            >
              {delta.value}
            </span>
            <span className="text-xs text-muted-foreground">vs. mes anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const TotalCursos: Story = {
  render: () => (
    <div className="w-64">
      <KpiCard
        icon={BookOpen}
        label="Total Cursos"
        value={48}
        subtitle="En catálogo activo"
        delta={{ value: '+6 cursos', positive: true }}
      />
    </div>
  ),
}

export const Convocatorias: Story = {
  render: () => (
    <div className="w-64">
      <KpiCard
        icon={Calendar}
        label="Convocatorias"
        value={132}
        subtitle="Abiertas este trimestre"
        delta={{ value: '+18%', positive: true }}
      />
    </div>
  ),
}

export const AlumnosActivos: Story = {
  render: () => (
    <div className="w-64">
      <KpiCard
        icon={Users}
        label="Alumnos Activos"
        value="1.847"
        subtitle="Con matrícula vigente"
        delta={{ value: '-3%', positive: false }}
      />
    </div>
  ),
}

export const Certificados: Story = {
  render: () => (
    <div className="w-64">
      <KpiCard
        icon={Award}
        label="Certificados"
        value={284}
        subtitle="Emitidos este año"
        delta={{ value: '+42 este mes', positive: true }}
      />
    </div>
  ),
}

export const DashboardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 w-full">
      <KpiCard
        icon={BookOpen}
        label="Total Cursos"
        value={48}
        subtitle="En catálogo activo"
        delta={{ value: '+6 cursos', positive: true }}
      />
      <KpiCard
        icon={Calendar}
        label="Convocatorias"
        value={132}
        subtitle="Abiertas este trimestre"
        delta={{ value: '+18%', positive: true }}
      />
      <KpiCard
        icon={Users}
        label="Alumnos Activos"
        value="1.847"
        subtitle="Con matrícula vigente"
        delta={{ value: '-3%', positive: false }}
      />
      <KpiCard
        icon={Award}
        label="Certificados"
        value={284}
        subtitle="Emitidos este año"
        delta={{ value: '+42 este mes', positive: true }}
      />
    </div>
  ),
}
