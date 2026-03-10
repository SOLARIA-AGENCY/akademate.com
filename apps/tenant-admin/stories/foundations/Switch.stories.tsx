import type { Meta, StoryObj } from '@storybook/nextjs'
import { Switch } from '@payload-config/components/ui/switch'
import { Label } from '@payload-config/components/ui/label'

const meta = {
  title: 'Foundations/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    checked: false,
    disabled: false,
  },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { checked: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledChecked: Story = {
  args: { checked: true, disabled: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="notificaciones" />
      <Label htmlFor="notificaciones">Recibir notificaciones por email</Label>
    </div>
  ),
}

export const WithLabelChecked: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="publicado" defaultChecked />
      <Label htmlFor="publicado">Publicar curso en catálogo</Label>
    </div>
  ),
}

export const FormGroup: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <h4 className="text-sm font-medium">Preferencias de notificación</h4>
      <div className="space-y-3">
        {[
          { id: 'nuevos-alumnos', label: 'Nuevas inscripciones', defaultChecked: true },
          { id: 'pagos', label: 'Confirmaciones de pago', defaultChecked: true },
          { id: 'recordatorios', label: 'Recordatorios de clase', defaultChecked: false },
          { id: 'resumen', label: 'Resumen semanal', defaultChecked: false },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
              {item.label}
            </Label>
            <Switch id={item.id} defaultChecked={item.defaultChecked} />
          </div>
        ))}
      </div>
    </div>
  ),
}
