import type { Meta, StoryObj } from '@storybook/nextjs'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { BookOpen, Users, Search, CalendarX, FileX, Inbox } from 'lucide-react'

const meta = {
  title: 'Akademate/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    icon: BookOpen,
    title: 'No hay cursos disponibles',
    description: 'Comienza creando tu primer curso para que aparezca aquí.',
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAction: Story = {
  args: {
    icon: BookOpen,
    title: 'No hay cursos disponibles',
    description: 'Crea tu primer curso y empieza a gestionar alumnos e inscripciones.',
    action: {
      label: 'Crear primer curso',
      onClick: () => {},
    },
  },
}

export const NoCourses: Story = {
  args: {
    icon: BookOpen,
    title: 'Sin cursos en esta categoría',
    description: 'No se encontraron cursos con los filtros seleccionados.',
    action: {
      label: 'Limpiar filtros',
      onClick: () => {},
    },
  },
}

export const NoStudents: Story = {
  args: {
    icon: Users,
    title: 'No hay alumnos inscritos',
    description: 'Este curso no tiene alumnos todavía. Las inscripciones están abiertas.',
  },
}

export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: 'Sin resultados',
    description: 'No encontramos resultados para tu búsqueda. Intenta con otros términos.',
    action: {
      label: 'Borrar búsqueda',
      onClick: () => {},
    },
  },
}

export const NoCalendarEvents: Story = {
  args: {
    icon: CalendarX,
    title: 'Sin clases programadas',
    description: 'No hay clases programadas para este período. Puedes añadir clases manualmente.',
    action: {
      label: 'Programar clase',
      onClick: () => {},
    },
  },
}

export const NoDocuments: Story = {
  args: {
    icon: FileX,
    title: 'Sin documentos adjuntos',
    description: 'Este alumno no tiene documentos de matrícula. Sube los documentos requeridos.',
    action: {
      label: 'Subir documento',
      onClick: () => {},
    },
  },
}

export const EmptyInbox: Story = {
  args: {
    icon: Inbox,
    title: 'Bandeja vacía',
    description: 'No tienes notificaciones pendientes. Todo está al día.',
  },
}
