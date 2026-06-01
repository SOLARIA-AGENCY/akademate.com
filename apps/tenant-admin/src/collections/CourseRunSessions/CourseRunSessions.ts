import type { CollectionConfig } from 'payload';
import { tenantField } from '../../access/tenantAccess';

export const CourseRunSessions: CollectionConfig = {
  slug: 'course-run-sessions',
  labels: {
    singular: 'Sesión de convocatoria',
    plural: 'Sesiones de convocatorias',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['course_run', 'session_date', 'time_start', 'time_end', 'classroom', 'instructor', 'status'],
    group: 'Academic',
    description: 'Clases concretas generadas desde convocatorias para calendario, ocupación y asistencia',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user && ['admin', 'gestor', 'marketing'].includes(user.role),
    update: ({ req: { user } }) => !!user && ['admin', 'gestor'].includes(user.role),
    delete: ({ req: { user } }) => !!user && ['admin', 'gestor'].includes(user.role),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Título legible de la sesión',
      },
    },
    {
      name: 'course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      required: true,
      index: true,
      admin: {
        description: 'Convocatoria origen',
      },
    },
    {
      name: 'session_date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'yyyy-MM-dd' },
      },
    },
    {
      name: 'weekday',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Lunes', value: 'monday' },
        { label: 'Martes', value: 'tuesday' },
        { label: 'Miércoles', value: 'wednesday' },
        { label: 'Jueves', value: 'thursday' },
        { label: 'Viernes', value: 'friday' },
        { label: 'Sábado', value: 'saturday' },
        { label: 'Domingo', value: 'sunday' },
      ],
    },
    {
      name: 'time_start',
      type: 'text',
      required: true,
      admin: {
        description: 'Hora de inicio HH:MM:SS',
      },
    },
    {
      name: 'time_end',
      type: 'text',
      required: true,
      admin: {
        description: 'Hora de fin HH:MM:SS',
      },
    },
    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      index: true,
    },
    {
      name: 'classroom',
      type: 'relationship',
      relationTo: 'classrooms',
      index: true,
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'staff',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      index: true,
      options: [
        { label: 'Programada', value: 'scheduled' },
        { label: 'Realizada', value: 'completed' },
        { label: 'Cancelada', value: 'cancelled' },
        { label: 'Reprogramada', value: 'rescheduled' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { rows: 2 },
    },
    tenantField,
  ],
  timestamps: true,
};
