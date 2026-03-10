import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from '@payload-config/components/ui/badge'

const meta = {
  title: 'Foundations/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: {
    children: 'ACTIVO',
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info', 'neutral'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'BORRADOR' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'BLOQUEADO' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'PENDIENTE' },
}

export const Success: Story = {
  args: { variant: 'success', children: 'FINALIZADO' },
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'EN REVISIÓN' },
}

export const Info: Story = {
  args: { variant: 'info', children: 'PLANIFICADO' },
}

export const Neutral: Story = {
  args: { variant: 'neutral', children: 'ARCHIVADO' },
}
