import type { Meta, StoryObj } from '@storybook/nextjs'
import { CourseTemplateCard } from '@payload-config/components/ui/CourseTemplateCard'
import type { PlantillaCurso } from '@/types'

const mockCourse: PlantillaCurso = {
  id: '1',
  nombre: 'Desarrollo Web Full-Stack',
  descripcion:
    'Aprende a construir aplicaciones web modernas con React, Node.js y bases de datos relacionales. Incluye proyectos prácticos con metodologías ágiles.',
  imagenPortada: '/placeholder-course.svg',
  area: 'Desarrollo',
  tipo: 'privados',
  duracionReferencia: 180,
  precioReferencia: 299,
  objetivos: ['Desarrollar aplicaciones web completas', 'Implementar APIs REST'],
  contenidos: ['HTML/CSS/JavaScript', 'React', 'Node.js', 'PostgreSQL'],
  totalConvocatorias: 3,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
}

const meta = {
  title: 'Akademate/CourseTemplateCard',
  component: CourseTemplateCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    template: mockCourse,
    onClick: () => {},
  },
} satisfies Meta<typeof CourseTemplateCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Privado: Story = {
  args: {
    template: { ...mockCourse, tipo: 'privados', area: 'Desarrollo' },
  },
}

export const Ocupados: Story = {
  args: {
    template: {
      ...mockCourse,
      nombre: 'Certificado de Profesionalidad — Atención al Cliente',
      descripcion: 'Formación subvencionada para trabajadores en activo. Certifica competencias de atención al cliente en entornos empresariales.',
      tipo: 'ocupados',
      area: 'Gestión',
      duracionReferencia: 60,
      totalConvocatorias: 5,
    },
  },
}

export const Desempleados: Story = {
  args: {
    template: {
      ...mockCourse,
      nombre: 'Diseño Gráfico e Identidad Visual',
      descripcion: 'Curso gratuito para desempleados. Aprende las herramientas de diseño más utilizadas en el mercado laboral.',
      tipo: 'desempleados',
      area: 'Diseño',
      duracionReferencia: 120,
      totalConvocatorias: 2,
    },
  },
}

export const Teleformacion: Story = {
  args: {
    template: {
      ...mockCourse,
      nombre: 'Marketing Digital y Redes Sociales',
      descripcion: 'Formación 100% online. Gestiona campañas publicitarias, analiza métricas y construye presencia de marca en redes sociales.',
      tipo: 'teleformacion',
      area: 'Marketing',
      duracionReferencia: 90,
      totalConvocatorias: 8,
    },
  },
}

export const Grid: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-4xl">
      <CourseTemplateCard
        template={{ ...mockCourse, tipo: 'privados', nombre: 'Desarrollo Web Full-Stack', area: 'Desarrollo', totalConvocatorias: 3 }}
        onClick={() => {}}
      />
      <CourseTemplateCard
        template={{ ...mockCourse, tipo: 'ocupados', nombre: 'Atención al Cliente', area: 'Gestión', duracionReferencia: 60, totalConvocatorias: 5 }}
        onClick={() => {}}
      />
      <CourseTemplateCard
        template={{ ...mockCourse, tipo: 'teleformacion', nombre: 'Marketing Digital', area: 'Marketing', duracionReferencia: 90, totalConvocatorias: 8 }}
        onClick={() => {}}
      />
    </div>
  ),
}
