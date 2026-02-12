import type { CollectionConfig } from 'payload';

/**
 * Lessons Collection - Individual Learning Units
 *
 * Lessons are the smallest learning units within a module.
 * They contain the actual content (video, text, quiz) that students consume.
 *
 * Database: PostgreSQL table 'lessons'
 *
 * Key Features:
 * - Belongs to a Module
 * - Multiple content types: video, text, quiz, assignment
 * - Progress tracking via LessonProgress
 * - Support for materials/attachments
 *
 * Relationships:
 * - Many-to-One: Lesson -> Module (required)
 * - One-to-Many: Lesson -> LessonProgress
 * - One-to-Many: Lesson -> Materials
 *
 * Access Control:
 * - Read: Authenticated users (enrolled in course)
 * - Create/Update/Delete: Admin, Gestor
 */
export const Lessons: CollectionConfig = {
  slug: 'lessons',

  labels: {
    singular: 'Lesson',
    plural: 'Lessons',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'lesson_type', 'order', 'is_published'],
    group: 'LMS',
    description: 'Individual learning units within modules',
  },

  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
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
        description: 'Lesson title (max 255 characters)',
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier',
      },
    },

    {
      name: 'lesson_type',
      type: 'select',
      required: true,
      defaultValue: 'video',
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Text/Reading', value: 'text' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Interactive', value: 'interactive' },
        { label: 'Live Session', value: 'live' },
      ],
      admin: {
        description: 'Type of lesson content',
        position: 'sidebar',
      },
    },

    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules' as string,
      required: true,
      index: true,
      admin: {
        description: 'The module this lesson belongs to',
      },
    },

    // ============================================================================
    // CONTENT
    // ============================================================================

    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Main lesson content (for text/reading type lessons)',
      },
    },

    {
      name: 'video_url',
      type: 'text',
      admin: {
        description: 'Video URL (YouTube, Vimeo, or direct link)',
        condition: (data: any) => data.lesson_type === 'video',
      },
    },

    {
      name: 'video_duration_seconds',
      type: 'number',
      min: 0,
      admin: {
        description: 'Video duration in seconds',
        condition: (data: any) => data.lesson_type === 'video',
      },
    },

    {
      name: 'quiz_data',
      type: 'json',
      admin: {
        description: 'Quiz questions and answers (JSON format)',
        condition: (data: any) => data.lesson_type === 'quiz',
      },
    },

    {
      name: 'assignment_instructions',
      type: 'richText',
      admin: {
        description: 'Assignment instructions and requirements',
        condition: (data: any) => data.lesson_type === 'assignment',
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
        description: 'Display order within the module (0 = first)',
        position: 'sidebar',
      },
    },

    {
      name: 'is_published',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Published lessons are visible to students',
        position: 'sidebar',
      },
    },

    {
      name: 'is_free_preview',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow non-enrolled users to preview this lesson',
        position: 'sidebar',
      },
    },

    {
      name: 'unlock_date',
      type: 'date',
      admin: {
        description: 'Optional date when this lesson becomes available',
        position: 'sidebar',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ============================================================================
    // REQUIREMENTS
    // ============================================================================

    {
      name: 'requires_completion',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Must be completed to progress to next lesson',
        position: 'sidebar',
      },
    },

    {
      name: 'passing_score',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Minimum score required to pass (for quizzes)',
        condition: (data: any) => data.lesson_type === 'quiz',
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
        description: 'Estimated time to complete this lesson (in minutes)',
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
        description: 'User who created this lesson',
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

        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
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
