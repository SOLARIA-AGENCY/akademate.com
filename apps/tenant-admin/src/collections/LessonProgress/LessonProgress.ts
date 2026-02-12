import type { CollectionConfig } from 'payload';

/**
 * LessonProgress Collection - Student Progress Tracking
 *
 * Tracks individual student progress through lessons within an enrollment.
 * Each record represents a student's interaction with a specific lesson.
 *
 * Database: PostgreSQL table 'lesson_progress'
 *
 * Key Features:
 * - Tracks completion status, time spent, and scores
 * - Supports video position tracking for resume
 * - Quiz/assignment score tracking
 * - Last access timestamps
 *
 * Relationships:
 * - Many-to-One: LessonProgress -> Enrollment (required)
 * - Many-to-One: LessonProgress -> Lesson (required)
 *
 * Unique Constraint: One progress record per enrollment + lesson combination
 *
 * Access Control:
 * - Read: User's own progress, Admin, Gestor
 * - Create/Update: User's own progress, Admin
 * - Delete: Admin only
 */
export const LessonProgress: CollectionConfig = {
  slug: 'lesson-progress',

  labels: {
    singular: 'Lesson Progress',
    plural: 'Lesson Progress Records',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['enrollment', 'lesson', 'isCompleted', 'score', 'timeSpent', 'lastAccessAt'],
    group: 'LMS',
    description: 'Student progress tracking for individual lessons',
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      // Users can read their own progress via enrollment
      return { 'enrollment.user': { equals: user.id } };
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return true; // Progress created automatically as students access lessons
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin'].includes(user.role)) return true;
      // Users can update their own progress
      return { 'enrollment.user': { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.role === 'admin';
    },
  },

  fields: [
    // ============================================================================
    // RELATIONSHIPS
    // ============================================================================

    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments',
      required: true,
      index: true,
      admin: {
        description: 'The enrollment this progress belongs to',
      },
    },

    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons' as string,
      required: true,
      index: true,
      admin: {
        description: 'The lesson being tracked',
      },
    },

    // ============================================================================
    // PROGRESS STATUS
    // ============================================================================

    {
      name: 'isCompleted',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Whether the lesson has been completed',
        position: 'sidebar',
      },
    },

    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'When the lesson was completed',
        position: 'sidebar',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    // ============================================================================
    // TIME TRACKING
    // ============================================================================

    {
      name: 'timeSpent',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total time spent on this lesson (in seconds)',
      },
    },

    {
      name: 'lastAccessAt',
      type: 'date',
      admin: {
        description: 'Last time the student accessed this lesson',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    // ============================================================================
    // VIDEO PROGRESS
    // ============================================================================

    {
      name: 'lastPosition',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Last video position in seconds (for video lessons)',
      },
    },

    {
      name: 'watchedPercentage',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage of video watched (0-100)',
      },
    },

    // ============================================================================
    // QUIZ/ASSIGNMENT TRACKING
    // ============================================================================

    {
      name: 'score',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Score achieved (for quizzes/assignments)',
      },
    },

    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Number of attempts (for quizzes)',
      },
    },

    {
      name: 'passed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the student passed (score >= passing_score)',
        position: 'sidebar',
      },
    },

    {
      name: 'submissionData',
      type: 'json',
      admin: {
        description: 'Submission data (quiz answers, assignment content)',
      },
    },

    // ============================================================================
    // NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Student notes for this lesson',
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;

        // Auto-update lastAccessAt on any change
        data.lastAccessAt = new Date().toISOString();

        // Auto-set completedAt when marked as completed
        if (data.isCompleted && !data.completedAt) {
          data.completedAt = new Date().toISOString();
        }

        return data;
      },
    ],
  },

  timestamps: true,
};
