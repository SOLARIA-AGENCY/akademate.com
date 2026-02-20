import type { Meta, StoryObj } from '@storybook/nextjs'
import { Plus } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'

const meta = {
  title: 'Foundations/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Guardar cambios',
    variant: 'default',
    size: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Vista previa',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Eliminar curso',
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="h-4 w-4" />
        Nuevo módulo
      </>
    ),
  },
}

export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Añadir',
    children: <Plus className="h-4 w-4" />,
  },
}
