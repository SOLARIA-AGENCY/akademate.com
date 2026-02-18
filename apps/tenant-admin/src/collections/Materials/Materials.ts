import type { CollectionConfig } from 'payload';

/**
 * Materials Collection - Learning Materials
 *
 * Stores downloadable and viewable learning materials
 * (PDFs, documents, supplementary resources).
 *
 * Database: PostgreSQL table 'materials'
 *
 * Key Features:
 * - Supports multiple file types
 * - Can be attached to modules or lessons
 * - Download tracking
 * - Access control based on enrollment
 *
 * Relationships:
 * - Many-to-One: Material -> Module (optional)
 * - Many-to-One: Material -> Lesson (optional)
 *
 * Access Control:
 * - Read: Enrolled students, Admin, Gestor
 * - Create/Update/Delete: Admin, Gestor
 */
export const Materials: CollectionConfig = {
  slug: 'materials',

  labels: {
    singular: 'Material',
    plural: 'Materials',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'material_type', 'module', 'lesson', 'is_published'],
    group: 'LMS',
    description: 'Learning materials and downloadable resources',
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      // Students can read published materials
      return { is_published: { equals: true } };
    },
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
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 255,
      admin: {
        description: 'Material title',
      },
    },

    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the material',
      },
    },

    {
      name: 'material_type',
      type: 'select',
      required: true,
      options: [
        { label: 'PDF Document', value: 'pdf' },
        { label: 'Word Document', value: 'doc' },
        { label: 'Spreadsheet', value: 'spreadsheet' },
        { label: 'Presentation', value: 'presentation' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Archive (ZIP)', value: 'archive' },
        { label: 'External Link', value: 'link' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Type of material',
        position: 'sidebar',
      },
    },

    // Relationships
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules' as string,
      index: true,
      admin: {
        description: 'Module this material belongs to (optional)',
      },
    },

    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons' as string,
      index: true,
      admin: {
        description: 'Lesson this material belongs to (optional)',
      },
    },

    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      index: true,
      admin: {
        description: 'Course this material belongs to (if not tied to module/lesson)',
      },
    },

    // File content
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Uploaded file',
        condition: (data: any) => data.material_type !== 'link',
      },
    },

    {
      name: 'external_url',
      type: 'text',
      admin: {
        description: 'External URL (for link type materials)',
        condition: (data: any) => data.material_type === 'link',
      },
    },

    // Metadata
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Display order',
        position: 'sidebar',
      },
    },

    {
      name: 'is_published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Published materials are visible to students',
        position: 'sidebar',
      },
    },

    {
      name: 'is_downloadable',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Allow students to download this material',
        position: 'sidebar',
      },
    },

    {
      name: 'download_count',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of downloads',
        readOnly: true,
        position: 'sidebar',
      },
    },

    {
      name: 'file_size_bytes',
      type: 'number',
      min: 0,
      admin: {
        description: 'File size in bytes',
        readOnly: true,
      },
    },

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who uploaded this material',
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        read: () => true,
        update: () => false,
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!data) return data;

        if (req.user && !data.created_by && !data.id) {
          data.created_by = req.user.id;
        }
        return data;
      },
    ],
  },

  timestamps: true,
  defaultSort: 'order',
};
