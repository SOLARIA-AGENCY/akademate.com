import type { Meta, StoryObj } from '@storybook/nextjs'
import { Alert, AlertTitle, AlertDescription } from '@payload-config/components/ui/alert'
import { Terminal, AlertCircle, CheckCircle2, Info } from 'lucide-react'

const meta = {
  title: 'Foundations/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Actualización completada</AlertTitle>
      <AlertDescription>
        Los datos del curso han sido guardados correctamente.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  args: { variant: 'destructive' },
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error al guardar</AlertTitle>
      <AlertDescription>
        No se pudo actualizar la información del alumno. Verifica los campos e inténtalo nuevamente.
      </AlertDescription>
    </Alert>
  ),
}

export const WithoutIcon: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTitle>Aviso del sistema</AlertTitle>
      <AlertDescription>
        El mantenimiento programado será el domingo 15 de marzo de 2:00 a 4:00 AM.
      </AlertDescription>
    </Alert>
  ),
}

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Alumno inscrito exitosamente</AlertTitle>
    </Alert>
  ),
}

export const InfoContext: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <Info className="h-4 w-4" />
      <AlertTitle>Capacidad del curso</AlertTitle>
      <AlertDescription>
        Este curso tiene cupo para 25 alumnos. Actualmente hay 22 inscritos (88% de ocupación).
      </AlertDescription>
    </Alert>
  ),
}
