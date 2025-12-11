import type { CollectionConfig } from 'payload';

/**
 * EntidadesFinanciadoras Collection
 *
 * Organizations that provide funding for courses (grants, subsidies, scholarships).
 * Examples: FUNDAE, SEPE, FSE, Ministerios, etc.
 *
 * Database: PostgreSQL table 'entidades_financiadoras'
 *
 * Key Features:
 * - Unique codigo for identification
 * - Logo upload to MinIO/S3
 * - Type classification (publica, privada, europea, autonomica)
 * - URL to official website
 *
 * Relationships:
 * - Many-to-Many: EntidadFinanciadora ↔ Courses (via curso_subvenciones)
 *
 * Access Control:
 * - Read: Public (for frontend display)
 * - Create/Update/Delete: Admin, Gestor
 */
export const EntidadesFinanciadoras: CollectionConfig = {
  slug: 'entidades-financiadoras',

  labels: {
    singular: 'Entidad Financiadora',
    plural: 'Entidades Financiadoras',
  },

  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'codigo', 'tipo_subvencion', 'activo'],
    group: 'Configuración',
    description: 'Entidades que financian cursos (subvenciones, becas)',
  },

  /**
   * Access control
   */
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
  },

  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Nombre completo de la entidad (ej: FUNDAE, SEPE)',
      },
    },

    {
      name: 'codigo',
      type: 'text',
      required: true,
      unique: true,
      maxLength: 50,
      admin: {
        description: 'Código único identificador (ej: fundae, sepe, fse)',
      },
    },

    {
      name: 'descripcion',
      type: 'textarea',
      maxLength: 500,
      admin: {
        description: 'Descripción de la entidad y sus programas',
      },
    },

    {
      name: 'logo_url',
      type: 'text',
      admin: {
        description: 'URL del logo (subido a MinIO/S3)',
      },
    },

    {
      name: 'tipo_subvencion',
      type: 'select',
      required: true,
      defaultValue: 'publica',
      options: [
        {
          label: 'Pública',
          value: 'publica',
        },
        {
          label: 'Privada',
          value: 'privada',
        },
        {
          label: 'Europea',
          value: 'europea',
        },
        {
          label: 'Autonómica',
          value: 'autonomica',
        },
      ],
      admin: {
        description: 'Tipo de subvención que ofrece',
      },
    },

    {
      name: 'url_oficial',
      type: 'text',
      admin: {
        description: 'URL del sitio web oficial',
      },
      validate: (val: string | undefined) => {
        if (!val) return true; // Optional
        try {
          new URL(val);
          return true;
        } catch {
          return 'Debe ser una URL válida (ej: https://www.fundae.es)';
        }
      },
    },

    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Entidades inactivas no aparecen en formularios',
      },
    },

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user) {
              return req.user.id;
            }
            return value;
          },
        ],
      },
    },
  ],
};
