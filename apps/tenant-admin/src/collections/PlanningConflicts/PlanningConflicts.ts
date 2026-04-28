import type { CollectionConfig } from 'payload';
import { tenantField } from '../../access/tenantAccess';

export const PlanningConflicts: CollectionConfig = {
  slug: 'planning-conflicts',
  labels: {
    singular: 'Conflicto de planificación',
    plural: 'Conflictos de planificación',
  },
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['course_run', 'type', 'severity', 'status', 'detected_at'],
    group: 'Academic',
    description: 'Conflictos y alertas detectados por el motor de planificación',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: ({ req: { user } }) => !!user && ['admin', 'gestor'].includes(user.role),
    update: ({ req: { user } }) => !!user && ['admin', 'gestor'].includes(user.role),
    delete: ({ req: { user } }) => !!user && ['admin', 'gestor'].includes(user.role),
  },
  fields: [
    {
      name: 'course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      required: true,
      index: true,
      admin: {
        description: 'Convocatoria afectada',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Solape de aula', value: 'classroom_overlap' },
        { label: 'Solape de docente', value: 'instructor_overlap' },
        { label: 'Regla de uso de aula', value: 'room_usage_policy' },
        { label: 'Regla CEP Norte aula privados', value: 'cep_norte_private_room' },
        { label: 'Regla CEP Norte aulas FPED', value: 'cep_norte_fped_room' },
        { label: 'Capacidad de aula excedida', value: 'room_capacity_exceeded' },
        { label: 'Capacidad de convocatoria excedida', value: 'capacity_exceeded' },
        { label: 'Fecha incoherente', value: 'invalid_dates' },
        { label: 'Otro', value: 'other' },
      ],
    },
    {
      name: 'severity',
      type: 'select',
      required: true,
      defaultValue: 'warning',
      index: true,
      options: [
        { label: 'Bloqueante', value: 'blocker' },
        { label: 'Alerta', value: 'warning' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      options: [
        { label: 'Abierto', value: 'open' },
        { label: 'Resuelto', value: 'resolved' },
        { label: 'Ignorado', value: 'ignored' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        rows: 2,
      },
    },
    {
      name: 'detected_at',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      index: true,
      admin: {
        date: { displayFormat: 'yyyy-MM-dd HH:mm:ss' },
      },
    },
    {
      name: 'resolved_at',
      type: 'date',
      admin: {
        date: { displayFormat: 'yyyy-MM-dd HH:mm:ss' },
      },
    },
    tenantField,
  ],
  timestamps: true,
};
