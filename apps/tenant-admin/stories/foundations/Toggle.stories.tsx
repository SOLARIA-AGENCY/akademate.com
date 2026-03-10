import type { Meta, StoryObj } from '@storybook/nextjs'
import { Toggle } from '@payload-config/components/ui/toggle'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Star } from 'lucide-react'

const meta = {
  title: 'Foundations/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Toggle',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline'] },
    size: { control: 'select', options: ['default', 'sm', 'lg'] },
    disabled: { control: 'boolean' },
    pressed: { control: 'boolean' },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Pressed: Story = {
  args: { pressed: true },
}

export const Outline: Story = {
  args: { variant: 'outline' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Toggle aria-label="Negrita">
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Cursiva">
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle aria-label="Subrayado">
        <Underline className="h-4 w-4" />
      </Toggle>
    </div>
  ),
}

export const Toolbar: Story = {
  render: () => (
    <div className="flex gap-1 border rounded-md p-1">
      <Toggle size="sm" aria-label="Alinear izquierda" pressed>
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" aria-label="Centrar">
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" aria-label="Alinear derecha">
        <AlignRight className="h-4 w-4" />
      </Toggle>
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <Toggle aria-label="Destacar">
      <Star className="h-4 w-4" />
      Destacar
    </Toggle>
  ),
}
