import type { Meta, StoryObj } from '@storybook/nextjs'
import { Separator } from '@payload-config/components/ui/separator'

const meta = {
  title: 'Foundations/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    orientation: 'horizontal',
  },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <p className="text-sm text-muted-foreground">Sección superior</p>
      <Separator className="my-3" />
      <p className="text-sm text-muted-foreground">Sección inferior</p>
    </div>
  ),
}

export const WithContent: Story = {
  render: () => (
    <div className="w-72 space-y-1">
      <h4 className="text-sm font-medium">Información del curso</h4>
      <p className="text-sm text-muted-foreground">Desarrollo Web Full-Stack</p>
      <Separator className="my-3" />
      <h4 className="text-sm font-medium">Instructor asignado</h4>
      <p className="text-sm text-muted-foreground">María García Rodríguez</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3">
      <span className="text-sm">Cursos</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Alumnos</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Estadísticas</span>
    </div>
  ),
}

export const InBreadcrumb: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-2 text-sm text-muted-foreground">
      <span>Inicio</span>
      <Separator orientation="vertical" />
      <span>Cursos</span>
      <Separator orientation="vertical" />
      <span className="text-foreground">Desarrollo Web</span>
    </div>
  ),
}
