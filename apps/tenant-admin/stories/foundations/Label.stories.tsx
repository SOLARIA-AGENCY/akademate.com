import type { Meta, StoryObj } from '@storybook/nextjs'
import { Label } from '@payload-config/components/ui/label'
import { Input } from '@payload-config/components/ui/input'

const meta = {
  title: 'Foundations/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Nombre del curso',
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Required: Story = {
  args: {
    children: (
      <>
        Email del alumno <span className="text-destructive">*</span>
      </>
    ),
  },
}

export const WithInput: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label {...args} htmlFor="curso">
        Nombre del curso
      </Label>
      <Input id="curso" placeholder="Ej. Desarrollo Web Full-Stack" />
    </div>
  ),
}

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label {...args} htmlFor="sede" className="opacity-50">
        Sede asignada
      </Label>
      <Input id="sede" placeholder="Sin sede" disabled />
    </div>
  ),
}
