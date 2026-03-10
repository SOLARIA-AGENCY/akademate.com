import type { CollectionConfig } from 'payload';
import { canManageClassrooms } from './access/canManageClassrooms';
import { classroomSchema, formatValidationErrors } from './Classrooms.validation';
import { tenantField } from '../../access/tenantAccess';

/**
 * Classrooms Collection
 *
 * Represents physical classrooms/rooms within a campus where courses take place.
 * Each classroom belongs to a campus and has capacity and resource information.
 *
 * Database: PostgreSQL table 'classrooms'
 * Access Control:
 * - Read: Public
 * - Create/Update/Delete: Gestor role and above
 */
export const Classrooms: CollectionConfig = {
  slug: 'classrooms',
  labels: {
    singular: 'Aula',
    plural: 'Aulas',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'campus', 'capacity', 'is_active'],
    group: 'Academic',
    description: 'Aulas y salas disponibles en cada sede',
  },
  access: {
    read: () => true,
    create: canManageClassrooms,
    update: canManageClassrooms,
    delete: canManageClassrooms,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Código único del aula (ej: A-101, LAB-02)',
        placeholder: 'A-101',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El código del aula es obligatorio';
        const trimmed = val.trim();
        if (trimmed.length < 2) return 'El código debe tener al menos 2 caracteres';
        if (trimmed.length > 20) return 'El código debe tener menos de 20 caracteres';
        return true;
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nombre descriptivo del aula (ej: Aula Principal, Laboratorio Informática)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El nombre del aula es obligatorio';
        const trimmed = val.trim();
        if (trimmed.length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (trimmed.length > 100) return 'El nombre debe tener menos de 100 caracteres';
        return true;
      },
    },
    {
      name: 'capacity',
      type: 'number',
      required: true,
      min: 1,
      max: 500,
      admin: {
        description: 'Capacidad máxima de alumnos',
        placeholder: '20',
      },
      validate: (val: number | undefined) => {
        if (val === undefined || val === null) return 'La capacidad es obligatoria';
        if (val < 1) return 'La capacidad debe ser al menos 1';
        if (val > 500) return 'La capacidad no puede superar 500';
        return true;
      },
    },
    {
      name: 'floor',
      type: 'number',
      admin: {
        description: 'Planta del edificio (0 = planta baja, -1 = sótano)',
        placeholder: '0',
      },
    },
    {
      name: 'resources',
      type: 'select',
      hasMany: true,
      admin: {
        description: 'Recursos disponibles en el aula',
      },
      options: [
        { label: 'Proyector', value: 'projector' },
        { label: 'Pizarra Digital', value: 'whiteboard' },
        { label: 'Ordenadores', value: 'computers' },
        { label: 'Laboratorio', value: 'lab' },
        { label: 'Sistema AV', value: 'av' },
        { label: 'Aire Acondicionado', value: 'ac' },
        { label: 'Conexión WiFi', value: 'wifi' },
      ],
    },
    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      required: true,
      index: true,
      admin: {
        description: 'Sede a la que pertenece este aula',
      },
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Si el aula está disponible para asignación',
        position: 'sidebar',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Notas adicionales sobre el aula',
        rows: 3,
      },
    },
    tenantField,
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        const typedData = data as Record<string, unknown> | undefined;
        if (!typedData) return typedData;

        // Trim code and name
        if (typeof typedData.code === 'string') {
          typedData.code = typedData.code.trim().toUpperCase();
        }
        if (typeof typedData.name === 'string') {
          typedData.name = typedData.name.trim();
        }

        // Validate with Zod
        const result = classroomSchema.safeParse(typedData);
        if (!result.success) {
          const errors = formatValidationErrors(result.error);
          console.error('Classroom validation failed:', errors);
        }

        return typedData;
      },
    ],
  },
  timestamps: true,
  defaultSort: 'code',
};
