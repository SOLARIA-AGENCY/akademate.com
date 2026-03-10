import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from '@payload-config/components/ui/input'

const meta = {
  title: 'Foundations/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    type: 'text',
    placeholder: 'Buscar alumno por nombre o email...',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="w-[420px]" data-oid="ag.o7j5">
      <Input {...args} data-oid="rt5zw3n" />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'admin@cep.es',
  },
  render: (args) => (
    <div className="w-[420px]" data-oid="0jan3bp">
      <Input {...args} data-oid="t8wf_xk" />
    </div>
  ),
}

export const Password: Story = {
  args: {
    type: 'password',
    value: 'Admin1234!',
  },
  render: (args) => (
    <div className="w-[420px]" data-oid="tns5ll7">
      <Input {...args} data-oid=".d0hpl3" />
    </div>
  ),
}
