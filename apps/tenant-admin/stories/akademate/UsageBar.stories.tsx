import type { Meta, StoryObj } from '@storybook/nextjs'
import { UsageBar } from '@payload-config/components/ui/UsageBar'

// UsageBar devuelve null cuando ratio < 0.8, así que solo se muestra con valores ≥ 80%

const meta = {
  title: 'Akademate/UsageBar',
  component: UsageBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof UsageBar>

export default meta
type Story = StoryObj<typeof meta>

export const NearLimit: Story = {
  args: {
    resource: 'cursos',
    current: 40,
    limit: 50,
  },
}

export const Critical: Story = {
  args: {
    resource: 'sedes',
    current: 19,
    limit: 20,
  },
}

export const AtLimit: Story = {
  args: {
    resource: 'ciclos',
    current: 10,
    limit: 10,
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-3 max-w-2xl">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">80% — Aviso</p>
      <UsageBar resource="cursos" current={40} limit={50} />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mt-2">95% — Crítico</p>
      <UsageBar resource="sedes" current={19} limit={20} />
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mt-2">100% — Límite alcanzado</p>
      <UsageBar resource="ciclos" current={10} limit={10} />
    </div>
  ),
}
