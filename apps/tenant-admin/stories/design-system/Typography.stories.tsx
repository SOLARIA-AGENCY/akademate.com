import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Design System/Typography',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const scale = [
  {
    level: 'Heading XL',
    class: 'text-3xl font-bold',
    size: '30px · Bold',
    sample: 'Gestión de centros de formación',
  },
  {
    level: 'Heading L',
    class: 'text-2xl font-semibold',
    size: '24px · Semibold',
    sample: 'Catálogo de cursos y convocatorias',
  },
  {
    level: 'Heading M',
    class: 'text-xl font-semibold',
    size: '20px · Semibold',
    sample: 'Alumnos inscritos en este periodo',
  },
  {
    level: 'Body Base',
    class: 'text-base',
    size: '16px · Regular',
    sample: 'Gestiona tus cursos, convocatorias y alumnos desde un único panel administrativo.',
  },
  {
    level: 'Body Secondary',
    class: 'text-sm text-muted-foreground',
    size: '14px · Regular · Muted',
    sample: 'Última actualización: hace 3 minutos · 24 registros encontrados',
  },
  {
    level: 'Micro Label',
    class: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
    size: '12px · Medium · Uppercase · Wide',
    sample: 'Modalidad · Estado · Área de conocimiento',
  },
]

export const TypeScale: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      {scale.map(({ level, class: cls, size, sample }) => (
        <div key={level} className="flex gap-8 items-baseline border-b border-border/40 pb-6">
          <div className="w-36 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{level}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{size}</p>
          </div>
          <p className={cls}>{sample}</p>
        </div>
      ))}
    </div>
  ),
}

export const FontFamilies: Story = {
  render: () => (
    <div className="space-y-10 max-w-2xl">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Manrope — Principal sans-serif
        </p>
        <div className="space-y-2">
          {[300, 400, 500, 600, 700, 800].map((weight) => (
            <p key={weight} className="text-xl" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: weight }}>
              Akademate · Centro de Formación Profesional <span className="text-sm text-muted-foreground">({weight})</span>
            </p>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          JetBrains Mono — Técnica mono
        </p>
        <div className="space-y-2">
          {[400, 500, 600, 700].map((weight) => (
            <p key={weight} className="text-lg" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: weight }}>
              CEP-2026-MAR-001 · #ABCDEF · rgba(0, 0, 0, 0.8) <span className="text-sm text-muted-foreground">({weight})</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const TypographyInContext: Story = {
  render: () => (
    <div className="max-w-xl space-y-4 p-6 border rounded-lg bg-card">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Módulo · Desarrollo Web</p>
        <h1 className="text-3xl font-bold mt-1">React Avanzado con Next.js</h1>
      </div>
      <h2 className="text-xl font-semibold">Convocatoria Marzo 2026</h2>
      <p className="text-base leading-relaxed">
        Aprende las técnicas avanzadas de React y Next.js para construir aplicaciones web modernas.
        Incluye proyectos prácticos con metodologías ágiles y trabajo en equipo.
      </p>
      <p className="text-sm text-muted-foreground">
        Duración: 180 horas · Modalidad: Online · Sede: Madrid Centro
      </p>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        3 plazas disponibles
      </p>
    </div>
  ),
}
