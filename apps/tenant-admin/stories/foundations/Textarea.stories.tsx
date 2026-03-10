import type { Meta, StoryObj } from '@storybook/nextjs'
import { Textarea } from '@payload-config/components/ui/textarea'
import { Label } from '@payload-config/components/ui/label'

const meta = {
  title: 'Foundations/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    placeholder: 'Escribe aquí...',
    disabled: false,
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Textarea {...args} className="w-80" />,
}

export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Describe el objetivo general del curso...',
  },
  render: (args) => <Textarea {...args} className="w-80" />,
}

export const WithValue: Story = {
  args: {
    defaultValue:
      'Este curso forma a profesionales en el desarrollo de aplicaciones web modernas, cubriendo tanto frontend como backend con tecnologías actuales del ecosistema JavaScript.',
  },
  render: (args) => <Textarea {...args} className="w-80" rows={4} />,
}

export const Disabled: Story = {
  args: {
    defaultValue: 'Contenido no editable en este momento.',
    disabled: true,
  },
  render: (args) => <Textarea {...args} className="w-80" />,
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-80">
      <Label htmlFor="descripcion">Descripción del curso</Label>
      <Textarea
        {...args}
        id="descripcion"
        placeholder="Describe el objetivo y contenido principal del curso..."
        rows={4}
      />
      <p className="text-xs text-muted-foreground">Máximo 500 caracteres.</p>
    </div>
  ),
}

export const Required: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1.5 w-80">
      <Label htmlFor="requisitos">
        Requisitos previos <span className="text-destructive">*</span>
      </Label>
      <Textarea
        {...args}
        id="requisitos"
        placeholder="Ej: Conocimientos básicos de HTML y CSS"
        rows={3}
        required
      />
    </div>
  ),
}
