import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Design System/Color Tokens',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const coreTokens = [
  { name: 'Background', var: '--background', textClass: 'text-foreground' },
  { name: 'Foreground', var: '--foreground', textClass: 'text-background' },
  { name: 'Card', var: '--card', textClass: 'text-card-foreground', border: true },
  { name: 'Primary', var: '--primary', textClass: 'text-primary-foreground' },
  { name: 'Secondary', var: '--secondary', textClass: 'text-secondary-foreground' },
  { name: 'Muted', var: '--muted', textClass: 'text-muted-foreground' },
  { name: 'Accent', var: '--accent', textClass: 'text-accent-foreground' },
  { name: 'Destructive', var: '--destructive', textClass: 'text-white' },
  { name: 'Border', var: '--border', textClass: 'text-foreground', border: true },
  { name: 'Ring', var: '--ring', textClass: 'text-foreground' },
]

const sidebarTokens = [
  { name: 'Sidebar', var: '--sidebar', textClass: 'text-sidebar-foreground', border: true },
  { name: 'Sidebar FG', var: '--sidebar-foreground', textClass: 'text-background' },
  { name: 'Sidebar Primary', var: '--sidebar-primary', textClass: 'text-sidebar-primary-foreground' },
  { name: 'Sidebar Accent', var: '--sidebar-accent', textClass: 'text-sidebar-accent-foreground' },
  { name: 'Sidebar Border', var: '--sidebar-border', textClass: 'text-foreground', border: true },
]

function TokenSwatch({ name, cssVar, border }: { name: string; cssVar: string; border?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`h-14 w-full rounded-md ${border ? 'border border-border' : ''}`}
        style={{ background: `hsl(var(${cssVar}))` }}
      />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{cssVar}</p>
      </div>
    </div>
  )
}

export const CorePalette: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Paleta Core</h2>
        <p className="text-sm text-muted-foreground mb-4">10 tokens base del design system</p>
        <div className="grid grid-cols-5 gap-4">
          {coreTokens.map((t) => (
            <TokenSwatch key={t.var} name={t.name} cssVar={t.var} border={t.border} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const SidebarPalette: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Paleta Sidebar</h2>
        <p className="text-sm text-muted-foreground mb-4">5 tokens para el panel de navegación lateral</p>
        <div className="grid grid-cols-5 gap-4">
          {sidebarTokens.map((t) => (
            <TokenSwatch key={t.var} name={t.name} cssVar={t.var} border={t.border} />
          ))}
        </div>
      </div>
    </div>
  ),
}

export const AllTokens: Story = {
  render: () => (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold mb-1">Paleta Core</h2>
        <p className="text-sm text-muted-foreground mb-4">10 tokens base del design system</p>
        <div className="grid grid-cols-5 gap-4">
          {coreTokens.map((t) => (
            <TokenSwatch key={t.var} name={t.name} cssVar={t.var} border={t.border} />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-1">Paleta Sidebar</h2>
        <p className="text-sm text-muted-foreground mb-4">5 tokens para el panel de navegación</p>
        <div className="grid grid-cols-5 gap-4">
          {sidebarTokens.map((t) => (
            <TokenSwatch key={t.var} name={t.name} cssVar={t.var} border={t.border} />
          ))}
        </div>
      </div>
    </div>
  ),
}
