import type { CollectionConfig } from 'payload';

/**
 * AreasFormativas Collection
 *
 * Represents knowledge areas for course categorization (e.g., Marketing, Development, Design)
 * Used for course code generation and filtering
 *
 * Database: PostgreSQL table 'areas_formativas'
 *
 * Access Control:
 * - Read: Public (anonymous users can view areas)
 * - Create/Update/Delete: Admin and Gestor roles only
 *
 * Key Features:
 * - Unique codigo field (3-4 uppercase letters, e.g., MKT, DEV, DIS)
 * - Color field for UI customization (hex format)
 * - Active/inactive status for soft delete
 * - Used in course code generation: {AREA_CODE}-{TIPO_CODE}-{SEQUENTIAL}
 */
export const AreasFormativas: CollectionConfig = {
  slug: 'areas-formativas',

  labels: {
    singular: 'Área Formativa',
    plural: 'Áreas Formativas',
  },

  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'codigo', 'activo'],
    group: 'Courses',
    description: 'Áreas de conocimiento para categorización de cursos',
  },

  /**
   * Collection-level access control
   */
  access: {
    /**
     * Read: Public access
     */
    read: () => true,

    /**
     * Create: Admin and Gestor only
     */
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },

    /**
     * Update: Admin and Gestor only
     */
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },

    /**
     * Delete: Admin and Gestor only
     */
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
  },

  fields: [
    /**
     * Nombre - Display name of the area
     */
    {
      name: 'nombre',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Nombre del área formativa (ej: Marketing Digital)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El nombre es obligatorio';
        if (val.length < 3) return 'El nombre debe tener al menos 3 caracteres';
        if (val.length > 100) return 'El nombre debe tener máximo 100 caracteres';
        return true;
      },
    },

    /**
     * Codigo - Unique short code for area (used in course codes)
     * Format: 3-4 uppercase letters (e.g., MKT, DEV, DIS, AUD)
     */
    {
      name: 'codigo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 4,
      admin: {
        description: 'Código único (3-4 letras mayúsculas, ej: MKT, DEV)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El código es obligatorio';
        if (!/^[A-Z]{3,4}$/.test(val)) {
          return 'El código debe tener 3-4 letras mayúsculas (ej: MKT)';
        }
        return true;
      },
    },

    /**
     * Descripcion - Detailed description of the area
     */
    {
      name: 'descripcion',
      type: 'textarea',
      admin: {
        description: 'Descripción del área formativa (opcional)',
        rows: 3,
      },
      validate: (val: string | undefined) => {
        if (val && val.length > 500) {
          return 'La descripción debe tener máximo 500 caracteres';
        }
        return true;
      },
    },

    /**
     * Color - Hex color code for UI customization
     */
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Color en formato hexadecimal (ej: #FF5733)',
        position: 'sidebar',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional field
        if (!/^#[0-9A-F]{6}$/i.test(val)) {
          return 'El color debe estar en formato hexadecimal (ej: #FF5733)';
        }
        return true;
      },
    },

    /**
     * Activo - Active/inactive status (soft delete)
     */
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Áreas activas aparecen en el selector de cursos',
      },
    },
  ],

  /**
   * Timestamps - Auto-track creation and update times
   */
  timestamps: true,

  /**
   * Default Sort - Order by name alphabetically
   */
  defaultSort: 'nombre',
};
