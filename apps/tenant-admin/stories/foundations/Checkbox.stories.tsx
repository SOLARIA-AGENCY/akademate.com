import type { Meta, StoryObj } from '@storybook/nextjs'
import { Checkbox } from '@payload-config/components/ui/checkbox'
import { Label } from '@payload-config/components/ui/label'

const meta = {
  title: 'Foundations/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: { defaultChecked: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="aceptar" />
      <Label htmlFor="aceptar">Acepto los términos y condiciones</Label>
    </div>
  ),
}

export const FormGroup: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { id: 'dev', label: 'Desarrollo' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'diseno', label: 'Diseño', disabled: true },
        { id: 'gestion', label: 'Gestión' },
        { id: 'idiomas', label: 'Idiomas', defaultChecked: true },
      ].map(({ id, label, disabled, defaultChecked }) => (
        <div key={id} className="flex items-center gap-2">
          <Checkbox id={id} disabled={disabled} defaultChecked={defaultChecked} />
          <Label
            htmlFor={id}
            className={disabled ? 'text-muted-foreground cursor-not-allowed' : ''}
          >
            {label}
          </Label>
        </div>
      ))}
    </div>
  ),
}
