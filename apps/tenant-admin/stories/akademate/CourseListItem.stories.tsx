import type { Meta, StoryObj } from '@storybook/nextjs'
import { CourseListItem } from '@payload-config/components/ui/CourseListItem'
import type { PlantillaCurso } from '@/types'

const mockCourse: PlantillaCurso = {
  id: '1',
  nombre: 'Desarrollo Web Full-Stack',
  descripcion: 'Aprende a construir aplicaciones web modernas con React, Node.js y PostgreSQL.',
  imagenPortada: '/placeholder-course.svg',
  area: 'Desarrollo',
  tipo: 'privados',
  duracionReferencia: 180,
  precioReferencia: 299,
  objetivos: ['Desarrollar aplicaciones web completas'],
  contenidos: ['HTML/CSS/JS', 'React', 'Node.js'],
  totalConvocatorias: 3,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
}

const meta = {
  title: 'Akademate/CourseListItem',
  component: CourseListItem,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    course: mockCourse,
    onClick: () => {},
  },
} satisfies Meta<typeof CourseListItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Privado: Story = {
  args: {
    course: { ...mockCourse, tipo: 'privados', area: 'Desarrollo' },
  },
}

export const Ocupados: Story = {
  args: {
    course: {
      ...mockCourse,
      nombre: 'Gestión Administrativa',
      area: 'Gestión',
      tipo: 'ocupados',
      duracionReferencia: 60,
      totalConvocatorias: 5,
    },
  },
}

export const Desempleados: Story = {
  args: {
    course: {
      ...mockCourse,
      nombre: 'Diseño Gráfico con Adobe Creative Suite',
      area: 'Diseño',
      tipo: 'desempleados',
      duracionReferencia: 120,
      totalConvocatorias: 2,
    },
  },
}

export const Teleformacion: Story = {
  args: {
    course: {
      ...mockCourse,
      nombre: 'Marketing Digital y Analítica Web',
      area: 'Marketing',
      tipo: 'teleformacion',
      duracionReferencia: 90,
      totalConvocatorias: 8,
    },
  },
}

export const List: Story = {
  render: () => (
    <div className="w-full max-w-3xl space-y-2">
      <CourseListItem
        course={{ ...mockCourse, nombre: 'Desarrollo Web Full-Stack', tipo: 'privados', area: 'Desarrollo', duracionReferencia: 180, totalConvocatorias: 3 }}
        onClick={() => {}}
      />
      <CourseListItem
        course={{ ...mockCourse, id: '2', nombre: 'Marketing Digital', tipo: 'teleformacion', area: 'Marketing', duracionReferencia: 90, totalConvocatorias: 8 }}
        onClick={() => {}}
      />
      <CourseListItem
        course={{ ...mockCourse, id: '3', nombre: 'Atención al Cliente', tipo: 'ocupados', area: 'Gestión', duracionReferencia: 60, totalConvocatorias: 5 }}
        onClick={() => {}}
      />
      <CourseListItem
        course={{ ...mockCourse, id: '4', nombre: 'Diseño UX/UI', tipo: 'desempleados', area: 'Diseño', duracionReferencia: 120, totalConvocatorias: 2 }}
        onClick={() => {}}
      />
    </div>
  ),
}
