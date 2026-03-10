import type { Meta, StoryObj } from '@storybook/nextjs'
import { OcupacionBadge } from '@payload-config/components/ui/OcupacionBadge'

const meta = {
  title: 'Akademate/OcupacionBadge',
  component: OcupacionBadge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    plazasOcupadas: 12,
    plazasTotal: 25,
    showBar: false,
  },
  argTypes: {
    plazasOcupadas: { control: { type: 'range', min: 0, max: 30, step: 1 } },
    plazasTotal: { control: { type: 'range', min: 1, max: 30, step: 1 } },
    showBar: { control: 'boolean' },
  },
} satisfies Meta<typeof OcupacionBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LowOccupancy: Story = {
  args: { plazasOcupadas: 5, plazasTotal: 25 },
}

export const MidOccupancy: Story = {
  args: { plazasOcupadas: 14, plazasTotal: 25 },
}

export const HighOccupancy: Story = {
  args: { plazasOcupadas: 22, plazasTotal: 25 },
}

export const Full: Story = {
  args: { plazasOcupadas: 25, plazasTotal: 25 },
}

export const Overbooked: Story = {
  args: { plazasOcupadas: 27, plazasTotal: 25 },
}

export const WithProgressBar: Story = {
  args: { plazasOcupadas: 18, plazasTotal: 25, showBar: true },
}

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">Libre (20%)</span>
        <OcupacionBadge plazasOcupadas={5} plazasTotal={25} showBar />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">Media (56%)</span>
        <OcupacionBadge plazasOcupadas={14} plazasTotal={25} showBar />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">Alta (88%)</span>
        <OcupacionBadge plazasOcupadas={22} plazasTotal={25} showBar />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-muted-foreground">Completo (100%)</span>
        <OcupacionBadge plazasOcupadas={25} plazasTotal={25} showBar />
      </div>
    </div>
  ),
}
