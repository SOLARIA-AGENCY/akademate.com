import type { CollectionConfig } from 'payload'

export const CourseTypes: CollectionConfig = {
  slug: 'course-types',
  labels: { singular: 'Tipo de Estudio', plural: 'Tipos de Estudio' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'color', 'active'],
    group: 'Sistema',
    description: 'Tipos de curso por audiencia (Desempleados, Ocupados, Teleformacion)',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user && ['admin', 'gestor', 'superadmin'].includes(user.role),
    update: ({ req: { user } }) => !!user && ['admin', 'gestor', 'superadmin'].includes(user.role),
    delete: ({ req: { user } }) => !!user && ['admin', 'gestor', 'superadmin'].includes(user.role),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nombre del tipo (ej: Desempleados, Ocupados, Teleformacion)',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 4,
      admin: {
        description: 'Codigo unico (3-4 letras, ej: DES, OCU, TEL)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Codigo requerido'
        if (!/^[A-Z]{3,4}$/.test(val)) return 'Debe ser 3-4 letras mayusculas'
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Descripcion del tipo',
        rows: 2,
      },
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: '#3B82F6',
      admin: {
        description: 'Color para el borde de card (hex)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Color requerido'
        if (!/^#[0-9A-Fa-f]{6}$/.test(val)) return 'Formato hex invalido'
        return true
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
  defaultSort: 'name',
}
