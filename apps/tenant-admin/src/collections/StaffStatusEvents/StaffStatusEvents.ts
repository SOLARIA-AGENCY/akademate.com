import type { CollectionConfig } from 'payload'
import { canEditStaff, canManageStaff } from '../Staff/access'

export const StaffStatusEvents: CollectionConfig = {
  slug: 'staff-status-events',
  labels: {
    singular: 'Evento de estado de personal',
    plural: 'Eventos de estado de personal',
  },
  admin: {
    useAsTitle: 'reason',
    group: 'Personal',
    defaultColumns: ['staff', 'previous_status', 'new_status', 'source', 'changed_at'],
    description: 'Historial de altas, bajas, reactivaciones y cambios laborales del personal.',
  },
  access: {
    create: canEditStaff,
    read: canEditStaff,
    update: canManageStaff,
    delete: canManageStaff,
  },
  fields: [
    {
      name: 'staff',
      type: 'relationship',
      relationTo: 'staff',
      required: true,
      index: true,
    },
    {
      name: 'previous_status',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Baja Temporal', value: 'temporary_leave' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'No existía', value: 'created' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'new_status',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Baja Temporal', value: 'temporary_leave' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'Creado', value: 'created' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'reason',
      type: 'textarea',
      required: true,
      admin: { rows: 2 },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      index: true,
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Importación Excel', value: 'excel_import' },
        { label: 'Auditoría', value: 'audit' },
        { label: 'Sistema', value: 'system' },
      ],
    },
    {
      name: 'import_batch',
      type: 'text',
      index: true,
    },
    {
      name: 'changed_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
    },
    {
      name: 'changed_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { rows: 2 },
    },
  ],
  timestamps: true,
}

