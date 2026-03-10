import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Design System/Shadows',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const elevations = [
  {
    level: 'A1',
    label: 'Elevation A1',
    description: 'Cards, paneles base',
    shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    tailwind: 'shadow-sm',
  },
  {
    level: 'A2',
    label: 'Elevation A2',
    description: 'Cards hover, dropdowns',
    shadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    tailwind: 'shadow',
  },
  {
    level: 'B1',
    label: 'Elevation B1',
    description: 'Modales, sheets, tooltips',
    shadow: '0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)',
    tailwind: 'shadow-md',
  },
  {
    level: 'B2',
    label: 'Elevation B2',
    description: 'Popovers flotantes, overlays',
    shadow: '0 20px 25px rgba(0,0,0,0.12), 0 8px 10px rgba(0,0,0,0.04)',
    tailwind: 'shadow-lg',
  },
]

export const ElevationStack: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Shadows / Elevation Stack</h2>
        <p className="text-sm text-muted-foreground mb-6">
          4 niveles de elevación para establecer jerarquía visual entre capas
        </p>
        <div className="grid grid-cols-4 gap-8">
          {elevations.map(({ level, label, description, shadow, tailwind }) => (
            <div key={level} className="space-y-4">
              <div
                className="h-24 w-full rounded-lg bg-card border border-border/20"
                style={{ boxShadow: shadow }}
              />
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{tailwind}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}

export const LayeredComposition: Story = {
  render: () => (
    <div className="relative h-80 flex items-center justify-center bg-background rounded-xl border p-8">
      {/* Base layer */}
      <div
        className="absolute inset-8 rounded-xl bg-muted/30"
        style={{ boxShadow: elevations[0].shadow }}
      />
      {/* Card */}
      <div
        className="relative z-10 w-64 rounded-lg bg-card p-4 border"
        style={{ boxShadow: elevations[1].shadow }}
      >
        <p className="font-semibold text-sm mb-2">Tarjeta base (A2)</p>
        <p className="text-xs text-muted-foreground">Contenido de la tarjeta</p>
        {/* Dropdown */}
        <div
          className="absolute -right-4 top-8 w-40 rounded-md bg-popover border p-2 z-20"
          style={{ boxShadow: elevations[2].shadow }}
        >
          <p className="text-xs font-medium px-2 py-1">Modal (B1)</p>
          <p className="text-xs text-muted-foreground px-2 py-0.5">Elemento flotante</p>
          {/* Tooltip */}
          <div
            className="absolute -right-2 -top-8 rounded bg-foreground text-background text-xs px-2 py-1 whitespace-nowrap z-30"
            style={{ boxShadow: elevations[3].shadow }}
          >
            Tooltip B2
          </div>
        </div>
      </div>
    </div>
  ),
}

export const TailwindReference: Story = {
  render: () => (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-lg font-semibold mb-4">Referencia Tailwind</h2>
      {[
        { cls: 'shadow-sm', desc: 'A1 — Cards base' },
        { cls: 'shadow', desc: 'A2 — Cards hover, dropdowns' },
        { cls: 'shadow-md', desc: 'B1 — Modales, sheets' },
        { cls: 'shadow-lg', desc: 'B2 — Popovers, overlays' },
        { cls: 'shadow-xl', desc: 'Extra — Usos especiales' },
        { cls: 'shadow-none', desc: 'None — Sin elevación' },
      ].map(({ cls, desc }) => (
        <div key={cls} className="flex items-center gap-4">
          <div className={`h-12 w-32 rounded-md bg-card border border-border/20 shrink-0 ${cls}`} />
          <div>
            <p className="text-sm font-mono font-medium">{cls}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  ),
}
