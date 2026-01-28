import type { CollectionConfig } from 'payload';

/**
 * Type definitions for Lessons collection
 */
type UserRole = 'superadmin' | 'admin' | 'gestor' | 'marketing' | 'asesor' | 'lectura';

/** User with role for access control */
interface UserWithRole {
  id: string | number;
  role: UserRole;
}

/** Type guard to check if user has a valid role */
function hasRole(user: unknown): user is UserWithRole {
  return (
    typeof user === 'object' &&
    user !== null &&
    'role' in user &&
    typeof (user as UserWithRole).role === 'string'
  );
}

/** Check if user has one of the allowed roles */
function isAllowedRole(user: unknown, roles: UserRole[]): boolean {
  return hasRole(user) && roles.includes(user.role);
}

/** Lesson type options */
type LessonType = 'video' | 'text' | 'quiz' | 'assignment' | 'interactive' | 'live';

/** Data structure for admin condition functions */
interface LessonData {
  title?: string;
  slug?: string;
  lesson_type?: LessonType;
  module?: string | number;
  content?: unknown;
  video_url?: string;
  video_duration_seconds?: number;
  quiz_data?: unknown;
  assignment_instructions?: unknown;
  order?: number;
  is_published?: boolean;
  is_free_preview?: boolean;
  unlock_date?: string;
  requires_completion?: boolean;
  passing_score?: number;
  estimated_duration_minutes?: number;
  created_by?: string | number;
  id?: string | number;
}

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
      return isAllowedRole(user, ['admin', 'gestor']);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return isAllowedRole(user, ['admin', 'gestor']);
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return isAllowedRole(user, ['admin', 'gestor']);
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
      relationTo: 'modules',
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
        condition: (data: LessonData) => data.lesson_type === 'video',
      },
    },

    {
      name: 'video_duration_seconds',
      type: 'number',
      min: 0,
      admin: {
        description: 'Video duration in seconds',
        condition: (data: LessonData) => data.lesson_type === 'video',
      },
    },

    {
      name: 'quiz_data',
      type: 'json',
      admin: {
        description: 'Quiz questions and answers (JSON format)',
        condition: (data: LessonData) => data.lesson_type === 'quiz',
      },
    },

    {
      name: 'assignment_instructions',
      type: 'richText',
      admin: {
        description: 'Assignment instructions and requirements',
        condition: (data: LessonData) => data.lesson_type === 'assignment',
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
        condition: (data: LessonData) => data.lesson_type === 'quiz',
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
      ({ data, req }): LessonData | undefined => {
        const typedData = data as LessonData | undefined;
        if (!typedData) return typedData;

        if (req.user && !typedData.created_by && !typedData.id) {
          typedData.created_by = (req.user as UserWithRole).id;
        }

        if (typedData.title && !typedData.slug) {
          typedData.slug = typedData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        return typedData;
      },
    ],
  },

  timestamps: true,
  defaultSort: 'order',
};
