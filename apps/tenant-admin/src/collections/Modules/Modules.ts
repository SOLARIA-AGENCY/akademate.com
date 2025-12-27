import type { CollectionConfig } from 'payload';

/**
 * Modules Collection - Course Module Management
 *
 * Modules are structural units within a course that group related lessons.
 * Each course can have multiple modules, and each module can contain
 * multiple lessons.
 *
 * Database: PostgreSQL table 'modules'
 *
 * Key Features:
 * - Belongs to a Course
 * - Ordered sequence within course
 * - Contains multiple Lessons
 * - Progress tracking via LessonProgress
 *
 * Relationships:
 * - Many-to-One: Module -> Course (required)
 * - One-to-Many: Module -> Lessons
 *
 * Access Control:
 * - Read: Authenticated users
 * - Create/Update/Delete: Admin, Gestor
 */
export const Modules: CollectionConfig = {
  slug: 'modules',

  labels: {
    singular: 'Module',
    plural: 'Modules',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course', 'order', 'is_published', 'createdAt'],
    group: 'LMS',
    description: 'Course modules that group related lessons',
  },

  access: {
    read: ({ req: { user } }) => {
      // Authenticated users can read all modules
      if (user) return true;
      // Public can read published modules
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
    // ============================================================================
    // CORE FIELDS
    // ============================================================================

    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 255,
      admin: {
        description: 'Module title (max 255 characters)',
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
      },
    },

    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Module description and learning objectives',
      },
    },

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
      admin: {
        description: 'The course this module belongs to',
      },
    },

    // ============================================================================
    // ORDERING & VISIBILITY
    // ============================================================================

    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Display order within the course (0 = first)',
        position: 'sidebar',
      },
    },

    {
      name: 'is_published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Published modules are visible to students',
        position: 'sidebar',
      },
    },

    {
      name: 'unlock_date',
      type: 'date',
      admin: {
        description: 'Optional date when this module becomes available',
        position: 'sidebar',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ============================================================================
    // METADATA
    // ============================================================================

    {
      name: 'estimated_duration_minutes',
      type: 'number',
      min: 0,
      admin: {
        description: 'Estimated time to complete this module (in minutes)',
        position: 'sidebar',
      },
    },

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'User who created this module',
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

        // Auto-populate created_by on creation
        if (req.user && !data.created_by && !data.id) {
          data.created_by = req.user.id;
        }

        // Auto-generate slug from title
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        return data;
      },
    ],
  },

  timestamps: true,
  defaultSort: 'order',
};
