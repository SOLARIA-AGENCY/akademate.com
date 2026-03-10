import type { Meta, StoryObj } from '@storybook/nextjs'
import { ThemeToggle } from '@payload-config/components/ui/ThemeToggle'

const meta = {
  title: 'Akademate/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InNavbar: Story = {
  render: () => (
    <div className="flex items-center gap-2 border rounded-lg px-4 py-2 bg-card">
      <span className="text-sm text-muted-foreground flex-1">Akademate Admin</span>
      <ThemeToggle />
    </div>
  ),
}
