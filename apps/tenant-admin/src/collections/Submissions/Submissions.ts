import type { CollectionConfig } from 'payload';

/**
 * Submissions Collection - Assignment/Quiz Submissions
 *
 * Records student submissions for assignments and quizzes.
 *
 * Database: PostgreSQL table 'submissions'
 *
 * Key Features:
 * - Links to enrollment and lesson
 * - Stores submission content and files
 * - Grading workflow (pending -> reviewed -> graded)
 * - Feedback from instructors
 *
 * Relationships:
 * - Many-to-One: Submission -> Enrollment (required)
 * - Many-to-One: Submission -> Lesson (required)
 *
 * Access Control:
 * - Read: Submission owner, Admin, Gestor
 * - Create: Enrolled students
 * - Update: Submission owner (before grading), Admin, Gestor
 * - Delete: Admin only
 */
export const Submissions: CollectionConfig = {
  slug: 'submissions',

  labels: {
    singular: 'Submission',
    plural: 'Submissions',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['enrollment', 'lesson', 'status', 'score', 'submitted_at'],
    group: 'LMS',
    description: 'Student assignment and quiz submissions',
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      return { 'enrollment.user': { equals: user.id } };
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return true; // Students can submit
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      // Students can update their own pending submissions
      return {
        and: [
          { 'enrollment.user': { equals: user.id } },
          { status: { equals: 'pending' } },
        ],
      };
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments' as string,
      required: true,
      index: true,
      admin: {
        description: 'The enrollment this submission belongs to',
      },
    },

    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons' as string,
      required: true,
      index: true,
      admin: {
        description: 'The lesson this submission is for',
      },
    },

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Graded', value: 'graded' },
        { label: 'Returned for Revision', value: 'returned' },
        { label: 'Resubmitted', value: 'resubmitted' },
      ],
      admin: {
        description: 'Submission status',
        position: 'sidebar',
      },
    },

    {
      name: 'submitted_at',
      type: 'date',
      required: true,
      admin: {
        description: 'When the submission was made',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    // Content
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Submission content (for text-based assignments)',
      },
    },

    {
      name: 'files',
      type: 'array',
      admin: {
        description: 'Uploaded files',
      },
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },

    {
      name: 'quiz_answers',
      type: 'json',
      admin: {
        description: 'Quiz answers (for quiz submissions)',
      },
    },

    // Grading
    {
      name: 'score',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Score (0-100)',
        position: 'sidebar',
      },
    },

    {
      name: 'passed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the submission passed',
        position: 'sidebar',
      },
    },

    {
      name: 'graded_at',
      type: 'date',
      admin: {
        description: 'When the submission was graded',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'graded_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Who graded the submission',
        position: 'sidebar',
      },
    },

    {
      name: 'feedback',
      type: 'richText',
      admin: {
        description: 'Instructor feedback',
      },
    },

    {
      name: 'attempt_number',
      type: 'number',
      defaultValue: 1,
      min: 1,
      admin: {
        description: 'Attempt number',
        position: 'sidebar',
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data;

        if (operation === 'create' && !data.submitted_at) {
          data.submitted_at = new Date().toISOString();
        }
        return data;
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (!data) return data;

        // Auto-set graded_at when score is set
        if (data.score !== undefined && data.score !== null && !data.graded_at) {
          data.graded_at = new Date().toISOString();
          data.status = 'graded';
        }
        return data;
      },
    ],
  },

  timestamps: true,
  defaultSort: '-submitted_at',
};
